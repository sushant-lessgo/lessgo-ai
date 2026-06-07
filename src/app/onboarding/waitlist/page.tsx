import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { personaToAudienceType, userPersonaLabels, type UserPersona } from '@/types/service';
import Logo from '@/components/shared/Logo';
import WaitlistForm from './WaitlistForm';

export default async function WaitlistPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { persona: true },
  });

  // No persona yet — bounce back to persona prompt.
  if (!user?.persona) {
    redirect('/onboarding/persona?next=/api/start');
  }

  const persona = user.persona as UserPersona;
  const audienceType = personaToAudienceType(persona);

  // Defensive: if user is product or pilot-eligible (agency), they shouldn't
  // be here. Bounce to dashboard.
  if (audienceType !== 'service' || persona === 'agency') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center">
          <Logo size={80} />
        </div>
      </div>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              We&apos;re rolling out for {userPersonaLabels[persona]} soon
            </h1>
            <p className="text-gray-600 mt-2 mb-6">
              The pilot is live for agencies first. Drop your email and
              we&apos;ll notify you the moment your persona is enabled.
            </p>
            <WaitlistForm persona={persona} />
          </div>
        </div>
      </div>
    </div>
  );
}
