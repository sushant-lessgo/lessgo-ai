import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface LayoutProps {
  children: React.ReactNode;
  params: { token: string };
}

// Universal entry gate (scale-02 phase 5). Mirrors the product wizard layout's
// auth + claim-on-visit idiom (src/app/onboarding/product/[token]/layout.tsx).
// NO persona reads anywhere — the persona gate is dead on this path (D4;
// cutover routes here in phase 6). Static siblings (persona, waitlist,
// product, service) outrank this dynamic [token] segment in App Router
// matching, so existing flows never land here.
export default async function EntryOnboardingLayout({
  children,
  params,
}: LayoutProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Anon → authed claim-on-visit. updateMany is race-safe (WHERE requires
  // userId IS NULL). Same idiom as the product wizard layout.
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
          `[onboarding/entry/${params.token}] Claimed orphan project for user ${dbUser.id}`
        );
      }
    }
  } catch (error) {
    logger.error('[onboarding/entry/layout] claim-on-visit failed:', error);
  }

  // Project-existence check: /api/start is still the creator (D4) — a token
  // with no Project row is a dead link. redirect() throws, so keep it OUTSIDE
  // any try/catch.
  const project = await prisma.project.findUnique({
    where: { tokenId: params.token },
    select: { id: true },
  });

  if (!project) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
