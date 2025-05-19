'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import posthog from 'posthog-js'

export default function DashboardHeader() {
  const { user, isLoaded } = useUser()
  const firstName = isLoaded ? user?.firstName ?? 'there' : ''

  useEffect(() => {
    if (isLoaded && user?.id) {
      posthog.capture('dashboard_header_loaded', {
        user_id: user.id,
        first_name: user.firstName,
        email: user.primaryEmailAddress?.emailAddress,
      })
    }
  }, [isLoaded, user])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
      <h1 className="text-heading1 font-heading text-landing-textPrimary">
        Hey {firstName}, let’s build a High-Converting page.
      </h1>

      <button
        className="bg-landing-primary hover:bg-landing-primaryHover text-white text-sm font-medium px-4 py-2 rounded-md transition shadow-sm"
        onClick={() =>
          posthog.capture('create_page_clicked', {
            location: 'dashboard_header',
            user_id: user?.id,
          })
        }
      >
        + Create New Page
      </button>
    </div>
  )
}
