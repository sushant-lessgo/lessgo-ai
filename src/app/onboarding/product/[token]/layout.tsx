import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface LayoutProps {
  children: React.ReactNode;
  params: { token: string };
}

// Product (Meridian) onboarding. Mirrors /create/[token]/layout.tsx — the
// parallel product wizard that replaces the legacy /create flow at the
// Meridian cutover (P4). Same anon→authed claim-on-visit semantics.
export default async function ProductOnboardingLayout({
  children,
  params,
}: LayoutProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Anon → authed claim-on-visit. updateMany is race-safe (WHERE requires
  // userId IS NULL). No auto-rebuild on audienceType mismatch.
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (dbUser?.id && params?.token) {
      const claimed = await prisma.project.updateMany({
        where: { tokenId: params.token, userId: null },
        data: { userId: dbUser.id },
      });

      if (claimed.count > 0) {
        logger.info(
          `[onboarding/product/${params.token}] Claimed orphan project for user ${dbUser.id}`
        );
      }
    }
  } catch (error) {
    logger.error('[onboarding/product/layout] claim-on-visit failed:', error);
  }

  return <>{children}</>;
}
