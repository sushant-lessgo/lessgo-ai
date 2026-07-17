// ============================================================================
// proposeGroups — the "no homework" grouping proposal (E2 · D11).
//
// Pure function ⇒ pure tests. The trust order (folders → same-day EXIF → single
// "Gallery" fallback), the cap (per-group 24 / total 150, deterministic drop),
// the {kept,dropped} accounting, and the merge policy are all locked here.
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  proposeGroups,
  mergeProposalIntoGroups,
  PHOTOS_PER_GROUP_CAP,
  PHOTOS_TOTAL_CAP,
  type ProposePhotoInput,
} from './proposeGroups';
import { normalizeWorkGroup, type WorkGroupInput } from '@/modules/wizard/work/rail';

// Local-component Date so the day split is timezone-stable on any runner.
const d = (y: number, mo: number, day: number, h = 12, mi = 0) =>
  new Date(y, mo - 1, day, h, mi, 0);

const photo = (over: Partial<ProposePhotoInput> & { name: string }): ProposePhotoInput => ({
  url: `https://cdn.example.com/${over.name}`,
  ...over,
});

// ─────────────────────────────────────────────────────────────────────────────
// Trust order
// ─────────────────────────────────────────────────────────────────────────────

describe('proposeGroups — trust order', () => {
  it('FOLDER PATHS win: a subfolder = a group (even when dates are present)', () => {
    const p = proposeGroups([
      photo({ name: 'a.jpg', relativePath: 'Shoots/Weddings/a.jpg', takenAt: d(2023, 6, 1) }),
      photo({ name: 'b.jpg', relativePath: 'Shoots/Weddings/b.jpg', takenAt: d(2024, 1, 9) }),
      photo({ name: 'c.jpg', relativePath: 'Shoots/Portraits/c.jpg', takenAt: d(2023, 6, 1) }),
    ]);
    expect(p.groups.map((g) => g.name)).toEqual(['Weddings', 'Portraits']);
    expect(p.groups[0].photos.map((x) => x.name)).toEqual(['a.jpg', 'b.jpg']);
    expect(p.groups[1].photos.map((x) => x.name)).toEqual(['c.jpg']);
  });

  it('files sitting directly in the picked ROOT share the root group', () => {
    const p = proposeGroups([
      photo({ name: 'a.jpg', relativePath: 'MyWork/a.jpg' }),
      photo({ name: 'b.jpg', relativePath: 'MyWork/Sub/b.jpg' }),
    ]);
    expect(p.groups.map((g) => g.name)).toEqual(['MyWork', 'Sub']);
  });

  it('SAME-DAY EXIF clusters when there are no folders', () => {
    const p = proposeGroups([
      photo({ name: 'm1.jpg', takenAt: d(2023, 6, 14, 9) }),
      photo({ name: 'm2.jpg', takenAt: d(2023, 6, 14, 17) }),
      photo({ name: 'n1.jpg', takenAt: d(2023, 6, 20, 10) }),
    ]);
    expect(p.groups.length).toBe(2);
    expect(p.groups[0].photos.map((x) => x.name)).toEqual(['m1.jpg', 'm2.jpg']);
    expect(p.groups[1].photos.map((x) => x.name)).toEqual(['n1.jpg']);
  });

  it('MIDNIGHT / timezone edge: 23:59 and 00:01 next day are DIFFERENT groups', () => {
    const p = proposeGroups([
      photo({ name: 'late.jpg', takenAt: d(2023, 6, 14, 23, 59) }),
      photo({ name: 'early.jpg', takenAt: d(2023, 6, 15, 0, 1) }),
    ]);
    expect(p.groups.length).toBe(2);
  });

  it('same instant across two files stays ONE group (no spurious split)', () => {
    const p = proposeGroups([
      photo({ name: 'x.jpg', takenAt: d(2023, 6, 14, 0, 0) }),
      photo({ name: 'y.jpg', takenAt: d(2023, 6, 14, 23, 59) }),
    ]);
    expect(p.groups.length).toBe(1);
    expect(p.groups[0].name).toBe('Jun 14, 2023');
  });

  it('NO signal at all ⇒ a single "Gallery" fallback', () => {
    const p = proposeGroups([photo({ name: 'a.jpg' }), photo({ name: 'b.jpg' })]);
    expect(p.groups.map((g) => g.name)).toEqual(['Gallery']);
    expect(p.groups[0].photos.length).toBe(2);
  });

  it('dateless files in DATE mode land in the Gallery fallback group', () => {
    const p = proposeGroups([
      photo({ name: 'dated.jpg', takenAt: d(2023, 6, 14) }),
      photo({ name: 'none.jpg' }),
    ]);
    expect(p.groups.map((g) => g.name)).toEqual(['Jun 14, 2023', 'Gallery']);
  });

  it('empty input ⇒ empty proposal', () => {
    expect(proposeGroups([])).toEqual({ groups: [], totalKept: 0, totalDropped: 0 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Caps (D11)
// ─────────────────────────────────────────────────────────────────────────────

describe('proposeGroups — caps + deterministic drop (D11)', () => {
  it('per-group cap 24: keeps earliest by capture date, surfaces {kept,dropped}', () => {
    // 31 photos, one folder — reverse-chronological input to prove the sort.
    const files = Array.from({ length: 31 }, (_, i) =>
      photo({
        name: `p${i}.jpg`,
        relativePath: `Root/Weddings/p${i}.jpg`,
        // i=0 is the LATEST; i=30 is the EARLIEST.
        takenAt: d(2023, 6, 1, 0, 31 - i),
      })
    );
    const p = proposeGroups(files);
    expect(p.groups.length).toBe(1);
    expect(p.groups[0].kept).toBe(PHOTOS_PER_GROUP_CAP);
    expect(p.groups[0].dropped).toBe(31 - PHOTOS_PER_GROUP_CAP);
    // Earliest 24 survive ⇒ the LATEST 7 (i=0..6) are dropped; kept starts at the
    // earliest (i=30) and is ordered ascending by time.
    const keptNames = p.groups[0].photos.map((x) => x.name);
    expect(keptNames[0]).toBe('p30.jpg'); // earliest
    expect(keptNames).not.toContain('p0.jpg'); // latest, dropped
  });

  it('ties (no dates) fall back to original file order', () => {
    const files = Array.from({ length: 26 }, (_, i) =>
      photo({ name: `q${i}.jpg`, relativePath: `Root/G/q${i}.jpg` })
    );
    const p = proposeGroups(files);
    expect(p.groups[0].kept).toBe(24);
    expect(p.groups[0].photos.map((x) => x.name).slice(0, 3)).toEqual(['q0.jpg', 'q1.jpg', 'q2.jpg']);
    expect(p.groups[0].dropped).toBe(2);
  });

  it('total cap 150: earliest-dated survive across groups; the rest are dropped', () => {
    // 200 single-photo day-groups (each a distinct, successively-later day so
    // the per-group cap never binds and only the 150 total cap does).
    const files = Array.from({ length: 200 }, (_, i) =>
      photo({ name: `s${i}.jpg`, takenAt: d(2020, 1, 1 + i) })
    );
    const p = proposeGroups(files);
    expect(p.totalKept).toBe(PHOTOS_TOTAL_CAP);
    expect(p.totalDropped).toBe(200 - PHOTOS_TOTAL_CAP);
    const kept = p.groups.filter((g) => g.kept > 0).length;
    expect(kept).toBe(PHOTOS_TOTAL_CAP);
  });

  it('kept + dropped == input length (nothing vanishes silently)', () => {
    const files = Array.from({ length: 60 }, (_, i) =>
      photo({ name: `t${i}.jpg`, relativePath: `Root/${i % 2 === 0 ? 'A' : 'B'}/t${i}.jpg` })
    );
    const p = proposeGroups(files);
    expect(p.totalKept + p.totalDropped).toBe(60);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Merge policy
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeProposalIntoGroups — attach vs append', () => {
  const existing = (): WorkGroupInput[] => [
    { name: 'Weddings', kind: 'category', price: { mode: 'on-request' } },
    {
      name: 'Portraits',
      kind: 'category',
      price: { mode: 'from', amount: 300 },
      photos: [{ id: 'pre1', url: 'https://cdn.example.com/pre1.jpg', cover: true }],
    },
  ];

  it('CASE-INSENSITIVE name match ATTACHES photos to the existing group, preserving kind/price', () => {
    const proposal = proposeGroups([
      photo({ name: 'w1.jpg', relativePath: 'Root/weddings/w1.jpg' }),
    ]);
    const merged = mergeProposalIntoGroups(proposal, existing());
    expect(merged.map((g) => g.name)).toEqual(['Weddings', 'Portraits']);
    const weddings = merged[0];
    expect(weddings.kind).toBe('category');
    expect(weddings.price).toEqual({ mode: 'on-request' });
    expect(weddings.photos?.map((p) => p!.url)).toEqual(['https://cdn.example.com/w1.jpg']);
  });

  it('appends onto an existing group WITHOUT clobbering its prior photos or cover', () => {
    const proposal = proposeGroups([
      photo({ name: 'p2.jpg', relativePath: 'Root/Portraits/p2.jpg' }),
    ]);
    const merged = mergeProposalIntoGroups(proposal, existing());
    const portraits = merged[1];
    expect(portraits.photos?.map((p) => p!.id)).toEqual(['pre1', 'https://cdn.example.com/p2.jpg']);
    // The pre-existing cover is NOT displaced; the appended photo is not a 2nd cover.
    expect(portraits.photos?.filter((p) => p!.cover).length).toBe(1);
    expect(portraits.photos?.[0]!.cover).toBe(true);
  });

  it('UNMATCHED groups append as NEW groups via seed defaults — never kind-less (landmine 6)', () => {
    const proposal = proposeGroups([
      photo({ name: 'n1.jpg', relativePath: 'Root/Newborns/n1.jpg' }),
    ]);
    const merged = mergeProposalIntoGroups(proposal, existing());
    expect(merged.map((g) => g.name)).toEqual(['Weddings', 'Portraits', 'Newborns']);
    const newborns = merged[2];
    expect(newborns.kind).toBe('category');
    expect(newborns.price).toEqual({ mode: 'on-request' });
    // The new group's first photo is its cover.
    expect(newborns.photos?.[0]!.cover).toBe(true);
  });

  it('url-less proposal photos are dropped (a photo that cannot render is not committed)', () => {
    const proposal = proposeGroups([
      { name: 'no-url.jpg', relativePath: 'Root/Weddings/no-url.jpg' }, // no url
    ]);
    const merged = mergeProposalIntoGroups(proposal, existing());
    expect(merged[0].photos ?? []).toEqual([]);
  });

  it('the merged output survives the rail commit gate (WorkFactsSchema) — kind + photos valid', () => {
    const proposal = proposeGroups([
      photo({ name: 'w1.jpg', relativePath: 'Root/Weddings/w1.jpg' }),
      photo({ name: 'n1.jpg', relativePath: 'Root/Newborns/n1.jpg' }),
    ]);
    const merged = mergeProposalIntoGroups(proposal, existing());
    // normalizeWorkGroup is the rail's per-group gate; every merged group must pass.
    for (const g of merged) {
      const normalized = normalizeWorkGroup(g);
      expect(normalized, `group "${g.name}" failed normalization`).not.toBeNull();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeWorkGroup PRESERVES photos (the D1 payload the whole slice protects)
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeWorkGroup — photos preservation (verify; fix rail.ts only if this fails)', () => {
  it('carries photos through verbatim', () => {
    const g = normalizeWorkGroup({
      name: 'Weddings',
      photos: [{ id: 'a', url: 'https://cdn.example.com/a.jpg', cover: true }],
    });
    expect(g).not.toBeNull();
    expect(g!.photos).toEqual([{ id: 'a', url: 'https://cdn.example.com/a.jpg', cover: true }]);
  });

  it('a group with NO photos key stays photo-less (never `{photos: undefined}` noise)', () => {
    const g = normalizeWorkGroup({ name: 'Weddings' });
    expect(g).not.toBeNull();
    expect('photos' in g!).toBe(false);
  });
});
