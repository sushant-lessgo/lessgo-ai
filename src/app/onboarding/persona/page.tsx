import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PersonaPrompt from '@/components/onboarding/PersonaPrompt';

interface PageProps {
  searchParams: { next?: string };
}

export default async function PersonaOnboardingPage({ searchParams }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
    select: { persona: true },
  });

  const next = searchParams?.next || '/dashboard';

  // If persona already set, nothing to ask — bounce to next.
  if (user.persona) {
    redirect(next);
  }

  return <PersonaPrompt next={next} />;
}
