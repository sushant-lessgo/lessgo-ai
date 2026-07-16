import { SignUp } from '@clerk/nextjs';

import { FounderAuthLayout } from '@/components/auth/FounderAuthLayout';
import { authAppearance } from '@/lib/clerkAppearance';

export const metadata = {
  title: 'Lessgo AI — Create your account',
};

export default function SignUpPage() {
  return (
    <FounderAuthLayout
      chipLabel="invite-only · founding cohort"
      promiseTitle="You’re early. That’s the point."
      promiseBody="Founding members get a direct line to me, priority on every feature request, and locked-in early pricing — for good."
    >
      <SignUp appearance={authAppearance} />
    </FounderAuthLayout>
  );
}
