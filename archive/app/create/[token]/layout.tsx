import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface LayoutProps {
  children: React.ReactNode;
  params: { token: string };
}

export default async function CreateLayout({ children, params }: LayoutProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Anon → authed claim-on-visit. If the Project for this token has userId=null
  // and the current authed user has a User row, claim ownership atomically.
  // updateMany is race-safe: a second tab racing this call returns count=0
  // because the WHERE clause requires userId IS NULL. We do NOT auto-rebuild
  // on audienceType mismatch — cross-pivot conversion is deferred post-launch
  // (resolution #13). Note: PublishedPage.userId is a Clerk-ID string, not an
  // FK, so claiming Project does not auto-claim publishes.
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
          `[create/${params.token}] Claimed orphan project for user ${dbUser.id}`
        );
      }
    }
  } catch (error) {
    logger.error('[create/layout] claim-on-visit failed:', error);
    // Don't block render; user can still edit their project.
  }

  return <>{children}</>;
}
