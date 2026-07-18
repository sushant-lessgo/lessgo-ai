// src/modules/wizard/work/ingest/proposeGroups.ts
// ============================================================================
// GROUPING PROPOSAL (work-onboarding-ingestion E2 · D11).
//
// PURE + unit-testable. Turns a list of lightweight photo descriptors into a
// grouping proposal — "no homework": the user uploads and we guess the groups.
//
// ── TRUST ORDER (highest-confidence signal wins) ────────────────────────────
//   1. FOLDER PATHS — if any file carries a `relativePath` with a directory
//      (`webkitRelativePath`, captured client-side; it does NOT survive the
//      multipart upload, so paths are read locally at change time), group by the
//      immediate parent folder. A subfolder = a group.
//   2. SAME-DAY EXIF CLUSTERS — else, if any file carries a capture date, group
//      loose files by calendar day (local components, see `dayKey`).
//   3. SINGLE "Gallery" FALLBACK — no folder + no date signal ⇒ one group.
//
// ── CAP (D11 — enforced HERE, never silently) ───────────────────────────────
//   Per-group 24 (= `workdetailContract.photos.constraints.max`), total 150.
//   Deterministic drop: KEEP EARLIEST by capture date, then original file order.
//   Every group surfaces `{ kept, dropped }` so the UI can say "kept 24 of 31".
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   No react / stores / hooks / network / exifr. Types + the rail's
//   `normalizeWorkGroup` (pure) only. The commit funnel (D10) lives in
//   `ShowWorkStep`, not here.
// ============================================================================

import { normalizeWorkGroup, type WorkGroupInput } from '@/modules/wizard/work/rail';

/** Per-group photo cap — mirrors `workdetailContract.photos.constraints.max`. */
export const PHOTOS_PER_GROUP_CAP = 24;
/** Total photo cap across the whole proposal. */
export const PHOTOS_TOTAL_CAP = 150;

const GALLERY_FALLBACK_NAME = 'Gallery';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * A photo descriptor fed to the proposer. Carries whatever the caller has:
 * `ShowWorkStep` feeds `{ id: assetId, url, name, relativePath, takenAt }`
 * AFTER upload; a pure test can feed `{ name, relativePath, takenAt }` only.
 */
export interface ProposePhotoInput {
  /** Stable id (upload `assetId`). Falls back to `url` when absent (schema needs a non-empty id). */
  id?: string;
  /** Uploaded url — required to COMMIT (a url-less photo can't render). */
  url?: string;
  /** Original filename — sort tiebreak + display. */
  name: string;
  /** `webkitRelativePath` captured client-side (multipart strips it). */
  relativePath?: string;
  /** EXIF `DateTimeOriginal` (client-read, pre-upload). `null` = no date signal. */
  takenAt?: Date | null;
}

/** One proposed group, with cap accounting surfaced (D11). */
export interface ProposedGroup {
  name: string;
  /** The KEPT photos, in the deterministic order (earliest date, then file order). */
  photos: ProposePhotoInput[];
  kept: number;
  dropped: number;
}

export interface GroupProposal {
  groups: ProposedGroup[];
  totalKept: number;
  totalDropped: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal detection + keys
// ─────────────────────────────────────────────────────────────────────────────

const hasFolder = (p: ProposePhotoInput): boolean =>
  typeof p.relativePath === 'string' && p.relativePath.includes('/');

const hasDate = (p: ProposePhotoInput): boolean => p.takenAt instanceof Date;

/**
 * Immediate parent folder of a `relativePath`. `Root/Sub/img.jpg → "Sub"`,
 * `Root/img.jpg → "Root"`. A subfolder becomes its own group; files sitting
 * directly in the picked root share the root's group.
 */
function parentFolder(relativePath: string | undefined): string {
  if (!relativePath || !relativePath.includes('/')) return GALLERY_FALLBACK_NAME;
  const segments = relativePath.split('/').filter(Boolean);
  if (segments.length < 2) return GALLERY_FALLBACK_NAME;
  return segments[segments.length - 2];
}

/**
 * Calendar-day key from LOCAL date components. Local (not UTC) on purpose: exifr
 * revives EXIF `DateTimeOriginal` (which has no timezone) into a Date built from
 * its local components, so reading it back with `getFullYear/Month/Date` yields
 * the same calendar day on ANY runtime timezone — and a 23:59 shot and a 00:01
 * next-day shot land in DIFFERENT groups, which is the desired split.
 */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayLabel(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ordering — earliest capture date, then original file order (D11 drop rule)
// ─────────────────────────────────────────────────────────────────────────────

interface Indexed {
  photo: ProposePhotoInput;
  /** Original position in the input list — the stable tiebreak. */
  order: number;
}

/** Sort key: dated photos before undated (Infinity), then by original order. */
function timeKey(p: ProposePhotoInput): number {
  return p.takenAt instanceof Date ? p.takenAt.getTime() : Number.POSITIVE_INFINITY;
}

function byEarliestThenOrder(a: Indexed, b: Indexed): number {
  const ta = timeKey(a.photo);
  const tb = timeKey(b.photo);
  if (ta !== tb) return ta - tb;
  return a.order - b.order;
}

// ─────────────────────────────────────────────────────────────────────────────
// Proposal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the grouping proposal. PURE — same input, same output. Empty input ⇒
 * an empty proposal (no groups).
 */
export function proposeGroups(files: ProposePhotoInput[]): GroupProposal {
  const indexed: Indexed[] = files.map((photo, order) => ({ photo, order }));
  if (indexed.length === 0) return { groups: [], totalKept: 0, totalDropped: 0 };

  const useFolders = indexed.some((i) => hasFolder(i.photo));
  const useDates = !useFolders && indexed.some((i) => hasDate(i.photo));

  // Bucket into ordered groups. `Map` preserves first-seen insertion order, so
  // group order = the order each key first appears in the input.
  const buckets = new Map<string, { name: string; items: Indexed[] }>();
  const bucketFor = (key: string, name: string) => {
    let b = buckets.get(key);
    if (!b) {
      b = { name, items: [] };
      buckets.set(key, b);
    }
    return b;
  };

  for (const item of indexed) {
    if (useFolders) {
      const name = parentFolder(item.photo.relativePath);
      bucketFor(`folder:${name.toLowerCase()}`, name).items.push(item);
    } else if (useDates && item.photo.takenAt instanceof Date) {
      const key = dayKey(item.photo.takenAt);
      bucketFor(`day:${key}`, dayLabel(item.photo.takenAt)).items.push(item);
    } else {
      // No signal for this file (fallback mode, or a dateless file in date mode).
      bucketFor(`fallback:${GALLERY_FALLBACK_NAME.toLowerCase()}`, GALLERY_FALLBACK_NAME).items.push(item);
    }
  }

  // Per-group cap (24), deterministic order. Track dropped counts.
  let remainingGlobal = PHOTOS_TOTAL_CAP;
  const groups: ProposedGroup[] = [];

  for (const bucket of buckets.values()) {
    const ordered = [...bucket.items].sort(byEarliestThenOrder);
    // Per-group cap first.
    const groupCapKept = ordered.slice(0, PHOTOS_PER_GROUP_CAP);
    let dropped = ordered.length - groupCapKept.length;
    // Then the global cap — groups earlier in order fill the 150 budget first,
    // and within a group the earliest survive (the list is already sorted).
    const globalKept = groupCapKept.slice(0, Math.max(0, remainingGlobal));
    dropped += groupCapKept.length - globalKept.length;
    remainingGlobal -= globalKept.length;

    groups.push({
      name: bucket.name,
      photos: globalKept.map((i) => i.photo),
      kept: globalKept.length,
      dropped,
    });
  }

  const totalKept = groups.reduce((n, g) => n + g.kept, 0);
  const totalDropped = groups.reduce((n, g) => n + g.dropped, 0);
  return { groups, totalKept, totalDropped };
}

// ─────────────────────────────────────────────────────────────────────────────
// Merge — proposal → existing (entry-seeded) WorkGroupInput[]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Turn a proposed photo into a `WorkPhotoRef`-shaped object. Drops url-less
 * photos (a photo that can't render is not committed). `id` falls back to `url`
 * so it is always a non-empty string (`WorkPhotoRefSchema.id` is required).
 */
function toPhotoRef(
  p: ProposePhotoInput,
  cover: boolean
): NonNullable<WorkGroupInput['photos']>[number] | null {
  if (!p.url) return null;
  const ref: NonNullable<WorkGroupInput['photos']>[number] = { id: p.id ?? p.url, url: p.url };
  if (cover) ref.cover = true;
  return ref;
}

function refsFor(group: ProposedGroup, markFirstCover: boolean): NonNullable<WorkGroupInput['photos']> {
  const refs: NonNullable<WorkGroupInput['photos']> = [];
  group.photos.forEach((p, i) => {
    const ref = toPhotoRef(p, markFirstCover && i === 0);
    if (ref) refs.push(ref);
  });
  return refs;
}

/**
 * Attach a proposal's photos onto the existing (entry-seeded) groups.
 *
 *   • CASE-INSENSITIVE NAME MATCH → append the photos onto that existing group,
 *     preserving its `kind`/`price`/existing photos (the same non-destructive
 *     rule the rail chip-join lives by).
 *   • NO MATCH → append a NEW `WorkGroupInput` via `normalizeWorkGroup`'s seed
 *     defaults (`kind:'category'`, on-request price) — NEVER a `kind`-less group
 *     (landmine 6). Its first photo is marked cover.
 *
 * Returns a fresh `WorkGroupInput[]` (existing groups shallow-cloned, photos
 * arrays rebuilt) suitable for the D10 commit funnel
 * (`applyRailEdit({field:'groups', value}, liveFacts)` → `commitRail`).
 */
export function mergeProposalIntoGroups(
  proposal: GroupProposal,
  existingGroups: WorkGroupInput[]
): WorkGroupInput[] {
  const result: WorkGroupInput[] = existingGroups.map((g) => ({
    ...g,
    photos: g.photos ? [...g.photos] : undefined,
  }));

  for (const group of proposal.groups) {
    const matchIdx = result.findIndex(
      (g) => g.name.trim().toLowerCase() === group.name.trim().toLowerCase()
    );
    if (matchIdx >= 0) {
      const existing = result[matchIdx];
      const hasCover = (existing.photos ?? []).some((p) => p?.cover);
      // Only seed a cover from the proposal if the existing group has none.
      const refs = refsFor(group, !hasCover && (existing.photos ?? []).length === 0);
      existing.photos = [...(existing.photos ?? []), ...refs];
    } else {
      const seeded = normalizeWorkGroup({ name: group.name, photos: refsFor(group, true) });
      // `normalizeWorkGroup` only returns null for an empty name — proposal
      // group names are never empty (folder name / day label / "Gallery").
      if (seeded) result.push(seeded as WorkGroupInput);
    }
  }

  return result;
}
