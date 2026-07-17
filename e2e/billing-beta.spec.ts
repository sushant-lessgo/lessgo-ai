import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';
// ⚠️ RELATIVE import, not `@/lib/creditCosts` — the Playwright runner does not resolve
// tsconfig path aliases. src/lib/creditCosts.ts is prisma-free (billing-beta phase 1)
// precisely so it is node-importable from here. Same pattern/reason as the note in
// e2e/media-picker.spec.ts.
import { CREDIT_COSTS } from '../src/lib/creditCosts';
import { PLAN_CONFIGS, PlanTier } from '../src/lib/planConfigs';

// billing-beta PHASE 3 — dashboard header credit counter.
//
// Registered on the `authed` project in playwright.config.ts — a spec that isn't listed
// there matches no project and silently never runs (the config's own warning). Run just
// this file:  npx playwright test e2e/billing-beta.spec.ts --project=authed
//
// The phase-3 counter tests need no seeding — just a signed-in user
// (auth.setup.ts session) and /api/credits/balance, which exists for every user.
// The phase-4 gating test DOES seed a real project (see its header below).
test.describe.configure({ mode: 'serial' });

const prisma = new PrismaClient();

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

test.describe('billing-beta — dashboard credit counter', () => {
  test.skip(!HAS_AUTH_ENV, 'Clerk E2E creds not configured');

  test('header shows a numeric credit balance', async ({ page }) => {
    await page.goto('/dashboard');

    const badge = page.getByTestId('credit-badge');
    await expect(badge).toBeVisible();

    // Numeric: either "N" (pool-only tiers) or "N/M" (monthly allotment).
    await expect(page.getByTestId('credit-badge-value')).toHaveText(/^\d+(\/\d+)?$/);
  });

  test('cost rows render from CREDIT_COSTS config (not hardcoded)', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByTestId('credit-badge').hover();
    await expect(page.getByTestId('credit-badge-panel')).toBeVisible();

    // The config-driven acceptance criterion: each row's number IS the config value.
    // If someone re-inlines 10/2/1 and the config later changes, this fails.
    for (const op of ['FULL_PAGE_GENERATION', 'SECTION_REGENERATION', 'ELEMENT_REGENERATION'] as const) {
      const cost = CREDIT_COSTS[op];
      const row = page.locator(`[data-testid="credit-cost-row"][data-cost-op="${op}"]`);
      await expect(row).toBeVisible();
      await expect(row.getByTestId('credit-cost-value')).toHaveText(
        `${cost} credit${cost === 1 ? '' : 's'}`,
      );
    }

    // IVOC_RESEARCH is a dead constant (backend removed in scale-08) — never surfaced.
    await expect(
      page.locator('[data-testid="credit-cost-row"][data-cost-op="IVOC_RESEARCH"]'),
    ).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// billing-beta PHASE 4 — the gating message + upgrade path (THE beta blocker).
//
// WHY THIS TEST EXISTS: the store emits on `creditsBlockedBus` and
// `CreditsBlockedHost` renders the modal. The two vitests cover those ENDS —
// neither can see the WIRING. If the host isn't mounted in the editor tree (or
// silently unsubscribes), every unit test stays green while a credit block
// vanishes exactly the way it did before this slice. That regression is only
// visible here.
//
// The 402 is `page.route`-stubbed (a real block would need a 0-credit user), but
// everything else is REAL: real project, real editor, real toolbar click, real
// store path. The stub body is the SHAPE `/api/regenerate-element` really
// answers with: the route calls requireAICredits → createErrorResponse
// (planCheck.ts:193-203), which emits `{error, code}` and NOTHING ELSE. There is
// no `details` on this route — that field belongs to checkAIAccess
// (planCheck.ts:265-274), which this route never calls. So the required/available
// numbers reach the modal ONLY via the regex fallback parsing the `error` string;
// stubbing `details` here would test a shape production never sends and would
// leave that fallback — the path prod actually depends on — uncovered.
// Run just this file:
//   npx playwright test e2e/billing-beta.spec.ts --project=authed
// ---------------------------------------------------------------------------

// Meridian's hero headline is a plain text element and the fixture copy is
// deterministic ('Ship on Friday'), so a click reliably raises a toolbar.
const CFG = AUDIENCES.find((a) => a.templateId === 'meridian')!;

const REQUIRED = 1;
const AVAILABLE = 0;

let sharedToken: string | null = null;

/** Fresh authed session + ONE seeded Meridian draft, reused across tests. */
async function ensureSeededProject(page: Page): Promise<string> {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  if (sharedToken) return sharedToken;

  const api = page.request;
  const personaRes = await api.post('/api/user/persona', { data: { persona: CFG.persona } });
  expect(personaRes.ok(), `persona ${CFG.persona}: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
  expect(token, `bad token from ${url}`).toBeTruthy();

  await seedDraft(api, token, CFG);
  sharedToken = token;
  return token;
}

/**
 * Click the hero headline, then fire whichever variations affordance the editor
 * raised: ElementToolbar's "Regenerate" or TextToolbarMVP's sparkle
 * ("AI text variations"). Which one surfaces depends on the selection path —
 * BOTH call regenerateElementWithVariations → /api/regenerate-element, so either
 * is a valid trigger and the test must not be brittle about which appeared.
 */
async function triggerVariations(page: Page) {
  const headline = page.locator('[data-element-key="headline"]').first();
  await expect(headline, 'hero headline never rendered in the editor').toBeVisible({
    timeout: 60_000,
  });
  await headline.click();

  const regenerate = page.getByRole('button', { name: 'Regenerate', exact: true }).first();
  const sparkle = page.locator('button[title="AI text variations"]').first();

  await expect
    .poll(
      async () => (await regenerate.count()) > 0 || (await sparkle.count()) > 0,
      { timeout: 15_000, message: 'no variations affordance appeared in any toolbar' },
    )
    .toBe(true);

  if (await regenerate.count()) await regenerate.click();
  else await sparkle.click();
}

// Test-only HARD delete (the product's DELETE is a soft-hide, forever) so repeat
// runs don't litter the shared dev DB with seeded drafts.
test.afterAll(async () => {
  if (sharedToken) {
    await prisma.project.deleteMany({ where: { tokenId: sharedToken } }).catch(() => {});
  }
  await prisma.$disconnect();
});

test.describe('billing-beta — credit block surfaces in the editor', () => {
  test.skip(!HAS_AUTH_ENV, 'Clerk E2E creds not configured');

  test('a 402 from /api/regenerate-element raises the out-of-credits modal', async ({ page }) => {
    const token = await ensureSeededProject(page);

    // The REAL 402 body shape of this route: requireAICredits →
    // createErrorResponse emits `{error, code}` only (planCheck.ts:193-203).
    // No `details` — the numbers ride in the `error` string alone.
    await page.route('**/api/regenerate-element*', async (route) => {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          error: `Insufficient credits. Required: ${REQUIRED}, Available: ${AVAILABLE}`,
          code: 'INSUFFICIENT_CREDITS',
        }),
      });
    });

    await page.goto(`/edit/${token}`);
    await triggerVariations(page);

    // Before phase 4 this click failed SILENTLY: the toolbar's catch swallowed it
    // and nothing rendered. The modal being here IS the wiring proof.
    const modal = page.getByTestId('out-of-credits-modal');
    await expect(modal, 'credit block did not surface — is CreditsBlockedHost mounted?').toBeVisible(
      { timeout: 30_000 },
    );

    await expect(modal.getByTestId('credits-required')).toHaveText(String(REQUIRED));
    await expect(modal.getByTestId('credits-available')).toHaveText(String(AVAILABLE));

    // The upgrade path (decision 9: a LINK, no in-modal Stripe call).
    await expect(modal.getByTestId('out-of-credits-upgrade-link')).toHaveAttribute(
      'href',
      '/dashboard/billing',
    );

    // Dismissable — a modal that traps the editor would be worse than silence.
    await modal.getByTestId('out-of-credits-close').click();
    await expect(modal).toBeHidden();
  });
});

// ---------------------------------------------------------------------------
// billing-beta PHASE 6 — the lean Billing & plan view + sidebar upgrade link.
//
// No seeding: the view reads only /api/billing/{plan,usage}, which answer for
// any signed-in user. NO live Stripe assertions — clicking Upgrade would create
// a real checkout session; these tests stop at the fetch boundary.
//
// The test user's billing state is UNKNOWN (and differs between machines), so
// every tier/account assertion below is pinned to what /api/billing/plan
// actually returns at runtime rather than to an assumption.
// ---------------------------------------------------------------------------
test.describe('billing-beta — Billing & plan view', () => {
  test.skip(!HAS_AUTH_ENV, 'Clerk E2E creds not configured');

  async function readPlan(page: Page) {
    const res = await page.request.get('/api/billing/plan');
    expect(res.ok(), `/api/billing/plan: ${res.status()}`).toBeTruthy();
    return (await res.json()) as {
      tier: string;
      status: string;
      lifetimeDeal?: boolean;
      hasBillingAccount?: boolean;
    };
  }

  test('renders the plan name from PLAN_CONFIGS and the Pro MONTHLY price only', async ({
    page,
  }) => {
    const plan = await readPlan(page);
    await page.goto('/dashboard/billing');

    const config = PLAN_CONFIGS[plan.tier as PlanTier];
    await expect(page.getByTestId('billing-plan-name')).toHaveText(config.name);

    // The Pro price is only offered to a FREE user (a PRO user must never be
    // told to upgrade to the plan they're on).
    if (plan.tier === PlanTier.FREE) {
      await expect(page.getByTestId('pro-price')).toHaveText(
        `$${PLAN_CONFIGS[PlanTier.PRO].price.monthly}`,
      );
    } else {
      await expect(page.getByTestId('upgrade-cta')).toHaveCount(0);
      await expect(page.getByTestId('topup-cta')).toBeVisible();
    }

    // Decision 10: no annual dollar figure in-app — `price.annual` is a PER-MONTH
    // 24 and the real $290/yr exists only on /pricing. Either would be a lie here.
    const body = await page.locator('main').innerText();
    expect(body).not.toContain(`$${PLAN_CONFIGS[PlanTier.PRO].price.annual}`);
    expect(body).not.toContain(`$${PLAN_CONFIGS[PlanTier.PRO].price.annual * 12}`);
    expect(body).not.toContain('$290');
  });

  test('cost rows render from CREDIT_COSTS config (not hardcoded)', async ({ page }) => {
    await page.goto('/dashboard/billing');

    for (const op of [
      'FULL_PAGE_GENERATION',
      'SECTION_REGENERATION',
      'ELEMENT_REGENERATION',
    ] as const) {
      const cost = CREDIT_COSTS[op];
      const row = page.locator(`[data-testid="billing-cost-row"][data-cost-op="${op}"]`);
      await expect(row).toBeVisible();
      await expect(row.getByTestId('billing-cost-value')).toHaveText(
        `${cost} credit${cost === 1 ? '' : 's'}`,
      );
    }
    await expect(
      page.locator('[data-testid="billing-cost-row"][data-cost-op="IVOC_RESEARCH"]'),
    ).toHaveCount(0);
  });

  test('Manage billing state follows hasBillingAccount, not tier', async ({ page }) => {
    const plan = await readPlan(page);
    await page.goto('/dashboard/billing');

    if (plan.hasBillingAccount) {
      await expect(page.getByTestId('manage-billing-cta')).toBeVisible();
      await expect(page.getByTestId('manage-billing-disabled')).toHaveCount(0);
    } else {
      // Greyed, never omitted — and it says why.
      await expect(page.getByTestId('manage-billing-disabled')).toBeVisible();
      await expect(page.getByTestId('manage-billing-cta')).toHaveCount(0);
    }
  });

  test('"Next charge" only appears for a live, non-lifetime PRO subscription', async ({ page }) => {
    const plan = await readPlan(page);
    await page.goto('/dashboard/billing');

    const shouldShow =
      plan.tier === PlanTier.PRO &&
      !plan.lifetimeDeal &&
      ['active', 'trialing'].includes(plan.status);

    await expect(page.getByTestId('billing-next-charge')).toHaveCount(shouldShow ? 1 : 0);
  });

  test('sidebar Upgrade is an enabled link to /dashboard/billing', async ({ page }) => {
    await page.goto('/dashboard');

    const upgrade = page.getByRole('link', { name: 'Upgrade', exact: true });
    await expect(upgrade).toBeVisible();
    await expect(upgrade).toHaveAttribute('href', '/dashboard/billing');
    // It was greyed (aria-disabled) before this phase.
    await expect(upgrade).not.toHaveAttribute('aria-disabled', 'true');

    await upgrade.click();
    await expect(page).toHaveURL(/\/dashboard\/billing/);
    await expect(page.getByTestId('billing-plan-name')).toBeVisible();
  });
});
