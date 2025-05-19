'use client'

import { UserButton, useUser, SignOutButton } from '@clerk/nextjs'
import Logo from '@/components/shared/Logo'
import posthog from 'posthog-js'

export default function Header() {
  const { user, isSignedIn } = useUser()

  const handleLogout = () => {
    posthog.capture('logout_clicked', {
      user_id: user?.id,
      email: user?.primaryEmailAddress?.emailAddress,
    })
  }

  return (
    <header className="w-full border-b border-brand-border bg-white px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <Logo size={180} />

        {/* Right: User info */}
        {isSignedIn && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm text-brand-mutedText font-medium">
              {user.firstName}
            </div>

            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-9 h-9',
                },
              }}
            />

            <SignOutButton>
              <button className="hidden sm:inline text-sm text-brand-text hover:text-brand-accentPrimary transition">
                Log out
              </button>
            </SignOutButton>
          </div>
        )}
      </div>
    </header>
  )
}
