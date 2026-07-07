import { redirect } from 'next/navigation';

// Replaced by the scale-02 router: the pilot waitlist is gone — every user
// goes through the universal /onboarding/[token] entry (serve gate handles
// manual-onboard capture). Redirect kept for old bookmarks/links.
export default function WaitlistPage() {
  redirect('/dashboard');
}
