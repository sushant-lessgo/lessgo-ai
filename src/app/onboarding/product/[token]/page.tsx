// scale-06 phase 10 — redirect stub.
// The old product onboarding wizard fork was deleted; every engine now goes
// through the unified wizard at /onboarding/[token]. This preserves any old
// bookmarks / in-flight links (`/onboarding/product/abc` → `/onboarding/abc`)
// and drops the former `?template=` whitelist + persona→vestria + resume→vestria
// branches with it.

import { redirect } from 'next/navigation';

export default function ProductOnboardingRedirect({
  params,
}: {
  params: { token: string };
}) {
  redirect(`/onboarding/${params.token}`);
}
