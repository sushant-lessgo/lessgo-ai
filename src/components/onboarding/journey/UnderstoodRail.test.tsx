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

import UnderstoodRail from './UnderstoodRail';
import { workJourneySeam } from './engines/work';
import { ToastProvider } from '@/components/ui/toast';
import { useWizardStore } from '@/hooks/useWizardStore';
import type { Brief } from '@/types/brief';

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

  it('the chips editor does not survive a commit (ids are per-projection)', async () => {
    mockSaveDraft(true);
    await mountRail();

    await click(testid('rail-edit-groups'));
    expect(testid('rail-chips-editor-groups')).not.toBeNull();

    // Commit a DIFFERENT field: briefFacts is replaced ⇒ new projection ⇒ the
    // chips editor (and any draft it held) is gone. A draft that outlived this
    // would carry ids issued against the OLD bag into the next join.
    await click(testid('rail-edit-name'));
    await type(testid<HTMLInputElement>('rail-input-name')!, 'Kundius');
    await click(testid('rail-save-name'));

    expect(testid('rail-chips-editor-groups')).toBeNull();
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
