import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface LayoutProps {
  children: React.ReactNode;
  params: { token: string };
}

// scale-02 phase 6: persona gate + pilot allowlist removed — routing into
// this wizard is decided by the universal entry's serve gate, which writes
// Project.audienceType at confirm. Persona may be null for self-serve users.
export default async function ServiceOnboardingLayout({
  children,
  params,
}: LayoutProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
    select: { id: true },
  });

  // Soft guard keyed on the PROJECT (not persona): a bookmarked service-wizard
  // URL pointing at a product project bounces to the product wizard. Anything
  // else (service / null / missing project) passes through.
  if (params?.token) {
    const project = await prisma.project.findUnique({
      where: { tokenId: params.token },
      select: { audienceType: true },
    });
    if (project?.audienceType === 'product') {
      redirect(`/onboarding/product/${params.token}`);
    }
  }

  // Anon → authed claim-on-visit (mirror of /create/[token]/layout.tsx).
  // updateMany is race-safe: a second tab racing this returns count=0
  // because the WHERE requires userId IS NULL.
  try {
    if (params?.token) {
      const claimed = await prisma.project.updateMany({
        where: { tokenId: params.token, userId: null },
        data: { userId: dbUser.id },
      });

      if (claimed.count > 0) {
        logger.info(
          `[onboarding/service/${params.token}] Claimed orphan project for user ${dbUser.id}`
        );
      }
    }
  } catch (error) {
    logger.error('[onboarding/service/layout] claim-on-visit failed:', error);
  }

  return <>{children}</>;
}
