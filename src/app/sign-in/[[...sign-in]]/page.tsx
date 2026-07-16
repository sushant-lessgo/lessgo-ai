import { SignIn } from '@clerk/nextjs';

import { FounderAuthLayout } from '@/components/auth/FounderAuthLayout';
import { authAppearance } from '@/lib/clerkAppearance';

export const metadata = {
  title: 'Lessgo AI — Sign in',
};

export default function SignInPage() {
  return (
    <FounderAuthLayout
      chipLabel="founding cohort"
      promiseTitle="Glad you’re back. Let’s ship something today."
    >
      <SignIn appearance={authAppearance} />
    </FounderAuthLayout>
  );
}
