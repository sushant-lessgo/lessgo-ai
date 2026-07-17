// CF-1 belt test (work-onboarding-ingestion P5). Closes the one untested
// data-safety belt from P4 review: `clampGroupsToCap` (the D11 commit-point belt
// in ShowWorkStep) enforces BOTH the per-group 24 cap AND the cumulative 150
// total, earlier-groups-first. Correct-by-inspection in P4 but never directly
// exercised (it was private to ShowWorkStep). P5 exports it minimally + tests it.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { clampGroupsToCap } from './ShowWorkStep';
import {
  PHOTOS_PER_GROUP_CAP,
  PHOTOS_TOTAL_CAP,
} from '@/modules/wizard/work/ingest/proposeGroups';
import type { WorkGroupInput } from '@/modules/wizard/work/rail';

/** N photos with distinct urls tagged by group so ordering is provable. */
function photos(tag: string, n: number): NonNullable<WorkGroupInput['photos']> {
  return Array.from({ length: n }, (_, i) => ({
    id: `${tag}-${i}`,
    url: `https://blob/${tag}-${i}.webp`,
  })) as NonNullable<WorkGroupInput['photos']>;
}

function group(name: string, photoCount: number): WorkGroupInput {
  return { name, kind: 'category', photos: photos(name, photoCount) };
}

function count(groups: WorkGroupInput[]): number {
  return groups.reduce((n, g) => n + (g.photos?.length ?? 0), 0);
}

afterEach(() => vi.restoreAllMocks());

describe('clampGroupsToCap (CF-1 D11 belt)', () => {
  it('clamps a single group over the per-group cap to exactly 24', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const over = group('Weddings', PHOTOS_PER_GROUP_CAP + 6); // 30
    const [clamped] = clampGroupsToCap([over]);
    expect(clamped.photos).toHaveLength(PHOTOS_PER_GROUP_CAP);
    // Earliest-first within the group: the survivors are the first 24 by order.
    expect(clamped.photos?.map((p) => p.id)).toEqual(
      photos('Weddings', PHOTOS_PER_GROUP_CAP).map((p) => p.id)
    );
  });

  it('caps the cumulative total at 150 across groups, earlier groups first', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // 7 groups each already AT the per-group cap (24) ⇒ 168 raw, over the 150 total.
    const groups = Array.from({ length: 7 }, (_, i) =>
      group(`g${i}`, PHOTOS_PER_GROUP_CAP)
    );
    const clamped = clampGroupsToCap(groups);

    // Total is clamped to exactly 150.
    expect(count(clamped)).toBe(PHOTOS_TOTAL_CAP);

    // Earlier groups fill the budget: the first 6 (144) survive whole, the 7th
    // is truncated to the remaining 6, none are dropped from earlier groups.
    for (let i = 0; i < 6; i++) {
      expect(clamped[i].photos).toHaveLength(PHOTOS_PER_GROUP_CAP);
    }
    expect(clamped[6].photos).toHaveLength(PHOTOS_TOTAL_CAP - 6 * PHOTOS_PER_GROUP_CAP); // 6
  });

  it('empties later groups once the 150 budget is exhausted', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Two full groups + a third that should be fully truncated: 24*7=168 in the
    // first seven, so an 8th group gets nothing.
    const groups = Array.from({ length: 8 }, (_, i) =>
      group(`g${i}`, PHOTOS_PER_GROUP_CAP)
    );
    const clamped = clampGroupsToCap(groups);
    expect(count(clamped)).toBe(PHOTOS_TOTAL_CAP);
    expect(clamped[7].photos).toHaveLength(0);
  });

  it('is a no-op (same references) for a within-cap set and never warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const groups = [group('a', 10), group('b', 12)]; // 22 total, each < 24
    const clamped = clampGroupsToCap(groups);
    expect(count(clamped)).toBe(22);
    // Belt returns the SAME group objects when nothing was clamped.
    expect(clamped[0]).toBe(groups[0]);
    expect(clamped[1]).toBe(groups[1]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when it clamps (a photo-safety signal, never a throw)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => clampGroupsToCap([group('big', PHOTOS_PER_GROUP_CAP + 1)])).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});
