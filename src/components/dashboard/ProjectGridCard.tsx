'use client'

import { useRouter } from 'next/navigation'
import { AppIcon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import { continueRouting } from './continueRouting'
import ProjectCardMenu from './ProjectCardMenu'

/**
 * ProjectGridCard — the projects-grid card (handoff §E 1d).
 *
 * Replaces the flat-list `ProjectCard.tsx` (deleted in phase 6).
 *
 * Rulings in force:
 * - R5  — primary label is "Open" for published, "Continue" for drafts (R9).
 * - R9  — draft badge is amber; draft primary routes via `continueRouting`.
 * - B5  — the DRAFT primary ("Continue"), the draft name/thumbnail click and the
 *         `•••` "Open editor" (published or draft) route through `continueRouting`;
 *         never hard-code `/edit/{token}` (transient 404).
 *         Phase 3 re-point: a PUBLISHED card's "Open" + name/thumbnail now go to the
 *         project workspace `/dashboard/{tokenId}` and fire NO PostHog event (it is
 *         workspace navigation, not an editor open — the B5 single-call-site rule for
 *         `project_edit_clicked` stays intact inside `continueRouting`).
 * - R14/R16 — metrics are em-dashes this slice. NO fabricated numbers and NO
 *         per-card analytics query; account/project rollups are slice S4.
 * - R8  — admin god-view has no design; the owner-email affordance is preserved
 *         as a small `text-app-faint` line in the card body.
 */

export interface ProjectGridItem {
  id: string
  name: string
  status: 'Draft' | 'Published'
  updatedAt: string
  tokenId: string | null
  slug: string | null
  type: 'unified'
  publishedAt?: string
  /** Admin god-view only (R8) — the owning account's email. */
  owner?: string
}

/** Item `type` → the design's sub-line type label ("{domain} · {typeLabel}"). */
const TYPE_LABELS: Record<ProjectGridItem['type'], string> = {
  unified: 'Landing page',
}

const EM_DASH = '—'

/**
 * Status chip. Published = design's green-on-white; Draft = amber (R9) —
 * `#9a6a1e` on `#fdf2dc` as arbitrary values (no new Tailwind keys, ever).
 */
function StatusBadge({ status }: { status: ProjectGridItem['status'] }) {
  const published = status === 'Published'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-app-pill px-2 py-[3px] font-app-sans text-[9.5px] font-semibold',
        published ? 'bg-app-surface text-app-success' : 'bg-[#fdf2dc] text-[#9a6a1e]'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          published ? 'bg-app-success' : 'bg-[#9a6a1e]'
        )}
      />
      {status}
    </span>
  )
}

/** One metric column — value over label. Value is always an em-dash (R16). */
function Metric({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5">
      {/* R16 — no real rollup exists yet; an em-dash is honest, a 0 would not be. */}
      <span className="font-app-sans text-sm font-bold text-[#c0c0c8]">{EM_DASH}</span>
      <span className="font-app-sans text-[9px] text-app-faint">{label}</span>
    </div>
  )
}

export default function ProjectGridCard({ project }: { project: ProjectGridItem }) {
  const router = useRouter()

  const published = project.status === 'Published'

  // Phase 3 re-point: a published card opens the project WORKSPACE; a draft still has
  // no workspace worth landing on, so it keeps the state-aware editor routing.
  const openProject = () => {
    if (published && project.tokenId) {
      router.push(`/dashboard/${project.tokenId}`)
      return
    }
    void continueRouting(project, router)
  }

  // The `•••` "Open editor" always means the EDITOR — always state-aware (B5).
  // `continueRouting` owns the PostHog `project_edit_clicked` fire.
  const openEditor = () => {
    void continueRouting(project, router)
  }

  const domain = published && project.slug ? `lessgo.ai/p/${project.slug}` : EM_DASH
  const name = stripHTMLTags(project.name || '')

  return (
    <div className="overflow-hidden rounded-[14px] border border-app-border bg-app-surface shadow-[0_2px_10px_-6px_rgba(20,20,40,.2)]">
      {/* Thumbnail — the click target is an inset button so the badge and the
          `•••` trigger aren't nested inside it (invalid + unclickable). */}
      <div className="relative h-[120px] bg-app-stripes">
        <button
          type="button"
          onClick={openProject}
          aria-label={`Open ${name}`}
          className="absolute inset-0 h-full w-full cursor-pointer"
        />
        <div className="pointer-events-none absolute left-2 top-2">
          <StatusBadge status={project.status} />
        </div>
        <div className="absolute right-2 top-2">
          <ProjectCardMenu project={project} onOpenEditor={openEditor} />
        </div>
      </div>

      {/* Body */}
      <div className="px-[15px] py-[13px]">
        <button
          type="button"
          onClick={openProject}
          className="block max-w-full truncate text-left font-app-sans text-sm font-bold text-app-ink hover:text-app-primary"
        >
          {name}
        </button>
        <p className="mt-0.5 truncate font-app-sans text-[10.5px] text-app-faint">
          {domain} · {TYPE_LABELS[project.type]}
        </p>
        {/* R8 — admin god-view affordance; absent for normal viewers. */}
        {project.owner && (
          <p className="mt-0.5 truncate font-app-sans text-[10px] text-app-faint">
            owner: {project.owner}
          </p>
        )}
      </div>

      {/* Metrics strip (R16 — em-dashes) */}
      <div className="flex gap-4 border-t border-app-hairline px-[15px] py-2.5">
        <Metric label="views" />
        <Metric label="leads" />
        <Metric label="conv." />
      </div>

      {/* Footer */}
      <div className="flex gap-[7px] px-[15px] pb-[13px]">
        <button
          type="button"
          onClick={openProject}
          className="flex-1 rounded-lg bg-app-primary py-[7px] font-app-sans text-xs font-bold text-white transition-colors hover:bg-app-primary-hover"
        >
          {published ? 'Open' : 'Continue'}
        </button>
        {/* Share/export sheet not built — greyed in place (completeness principle). */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label="Share"
          className="flex h-[34px] w-[34px] shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-app-border text-app-faint opacity-50"
        >
          <AppIcon name="ios_share" size={17} />
        </button>
      </div>
    </div>
  )
}
