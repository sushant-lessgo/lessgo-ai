'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { confirmDialog, promptDialog } from '@/components/ui/ConfirmDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppIcon } from '@/components/ui/icon'
import { useToast } from '@/components/ui/toast'
import { publishedUrl } from '@/lib/publishedUrl'
import { cn } from '@/lib/utils'
import type { ProjectGridItem } from './ProjectGridCard'

/**
 * ProjectCardMenu — the `•••` popover on a project card (handoff §E 1d).
 *
 * R4: ships ALL 7 design items in design order. ACTIVE: "Open editor",
 * "Visit site" (published only), "Unpublish" (published only — phase 5),
 * "Delete" (phase 5), "Rename" + "Duplicate" (phase 6). GREYED (completeness
 * principle — render in place, disabled): Domain settings + Archive (D3 — out
 * of this spec's scope entirely).
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
 *
 * 🚨 Refresh model: the grid is a SERVER component, so a successful action ends
 * in `router.refresh()` — never an optimistic local removal. The server re-reads
 * `publishState`/`customDomain` and re-derives the card; that keeps the DD7 stale
 * -client problem bounded to a single round trip.
 *
 * 🚨 The server is the source of truth for the DD7 guard. The pre-disable below
 * is a courtesy; a stale client that still fires gets a 409 and shows the SAME
 * sentence via an error toast.
 */

const CONTENT_CLASS =
  'w-[186px] rounded-[11px] border border-[#e6e6ec] bg-app-surface p-1.5 font-app-sans shadow-app-float'

const ITEM_CLASS =
  'cursor-pointer gap-2.5 rounded-[7px] px-2.5 py-2 text-[12.5px] font-medium text-[#2a2a34] focus:bg-[#f4f5f8] focus:text-[#2a2a34]'

const DANGER_ITEM_CLASS =
  'cursor-pointer gap-2.5 rounded-[7px] px-2.5 py-2 text-[12.5px] font-medium text-app-danger focus:bg-app-danger-bg focus:text-app-danger'

/** DD7 — one sentence, one place: pre-disable tooltip AND the 409 error toast. */
const DOMAIN_BLOCKED_MESSAGE = 'Remove the custom domain first'

/**
 * 🚨 DD1c — LOAD-BEARING COPY, NOT DECORATION. Read before touching.
 *
 * The phase-3 investigation found NO usable cache-purge mechanism in this stack: there is no
 * per-URL Vercel purge API available to us, and the `cacheTag`/`revalidateTag` route is Next 15
 * while this app is Next 14 (and the blob-proxy runs on the edge runtime). The blob-proxy's CDN
 * cache is keyed by the PUBLIC url, so nothing we do server-side evicts it — `revalidatePath()`
 * only clears our own ISR render.
 *
 * Net effect: take-down is immediate at the ORIGIN, but the edge can keep replaying a cached
 * copy for ~1h. These two strings are therefore the ONLY honest signal the user ever gets about
 * that window. They must survive rewording:
 *   - plain words only — never "s-maxage", "SWR", "CDN cache key", "edge";
 *   - never promise instant global removal;
 *   - keep "up to an hour" (~1h is the practical window: after it, stale-while-revalidate
 *     revalidation reaches the 404 origin and the cache self-corrects — it is NOT 24h).
 */
const CACHED_COPY_SENTENCE =
  'Your page stops being served immediately, but visitors may see a cached copy for up to an hour.'
const UNPUBLISHED_TOAST = 'Unpublished. The cached copy can take up to an hour to clear.'

export interface ProjectCardMenuProps {
  project: ProjectGridItem
  /** Routes through `continueRouting` — supplied by the card. */
  onOpenEditor: () => void
}

export default function ProjectCardMenu({ project, onOpenEditor }: ProjectCardMenuProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const name = project.name || 'this project'
  // The RAW state, not the display pill: a page parked at 'unpublishing' by a failed teardown
  // still needs its Unpublish item — that item IS the retry (the route is idempotent).
  const isPublished = project.publishState !== 'draft'
  const blockedByDomain = project.hasCustomDomain

  /**
   * Shared action runner. Both endpoints answer with the same typed error contract, so the
   * mapping lives here once:
   *   409 custom_domain_attached → the guard sentence (a stale pre-disable)
   *   500 teardown_incomplete    → retryable; say so instead of a dead-end "failed"
   */
  const run = async (
    request: () => Promise<Response>,
    successMessage: string
  ) => {
    setBusy(true)
    try {
      const res = await request()
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { code?: string; error?: string }))
        const message =
          data.code === 'custom_domain_attached'
            ? DOMAIN_BLOCKED_MESSAGE
            : data.code === 'teardown_incomplete'
              ? "Take-down didn't finish. Please try again."
              : data.error || 'Something went wrong. Please try again.'
        toast(message, { variant: 'error' })
        return
      }
      toast(successMessage, { variant: 'success' })
      // Server component → re-read, never an optimistic splice.
      router.refresh()
    } catch {
      toast("Couldn't reach the server. Please try again.", { variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const handleUnpublish = () => {
    posthog.capture('project_unpublish_clicked', {
      project_id: project.id,
      project_name: project.name,
    })

    // Deferred a tick: the Radix menu restores focus to its trigger as it closes, which would
    // otherwise land after DialogHost's rAF focus and leave the dialog unfocused (Esc dead).
    setTimeout(() => {
      void (async () => {
        const ok = await confirmDialog({
          title: 'Unpublish this site?',
          message: `“${name}” will be taken off the web. ${CACHED_COPY_SENTENCE} You can publish it again later — the address stays reserved.`,
          confirmLabel: 'Unpublish',
        })
        if (!ok) return
        await run(
          () => fetch(`/api/projects/${project.tokenId}/unpublish`, { method: 'POST' }),
          UNPUBLISHED_TOAST
        )
      })()
    }, 0)
  }

  const handleDelete = () => {
    posthog.capture('project_delete_clicked', {
      project_id: project.id,
      project_name: project.name,
    })

    setTimeout(() => {
      void (async () => {
        const ok = await confirmDialog({
          title: 'Delete this project?',
          // A published project's delete ALSO tears the live page down — say so, and inherit
          // the same DD1c honesty (delete runs the identical teardown).
          message: isPublished
            ? `“${name}” will be permanently deleted, and its live page taken down with it. ${CACHED_COPY_SENTENCE} This can't be undone.`
            : `“${name}” will be permanently deleted. This can't be undone.`,
          confirmLabel: 'Delete',
          destructive: true,
        })
        if (!ok) return
        await run(
          () => fetch(`/api/projects/${project.tokenId}`, { method: 'DELETE' }),
          'Project deleted.'
        )
      })()
    }, 0)
  }

  const handleRename = () => {
    posthog.capture('project_rename_clicked', {
      project_id: project.id,
      project_name: project.name,
    })

    setTimeout(() => {
      void (async () => {
        // DD10 — prefilled with the DISPLAYED name (which may be the dashboard's derived
        // smart name), so renaming never starts from a blank the user has never seen. The
        // PATCH writes an explicit title, which then wins over that fallback for good.
        const next = await promptDialog({
          title: 'Rename project',
          defaultValue: project.name,
          confirmLabel: 'Rename',
        })
        if (next === null) return
        const title = next.trim()
        if (!title || title === project.name) return
        await run(
          () =>
            fetch(`/api/projects/${project.tokenId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title }),
            }),
          'Project renamed.'
        )
      })()
    }, 0)
  }

  const handleDuplicate = () => {
    posthog.capture('project_duplicate_clicked', {
      project_id: project.id,
      project_name: project.name,
    })

    // No confirm: duplicate creates, it never destroys. The copy lands as a Draft card via
    // router.refresh() (DD9 — it is an independent, unpublished clone).
    void run(
      () => fetch(`/api/projects/${project.tokenId}/duplicate`, { method: 'POST' }),
      'Duplicated. The copy is a new draft.'
    )
  }

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

        {/* Published-only, and only while a page is actually up. Also the RETRY for a page
            stuck at 'unpublishing' (the route is idempotent). */}
        {isPublished && (
          <DropdownMenuItem
            className={cn(ITEM_CLASS, (blockedByDomain || busy) && 'cursor-not-allowed')}
            disabled={blockedByDomain || busy}
            title={blockedByDomain ? DOMAIN_BLOCKED_MESSAGE : undefined}
            onSelect={handleUnpublish}
          >
            {/* B10: `cloud_off` (the ideal Unpublish glyph) is absent from the shipped
                Material Symbols subset, so the browser rendered the literal ligature name as
                text — blowing out the fixed-width row and pushing "Unpublish" off-edge.
                `visibility_off` IS in the subset (and reads as the opposite of the
                "Visit site" `visibility` glyph). Swap back to `cloud_off` after a font-subset
                regen restores it. */}
            <AppIcon name="visibility_off" size={17} />
            Unpublish
          </DropdownMenuItem>
        )}

        {/* Rename + Duplicate are domain-agnostic: neither touches the live page, so the DD7
            guard does NOT apply to them — only `busy` gates them. */}
        <DropdownMenuItem
          className={cn(ITEM_CLASS, busy && 'cursor-not-allowed')}
          disabled={busy}
          onSelect={handleRename}
        >
          <AppIcon name="drive_file_rename_outline" size={17} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn(ITEM_CLASS, busy && 'cursor-not-allowed')}
          disabled={busy}
          onSelect={handleDuplicate}
        >
          <AppIcon name="content_copy" size={17} />
          Duplicate
        </DropdownMenuItem>

        {/* R4 — designed chrome with no backend yet (D3, out of scope): greyed in place,
            never hidden. */}
        <DropdownMenuItem className={cn(ITEM_CLASS, 'cursor-not-allowed')} disabled>
          <AppIcon name="language" size={17} />
          Domain settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-app-hairline" />

        <DropdownMenuItem className={cn(ITEM_CLASS, 'cursor-not-allowed')} disabled>
          <AppIcon name="archive" size={17} />
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn(DANGER_ITEM_CLASS, (blockedByDomain || busy) && 'cursor-not-allowed')}
          disabled={blockedByDomain || busy}
          title={blockedByDomain ? DOMAIN_BLOCKED_MESSAGE : undefined}
          onSelect={handleDelete}
        >
          <AppIcon name="delete" size={17} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
