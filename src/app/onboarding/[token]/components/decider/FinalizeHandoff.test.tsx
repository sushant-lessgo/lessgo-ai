// ============================================================================
// FinalizeHandoff — the SILENT confirm-handoff owner (engineDecider Phase 3
// follow-up). It inherits the confirm ownership the retired JourneyEntryStep and
// then the CUT D6 ceremony screen used to hold:
//   loadJourneySeam → enrichDraftForConfirm → POST /api/brief/confirm →
//   serve (hard-nav) / manual (onManual).
//
// The ONLY behavioural change vs the retired D6 is the TRIGGER: the sequence now
// fires AUTOMATICALLY on mount (no Continue button). These tests assert the
// confirm sequence is byte-equivalent — just auto-fired — and preserve the O1
// kill: NO one-liner textarea, NO re-classify, no /api/v2/understand.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo).
// ============================================================================

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import FinalizeHandoff from './FinalizeHandoff';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import type { Brief } from '@/types/brief';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let assign: ReturnType<typeof vi.fn>;

/** A classified (NOT yet confirmed) work draft, as the decider hands it to
 *  FinalizeHandoff. */
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

/** Mount FinalizeHandoff — the confirm handoff auto-fires on mount (no click). */
async function mountFinalize(props: Partial<React.ComponentProps<typeof FinalizeHandoff>> = {}) {
  const onManual = vi.fn();
  await act(async () => {
    root.render(
      <FinalizeHandoff
        tokenId="tok_test"
        briefDraft={WORK_DRAFT}
        resolvedEngine="work"
        onManual={onManual}
        {...props}
      />
    );
  });
  await flush();
  return { onManual };
}

/** Mount wrapped in <React.StrictMode> — dev StrictMode double-invokes effects
 *  (setup→cleanup→setup on the SAME fiber). The firedRef guard must make the
 *  confirm POST idempotent; a bare `cancelled` cleanup flag would fire twice. */
async function mountFinalizeStrict(
  props: Partial<React.ComponentProps<typeof FinalizeHandoff>> = {}
) {
  const onManual = vi.fn();
  await act(async () => {
    root.render(
      <React.StrictMode>
        <FinalizeHandoff
          tokenId="tok_test"
          briefDraft={WORK_DRAFT}
          resolvedEngine="work"
          onManual={onManual}
          {...props}
        />
      </React.StrictMode>
    );
  });
  await flush();
  return { onManual };
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

describe('FinalizeHandoff — serve branch', () => {
  it('navigates HARD to redirectTo on a serve verdict (auto-fired on mount)', async () => {
    mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    const { onManual } = await mountFinalize();
    await waitFor(() => assign.mock.calls.length > 0, 'hard nav on serve');
    // Hard navigation — load-detection mounts the journey at showWork.
    expect(assign).toHaveBeenCalledWith('/onboarding/tok_test');
    expect(onManual).not.toHaveBeenCalled();
  });
});

describe('FinalizeHandoff — manual branch', () => {
  it('calls onManual(missing) and does NOT navigate', async () => {
    mockConfirm({ outcome: 'manual', missing: 'rungA:unclassified' });
    const { onManual } = await mountFinalize();
    await waitFor(() => onManual.mock.calls.length > 0, 'manual verdict');
    expect(onManual).toHaveBeenCalledWith('rungA:unclassified');
    expect(assign).not.toHaveBeenCalled();
  });

  it('falls back to rungA:unclassified when the server sends no missing tag', async () => {
    mockConfirm({ outcome: 'manual' });
    const { onManual } = await mountFinalize();
    await waitFor(() => onManual.mock.calls.length > 0, 'manual fallback');
    expect(onManual).toHaveBeenCalledWith('rungA:unclassified');
  });
});

describe('FinalizeHandoff — seam enrichment (the ONE thing it adds)', () => {
  it('POSTs a brief carrying facts.work with a `kind` on every group', async () => {
    const fetchMock = mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    await mountFinalize();
    await waitFor(() => fetchMock.mock.calls.length > 0, 'confirm POST');

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

describe('FinalizeHandoff — StrictMode double-mount guard', () => {
  it('POSTs /api/brief/confirm EXACTLY once under StrictMode (no duplicate confirm → no duplicate testimonial rows / double nav)', async () => {
    const fetchMock = mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    await mountFinalizeStrict();
    await waitFor(() => fetchMock.mock.calls.length > 0, 'confirm POST');
    // Give StrictMode's setup→cleanup→setup a chance to fire a second POST if the
    // guard were missing — the firedRef must swallow it.
    await flush();
    const confirmCalls = fetchMock.mock.calls.filter((c) => c[0] === '/api/brief/confirm');
    expect(confirmCalls.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Exactly one hard nav, too (double-fire would double-navigate).
    expect(assign).toHaveBeenCalledTimes(1);
  });
});

describe('FinalizeHandoff — error handling', () => {
  it('surfaces a non-ok confirm and neither navigates nor goes manual', async () => {
    mockConfirm({ error: 'Nope' }, false);
    const { onManual } = await mountFinalize();
    await waitFor(() => container.textContent?.includes('Nope') ?? false, 'error surfaced');
    expect(assign).not.toHaveBeenCalled();
    expect(onManual).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Nope');
  });

  it('retries the confirm handoff from the error state (Retry resets the guard and re-fires)', async () => {
    // First attempt fails, second succeeds — proves the effect actually re-runs.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Nope' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ outcome: 'serve', redirectTo: '/onboarding/tok_test' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await mountFinalize();
    await waitFor(
      () => container.querySelector('[data-testid="decider-finalize-retry"]') != null,
      'retry button shown'
    );
    expect(assign).not.toHaveBeenCalled();

    const retryBtn = container.querySelector(
      '[data-testid="decider-finalize-retry"]'
    ) as HTMLButtonElement;
    await act(async () => {
      retryBtn.click();
    });
    await waitFor(() => assign.mock.calls.length > 0, 'hard nav after retry');
    expect(assign).toHaveBeenCalledWith('/onboarding/tok_test');
    // One failed + one successful confirm — the retry re-fired exactly once.
    const confirmCalls = fetchMock.mock.calls.filter((c) => c[0] === '/api/brief/confirm');
    expect(confirmCalls.length).toBe(2);
  });

  it('surfaces a thrown fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await mountFinalize();
    await waitFor(
      () => container.textContent?.includes('Something went wrong') ?? false,
      'thrown fetch surfaced'
    );
    expect(container.textContent).toContain('Something went wrong');
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('FinalizeHandoff — the O1 kill', () => {
  it('shows NO editable one-liner (no textarea, no re-classify)', async () => {
    const fetchMock = mockConfirm({ outcome: 'serve', redirectTo: '/x' });
    await mountFinalize();
    await waitFor(() => fetchMock.mock.calls.length > 0, 'confirm POST');
    // The retired JourneyEntryStep re-presented the one-liner in a Textarea;
    // FinalizeHandoff must not — the one-liner is typed once, at D1.
    expect(container.querySelector('textarea')).toBeNull();
    expect(container.querySelector('[data-testid="journey-entry-oneliner"]')).toBeNull();
    // And it never hits /api/v2/understand (no extra UNDERSTAND credit).
    for (const call of fetchMock.mock.calls) {
      expect(call[0]).not.toBe('/api/v2/understand');
    }
  });
});
