// billing-beta phase 4 — OutOfCreditsModal renders CONFIG, not literals.
//
// Every assertion compares against the IMPORTED config value, never a hardcoded
// number: the bug being pinned is a money-facing dialog drifting from
// PLAN_CONFIGS/CREDIT_COSTS (it shipped "$39/mo" + "14-day free trial" + "Free
// plan: 30 credits/month" — all false under pricing-v2). A test that hardcoded
// 29/200/10 would pass against a re-inlined literal, which is exactly the
// failure mode this slice keeps hitting.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo —
// same idiom as src/components/ui/toast.test.tsx).

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { OutOfCreditsModal } from './OutOfCreditsModal';
import { CREDIT_COSTS } from '@/lib/creditCosts';
import { PLAN_CONFIGS, PlanTier } from '@/lib/planConfigs';

// next/link needs a router context in jsdom; the anchor is all this test cares about.
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => React.createElement('a', { href, ...rest }, children),
}));

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PRO = PLAN_CONFIGS[PlanTier.PRO];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

type Props = React.ComponentProps<typeof OutOfCreditsModal>;

function mount(props: Partial<Props> = {}) {
  act(() =>
    root.render(
      <OutOfCreditsModal
        isOpen
        onClose={() => {}}
        creditsRequired={2}
        creditsAvailable={0}
        {...props}
      />,
    ),
  );
}

const q = (sel: string) => container.querySelector(sel);
const text = () => container.textContent ?? '';

describe('OutOfCreditsModal', () => {
  it('renders nothing when closed', () => {
    mount({ isOpen: false });
    expect(q('[data-testid="out-of-credits-modal"]')).toBeNull();
  });

  it('shows the required/available numbers it was given', () => {
    mount({ creditsRequired: 2, creditsAvailable: 0 });
    expect(q('[data-testid="credits-required"]')?.textContent).toBe('2');
    expect(q('[data-testid="credits-available"]')?.textContent).toBe('0');
  });

  it('degrades to number-free copy when the route sent no numbers', () => {
    mount({ creditsRequired: undefined, creditsAvailable: undefined });
    expect(q('[data-testid="credits-required"]')).toBeNull();
    expect(q('[data-testid="out-of-credits-detail"]')?.textContent).toMatch(
      /don’t have enough credits|don't have enough credits/i,
    );
  });

  it('renders the PRO name/price/credits/pages from PLAN_CONFIGS', () => {
    mount();
    expect(q('[data-testid="pro-price"]')?.textContent).toBe(`$${PRO.price.monthly}`);
    const blurb = q('[data-testid="upgrade-blurb"]')?.textContent ?? '';
    expect(blurb).toContain(PRO.name);
    expect(blurb).toContain(`${PRO.credits} AI credits`);
    expect(blurb).toContain(`${PRO.limits.publishedPages} published`);
  });

  // Phase-6 gate: the modal can't read tier, so it must not assert the user is on
  // a lower tier. The heading is the tier-neutral "Need more credits?" and no
  // "Upgrade to …" verb appears (that lied to a PRO user who ran out).
  it('uses tier-neutral copy — no "Upgrade to" tier assertion', () => {
    mount();
    expect(text()).toContain('Need more credits?');
    expect(text()).not.toMatch(/upgrade to/i);
  });

  // Founder ruling at the phase-4 gate: the Free-plan note was DROPPED (it
  // described credits the blocked Free user had already spent), and the title is
  // the flat "Not enough credits" — accurate whether the balance is 0 or merely
  // short of this op's cost. No conditional title (`available` is unknown on
  // malformed 402 bodies).
  it('titles the dialog "Not enough credits" regardless of the balance', () => {
    mount({ creditsRequired: 10, creditsAvailable: 2 });
    expect(q('#out-of-credits-title')?.textContent).toBe('Not enough credits');
    mount({ creditsRequired: undefined, creditsAvailable: undefined });
    expect(q('#out-of-credits-title')?.textContent).toBe('Not enough credits');
  });

  it('drops the Free-plan credit note entirely', () => {
    mount();
    expect(q('[data-testid="free-note"]')).toBeNull();
    expect(text()).not.toMatch(/one-time credits/i);
  });

  it('renders cost rows from CREDIT_COSTS and never surfaces the dead IVOC_RESEARCH', () => {
    mount();
    for (const op of [
      'FULL_PAGE_GENERATION',
      'SECTION_REGENERATION',
      'ELEMENT_REGENERATION',
    ] as const) {
      const cost = CREDIT_COSTS[op];
      const row = q(`[data-cost-op="${op}"]`);
      expect(row, `missing cost row for ${op}`).not.toBeNull();
      expect(row?.textContent).toContain(`${cost} credit${cost === 1 ? '' : 's'}`);
    }
    expect(q('[data-cost-op="IVOC_RESEARCH"]')).toBeNull();
  });

  it('links to /dashboard/billing (no Stripe call from the modal — decision 9)', () => {
    mount();
    expect(q('[data-testid="out-of-credits-upgrade-link"]')?.getAttribute('href')).toBe(
      '/dashboard/billing',
    );
  });

  it('drops the stale pricing-v1 copy (trial language, $39, 30 credits/month)', () => {
    mount();
    expect(text()).not.toMatch(/trial/i);
    expect(text()).not.toContain('$39');
    expect(text()).not.toContain('30 credits');
  });

  // The old `= 0` default meant omitting the prop rendered "refresh in 0 days" —
  // a confident lie. Nothing passes it this slice, so the block must stay hidden.
  it('omits the wait-for-reset block when daysUntilReset is undefined', () => {
    mount({ daysUntilReset: undefined });
    expect(q('[data-testid="wait-for-reset"]')).toBeNull();
    expect(text()).not.toContain('0 day');
    expect(text()).not.toMatch(/refresh/i);
  });

  it('shows the wait-for-reset block only when given a real number', () => {
    mount({ daysUntilReset: 12 });
    expect(q('[data-testid="wait-for-reset"]')?.textContent).toContain('12 days');
  });
});

// The tests above compare the DOM to the imported config — which a re-inlined
// literal ("$29") would satisfy for as long as the literal happens to match.
// This one FABRICATES the config and asserts the DOM follows, so it fails the
// moment the component stops reading the modules. (Same probe the phase-3 review
// asked for on CreditBadge.)
describe('OutOfCreditsModal — reads config (mutation probe)', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/planConfigs');
    vi.doUnmock('@/lib/creditCosts');
  });

  it('renders fabricated PLAN_CONFIGS / CREDIT_COSTS values', async () => {
    vi.resetModules();
    vi.doMock('@/lib/planConfigs', () => ({
      PlanTier: { FREE: 'FREE', PRO: 'PRO', AGENCY: 'AGENCY', ENTERPRISE: 'ENTERPRISE' },
      PLAN_CONFIGS: {
        FREE: { name: 'Gratis', credits: 777, price: { monthly: 0 }, limits: { publishedPages: 1 } },
        PRO: { name: 'Deluxe', credits: 4242, price: { monthly: 1234 }, limits: { publishedPages: 99 } },
      },
    }));
    vi.doMock('@/lib/creditCosts', () => ({
      CREDIT_COSTS: {
        FULL_PAGE_GENERATION: 61,
        SECTION_REGENERATION: 62,
        ELEMENT_REGENERATION: 63,
      },
    }));

    const { OutOfCreditsModal: Fresh } = await import('./OutOfCreditsModal');
    act(() =>
      root.render(<Fresh isOpen onClose={() => {}} creditsRequired={1} creditsAvailable={0} />),
    );

    expect(q('[data-testid="upgrade-blurb"]')?.textContent).toContain('Deluxe');
    expect(q('[data-testid="pro-price"]')?.textContent).toBe('$1234');
    expect(q('[data-testid="upgrade-blurb"]')?.textContent).toContain('4242 AI credits');
    expect(q('[data-testid="upgrade-blurb"]')?.textContent).toContain('99 published');
    expect(q('[data-cost-op="FULL_PAGE_GENERATION"]')?.textContent).toContain('61 credits');
    expect(q('[data-cost-op="SECTION_REGENERATION"]')?.textContent).toContain('62 credits');
    expect(q('[data-cost-op="ELEMENT_REGENERATION"]')?.textContent).toContain('63 credits');
  });
});
