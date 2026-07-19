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

import { describe, it, expect, vi } from 'vitest';

import { workJourneySeam } from './work';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import type { JourneyQuestion, RailChipEdit, RailCommit } from './types';
import { applyRailEdit, type WorkGroupInput } from '@/modules/wizard/work/rail';
import { proposeGroups, mergeProposalIntoGroups } from '@/modules/wizard/work/ingest/proposeGroups';
import {
  mergeGroups,
  hidePhoto,
  pickCover,
} from './work/correctionReducer';
import { WORK_BRIEF_FIXTURE } from '../../../../../e2e/helpers/workBriefFixture';

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
  it('emits the E3-widened field set, in render order', () => {
    const vm = rail.toVM(e2Facts());
    expect(vm.fields.map((f) => f.id)).toEqual([
      'name',
      'descriptor',
      'groups',
      'price', // qa-0718 B6 — WHAT YOU CHARGE (the answered charge)
      'pricePosition',
      // E3 read-only rows (fill from STEP 03; corrections happen in-step, D-E).
      'languages',
      'establishment',
      'dreamClient',
      'contactMethod',
    ]);
    expect(vm.fields.map((f) => f.label)).toEqual([
      'NAME',
      'WHAT YOU DO',
      'WHAT YOU SELL',
      'WHAT YOU CHARGE',
      'PRICE POSITION',
      'LANGUAGES',
      'ESTABLISHED',
      'DREAM CLIENT',
      'CONTACT',
    ]);
  });

  it('the E3 rows are read-only and skeleton until answered', () => {
    // Kundius fixture-shaped bag has none of these yet ⇒ all four skeleton, none
    // editable (the correctable path is STEP 03, not the rail — D-E).
    const vm = rail.toVM(e2Facts());
    for (const id of ['languages', 'establishment', 'dreamClient', 'contactMethod']) {
      const field = vm.fields.find((f) => f.id === id)!;
      expect(field.editable, `${id} must be read-only`).toBe(false);
      expect(field.skeleton, `${id} must be skeleton when unknown`).toBe(true);
    }
  });

  it('does NOT render WHERE (modelled, but E1 has no source for it)', () => {
    // A rail headed "WHAT WE UNDERSTOOD" must not present a hardcoded default as
    // a belief we formed. `location`/`reach` stay in the rail MODEL, not here.
    const vm = rail.toVM(e2Facts());
    expect(vm.fields.map((f) => f.label)).not.toContain('WHERE');
  });

  it('reflects answered E3 values as read-only rows', () => {
    const facts = {
      work: {
        identity: { name: 'Kundius' },
        groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' } }],
        languages: ['English', 'Dutch'],
        establishment: 'established',
        dreamClient: 'Couples getting married',
        contactMethod: 'whatsapp',
      },
    } as unknown as Record<string, unknown>;
    const vm = rail.toVM(facts);
    const byId = (id: string) => vm.fields.find((f) => f.id === id)!;
    expect(byId('languages').value).toBe('English, Dutch');
    expect(byId('establishment').value).toBe('Established');
    expect(byId('dreamClient').value).toBe('Couples getting married');
    expect(byId('contactMethod').value).toBe('WhatsApp');
    for (const id of ['languages', 'establishment', 'dreamClient', 'contactMethod']) {
      expect(byId(id).skeleton).toBe(false);
    }
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
      expect(vm.fields).toHaveLength(9); // +1: WHAT YOU CHARGE (qa-0718 B6)
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

  // ── qa-0718 B5 — upload buckets must NOT leak into "WHAT YOU SELL" ──
  it('B5: "WHAT YOU SELL" chips EXCLUDE upload-origin groups (offer only)', () => {
    const facts = {
      work: {
        identity: { name: 'Kundius' },
        groups: [
          { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, origin: 'offer' },
          // an E2 photo bucket (folder-named), tagged upload — not a thing sold.
          {
            name: 'asset',
            kind: 'category',
            price: { mode: 'on-request' },
            origin: 'upload',
            photos: [{ id: 'p1', url: 'https://cdn.example.com/p1.jpg' }],
          },
        ],
      },
    } as unknown as Record<string, unknown>;
    const chips = rail.toVM(facts).fields.find((f) => f.id === 'groups')!.chips!;
    // Pre-fix BOTH leaked in ([g0 Weddings, g1 asset]); now offer only.
    expect(chips).toEqual([{ id: 'g0', label: 'Weddings' }]);
    // Chip id is the position in the FULL facts bag (index preserved for the join).
    // If all groups were uploads, the field would skeleton.
    const allUploads = {
      work: {
        identity: { name: 'X' },
        groups: [{ name: 'asset', kind: 'category', price: { mode: 'on-request' }, origin: 'upload' }],
      },
    } as unknown as Record<string, unknown>;
    const groupsField = rail.toVM(allUploads).fields.find((f) => f.id === 'groups')!;
    expect(groupsField.chips).toEqual([]);
    expect(groupsField.skeleton).toBe(true);
  });

  it('B5: a WHAT YOU SELL chip edit PRESERVES origin:upload buckets + their photos (round-trip)', () => {
    const facts = {
      work: {
        identity: { name: 'Kundius' },
        groups: [
          { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, origin: 'offer' },
          {
            name: 'asset',
            kind: 'category',
            price: { mode: 'on-request' },
            origin: 'upload',
            photos: [{ id: 'u1', url: 'https://cdn.example.com/u1.jpg' }],
          },
        ],
      },
    } as unknown as Record<string, unknown>;

    // The UI seeds ChipsEditor from the OFFER-only chips toVM emits…
    const chips = rail.toVM(facts).fields.find((f) => f.id === 'groups')!.chips!;
    expect(chips).toEqual([{ id: 'g0', label: 'Weddings' }]);

    // …rename the only visible chip + add one, and Save through the SAME door the
    // UI uses (rail.applyEdit → commitGroupChips → applyRailEdit REPLACE).
    const result = expectOk(
      rail.applyEdit(
        'groups',
        { kind: 'chips', value: [{ id: 'g0', label: 'Portraits' }, { label: 'Film' }] },
        facts
      )
    );
    const groups = groupsOf(result);

    // Offer chips add/rename as before…
    expect(groups.map((g) => g.name)).toContain('Portraits');
    expect(groups.map((g) => g.name)).toContain('Film');
    // …and the upload bucket + its photo SURVIVED (pre-fix: deleted by the REPLACE).
    const upload = groups.find((g) => g.origin === 'upload');
    expect(upload, 'upload bucket must survive an offer edit').toBeTruthy();
    expect(upload!.name).toBe('asset');
    expect(upload!.photos?.map((p) => p.url)).toEqual(['https://cdn.example.com/u1.jpg']);
  });

  // ── qa-0718 B6 — the answered charge shows in the rail ──
  it('B6: WHAT YOU CHARGE row skeletons on-request, fills on an amount-bearing price', () => {
    const seeded = {
      work: { identity: { name: 'X' }, groups: [{ name: 'G', kind: 'category', price: { mode: 'on-request' } }] },
    } as unknown as Record<string, unknown>;
    const before = rail.toVM(seeded).fields.find((f) => f.id === 'price')!;
    expect(before.label).toBe('WHAT YOU CHARGE');
    expect(before.editable).toBe(false);
    expect(before.skeleton).toBe(true);
    // e2Facts' Weddings group carries { from, 2400, EUR }.
    const after = rail.toVM(e2Facts()).fields.find((f) => f.id === 'price')!;
    expect(after.value).toBe('From EUR 2400');
    expect(after.skeleton).toBe(false);
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
// E3 — STEP 03 questions (deterministic gating) and STEP 04 plan.
//
// The step is now driven by `buildQuestionPlan` (phase 1) + profession wording,
// mapped to `JourneyQuestion` descriptors. The load-bearing properties:
//   • the seam asks ONLY the gaps the Kundius fixture leaves (≤5, never name /
//     groups — "never ask twice");
//   • EVERY commit still routes through `applyRailEdit` / the rail adapter, so no
//     answer persists a `kind`-less group (landmine 6) or drops a sibling
//     (`facts.entry`) / a group's `photos`/`items` (E2 reconciliation);
//   • richer facts ⇒ FEWER questions (AC 3).
// ============================================================================

const steps = workJourneySeam.steps;

/** Deep-cloned fixture facts (so a commit can never mutate the shared fixture). */
const fixtureFacts = (): Record<string, unknown> =>
  JSON.parse(JSON.stringify(WORK_BRIEF_FIXTURE.facts)) as Record<string, unknown>;

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

/** Run the seam's questions() with a ctx (default: photographer, nothing answered). */
function questionsFor(
  facts: Record<string, unknown> | undefined,
  over: { businessType?: string | null; sessionAnswered?: readonly string[] } = {}
): JourneyQuestion[] {
  return steps.questions(rail.toVM(facts), {
    businessType: over.businessType ?? 'photographer',
    facts,
    sessionAnswered: over.sessionAnswered ?? [],
  });
}

const choiceQuestion = (
  facts: Record<string, unknown> | undefined,
  id: string,
  over?: { businessType?: string | null }
): Extract<JourneyQuestion, { kind: 'choice' }> => {
  const q = questionsFor(facts, over).find((x) => x.id === id)!;
  if (q.kind !== 'choice') throw new Error(`expected a choice question for ${id}`);
  return q;
};

describe('work seam — STEP 03 gating (Kundius fixture)', () => {
  it('yields EXACTLY the 5 expected questions in display order', () => {
    expect(questionsFor(fixtureFacts()).map((q) => q.id)).toEqual([
      'price',
      'establishment',
      'dreamClient',
      'contactMethod',
      'languages',
    ]);
  });

  it('never asks what the seed already knows (name / groups / praise)', () => {
    const ids = questionsFor(fixtureFacts()).map((q) => q.id);
    expect(ids).not.toContain('name');
    expect(ids).not.toContain('groups');
    // testimonials empty ⇒ praise is SILENT, never an open ask (D-F).
    expect(ids).not.toContain('praise');
  });

  it('maps each slot to the expected kind + gates only price and languages', () => {
    const qs = questionsFor(fixtureFacts());
    const byId = Object.fromEntries(qs.map((q) => [q.id, q]));
    expect(byId['price']!.kind).toBe('price');
    expect(byId['establishment']!.kind).toBe('choice');
    expect(byId['dreamClient']!.kind).toBe('choice');
    expect(byId['contactMethod']!.kind).toBe('choice');
    expect(byId['languages']!.kind).toBe('choice');
    // Required gate (D-D): only price + languages block Continue.
    expect(qs.filter((q) => q.required).map((q) => q.id)).toEqual(['price', 'languages']);
  });
});

describe('work seam — STEP 03 profession wording', () => {
  it('a photographer sees "galleries" groups wording + photography dream-client chips', () => {
    // groups only appears when the seed produced none — drop them to surface it.
    const noGroups = { entry: fixtureFacts().entry, work: { identity: { name: 'Kundius' } } };
    const groupsQ = questionsFor(noGroups).find((q) => q.id === 'groups')!;
    expect(groupsQ.label).toContain('galleries'); // professionWording.photographer.workGroup

    const dreamQ = choiceQuestion(fixtureFacts(), 'dreamClient');
    const optionValues = dreamQ.options.map((o) => o.value);
    // dreamClientChips.photographer members present (the profession-adaptive layer).
    expect(optionValues).toContain('Weddings');
    expect(optionValues).toContain('Newborn & family');
    // Confirm posture: the entry audiences are the suggested (prominent) options.
    expect(dreamQ.suggested).toEqual(['Couples getting married']);
    expect(optionValues).toContain('Couples getting married');
  });

  it('wording follows businessType (designer ⇒ "projects")', () => {
    const noGroups = { work: { identity: { name: 'X' } } };
    const q = questionsFor(noGroups, { businessType: 'designer' }).find((x) => x.id === 'groups')!;
    expect(q.label).toContain('projects'); // professionWording.designer.workGroup
  });
});

describe('work seam — STEP 03 commits (all routed through applyRailEdit)', () => {
  it('establishment commit writes the fact AND preserves entry + groups photos/items', () => {
    // e2Facts groups carry unprojected photos/items + a sibling entry — the exact
    // E2 reconciliation landmine (landmine 4 + the photos/items wipe).
    const facts = e2Facts();
    const result = expectOk(choiceQuestion(facts, 'establishment').commit(['new'], facts));
    const work = getWorkFacts(result.facts)!;
    expect(work.establishment).toBe('new');
    expect((result.facts['entry'] as { businessName?: string }).businessName).toBe('Kundius Studio');
    expect(work.groups![0]!.photos).toEqual([{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }]);
    expect(work.groups![1]!.items).toBeTruthy();

    // 'established' round-trips too.
    const est = expectOk(choiceQuestion(facts, 'establishment').commit(['established'], facts));
    expect(getWorkFacts(est.facts)!.establishment).toBe('established');
  });

  it('dreamClient commit joins selections into the single-string field', () => {
    const facts = fixtureFacts();
    const single = expectOk(
      choiceQuestion(facts, 'dreamClient').commit(['Couples getting married'], facts)
    );
    expect(getWorkFacts(single.facts)!.dreamClient).toBe('Couples getting married');

    const multi = expectOk(
      choiceQuestion(facts, 'dreamClient').commit(['Weddings', 'Newborn & family'], facts)
    );
    expect(getWorkFacts(multi.facts)!.dreamClient).toBe('Weddings, Newborn & family');
  });

  it('languages is a required multi with BOTH English + Dutch tappable, English suggested', () => {
    const q = choiceQuestion(fixtureFacts(), 'languages');
    expect(q.options.map((o) => o.value)).toEqual(['English', 'Dutch']);
    expect(q.multi).toBe(true);
    expect(q.allowCustom).toBe(true);
    expect(q.suggested).toEqual(['English']);
    expect(q.required).toBe(true);

    const facts = fixtureFacts();
    const result = expectOk(choiceQuestion(facts, 'languages').commit(['English', 'Dutch'], facts));
    expect(getWorkFacts(result.facts)!.languages).toEqual(['English', 'Dutch']);
  });

  it('contactMethod commit writes the enum; in-person delivery ⇒ whatsapp default', () => {
    const facts = fixtureFacts();
    const q = choiceQuestion(facts, 'contactMethod');
    expect(q.suggested).toEqual(['whatsapp']); // deliveryModel 'in-person'
    const result = expectOk(q.commit(['whatsapp'], facts));
    expect(getWorkFacts(result.facts)!.contactMethod).toBe('whatsapp');
  });

  it('price stays ONE blanket practice-level commit (D-G), kind-valid across groups', () => {
    const facts = fixtureFacts();
    const q = questionsFor(facts).find((x) => x.id === 'price')!;
    if (q.kind !== 'price') throw new Error('expected a price question');
    expect(q.required).toBe(true);
    const result = expectOk(q.commit({ mode: 'from', amount: 900 }, facts));
    const groups = getWorkFacts(result.facts)!.groups!;
    expect(groups.map((g) => g.price.mode)).toEqual(['from', 'from']);
    for (const g of groups) expect(g.kind).toBe('category');
  });

  it('price still REFUSES exact/from without a valid amount (never silent on-request)', () => {
    const facts = fixtureFacts();
    const q = questionsFor(facts).find((x) => x.id === 'price')!;
    if (q.kind !== 'price') throw new Error('expected a price question');
    expect(q.commit({ mode: 'exact' }, facts).ok).toBe(false);
    expect(q.commit({ mode: 'from', amount: Number.NaN }, facts).ok).toBe(false);
  });

  // ── qa-0719 B2 — the answered currency is PERSISTED onto every group ──
  it('B2: price commit persists the chosen currency across every group', () => {
    const facts = fixtureFacts();
    const q = questionsFor(facts).find((x) => x.id === 'price')!;
    if (q.kind !== 'price') throw new Error('expected a price question');
    const result = expectOk(q.commit({ mode: 'exact', amount: 100, currency: 'EUR' }, facts));
    const groups = getWorkFacts(result.facts)!.groups!;
    // Pre-fix: currency was `g.price?.currency` (undefined on a fresh seed).
    for (const g of groups) expect(g.price.currency).toBe('EUR');
  });

  // ── qa-0719 B3 — the identity question's GATING slot is 'identity' ──
  it('B3: the identity question carries slot:"identity" (id stays the rail field "name")', () => {
    const q = questionsFor(noNameFacts()).find((x) => x.id === 'name')!;
    // The frame tracks session-answered by slot; a missing/`name` slot left
    // session('identity') false ⇒ the answered name question vanished.
    expect(q.slot).toBe('identity');
  });

  it('the GROUP answer appends through the chip join — never destructive', () => {
    const groupQ = questionsFor(noGroupsFacts()).find((x) => x.id === 'groups')!;
    if (groupQ.kind !== 'group') throw new Error('expected a group question');
    // Fire against a live bag WITH groups (defensive): must append, not wipe.
    const result = expectOk(groupQ.commit('Newborn', e2Facts()));
    const groups = groupsOf(result);
    expect(groups.map((g) => g.name)).toEqual(['Weddings', 'Portraits', 'Newborn']);
    expect(groups[0]!.photos).toEqual([{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }]);
  });

  it('the NAME answer emits the store field mirror', () => {
    const facts = noNameFacts();
    const q = questionsFor(facts).find((x) => x.id === 'name')!;
    if (q.kind !== 'text') throw new Error('expected a text question');
    const result = expectOk(q.commit('Kundius Studio', facts));
    expect(result.fieldMirrors).toEqual([{ fieldId: 'name', value: 'Kundius Studio' }]);
    expect(getWorkFacts(result.facts)?.identity?.name).toBe('Kundius Studio');
  });
});

describe('work seam — STEP 03 ceiling + fewer-for-more-signal', () => {
  it('empty facts caps at 5 questions by priority rank (D-F)', () => {
    const qs = questionsFor(undefined);
    expect(qs.length).toBe(5);
    // The degenerate no-seed survivors: name, groups + the required pair rank in.
    const ids = qs.map((q) => q.id);
    expect(ids).toContain('name');
    expect(ids).toContain('groups');
    expect(ids).toContain('price');
    expect(ids).toContain('languages');
    // establishment / dreamClient are the ceiling casualties.
    expect(ids).not.toContain('establishment');
    expect(ids).not.toContain('dreamClient');
  });

  it('rich facts yield ZERO questions — fewer questions for more signal (AC 3)', () => {
    const rich = {
      entry: fixtureFacts().entry,
      work: {
        identity: { name: 'Kundius' },
        groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'from', amount: 2400 } }],
        establishment: 'established',
        dreamClient: 'Couples getting married',
        contactMethod: 'whatsapp',
        languages: ['English', 'Dutch'],
      },
    } as unknown as Record<string, unknown>;
    // Everything known + a non-default price ⇒ nothing left to ask (D-C).
    expect(questionsFor(rich)).toHaveLength(0);
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

  it('exposes the RICH plan body via the reused loadStep field (E4, D9)', () => {
    // The founder-signed `loadStep?` is REUSED for STEP 04 (same field STEP 02
    // uses) — its presence is what makes the agnostic frame render the rich plan
    // instead of the `items()` stub. `prepare`/`items` stay untouched beside it.
    expect(typeof steps.plan.loadStep).toBe('function');
    expect(typeof steps.plan.prepare).toBe('function');
    expect(typeof steps.plan.items).toBe('function');
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

describe('work seam — ingestion provenance (qa-0718 B5)', () => {
  it('mergeProposalIntoGroups tags a NEW bucket origin:upload, photos preserved', () => {
    // A single DATED photo → a date-named bucket (no folder signal).
    const proposal = proposeGroups([
      { name: 'shot.jpg', url: 'https://cdn.example.com/shot.jpg', takenAt: new Date(2025, 2, 10, 10, 0, 0) },
    ]);
    const merged = mergeProposalIntoGroups(proposal, []);
    expect(merged).toHaveLength(1);
    // Pre-fix origin was undefined (bucket leaked into WHAT YOU SELL).
    expect(merged[0].origin).toBe('upload');
    expect(merged[0].photos?.map((p) => p.url)).toEqual(['https://cdn.example.com/shot.jpg']);
  });

  it('a name-matched append leaves the existing group origin UNTOUCHED (offer stays offer)', () => {
    const existing: WorkGroupInput[] = [
      { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, origin: 'offer' },
    ];
    const proposal = proposeGroups([
      { name: 'w.jpg', url: 'https://cdn.example.com/w.jpg', relativePath: 'Root/Weddings/w.jpg' },
    ]);
    const merged = mergeProposalIntoGroups(proposal, existing);
    expect(merged).toHaveLength(1);
    expect(merged[0].origin).toBe('offer'); // photos attached, provenance kept
    expect(merged[0].photos?.map((p) => p.url)).toEqual(['https://cdn.example.com/w.jpg']);
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

// ============================================================================
// P4 — the correction VERBS through the D10 funnel.
//
// correctionReducer.test.ts pins the pure verb transforms; here we prove they
// survive the SAME founder-signed commit gate ShowWorkStep drives them through
// (`applyRailEdit({field:'groups'})`) — cover-exclusivity persists, a hidden
// photo is ABSENT from the committed facts (D12), and a merge conserves photos
// (minus cap) while collapsing groups — with siblings intact.
// ============================================================================

describe('work seam — correction verbs through the D10 funnel (P4)', () => {
  function photoBearingFacts(): Record<string, unknown> {
    return {
      entry: { businessName: 'Kundius Studio' },
      work: {
        identity: { name: 'Kundius Studio' },
        groups: [
          {
            name: 'Weddings',
            kind: 'category',
            price: { mode: 'on-request' },
            photos: [
              { id: 'w1', url: 'https://cdn/w1.jpg', cover: true },
              { id: 'w2', url: 'https://cdn/w2.jpg' },
            ],
          },
          {
            name: 'Portraits',
            kind: 'category',
            price: { mode: 'on-request' },
            photos: [{ id: 'p1', url: 'https://cdn/p1.jpg', cover: true }],
          },
        ],
      },
    };
  }

  const commit = (groups: WorkGroupInput[], facts: Record<string, unknown>) =>
    applyRailEdit({ field: 'groups', value: groups }, facts);

  it('pickCover commits an EXCLUSIVE cover (the old cover is cleared in facts)', () => {
    const facts = photoBearingFacts();
    const groups = (getWorkFacts(facts)?.groups ?? []) as WorkGroupInput[];
    const res = expectRail(commit(pickCover(groups, 0, 'w2'), facts));
    const wed = getWorkFacts(res.facts)!.groups![0];
    const covers = (wed.photos ?? []).filter((p) => p.cover);
    expect(covers.map((p) => p.id)).toEqual(['w2']); // exactly one, and it's w2
  });

  it('hidePhoto DROPS the photo from the committed facts (D12 — not a MediaAsset op)', () => {
    const facts = photoBearingFacts();
    const groups = (getWorkFacts(facts)?.groups ?? []) as WorkGroupInput[];
    const res = expectRail(commit(hidePhoto(groups, 0, 'w2'), facts));
    const wed = getWorkFacts(res.facts)!.groups![0];
    expect((wed.photos ?? []).map((p) => p.url)).toEqual(['https://cdn/w1.jpg']);
    // Sibling preserved (full-facts re-emit, landmine 4).
    expect((res.facts['entry'] as { businessName: string }).businessName).toBe('Kundius Studio');
  });

  it('mergeGroups conserves photos and collapses the group count through the funnel', () => {
    const facts = photoBearingFacts();
    const groups = (getWorkFacts(facts)?.groups ?? []) as WorkGroupInput[];
    const { groups: merged } = mergeGroups(groups, [0, 1]);
    const res = expectRail(commit(merged, facts));
    const out = getWorkFacts(res.facts)!.groups!;
    expect(out).toHaveLength(1);
    expect((out[0].photos ?? []).map((p) => p.url)).toEqual([
      'https://cdn/w1.jpg',
      'https://cdn/w2.jpg',
      'https://cdn/p1.jpg',
    ]);
    // One cover survives the merge (first encountered).
    expect((out[0].photos ?? []).filter((p) => p.cover).map((p) => p.id)).toEqual(['w1']);
  });

  function expectRail(r: ReturnType<typeof applyRailEdit>) {
    expect(r.ok, r.ok ? '' : `commit failed: ${r.error}`).toBe(true);
    if (!r.ok) throw new Error(r.error);
    return r;
  }
});

describe('work seam — STEP 05 preflight', () => {
  type PreState = Parameters<typeof workJourneySeam.preflight>[0];

  const state = (over: Record<string, unknown>) =>
    ({ templateId: 'atelier', briefFacts: e2Facts(), ...over }) as unknown as PreState;

  // B17: the NEXT_PUBLIC_WORK_COPY_ENGINE env kill-switch was REMOVED. Preflight
  // now gates on the allow-list ALONE (env-independent) — these asserts run with
  // the env UNSET and are the regression guard that no env branch creeps back.

  it('allow-listed template + work facts ⇒ ok (env UNSET — no kill-switch)', () => {
    expect(workJourneySeam.preflight(state({}))).toEqual({ ok: true });
  });

  it('a work template that is NOT allow-listed (granth) ⇒ engine-disabled', () => {
    const result = workJourneySeam.preflight(state({ templateId: 'granth' }));
    expect(result.ok === false && result.reason).toBe('engine-disabled');
    expect(result.ok === false && result.message.length).toBeGreaterThan(0);
  });

  it('no work facts ⇒ missing-facts (getWorkFacts null 400s the strategy route unrecoverably)', () => {
    for (const facts of [undefined, null, {}, { entry: { businessName: 'x' } }]) {
      const result = workJourneySeam.preflight(state({ briefFacts: facts }));
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe('missing-facts');
    }
  });

  it('a KIND-LESS group ⇒ missing-facts, not a green light into an unrecoverable 400 (landmine 6)', () => {
    const broken = {
      work: { identity: { name: 'X' }, groups: [{ name: 'Weddings' }] },
    };
    const result = workJourneySeam.preflight(state({ briefFacts: broken }));
    expect(result.ok === false && result.reason).toBe('missing-facts');
  });

  it('preflight is SYNC (its result is not a promise) — the firewall depends on it', () => {
    expect(workJourneySeam.preflight(state({}))).not.toBeInstanceOf(Promise);
  });
});
