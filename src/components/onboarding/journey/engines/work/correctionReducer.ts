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
