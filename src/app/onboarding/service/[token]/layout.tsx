import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { personaToAudienceType, type UserPersona } from '@/types/service';

interface LayoutProps {
  children: React.ReactNode;
  params: { token: string };
}

// Phase 8: agency + consultant + coach reach the service wizard. The remaining
// service personas (freelancer, local-service, productized-service) still hit the
// waitlist gate via /api/start. This guard also catches direct-URL access
// (someone bookmarking a wizard URL after a persona change, etc).
const PILOT_SERVICE_PERSONAS: ReadonlySet<UserPersona> = new Set([
  'agency',
  'consultant',
  'coach',
]);

export default async function ServiceOnboardingLayout({
  children,
  params,
}: LayoutProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, persona: true },
  });

  // No persona → bounce to persona prompt with hand-back via /api/start.
  if (!dbUser?.persona) {
    redirect('/onboarding/persona?next=/api/start');
  }

  const persona = dbUser.persona as UserPersona;
  const audienceType = personaToAudienceType(persona);

  // Wrong audienceType (saas-founder / indie-maker) → product flow.
  if (audienceType !== 'service') {
    redirect(`/onboarding/product/${params.token}`);
  }

  // Service persona, but not pilot-eligible → waitlist gate.
  if (!PILOT_SERVICE_PERSONAS.has(persona)) {
    redirect('/onboarding/waitlist');
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
