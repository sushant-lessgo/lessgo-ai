'use client'

// ============================================================================
// CmsBoardClient — the generic CMS board (`/dashboard/[token]/cms`, plan phase 9).
//
// Host pattern copied from `WorkLibraryClient` (work-library-board P5):
//   load → optimistic local state → ONE write funnel.
// The funnel here writes to `/api/collections/*`, never anywhere else.
//
// ── 🚨 WORKS IS NOT THIS BOARD'S BUSINESS (the phase's highest risk) ─────────
// The `works` catalog is AUTHORITATIVE (`collectionHelpers.ts`,
// `src/modules/collections/README.md`) and is edited through a COMPLETELY
// different pipeline: `/api/work-library` → `applyRailEdit` → `resyncWorkContent`,
// sourced from `brief.facts.work.groups` — NOT from the Collection tables. A
// generic board that wrote through that pipeline would corrupt a live customer's
// catalog. Therefore:
//   · this file issues ZERO requests to `/api/work-library` (pinned by a
//     mandatory regression test asserting the ABSENCE of such calls);
//   · `works` does not appear in this board in v1 (unify pass deferred);
//   · the only link between the two surfaces is the deep-link row below, which
//     NAVIGATES to `/dashboard/[token]/work` and mutates nothing.
//
// ── 🚨 NO EDIT-STORE, TRANSITIVELY (hard rule, no judgment call) ─────────────
// This file must not import from `src/hooks/editStore/**` (nor `@/hooks/useEditStore`,
// which fronts it). That rules out reusing `CmsPanel` (imports `useEditStore`
// directly) and `CollectionBrowser`/`ItemEditor` (clean themselves, but
// `ItemEditor` → `MediaPickerModal` → `useEditStore`). The ui/* field primitives
// are editStore-free and ARE reused verbatim; the rest is a thin dashboard variant.
//
// ── EMPTY-VALUE → null IS THE CALLER'S JOB ──────────────────────────────────
// Zod REJECTS empty strings and the item PATCH deletes a key ONLY on explicit
// `null` (`items/[itemId]/route.ts`). That contract lives ONCE, in
// `@/modules/cms/values` — shared verbatim with the editor's `ItemEditor`. That
// module is store-free and prisma-free (type-only imports), so importing it here
// pulls in no runtime dependency at all, let alone the edit store. It used to be
// duplicated in this file; two copies of a clear-semantics mapping drift silently.
// This board passes `editableTypes` so media fields are SKIPPED rather than
// null-deleted — see the option's docs.
//
// ── SCOPE: TEXTUAL FIELDS ARE EDITABLE, MEDIA IS READ-ONLY ──────────────────
// image/gallery/video/audio need the shared media picker, which is edit-store
// bound. Rather than silently omitting them, they render READ-ONLY with a
// why-note deep-linking to the site editor (greyed-placeholder discipline).
//
// `featuredOnHome` and `purposes` are RESERVED — no control, no reader. Do not
// wire either into this board.
// ============================================================================

import React from 'react'

import type {
  CmsCollection,
  CmsGroup,
  CmsItem,
  FieldDef,
  FieldType,
  ImageValue,
} from '@/modules/cms/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DateField } from '@/components/ui/date-field'
import { TagInput } from '@/components/ui/tag-input'
import { LinkPairField } from '@/components/ui/link-pair-field'
import { KeyValueField } from '@/components/ui/key-value-field'
import { buildValuesPayload as buildValuesPayloadShared, type Draft } from '@/modules/cms/values'

/** The "no group" sentinel for the group filter/select (mirrors ItemEditor). */
export const UNGROUPED = '__ungrouped__'

/** Field types this board can edit; the rest are read-only (see header). */
const EDITABLE_TYPES: readonly FieldType[] = [
  'text_short',
  'text_long',
  'date',
  'tags',
  'link',
  'stat',
]

/** Why a media field is read-only here — shown as text AND as a `title` tooltip. */
const MEDIA_READONLY_WHY =
  'Images, video and audio are chosen with the media picker in the site editor.'

interface Bundle {
  collection: CmsCollection
  groups: CmsGroup[]
  items: CmsItem[]
}

/* ------------------------------------------------------------------ values */

/**
 * The shared payload builder, narrowed to the types this board can edit. Media
 * fields are SKIPPED (not null-deleted) — this board never drafts them, so
 * normalizing them would produce a delete sentinel for images it cannot even show.
 * Omitting is safe: the PATCH is a MERGE, not a replace.
 */
function buildValuesPayload(
  fields: readonly FieldDef[],
  draft: Draft,
  stored: Record<string, unknown> | null
): Record<string, unknown> {
  return buildValuesPayloadShared(fields, draft, stored, { editableTypes: EDITABLE_TYPES })
}

/** Seed a draft from a stored item, for the editable types only. */
function seedDraft(fields: readonly FieldDef[], item: CmsItem | null): Draft {
  const draft: Draft = {}
  for (const f of fields) {
    if (!EDITABLE_TYPES.includes(f.type)) continue
    const stored = item?.values?.[f.id]
    switch (f.type) {
      case 'link':
        draft[f.id] = (stored as { url: string; label: string }) ?? { url: '', label: '' }
        break
      case 'stat':
        draft[f.id] = (stored as { key: string; value: string }) ?? { key: '', value: '' }
        break
      case 'tags':
        draft[f.id] = Array.isArray(stored) ? [...(stored as string[])] : []
        break
      default:
        draft[f.id] = typeof stored === 'string' ? stored : ''
    }
  }
  return draft
}

/* ------------------------------------------------------------- role display */

function roleField(collection: CmsCollection, role: 'title' | 'cover'): FieldDef | null {
  const fields = (collection.fieldSchema || []) as FieldDef[]
  const id = (collection.roles || {})[role]
  const explicit = id ? fields.find((f) => f.id === id) : undefined
  if (explicit) return explicit
  // Same fallback order the render model uses: first eligible field by order.
  if (role === 'title') return fields.find((f) => f.type === 'text_short') ?? null
  return fields.find((f) => f.type === 'image' || f.type === 'gallery') ?? null
}

function coverUrl(item: CmsItem, field: FieldDef | null): string | null {
  if (!field) return null
  const v = item.values?.[field.id]
  if (!v) return null
  if (field.type === 'image') return (v as ImageValue)?.url ?? null
  if (Array.isArray(v)) return (v[0] as ImageValue)?.url ?? null
  return null
}

function itemTitle(item: CmsItem, field: FieldDef | null): string {
  if (field) {
    const v = item.values?.[field.id]
    if (typeof v === 'string' && v.trim()) return v
  }
  return item.slug || 'Untitled'
}

/* --------------------------------------------------------------- the board */

export interface CmsBoardClientProps {
  tokenId: string
  /**
   * Whether this project HAS a works library (works-capable template). Drives the
   * deep-link row only — the CMS board itself is never template-gated.
   */
  hasWorkLibrary?: boolean
}

export default function CmsBoardClient({ tokenId, hasWorkLibrary = false }: CmsBoardClientProps) {
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [collections, setCollections] = React.useState<CmsCollection[]>([])

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [bundle, setBundle] = React.useState<Bundle | null>(null)
  const [bundleLoading, setBundleLoading] = React.useState(false)
  const [bundleError, setBundleError] = React.useState<string | null>(null)

  const [groupFilter, setGroupFilter] = React.useState<string>('all')
  const [openItemId, setOpenItemId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>({})
  /**
   * What the SERVER holds for the open item, advanced from each write's RESPONSE
   * — not from the list state. Same lesson as the editor's `storedRef`: computing
   * the delete sentinel against a stale copy silently skips the null and the
   * server keeps a value the user cleared.
   */
  const storedRef = React.useRef<Record<string, unknown> | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  /* ------------------------------------------------------------- load list */

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const res = await fetch(`/api/collections?tokenId=${encodeURIComponent(tokenId)}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (!cancelled) setLoadError(body.error || 'Could not load your collections.')
          return
        }
        const body = (await res.json()) as { collections?: CmsCollection[] }
        if (!cancelled) setCollections(body.collections ?? [])
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

  /* ----------------------------------------------------------- load bundle */

  React.useEffect(() => {
    if (!selectedId) {
      setBundle(null)
      return
    }
    let cancelled = false
    async function load(collectionId: string) {
      setBundleLoading(true)
      setBundleError(null)
      try {
        const res = await fetch(
          `/api/collections/${encodeURIComponent(collectionId)}?tokenId=${encodeURIComponent(tokenId)}`
        )
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (!cancelled) setBundleError(body.error || 'Could not load that collection.')
          return
        }
        const body = (await res.json()) as Bundle
        if (!cancelled) {
          setBundle({
            collection: body.collection,
            groups: body.groups ?? [],
            items: body.items ?? [],
          })
        }
      } catch {
        if (!cancelled) setBundleError("Couldn't reach the server. Try again.")
      } finally {
        if (!cancelled) setBundleLoading(false)
      }
    }
    load(selectedId)
    return () => {
      cancelled = true
    }
  }, [selectedId, tokenId])

  /* ------------------------------------------------------- THE write funnel */

  /**
   * The ONE write funnel. Every mutation this board performs goes through here,
   * as a PATCH to the COLLECTIONS api. It never touches `/api/work-library`.
   * On success the SERVER-returned item is adopted (server-authoritative) and
   * `storedRef` advances to it.
   */
  const commitItem = React.useCallback(
    async (
      collectionId: string,
      itemId: string,
      patch: Record<string, unknown>
    ): Promise<{ ok: boolean; error?: string }> => {
      setSaving(true)
      setSaveError(null)
      try {
        const res = await fetch(
          `/api/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(itemId)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenId, ...patch }),
          }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const error = body.error || 'That change could not be saved.'
          setSaveError(error)
          return { ok: false, error }
        }
        const body = (await res.json()) as { item?: CmsItem }
        const saved = body.item
        if (saved) {
          storedRef.current = (saved.values ?? {}) as Record<string, unknown>
          setBundle((prev) =>
            prev
              ? { ...prev, items: prev.items.map((i) => (i.id === saved.id ? saved : i)) }
              : prev
          )
        }
        return { ok: true }
      } catch {
        const error = "Couldn't reach the server. Try again."
        setSaveError(error)
        return { ok: false, error }
      } finally {
        setSaving(false)
      }
    },
    [tokenId]
  )

  /* ------------------------------------------------------------- item open */

  const fields = React.useMemo(
    () => ((bundle?.collection.fieldSchema || []) as FieldDef[]),
    [bundle]
  )
  const openItem = React.useMemo(
    () => (openItemId ? bundle?.items.find((i) => i.id === openItemId) ?? null : null),
    [openItemId, bundle]
  )

  const openEditor = React.useCallback(
    (item: CmsItem) => {
      setOpenItemId(item.id)
      setDraft(seedDraft(fields, item))
      storedRef.current = (item.values ?? {}) as Record<string, unknown>
      setSaveError(null)
    },
    [fields]
  )

  const closeEditor = React.useCallback(() => {
    setOpenItemId(null)
    setDraft({})
    storedRef.current = null
    setSaveError(null)
  }, [])

  const setFieldDraft = React.useCallback((fieldId: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  const onSave = React.useCallback(async () => {
    if (!bundle || !openItem) return
    const values = buildValuesPayload(fields, draft, storedRef.current)
    await commitItem(bundle.collection.id, openItem.id, { values })
  }, [bundle, openItem, fields, draft, commitItem])

  const onGroupChange = React.useCallback(
    async (groupId: string) => {
      if (!bundle || !openItem) return
      await commitItem(bundle.collection.id, openItem.id, {
        groupId: groupId === UNGROUPED ? null : groupId,
      })
    },
    [bundle, openItem, commitItem]
  )

  /* ---------------------------------------------------------------- render */

  const visibleItems = React.useMemo(() => {
    const items = bundle?.items ?? []
    if (groupFilter === 'all') return items
    if (groupFilter === UNGROUPED) return items.filter((i) => !i.groupId)
    return items.filter((i) => i.groupId === groupFilter)
  }, [bundle, groupFilter])

  const titleField = bundle ? roleField(bundle.collection, 'title') : null
  const coverField = bundle ? roleField(bundle.collection, 'cover') : null

  /** The works deep-link row — navigation only, rendered in the index column. */
  const worksRow = hasWorkLibrary ? (
    <a
      href={`/dashboard/${encodeURIComponent(tokenId)}/work`}
      data-testid="cms-works-link"
      className="mt-3 flex items-center justify-between rounded-app-ctl border border-app-hairline px-3 py-2 text-sm text-app-label hover:bg-app-hover"
    >
      <span>Works library</span>
      <span className="text-xs text-app-muted">Your work →</span>
    </a>
  ) : null

  return (
    <div data-testid="cms-board">
      {loading && (
        <p className="font-app-sans text-sm text-app-muted" data-testid="cms-loading">
          Loading your collections…
        </p>
      )}

      {!loading && loadError && (
        <p
          className="font-app-sans text-sm text-app-danger"
          role="alert"
          data-testid="cms-load-error"
        >
          {loadError}
        </p>
      )}

      {!loading && !loadError && (
        <div className="flex gap-6">
          {/* ---------------------------------------------------- index column */}
          <div className="w-64 flex-none">
            {collections.length === 0 ? (
              <div data-testid="cms-empty">
                <p className="font-app-sans text-sm text-app-muted">
                  No collections yet. Create one in the site editor’s CMS panel — then
                  manage its items here.
                </p>
              </div>
            ) : (
              <div data-testid="cms-collection-list">
                {collections.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    data-collection-row={c.id}
                    aria-current={selectedId === c.id ? 'true' : undefined}
                    onClick={() => {
                      setSelectedId(c.id)
                      setGroupFilter('all')
                      closeEditor()
                    }}
                    className={
                      'flex w-full items-center justify-between rounded-app-ctl px-3 py-2 text-left text-sm ' +
                      (selectedId === c.id
                        ? 'bg-app-hover font-semibold text-app-ink'
                        : 'text-app-label hover:bg-app-hover')
                    }
                  >
                    <span className="min-w-0 truncate">{c.name}</span>
                    <span className="ml-2 flex-none font-app-mono text-[11px] text-app-muted">
                      /{c.slug}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Two surfaces, one system: the works catalog lives on its own board
                and is deliberately NOT listed above (different pipeline). */}
            {worksRow}
          </div>

          {/* ----------------------------------------------------- detail pane */}
          <div className="min-w-0 flex-1">
            {!selectedId && (
              <p className="font-app-sans text-sm text-app-muted" data-testid="cms-no-selection">
                Pick a collection to see its items.
              </p>
            )}

            {selectedId && bundleLoading && (
              <p className="font-app-sans text-sm text-app-muted" data-testid="cms-bundle-loading">
                Loading items…
              </p>
            )}

            {selectedId && !bundleLoading && bundleError && (
              <p
                className="font-app-sans text-sm text-app-danger"
                role="alert"
                data-testid="cms-bundle-error"
              >
                {bundleError}
              </p>
            )}

            {selectedId && !bundleLoading && !bundleError && bundle && (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-app-ink">{bundle.collection.name}</h2>
                  {bundle.groups.length > 0 && (
                    <select
                      data-testid="cms-group-filter"
                      aria-label="Filter by group"
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value)}
                      className="rounded-app-input border border-app-border-input bg-app-surface px-2 py-1 text-sm"
                    >
                      <option value="all">All groups</option>
                      {bundle.groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                      <option value={UNGROUPED}>Ungrouped</option>
                    </select>
                  )}
                </div>

                {visibleItems.length === 0 ? (
                  <p className="font-app-sans text-sm text-app-muted" data-testid="cms-no-items">
                    No items here yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3" data-testid="cms-item-grid">
                    {visibleItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        data-item-row={item.id}
                        onClick={() => openEditor(item)}
                        className="flex items-center gap-3 rounded-app-ctl border border-app-hairline p-3 text-left hover:bg-app-hover"
                      >
                        {coverUrl(item, coverField) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coverUrl(item, coverField) as string}
                            alt=""
                            className="h-10 w-10 flex-none rounded object-cover"
                          />
                        ) : null}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-app-ink">
                            {itemTitle(item, titleField)}
                          </span>
                          <span className="block truncate font-app-mono text-[11px] text-app-muted">
                            {item.slug}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* ------------------------------------------------ item editor */}
                {openItem && (
                  <div
                    className="mt-6 rounded-app-ctl border border-app-hairline p-4"
                    data-testid="cms-item-editor"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-app-ink">
                        {itemTitle(openItem, titleField)}
                      </h3>
                      <button
                        type="button"
                        data-testid="cms-item-close"
                        onClick={closeEditor}
                        className="text-sm text-app-muted hover:text-app-ink"
                      >
                        Close
                      </button>
                    </div>

                    {bundle.groups.length > 0 && (
                      <div className="mb-4">
                        <label
                          className="mb-1 block text-xs font-medium text-app-label"
                          htmlFor="cms-item-group"
                        >
                          Group
                        </label>
                        <select
                          id="cms-item-group"
                          data-testid="cms-item-group"
                          value={openItem.groupId ?? UNGROUPED}
                          onChange={(e) => void onGroupChange(e.target.value)}
                          className="rounded-app-input border border-app-border-input bg-app-surface px-2 py-1 text-sm"
                        >
                          <option value={UNGROUPED}>Ungrouped</option>
                          {bundle.groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {fields.map((f) => (
                      <div key={f.id} className="mb-4">
                        <label className="mb-1 block text-xs font-medium text-app-label">
                          {f.name}
                        </label>
                        <FieldControl
                          field={f}
                          item={openItem}
                          draft={draft[f.id]}
                          onChange={(v) => setFieldDraft(f.id, v)}
                          tokenId={tokenId}
                        />
                      </div>
                    ))}

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        data-testid="cms-item-save"
                        disabled={saving}
                        onClick={() => void onSave()}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                      {saveError && (
                        <span
                          className="text-sm text-app-danger"
                          role="alert"
                          data-testid="cms-item-save-error"
                        >
                          {saveError}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ field control */

function FieldControl({
  field,
  item,
  draft,
  onChange,
  tokenId,
}: {
  field: FieldDef
  item: CmsItem
  draft: unknown
  onChange: (next: unknown) => void
  tokenId: string
}) {
  switch (field.type) {
    case 'text_short':
      return (
        <Input
          data-field={field.id}
          value={typeof draft === 'string' ? draft : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'text_long':
      return (
        <Textarea
          data-field={field.id}
          rows={4}
          value={typeof draft === 'string' ? draft : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'date':
      return (
        <DateField
          data-field={field.id}
          value={typeof draft === 'string' ? draft : ''}
          onValueChange={onChange}
        />
      )
    case 'tags':
      return (
        <TagInput
          data-field={field.id}
          value={Array.isArray(draft) ? (draft as string[]) : []}
          onValueChange={onChange}
          inputAriaLabel={`Add a ${field.name} tag`}
        />
      )
    case 'link':
      return (
        <LinkPairField
          data-field={field.id}
          value={(draft as { url: string; label: string }) ?? { url: '', label: '' }}
          onValueChange={onChange}
        />
      )
    case 'stat':
      return (
        <KeyValueField
          data-field={field.id}
          value={(draft as { key: string; value: string }) ?? { key: '', value: '' }}
          onValueChange={onChange}
        />
      )
    default: {
      // image / gallery / video / audio — READ-ONLY here. Not silently omitted:
      // shown with the reason and a deep link to the surface that can edit them.
      const stored = item.values?.[field.id]
      const filled = Array.isArray(stored) ? stored.length > 0 : !!stored
      return (
        <div
          data-field={field.id}
          data-readonly="media"
          title={MEDIA_READONLY_WHY}
          className="rounded-app-ctl border border-dashed border-app-border px-3 py-2 text-xs text-app-muted opacity-70"
        >
          {filled ? 'Media set' : 'No media'} — {MEDIA_READONLY_WHY}{' '}
          <a className="underline" href={`/edit/${encodeURIComponent(tokenId)}`}>
            Open the editor
          </a>
        </div>
      )
    }
  }
}
