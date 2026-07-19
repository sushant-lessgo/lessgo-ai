import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserProfile } from '@clerk/nextjs';
import { profileAppearance } from '@/lib/clerkAppearance';

/**
 * Account settings (`/dashboard/settings`) — Lessgo AI.
 *
 * Renders Clerk's managed <UserProfile/> as plain content inside the dashboard
 * shell (src/app/dashboard/layout.tsx already supplies `.app-chrome` + sidebar +
 * top bar + <main>). Clerk owns every account flow; this page adds no chrome.
 *
 * Server component: the `auth()` guard runs server-side; <UserProfile/> is a
 * Clerk client component that hydrates beneath it (do NOT add 'use client').
 */
export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="px-[26px] pb-[26px] pt-[22px]">
      <div className="mb-6">
        <h1 className="font-app-sans text-2xl font-bold tracking-[-0.4px] text-app-ink">
          Account settings
        </h1>
        <p className="mt-1 font-app-sans text-sm text-app-muted">
          Manage your Lessgo AI profile, email, and password.
        </p>
      </div>

      <UserProfile routing="hash" appearance={profileAppearance} />

      {/* Notifications settings placeholder — not built for beta.
          // TODO(beta+): notifications settings — needs a prefs backend */}
    </div>
  );
}
