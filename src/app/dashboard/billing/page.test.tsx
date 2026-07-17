// billing-beta phase 6 — the Billing & plan view renders CONFIG, and gates its
// money-facing rows on the right fields.
//
// Two kinds of test here, and the SECOND is the load-bearing one:
//  1. compare-to-imported-config assertions (readable, but a re-inlined literal
//     "$29" satisfies them for as long as it happens to match the config — all 8
//     of phase 4's config tests passed against a hardcoded $29);
//  2. the fabricated-config MUTATION PROBE (bottom) — `vi.doMock`s both config
//     modules with values nothing else in the repo uses and asserts the DOM
//     follows. This is the only test that fails the moment the view stops READING
//     the modules. Copied from OutOfCreditsModal.test.tsx:150-190 per the phase-4
//     carry-over.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo).

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { CREDIT_COSTS } from '@/lib/creditCosts';
import { PLAN_CONFIGS, PlanTier } from '@/lib/planConfigs';
import { ToastProvider } from '@/components/ui/toast';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) =>
    React.createElement('a', { href, ...rest }, children),
}));

// The page reads `?success=true` only; no router push anywhere.
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PRO = PLAN_CONFIGS[PlanTier.PRO];
const FREE = PLAN_CONFIGS[PlanTier.FREE];

let container: HTMLDivElement;
let root: Root;

interface Fixture {
  plan?: Record<string, unknown>;
  usage?: Record<string, unknown>;
}

const FREE_PLAN = {
  tier: 'FREE',
  status: 'active',
  creditsLimit: 0,
  creditPool: 12,
  lifetimeDeal: false,
  hasBillingAccount: false,
  currentPeriodEnd: '2030-01-31T00:00:00.000Z',
  isTrialing: false,
  trialEnd: null,
};

const FREE_USAGE = {
  credits: { used: 8, remaining: 0, limit: 0, poolRemaining: 12, totalAvailable: 12 },
};

function stubFetch({ plan = FREE_PLAN, usage = FREE_USAGE }: Fixture = {}) {
  const json = (body: unknown) =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/billing/plan')) return json(plan);
      if (url.includes('/api/billing/usage')) return json(usage);
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) } as Response);
    }),
  );
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const q = (sel: string) => container.querySelector(sel);
const text = () => container.textContent ?? '';

async function mount(
  Page: React.ComponentType,
  // The mutation probe calls vi.resetModules(), so its freshly-imported page
  // consumes a FRESH toast module — the statically imported ToastProvider above
  // would then be a different React context and useToast() would throw. The
  // probe passes the matching fresh provider.
  Provider: React.ComponentType<{ children: React.ReactNode }> = ToastProvider,
) {
  await act(async () => {
    root.render(
      <Provider>
        <Page />
      </Provider>,
    );
  });
  // flush the two resolved fetches + their setState
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function mountPage(fixture: Fixture = {}) {
  stubFetch(fixture);
  const { default: Page } = await import('./page');
  await mount(Page);
}

describe('Billing & plan view', () => {
  it('renders the plan name and monthly price from PLAN_CONFIGS', async () => {
    await mountPage();
    expect(q('[data-testid="billing-plan-name"]')?.textContent).toBe(FREE.name);
    expect(q('[data-testid="billing-plan-price"]')?.textContent).toBe(`$${FREE.price.monthly}/month`);
    expect(q('[data-testid="pro-price"]')?.textContent).toBe(`$${PRO.price.monthly}`);
  });

  // Decision 10: `price.annual` is a PER-MONTH figure (24) and the $290/yr number
  // lives only on /pricing. Any annual figure rendered here would be false.
  it('renders NO annual dollar figure anywhere', async () => {
    await mountPage();
    const body = text();
    expect(body).not.toContain(`$${PRO.price.annual}`);
    expect(body).not.toContain(`$${PRO.price.annual * 12}`);
    expect(body).not.toContain('$290');
    expect(body).not.toMatch(/\/year|\/yr|annually/i);
  });

  it('renders cost rows from CREDIT_COSTS and never surfaces the dead IVOC_RESEARCH', async () => {
    await mountPage();
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

  // The salvaged pool-aware math: FREE has monthly limit 0 with its credits in
  // the pool, so a naive read renders "0 credits" to a user who has 12.
  it('labels a FREE balance from the pool, not the (zero) monthly limit', async () => {
    await mountPage();
    expect(q('[data-testid="billing-credits-total"]')?.textContent).toBe('12');
    expect(q('[data-testid="billing-credits-label"]')?.textContent).toContain('12 one-time credits');
  });

  it('labels an LTD balance as lifetime credits', async () => {
    await mountPage({
      plan: { ...FREE_PLAN, tier: 'PRO', lifetimeDeal: true, creditPool: 600 },
      usage: { credits: { used: 0, remaining: 0, limit: 0, poolRemaining: 600, totalAvailable: 600 } },
    });
    expect(q('[data-testid="billing-credits-label"]')?.textContent).toContain('600 lifetime credits');
  });

  // Decision 4 — the money-facing falsehood this gate exists to prevent.
  it('omits "Next charge" for FREE (its period end is a rollover, not a charge)', async () => {
    await mountPage();
    expect(q('[data-testid="billing-next-charge"]')).toBeNull();
    expect(text()).not.toMatch(/next charge/i);
  });

  it('omits "Next charge" for an LTD user even on PRO tier', async () => {
    await mountPage({ plan: { ...FREE_PLAN, tier: 'PRO', lifetimeDeal: true } });
    expect(q('[data-testid="billing-next-charge"]')).toBeNull();
  });

  it('omits "Next charge" for a cancelled PRO subscription', async () => {
    await mountPage({ plan: { ...FREE_PLAN, tier: 'PRO', status: 'cancelled' } });
    expect(q('[data-testid="billing-next-charge"]')).toBeNull();
  });

  it('shows "Next charge" for a live PRO subscription', async () => {
    await mountPage({ plan: { ...FREE_PLAN, tier: 'PRO', status: 'active' } });
    expect(q('[data-testid="billing-next-charge"]')).not.toBeNull();
  });

  // Phase-8 gate B5 — raw Stripe vocab is mapped to friendly copy for a glancing
  // founder; the raw token must not leak into the status badge.
  it('renders friendly status copy, not raw Stripe vocab', async () => {
    await mountPage({ plan: { ...FREE_PLAN, status: 'past_due' } });
    const badge = q('[data-testid="billing-status"]');
    expect(badge?.textContent).toContain('Payment overdue');
    expect(badge?.textContent).not.toContain('past_due');
  });

  it('capitalizes an unknown status as a fallback', async () => {
    await mountPage({ plan: { ...FREE_PLAN, status: 'unpaid' } });
    const badge = q('[data-testid="billing-status"]');
    expect(badge?.textContent).toContain('Unpaid');
  });

  // Decision 5 — hasBillingAccount, NOT tier.
  it('greys Manage billing when the user has no Stripe customer id', async () => {
    await mountPage({ plan: { ...FREE_PLAN, hasBillingAccount: false } });
    expect(q('[data-testid="manage-billing-cta"]')).toBeNull();
    const greyed = q('[data-testid="manage-billing-disabled"]');
    expect(greyed).not.toBeNull();
    expect(greyed?.getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps Manage billing LIVE for a churned ex-payer (FREE tier WITH a customer id)', async () => {
    await mountPage({ plan: { ...FREE_PLAN, tier: 'FREE', hasBillingAccount: true } });
    expect(q('[data-testid="manage-billing-cta"]')).not.toBeNull();
    expect(q('[data-testid="manage-billing-disabled"]')).toBeNull();
  });

  it('greys Manage billing for an admin-granted PRO with no customer id', async () => {
    await mountPage({ plan: { ...FREE_PLAN, tier: 'PRO', hasBillingAccount: false } });
    expect(q('[data-testid="manage-billing-disabled"]')).not.toBeNull();
  });

  // Carried from the phase-4 gate: the tier-blind "Upgrade to Pro".
  it('offers Upgrade to a FREE user', async () => {
    await mountPage();
    expect(q('[data-testid="upgrade-cta"]')?.textContent).toContain(`Upgrade to ${PRO.name}`);
  });

  it('never tells a PRO user to upgrade to Pro — it offers a top-up instead', async () => {
    await mountPage({ plan: { ...FREE_PLAN, tier: 'PRO' } });
    expect(q('[data-testid="upgrade-cta"]')).toBeNull();
    expect(text()).not.toMatch(/upgrade to pro/i);
    expect(q('[data-testid="topup-cta"]')).not.toBeNull();
  });
});

// Fabricated config: nothing else in the repo uses these numbers, so the DOM can
// only show them if the component READ the modules (catches a same-value
// re-inline, which no compare-to-config assertion can).
describe('Billing & plan view — reads config (mutation probe)', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/planConfigs');
    vi.doUnmock('@/lib/creditCosts');
  });

  it('renders fabricated PLAN_CONFIGS / CREDIT_COSTS values', async () => {
    vi.resetModules();
    vi.doMock('@/lib/planConfigs', () => ({
      PlanTier: { FREE: 'FREE', PRO: 'PRO', AGENCY: 'AGENCY', ENTERPRISE: 'ENTERPRISE' },
      PlanStatus: { ACTIVE: 'active', TRIALING: 'trialing' },
      PLAN_CONFIGS: {
        FREE: { name: 'Gratis', credits: 777, price: { monthly: 0 }, limits: { publishedPages: 1 } },
        PRO: {
          name: 'Deluxe',
          credits: 4242,
          price: { monthly: 1234 },
          limits: { publishedPages: 99 },
        },
      },
    }));
    vi.doMock('@/lib/creditCosts', () => ({
      CREDIT_COSTS: {
        FULL_PAGE_GENERATION: 61,
        SECTION_REGENERATION: 62,
        ELEMENT_REGENERATION: 63,
      },
    }));

    stubFetch();
    const { default: Fresh } = await import('./page');
    const { ToastProvider: FreshToastProvider } = await import('@/components/ui/toast');
    await mount(Fresh, FreshToastProvider);

    expect(q('[data-testid="billing-plan-name"]')?.textContent).toBe('Gratis');
    expect(text()).toContain('Upgrade to Deluxe');
    expect(q('[data-testid="pro-price"]')?.textContent).toBe('$1234');
    expect(q('[data-testid="upgrade-blurb"]')?.textContent).toContain('4242 AI credits');
    expect(q('[data-testid="upgrade-blurb"]')?.textContent).toContain('99 published');
    expect(q('[data-cost-op="FULL_PAGE_GENERATION"]')?.textContent).toContain('61 credits');
    expect(q('[data-cost-op="SECTION_REGENERATION"]')?.textContent).toContain('62 credits');
    expect(q('[data-cost-op="ELEMENT_REGENERATION"]')?.textContent).toContain('63 credits');
  });
});
