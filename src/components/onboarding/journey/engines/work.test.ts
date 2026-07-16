// ============================================================================
// The WORK seam's rail adapter (work-onboarding-shell P3).
//
// THE POINT OF THIS FILE is the chip-id JOIN regression (decision 11 /
// landmine 15). `applyRailEdit({field:'groups'})` REPLACES the whole groups
// array, and the rail's chip projection is LOSSY — it carries only a name. So
// every surviving group must be rebuilt from `liveFacts.work.groups[]`, joined
// to the edited chips by an id:
//
//   • label-match breaks on RENAME  — and rename is the PRIMARY edit;
//   • positional index breaks on ADD/REMOVE.
//
// Get it wrong and E2's ingested `photos`/`items` are silently wiped by the most
// ordinary rail edit there is. Phase 2a shipped the join; this is the test that
// proves it, over an E2-SHAPED bag (groups that actually carry photos/items).
// ============================================================================

import { describe, it, expect } from 'vitest';

import { workJourneySeam } from './work';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import type { RailChipEdit, RailCommit } from './types';

const rail = workJourneySeam.rail;

/** An E2-shaped live bag: groups WITH photos/items, plus a sibling `entry`. */
function e2Facts(): Record<string, unknown> {
  return {
    entry: { businessName: 'Kundius Studio', summary: 'Documentary wedding photography' },
    work: {
      identity: { name: 'Kundius Studio', descriptor: 'Documentary wedding photography' },
      groups: [
        {
          name: 'Weddings',
          kind: 'category',
          price: { mode: 'from', amount: 2400, currency: 'EUR' },
          photos: [{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }],
        },
        {
          name: 'Portraits',
          kind: 'category',
          price: { mode: 'on-request' },
          items: [{ name: 'Studio session', photos: [{ id: 'ph_p1', url: 'https://cdn.example.com/p1.jpg' }] }],
        },
      ],
    },
  };
}

function expectOk(result: RailCommit): Extract<RailCommit, { ok: true }> {
  expect(result.ok, result.ok ? '' : `expected ok, got: ${result.error}`).toBe(true);
  return result as Extract<RailCommit, { ok: true }>;
}

function groupsOf(result: Extract<RailCommit, { ok: true }>) {
  const work = getWorkFacts(result.facts);
  expect(work, 'getWorkFacts must stay non-null — a null bag 400s strategy unrecoverably').not.toBeNull();
  return work!.groups ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// toVM — the FOUR fields (founder ruling)
// ─────────────────────────────────────────────────────────────────────────────

describe('work rail adapter — toVM', () => {
  it('emits EXACTLY four fields, in render order', () => {
    const vm = rail.toVM(e2Facts());
    expect(vm.fields.map((f) => f.id)).toEqual([
      'name',
      'descriptor',
      'groups',
      'pricePosition',
    ]);
    expect(vm.fields.map((f) => f.label)).toEqual([
      'NAME',
      'WHAT YOU DO',
      'WHAT YOU SELL',
      'PRICE POSITION',
    ]);
  });

  it('does NOT render WHERE or LANGUAGES (modelled, but E1 has no source for them)', () => {
    // A rail headed "WHAT WE UNDERSTOOD" must not present a hardcoded default as
    // a belief we formed. They stay in the rail MODEL (rail.ts) — not here.
    const vm = rail.toVM(e2Facts());
    const labels = vm.fields.map((f) => f.label);
    expect(labels).not.toContain('WHERE');
    expect(labels).not.toContain('LANGUAGES');
  });

  it('issues chip ids g0..gN from the group positions in the projected bag', () => {
    const vm = rail.toVM(e2Facts());
    const chips = vm.fields.find((f) => f.id === 'groups')!.chips!;
    expect(chips).toEqual([
      { id: 'g0', label: 'Weddings' },
      { id: 'g1', label: 'Portraits' },
    ]);
  });

  it('PRICE POSITION is derived and read-only', () => {
    const field = rail.toVM(e2Facts()).fields.find((f) => f.id === 'pricePosition')!;
    expect(field.kind).toBe('derived');
    expect(field.editable).toBe(false);
    expect(field.skeleton).toBe(false); // groups carry prices ⇒ a band is derivable
  });

  it('an empty / undefined bag projects an all-skeleton VM (never a throw)', () => {
    for (const facts of [undefined, {}, { work: 'garbage' } as unknown as Record<string, unknown>]) {
      const vm = rail.toVM(facts);
      expect(vm.fields).toHaveLength(4);
      expect(vm.fields.every((f) => f.skeleton)).toBe(true);
      expect(vm.fields.find((f) => f.id === 'groups')!.chips).toEqual([]);
    }
  });

  it('PRICE POSITION skeletons when there are no groups (null = unknown)', () => {
    const facts = { work: { identity: { name: 'Solo' } } };
    const field = rail.toVM(facts).fields.find((f) => f.id === 'pricePosition')!;
    expect(field.value).toBeNull();
    expect(field.skeleton).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// THE MANDATED REGRESSION — rename + reorder + add, in ONE edit
// ─────────────────────────────────────────────────────────────────────────────

describe('work rail adapter — chip-id join (landmine 15: the photos/items wipe)', () => {
  it('ONE edit that RENAMES + REORDERS + ADDS keeps photos/items on the renamed group', () => {
    const live = e2Facts();

    // g0 = Weddings (has photos), g1 = Portraits (has items).
    // Rename g0, move it AFTER g1, and append a brand-new group — all at once.
    // Label-match would lose the renamed group; positional index would hand
    // g0's payload to the wrong chip.
    const edit: RailChipEdit[] = [
      { id: 'g1', label: 'Portraits' },
      { id: 'g0', label: 'Wedding days' }, // RENAMED + REORDERED
      { label: 'Newborn' }, // NEW — no id
    ];

    const result = expectOk(rail.applyEdit('groups', { kind: 'chips', value: edit }, live));
    const groups = groupsOf(result);

    // Order = the edited array's order.
    expect(groups.map((g) => g.name)).toEqual(['Portraits', 'Wedding days', 'Newborn']);

    // THE ASSERTION THIS FILE EXISTS FOR: the RENAMED group kept its photos and
    // its price — it was rebuilt from liveFacts, not from the lossy chip.
    const renamed = groups[1];
    expect(renamed.photos).toEqual([{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }]);
    expect(renamed.price).toEqual({ mode: 'from', amount: 2400, currency: 'EUR' });
    expect(renamed.kind).toBe('category');

    // The reordered sibling kept ITS unprojected payload too.
    expect(groups[0].items).toEqual([
      { name: 'Studio session', photos: [{ id: 'ph_p1', url: 'https://cdn.example.com/p1.jpg' }] },
    ]);

    // The NEW group is kind-valid (landmine 6) and carries nothing it never had.
    expect(groups[2]).toEqual({ name: 'Newborn', kind: 'category', price: { mode: 'on-request' } });
    expect(groups[2].photos).toBeUndefined();

    // Siblings survive the FULL-facts re-emit (landmine 4).
    expect((result.facts['entry'] as { businessName: string }).businessName).toBe(
      'Kundius Studio'
    );
    // patch.facts is the SAME object — snapshot sync in one `set` (decision 5).
    expect(result.patch.facts).toBe(result.facts);
  });

  it('re-projecting the committed bag issues ids for the NEW order (ids are per-projection)', () => {
    const live = e2Facts();
    const first = expectOk(
      rail.applyEdit(
        'groups',
        {
          kind: 'chips',
          value: [
            { id: 'g1', label: 'Portraits' },
            { id: 'g0', label: 'Wedding days' },
          ],
        },
        live
      )
    );

    // The rail re-projects on the NEW bag — g0 is now Portraits. This is exactly
    // why a chip array must never be carried across a commit.
    const chips = rail.toVM(first.facts).fields.find((f) => f.id === 'groups')!.chips!;
    expect(chips).toEqual([
      { id: 'g0', label: 'Portraits' },
      { id: 'g1', label: 'Wedding days' },
    ]);

    // A second edit against the NEW bag joins correctly (no cross-wiring).
    const second = expectOk(
      rail.applyEdit('groups', { kind: 'chips', value: [{ id: 'g1', label: 'Weddings' }] }, first.facts)
    );
    const groups = groupsOf(second);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Weddings');
    expect(groups[0].photos).toEqual([{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }]);
  });

  it('a live group referenced by no chip is DELETED', () => {
    const result = expectOk(
      rail.applyEdit('groups', { kind: 'chips', value: [{ id: 'g0', label: 'Weddings' }] }, e2Facts())
    );
    expect(groupsOf(result).map((g) => g.name)).toEqual(['Weddings']);
  });

  it('an unnameable chip is refused — nothing is sent (landmine 5)', () => {
    const result = rail.applyEdit('groups', { kind: 'chips', value: [{ label: '   ' }] }, e2Facts());
    expect(result.ok).toBe(false);
  });

  it('rejects a text value for the chips field', () => {
    expect(rail.applyEdit('groups', { kind: 'text', value: 'Weddings' }, e2Facts()).ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Text fields + mirrors + notes
// ─────────────────────────────────────────────────────────────────────────────

describe('work rail adapter — text edits', () => {
  it('a NAME edit emits the fields["name"] mirror', () => {
    const result = expectOk(rail.applyEdit('name', { kind: 'text', value: '  Kundius  ' }, e2Facts()));
    expect(result.fieldMirrors).toEqual([{ fieldId: 'name', value: 'Kundius' }]);
    expect(getWorkFacts(result.facts)?.identity?.name).toBe('Kundius');
    // Groups (with their photos) are untouched by a name edit.
    expect(groupsOf(result)[0].photos).toEqual([{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }]);
  });

  it('a DESCRIPTOR edit emits no mirror', () => {
    const result = expectOk(
      rail.applyEdit('descriptor', { kind: 'text', value: 'Wedding photographer' }, e2Facts())
    );
    expect(result.fieldMirrors).toBeUndefined();
    expect(getWorkFacts(result.facts)?.identity?.descriptor).toBe('Wedding photographer');
  });

  it('an empty NAME is refused', () => {
    expect(rail.applyEdit('name', { kind: 'text', value: '  ' }, e2Facts()).ok).toBe(false);
  });

  it('PRICE POSITION is not editable — it is derived', () => {
    const result = rail.applyEdit('pricePosition', { kind: 'text', value: 'premium' }, e2Facts());
    expect(result.ok).toBe(false);
  });

  it('an unknown field id is refused', () => {
    expect(rail.applyEdit('languages', { kind: 'text', value: 'nl' }, e2Facts()).ok).toBe(false);
  });

  it('appendNote appends (never overwrites) and preserves siblings', () => {
    const first = expectOk(rail.appendNote('The prices are wrong', e2Facts()));
    const second = expectOk(rail.appendNote('And the name', first.facts));
    expect(getWorkFacts(second.facts)?.userNotes).toEqual([
      'The prices are wrong',
      'And the name',
    ]);
    expect(second.facts['entry']).toBeTruthy();
  });
});
