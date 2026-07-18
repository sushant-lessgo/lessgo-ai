'use client'

import type { ReactNode } from 'react'
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
 * Reused by the sidebar (default), the projects filter row, the empty state and
 * the grid's ghost card (phase 2) via `label`/`icon`/`className`.
 *
 * `label` is a ReactNode (widened in phase 2, orchestrator exception): the ghost
 * card and the 1a "Build my site" CTA need rich children (a title + sub-line, a
 * trailing arrow). Rendering them as REAL children of this button — rather than
 * layering a transparent copy of it over `pointer-events-none` visuals — keeps
 * the accessible name, the focus ring and the hit target on the actual control.
 * Type-only change: behavior is byte-identical to phase 1.
 */
export interface NewSiteButtonProps {
  label?: ReactNode
  /** Material Symbols ligature name; pass `null` for no icon. */
  icon?: string | null
  iconSize?: number
  className?: string
  /** PostHog `location` property — keeps call sites distinguishable. */
  location?: string
}

export default function NewSiteButton({
  label = 'Create my new website',
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
