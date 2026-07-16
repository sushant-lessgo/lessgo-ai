'use client'

import { useUser } from '@clerk/nextjs'
import posthog from 'posthog-js'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/components/ui/icon'

/**
 * NewSiteButton — the "New site with AI" CTA (app-chrome).
 *
 * Extracted VERBATIM from the retired `DashboardHeader.handleCreatePage`
 * (dashboard-workspace-ia phase 1): PostHog `create_page_clicked` →
 * `GET /api/start` → `window.open(url, '_blank')`. DashboardHeader's dead local
 * state (userInput/confirmedFields/stepIndex) is deliberately dropped — it was
 * never read. Do NOT change the fetch/open behavior: `/api/start` returns the
 * universal entry URL and is the single onboarding entry point.
 *
 * Reused by the sidebar (default), the projects filter row and the empty state
 * (phase 2) via `label`/`icon`/`className`.
 */
export interface NewSiteButtonProps {
  label?: string
  /** Material Symbols ligature name; pass `null` for no icon. */
  icon?: string | null
  iconSize?: number
  className?: string
  /** PostHog `location` property — keeps call sites distinguishable. */
  location?: string
}

export default function NewSiteButton({
  label = 'New site with AI',
  icon = 'auto_awesome',
  iconSize = 20,
  className,
  location = 'dashboard_sidebar',
}: NewSiteButtonProps) {
  const { user } = useUser()

  const handleCreatePage = async () => {
    posthog.capture('create_page_clicked', {
      location,
      user_id: user?.id ?? 'anonymous',
    })

    const res = await fetch('/api/start')
    const { url } = await res.json()

    // /api/start returns the universal entry URL (/onboarding/{token});
    // the persona-prompt redirect branch was removed in scale-02.
    window.open(url, '_blank')
  }

  return (
    <button
      type="button"
      onClick={handleCreatePage}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-app-ctl bg-app-cta p-3 font-app-sans text-[13.5px] font-bold text-white shadow-app-btn-cta transition hover:brightness-[1.04]',
        className
      )}
    >
      {icon ? <AppIcon name={icon} filled size={iconSize} /> : null}
      {label}
    </button>
  )
}
