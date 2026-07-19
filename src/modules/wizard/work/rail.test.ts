// src/modules/wizard/work/rail.test.ts
// Unit coverage for the work rail data model (work-onboarding-shell P1).
// The load-bearing assertion repeated throughout: EVERY facts bag this module
// emits must keep `getWorkFacts` NON-NULL — a null there 400s work strategy,
// and because the write PERSISTS, a retry never recovers.

import { describe, it, expect } from 'vitest';
import {
  railFromFacts,
  railFromBrief,
  railFromWorkFacts,
  deriveRailPricePosition,
  seedWorkFactsFromEntry,
  normalizeWorkGroup,
  applyRailEdit,
  appendUserNote,
  workFactsToBriefPatch,
} from './rail';
import { getWorkFacts, WorkFactsSchema, type WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { EntryFacts } from '@/modules/brief/classify';
import type { Brief } from '@/types/brief';

const ENTRY: Partial<EntryFacts> = {
  rawInput: 'I photograph weddings in Amsterdam',
  resolvedEngine: 'work',
  businessName: 'Kundius Studio',
  summary: 'Documentary wedding photography',
  categories: ['photography', 'weddings'],
  offerings: ['Wedding day coverage', 'Engagement session'],
};

const seededFactsBag = (): Record<string, unknown> => ({
  entry: ENTRY,
  collections: { works: [] },
  work: seedWorkFactsFromEntry(ENTRY),
});

describe('seedWorkFactsFromEntry', () => {
  it('maps businessName/summary/offerings → identity + descriptor + groups', () => {
    const seeded = seedWorkFactsFromEntry(ENTRY);
    expect(seeded).not.toBeNull();
    expect(seeded!.identity).toEqual({
      name: 'Kundius Studio',
      descriptor: 'Documentary wedding photography',
    });
    expect(seeded!.groups).toEqual([
      { name: 'Wedding day coverage', kind: 'category', price: { mode: 'on-request' } },
      { name: 'Engagement session', kind: 'category', price: { mode: 'on-request' } },
    ]);
  });

  it('REGRESSION (blocker-2): every seeded group carries kind + a valid price, and the bag passes getWorkFacts', () => {
    const seeded = seedWorkFactsFromEntry(ENTRY)!;
    for (const g of seeded.groups ?? []) {
      expect(g.kind).toBe('category');
      expect(g.price.mode).toBe('on-request');
    }
    // The exact failure mode: a kind-less group nulls getWorkFacts.
    const kindless = { identity: { name: 'X' }, groups: [{ name: 'A', price: { mode: 'on-request' } }] };
    expect(getWorkFacts({ work: kindless })).toBeNull();
    // What we actually emit does not.
    expect(getWorkFacts({ work: seeded })).not.toBeNull();
  });

  it('falls back to categories for the descriptor when summary is missing', () => {
    const seeded = seedWorkFactsFromEntry({ businessName: 'A', categories: ['photography', 'weddings'] });
    expect(seeded!.identity!.descriptor).toBe('photography, weddings');
  });

  it('OMITS identity entirely when businessName is empty/missing (name is REQUIRED inside identity)', () => {
    const seeded = seedWorkFactsFromEntry({ businessName: '   ', summary: 'Some summary', offerings: ['Thing'] });
    expect(seeded).not.toBeNull();
    expect(seeded!.identity).toBeUndefined();
    expect('identity' in seeded!).toBe(false);
    expect(getWorkFacts({ work: seeded })).not.toBeNull();
  });

  it('emits nothing (null) for empty / garbage / sparse entry facts', () => {
    expect(seedWorkFactsFromEntry(null)).toBeNull();
    expect(seedWorkFactsFromEntry(undefined)).toBeNull();
    expect(seedWorkFactsFromEntry({})).toBeNull();
    expect(seedWorkFactsFromEntry({ summary: 'only a summary' })).toBeNull();
    // getEntryFacts is a raw cast — garbage can reach us.
    expect(
      seedWorkFactsFromEntry({ businessName: 42, offerings: 'not-an-array' } as unknown as Partial<EntryFacts>)
    ).toBeNull();
  });

  it('drops junk offerings but keeps valid ones', () => {
    const seeded = seedWorkFactsFromEntry({
      businessName: 'A',
      offerings: ['  ', 'Portraits', null, 7] as unknown as string[],
    });
    expect(seeded!.groups).toEqual([{ name: 'Portraits', kind: 'category', price: { mode: 'on-request' } }]);
    expect(getWorkFacts({ work: seeded })).not.toBeNull();
  });

  it('B7(a): descriptor falls back to oneLiner when summary + categories absent (name present)', () => {
    const seeded = seedWorkFactsFromEntry({
      businessName: 'Ava',
      oneLiner: 'Wedding photographer in Amsterdam',
    });
    // Pre-fix: descriptor derived only from summary/categories ⇒ null skeleton.
    expect(railFromWorkFacts(seeded).descriptor).toBe('Wedding photographer in Amsterdam');
  });

  it('B7(a): descriptor falls back to rawInput when even oneLiner absent', () => {
    const seeded = seedWorkFactsFromEntry({
      businessName: 'Ava',
      rawInput: 'I shoot weddings',
    });
    expect(railFromWorkFacts(seeded).descriptor).toBe('I shoot weddings');
  });
});

describe('workFacts.schema additive-optional fields', () => {
  it('getWorkFacts is non-null for facts that OMIT descriptor/userNotes', () => {
    const legacy = { identity: { name: 'A' }, groups: [{ name: 'G', kind: 'category', price: { mode: 'on-request' } }] };
    expect(getWorkFacts({ work: legacy })).not.toBeNull();
  });

  it('getWorkFacts is non-null for facts that INCLUDE descriptor/userNotes', () => {
    const next = {
      identity: { name: 'A', descriptor: 'What we do' },
      groups: [{ name: 'G', kind: 'category', price: { mode: 'on-request' } }],
      userNotes: ['you got my city wrong'],
    };
    const parsed = getWorkFacts({ work: next });
    expect(parsed).not.toBeNull();
    expect(parsed!.identity!.descriptor).toBe('What we do');
    expect(parsed!.userNotes).toEqual(['you got my city wrong']);
  });
});

describe('railFromFacts (projection)', () => {
  it('round-trips seeded facts onto the rail', () => {
    const rail = railFromFacts(seededFactsBag());
    expect(rail.name).toBe('Kundius Studio');
    expect(rail.descriptor).toBe('Documentary wedding photography');
    expect(rail.groups.map((g) => g.name)).toEqual(['Wedding day coverage', 'Engagement session']);
    expect(rail.groups[0].priceLabel).toBe('On request');
  });

  it('all-unknown rail for missing / invalid work facts (never throws)', () => {
    for (const bag of [undefined, {}, { work: null }, { work: { groups: 'nope' } }]) {
      const rail = railFromFacts(bag as Record<string, unknown> | undefined);
      expect(rail.name).toBeNull();
      expect(rail.descriptor).toBeNull();
      expect(rail.groups).toEqual([]);
      expect(rail.pricePosition).toBeNull();
      expect(rail.userNotes).toEqual([]);
    }
  });

  it('projects carried fields + price labels', () => {
    const work: WorkFacts = {
      identity: { name: 'A', location: 'Amsterdam', reach: 'Europe' },
      groups: [
        { name: 'X', kind: 'category', price: { mode: 'from', amount: 500, currency: '€' } },
        { name: 'Y', kind: 'story', price: { mode: 'exact', amount: 1200 } },
      ],
      languages: ['en', 'nl'],
      establishment: 'established',
      dreamClient: 'discerning couples',
      praise: ['great'],
      contactMethod: 'form',
    };
    const rail = railFromWorkFacts(work);
    expect(rail.location).toBe('Amsterdam');
    expect(rail.reach).toBe('Europe');
    expect(rail.languages).toEqual(['en', 'nl']);
    expect(rail.establishment).toBe('established');
    expect(rail.contactMethod).toBe('form');
    expect(rail.groups[0].priceLabel).toBe('From €500');
    expect(rail.groups[1].priceLabel).toBe('1200');
  });

  it('NIT: currency SYMBOL sits directly against the amount (no space)', () => {
    const work: WorkFacts = {
      identity: { name: 'A' },
      groups: [
        { name: 'X', kind: 'category', price: { mode: 'from', amount: 2400, currency: '$' } },
        { name: 'Y', kind: 'category', price: { mode: 'exact', amount: 900, currency: '£' } },
        { name: 'Z', kind: 'category', price: { mode: 'exact', amount: 700 } }, // no currency
      ],
    };
    const rail = railFromWorkFacts(work);
    // Pre-fix: "From $ 2400" / "£ 900".
    expect(rail.groups[0].priceLabel).toBe('From $2400');
    expect(rail.groups[1].priceLabel).toBe('£900');
    expect(rail.groups[2].priceLabel).toBe('700');
  });

  it('railFromBrief reads brief.facts', () => {
    const brief = { facts: seededFactsBag() } as Brief;
    expect(railFromBrief(brief).name).toBe('Kundius Studio');
    expect(railFromBrief(null).name).toBeNull();
  });
});

describe('deriveRailPricePosition (DERIVED, never stored)', () => {
  it('unknown (null) with no facts / no groups', () => {
    expect(deriveRailPricePosition(null)).toBeNull();
    expect(deriveRailPricePosition({})).toBeNull();
    expect(deriveRailPricePosition({ identity: { name: 'A' } })).toBeNull();
  });

  it('defers to the canonical rubric once a genuine signal exists', () => {
    const base = (extra: Partial<WorkFacts>): WorkFacts => ({
      identity: { name: 'A' },
      groups: [{ name: 'G', kind: 'category', price: { mode: 'on-request' } }],
      ...extra,
    });
    // qa-0718 B7: on-request only, NO price/keyword signal ⇒ null (honest
    // skeleton, not a confident band over zero evidence). Was 'middle' pre-fix.
    expect(deriveRailPricePosition(base({}))).toBeNull();
    // on-request + premium dreamClient (keyword signal) ⇒ premium
    expect(deriveRailPricePosition(base({ dreamClient: 'discerning, high-end couples' }))).toBe('premium');
    // low from-priced (stated-price signal) + friendly dreamClient ⇒ friendly
    expect(
      deriveRailPricePosition({
        identity: { name: 'A' },
        groups: [{ name: 'G', kind: 'category', price: { mode: 'from', amount: 100 } }],
        dreamClient: 'local families on a budget',
      })
    ).toBe('friendly');
  });

  it('B7 (qa-0718): seeded on-request-only ⇒ null even though groups exist (was premature "Mid-range")', () => {
    const seeded = seedWorkFactsFromEntry({ offerings: ['Portraits'] } as Partial<EntryFacts>)!;
    // groups DO exist (the pre-fix null-only-when-empty gate would fire 'middle')…
    expect((seeded.groups ?? []).length).toBeGreaterThan(0);
    // …but with no stated price and no keyword there is no evidence ⇒ null.
    expect(deriveRailPricePosition(seeded)).toBeNull();
  });

  it('B7 (qa-0718): a stated amount that nets to middle is still SHOWN (signal present)', () => {
    // amount-bearing price is a genuine signal even when the band is 'middle'.
    const withPrice: WorkFacts = {
      identity: { name: 'A' },
      groups: [{ name: 'G', kind: 'category', price: { mode: 'exact', amount: 800 } }],
    };
    expect(deriveRailPricePosition(withPrice)).toBe('middle');
  });

  it('is never persisted — no pricePosition key survives a rail write', () => {
    const res = applyRailEdit({ field: 'name', value: 'A' }, seededFactsBag());
    expect(res.ok).toBe(true);
    const work = (res as { facts: Record<string, unknown> }).facts['work'] as Record<string, unknown>;
    expect('pricePosition' in work).toBe(false);
    expect(JSON.stringify(work)).not.toContain('pricePosition');
  });
});

describe('normalizeWorkGroup (landmine 6)', () => {
  it('defaults kind:category + price on-request', () => {
    expect(normalizeWorkGroup({ name: '  Portraits ' })).toEqual({
      name: 'Portraits',
      kind: 'category',
      price: { mode: 'on-request' },
    });
  });

  it('keeps a valid exact/from amount, falls back to on-request otherwise', () => {
    expect(normalizeWorkGroup({ name: 'A', price: { mode: 'exact', amount: 900, currency: 'EUR' } })).toEqual({
      name: 'A',
      kind: 'category',
      price: { mode: 'exact', amount: 900, currency: 'EUR' },
    });
    // exact/from WITHOUT an amount would fail WorkPriceSchema's refinement.
    expect(normalizeWorkGroup({ name: 'A', price: { mode: 'exact' } })!.price).toEqual({ mode: 'on-request' });
    expect(normalizeWorkGroup({ name: 'A', price: { mode: 'from', amount: NaN } })!.price).toEqual({
      mode: 'on-request',
    });
  });

  it('PRESERVES E2-ingested photos/items (rail edits must not wipe them)', () => {
    const g = normalizeWorkGroup({
      name: 'Weddings',
      photos: [{ id: 'p1', url: 'https://x/1.jpg', cover: true }],
      items: [{ name: 'Anna & Bo', photos: [{ id: 'p2' }], client: 'Anna' }],
    })!;
    expect(g).toEqual({
      name: 'Weddings',
      kind: 'category',
      price: { mode: 'on-request' },
      photos: [{ id: 'p1', url: 'https://x/1.jpg', cover: true }],
      items: [{ name: 'Anna & Bo', photos: [{ id: 'p2' }], client: 'Anna' }],
    });
    expect(WorkFactsSchema.safeParse({ groups: [g] }).success).toBe(true);
    // Absent keys stay ABSENT (no {photos: undefined} noise in persisted facts).
    const plain = normalizeWorkGroup({ name: 'Portraits' })!;
    expect('photos' in plain).toBe(false);
    expect('items' in plain).toBe(false);
  });

  it('returns null for an unnameable group; every non-null result parses', () => {
    expect(normalizeWorkGroup({ name: '   ' })).toBeNull();
    expect(normalizeWorkGroup(null)).toBeNull();
    const g = normalizeWorkGroup({ name: 'A', kind: 'story' })!;
    expect(g.kind).toBe('story');
    expect(WorkFactsSchema.safeParse({ groups: [g] }).success).toBe(true);
  });
});

describe('applyRailEdit — full-facts re-emit + snapshot sync', () => {
  it('preserves siblings (facts.entry / facts.collections) — landmine 4', () => {
    const live = seededFactsBag();
    const res = applyRailEdit({ field: 'location', value: 'Amsterdam' }, live);
    expect(res.ok).toBe(true);
    const { patch, facts } = res as { patch: Partial<Brief>; facts: Record<string, unknown> };
    expect(patch.facts).toBe(facts); // same bag ⇒ store can sync + persist atomically
    expect(facts['entry']).toEqual(ENTRY);
    expect(facts['collections']).toEqual({ works: [] });
    expect(getWorkFacts(facts)!.identity!.location).toBe('Amsterdam');
  });

  it('two consecutive edits both survive when the caller feeds back the merged bag (reviewer #6)', () => {
    const first = applyRailEdit({ field: 'name', value: 'New Name' }, seededFactsBag());
    expect(first.ok).toBe(true);
    const second = applyRailEdit(
      { field: 'descriptor', value: 'Portrait photography' },
      (first as { facts: Record<string, unknown> }).facts
    );
    expect(second.ok).toBe(true);
    const work = getWorkFacts((second as { facts: Record<string, unknown> }).facts)!;
    expect(work.identity).toEqual({ name: 'New Name', descriptor: 'Portrait photography' });
    expect(work.groups).toHaveLength(2);
  });

  it('B7(b): committing the name back-fills descriptor from entry when the seed had none', () => {
    // No businessName ⇒ seed emits NO identity ⇒ its derived descriptor is
    // dropped (documented). The entry (with only a oneLiner) is preserved on
    // the facts bag the real flow re-emits.
    const noNameEntry: Partial<EntryFacts> = { oneLiner: 'Wedding photographer in Amsterdam' };
    const seed = seedWorkFactsFromEntry(noNameEntry);
    expect(seed).toBeNull(); // no name, no groups ⇒ nothing to seed
    const liveFacts: Record<string, unknown> = { entry: noNameEntry, collections: { works: [] } };
    const res = applyRailEdit({ field: 'name', value: 'Ava' }, liveFacts);
    expect(res.ok).toBe(true);
    const work = getWorkFacts((res as { facts: Record<string, unknown> }).facts)!;
    // Pre-fix: identity = {name:'Ava'} only ⇒ descriptor absent.
    expect(work.identity).toEqual({ name: 'Ava', descriptor: 'Wedding photographer in Amsterdam' });
  });

  it('B7(b): committing the name does NOT overwrite an already-answered descriptor', () => {
    const liveFacts: Record<string, unknown> = {
      entry: { oneLiner: 'from the entry' } as Partial<EntryFacts>,
      work: { identity: { name: 'Old', descriptor: 'answered by hand' } },
    };
    const res = applyRailEdit({ field: 'name', value: 'New' }, liveFacts);
    expect(res.ok).toBe(true);
    const work = getWorkFacts((res as { facts: Record<string, unknown> }).facts)!;
    expect(work.identity).toEqual({ name: 'New', descriptor: 'answered by hand' });
  });

  it('rejects invalid edits instead of sending them (landmine 5)', () => {
    const live = seededFactsBag();
    expect(applyRailEdit({ field: 'name', value: '  ' }, live)).toEqual({
      ok: false,
      error: 'Name cannot be empty',
    });
    expect(applyRailEdit({ field: 'note', value: '' }, live).ok).toBe(false);
    expect(applyRailEdit({ field: 'groups', value: [{ name: '  ' }] }, live).ok).toBe(false);
    // No name to hang identity on ⇒ refuse rather than emit {name: undefined}.
    expect(applyRailEdit({ field: 'descriptor', value: 'x' }, { entry: ENTRY }).ok).toBe(false);
  });

  it('group edits always emit kind + a valid price; getWorkFacts stays non-null', () => {
    const res = applyRailEdit(
      { field: 'groups', value: [{ name: 'Weddings' }, { name: 'Portraits', price: { mode: 'from', amount: 400 } }] },
      seededFactsBag()
    );
    expect(res.ok).toBe(true);
    const work = getWorkFacts((res as { facts: Record<string, unknown> }).facts)!;
    expect(work.groups).toEqual([
      { name: 'Weddings', kind: 'category', price: { mode: 'on-request' } },
      { name: 'Portraits', kind: 'category', price: { mode: 'from', amount: 400 } },
    ]);
  });

  it('a groups edit carrying E2 photos/items round-trips them intact; the bag still passes getWorkFacts', () => {
    const photos = [{ id: 'p1', url: 'https://x/1.jpg', alt: 'a', cover: true }];
    const items = [{ name: 'Anna & Bo', photos: [{ id: 'p2' }], problem: 'rain', result: 'sun' }];
    // Live bag as E2 ingestion would leave it: a group with photos already on it.
    const live: Record<string, unknown> = {
      ...seededFactsBag(),
      work: { identity: { name: 'Kundius Studio' }, groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos, items }] },
    };
    expect(getWorkFacts(live)!.groups![0].photos).toEqual(photos);

    // The edit re-sends the group (price changed) WITH its photos/items.
    const res = applyRailEdit(
      { field: 'groups', value: [{ name: 'Weddings', price: { mode: 'from', amount: 900, currency: 'EUR' }, photos, items }] },
      live
    );
    expect(res.ok).toBe(true);
    const facts = (res as { facts: Record<string, unknown> }).facts;
    const work = getWorkFacts(facts);
    expect(work).not.toBeNull();
    expect(work!.groups).toEqual([
      { name: 'Weddings', kind: 'category', price: { mode: 'from', amount: 900, currency: 'EUR' }, photos, items },
    ]);
    expect(facts['entry']).toEqual(ENTRY);
  });

  it('works from an EMPTY facts bag (pre-E1 project with no facts.work)', () => {
    const res = applyRailEdit({ field: 'name', value: 'Studio' }, undefined);
    expect(res.ok).toBe(true);
    const facts = (res as { facts: Record<string, unknown> }).facts;
    expect(getWorkFacts(facts)!.identity).toEqual({ name: 'Studio' });
  });

  it('languages edit round-trips and clears to undefined when emptied', () => {
    const set = applyRailEdit({ field: 'languages', value: ['en', ' nl '] }, seededFactsBag());
    expect(getWorkFacts((set as { facts: Record<string, unknown> }).facts)!.languages).toEqual(['en', 'nl']);
    const cleared = applyRailEdit({ field: 'languages', value: [] }, (set as { facts: Record<string, unknown> }).facts);
    expect(getWorkFacts((cleared as { facts: Record<string, unknown> }).facts)!.languages).toBeUndefined();
  });

  // ── E3 STEP 03 question write paths (D-H) ─────────────────────────────────
  it('establishment edit round-trips and preserves siblings + groups photos/items', () => {
    const photos = [{ id: 'p1', url: 'https://x/1.jpg' }];
    const items = [{ name: 'Anna & Bo', photos: [{ id: 'p2' }] }];
    const live: Record<string, unknown> = {
      entry: ENTRY,
      collections: { works: [] },
      work: { identity: { name: 'Kundius Studio' }, groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos, items }] },
    };
    const res = applyRailEdit({ field: 'establishment', value: 'new' }, live);
    expect(res.ok).toBe(true);
    const facts = (res as { facts: Record<string, unknown> }).facts;
    const work = getWorkFacts(facts)!;
    expect(work.establishment).toBe('new');
    // Siblings + E2 ingestion payload survive the write.
    expect(facts['entry']).toEqual(ENTRY);
    expect(facts['collections']).toEqual({ works: [] });
    expect(work.groups![0].photos).toEqual(photos);
    expect(work.groups![0].items).toEqual(items);
  });

  it('dreamClient edit round-trips (trimmed) and rejects an empty value', () => {
    const res = applyRailEdit({ field: 'dreamClient', value: '  discerning couples  ' }, seededFactsBag());
    expect(getWorkFacts((res as { facts: Record<string, unknown> }).facts)!.dreamClient).toBe('discerning couples');
    expect(applyRailEdit({ field: 'dreamClient', value: '   ' }, seededFactsBag()).ok).toBe(false);
  });

  it('praise edit round-trips verbatim quotes and unsets when emptied', () => {
    const set = applyRailEdit({ field: 'praise', value: ['Best day', ' Stunning ', ''] }, seededFactsBag());
    expect(getWorkFacts((set as { facts: Record<string, unknown> }).facts)!.praise).toEqual(['Best day', 'Stunning']);
    const cleared = applyRailEdit({ field: 'praise', value: [] }, (set as { facts: Record<string, unknown> }).facts);
    expect(getWorkFacts((cleared as { facts: Record<string, unknown> }).facts)!.praise).toBeUndefined();
  });

  it('contactMethod edit round-trips and keeps the bag valid', () => {
    const res = applyRailEdit({ field: 'contactMethod', value: 'whatsapp' }, seededFactsBag());
    const work = getWorkFacts((res as { facts: Record<string, unknown> }).facts)!;
    expect(work.contactMethod).toBe('whatsapp');
    expect(work.identity!.name).toBe('Kundius Studio');
    expect(work.groups).toHaveLength(2);
  });

  it('the four E3 fields write onto a bag with NO name (no identity dependency)', () => {
    // establishment/dreamClient/praise/contactMethod do NOT hang off identity —
    // unlike descriptor/location/reach they must write even with no name present.
    for (const edit of [
      { field: 'establishment', value: 'established' } as const,
      { field: 'dreamClient', value: 'couples' } as const,
      { field: 'praise', value: ['great'] } as const,
      { field: 'contactMethod', value: 'form' } as const,
    ]) {
      const res = applyRailEdit(edit, { entry: ENTRY });
      expect(res.ok, `${edit.field} should write without a name`).toBe(true);
      expect((res as { facts: Record<string, unknown> }).facts['entry']).toEqual(ENTRY);
    }
  });
});

describe('appendUserNote', () => {
  it('appends (never overwrites) and keeps the bag valid', () => {
    const one = appendUserNote('You got my city wrong', seededFactsBag());
    const two = appendUserNote('I also do film', (one as { facts: Record<string, unknown> }).facts);
    const work = getWorkFacts((two as { facts: Record<string, unknown> }).facts)!;
    expect(work.userNotes).toEqual(['You got my city wrong', 'I also do film']);
    expect(work.identity!.name).toBe('Kundius Studio');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// qa-0718 B5 / B6 — rail projection of provenance + the answered charge.
// ─────────────────────────────────────────────────────────────────────────────

describe('rail projection — provenance (B5) + answered charge (B6)', () => {
  it('B5: railFromWorkFacts carries group origin (upload buckets are marked)', () => {
    const work: WorkFacts = {
      identity: { name: 'A' },
      groups: [
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, origin: 'offer' },
        { name: 'Mar 10, 2025', kind: 'category', price: { mode: 'on-request' }, origin: 'upload' },
      ],
    };
    const rail = railFromWorkFacts(work);
    expect(rail.groups.map((g) => g.origin)).toEqual(['offer', 'upload']);
  });

  it('B6: priceLabel is null (skeleton) for seeded on-request-only facts', () => {
    // pre-fix there was no rail.priceLabel field at all (undefined).
    expect(railFromFacts(seededFactsBag()).priceLabel).toBeNull();
  });

  it('B6: priceLabel fills after an amount-bearing answer through the edit door', () => {
    // Seed = on-request groups. Answer a from-price through applyRailEdit — the
    // SINGLE write gate the STEP 03 charge answer (commitGroupPrice) routes
    // through — and the representative charge becomes visible in the rail.
    const seeded = seededFactsBag();
    const groups = (getWorkFacts(seeded)!.groups ?? []).map((g) => ({
      ...g,
      price: { mode: 'from' as const, amount: 2400, currency: '€' },
    }));
    const res = applyRailEdit({ field: 'groups', value: groups }, seeded);
    expect(res.ok).toBe(true);
    const rail = railFromFacts((res as { facts: Record<string, unknown> }).facts);
    expect(rail.priceLabel).toBe('From €2400');
  });
});

describe('workFactsToBriefPatch', () => {
  it('rejects work facts that would null getWorkFacts (kind-less group)', () => {
    const bad = { identity: { name: 'A' }, groups: [{ name: 'G', price: { mode: 'on-request' } }] } as unknown as WorkFacts;
    const res = workFactsToBriefPatch(bad, {});
    expect(res.ok).toBe(false);
  });

  it('accepts the seed and re-emits the complete facts bag', () => {
    const seeded = seedWorkFactsFromEntry(ENTRY)!;
    const res = workFactsToBriefPatch(seeded, { entry: ENTRY });
    expect(res.ok).toBe(true);
    const facts = (res as { facts: Record<string, unknown> }).facts;
    expect(facts['entry']).toEqual(ENTRY);
    expect(getWorkFacts(facts)).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// work-library-board phase 1 — board-owned additive fields: `slug` (group) +
// `hidden` (photo). PROVES additive-optional (old facts parse) + that the board
// fields survive `normalizeWorkGroup` / `applyRailEdit({field:'groups'})` re-emit.
// ─────────────────────────────────────────────────────────────────────────────

describe('board-owned fields — slug + hidden (additive-optional)', () => {
  it('pre-existing facts WITHOUT slug/hidden still parse (getWorkFacts non-null)', () => {
    const legacy = {
      identity: { name: 'Kundius Studio' },
      groups: [
        {
          name: 'Weddings',
          kind: 'category',
          price: { mode: 'on-request' },
          photos: [{ id: 'p1', url: 'https://cdn/1.jpg' }],
        },
      ],
    };
    const work = getWorkFacts({ work: legacy });
    expect(work).not.toBeNull();
    expect(work!.groups![0]).not.toHaveProperty('slug');
    expect(work!.groups![0].photos![0]).not.toHaveProperty('hidden');
  });

  it('normalizeWorkGroup preserves a non-empty trimmed slug, omits blank', () => {
    const withSlug = normalizeWorkGroup({ name: 'Weddings', slug: '  weddings  ' });
    expect(withSlug!.slug).toBe('weddings');
    const blank = normalizeWorkGroup({ name: 'Weddings', slug: '   ' });
    expect(blank).not.toHaveProperty('slug');
    const absent = normalizeWorkGroup({ name: 'Weddings' });
    expect(absent).not.toHaveProperty('slug');
  });

  it('normalizeWorkGroup carries hidden photo refs verbatim', () => {
    const g = normalizeWorkGroup({
      name: 'Weddings',
      photos: [
        { id: 'p1', url: 'https://cdn/1.jpg' },
        { id: 'p2', url: 'https://cdn/2.jpg', hidden: true },
      ],
    });
    expect(g!.photos).toEqual([
      { id: 'p1', url: 'https://cdn/1.jpg' },
      { id: 'p2', url: 'https://cdn/2.jpg', hidden: true },
    ]);
  });

  it('normalizeWorkGroup carries origin (qa-0718 B5); absent stays ABSENT (= offer)', () => {
    expect(normalizeWorkGroup({ name: 'asset', origin: 'upload' })!.origin).toBe('upload');
    expect(normalizeWorkGroup({ name: 'Weddings', origin: 'offer' })!.origin).toBe('offer');
    expect(normalizeWorkGroup({ name: 'Weddings' })).not.toHaveProperty('origin');
  });

  it('applyRailEdit({field:groups}) re-emits slug + hidden through the schema gate', () => {
    const res = applyRailEdit(
      {
        field: 'groups',
        value: [
          {
            name: 'Weddings',
            slug: 'weddings',
            photos: [
              { id: 'p1', url: 'https://cdn/1.jpg', cover: true },
              { id: 'p2', url: 'https://cdn/2.jpg', hidden: true },
            ],
          },
        ],
      },
      { entry: ENTRY },
    );
    expect(res.ok).toBe(true);
    const work = getWorkFacts((res as { facts: Record<string, unknown> }).facts)!;
    expect(work.groups![0].slug).toBe('weddings');
    expect(work.groups![0].photos![1].hidden).toBe(true);
  });
});
