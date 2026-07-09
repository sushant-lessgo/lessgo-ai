// scale-06 phase 10 — redirect stub.
// The old service onboarding wizard fork was deleted; every engine now goes
// through the unified wizard at /onboarding/[token]. This preserves any old
// bookmarks / in-flight links (`/onboarding/service/abc` → `/onboarding/abc`).

import { redirect } from 'next/navigation';

export default function ServiceOnboardingRedirect({
  params,
}: {
  params: { token: string };
}) {
  redirect(`/onboarding/${params.token}`);
}
