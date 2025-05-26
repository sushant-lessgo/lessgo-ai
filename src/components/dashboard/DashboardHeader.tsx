'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import posthog from 'posthog-js'
import { useRouter } from 'next/navigation'

export default function DashboardHeader() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const firstName = isLoaded ? user?.firstName ?? 'there' : ''

  useEffect(() => {
    if (isLoaded && user?.id) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        first_name: user.firstName,
      })

      posthog.capture('dashboard_header_loaded', {
        user_id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
      })
    }
  }, [isLoaded, user])

  const handleCreatePage = async () => {
  posthog.capture('create_page_clicked', {
    location: 'dashboard_header',
    user_id: user?.id ?? 'anonymous',
  });

  const res = await fetch('/api/start');
  const { url } = await res.json(); // Your API should return JSON with the new URL
  window.open(url, '_blank');
};


  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
      <h1 className="text-heading1 font-heading text-landing-textPrimary">
        Hey {firstName}, let’s build a High-Converting page.
      </h1>

      <button
        className="bg-brand-accentPrimary hover:bg-brand-logo text-white text-lg font-medium px-4 py-2 rounded-md transition shadow-sm"
        onClick={handleCreatePage}
      >
        + Create New Page
      </button>
    </div>
  )
}
