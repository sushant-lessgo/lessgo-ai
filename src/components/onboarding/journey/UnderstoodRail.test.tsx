// ============================================================================
// UnderstoodRail + `commitRail` (work-onboarding-shell P3).
//
// Two things are pinned here, both landmine-class:
//
//  1. PERSISTENCE FAILURE ⇒ REVERT + TOAST (decision 5). `briefFacts` is what
//     GENERATION reads (`resolveWorkBrief` → `buildWorkInput`), so keeping an
//     optimistic belief we failed to persist would make STEP 05 generate from
//     data that vanishes on reload — silent divergence. A mocked non-2xx
//     saveDraft must leave `briefFacts` AND the mirrored `fields` byte-identical
//     to the pre-edit snapshot, and must say so out loud.
//
//  2. THE CHIP DRAFT NEVER SURVIVES A COMMIT (chip stable-id rule). The chips
//     editor is keyed on the facts-bag identity, so a commit unmounts it and its
//     ids — which are valid only against the bag that issued them — die with it.
//
// The rail is exercised through the REAL work seam adapter: a hand-rolled fake
// adapter would prove the test, not the product.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo).
// ============================================================================

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import UnderstoodRail, { type EngineRailFieldData } from './UnderstoodRail';
import { workJourneySeam } from './engines/work';
import { ToastProvider } from '@/components/ui/toast';
import { useWizardStore } from '@/hooks/useWizardStore';
import type { Brief } from '@/types/brief';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import { applyRailEdit, type WorkGroupInput } from '@/modules/wizard/work/rail';
import {
  proposeGroups,
  mergeProposalIntoGroups,
} from '@/modules/wizard/work/ingest/proposeGroups';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

/** An E2-shaped confirmed work brief (groups carrying photos). */
const WORK_BRIEF = (): Brief =>
  ({
    businessType: 'photographer',
    copyEngine: 'work',
    facts: {
      entry: { businessName: 'Kundius Studio', summary: 'Documentary wedding photography' },
      work: {
        identity: { name: 'Kundius Studio', descriptor: 'Documentary wedding photography' },
        groups: [
          {
            name: 'Weddings',
            kind: 'category',
            price: { mode: 'on-request' },
            photos: [{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }],
          },
          { name: 'Portraits', kind: 'category', price: { mode: 'on-request' } },
        ],
      },
    },
    confidence: 0.9,
  }) as unknown as Brief;

function mockSaveDraft(ok: boolean) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => ({}) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

const q = <T extends Element>(sel: string) => container.querySelector<T>(sel);
const testid = <T extends Element>(id: string) => q<T>(`[data-testid="${id}"]`);

async function click(el: Element | null) {
  expect(el, 'element to click').not.toBeNull();
  await act(async () => {
    el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();
}

/** React tracks its own value on inputs — set through the native setter. */
async function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )!.set!;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function mountRail() {
  await act(async () => {
    root.render(
      <ToastProvider>
        <UnderstoodRail rail={workJourneySeam.rail} />
      </ToastProvider>
    );
  });
  await flush();
}

beforeEach(async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  useWizardStore.getState().reset();
  await act(async () => {
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tok_test', brief: WORK_BRIEF(), audienceType: 'service', templateId: 'atelier' });
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Rendering — the agnostic rail over the work projection
// ─────────────────────────────────────────────────────────────────────────────

describe('UnderstoodRail — rendering the seam projection', () => {
  it('renders the four seeded fields and the group chips', async () => {
    await mountRail();
    expect(testid('rail-field-name')).not.toBeNull();
    expect(testid('rail-field-descriptor')).not.toBeNull();
    expect(testid('rail-field-groups')).not.toBeNull();
    expect(testid('rail-field-pricePosition')).not.toBeNull();

    expect(testid('rail-value-name')?.textContent).toBe('Kundius Studio');
    expect(testid('rail-chip-g0')?.textContent).toBe('Weddings');
    expect(testid('rail-chip-g1')?.textContent).toBe('Portraits');
  });

  it('shows the honest UNKNOWN state (stripes + opacity) for a derived field with no evidence', async () => {
    // No groups ⇒ no prices ⇒ no price band. Unknown, not a default.
    await act(async () => {
      useWizardStore.getState().hydrate({
        tokenId: 'tok_test',
        brief: {
          businessType: 'photographer',
          copyEngine: 'work',
          facts: { work: { identity: { name: 'Solo' } } },
        } as unknown as Brief,
      });
    });
    await mountRail();
    expect(testid('rail-skeleton-pricePosition')).not.toBeNull();
    expect(testid('rail-field-pricePosition')?.getAttribute('data-skeleton')).toBe('true');
    expect(testid('rail-field-pricePosition')?.className).toContain('opacity-50');
  });

  it('a derived field offers no edit affordance (editable:false)', async () => {
    await mountRail();
    expect(testid('rail-edit-pricePosition')).toBeNull();
    expect(testid('rail-edit-name')).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Commit — success
// ─────────────────────────────────────────────────────────────────────────────

describe('UnderstoodRail — a successful edit', () => {
  it('persists a NAME edit, applies the seam-declared field mirror, and keeps siblings', async () => {
    const fetchMock = mockSaveDraft(true);
    await mountRail();

    await click(testid('rail-edit-name'));
    await type(testid<HTMLInputElement>('rail-input-name')!, 'Kundius');
    await click(testid('rail-save-name'));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/saveDraft');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.tokenId).toBe('tok_test');
    // FULL-facts re-emit — the sibling entry bag rides along (landmine 4).
    expect(body.brief.facts.entry.businessName).toBe('Kundius Studio');
    expect(body.brief.facts.work.identity.name).toBe('Kundius');

    const state = useWizardStore.getState();
    expect((state.briefFacts as any).work.identity.name).toBe('Kundius');
    expect(state.fields['name']?.value).toBe('Kundius'); // the mirror
    // The rail re-projected from the committed bag.
    expect(testid('rail-value-name')?.textContent).toBe('Kundius');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Commit — failure ⇒ REVERT + toast (decision 5)
// ─────────────────────────────────────────────────────────────────────────────

describe('UnderstoodRail — persistence failure', () => {
  it('a non-2xx saveDraft REVERTS briefFacts + the mirrored field, and toasts', async () => {
    mockSaveDraft(false);
    await mountRail();

    const factsBefore = JSON.stringify(useWizardStore.getState().briefFacts);
    const fieldsBefore = JSON.stringify(useWizardStore.getState().fields);

    await click(testid('rail-edit-name'));
    await type(testid<HTMLInputElement>('rail-input-name')!, 'Wrong Name');
    await click(testid('rail-save-name'));

    // The belief we could not persist must NOT survive: generation reads
    // briefFacts, so keeping it would silently diverge from the DB at STEP 05.
    expect(JSON.stringify(useWizardStore.getState().briefFacts)).toBe(factsBefore);
    expect(JSON.stringify(useWizardStore.getState().fields)).toBe(fieldsBefore);

    // Said out loud, not swallowed (the toast portals to <body>).
    expect(document.body.textContent).toContain('reverted');
  });

  it('a seam-rejected edit is surfaced and never sent (landmine 5)', async () => {
    const fetchMock = mockSaveDraft(true);
    await mountRail();

    await click(testid('rail-edit-name'));
    await type(testid<HTMLInputElement>('rail-input-name')!, '   ');
    await click(testid('rail-save-name'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Name cannot be empty');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// commitRail — SERIALIZATION (P4 step 6)
//
// `commitRail` gained a SECOND caller in P4 (STEP 03's questions), outside the
// rail — so the rail's `saving` flag no longer prevents overlapping commits.
// Its revert restores a pre-edit snapshot WHOLESALE, so without serialization a
// later failure can wipe an earlier SUCCESS: B snapshots before A lands, A
// succeeds, B fails, B restores the pre-A bag — and `briefFacts` (what
// generation reads) silently diverges from the DB.
// ─────────────────────────────────────────────────────────────────────────────

describe('commitRail — serialization', () => {
  it('two overlapping commits: the FIRST succeeds, the SECOND fails ⇒ the first survives', async () => {
    const seam = workJourneySeam.rail;
    const store = useWizardStore.getState();

    // saveDraft: #1 → 200, #2 → 500.
    let call = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        call += 1;
        return { ok: call === 1, status: call === 1 ? 200 : 500, json: async () => ({}) };
      })
    );

    const facts0 = useWizardStore.getState().briefFacts;
    const editA = seam.applyEdit('name', { kind: 'text', value: 'Kundius A' }, facts0 ?? undefined);
    const editB = seam.applyEdit(
      'descriptor',
      { kind: 'text', value: 'Descriptor B' },
      // Built from the SAME pre-commit bag — this IS the overlap. (In the UI
      // the two callers are the rail and STEP 03.)
      facts0 ?? undefined
    );
    if (!editA.ok || !editB.ok) throw new Error('fixture edits must be valid');

    // Fired without awaiting the first — the interleave the queue must absorb.
    const [a, b] = await Promise.all([store.commitRail(editA), store.commitRail(editB)]);

    expect(a.ok, 'commit A persisted').toBe(true);
    expect(b.ok, 'commit B was rejected by saveDraft').toBe(false);

    // THE ASSERTION: B's revert undid only B. A's fact — which the DB has —
    // is still in briefFacts.
    const work = (useWizardStore.getState().briefFacts as any).work;
    expect(work.identity.name).toBe('Kundius A');
    // …and B's unpersisted belief is gone (the seeded descriptor is back).
    expect(work.identity.descriptor).toBe('Documentary wedding photography');
  });

  // The mandated first/second-order case above is the one to REASON about, but
  // this is the order that actually breaks without the queue: an EARLY failure's
  // wholesale revert lands AFTER a later commit's optimistic set and wipes it —
  // leaving `briefFacts` (what generation reads) behind a DB that has the write.
  it('the FIRST fails and the SECOND succeeds ⇒ the second survives (the revert undoes only its own edit)', async () => {
    let call = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        call += 1;
        const first = call === 1;
        // The failing commit answers LAST — its revert would otherwise land on
        // top of the successful one.
        await new Promise((r) => setTimeout(r, first ? 20 : 0));
        return { ok: !first, status: first ? 500 : 200, json: async () => ({}) };
      })
    );

    const seam = workJourneySeam.rail;
    const store = useWizardStore.getState();
    const facts0 = useWizardStore.getState().briefFacts ?? undefined;
    const a = seam.applyEdit('name', { kind: 'text', value: 'Doomed' }, facts0);
    const b = seam.applyEdit('descriptor', { kind: 'text', value: 'Survivor' }, facts0);
    if (!a.ok || !b.ok) throw new Error('fixture edits must be valid');

    const [ra, rb] = await Promise.all([store.commitRail(a), store.commitRail(b)]);
    expect(ra.ok).toBe(false);
    expect(rb.ok).toBe(true);

    const work = (useWizardStore.getState().briefFacts as any).work;
    expect(work.identity.descriptor, 'the persisted edit must survive').toBe('Survivor');
    expect(work.identity.name, 'the unpersisted edit must be gone').toBe('Kundius Studio');
  });

  it('commits run one at a time (no interleaving of the optimistic set and the save)', async () => {
    const order: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        const name = JSON.parse(init.body as string).brief.facts.work.identity.name;
        order.push(`start:${name}`);
        await new Promise((r) => setTimeout(r, 10));
        order.push(`end:${name}`);
        return { ok: true, status: 200, json: async () => ({}) };
      })
    );

    const seam = workJourneySeam.rail;
    const store = useWizardStore.getState();
    const facts0 = useWizardStore.getState().briefFacts ?? undefined;
    const a = seam.applyEdit('name', { kind: 'text', value: 'A' }, facts0);
    const b = seam.applyEdit('name', { kind: 'text', value: 'B' }, facts0);
    if (!a.ok || !b.ok) throw new Error('fixture edits must be valid');

    await Promise.all([store.commitRail(a), store.commitRail(b)]);

    expect(order).toEqual(['start:A', 'end:A', 'start:B', 'end:B']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Chips — the lifecycle rule
// ─────────────────────────────────────────────────────────────────────────────

describe('UnderstoodRail — chips', () => {
  it('carries ids verbatim, mints none, and keeps photos through a rename+add', async () => {
    const fetchMock = mockSaveDraft(true);
    await mountRail();

    await click(testid('rail-edit-groups'));
    await type(testid<HTMLInputElement>('rail-chip-input-0')!, 'Wedding days'); // rename g0
    await click(testid('rail-chip-add')); // NEW chip — no id
    await type(testid<HTMLInputElement>('rail-chip-input-2')!, 'Newborn');
    await click(testid('rail-chips-save'));

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    const groups = body.brief.facts.work.groups;
    expect(groups.map((g: { name: string }) => g.name)).toEqual([
      'Wedding days',
      'Portraits',
      'Newborn',
    ]);
    // The rename did NOT wipe the ingested photos (landmine 15, at the UI layer).
    expect(groups[0].photos).toEqual([{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }]);
    expect(groups[2]).toEqual({ name: 'Newborn', kind: 'category', price: { mode: 'on-request' } });
  });

  // ── The chip-draft lifecycle, pinned at the ONE path that exercises the
  // projection key (P4 step 7 — re-pointed from the P3 version, which was
  // TAUTOLOGICAL).
  //
  // The old test clicked `rail-edit-name` to trigger the commit. That changes
  // `editingId` from 'groups' to 'name', which unmounts the chips editor ALL BY
  // ITSELF — so it passed even with `projectionKey` deleted, i.e. it never
  // tested the mechanism that actually stops the photos/items wipe.
  //
  // NoteBox is the only writer INDEPENDENT of `editingId`: a note commits while
  // the chips editor stays open. `commitRail` swaps `briefFacts` for the seam's
  // merged bag ⇒ new projection key ⇒ the editor REMOUNTS, its draft dies, and
  // its ids are re-seeded from the NEW bag. Delete `projectionKey` and this
  // test fails (verified by doing exactly that).
  it('a commit while the chips editor is OPEN remounts it: the draft dies and ids re-seed', async () => {
    const fetchMock = mockSaveDraft(true);
    await mountRail();

    await click(testid('rail-edit-groups'));
    expect(testid('rail-chips-editor-groups')).not.toBeNull();

    // A draft the user has typed but NOT saved. Its ids belong to the CURRENT
    // bag; carrying it across someone else's write is the stale-VM hole.
    await type(testid<HTMLInputElement>('rail-chip-input-0')!, 'DRAFT — never saved');
    expect(testid<HTMLInputElement>('rail-chip-input-0')!.value).toBe('DRAFT — never saved');

    // Commit through a path that does NOT touch `editingId`.
    await type(testid<HTMLInputElement>('rail-note-input')!, 'The prices are wrong');
    await click(testid('rail-note-submit'));

    // Still editing groups — so the editor is here for a reason other than
    // `editingId` changing.
    const editor = testid('rail-chips-editor-groups');
    expect(editor, 'the chips editor must still be open (editingId is unchanged)').not.toBeNull();
    // …but it REMOUNTED on the new projection: the draft is gone.
    expect(testid<HTMLInputElement>('rail-chip-input-0')!.value).toBe('Weddings');

    // And the ids it now carries are the NEW bag's: saving unchanged joins g0/g1
    // correctly — photos intact, nothing deleted, nothing duplicated.
    await click(testid('rail-chips-save'));
    const last = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    const groups = JSON.parse((last[1] as RequestInit).body as string).brief.facts.work.groups;
    expect(groups.map((g: { name: string }) => g.name)).toEqual(['Weddings', 'Portraits']);
    expect(groups[0].photos).toEqual([{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }]);
    // The note the commit-under-the-editor wrote is still there (the chips save
    // re-emitted the FULL bag it was projected from).
    expect(JSON.parse((last[1] as RequestInit).body as string).brief.facts.work.userNotes).toEqual([
      'The prices are wrong',
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// D8 — the INGESTION-shaped commit regression (work-onboarding-ingestion P4).
//
// P3 proved a NOTE commit under the open chips editor remounts it. E2 adds the
// commit that actually carries photos: an ingestion commit (photo-bearing groups
// added/merged through the D10 funnel) lands while a stale chip draft is open.
// The projection key (`${field.id}-${pKey}`) MUST swap, so the draft — whose ids
// are valid only against the PRE-ingestion bag — dies and re-seeds from the new
// bag; and the ingested photos must sit on the RIGHT groups, none wiped or
// misattached. This is the exact hazard D8 guards, exercised with real photos.
// ─────────────────────────────────────────────────────────────────────────────

describe('UnderstoodRail — D8 ingestion-shaped commit regression', () => {
  it('an ingestion commit under the open chips editor remounts it; photos land right, no wipe', async () => {
    const fetchMock = mockSaveDraft(true);
    await mountRail();

    // A draft the user typed but did NOT save — its ids belong to the CURRENT bag.
    await click(testid('rail-edit-groups'));
    expect(testid('rail-chips-editor-groups')).not.toBeNull();
    await type(testid<HTMLInputElement>('rail-chip-input-0')!, 'DRAFT — never saved');
    expect(testid<HTMLInputElement>('rail-chip-input-0')!.value).toBe('DRAFT — never saved');

    // An ingestion-shaped commit through the D10 funnel (NOT the chips editor):
    // one photo attaches to the existing Weddings, one starts a new Newborns group.
    await act(async () => {
      const live = useWizardStore.getState().briefFacts;
      const proposal = proposeGroups([
        { name: 'w2.jpg', url: 'https://cdn.example.com/w2.jpg', relativePath: 'Root/Weddings/w2.jpg' },
        { name: 'n1.jpg', url: 'https://cdn.example.com/n1.jpg', relativePath: 'Root/Newborns/n1.jpg' },
      ]);
      const existing = (getWorkFacts(live ?? undefined)?.groups ?? []) as WorkGroupInput[];
      const merged = mergeProposalIntoGroups(proposal, existing);
      const commit = applyRailEdit({ field: 'groups', value: merged }, live);
      if (!commit.ok) throw new Error(`fixture commit invalid: ${commit.error}`);
      await useWizardStore.getState().commitRail(commit);
    });
    await flush();

    // The chips editor is STILL open (editingId is unchanged) but REMOUNTED on the
    // new projection key: the stale draft is gone, ids re-seeded from the new bag.
    expect(
      testid('rail-chips-editor-groups'),
      'chips editor still open (editingId unchanged)'
    ).not.toBeNull();
    expect(testid<HTMLInputElement>('rail-chip-input-0')!.value).toBe('Weddings');

    // The committed facts carry the ingested photos on the RIGHT groups.
    const work = (useWizardStore.getState().briefFacts as any).work;
    expect(work.groups.map((g: any) => g.name)).toEqual(['Weddings', 'Portraits', 'Newborns']);
    expect(work.groups[0].photos.map((p: any) => p.url)).toEqual([
      'https://cdn.example.com/w1.jpg', // pre-existing
      'https://cdn.example.com/w2.jpg', // ingested — attached, not replacing
    ]);
    expect(work.groups[1].photos ?? []).toEqual([]); // Portraits untouched
    expect(work.groups[2].photos[0].url).toBe('https://cdn.example.com/n1.jpg');

    // Saving the chips UNCHANGED now joins against the NEW bag by id — no wipe,
    // no misattachment (the stale-id hole is unreachable).
    await click(testid('rail-chips-save'));
    const last = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    const groups = JSON.parse((last[1] as RequestInit).body as string).brief.facts.work.groups;
    expect(groups.map((g: { name: string }) => g.name)).toEqual([
      'Weddings',
      'Portraits',
      'Newborns',
    ]);
    expect(groups[0].photos.map((p: { url: string }) => p.url)).toEqual([
      'https://cdn.example.com/w1.jpg',
      'https://cdn.example.com/w2.jpg',
    ]);
    expect(groups[2].photos[0].url).toBe('https://cdn.example.com/n1.jpg');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Notes
// ─────────────────────────────────────────────────────────────────────────────

describe('UnderstoodRail — "Something wrong?"', () => {
  it('appends a note through the seam and clears the box', async () => {
    const fetchMock = mockSaveDraft(true);
    await mountRail();

    await type(testid<HTMLInputElement>('rail-note-input')!, 'The prices are wrong');
    await click(testid('rail-note-submit'));

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.brief.facts.work.userNotes).toEqual(['The prices are wrong']);
    expect(testid<HTMLInputElement>('rail-note-input')!.value).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WHAT YOUR SITE LEADS WITH — the engine field (engineDecider Phase 2)
//
// Three visual states keyed on engineStatus + the revisable-belief "change" link.
// Prop-driven (no store), so the field can render at D1 entry before any wizard
// store exists. Omitting the `engine` prop must leave the legacy rail unchanged.
// ─────────────────────────────────────────────────────────────────────────────

async function mountRailWithEngine(engine?: EngineRailFieldData) {
  await act(async () => {
    root.render(
      <ToastProvider>
        <UnderstoodRail rail={workJourneySeam.rail} engine={engine} />
      </ToastProvider>
    );
  });
  await flush();
}

describe('UnderstoodRail — engine field (WHAT YOUR SITE LEADS WITH)', () => {
  it('is absent when no engine prop is passed (legacy rail unchanged)', async () => {
    await mountRailWithEngine(undefined);
    expect(testid('rail-engine-field')).toBeNull();
  });

  it('resolving → spinner + no card content, no change link yet', async () => {
    await mountRailWithEngine({ status: 'resolving' });
    expect(testid('rail-engine-field')?.getAttribute('data-engine-status')).toBe('resolving');
    expect(testid('rail-engine-spinner')).not.toBeNull();
    // No confirmed check, no ambiguous copy, and the change link is suppressed
    // while resolving.
    expect(testid('rail-engine-confirmed')).toBeNull();
    expect(testid('rail-engine-ambiguous')).toBeNull();
    expect(testid('rail-engine-change')).toBeNull();
  });

  it('confirmed → set card with the plain label and a green check', async () => {
    await mountRailWithEngine({
      status: 'confirmed',
      label: 'Lead with your work',
      descriptor: 'your portfolio does the talking',
      onChangeEngine: () => {},
    });
    expect(testid('rail-engine-field')?.getAttribute('data-engine-status')).toBe('confirmed');
    expect(testid('rail-engine-spinner')).toBeNull();
    expect(testid('rail-engine-name')?.textContent).toBe('Lead with your work');
    expect(testid('rail-engine-confirmed')).not.toBeNull();
    expect(testid('rail-engine-ambiguous')).toBeNull();
  });

  it('known → set card, no green check (only confirmed gets the check)', async () => {
    await mountRailWithEngine({ status: 'known', label: 'Lead with your work' });
    expect(testid('rail-engine-name')?.textContent).toBe('Lead with your work');
    expect(testid('rail-engine-confirmed')).toBeNull();
  });

  it('ambiguous → amber "could go two ways", no engine label claimed', async () => {
    await mountRailWithEngine({ status: 'ambiguous', onChangeEngine: () => {} });
    expect(testid('rail-engine-field')?.getAttribute('data-engine-status')).toBe('ambiguous');
    expect(testid('rail-engine-ambiguous')).not.toBeNull();
    expect(testid('rail-engine-name')?.textContent).toBe('Could go two ways');
    expect(testid('rail-engine-confirmed')).toBeNull();
  });

  // engineDecider Phase 5 — the demand chip. When `demandTag` is set (the D5
  // board for place/quick-yes + any serve-gate manual outcome) an amber
  // "DEMAND LOGGED · #<TAG>" chip renders below the card; absent otherwise.
  it('renders the amber "DEMAND LOGGED" chip when a demandTag is set', async () => {
    await mountRailWithEngine({
      status: 'known',
      label: 'Lead with your place',
      demandTag: 'PLACE',
    });
    const chip = testid('rail-engine-demand');
    expect(chip).not.toBeNull();
    expect(chip?.textContent).toContain('DEMAND LOGGED');
    expect(chip?.textContent).toContain('PLACE');
  });

  it('omits the demand chip when no demandTag is set', async () => {
    await mountRailWithEngine({ status: 'known', label: 'Lead with your work' });
    expect(testid('rail-engine-demand')).toBeNull();
  });

  // engineDecider Phase 7 — the D5 demand board card is NEUTRAL (grey), not the
  // confident blue "we're building this" card. The engine is logged, not built.
  it('neutral → grey card tone (demand board is logged, not committed)', async () => {
    await mountRailWithEngine({
      status: 'known',
      label: 'Lead with your place',
      demandTag: 'PLACE',
      neutral: true,
    });
    expect(testid('rail-engine-card')?.getAttribute('data-tone')).toBe('neutral');
  });

  it('a normal known card is NOT neutral (confident tone)', async () => {
    await mountRailWithEngine({ status: 'known', label: 'Lead with your work' });
    expect(testid('rail-engine-card')?.getAttribute('data-tone')).toBe('default');
  });

  it('the "Change how buyers decide" link renders and fires the callback', async () => {
    let fired = 0;
    await mountRailWithEngine({
      status: 'confirmed',
      label: 'Lead with your work',
      onChangeEngine: () => {
        fired += 1;
      },
    });
    const link = testid('rail-engine-change');
    expect(link).not.toBeNull();
    await click(link);
    expect(fired).toBe(1);
  });
});
