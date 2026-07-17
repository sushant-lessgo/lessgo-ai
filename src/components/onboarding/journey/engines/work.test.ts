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

import { describe, it, expect, vi, afterEach } from 'vitest';

import { workJourneySeam } from './work';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import type { RailChipEdit, RailCommit } from './types';
import { applyRailEdit, type WorkGroupInput } from '@/modules/wizard/work/rail';
import { proposeGroups, mergeProposalIntoGroups } from '@/modules/wizard/work/ingest/proposeGroups';

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

// ============================================================================
// P4 — STEP 03 questions (ask-if + commit validity) and STEP 04 plan.
//
// The load-bearing property: EVERY question commit routes through the rail
// adapter, so an answer can never persist a `kind`-less group (landmine 6 —
// `getWorkFacts` nulls ⇒ the work strategy 400s, and confirm/saveDraft has
// ALREADY persisted the bad bag, so a retry never recovers).
// ============================================================================

const steps = workJourneySeam.steps;

/** A bag with an identity but NO groups — the state the group question exists for. */
function noGroupsFacts(): Record<string, unknown> {
  return {
    entry: { businessName: 'Kundius Studio' },
    work: { identity: { name: 'Kundius Studio' } },
  };
}

/** A bag with groups but NO name. */
function noNameFacts(): Record<string, unknown> {
  return { work: { groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' } }] } };
}

const questionsFor = (facts: Record<string, unknown> | undefined) =>
  steps.questions(rail.toVM(facts));

describe('work seam — STEP 03 ask-if logic', () => {
  it('asks nothing it already knows: a seeded bag (name + groups) asks only the optional price', () => {
    const qs = questionsFor(e2Facts());
    expect(qs.map((q) => q.id)).toEqual(['price']);
    expect(qs[0]!.kind).toBe('price');
  });

  it('asks NAME only when the rail has none', () => {
    expect(questionsFor(e2Facts()).some((q) => q.id === 'name')).toBe(false);
    expect(questionsFor(noNameFacts()).some((q) => q.id === 'name' && q.kind === 'text')).toBe(true);
  });

  it('asks WHAT YOU SELL only when the seed produced no groups — never alongside chips', () => {
    expect(questionsFor(noGroupsFacts()).map((q) => q.id)).toEqual(['groups']);
    // This ask-if is load-bearing beyond tidiness: the rail's chips editor is
    // the only OTHER group writer, so keeping the question off while chips
    // exist is what makes the chip stable-id rule's stale-VM hole unreachable.
    expect(questionsFor(e2Facts()).some((q) => q.id === 'groups')).toBe(false);
  });

  it('an empty bag asks name AND what-you-sell — but not price (nothing to price yet)', () => {
    expect(questionsFor(undefined).map((q) => q.id)).toEqual(['name', 'groups']);
  });
});

describe('work seam — STEP 03 commits (all routed through the rail adapter)', () => {
  const groupQuestion = () => {
    const q = questionsFor(noGroupsFacts()).find((x) => x.id === 'groups')!;
    if (q.kind !== 'group') throw new Error('expected a group question');
    return q;
  };
  const priceQuestion = () => {
    const q = questionsFor(e2Facts()).find((x) => x.id === 'price')!;
    if (q.kind !== 'price') throw new Error('expected a price question');
    return q;
  };

  it('the GROUP answer emits a kind-valid, on-request group and keeps siblings', () => {
    const result = expectOk(groupQuestion().commit('Newborn sessions', noGroupsFacts()));
    expect(groupsOf(result)).toEqual([
      { name: 'Newborn sessions', kind: 'category', price: { mode: 'on-request' } },
    ]);
    expect(result.facts['entry']).toBeTruthy();
  });

  it('the GROUP answer APPENDS through the chip join — never a destructive write', () => {
    // Defensive: the question does not fire with groups present, but if a future
    // ask-if let it, it must still not delete or wipe a live group.
    const result = expectOk(groupQuestion().commit('Newborn', e2Facts()));
    const groups = groupsOf(result);
    expect(groups.map((g) => g.name)).toEqual(['Weddings', 'Portraits', 'Newborn']);
    expect(groups[0]!.photos).toEqual([{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }]);
    expect(groups[1]!.items).toBeTruthy();
  });

  it('a blank GROUP answer is refused, never sent', () => {
    expect(groupQuestion().commit('   ', noGroupsFacts()).ok).toBe(false);
  });

  it('the PRICE answer writes onto every group, carries photos/items, stays kind-valid', () => {
    const result = expectOk(priceQuestion().commit({ mode: 'from', amount: 900 }, e2Facts()));
    const groups = groupsOf(result);
    expect(groups.map((g) => g.price)).toEqual([
      { mode: 'from', amount: 900, currency: 'EUR' }, // the live currency carried
      { mode: 'from', amount: 900 },
    ]);
    for (const g of groups) expect(g.kind).toBe('category');
    expect(groups[0]!.photos).toBeTruthy();
    expect(groups[1]!.items).toBeTruthy();
  });

  it('the PRICE default (on-request) is always valid', () => {
    const result = expectOk(priceQuestion().commit({ mode: 'on-request' }, e2Facts()));
    for (const g of groupsOf(result)) expect(g.price).toEqual({ mode: 'on-request' });
  });

  it('exact/from WITHOUT a valid amount is REFUSED, not silently degraded to on-request', () => {
    const q = priceQuestion();
    expect(q.commit({ mode: 'exact' }, e2Facts()).ok).toBe(false);
    expect(q.commit({ mode: 'from', amount: Number.NaN }, e2Facts()).ok).toBe(false);
    expect(q.commit({ mode: 'from', amount: -5 }, e2Facts()).ok).toBe(false);
  });

  it('a price answer with nothing to price is refused', () => {
    expect(priceQuestion().commit({ mode: 'on-request' }, noGroupsFacts()).ok).toBe(false);
  });

  it('the NAME answer emits the store field mirror', () => {
    const q = questionsFor(noNameFacts()).find((x) => x.id === 'name')!;
    if (q.kind !== 'text') throw new Error('expected a text question');
    const result = expectOk(q.commit('Kundius Studio', noNameFacts()));
    expect(result.fieldMirrors).toEqual([{ fieldId: 'name', value: 'Kundius Studio' }]);
    expect(getWorkFacts(result.facts)?.identity?.name).toBe('Kundius Studio');
  });
});

describe('work seam — STEP 04 plan', () => {
  type PlanState = Parameters<typeof steps.plan.items>[0];

  it('items() projects the seeded sitemap as page titles', () => {
    const state = {
      sitemap: [
        { archetypeKey: 'home', title: 'Home' },
        { archetypeKey: 'work', title: 'Work' },
      ],
    } as unknown as PlanState;
    expect(steps.plan.items(state)).toEqual([{ title: 'Home' }, { title: 'Work' }]);
  });

  it('items() is defensive: no sitemap ⇒ no cards; junk entries dropped', () => {
    expect(steps.plan.items({ sitemap: null } as unknown as PlanState)).toEqual([]);
    expect(
      steps.plan.items({
        sitemap: [{}, { title: '  ' }, { archetypeKey: 'about' }],
      } as unknown as PlanState)
    ).toEqual([{ title: 'about' }]);
  });

  it('prepare() drives the EXISTING chargeless seed — fetchStrategy, nothing else', async () => {
    const fetchStrategy = vi.fn().mockResolvedValue(undefined);
    const api = { getState: () => ({ fetchStrategy }) } as unknown as Parameters<
      typeof steps.plan.prepare
    >[0];
    await steps.plan.prepare(api);
    // The idempotency guard (landmine 8) lives INSIDE fetchStrategy — the frame
    // may call prepare on every mount. What must never exist is a second,
    // charged path invented here.
    expect(fetchStrategy).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// STEP 05 — preflight (P5).
//
// Landmine 2 in one sentence: the legacy wizard, with the flag OFF, silently
// falls through to `runWorkSkeleton`. In the JOURNEY a skeleton is an EMPTY
// REVEAL — so `preflight` must FAIL LOUDLY instead. These tests exist so nobody
// "simplifies" that back into a fall-through.
//
// `runGeneration` is deliberately NOT unit-tested here: it lazy-imports the real
// driver (that laziness is the firewall — landmine 14 — and is asserted by
// `journeyAgnostic.test.ts`), and `runWorkLLMGeneration` has its own suite
// (work.llm.test.ts). Mocking it here would only prove the mock.
// ============================================================================

// ============================================================================
// E2 — STEP 02 seam widening (D9) + the ingestion commit path (D10).
//
// The upload/EXIF/render UI is engine-owned (`engines/work/ShowWorkStep.tsx`)
// and covered by e2e; here we lock the two seam-level contracts E2 adds:
//   • the seam exposes an OPTIONAL lazy step body (`showWork.loadStep`);
//   • ingestion commits ride the WORK-MODULE `applyRailEdit({field:'groups'})`
//     funnel (NEVER the seam's `applyEdit`/`RailEditValue`), and a
//     proposal-merged, photo-bearing groups array survives that gate with photos
//     intact and siblings preserved — the exact write `ShowWorkStep` performs.
// ============================================================================

describe('work seam — STEP 02 widening (D9)', () => {
  it('exposes an OPTIONAL lazy step body on the SHARED step config (loadStep)', () => {
    const showWork = workJourneySeam.steps.showWork;
    // Still carries the display config every engine shares…
    expect(typeof showWork.title).toBe('string');
    expect(typeof showWork.body).toBe('string');
    expect(typeof showWork.icon).toBe('string');
    // …plus the lazy engine body the agnostic frame renders when present.
    expect(typeof showWork.loadStep).toBe('function');
  });
});

describe('work seam — ingestion commit path (D10)', () => {
  it('a proposal-merged, photo-bearing groups array survives applyRailEdit with photos + siblings intact', () => {
    // Live bag: an entry-seeded group (Weddings) already carrying a photo, plus a
    // sibling `entry` fact that must survive the full-facts re-emit (landmine 4).
    const liveFacts: Record<string, unknown> = {
      entry: { businessName: 'Kundius Studio' },
      work: {
        identity: { name: 'Kundius Studio' },
        groups: [
          {
            name: 'Weddings',
            kind: 'category',
            price: { mode: 'on-request' },
            photos: [{ id: 'pre', url: 'https://cdn.example.com/pre.jpg', cover: true }],
          },
        ],
      },
    };

    // A folder upload: one photo into the existing "weddings" (case-insensitive
    // attach) + one into a brand-new "Newborns" group.
    const proposal = proposeGroups([
      { name: 'w.jpg', url: 'https://cdn.example.com/w.jpg', relativePath: 'Root/weddings/w.jpg' },
      { name: 'n.jpg', url: 'https://cdn.example.com/n.jpg', relativePath: 'Root/Newborns/n.jpg' },
    ]);
    const existing = (getWorkFacts(liveFacts)?.groups ?? []) as WorkGroupInput[];
    const merged = mergeProposalIntoGroups(proposal, existing);

    // THE D10 FUNNEL — the exact call ShowWorkStep makes.
    const result = applyRailEdit({ field: 'groups', value: merged }, liveFacts);
    expect(result.ok, result.ok ? '' : `commit failed: ${result.error}`).toBe(true);
    if (!result.ok) return;

    const groups = getWorkFacts(result.facts)!.groups!;
    expect(groups.map((g) => g.name)).toEqual(['Weddings', 'Newborns']);
    // Existing group kept its prior photo AND gained the uploaded one; kind valid.
    expect(groups[0].photos?.map((p) => p.url)).toEqual([
      'https://cdn.example.com/pre.jpg',
      'https://cdn.example.com/w.jpg',
    ]);
    expect(groups[0].kind).toBe('category');
    // The new group is kind-valid (landmine 6) and carries its uploaded photo as cover.
    expect(groups[1].kind).toBe('category');
    expect(groups[1].photos?.[0]).toEqual({
      id: 'https://cdn.example.com/n.jpg',
      url: 'https://cdn.example.com/n.jpg',
      cover: true,
    });
    // Sibling fact survived (landmine 4); snapshot-sync object identity (decision 5).
    expect((result.facts['entry'] as { businessName: string }).businessName).toBe('Kundius Studio');
    expect(result.patch.facts).toBe(result.facts);
  });

  it('re-committing does not wipe a prior ingested photo (the E2 wipe-regression, ingestion-shaped)', () => {
    // A group already carrying an ingested photo…
    const liveFacts: Record<string, unknown> = {
      work: {
        identity: { name: 'Studio' },
        groups: [
          {
            name: 'Weddings',
            kind: 'category',
            price: { mode: 'on-request' },
            photos: [{ id: 'a', url: 'https://cdn.example.com/a.jpg', cover: true }],
          },
        ],
      },
    };
    // …a SECOND ingestion pass attaches another photo to the same group.
    const proposal = proposeGroups([
      { name: 'b.jpg', url: 'https://cdn.example.com/b.jpg', relativePath: 'Root/Weddings/b.jpg' },
    ]);
    const existing = (getWorkFacts(liveFacts)?.groups ?? []) as WorkGroupInput[];
    const merged = mergeProposalIntoGroups(proposal, existing);
    const result = applyRailEdit({ field: 'groups', value: merged }, liveFacts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const photos = getWorkFacts(result.facts)!.groups![0].photos!;
    expect(photos.map((p) => p.url)).toEqual([
      'https://cdn.example.com/a.jpg',
      'https://cdn.example.com/b.jpg',
    ]);
  });
});

describe('work seam — STEP 05 preflight', () => {
  type PreState = Parameters<typeof workJourneySeam.preflight>[0];
  const priorFlag = process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;

  const state = (over: Record<string, unknown>) =>
    ({ templateId: 'atelier', briefFacts: e2Facts(), ...over }) as unknown as PreState;

  afterEach(() => {
    if (priorFlag === undefined) delete process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;
    else process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = priorFlag;
  });

  it('flag ON + allow-listed template + work facts ⇒ ok', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    expect(workJourneySeam.preflight(state({}))).toEqual({ ok: true });
  });

  it('flag OFF ⇒ engine-disabled, EXPLICIT — never a silent skeleton (landmine 2)', () => {
    delete process.env.NEXT_PUBLIC_WORK_COPY_ENGINE;
    const result = workJourneySeam.preflight(state({}));
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('engine-disabled');
    expect(result.ok === false && result.message.length).toBeGreaterThan(0);
  });

  it('a work template that is NOT allow-listed (granth) ⇒ engine-disabled even with the flag ON', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    const result = workJourneySeam.preflight(state({ templateId: 'granth' }));
    expect(result.ok === false && result.reason).toBe('engine-disabled');
  });

  it('reads the kill-switch from the LEAF — one source, no second env check in the seam', () => {
    // If the seam ever re-implemented the env read, this flip would not be seen
    // by it (or, worse, would drift from the generation fork's answer).
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    expect(workJourneySeam.preflight(state({})).ok).toBe(true);
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'false';
    expect(workJourneySeam.preflight(state({})).ok).toBe(false);
  });

  it('no work facts ⇒ missing-facts (getWorkFacts null 400s the strategy route unrecoverably)', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    for (const facts of [undefined, null, {}, { entry: { businessName: 'x' } }]) {
      const result = workJourneySeam.preflight(state({ briefFacts: facts }));
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe('missing-facts');
    }
  });

  it('a KIND-LESS group ⇒ missing-facts, not a green light into an unrecoverable 400 (landmine 6)', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    const broken = {
      work: { identity: { name: 'X' }, groups: [{ name: 'Weddings' }] },
    };
    const result = workJourneySeam.preflight(state({ briefFacts: broken }));
    expect(result.ok === false && result.reason).toBe('missing-facts');
  });

  it('preflight is SYNC (its result is not a promise) — the firewall depends on it', () => {
    process.env.NEXT_PUBLIC_WORK_COPY_ENGINE = 'true';
    expect(workJourneySeam.preflight(state({}))).not.toBeInstanceOf(Promise);
  });
});
