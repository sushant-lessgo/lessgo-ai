// src/components/onboarding/journey/engines/work/correctionReducer.ts
// ============================================================================
// CORRECTION VERBS — pure group-array transforms (work-onboarding-ingestion E2 · P4).
//
// The five TAP-based correction verbs, expressed as PURE functions over the
// committed group shape (`WorkGroupInput[]`, photos = `WorkPhotoRef`). No DOM,
// no store, no hooks — the CorrectionBoard UI wires these on top and re-commits
// the FULL rebuilt array through the D10 funnel
// (`applyRailEdit({field:'groups'})` → `commitRail`) on every change.
//
// ── THE FIVE VERBS ──────────────────────────────────────────────────────────
//   1. rename         — set a group's name.
//   2. merge          — concatenate ≥2 groups' photos into the earliest, re-cap
//                       at 24 with {kept,dropped}; the merged group keeps ONE
//                       cover (first encountered wins — cover stays exclusive).
//   3. movePhoto      — drag a photo from one group to another (dnd verb). The
//                       moved photo LOSES its cover flag (a photo cannot arrive
//                       as a second cover in the target — cover stays exclusive).
//   4. hidePhoto      — PHOTO-level drop (D12): the photo is REMOVED from the
//                       group's photos[], so the commit funnel writes facts
//                       WITHOUT it. The MediaAsset row is never touched here —
//                       facts are the single binding truth (D1/D2), so a photo
//                       absent from facts never reaches entries / covers / item
//                       pages. Group-level removal is NOT a verb — it rides merge.
//   5. pickCover      — mark ONE photo `cover:true`, EXCLUSIVE per group (every
//                       other photo in that group has `cover` cleared).
//
// ── THREE ADDITIVE BOARD VERBS (work-library-board · dashboard-only) ─────────
//   The dashboard "Your work" board reuses this reducer with three extra pure
//   verbs. They are ADDITIVE — the five above are untouched, and onboarding's
//   CorrectionBoard (default props) never calls them, so its behaviour is
//   identical. Same purity / no-op / immutability contract as the five.
//   6. setPhotoHidden — set/clear the `hidden` flag on a photo ref (dashboard
//                       hide/restore). Does NOT remove from photos[] (that is
//                       onboarding's `hidePhoto`). RESTORE removes the `hidden`
//                       KEY (never emits `hidden:false`), matching how
//                       `deriveWorksEntries` reads the flag (`!p?.hidden`) and
//                       the phase-1 "never emit hidden:false" decision.
//   7. reorderPhoto   — within-group reorder (move a photo to a new position in
//                       the same group). Cover / hidden flags survive the move.
//   8. moveGroup      — reorder groups (drives gallery card order).
//
// ── PURITY / IMMUTABILITY ───────────────────────────────────────────────────
//   Every function returns a FRESH array; inputs are never mutated. Groups and
//   photo arrays are shallow-cloned only where they change. An out-of-range
//   index / unknown photo id is a NO-OP that returns the input array unchanged
//   (the board can never desync into a throw).
//
// ── CAP CONSISTENCY (D11) ───────────────────────────────────────────────────
//   `merge` re-caps the concatenated photos at `PHOTOS_PER_GROUP_CAP` (24),
//   keeping the earliest — which, since each source group's photos are ALREADY
//   in proposeGroups' earliest-first order, is simply the concat order (group
//   order, then within-group order). The 150 TOTAL cap is a separate belt at the
//   commit point (`clampGroupsToCap` in ShowWorkStep, CF-1).
// ============================================================================

import { PHOTOS_PER_GROUP_CAP } from '@/modules/wizard/work/ingest/proposeGroups';
import type { WorkGroupInput } from '@/modules/wizard/work/rail';

/** One committed photo ref — exactly `WorkPhotoRefSchema` (`{id,url?,alt?,cover?}`). */
type Photo = NonNullable<WorkGroupInput['photos']>[number];

/** Result of a merge — carries the cap accounting for the UI's "kept X of Y" line. */
export interface MergeResult {
  groups: WorkGroupInput[];
  /** Photos surviving the per-group cap in the merged group. */
  kept: number;
  /** Photos dropped by the per-group cap during the merge. */
  dropped: number;
}

const photosOf = (g: WorkGroupInput): Photo[] => g.photos ?? [];

/** Strip `cover` from a photo (omit the key rather than set it false). */
function withoutCover(p: Photo): Photo {
  if (!p.cover) return p;
  const { cover: _cover, ...rest } = p;
  return rest;
}

/** Keep the FIRST cover encountered; clear `cover` on any later duplicate. */
function dedupeCover(photos: Photo[]): Photo[] {
  let seen = false;
  return photos.map((p) => {
    if (p.cover) {
      if (seen) return withoutCover(p);
      seen = true;
    }
    return p;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. rename
// ─────────────────────────────────────────────────────────────────────────────

/** Set the group at `index`'s name. Out-of-range ⇒ no-op. */
export function renameGroup(
  groups: WorkGroupInput[],
  index: number,
  name: string
): WorkGroupInput[] {
  if (index < 0 || index >= groups.length) return groups;
  return groups.map((g, i) => (i === index ? { ...g, name } : g));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. merge
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge the groups at `indices` (≥2 distinct) into the EARLIEST of them. Photos
 * concatenate in group order (then within-group order), duplicate covers are
 * collapsed to the first, and the result is re-capped at `PHOTOS_PER_GROUP_CAP`.
 * The surviving group keeps the earliest group's name / kind / price. Fewer than
 * 2 valid indices ⇒ no-op (`{groups, kept, dropped:0}`).
 */
export function mergeGroups(
  groups: WorkGroupInput[],
  indices: number[]
): MergeResult {
  const targets = Array.from(new Set(indices))
    .filter((i) => i >= 0 && i < groups.length)
    .sort((a, b) => a - b);

  if (targets.length < 2) {
    return { groups, kept: 0, dropped: 0 };
  }

  const targetIdx = targets[0];
  const targetSet = new Set(targets);

  // Concatenate in group order, then within-group order (earliest-first already).
  let concat: Photo[] = [];
  for (const i of targets) concat = concat.concat(photosOf(groups[i]));
  concat = dedupeCover(concat);

  const kept = concat.slice(0, PHOTOS_PER_GROUP_CAP);
  const dropped = concat.length - kept.length;

  const result: WorkGroupInput[] = [];
  groups.forEach((g, i) => {
    if (i === targetIdx) {
      result.push({ ...g, photos: kept });
    } else if (!targetSet.has(i)) {
      result.push(g);
    }
    // else: a merged-away group — omitted.
  });

  return { groups: result, kept: kept.length, dropped };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. movePhoto (drag-between-groups)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move the photo `photoId` from `fromIndex` to the END of `toIndex`. The moved
 * photo LOSES its cover flag (it cannot arrive as a second cover — the target
 * keeps its own). Unknown group / photo, or from === to ⇒ no-op.
 */
export function movePhoto(
  groups: WorkGroupInput[],
  fromIndex: number,
  photoId: string,
  toIndex: number
): WorkGroupInput[] {
  if (fromIndex === toIndex) return groups;
  if (fromIndex < 0 || fromIndex >= groups.length) return groups;
  if (toIndex < 0 || toIndex >= groups.length) return groups;

  const photo = photosOf(groups[fromIndex]).find((p) => p.id === photoId);
  if (!photo) return groups;
  const moved = withoutCover(photo);

  return groups.map((g, i) => {
    if (i === fromIndex) {
      return { ...g, photos: photosOf(g).filter((p) => p.id !== photoId) };
    }
    if (i === toIndex) {
      return { ...g, photos: [...photosOf(g), moved] };
    }
    return g;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. hidePhoto (photo-level drop — D12)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop the photo `photoId` from the group at `groupIndex`. This is the whole of
 * "hide" (D12): the committed facts lose the photo; the MediaAsset row is NOT
 * touched (nothing here writes MediaAsset), so the photo stays re-addable from a
 * future library UI. Unknown group / photo ⇒ no-op.
 */
export function hidePhoto(
  groups: WorkGroupInput[],
  groupIndex: number,
  photoId: string
): WorkGroupInput[] {
  if (groupIndex < 0 || groupIndex >= groups.length) return groups;
  const before = photosOf(groups[groupIndex]);
  if (!before.some((p) => p.id === photoId)) return groups;
  return groups.map((g, i) =>
    i === groupIndex ? { ...g, photos: before.filter((p) => p.id !== photoId) } : g
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. pickCover (exclusive per group)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark `photoId` as the group's cover, EXCLUSIVELY — every other photo in that
 * group has `cover` cleared. Unknown group / photo ⇒ no-op.
 */
export function pickCover(
  groups: WorkGroupInput[],
  groupIndex: number,
  photoId: string
): WorkGroupInput[] {
  if (groupIndex < 0 || groupIndex >= groups.length) return groups;
  const photos = photosOf(groups[groupIndex]);
  if (!photos.some((p) => p.id === photoId)) return groups;
  return groups.map((g, i) => {
    if (i !== groupIndex) return g;
    return {
      ...g,
      photos: photos.map((p) =>
        p.id === photoId ? { ...withoutCover(p), cover: true } : withoutCover(p)
      ),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. setPhotoHidden (dashboard hide/restore — flag, NOT removal)
// ─────────────────────────────────────────────────────────────────────────────

/** Set `hidden:true`, or REMOVE the `hidden` key on restore (never `hidden:false`). */
function withHidden(p: Photo, hidden: boolean): Photo {
  if (hidden) {
    if (p.hidden) return p;
    return { ...p, hidden: true };
  }
  if (!p.hidden) return p;
  const { hidden: _hidden, ...rest } = p;
  return rest;
}

/**
 * Set (or clear) the `hidden` flag on `photoId` in the group at `groupIndex`
 * (dashboard hide/restore). Unlike onboarding's `hidePhoto`, the photo STAYS in
 * `photos[]` — `deriveWorksEntries` filters `hidden:true` at the single choke
 * point, so a hidden photo is off the live site but restorable in place. RESTORE
 * removes the `hidden` KEY (never emits `hidden:false`), matching the
 * `!p?.hidden` reader + the phase-1 "never emit hidden:false" decision. Unknown
 * group / photo ⇒ no-op.
 */
export function setPhotoHidden(
  groups: WorkGroupInput[],
  groupIndex: number,
  photoId: string,
  hidden: boolean
): WorkGroupInput[] {
  if (groupIndex < 0 || groupIndex >= groups.length) return groups;
  const photos = photosOf(groups[groupIndex]);
  const target = photos.find((p) => p.id === photoId);
  if (!target) return groups;
  if (!!target.hidden === hidden) return groups; // already in the requested state ⇒ no-op
  return groups.map((g, i) => {
    if (i !== groupIndex) return g;
    return {
      ...g,
      photos: photos.map((p) => (p.id === photoId ? withHidden(p, hidden) : p)),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. reorderPhoto (within-group order)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move `photoId` to position `toPos` within the group at `groupIndex` (the array
 * length is unchanged — a pure within-group reorder). `toPos` is clamped to the
 * valid range, so an over/under-shoot lands at the edge rather than dropping the
 * photo. Cover / hidden flags survive the move (they are carried on the photo
 * ref, untouched here). Unknown group / photo, or a move to the current
 * position ⇒ no-op.
 */
export function reorderPhoto(
  groups: WorkGroupInput[],
  groupIndex: number,
  photoId: string,
  toPos: number
): WorkGroupInput[] {
  if (groupIndex < 0 || groupIndex >= groups.length) return groups;
  const photos = photosOf(groups[groupIndex]);
  const from = photos.findIndex((p) => p.id === photoId);
  if (from === -1) return groups;
  const clamped = Math.max(0, Math.min(toPos, photos.length - 1));
  if (clamped === from) return groups;
  const next = photos.slice();
  const [moved] = next.splice(from, 1);
  next.splice(clamped, 0, moved);
  return groups.map((g, i) => (i === groupIndex ? { ...g, photos: next } : g));
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. moveGroup (group order — drives gallery card order)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move the group at `fromIndex` to `toIndex` (reorders the groups array — this
 * is the order the gallery / catalog cards render in). Out-of-range index or a
 * move to the same position ⇒ no-op.
 */
export function moveGroup(
  groups: WorkGroupInput[],
  fromIndex: number,
  toIndex: number
): WorkGroupInput[] {
  if (fromIndex < 0 || fromIndex >= groups.length) return groups;
  if (toIndex < 0 || toIndex >= groups.length) return groups;
  if (fromIndex === toIndex) return groups;
  const next = groups.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
