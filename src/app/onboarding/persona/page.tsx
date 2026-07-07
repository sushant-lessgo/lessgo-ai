import { redirect } from 'next/navigation';

// Replaced by the scale-02 router: the persona gate is gone — entry is the
// universal /onboarding/[token] serve gate. Persona editing survives in
// /dashboard/settings (PersonaPrompt). This route stays as a redirect for
// old bookmarks/links.
export default function PersonaOnboardingPage() {
  redirect('/dashboard');
}
