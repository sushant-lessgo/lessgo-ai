// ============================================================================
// StepQuestions — the agnostic STEP 03 renderer (qa-0719 B2–B6).
//
// This suite pins the five clustered bugs in the work-engine question step, all
// of which live in this ONE renderer's divergent commit UX + state handling:
//
//   • B2 — PriceAnswer collects a CURRENCY (the schema modelled it; the UI never
//          captured it) and passes it into the commit.
//   • B3 — session-answered tracking keys on the gating SLOT (`slot ?? id`), so a
//          question whose id ≠ slot (work's identity, id:'name') stays visible as
//          an answered-compact row instead of VANISHING.
//   • B4 — single-select `choice` buffers on tap and commits via Save (one mental
//          model: "pick, then Save"), never an instant commit on chip tap.
//   • B5 — `choice` SEEDS its selection from the committed value (and, in confirm
//          posture, from `suggested`), so a multi commit carries pre-selected
//          chips instead of REPLACING the field with only the re-tapped ones; the
//          answered-compact summary reflects the committed value, not `suggested`.
//   • B6 — a field that arrives already pre-selected has Save ENABLED on mount
//          (the seeded selection is non-empty).
//
// Harness mirrors UnderstoodRail.test.tsx: react-dom/client + React.act (no
// @testing-library/react in repo), the REAL wizard store hydrated with a token,
// and a stubbed saveDraft for the commitRail write path.
// ============================================================================

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import StepQuestions from './StepQuestions';
import { workJourneySeam } from '../engines/work';
import { ToastProvider } from '@/components/ui/toast';
import { useWizardStore } from '@/hooks/useWizardStore';
import type { Brief } from '@/types/brief';
import type {
  JourneyEngineSeam,
  JourneyQuestion,
  RailCommit,
} from '../engines/types';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

/** A successful RailCommit stub — the shape `commitRail` applies. */
const OK_COMMIT: RailCommit = { ok: true, patch: {}, facts: {} };

function mockSaveDraft(ok = true) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => ({}) });
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

/** A radio/button inside a SegmentedControl, found by its visible label text. */
function segmentByText(groupTestid: string, text: string): HTMLButtonElement | null {
  const group = testid(groupTestid);
  if (!group) return null;
  return (
    [...group.querySelectorAll('button')].find((b) => b.textContent === text) ?? null
  );
}

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
  await flush();
}

/** A minimal seam whose `questions()` returns a FIXED list (stable spies). */
function stubSeam(questions: JourneyQuestion[]): JourneyEngineSeam {
  return {
    rail: { toVM: () => ({ fields: [] }) },
    steps: { questions: () => questions },
  } as unknown as JourneyEngineSeam;
}

async function mountStep(seam: JourneyEngineSeam) {
  await act(async () => {
    root.render(
      <ToastProvider>
        <StepQuestions seam={seam} onBlockedChange={() => {}} />
      </ToastProvider>
    );
  });
  await flush();
}

const WORK_BRIEF = (facts: Record<string, unknown>): Brief =>
  ({ businessType: 'photographer', copyEngine: 'work', facts, confidence: 0.9 }) as unknown as Brief;

beforeEach(async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  useWizardStore.getState().reset();
  await act(async () => {
    useWizardStore.getState().hydrate({
      tokenId: 'tok_test',
      brief: WORK_BRIEF({ work: { groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' } }] } }),
      audienceType: 'service',
      templateId: 'atelier',
    });
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// B2 — price currency reaches the commit
// ─────────────────────────────────────────────────────────────────────────────

describe('B2 — PriceAnswer captures currency', () => {
  it('a `from` price with an amount and a chosen currency commits {mode,amount,currency}', async () => {
    mockSaveDraft(true);
    const commit = vi.fn().mockReturnValue(OK_COMMIT);
    const question: JourneyQuestion = {
      id: 'price',
      slot: 'price',
      kind: 'price',
      label: 'Your typical starting price',
      required: true,
      commit,
    };
    await mountStep(stubSeam([question]));

    // Choose "From" (reveals the currency + amount inputs).
    await click(segmentByText('question-price-mode-price', 'From'));
    // Pick a NON-default currency (default is $ USD).
    await click(segmentByText('question-price-currency-price', '€ EUR'));
    await type(testid<HTMLInputElement>('question-price-amount-price')!, '2400');
    await click(testid('question-save-price'));

    expect(commit).toHaveBeenCalledTimes(1);
    // Pre-fix: PriceAnswer never collected currency ⇒ payload had no currency.
    expect(commit.mock.calls[0][0]).toEqual({ mode: 'from', amount: 2400, currency: '€' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B3 — an answered identity slot stays visible (compact), never vanishes
// ─────────────────────────────────────────────────────────────────────────────

describe('B3 — session-answered tracked by SLOT, not id', () => {
  it('answering the name (id:name, slot:identity) leaves it as an answered-compact row', async () => {
    mockSaveDraft(true);
    // The REAL work seam: hydrated with groups but NO name ⇒ the identity
    // question renders (id:'name', slot:'identity').
    await act(async () => {
      useWizardStore.getState().hydrate({
        tokenId: 'tok_test',
        brief: WORK_BRIEF({ work: { groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' } }] } }),
        audienceType: 'service',
        templateId: 'atelier',
      });
    });
    await mountStep(workJourneySeam);

    // The name question is present and OPEN (an input to answer).
    expect(testid('question-name')).not.toBeNull();
    await type(testid<HTMLInputElement>('question-input-name')!, 'Kundius Studio');
    await click(testid('question-save-name'));

    // Pre-fix: session('identity') stayed false (we tracked 'name'), so the
    // identity slot was DROPPED and the whole card vanished. Post-fix: it stays
    // as an answered-compact row with a Change affordance.
    expect(testid('question-name'), 'name card must remain after answering').not.toBeNull();
    expect(testid('question-change-name'), 'answered-compact Change affordance').not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B4 — single-select buffers on tap, commits on Save
// ─────────────────────────────────────────────────────────────────────────────

describe('B4 — single-select commits via Save, not on chip tap', () => {
  it('tapping a chip selects (no commit); Save fires the commit once', async () => {
    mockSaveDraft(true);
    const commit = vi.fn().mockReturnValue(OK_COMMIT);
    const question: JourneyQuestion = {
      id: 'establishment',
      slot: 'establishment',
      kind: 'choice',
      label: 'Are you established?',
      options: [
        { value: 'new', label: 'Just starting out' },
        { value: 'established', label: 'Established' },
      ],
      selected: [],
      commit,
    };
    await mountStep(stubSeam([question]));

    await click(testid('question-chip-establishment-new'));
    // Pre-fix: the tap committed immediately.
    expect(commit, 'chip tap must NOT commit').not.toHaveBeenCalled();

    const save = testid<HTMLButtonElement>('question-save-establishment')!;
    expect(save.disabled, 'Save enabled after a pick').toBe(false);
    await click(save);

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit.mock.calls[0][0]).toEqual(['new']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B5 — multi-select seeds from committed/suggested; extra picks don't drop them
// ─────────────────────────────────────────────────────────────────────────────

describe('B5 — multi-select carries pre-selected chips through the commit', () => {
  it('a chip added to a seeded set commits the FULL set', async () => {
    mockSaveDraft(true);
    const commit = vi.fn().mockReturnValue(OK_COMMIT);
    const question: JourneyQuestion = {
      id: 'dreamClient',
      slot: 'dreamClient',
      kind: 'choice',
      label: 'Who is your dream client?',
      multi: true,
      options: [
        { value: 'A', label: 'A' },
        { value: 'B', label: 'B' },
        { value: 'C', label: 'C' },
      ],
      suggested: ['A', 'B'],
      selected: ['A', 'B'],
      commit,
    };
    await mountStep(stubSeam([question]));

    await click(testid('question-chip-dreamClient-C'));
    await click(testid('question-save-dreamClient'));

    expect(commit).toHaveBeenCalledTimes(1);
    // Pre-fix: `selected` started [] ⇒ commit received only ['C'].
    expect(commit.mock.calls[0][0]).toEqual(['A', 'B', 'C']);
  });

  it('DESELECTING a pre-seeded chip persists the removal (commit drops it)', async () => {
    mockSaveDraft(true);
    const commit = vi.fn().mockReturnValue(OK_COMMIT);
    const question: JourneyQuestion = {
      id: 'dreamClient',
      slot: 'dreamClient',
      kind: 'choice',
      label: 'Who is your dream client?',
      multi: true,
      options: [
        { value: 'A', label: 'A' },
        { value: 'B', label: 'B' },
      ],
      selected: ['A', 'B'],
      commit,
    };
    await mountStep(stubSeam([question]));

    // Tap 'A' to DESELECT it from the seeded set, then Save.
    await click(testid('question-chip-dreamClient-A'));
    await click(testid('question-save-dreamClient'));

    expect(commit).toHaveBeenCalledTimes(1);
    // The removal must ride the replace-commit — not just additions (B5).
    expect(commit.mock.calls[0][0]).toEqual(['B']);
  });

  it('the answered-compact summary reflects the COMMITTED value, not `suggested`', async () => {
    mockSaveDraft(true);
    const question: JourneyQuestion = {
      id: 'dreamClient',
      slot: 'dreamClient',
      kind: 'choice',
      label: 'Who is your dream client?',
      multi: true,
      options: [
        { value: 'A', label: 'A' },
        { value: 'B', label: 'B' },
      ],
      suggested: ['X'],
      selected: ['A', 'B'],
      answered: true,
      commit: vi.fn().mockReturnValue(OK_COMMIT),
    };
    await mountStep(stubSeam([question]));

    const summary = testid('question-dreamClient')!.textContent ?? '';
    // Pre-fix: summary joined `suggested` (['X']).
    expect(summary).toContain('A, B');
    expect(summary).not.toContain('X');
  });

  it('the answered-compact summary renders friendly LABELS, not raw enum values', async () => {
    mockSaveDraft(true);
    const question: JourneyQuestion = {
      id: 'establishment',
      slot: 'establishment',
      kind: 'choice',
      label: 'Are you established?',
      options: [
        { value: 'new', label: 'Just starting out' },
        { value: 'established', label: 'Established' },
      ],
      selected: ['established'],
      answered: true,
      commit: vi.fn().mockReturnValue(OK_COMMIT),
    };
    await mountStep(stubSeam([question]));

    const summary = testid('question-establishment')!.textContent ?? '';
    // Post-fix: the value→label map renders "Established" (capitalised label).
    // Pre-fix the compact row read the raw enum value "established" (lowercase),
    // which never contains the capitalised label.
    expect(summary).toContain('Established');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B6 — Save enabled on arrival when a field is already pre-selected
// ─────────────────────────────────────────────────────────────────────────────

describe('B6 — pre-selected multi has Save enabled on mount', () => {
  it('Save is enabled before any interaction when a value is already committed', async () => {
    mockSaveDraft(true);
    const question: JourneyQuestion = {
      id: 'languages',
      slot: 'languages',
      kind: 'choice',
      label: 'What language(s)?',
      multi: true,
      allowCustom: true,
      options: [
        { value: 'English', label: 'English' },
        { value: 'Dutch', label: 'Dutch' },
      ],
      suggested: ['English'],
      selected: ['English', 'Dutch'],
      required: true,
      commit: vi.fn().mockReturnValue(OK_COMMIT),
    };
    await mountStep(stubSeam([question]));

    const save = testid<HTMLButtonElement>('question-save-languages')!;
    // Pre-fix: `selected` started [] ⇒ Save disabled until a chip was toggled.
    expect(save.disabled).toBe(false);
  });
});
