'use client'

import posthog from 'posthog-js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppIcon } from '@/components/ui/icon'
import { publishedUrl } from '@/lib/publishedUrl'
import { cn } from '@/lib/utils'
import type { ProjectGridItem } from './ProjectGridCard'

/**
 * ProjectCardMenu — the `•••` popover on a project card (handoff §E 1d).
 *
 * R4: ships ALL 7 design items in design order. ACTIVE: "Open editor",
 * "Visit site" (published only). GREYED (completeness principle — render in
 * place, disabled): Rename, Duplicate, Domain settings (R15-consistent: no
 * per-card domain route), Archive, Delete (no backend — S2).
 *
 * R11 — `@/components/ui/dropdown-menu` is NOT part of the foundation's
 * reskinned set (still stock `rounded-sm`/`accent` classes). It must NOT be
 * edited and no stock Tailwind key may be mutated to reach the design, so the
 * handoff's popover styling is applied HERE, at the call site, via `className`
 * on DropdownMenuContent/Item.
 *
 * 🚨 PostHog: `project_preview_clicked` fires ONLY in "Visit site" (single call
 * site, B5). "Open editor" fires nothing here — `continueRouting` owns
 * `project_edit_clicked`.
 */

const CONTENT_CLASS =
  'w-[186px] rounded-[11px] border border-[#e6e6ec] bg-app-surface p-1.5 font-app-sans shadow-app-float'

const ITEM_CLASS =
  'cursor-pointer gap-2.5 rounded-[7px] px-2.5 py-2 text-[12.5px] font-medium text-[#2a2a34] focus:bg-[#f4f5f8] focus:text-[#2a2a34]'

const DANGER_ITEM_CLASS =
  'cursor-pointer gap-2.5 rounded-[7px] px-2.5 py-2 text-[12.5px] font-medium text-app-danger focus:bg-app-danger-bg focus:text-app-danger'

export interface ProjectCardMenuProps {
  project: ProjectGridItem
  /** Routes through `continueRouting` — supplied by the card. */
  onOpenEditor: () => void
}

export default function ProjectCardMenu({ project, onOpenEditor }: ProjectCardMenuProps) {
  const handleVisit = () => {
    posthog.capture('project_preview_clicked', {
      project_id: project.id,
      project_name: project.name,
    })

    // DD8 — "Visit site" must open the LIVE address, not the internal `/p/{slug}`
    // SSR path. `noopener` because this is a cross-origin window.open.
    if (project.slug) {
      window.open(publishedUrl(project.slug), '_blank', 'noopener')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Project actions"
        className="rounded-[7px] bg-app-surface p-[3px] text-[#6b6b76] transition-colors hover:bg-app-tint hover:text-app-primary data-[state=open]:bg-app-tint data-[state=open]:text-app-primary"
      >
        <AppIcon name="more_horiz" size={20} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className={CONTENT_CLASS}>
        <DropdownMenuItem className={ITEM_CLASS} onSelect={onOpenEditor}>
          <AppIcon name="open_in_new" size={17} />
          Open editor
        </DropdownMenuItem>

        {/* Only reachable once a page is live — greyed for drafts. */}
        <DropdownMenuItem
          className={cn(ITEM_CLASS, !project.slug && 'cursor-not-allowed')}
          disabled={!project.slug}
          onSelect={handleVisit}
        >
          <AppIcon name="visibility" size={17} />
          Visit site
        </DropdownMenuItem>

        {/* R4 — designed chrome with no backend yet: greyed in place, never hidden. */}
        <DropdownMenuItem className={cn(ITEM_CLASS, 'cursor-not-allowed')} disabled>
          <AppIcon name="drive_file_rename_outline" size={17} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem className={cn(ITEM_CLASS, 'cursor-not-allowed')} disabled>
          <AppIcon name="content_copy" size={17} />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem className={cn(ITEM_CLASS, 'cursor-not-allowed')} disabled>
          <AppIcon name="language" size={17} />
          Domain settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-app-hairline" />

        <DropdownMenuItem className={cn(ITEM_CLASS, 'cursor-not-allowed')} disabled>
          <AppIcon name="archive" size={17} />
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem className={cn(DANGER_ITEM_CLASS, 'cursor-not-allowed')} disabled>
          <AppIcon name="delete" size={17} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
