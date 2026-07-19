// ============================================================================
// ConfirmToWizard — the SILENT thing/trust confirm→wizard transition
// (engineDecider Phase 4). The thing/trust counterpart to FinalizeHandoff: it
// PLAIN-POSTs /api/brief/confirm on mount (no seam enrichment — thing/trust have
// no journey seam) →
//   serve  → HARD-nav to redirectTo + `?enter=understanding`
//   manual → onManual(missing)
//
// Extracted from page.tsx precisely so the StrictMode mount-once guard is
// unit-testable: being inline + non-exported, nothing could regression-protect
// the `firedRef` guard, and a refactor could silently reintroduce a double
// /api/brief/confirm POST → duplicate testimonial imports (the exact failure the
// Phase 3 follow-up fixed). The StrictMode test below fails if `firedRef` is
// removed.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo) —
// mirrors FinalizeHandoff.test.tsx.
// ============================================================================

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import ConfirmToWizard from './ConfirmToWizard';
import type { Brief } from '@/types/brief';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let assign: ReturnType<typeof vi.fn>;

/** A classified (NOT yet confirmed) thing draft, as the decider hands it to
 *  ConfirmToWizard. thing/trust carry no journey seam — the POST is plain. */
const THING_DRAFT: Brief = {
  businessType: 'saas',
  copyEngine: 'thing',
  facts: {
    entry: {
      rawInput: 'project management app for small teams',
      resolvedEngine: 'thing',
      classificationSource: 'lookup',
      tiebreaker: 'none',
      platformNeeds: 'none',
      summary: 'Project management SaaS',
      businessName: 'Taskly',
      offerings: ['Task boards', 'Team chat'],
      audiences: [],
      categories: ['saas'],
      outcomes: [],
      deliveryModel: 'remote',
      offer: 'Start free',
      oneLiner: 'Project management app for small teams',
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

/** Mount ConfirmToWizard — the confirm auto-fires on mount (no click). */
async function mountConfirm(
  props: Partial<React.ComponentProps<typeof ConfirmToWizard>> = {}
) {
  const onManual = vi.fn();
  await act(async () => {
    root.render(
      <ConfirmToWizard tokenId="tok_test" briefDraft={THING_DRAFT} onManual={onManual} {...props} />
    );
  });
  await flush();
  return { onManual };
}

/** Mount wrapped in <React.StrictMode> — dev StrictMode double-invokes effects
 *  (setup→cleanup→setup on the SAME fiber). The firedRef guard must make the
 *  confirm POST idempotent; a bare `cancelled` cleanup flag would fire twice. */
async function mountConfirmStrict(
  props: Partial<React.ComponentProps<typeof ConfirmToWizard>> = {}
) {
  const onManual = vi.fn();
  await act(async () => {
    root.render(
      <React.StrictMode>
        <ConfirmToWizard
          tokenId="tok_test"
          briefDraft={THING_DRAFT}
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
    value: { ...window.location, search: '', assign },
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ConfirmToWizard — serve branch', () => {
  it('navigates HARD to redirectTo WITH ?enter=understanding on a serve verdict (auto-fired on mount)', async () => {
    mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    const { onManual } = await mountConfirm();
    await waitFor(() => assign.mock.calls.length > 0, 'hard nav on serve');
    // The `?enter=understanding` param is what makes the reloaded wizard skip the
    // identity re-ask (load-detection reads it).
    expect(assign).toHaveBeenCalledWith('/onboarding/tok_test?enter=understanding');
    expect(onManual).not.toHaveBeenCalled();
  });

  it('appends enter=understanding with & when redirectTo already has a query', async () => {
    mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test?foo=1' });
    await mountConfirm();
    await waitFor(() => assign.mock.calls.length > 0, 'hard nav on serve');
    expect(assign).toHaveBeenCalledWith('/onboarding/tok_test?foo=1&enter=understanding');
  });

  it('POSTs a PLAIN brief (no seam enrichment) exactly to /api/brief/confirm', async () => {
    const fetchMock = mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    await mountConfirm();
    await waitFor(() => fetchMock.mock.calls.length > 0, 'confirm POST');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/brief/confirm');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.tokenId).toBe('tok_test');
    // Plain pass-through: the draft is POSTed as-is (thing/trust have no seam).
    expect(body.brief.copyEngine).toBe('thing');
    expect(body.brief.facts.entry.businessName).toBe('Taskly');
  });
});

describe('ConfirmToWizard — manual branch', () => {
  it('calls onManual(missing) and does NOT navigate', async () => {
    mockConfirm({ outcome: 'manual', missing: 'rungA:unclassified' });
    const { onManual } = await mountConfirm();
    await waitFor(() => onManual.mock.calls.length > 0, 'manual verdict');
    expect(onManual).toHaveBeenCalledWith('rungA:unclassified');
    expect(assign).not.toHaveBeenCalled();
  });

  it('falls back to rungA:unclassified when the server sends no missing tag', async () => {
    mockConfirm({ outcome: 'manual' });
    const { onManual } = await mountConfirm();
    await waitFor(() => onManual.mock.calls.length > 0, 'manual fallback');
    expect(onManual).toHaveBeenCalledWith('rungA:unclassified');
  });
});

describe('ConfirmToWizard — StrictMode double-mount guard', () => {
  it('POSTs /api/brief/confirm EXACTLY once under StrictMode (no duplicate confirm → no duplicate testimonial imports / double nav)', async () => {
    const fetchMock = mockConfirm({ outcome: 'serve', redirectTo: '/onboarding/tok_test' });
    await mountConfirmStrict();
    await waitFor(() => fetchMock.mock.calls.length > 0, 'confirm POST');
    // Give StrictMode's setup→cleanup→setup a chance to fire a second POST if the
    // firedRef guard were missing — it must swallow it.
    await flush();
    const confirmCalls = fetchMock.mock.calls.filter((c) => c[0] === '/api/brief/confirm');
    expect(confirmCalls.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Exactly one hard nav, too (double-fire would double-navigate).
    expect(assign).toHaveBeenCalledTimes(1);
  });
});

describe('ConfirmToWizard — error handling', () => {
  it('surfaces a non-ok confirm and neither navigates nor goes manual', async () => {
    mockConfirm({ error: 'Nope' }, false);
    const { onManual } = await mountConfirm();
    await waitFor(() => container.textContent?.includes('Nope') ?? false, 'error surfaced');
    expect(assign).not.toHaveBeenCalled();
    expect(onManual).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Nope');
  });

  it('retries the confirm from the error state (Retry resets the guard and re-fires)', async () => {
    // First attempt fails, second succeeds — proves the effect actually re-runs.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Nope' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ outcome: 'serve', redirectTo: '/onboarding/tok_test' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await mountConfirm();
    await waitFor(
      () => container.querySelector('[data-testid="decider-confirm-wizard-retry"]') != null,
      'retry button shown'
    );
    expect(assign).not.toHaveBeenCalled();

    const retryBtn = container.querySelector(
      '[data-testid="decider-confirm-wizard-retry"]'
    ) as HTMLButtonElement;
    await act(async () => {
      retryBtn.click();
    });
    await waitFor(() => assign.mock.calls.length > 0, 'hard nav after retry');
    expect(assign).toHaveBeenCalledWith('/onboarding/tok_test?enter=understanding');
    // One failed + one successful confirm — the retry re-fired exactly once.
    const confirmCalls = fetchMock.mock.calls.filter((c) => c[0] === '/api/brief/confirm');
    expect(confirmCalls.length).toBe(2);
  });

  it('surfaces a thrown fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await mountConfirm();
    await waitFor(
      () => container.textContent?.includes('Something went wrong') ?? false,
      'thrown fetch surfaced'
    );
    expect(container.textContent).toContain('Something went wrong');
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('ConfirmToWizard — the O1 kill', () => {
  it('shows NO editable one-liner (no textarea, no re-classify)', async () => {
    const fetchMock = mockConfirm({ outcome: 'serve', redirectTo: '/x' });
    await mountConfirm();
    await waitFor(() => fetchMock.mock.calls.length > 0, 'confirm POST');
    // The one-liner is typed once, at D1 — this transition must not re-present it.
    expect(container.querySelector('textarea')).toBeNull();
    // And it never hits /api/v2/understand (no extra UNDERSTAND credit).
    for (const call of fetchMock.mock.calls) {
      expect(call[0]).not.toBe('/api/v2/understand');
    }
  });
});
