import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Header from '@/components/dashboard/Header';
import Footer from '@/components/shared/Footer';
import PersonaPrompt from '@/components/onboarding/PersonaPrompt';
import type { UserPersona } from '@/types/service';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { persona: true },
  });

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-text font-body">
      <Header />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-heading2 font-heading text-landing-textPrimary mb-2">
          Account settings
        </h1>
        <p className="text-brand-mutedText mb-8">
          Update what you do. We'll tailor what we build for you.
        </p>

        <PersonaPrompt
          embedded
          initialPersona={(user?.persona as UserPersona) ?? null}
          next="/dashboard/settings"
          heading="What do you do?"
          subheading="Pick the option that fits best. You can change this later."
        />
      </main>
      <Footer />
    </div>
  );
}
