// app/providers.tsx
'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { usePostHog } from 'posthog-js/react'
import { useUser } from '@clerk/nextjs'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!posthogKey) return // no key → don't init with an empty/undefined token

    posthog.init(posthogKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
      capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      session_recording: {
        maskAllInputs: true,                 // mask raw input text (PII) in recordings
        maskTextSelector: '[data-ph-mask]',  // opt-in masking escape hatch
        recordCrossOriginIframes: false,
      },
      disable_session_recording: false,
    })

// ✅ Identify internal user early
    const isInternal = localStorage.getItem("ph_is_internal") === "true"
    if (isInternal) {
      posthog.identify("internal_" + Date.now(), {
        is_internal: true,
      })
    }


  }, [])

  return (
    <PHProvider client={posthog}>
      <ClerkUserIdentify />
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}

/**
 * Identify authed Clerk users in PostHog and attach persona as a person
 * property. Persona is read once per session via /api/user/persona. Must
 * live below ClerkProvider; PostHogProvider is mounted inside it.
 */
function ClerkUserIdentify() {
  const { user, isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return

    // Identify with Clerk user id; superseded the previous internal-only path.
    posthog.identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName,
      first_name: user.firstName,
    })

    // Fetch persona and attach as a person property (super-property scope).
    fetch('/api/user/persona')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.persona) {
          posthog.setPersonProperties({ persona: data.persona })
        }
      })
      .catch(() => {
        /* non-fatal */
      })
  }, [isLoaded, isSignedIn, user?.id])

  return null
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }

      posthog.capture('$pageview', { '$current_url': url })
    }
  }, [pathname, searchParams, posthog])

  return null
}

// Wrap PostHogPageView in Suspense to avoid the useSearchParams usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}
