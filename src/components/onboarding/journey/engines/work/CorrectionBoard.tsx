'use client';

// ============================================================================
// CORRECTION BOARD — the always-shown, skippable STEP 02 correction surface
// (work-onboarding-ingestion E2 · P4).
//
// Group cards with photo thumbnails and the FIVE tap-based correction verbs:
// rename, merge, drag-between-groups, hide (photo-level, D12), pick cover.
// The verb SEMANTICS live in the pure `correctionReducer` (unit-tested without
// DOM); this component only wires taps/drags to those transforms and re-commits
// the FULL rebuilt `WorkGroupInput[]` through the D10 funnel supplied by
// `ShowWorkStep` (`applyRailEdit({field:'groups'})` → `commitRail`).
//
// ── BLUR-UP (spec) ──────────────────────────────────────────────────────────
//   Thumbnails paint the pipeline's `blurDataUrl` behind the WebP `url`, so a
//   phone shows something instantly — exercising the "fast-on-phone" blur path
//   in real product UI.
//
// ── ACCEPT / SKIP live in ShowWorkStep ──────────────────────────────────────
//   The proposal was already committed in P3, so both "Looks right →" and "Skip"
//   are pure advances — they belong to the step frame, not this board.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import type { WorkGroupInput } from '@/modules/wizard/work/rail';
import {
  renameGroup,
  mergeGroups,
  movePhoto,
  hidePhoto,
  pickCover,
  setPhotoHidden,
  reorderPhoto,
  moveGroup,
} from './correctionReducer';

type Photo = NonNullable<WorkGroupInput['photos']>[number];

export interface CorrectionBoardProps {
  /** The committed groups (source of truth) at mount — the board drives from here. */
  groups: WorkGroupInput[];
  /** url → tiny blur data-url, for instant thumbnail paint. */
  blurByUrl: Record<string, string>;
  /** Re-commit the FULL rebuilt array through the D10 funnel. Resolves ok/err. */
  onCommit: (groups: WorkGroupInput[]) => Promise<{ ok: boolean; error?: string }>;
  /** The step is uploading — verbs are disabled to avoid racing the commit. */
  busy?: boolean;
  // ── ADDITIVE dashboard-only props (work-library-board) ─────────────────────
  // Every one defaults to today's onboarding behaviour, so ShowWorkStep (which
  // passes none of them) renders IDENTICALLY.
  /**
   * How "hide" behaves. `'remove'` (default) = onboarding's D12 drop-from-array
   * (`hidePhoto`). `'flag'` = dashboard hide-not-destroy: sets `hidden:true`
   * (`setPhotoHidden`) so the photo stays in facts, renders dimmed here, and
   * offers a Restore affordance. Restore clears the flag (removes the key).
   */
  hideBehavior?: 'remove' | 'flag';
  /** When supplied, renders a per-group "Add photos" button (dashboard only). */
  onAddPhotos?: (groupIndex: number) => void;
  /**
   * When true, enables within-group photo reorder (drag onto another photo) plus
   * a group up/down reorder affordance. Off by default so the onboarding surface
   * is visually + behaviourally unchanged (photo drop-targets stay disabled →
   * only cross-group moves, exactly as today).
   */
  enableOrdering?: boolean;
  /** Suppress the hard-coded "Tidy up your groups" header (dashboard frames it). */
  hideHeader?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// One thumbnail — draggable, with blur-up paint + per-photo cover / hide verbs.
// ─────────────────────────────────────────────────────────────────────────────

function PhotoThumb({
  groupIndex,
  photoIndex,
  photo,
  blur,
  disabled,
  enableOrdering,
  onCover,
  onHide,
  onRestore,
}: {
  groupIndex: number;
  photoIndex: number;
  photo: Photo;
  blur?: string;
  disabled?: boolean;
  /** Dashboard: photo is a within-group reorder drop target when true. */
  enableOrdering?: boolean;
  onCover: () => void;
  onHide: () => void;
  /** Dashboard flag-mode: clear the `hidden` flag. */
  onRestore: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `photo:${groupIndex}:${photo.id}`,
    data: { groupIndex, photoId: photo.id },
    disabled,
  });
  // Reorder drop target — DISABLED unless ordering is on, so onboarding keeps
  // its today-behaviour (photos are not drop targets → only cross-group moves).
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `photoslot:${groupIndex}:${photo.id}`,
    data: { groupIndex, photoId: photo.id, kind: 'photo' },
    disabled: !enableOrdering,
  });

  // `hidden` is only ever set in dashboard flag-mode (onboarding removes instead),
  // so this dimmed + Restore branch never triggers in onboarding.
  const hidden = !!photo.hidden;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      data-testid={`correction-photo-${groupIndex}-${photoIndex}`}
      data-photo-url={photo.url}
      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-app-hairline ${
        isOver ? 'border-app-primary' : 'border-app-hairline'
      }`}
      style={{
        backgroundImage: blur ? `url("${blur}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: isDragging ? 0.4 : hidden ? 0.4 : 1,
      }}
    >
      {/* Drag handle covers the thumbnail body. */}
      <div
        {...listeners}
        {...attributes}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        aria-label={enableOrdering ? 'Drag to reorder or to another group' : 'Drag to another group'}
      >
        {photo.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={photo.alt ?? ''}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {photo.cover && (
        <span
          data-testid={`correction-cover-badge-${groupIndex}-${photoIndex}`}
          className="absolute left-1 top-1 rounded bg-app-ink/80 px-1 py-0.5 text-[10px] font-app-sans text-app-canvas"
        >
          Cover
        </span>
      )}

      <div className="absolute bottom-1 right-1 flex gap-1">
        {hidden ? (
          <button
            type="button"
            data-testid={`correction-restore-${groupIndex}-${photoIndex}`}
            title="Restore this photo"
            disabled={disabled}
            onClick={onRestore}
            className="rounded bg-app-canvas/90 p-0.5 text-app-ink hover:bg-app-canvas disabled:opacity-40"
          >
            <AppIcon name="visibility" size={14} />
          </button>
        ) : (
          <>
            <button
              type="button"
              data-testid={`correction-cover-${groupIndex}-${photoIndex}`}
              title="Use as cover"
              disabled={disabled}
              onClick={onCover}
              className="rounded bg-app-canvas/90 p-0.5 text-app-ink hover:bg-app-canvas disabled:opacity-40"
            >
              <AppIcon name={photo.cover ? 'star' : 'star_outline'} size={14} />
            </button>
            <button
              type="button"
              data-testid={`correction-hide-${groupIndex}-${photoIndex}`}
              title="Hide this photo"
              disabled={disabled}
              onClick={onHide}
              className="rounded bg-app-canvas/90 p-0.5 text-app-ink hover:bg-app-canvas disabled:opacity-40"
            >
              <AppIcon name="visibility_off" size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// One group card — droppable (drag target), rename, merge-select.
// ─────────────────────────────────────────────────────────────────────────────

function GroupCard({
  groupIndex,
  group,
  groupCount,
  blurByUrl,
  disabled,
  selected,
  editing,
  draftName,
  enableOrdering,
  onToggleSelect,
  onStartRename,
  onDraftName,
  onCommitRename,
  onCover,
  onHide,
  onRestore,
  onAddPhotos,
  onMoveGroup,
}: {
  groupIndex: number;
  group: WorkGroupInput;
  groupCount: number;
  blurByUrl: Record<string, string>;
  disabled?: boolean;
  selected: boolean;
  editing: boolean;
  draftName: string;
  enableOrdering?: boolean;
  onToggleSelect: () => void;
  onStartRename: () => void;
  onDraftName: (v: string) => void;
  onCommitRename: () => void;
  onCover: (photoId: string) => void;
  onHide: (photoId: string) => void;
  onRestore: (photoId: string) => void;
  /** Dashboard: render a per-group "Add photos" button when supplied. */
  onAddPhotos?: (groupIndex: number) => void;
  /** Dashboard: reorder this group by `delta` (-1 up, +1 down). */
  onMoveGroup?: (delta: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `group:${groupIndex}`,
    data: { groupIndex },
  });
  const photos = group.photos ?? [];

  return (
    <div
      ref={setNodeRef}
      data-testid={`correction-group-${groupIndex}`}
      className={`rounded-lg border p-3 transition-colors ${
        isOver ? 'border-app-primary bg-app-tint' : 'border-app-hairline bg-app-surface'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          data-testid={`correction-select-${groupIndex}`}
          checked={selected}
          disabled={disabled}
          onChange={onToggleSelect}
          aria-label={`Select ${group.name} to merge`}
          className="h-4 w-4"
        />
        {editing ? (
          <input
            type="text"
            autoFocus
            data-testid={`correction-rename-input-${groupIndex}`}
            value={draftName}
            disabled={disabled}
            onChange={(e) => onDraftName(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitRename();
            }}
            className="font-app-sans text-sm font-medium text-app-ink bg-app-canvas border border-app-hairline rounded px-2 py-1"
          />
        ) : (
          <button
            type="button"
            data-testid={`correction-group-name-${groupIndex}`}
            disabled={disabled}
            onClick={onStartRename}
            className="font-app-sans text-sm font-medium text-app-ink inline-flex items-center gap-1 hover:text-app-primary"
          >
            {group.name}
            <AppIcon name="edit" size={13} className="text-app-muted" />
          </button>
        )}
        <span className="ml-auto font-app-sans text-xs text-app-placeholder">
          {photos.length} photo{photos.length === 1 ? '' : 's'}
        </span>
        {enableOrdering && onMoveGroup && (
          <span className="flex items-center gap-0.5">
            <button
              type="button"
              data-testid={`correction-group-up-${groupIndex}`}
              title="Move group up"
              disabled={disabled || groupIndex === 0}
              onClick={() => onMoveGroup(-1)}
              className="rounded p-0.5 text-app-ink hover:bg-app-tint disabled:opacity-30"
            >
              <AppIcon name="arrow_upward" size={14} />
            </button>
            <button
              type="button"
              data-testid={`correction-group-down-${groupIndex}`}
              title="Move group down"
              disabled={disabled || groupIndex === groupCount - 1}
              onClick={() => onMoveGroup(1)}
              className="rounded p-0.5 text-app-ink hover:bg-app-tint disabled:opacity-30"
            >
              <AppIcon name="arrow_downward" size={14} />
            </button>
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {photos.map((p, pi) => (
          <PhotoThumb
            key={p.id}
            groupIndex={groupIndex}
            photoIndex={pi}
            photo={p}
            blur={p.url ? blurByUrl[p.url] : undefined}
            disabled={disabled}
            enableOrdering={enableOrdering}
            onCover={() => onCover(p.id)}
            onHide={() => onHide(p.id)}
            onRestore={() => onRestore(p.id)}
          />
        ))}
        {photos.length === 0 && (
          <p className="font-app-sans text-xs text-app-placeholder py-6">
            No photos here — drag some in.
          </p>
        )}
      </div>

      {onAddPhotos && (
        <div className="mt-2">
          <button
            type="button"
            data-testid={`correction-add-photos-${groupIndex}`}
            disabled={disabled}
            onClick={() => onAddPhotos(groupIndex)}
            className="inline-flex items-center gap-1 rounded border border-app-hairline px-2 py-1 font-app-sans text-xs text-app-ink hover:bg-app-tint disabled:opacity-40"
          >
            <AppIcon name="add" size={14} />
            Add photos
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The board
// ─────────────────────────────────────────────────────────────────────────────

export default function CorrectionBoard({
  groups: initialGroups,
  blurByUrl,
  onCommit,
  busy,
  hideBehavior = 'remove',
  onAddPhotos,
  enableOrdering = false,
  hideHeader = false,
}: CorrectionBoardProps) {
  const [groups, setGroups] = useState<WorkGroupInput[]>(initialGroups);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The board is keyed on the upload nonce by ShowWorkStep, so a NEW upload
  // remounts it with fresh committed groups. This effect only catches the rare
  // same-key prop refresh (defensive); it never fights the board's own drives.
  const lastInitial = useRef(initialGroups);
  useEffect(() => {
    if (lastInitial.current !== initialGroups) {
      lastInitial.current = initialGroups;
      setGroups(initialGroups);
      setSelected(new Set());
      setEditingIndex(null);
    }
  }, [initialGroups]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const disabled = busy || saving;

  /** Optimistic-set then commit through the D10 funnel; revert + toast on fail. */
  async function drive(next: WorkGroupInput[]) {
    if (next === groups) return; // a no-op verb
    const prev = groups;
    setGroups(next);
    setError(null);
    setSaving(true);
    try {
      const res = await onCommit(next);
      if (!res.ok) {
        setGroups(prev);
        setError(res.error ?? 'That change could not be saved.');
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleSelect(i: number) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  function startRename(i: number) {
    setEditingIndex(i);
    setDraftName(groups[i]?.name ?? '');
  }

  async function commitRename() {
    const i = editingIndex;
    if (i === null) return;
    setEditingIndex(null);
    const name = draftName.trim();
    if (!name || name === groups[i]?.name) return; // empty ⇒ discard (never a blank group)
    await drive(renameGroup(groups, i, name));
  }

  async function doMerge() {
    const indices = [...selected];
    if (indices.length < 2) return;
    const { groups: next } = mergeGroups(groups, indices);
    setSelected(new Set());
    await drive(next);
  }

  async function onDragEnd(e: DragEndEvent) {
    const from = e.active.data.current as { groupIndex: number; photoId: string } | undefined;
    const to = e.over?.data.current as
      | { groupIndex: number; photoId?: string; kind?: string }
      | undefined;
    if (!from || !to) return;
    // Dashboard reorder: dropped onto a photo slot (only registered when
    // `enableOrdering` — in onboarding photo slots are disabled so this never fires).
    if (enableOrdering && to.kind === 'photo') {
      if (to.groupIndex === from.groupIndex) {
        const photos = groups[from.groupIndex]?.photos ?? [];
        const toPos = photos.findIndex((p) => p.id === to.photoId);
        await drive(reorderPhoto(groups, from.groupIndex, from.photoId, toPos));
        return;
      }
      // Cross-group drop onto a photo → move into that group (end).
      await drive(movePhoto(groups, from.groupIndex, from.photoId, to.groupIndex));
      return;
    }
    await drive(movePhoto(groups, from.groupIndex, from.photoId, to.groupIndex));
  }

  /** Hide verb — dashboard flag-mode sets `hidden:true`; onboarding removes (D12). */
  function onHidePhoto(groupIndex: number, photoId: string) {
    return hideBehavior === 'flag'
      ? drive(setPhotoHidden(groups, groupIndex, photoId, true))
      : drive(hidePhoto(groups, groupIndex, photoId));
  }

  /** Restore verb — clear the `hidden` flag (dashboard flag-mode only). */
  function onRestorePhoto(groupIndex: number, photoId: string) {
    return drive(setPhotoHidden(groups, groupIndex, photoId, false));
  }

  /** Group reorder — dashboard only (onboarding never renders the affordance). */
  function onMoveGroup(index: number, delta: number) {
    return drive(moveGroup(groups, index, index + delta));
  }

  if (groups.length === 0) return null;

  return (
    <div data-testid="correction-board" className="space-y-3">
      <div className="flex items-center justify-between">
        {!hideHeader && (
          <p className="font-app-sans text-sm text-app-ink">Tidy up your groups</p>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          data-testid="correction-merge"
          disabled={disabled || selected.size < 2}
          onClick={doMerge}
        >
          <AppIcon name="merge" size={15} className="mr-1" />
          Merge selected
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="space-y-2">
          {groups.map((g, i) => (
            <GroupCard
              key={i}
              groupIndex={i}
              group={g}
              groupCount={groups.length}
              blurByUrl={blurByUrl}
              disabled={disabled}
              selected={selected.has(i)}
              editing={editingIndex === i}
              draftName={draftName}
              enableOrdering={enableOrdering}
              onToggleSelect={() => toggleSelect(i)}
              onStartRename={() => startRename(i)}
              onDraftName={setDraftName}
              onCommitRename={commitRename}
              onCover={(photoId) => drive(pickCover(groups, i, photoId))}
              onHide={(photoId) => onHidePhoto(i, photoId)}
              onRestore={(photoId) => onRestorePhoto(i, photoId)}
              onAddPhotos={onAddPhotos}
              onMoveGroup={enableOrdering ? (delta) => onMoveGroup(i, delta) : undefined}
            />
          ))}
        </div>
      </DndContext>

      {error && (
        <p className="font-app-sans text-sm text-app-danger" role="alert" data-testid="correction-error">
          {error}
        </p>
      )}
    </div>
  );
}
