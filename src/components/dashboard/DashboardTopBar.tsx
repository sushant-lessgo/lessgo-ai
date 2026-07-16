'use client'

import { usePathname } from 'next/navigation'
import { AppIcon } from '@/components/ui/icon'

/**
 * DashboardTopBar — 64px account-level bar (handoff §E).
 *
 * 2-line title block (eyebrow + title) + spacer + greyed bell. NO logo, NO
 * avatar — both are sidebar-resident (R1).
 *
 * ⚠️ TOKEN-PATH SELF-SUPPRESSION (load-bearing for phase 3): the segment after
 * `/dashboard/` is either a LITERAL screen name or a project token. If it is not
 * in TITLES below, it is a token → render `null`, because the project workspace
 * (`/dashboard/[token]/*`) replaces this bar with its own taller header + tab bar.
 * Without this, the workspace would double-stack two bars. Adding a new literal
 * `/dashboard/<name>` screen means adding it to TITLES.
 */

/** Literal `/dashboard/<segment>` screens → [eyebrow, title]. */
const TITLES: Record<string, [string, string]> = {
  settings: ['Account', 'Settings'],
  billing: ['Account', 'Billing & plan'],
  testimonials: ['Workspace', 'Testimonials'],
  forms: ['Lead management', 'Leads'],
  leads: ['Lead management', 'All Leads'],
  analytics: ['Performance', 'All Analytics'],
  blog: ['Content', 'Blog'],
  emails: ['Grow', 'Email sequences'],
  outreach: ['Grow', 'Cold outreach'],
  social: ['Grow', 'Social posts'],
}

export default function DashboardTopBar() {
  const pathname = usePathname() ?? ''

  const segments = pathname.split('/').filter(Boolean) // ['dashboard', ...]
  const screen = segments[1]

  let eyebrow: string
  let title: string

  if (!screen) {
    // /dashboard root
    eyebrow = 'Workspace'
    title = 'Projects'
  } else if (screen in TITLES) {
    ;[eyebrow, title] = TITLES[screen]
  } else {
    // Project token → the workspace header owns this chrome (phase 3).
    return null
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3.5 border-b border-[#f0f0f3] bg-app-surface px-[26px]">
      <div>
        <p className="font-app-sans text-[11.5px] text-app-faint">{eyebrow}</p>
        <h1 className="font-app-sans text-lg font-extrabold tracking-[-0.4px] text-app-ink">
          {title}
        </h1>
      </div>
      <div className="flex-1" />
      {/* Notifications not built — greyed in place (completeness principle). */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-label="Notifications"
        className="cursor-not-allowed text-app-faint opacity-50"
      >
        <AppIcon name="notifications" size={22} />
      </button>
    </header>
  )
}
