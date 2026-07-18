// ============================================================================
// correctionReducer — the FIVE correction verbs as pure transforms (E2 · P4).
//
// This file is the GATE OF RECORD for verb semantics (the e2e drag is
// best-effort; here the transforms are pinned deterministically). Each verb is
// checked for: correct effect, immutability of the input, cover-exclusivity
// where relevant, and the D12 rule that "hide" drops from the group's photos[]
// (and touches nothing else — no MediaAsset concept exists in this pure layer).
// ============================================================================

import { describe, it, expect } from 'vitest';
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
import { PHOTOS_PER_GROUP_CAP } from '@/modules/wizard/work/ingest/proposeGroups';
import type { WorkGroupInput } from '@/modules/wizard/work/rail';

type Photo = NonNullable<WorkGroupInput['photos']>[number];

const photo = (id: string, cover?: boolean): Photo =>
  cover ? { id, url: `https://cdn/${id}.jpg`, cover: true } : { id, url: `https://cdn/${id}.jpg` };

/** Two groups: Weddings [w1(cover), w2], Portraits [p1]. */
function base(): WorkGroupInput[] {
  return [
    {
      name: 'Weddings',
      kind: 'category',
      price: { mode: 'on-request' },
      photos: [photo('w1', true), photo('w2')],
    },
    {
      name: 'Portraits',
      kind: 'category',
      price: { mode: 'on-request' },
      photos: [photo('p1')],
    },
  ];
}

const urls = (g: WorkGroupInput) => (g.photos ?? []).map((p) => p.id);
const coverOf = (g: WorkGroupInput) => (g.photos ?? []).find((p) => p.cover)?.id ?? null;

// ─────────────────────────────────────────────────────────────────────────────
// 1. rename
// ─────────────────────────────────────────────────────────────────────────────

describe('renameGroup', () => {
  it('renames the target group and preserves its photos / kind / price', () => {
    const g = base();
    const out = renameGroup(g, 0, 'Wedding days');
    expect(out[0].name).toBe('Wedding days');
    expect(urls(out[0])).toEqual(['w1', 'w2']);
    expect(out[0].kind).toBe('category');
    expect(out[1].name).toBe('Portraits');
  });

  it('does NOT mutate the input', () => {
    const g = base();
    renameGroup(g, 0, 'X');
    expect(g[0].name).toBe('Weddings');
  });

  it('out-of-range index is a no-op', () => {
    const g = base();
    expect(renameGroup(g, 5, 'X')).toBe(g);
    expect(renameGroup(g, -1, 'X')).toBe(g);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. merge
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeGroups', () => {
  it('concatenates photos into the earliest group and drops the others', () => {
    const g = base();
    const { groups, kept, dropped } = mergeGroups(g, [0, 1]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Weddings'); // earliest group's identity
    expect(urls(groups[0])).toEqual(['w1', 'w2', 'p1']);
    expect(kept).toBe(3);
    expect(dropped).toBe(0);
  });

  it('collapses duplicate covers to the FIRST encountered (cover stays exclusive)', () => {
    const g: WorkGroupInput[] = [
      { name: 'A', kind: 'category', price: { mode: 'on-request' }, photos: [photo('a1', true)] },
      { name: 'B', kind: 'category', price: { mode: 'on-request' }, photos: [photo('b1', true)] },
    ];
    const { groups } = mergeGroups(g, [0, 1]);
    const covers = (groups[0].photos ?? []).filter((p) => p.cover);
    expect(covers).toHaveLength(1);
    expect(covers[0].id).toBe('a1'); // first group's cover wins
  });

  it('re-caps the merged group at 24 with {kept,dropped} (never a silent drop)', () => {
    const big = (name: string, from: number, count: number): WorkGroupInput => ({
      name,
      kind: 'category',
      price: { mode: 'on-request' },
      photos: Array.from({ length: count }, (_, i) => photo(`${name}-${from + i}`)),
    });
    const g = [big('A', 0, 20), big('B', 0, 20)]; // 40 concatenated
    const { groups, kept, dropped } = mergeGroups(g, [0, 1]);
    expect(kept).toBe(PHOTOS_PER_GROUP_CAP); // 24
    expect(dropped).toBe(40 - PHOTOS_PER_GROUP_CAP); // 16
    expect(groups[0].photos).toHaveLength(PHOTOS_PER_GROUP_CAP);
    // Earliest survive: the first 24 of the concat order (A's 20 + B's first 4).
    expect(urls(groups[0]).slice(0, 20).every((u) => u.startsWith('A-'))).toBe(true);
    expect(urls(groups[0]).slice(20)).toEqual(['B-0', 'B-1', 'B-2', 'B-3']);
  });

  it('merges 3+ groups; order-independent index set, keeps the lowest index', () => {
    const g: WorkGroupInput[] = [
      { name: 'A', kind: 'category', price: { mode: 'on-request' }, photos: [photo('a')] },
      { name: 'B', kind: 'category', price: { mode: 'on-request' }, photos: [photo('b')] },
      { name: 'C', kind: 'category', price: { mode: 'on-request' }, photos: [photo('c')] },
    ];
    const { groups } = mergeGroups(g, [2, 0, 1]); // unsorted, de-dupe safe
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('A');
    expect(urls(groups[0])).toEqual(['a', 'b', 'c']);
  });

  it('fewer than 2 distinct valid indices is a no-op', () => {
    const g = base();
    expect(mergeGroups(g, [0]).groups).toBe(g);
    expect(mergeGroups(g, [0, 0]).groups).toBe(g);
    expect(mergeGroups(g, [9, 0]).groups).toBe(g); // 9 filtered out ⇒ only 0 left
  });

  it('does NOT mutate the input', () => {
    const g = base();
    mergeGroups(g, [0, 1]);
    expect(g).toHaveLength(2);
    expect(urls(g[0])).toEqual(['w1', 'w2']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. movePhoto (drag-between)
// ─────────────────────────────────────────────────────────────────────────────

describe('movePhoto', () => {
  it('moves a photo from one group to the end of another', () => {
    const g = base();
    const out = movePhoto(g, 0, 'w2', 1);
    expect(urls(out[0])).toEqual(['w1']);
    expect(urls(out[1])).toEqual(['p1', 'w2']);
  });

  it('a moved photo LOSES its cover flag (never a second cover in the target)', () => {
    const g = base(); // w1 is Weddings' cover
    const out = movePhoto(g, 0, 'w1', 1);
    expect(coverOf(out[0])).toBeNull(); // source lost its cover
    expect((out[1].photos ?? []).some((p) => p.cover)).toBe(false); // target has none
    expect(urls(out[1])).toEqual(['p1', 'w1']);
  });

  it('unknown photo / same group / bad index ⇒ no-op', () => {
    const g = base();
    expect(movePhoto(g, 0, 'nope', 1)).toBe(g);
    expect(movePhoto(g, 0, 'w1', 0)).toBe(g);
    expect(movePhoto(g, 0, 'w1', 9)).toBe(g);
  });

  it('does NOT mutate the input', () => {
    const g = base();
    movePhoto(g, 0, 'w2', 1);
    expect(urls(g[0])).toEqual(['w1', 'w2']);
    expect(urls(g[1])).toEqual(['p1']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. hidePhoto (D12 — drops from photos[], nothing else)
// ─────────────────────────────────────────────────────────────────────────────

describe('hidePhoto', () => {
  it('drops the photo from the group photos[] (the whole of D12)', () => {
    const g = base();
    const out = hidePhoto(g, 0, 'w2');
    expect(urls(out[0])).toEqual(['w1']);
    expect(out[1]).toBe(g[1]); // untouched group is the same reference
  });

  it('unknown group / photo ⇒ no-op', () => {
    const g = base();
    expect(hidePhoto(g, 0, 'nope')).toBe(g);
    expect(hidePhoto(g, 9, 'w1')).toBe(g);
  });

  it('does NOT mutate the input', () => {
    const g = base();
    hidePhoto(g, 0, 'w1');
    expect(urls(g[0])).toEqual(['w1', 'w2']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. pickCover (exclusive per group)
// ─────────────────────────────────────────────────────────────────────────────

describe('pickCover', () => {
  it('marks exactly one cover and CLEARS the previous cover (exclusive)', () => {
    const g = base(); // w1 is the current cover
    const out = pickCover(g, 0, 'w2');
    const covers = (out[0].photos ?? []).filter((p) => p.cover);
    expect(covers).toHaveLength(1);
    expect(covers[0].id).toBe('w2');
    // The old cover no longer carries the flag (key omitted, not set false).
    expect((out[0].photos ?? []).find((p) => p.id === 'w1')).toEqual({
      id: 'w1',
      url: 'https://cdn/w1.jpg',
    });
  });

  it('picking cover in one group leaves other groups untouched', () => {
    const g = base();
    const out = pickCover(g, 1, 'p1');
    expect(out[0]).toBe(g[0]);
    expect(coverOf(out[1])).toBe('p1');
  });

  it('unknown group / photo ⇒ no-op', () => {
    const g = base();
    expect(pickCover(g, 0, 'nope')).toBe(g);
    expect(pickCover(g, 9, 'w1')).toBe(g);
  });

  it('does NOT mutate the input', () => {
    const g = base();
    pickCover(g, 0, 'w2');
    expect(coverOf(g[0])).toBe('w1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. setPhotoHidden (dashboard hide/restore — flag, not removal · board verb)
// ─────────────────────────────────────────────────────────────────────────────

describe('setPhotoHidden', () => {
  it('sets hidden:true WITHOUT removing the photo from photos[]', () => {
    const g = base();
    const out = setPhotoHidden(g, 0, 'w2', true);
    expect(urls(out[0])).toEqual(['w1', 'w2']); // still present
    const w2 = (out[0].photos ?? []).find((p) => p.id === 'w2');
    expect(w2?.hidden).toBe(true);
  });

  it('RESTORE removes the hidden KEY (never emits hidden:false)', () => {
    const g = base();
    const hiddenOnce = setPhotoHidden(g, 0, 'w2', true);
    const restored = setPhotoHidden(hiddenOnce, 0, 'w2', false);
    const w2 = (restored[0].photos ?? []).find((p) => p.id === 'w2');
    // Key omitted entirely — matches deriveWorksEntries's `!p?.hidden` reader.
    expect(w2).toEqual({ id: 'w2', url: 'https://cdn/w2.jpg' });
    expect('hidden' in (w2 as object)).toBe(false);
  });

  it('hidden flag round-trip (true then false) leaves the ref clean', () => {
    const g = base();
    const out = setPhotoHidden(setPhotoHidden(g, 0, 'w1', true), 0, 'w1', false);
    const w1 = (out[0].photos ?? []).find((p) => p.id === 'w1');
    // Original had cover:true — the round-trip must preserve it (only hidden toggled).
    expect(w1).toEqual({ id: 'w1', url: 'https://cdn/w1.jpg', cover: true });
  });

  it('restoring an already-visible photo is a no-op (same reference)', () => {
    const g = base();
    expect(setPhotoHidden(g, 0, 'w1', false)).toBe(g);
  });

  it('unknown group / photo ⇒ no-op', () => {
    const g = base();
    expect(setPhotoHidden(g, 0, 'nope', true)).toBe(g);
    expect(setPhotoHidden(g, 9, 'w1', true)).toBe(g);
    expect(setPhotoHidden(g, -1, 'w1', true)).toBe(g);
  });

  it('does NOT mutate the input', () => {
    const g = base();
    setPhotoHidden(g, 0, 'w2', true);
    const w2 = (g[0].photos ?? []).find((p) => p.id === 'w2');
    expect(w2?.hidden).toBeUndefined();
  });

  it('leaves other groups untouched (same reference)', () => {
    const g = base();
    const out = setPhotoHidden(g, 0, 'w1', true);
    expect(out[1]).toBe(g[1]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. reorderPhoto (within-group order · board verb)
// ─────────────────────────────────────────────────────────────────────────────

describe('reorderPhoto', () => {
  /** One group with three photos, w1 = cover. */
  const trio = (): WorkGroupInput[] => [
    {
      name: 'Weddings',
      kind: 'category',
      price: { mode: 'on-request' },
      photos: [photo('a', true), photo('b'), photo('c')],
    },
  ];

  it('moves a photo to a new position within the group', () => {
    const g = trio();
    const out = reorderPhoto(g, 0, 'c', 0);
    expect(urls(out[0])).toEqual(['c', 'a', 'b']);
  });

  it('moves a photo forward to a later position', () => {
    const g = trio();
    const out = reorderPhoto(g, 0, 'a', 2);
    expect(urls(out[0])).toEqual(['b', 'c', 'a']);
  });

  it('the cover survives a reorder (flag stays on the moved photo)', () => {
    const g = trio(); // a is the cover
    const out = reorderPhoto(g, 0, 'a', 2);
    expect(coverOf(out[0])).toBe('a');
    const a = (out[0].photos ?? []).find((p) => p.id === 'a');
    expect(a?.cover).toBe(true);
  });

  it('clamps an over-shooting toPos to the last position', () => {
    const g = trio();
    const out = reorderPhoto(g, 0, 'a', 99);
    expect(urls(out[0])).toEqual(['b', 'c', 'a']);
  });

  it('clamps a negative toPos to the first position', () => {
    const g = trio();
    const out = reorderPhoto(g, 0, 'c', -5);
    expect(urls(out[0])).toEqual(['c', 'a', 'b']);
  });

  it('moving to the current position is a no-op (same reference)', () => {
    const g = trio();
    expect(reorderPhoto(g, 0, 'a', 0)).toBe(g);
  });

  it('unknown group / photo ⇒ no-op', () => {
    const g = trio();
    expect(reorderPhoto(g, 0, 'nope', 1)).toBe(g);
    expect(reorderPhoto(g, 9, 'a', 1)).toBe(g);
    expect(reorderPhoto(g, -1, 'a', 1)).toBe(g);
  });

  it('does NOT mutate the input', () => {
    const g = trio();
    reorderPhoto(g, 0, 'a', 2);
    expect(urls(g[0])).toEqual(['a', 'b', 'c']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. moveGroup (group order · board verb)
// ─────────────────────────────────────────────────────────────────────────────

describe('moveGroup', () => {
  const three = (): WorkGroupInput[] => [
    { name: 'A', kind: 'category', price: { mode: 'on-request' }, photos: [photo('a')] },
    { name: 'B', kind: 'category', price: { mode: 'on-request' }, photos: [photo('b')] },
    { name: 'C', kind: 'category', price: { mode: 'on-request' }, photos: [photo('c')] },
  ];

  it('moves a group later in the order', () => {
    const g = three();
    const out = moveGroup(g, 0, 2);
    expect(out.map((x) => x.name)).toEqual(['B', 'C', 'A']);
  });

  it('moves a group earlier in the order', () => {
    const g = three();
    const out = moveGroup(g, 2, 0);
    expect(out.map((x) => x.name)).toEqual(['C', 'A', 'B']);
  });

  it('preserves each group photos on reorder', () => {
    const g = three();
    const out = moveGroup(g, 0, 1);
    expect(out.map((x) => x.name)).toEqual(['B', 'A', 'C']);
    expect(urls(out[1])).toEqual(['a']); // A's photos rode along
  });

  it('same position ⇒ no-op (same reference)', () => {
    const g = three();
    expect(moveGroup(g, 1, 1)).toBe(g);
  });

  it('out-of-range index ⇒ no-op', () => {
    const g = three();
    expect(moveGroup(g, 9, 0)).toBe(g);
    expect(moveGroup(g, 0, 9)).toBe(g);
    expect(moveGroup(g, -1, 0)).toBe(g);
  });

  it('does NOT mutate the input', () => {
    const g = three();
    moveGroup(g, 0, 2);
    expect(g.map((x) => x.name)).toEqual(['A', 'B', 'C']);
  });
});
