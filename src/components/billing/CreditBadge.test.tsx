// billing-beta phase 8 (C10) — CreditBadge renders CONFIG, not literals.
//
// The badge's cost table was hardcoded (10/2/1) before phase 3; the pin is that
// it now READS `CREDIT_COSTS`. A test comparing the DOM to the imported config
// would still pass against a same-value re-inline (`10`), so this FABRICATES the
// config via vi.doMock and asserts the DOM follows — it fails the moment the
// component stops reading the module. Same probe as OutOfCreditsModal.test.tsx.
//
// Harness: react-dom/client + React.act (no @testing-library in repo). CreditBadge
// needs Clerk auth (mocked signed-in) and a balance fetch (stubbed) to render, and
// its cost table lives inside the hover popover — so we open it with a click (the
// Radix onOpenChange path) before asserting.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Signed-in so the badge renders (it returns null when signed out).
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true }),
}));

// next/link needs a router context in jsdom; the anchor is all this cares about.
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => React.createElement('a', { href, ...rest }, children),
}));

// A pool-only (FREE/LTD) balance keeps the panel simple: no monthly bar, just the
// cost table we probe. Shape matches /api/credits/balance.
const BALANCE = {
  used: 0,
  remaining: 0,
  limit: 0,
  percentUsed: 0,
  daysUntilReset: 30,
  nextResetDate: new Date('2030-01-01').toISOString(),
  tier: 'FREE',
  poolRemaining: 5,
  totalAvailable: 5,
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(BALANCE) } as Response),
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.doUnmock('@/lib/creditCosts');
});

// Radix renders the panel in a portal on document.body, so query there.
const inBody = (sel: string) => document.body.querySelector(sel);

async function flush() {
  // Let the balance fetch + setState settle.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('CreditBadge — reads CREDIT_COSTS (mutation probe)', () => {
  it('renders fabricated CREDIT_COSTS values in its cost table', async () => {
    vi.resetModules();
    vi.doMock('@/lib/creditCosts', () => ({
      CREDIT_COSTS: {
        FULL_PAGE_GENERATION: 61,
        SECTION_REGENERATION: 62,
        ELEMENT_REGENERATION: 63,
      },
    }));

    const { CreditBadge } = await import('./CreditBadge');
    await act(async () => {
      root.render(<CreditBadge />);
    });
    await flush();

    // Open the hover popover via the click/onOpenChange path (keyboard-equivalent).
    const badge = inBody('[data-testid="credit-badge"]') as HTMLButtonElement | null;
    expect(badge, 'badge did not render').not.toBeNull();
    await act(async () => {
      badge!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(inBody('[data-cost-op="FULL_PAGE_GENERATION"]')?.textContent).toContain('61 credits');
    expect(inBody('[data-cost-op="SECTION_REGENERATION"]')?.textContent).toContain('62 credits');
    expect(inBody('[data-cost-op="ELEMENT_REGENERATION"]')?.textContent).toContain('63 credits');
  });
});
