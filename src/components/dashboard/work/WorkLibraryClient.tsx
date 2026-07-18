'use client'

// ============================================================================
// WorkLibraryClient — the "Your work" dashboard host (work-library-board P5).
//
// Loads the customer's grouped photos from `GET /api/work-library`, mounts the
// reused E2 `CorrectionBoard` in DASHBOARD mode (`hideBehavior='flag'`,
// `enableOrdering`, `hideHeader`, per-group "Add photos"), and funnels EVERY
// mutation through `PUT /api/work-library` — the one server door that re-emits
// facts through the rail AND resyncs the stored content surfaces.
//
//   • onCommit  — the board's verb funnel (rename/merge/move/hide/cover/reorder).
//                 The board optimistically shows `next` then reverts on a failed
//                 commit; on success we adopt the SERVER-returned groups (they
//                 carry seeded slugs) so the host stays authoritative.
//   • Add photos — a hidden file input → `POST /api/upload-image` (t7 pipeline:
//                 resize/format/blur + MediaAsset row). We append the returned
//                 ref `{id: assetId, url}` to the target group and commit through
//                 the SAME funnel. Multi-file uploads run sequentially; a per-file
//                 failure toasts and skips that file.
//   • Update site — deep-links to `/preview/[token]`, the existing publish flow
//                 (phase-6 FALLBACK path, ruling #2). The board's save already
//                 resynced the stored content + `workcatalog.items[]`; /preview's
//                 publish runs the export sweep (guarded works-only in
//                 collectionHelpers) so the resynced catalog survives republish.
//                 The direct-from-board primary path was DOA: `buildPagesForExport`
//                 consumes the editor-STORE state shape, not `loadDraft` output.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import CorrectionBoard from '@/components/onboarding/journey/engines/work/CorrectionBoard'
import { ToastProvider, useToast } from '@/components/ui/toast'
import type { WorkGroupInput } from '@/modules/wizard/work/rail'

interface WorkLibraryClientProps {
  tokenId: string
}

interface LoadState {
  groups: WorkGroupInput[]
  blurByUrl: Record<string, string>
}

/** The photo ref shape the board consumes — id + url (t7 upload → MediaAsset). */
type PhotoRef = NonNullable<WorkGroupInput['photos']>[number]

export default function WorkLibraryClient({ tokenId }: WorkLibraryClientProps) {
  // Self-provide a toast context so the host is drop-in under any dashboard tree.
  return (
    <ToastProvider>
      <WorkLibraryInner tokenId={tokenId} />
    </ToastProvider>
  )
}

function WorkLibraryInner({ tokenId }: WorkLibraryClientProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<LoadState | null>(null)
  const [busy, setBusy] = useState(false)

  // Hidden file input for "Add photos"; the pending target group is captured on
  // the button tap so the change handler knows where to append.
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingGroupRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const res = await fetch(`/api/work-library?tokenId=${encodeURIComponent(tokenId)}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (!cancelled) setLoadError(body.error || 'Could not load your work.')
          return
        }
        const body = (await res.json()) as LoadState
        if (!cancelled) {
          setData({ groups: body.groups ?? [], blurByUrl: body.blurByUrl ?? {} })
        }
      } catch {
        if (!cancelled) setLoadError("Couldn't reach the server. Try again.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tokenId])

  /**
   * The ONE write funnel. PUTs the full rebuilt array; on success adopts the
   * server groups (seeded slugs). Returns the board's `{ok, error?}` contract.
   */
  const commit = useCallback(
    async (groups: WorkGroupInput[]): Promise<{ ok: boolean; error?: string }> => {
      setBusy(true)
      try {
        const res = await fetch('/api/work-library', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, groups }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          return { ok: false, error: body.error || 'That change could not be saved.' }
        }
        const body = (await res.json()) as { groups?: WorkGroupInput[] }
        // Adopt the server-returned groups — they carry seeded slugs.
        const nextGroups = body.groups ?? groups
        setData((prev) => (prev ? { ...prev, groups: nextGroups } : prev))
        return { ok: true }
      } catch {
        return { ok: false, error: "Couldn't reach the server. Try again." }
      } finally {
        setBusy(false)
      }
    },
    [tokenId]
  )

  /** Add-photos: capture the target group, then open the file dialog. */
  const onAddPhotos = useCallback((groupIndex: number) => {
    pendingGroupRef.current = groupIndex
    fileInputRef.current?.click()
  }, [])

  /** Sequential t7 upload → append refs → commit through the same funnel. */
  const onFilesSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const groupIndex = pendingGroupRef.current
      const files = e.target.files ? Array.from(e.target.files) : []
      // Reset the input so re-selecting the same file re-fires change.
      e.target.value = ''
      pendingGroupRef.current = null
      if (groupIndex === null || files.length === 0) return

      setBusy(true)
      const newRefs: PhotoRef[] = []
      const newBlurs: Record<string, string> = {}
      try {
        for (const file of files) {
          try {
            const form = new FormData()
            form.append('file', file)
            form.append('tokenId', tokenId)
            const res = await fetch('/api/upload-image', { method: 'POST', body: form })
            if (!res.ok) {
              const body = await res.json().catch(() => ({}))
              toast(body.error || `Couldn't upload ${file.name}.`, { variant: 'error' })
              continue
            }
            const body = (await res.json()) as {
              url?: string
              metadata?: { assetId?: string; blurDataUrl?: string }
            }
            const assetId = body.metadata?.assetId
            const url = body.url
            if (!assetId || !url) {
              toast(`Couldn't upload ${file.name}.`, { variant: 'error' })
              continue
            }
            newRefs.push({ id: assetId, url } as PhotoRef)
            if (body.metadata?.blurDataUrl) newBlurs[url] = body.metadata.blurDataUrl
          } catch {
            toast(`Couldn't upload ${file.name}.`, { variant: 'error' })
          }
        }
      } finally {
        setBusy(false)
      }

      if (newRefs.length === 0) return

      // Append the new refs to the target group and commit through the funnel.
      const current = data?.groups ?? []
      const nextGroups = current.map((g, i) =>
        i === groupIndex ? { ...g, photos: [...(g.photos ?? []), ...newRefs] } : g
      )
      // Merge new blur placeholders in so thumbnails paint immediately.
      setData((prev) =>
        prev ? { ...prev, blurByUrl: { ...prev.blurByUrl, ...newBlurs } } : prev
      )
      const result = await commit(nextGroups)
      if (!result.ok) {
        toast(result.error || 'Those photos could not be saved.', { variant: 'error' })
      }
    },
    [tokenId, data, commit, toast]
  )

  return (
    <div>
      {/* Hidden file input drives "Add photos" for whichever group was tapped. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        data-testid="work-add-photos-input"
        onChange={onFilesSelected}
      />

      {loading && (
        <p className="font-app-sans text-sm text-app-muted" data-testid="work-loading">
          Loading your work…
        </p>
      )}

      {!loading && loadError && (
        <p className="font-app-sans text-sm text-app-danger" role="alert" data-testid="work-load-error">
          {loadError}
        </p>
      )}

      {!loading && !loadError && data && (
        <>
          {data.groups.length === 0 ? (
            <p className="font-app-sans text-sm text-app-muted" data-testid="work-empty">
              No sets yet — they appear here once your site has work to show.
            </p>
          ) : (
            <CorrectionBoard
              groups={data.groups}
              blurByUrl={data.blurByUrl}
              onCommit={commit}
              busy={busy}
              hideBehavior="flag"
              enableOrdering
              hideHeader
              onAddPhotos={onAddPhotos}
            />
          )}

          {/* Update site — deep-links to the existing /preview publish flow
              (phase-6 fallback). Board edits are already resynced into stored
              content; /preview publishes them live. */}
          <div className="mt-6 border-t border-app-hairline pt-4">
            <a
              href={`/preview/${encodeURIComponent(tokenId)}`}
              data-testid="work-update-site"
              className="inline-block rounded-app-badge bg-app-primary px-4 py-2 font-app-sans text-sm font-medium text-white hover:opacity-90"
            >
              Update site
            </a>
            <p className="mt-2 font-app-sans text-xs text-app-muted">
              Review and publish your changes on the preview page.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
