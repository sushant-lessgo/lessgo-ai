// ============================================================================
// D6Handoff — the confirm-handoff owner (engineDecider Phase 3).
//
// D6 inherits the confirm ownership the RETIRED JourneyEntryStep used to hold:
// loadJourneySeam → enrichDraftForConfirm → POST /api/brief/confirm →
// serve (hard-nav) / manual (onManual). These tests port that gate — MINUS the
// edited-line re-classify path, which D6 deliberately does NOT have: the O1
// double-entry (an editable one-liner + a second UNDERSTAND credit) is gone. D6
// shows NO one-liner textarea at all, asserted below.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo —
// same idiom as the retired JourneyEntryStep.test.tsx).
// ============================================================================

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import D6Handoff from './D6Handoff';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import type { Brief } from '@/types/brief';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let assign: ReturnType<typeof vi.fn>;

/** A classified (NOT yet confirmed) work draft, as the decider holds it at D6. */
const WORK_DRAFT: Brief = {
  businessType: 'photographer',
  copyEngine: 'work',
  facts: {
    entry: {
      rawInput: 'documentary wedding photographer in Amsterdam',
      resolvedEngine: 'work',
      classificationSource: 'lookup',
      tiebreaker: 'none',
      platformNeeds: 'none',
      summary: 'Documentary wedding photography',
      businessName: 'Kundius Studio',
      offerings: ['Wedding day coverage', 'Engagement session'],
      audiences: [],
      categories: ['photography'],
      outcomes: [],
      deliveryModel: 'in-person',
      offer: 'Check availability',
      oneLiner: 'Documentary wedding photography in Amsterdam',
      testimonials: [],
    },
  },
  confidence: 0.9,
};

function mockConfirm(json: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => json });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function flush(times = 5) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

async function waitFor(predicate: () => boolean, label: string, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await flush(1);
  }
  throw new Error(`waitFor timed out: ${label}`);
}

const cta = () =>
  container.querySelector<HTMLButtonElement>('[data-testid="decider-d6-continue"]')!;

async function mountD6(props: Partial<React.ComponentProps<typeof D6Handoff>> = {}) {
  const onManual = vi.fn();
  await act(async () => {
    root.render(
      <D6Handoff
        tokenId="tok_test"
        briefDraft={WORK_DRAFT}
        resolvedEngine="work"
        onManual={onManual}
        {...props}
      />
    );
  });
  // The CTA stays disabled until the seam resolves — enrichment is not optional.
  await waitFor(() => cta() != null && !cta().disabled, 'seam resolved → CTA enabled');
  return { onManual };
}

async function clickCta() {
  await act(async () => {
    cta().dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { ...window.location, assign },
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('D6Handoff — serve branch', () => {
  it('navigates HARD to redirectTo on a serve verdict', async () => {
    mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    const { onManual } = await mountD6();
    await clickCta();
    // Hard navigation — load-detection mounts the journey at showWork.
    expect(assign).toHaveBeenCalledWith('/onboarding/tok_test');
    expect(onManual).not.toHaveBeenCalled();
  });
});

describe('D6Handoff — manual branch', () => {
  it('calls onManual(missing) and does NOT navigate', async () => {
    mockConfirm({ outcome: 'manual', missing: 'rungA:unclassified' });
    const { onManual } = await mountD6();
    await clickCta();
    expect(onManual).toHaveBeenCalledWith('rungA:unclassified');
    expect(assign).not.toHaveBeenCalled();
  });

  it('falls back to rungA:unclassified when the server sends no missing tag', async () => {
    mockConfirm({ outcome: 'manual' });
    const { onManual } = await mountD6();
    await clickCta();
    expect(onManual).toHaveBeenCalledWith('rungA:unclassified');
  });
});

describe('D6Handoff — seam enrichment (the ONE thing it adds)', () => {
  it('POSTs a brief carrying facts.work with a `kind` on every group', async () => {
    const fetchMock = mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    await mountD6();
    await clickCta();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/brief/confirm');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.tokenId).toBe('tok_test');

    // Nothing else in the system writes facts.work — without this enrichment the
    // rail would project over nothing.
    const work = getWorkFacts(body.brief.facts);
    expect(work).not.toBeNull();
    expect(work?.identity?.name).toBe('Kundius Studio');
    expect(work?.groups?.length).toBe(2);
    for (const g of work?.groups ?? []) expect(g.kind).toBe('category');

    // FULL-facts re-emit: the sibling entry bag must survive (landmine 4).
    expect(body.brief.facts.entry.businessName).toBe('Kundius Studio');
  });
});

describe('D6Handoff — error handling', () => {
  it('surfaces a non-ok confirm and neither navigates nor goes manual', async () => {
    mockConfirm({ error: 'Nope' }, false);
    const { onManual } = await mountD6();
    await clickCta();
    expect(assign).not.toHaveBeenCalled();
    expect(onManual).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Nope');
    // Recoverable: the CTA re-enables so the user can retry in place.
    expect(cta().disabled).toBe(false);
  });

  it('surfaces a thrown fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await mountD6();
    await clickCta();
    expect(container.textContent).toContain('Something went wrong');
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('D6Handoff — the O1 kill', () => {
  it('shows NO editable one-liner (no textarea, no re-classify)', async () => {
    const fetchMock = mockConfirm({ outcome: 'serve', redirectTo: '/x' });
    await mountD6();
    // The retired JourneyEntryStep re-presented the one-liner in a Textarea; D6
    // must not — the one-liner is typed once, at D1.
    expect(container.querySelector('textarea')).toBeNull();
    expect(
      container.querySelector('[data-testid="journey-entry-oneliner"]')
    ).toBeNull();
    // And it never hits /api/v2/understand (no extra UNDERSTAND credit).
    await clickCta();
    for (const call of fetchMock.mock.calls) {
      expect(call[0]).not.toBe('/api/v2/understand');
    }
  });
});
