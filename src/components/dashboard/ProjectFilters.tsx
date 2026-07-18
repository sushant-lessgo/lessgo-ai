'use client'

import { useMemo, useState } from 'react'
import { AppIcon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import NewSiteButton from './NewSiteButton'
import ProjectGridCard, { type ProjectGridItem } from './ProjectGridCard'

/**
 * Projects filter row + grid (handoff §E 1d).
 *
 * ⚠️ FILE NAME ≠ DEFAULT EXPORT: this file's default export is `ProjectsBoard`
 * (filter state + grid); `ProjectFilters` is the named, controlled filter row.
 * A rename is a trivial follow-up.
 *
 * The filter row is CLIENT-side state (R16 — the data fetch in
 * `dashboard/page.tsx` is unchanged; no refetch, no query param). The grid must
 * therefore live with the state, and `dashboard/page.tsx` is a server component
 * — hence `ProjectsBoard` (default export, stateful) wraps the presentational
 * `ProjectFilters` here rather than in a separate file (phase 2's Files-touched
 * list has no slot for one).
 */

type FilterKey = 'all' | 'published' | 'drafts'

const PILL_BASE =
  'rounded-app-pill px-3 py-1.5 font-app-sans text-xs font-semibold transition-colors'

export interface ProjectFiltersProps {
  value: FilterKey
  onValueChange: (value: FilterKey) => void
  /** Total project count — the "All {n}" pill label. Real count, never padded. */
  total: number
}

export function ProjectFilters({ value, onValueChange, total }: ProjectFiltersProps) {
  const pills: { key: FilterKey; label: string }[] = [
    { key: 'all', label: `All ${total}` },
    { key: 'published', label: 'Published' },
    { key: 'drafts', label: 'Drafts' },
  ]

  return (
    <div className="mb-5 flex items-center gap-2">
      {pills.map((pill) => {
        const active = pill.key === value
        return (
          <button
            key={pill.key}
            type="button"
            aria-pressed={active}
            onClick={() => onValueChange(pill.key)}
            className={cn(
              PILL_BASE,
              active
                ? 'bg-app-tint text-app-primary-deep'
                : 'border border-[#e6e6ec] text-app-body hover:bg-app-hairline'
            )}
          >
            {pill.label}
          </button>
        )
      })}

      <div className="flex-1" />

      {/* Sort is designed chrome with no implementation — greyed in place. */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          PILL_BASE,
          'flex cursor-not-allowed items-center gap-1 border border-[#e6e6ec] text-app-body opacity-50'
        )}
      >
        Recent
        <AppIcon name="expand_more" size={16} />
      </button>

      <NewSiteButton
        label="New site"
        icon="add"
        iconSize={16}
        location="dashboard_filters"
        className="w-auto gap-1 rounded-app-pill bg-app-primary px-3 py-1.5 text-xs shadow-none hover:bg-app-primary-hover hover:brightness-100"
      />
    </div>
  )
}

export interface ProjectsBoardProps {
  items: ProjectGridItem[]
  /** Admin god-view only — renders the "Showing first 200 projects" notice. */
  showTruncationNotice?: boolean
}

export default function ProjectsBoard({ items, showTruncationNotice }: ProjectsBoardProps) {
  const [filter, setFilter] = useState<FilterKey>('all')

  const visible = useMemo(() => {
    if (filter === 'published') return items.filter((i) => i.status === 'Published')
    if (filter === 'drafts') return items.filter((i) => i.status === 'Draft')
    return items
  }, [items, filter])

  return (
    <section>
      <ProjectFilters value={filter} onValueChange={setFilter} total={items.length} />

      {/* R8 — preserved from the old flat list; admin-only. */}
      {showTruncationNotice && (
        <p className="mb-3 font-app-sans text-xs text-app-faint">Showing first 200 projects</p>
      )}

      <div className="grid grid-cols-3 gap-[18px]">
        {visible.map((item) => (
          <ProjectGridCard key={`${item.type}-${item.id}`} project={item} />
        ))}

        {/* Ghost "Create a new site" card (1b) — the card IS the button, so the
            accessible name, focus ring and hit target all land on the real
            control (no overlay). Behavior = NewSiteButton's /api/start CTA. */}
        <NewSiteButton
          icon={null}
          location="dashboard_ghost_card"
          className="min-h-[266px] flex-col gap-0 rounded-[14px] border-[1.5px] border-dashed border-[#cdd4e2] bg-transparent p-6 text-center shadow-none transition-colors hover:border-app-cta hover:brightness-100"
          label={
            <>
              <span className="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#fff0eb]">
                <AppIcon name="auto_awesome" filled size={24} className="text-app-cta" />
              </span>
              <span className="font-app-sans text-sm font-bold text-app-ink">
                Create a new site
              </span>
              <span className="mt-1 font-app-sans text-[11.5px] font-normal text-app-faint">
                Describe it — AI drafts in seconds
              </span>
            </>
          }
        />
      </div>
    </section>
  )
}
