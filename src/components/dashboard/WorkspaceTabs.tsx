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
 *
 * ── CONTENT (CMS) — GREYED, NEVER HIDDEN (cms-collections phase 9) ───────────
 * "Content" sits after Blog and is shown to EVERY project — there is no template
 * gate, because the collection block is a SHARED block that renders on every
 * template. What varies is whether the project has authored any collections yet:
 *   · one or more  → a real link to `/dashboard/{token}/cms`;
 *   · none         → the same tab, GREYED with a why-tooltip explaining where
 *                    collections are created.
 * Greyed rather than hidden on purpose: the capability exists, it just has nothing
 * to show, and a tab that silently appears later is a capability the user never
 * learns they have. `hasCollections` is CHROME DATA — the page re-gates itself.
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

// "Content" (the CMS board) is inserted after Blog for EVERY project — greyed when
// the project has no collections yet. See the header note.
const CMS_TAB: TabDef = { label: 'Content', segment: 'cms' }

/** Why the Content tab is greyed — shown as the native `title` tooltip. */
const CMS_DISABLED_WHY =
  'No collections yet. Create one in the site editor’s CMS panel, then manage its items here.'

const TAB_BASE = 'relative px-[15px] pb-[13px] pt-[14px] font-app-sans text-[13px]'
const TAB_DISABLED = 'cursor-not-allowed font-medium text-app-muted opacity-50'

export default function WorkspaceTabs({
  tokenId,
  showWorkTab = false,
  hasCollections = false,
}: {
  tokenId: string
  showWorkTab?: boolean
  /** Project has ≥1 collection → Content links; otherwise it renders greyed. */
  hasCollections?: boolean
}) {
  const pathname = usePathname() ?? ''
  const base = `/dashboard/${tokenId}`

  // Overview · [Your work] · Blog · Content · Leads · Testimonials · Analytics
  const withWork = showWorkTab ? [TABS[0], WORK_TAB, ...TABS.slice(1)] : TABS
  const blogAt = withWork.findIndex((t) => t.segment === 'blog')
  const tabs = [...withWork.slice(0, blogAt + 1), CMS_TAB, ...withWork.slice(blogAt + 1)]

  return (
    <div className="flex flex-none gap-0.5 border-b border-[#f0f0f3] bg-app-surface px-[26px]">
      {tabs.map(({ label, segment }) => {
        const href = segment ? `${base}/${segment}` : base

        // Content with no collections: same tab, greyed + why-tooltip. Never
        // hidden — see the header note.
        if (segment === CMS_TAB.segment && !hasCollections) {
          return (
            <button
              key={label}
              type="button"
              disabled
              aria-disabled="true"
              data-tab-disabled={segment}
              title={CMS_DISABLED_WHY}
              className={cn(TAB_BASE, TAB_DISABLED)}
            >
              {label}
            </button>
          )
        }

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
        className={cn(TAB_BASE, TAB_DISABLED)}
      >
        Grow
      </button>
    </div>
  )
}
