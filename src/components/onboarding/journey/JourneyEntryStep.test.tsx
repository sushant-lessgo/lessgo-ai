// ============================================================================
// JourneyEntryStep — STEP 01 branch tests (work-onboarding-shell P2b).
//
// STEP 01 is the ONE journey surface e2e cannot cover: mock mode cannot
// classify work (`/api/v2/understand` returns the agency-shaped
// ENTRY_DEMO_SIGNALS fixture, and understand/scrape-website are out of scope —
// landmine 13). So this file + the P7 founder QA are STEP 01's real gate. The
// e2e seeds a confirmed brief and resumes instead; it never fakes this path.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo —
// same idiom as src/components/ui/toast.test.tsx).
// ============================================================================

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import JourneyEntryStep from './JourneyEntryStep';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import type { Brief } from '@/types/brief';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let assign: ReturnType<typeof vi.fn>;

/** A classified (NOT yet confirmed) work draft, as the entry flow holds it. */
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
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => json,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Let queued microtasks/timers drain inside act (the seam load is a real
 *  dynamic import, so one microtask is not enough). */
async function flush(times = 5) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

/**
 * Poll until `predicate` holds. The seam load is a REAL dynamic import, and the
 * FIRST one in a run compiles the module — far slower than the module-cache hits
 * every later test gets. A fixed tick count passes locally and flakes elsewhere.
 */
async function waitFor(predicate: () => boolean, label: string, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await flush(1);
  }
  throw new Error(`waitFor timed out: ${label}`);
}

/** Mount + let the seam's dynamic import + effects settle. */
async function mountEntry(props: Partial<React.ComponentProps<typeof JourneyEntryStep>> = {}) {
  const onManual = vi.fn();
  await act(async () => {
    root.render(
      <JourneyEntryStep
        tokenId="tok_test"
        briefDraft={WORK_DRAFT}
        onManual={onManual}
        {...props}
      />
    );
  });
  // The CTA stays disabled until the seam resolves — enrichment is not optional,
  // so a test that clicked early would silently assert nothing.
  await waitFor(() => cta() != null && !cta().disabled, 'seam resolved → CTA enabled');
  return { onManual };
}

const cta = () =>
  container.querySelector<HTMLButtonElement>('[data-testid="journey-entry-cta"]')!;

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
  // jsdom's real location.assign is "not implemented" and throws.
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

describe('JourneyEntryStep — serve branch', () => {
  it('navigates HARD to redirectTo on a serve verdict', async () => {
    mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    const { onManual } = await mountEntry();
    await clickCta();

    // Hard navigation, not router.push: the shell re-hydrates from the DB, and
    // load-detection is what mounts the journey at its resume step.
    expect(assign).toHaveBeenCalledWith('/onboarding/tok_test');
    expect(onManual).not.toHaveBeenCalled();
  });
});

describe('JourneyEntryStep — manual branch', () => {
  it('calls onManual(missing) and does NOT navigate', async () => {
    mockConfirm({ outcome: 'manual', missing: 'rungA:unclassified' });
    const { onManual } = await mountEntry();
    await clickCta();

    expect(onManual).toHaveBeenCalledWith('rungA:unclassified');
    expect(assign).not.toHaveBeenCalled();
  });

  it('falls back to rungA:unclassified when the server sends no missing tag', async () => {
    mockConfirm({ outcome: 'manual' });
    const { onManual } = await mountEntry();
    await clickCta();
    expect(onManual).toHaveBeenCalledWith('rungA:unclassified');
  });
});

describe('JourneyEntryStep — seam enrichment (the ONE thing it adds)', () => {
  it('POSTs a brief carrying facts.work with a `kind` on every group', async () => {
    const fetchMock = mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    await mountEntry();
    await clickCta();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/brief/confirm');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.tokenId).toBe('tok_test');

    // Nothing else in the system writes facts.work — without this enrichment
    // the rail would project over nothing.
    const work = getWorkFacts(body.brief.facts);
    expect(work).not.toBeNull();
    expect(work?.identity?.name).toBe('Kundius Studio');
    expect(work?.groups?.length).toBe(2);
    // A `kind`-less group nulls getWorkFacts and dead-ends strategy with an
    // unrecoverable 400 (landmine 6).
    for (const g of work?.groups ?? []) expect(g.kind).toBe('category');

    // FULL-facts re-emit: the sibling entry bag must survive (landmine 4).
    expect(body.brief.facts.entry.businessName).toBe('Kundius Studio');
  });
});

describe('JourneyEntryStep — error handling', () => {
  it('surfaces a non-ok confirm and neither navigates nor goes manual', async () => {
    mockConfirm({ error: 'Nope' }, false);
    const { onManual } = await mountEntry();
    await clickCta();

    expect(assign).not.toHaveBeenCalled();
    expect(onManual).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Nope');
    // Recoverable: the CTA re-enables so the user can retry in place.
    expect(cta().disabled).toBe(false);
  });

  it('surfaces a thrown fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await mountEntry();
    await clickCta();
    expect(container.textContent).toContain('Something went wrong');
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('JourneyEntryStep — rendering', () => {
  it('shows the classified one-liner', async () => {
    mockConfirm({ outcome: 'serve', redirectTo: '/x' });
    await mountEntry();
    expect(
      container.querySelector('[data-testid="journey-entry-oneliner"]')?.textContent
    ).toBe('Documentary wedding photography in Amsterdam');
  });
});
