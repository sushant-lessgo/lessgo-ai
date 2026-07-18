'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * WorkspaceTabs — the project-workspace tab bar (handoff §E 3a).
 *
 * 🚨 R13 — these tabs are REAL ROUTES, so this is a hand-rolled Link-based bar.
 * Do NOT reach for `@/components/ui/tabs`: the foundation `Tabs`/`TabsContent` are
 * client-side only with no routing — they would render all panels in one page and
 * lose deep-linking. The foundation is frozen; the underline is styled here to the
 * design spec instead.
 *
 * R2 — order is the design's: Overview · Blog · Leads · Testimonials · Analytics ·
 * Grow. **Grow is a greyed non-link stub** (designed chrome, no hub built — the Grow
 * hub stays out of scope; this is a disabled tab only).
 */

interface TabDef {
  label: string
  /** Path segment under `/dashboard/{token}`; '' = the Overview index. */
  segment: string
}

const TABS: TabDef[] = [
  { label: 'Overview', segment: '' },
  { label: 'Blog', segment: 'blog' },
  { label: 'Leads', segment: 'leads' },
  { label: 'Testimonials', segment: 'testimonials' },
  { label: 'Analytics', segment: 'analytics' },
]

// "Your work" is inserted after Overview for works-capable projects only
// (work-library-board P5). Visibility only — the page itself is the guard.
const WORK_TAB: TabDef = { label: 'Your work', segment: 'work' }

const TAB_BASE = 'relative px-[15px] pb-[13px] pt-[14px] font-app-sans text-[13px]'

export default function WorkspaceTabs({
  tokenId,
  showWorkTab = false,
}: {
  tokenId: string
  showWorkTab?: boolean
}) {
  const pathname = usePathname() ?? ''
  const base = `/dashboard/${tokenId}`

  const tabs = showWorkTab ? [TABS[0], WORK_TAB, ...TABS.slice(1)] : TABS

  return (
    <div className="flex flex-none gap-0.5 border-b border-[#f0f0f3] bg-app-surface px-[26px]">
      {tabs.map(({ label, segment }) => {
        const href = segment ? `${base}/${segment}` : base
        // Overview is the index → exact match only; a tab owns its nested routes
        // (e.g. blog/{postId} keeps Blog active).
        const active = segment
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === base

        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              TAB_BASE,
              active ? 'font-bold text-app-ink' : 'font-medium text-app-muted hover:text-app-ink'
            )}
          >
            {label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-[3px] bg-app-primary" />
            )}
          </Link>
        )
      })}

      {/* R2 — Grow: designed chrome, no route. Greyed in place, never hidden. */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(TAB_BASE, 'cursor-not-allowed font-medium text-app-muted opacity-50')}
      >
        Grow
      </button>
    </div>
  )
}
