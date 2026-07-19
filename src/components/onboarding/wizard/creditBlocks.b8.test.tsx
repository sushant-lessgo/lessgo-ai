// src/components/onboarding/wizard/creditBlocks.b8.test.tsx
// B8 (qa-0719) — onboarding out-of-credits blocks: warm copy + REAL top-up CTA.
//
// Before the fix BOTH GeneratingSlot and StructureSlot credit blocks linked the
// primary CTA to `/dashboard/settings` (the account/persona page — NO top-up
// there) labelled "View plans", with flat technical copy ("You've used your
// generation credits. Top up to continue."). The fix points the primary CTA at
// the REAL top-up flow (`/dashboard/billing`), labels it "Top up now", and uses
// warm, conversion-framed copy — all via ONE shared constant.
//
// These assertions FAIL on pre-fix markup and PASS after.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo),
// mirroring ShowWorkStep.test.tsx.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Brief } from '@/types/brief';
import { useWizardStore } from '@/hooks/useWizardStore';
import { OUT_OF_CREDITS_COPY } from '@/modules/wizard/generation/errorMessage';

// next/navigation — GeneratingSlot uses useRouter (push + prefetch).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

// Force GeneratingSlot's run() straight into the credits-error branch.
vi.mock('@/modules/wizard/generation', () => ({
  runGeneration: vi.fn(async () => ({ status: 'credits' })),
}));

import GeneratingSlot from './GeneratingSlot';
import StructureSlot from './StructureSlot';

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function briefWithEntry(entry: Record<string, unknown>, extra: Partial<Brief> = {}): Brief {
  return { facts: { entry }, ...extra } as Brief;
}

const thingBrief = briefWithEntry(
  {
    rawInput: 'https://acme.app',
    businessName: 'Acme Invoicing',
    oneLiner: 'Invoicing software for freelancers that auto-chases late payments',
    offer: 'Free trial',
  },
  { businessType: 'saas', copyEngine: 'thing', confidence: 0.9 },
);

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  useWizardStore.getState().reset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

/** The primary top-up CTA in a credits block (an anchor to the billing page). */
function primaryCta(): HTMLAnchorElement | null {
  return container.querySelector<HTMLAnchorElement>('a[href]');
}

describe('B8 — GeneratingSlot credit block', () => {
  it('primary CTA points at /dashboard/billing with warm copy (not /dashboard/settings)', async () => {
    useWizardStore.getState().hydrate({
      tokenId: 'tok123',
      brief: thingBrief,
      audienceType: 'product',
      templateId: 'meridian',
    });

    await act(async () => {
      root.render(<GeneratingSlot />);
    });
    // Flush the mount effect's async run() → setCreditsError(true).
    await act(async () => {
      await Promise.resolve();
    });

    const cta = primaryCta();
    expect(cta).toBeTruthy();
    expect(cta!.getAttribute('href')).toBe('/dashboard/billing');
    expect(cta!.textContent).toContain(OUT_OF_CREDITS_COPY.ctaLabel);

    const html = container.innerHTML;
    expect(html).toContain(OUT_OF_CREDITS_COPY.body);
    // Old dead-end markup is gone.
    expect(html).not.toContain('/dashboard/settings');
    expect(html).not.toContain('View plans');
    expect(html).not.toContain('Top up to continue');
  });
});

describe('B8 — StructureSlot credit block', () => {
  it('primary CTA points at /dashboard/billing with warm copy (not /dashboard/settings)', async () => {
    useWizardStore.getState().hydrate({
      tokenId: 'tok123',
      brief: thingBrief,
      audienceType: 'product',
      templateId: 'meridian',
    });
    // Land the slot directly in the credits-error state (mount effect won't
    // refetch: strategyStatus is 'error', not 'idle').
    useWizardStore.setState({
      strategy: null,
      strategyStatus: 'error',
      strategyCreditsError: true,
      strategyError: 'Out of credits.',
    } as any);

    await act(async () => {
      root.render(<StructureSlot />);
    });

    const cta = primaryCta();
    expect(cta).toBeTruthy();
    expect(cta!.getAttribute('href')).toBe('/dashboard/billing');
    expect(cta!.textContent).toContain(OUT_OF_CREDITS_COPY.ctaLabel);

    const html = container.innerHTML;
    expect(html).toContain(OUT_OF_CREDITS_COPY.body);
    expect(html).not.toContain('/dashboard/settings');
    expect(html).not.toContain('View plans');
    expect(html).not.toContain('Top up to continue');
  });
});
