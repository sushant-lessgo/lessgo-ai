import { test, expect, type Page } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// toolbar-beta-followup phase 1 — the LOAD-BEARING behavioral proof that Regen
// still works through the t2 shell after regen-modernization rewrote the routes it
// calls. Green units are NOT sufficient here (documented "green-but-false" risk):
// this drives BOTH regen paths THROUGH THE TOOLBAR and asserts the regenerated
// content actually LANDS in the DOM — not merely that the endpoint returned 200.
//
//   1. Element regen (text toolbar sparkle) → regenerateElementWithVariations →
//      POST /api/regenerate-element → variations panel → applyVariation writes the
//      picked (non-zero) variation into the element's DOM text.
//   2. Section regen (the NEW section-toolbar Regen action) → regenerateSection →
//      POST /api/regenerate-section → the deterministic mock section content lands
//      in the section's element DOM text.
//   3. The existing Button/CTA Regenerate affordance is still present (presence
//      assertion; the full element-regen flow above already exercises the shared
//      `regenerateElementWithVariations` call, so no second flow is needed).
//
// Both routes short-circuit deterministically in mock mode
// (NEXT_PUBLIC_USE_MOCK_GPT==='true'): regenerate-section returns
// `generateMockSectionContent(sectionId, sectionType)` (route.ts:238-249) — for a
// hero that is `headline: 'Transform Your Business with AI-Powered Solutions'`;
// regenerate-element returns `generateMockVariations(currentContent, n)` whose
// first variation is `${currentContent} - Enhanced version` (route.ts:126-136,
// 203-215). Those two literals are the substrings this spec pins.
//
// Harness mirrors toolbar-dispatch.spec: authed Clerk session (storageState from
// the `setup` project) → persona → /api/start → seed a mock-mode Meridian draft
// via the real routes → open /edit/<token>.
//
// ⚠️ Registration: `playwright.config.ts` testMatch is an explicit ALLOWLIST. This
// spec must be listed in the `authed` project or it silently runs zero tests.
test.describe.configure({ mode: 'serial' });

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

// Meridian: fixed product section list, stable hero `headline` key — same target
// the toolbar-dispatch cases use.
const cfg = AUDIENCES.find((a) => a.templateId === 'meridian')!;

const SHELL = '[data-toolbar-chrome]';
// The deterministic mock-content literals (see the header note + the route files).
const MOCK_HERO_HEADLINE = 'Transform Your Business with AI-Powered Solutions';
const MOCK_VARIATION_SUFFIX = ' - Enhanced version';

/** Every `data-action` id currently rendered inside the one floating shell. */
async function actionIds(page: Page): Promise<string[]> {
  return page.locator(`${SHELL} [data-action]`).evaluateAll((els) =>
    els.map((e) => e.getAttribute('data-action') || '').sort(),
  );
}

test.describe('toolbar regen (phase 1: element + section, content lands)', () => {
  let token: string;

  test.beforeAll(async ({ browser }) => {
    test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

    const page = await browser.newPage();
    await page.goto('/');
    await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
    const api = page.request;

    const personaRes = await api.post('/api/user/persona', { data: { persona: cfg.persona } });
    expect(personaRes.ok(), `persona ${cfg.persona}: ${personaRes.status()}`).toBeTruthy();

    const startRes = await api.get('/api/start');
    expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
    const { url } = await startRes.json();
    token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
    expect(token, `bad token from ${url}`).toBeTruthy();

    await seedDraft(api, token, cfg);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH_ENV, 'authed env not configured');
    await page.goto(`/edit/${token}`);
    await expect(
      page.locator('[data-element-key="headline"]').first(),
      'editor never rendered the hero headline',
    ).toBeVisible({ timeout: 60_000 });
  });

  // ── Element regen: text toolbar sparkle → variations → apply ─────────────────
  test('element regen: sparkle produces variations and the picked one lands in the DOM', async ({
    page,
  }) => {
    const headline = page.locator('[data-element-key="headline"]').first();
    // Single click enters text-edit mode → the `text` action set (sparkle lives here).
    await headline.click();
    await expect(page.locator(SHELL), 'expected exactly ONE floating shell').toHaveCount(1, {
      timeout: 15_000,
    });
    await expect(page.locator(SHELL)).toHaveAttribute('data-toolbar-type', 'text');

    const originalText = (await headline.innerText()).trim();
    expect(originalText.length, 'hero headline had no text to regenerate from').toBeGreaterThan(0);

    // Fire the sparkle → regenerateElementWithVariations → POST /api/regenerate-element.
    await page.locator(`${SHELL} [data-action="ai-variations"]`).click();

    // The variations panel appears with the current copy (index 0) + the mock
    // variations. That is >1 option, which is the whole point.
    await expect(page.getByText('Choose Variation'), 'variations panel never opened').toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Current', { exact: true })).toBeVisible();
    const optionCount = await page.getByText(/^(Current|Variation \d+)$/).count();
    expect(optionCount, 'expected more than one variation option').toBeGreaterThan(1);

    // Pick a NON-zero variation (index 1 → `${current} - Enhanced version`) and apply.
    await page.getByText('Variation 1', { exact: true }).click();
    await page.getByRole('button', { name: 'Apply Variation' }).click();

    // The picked variation must actually be written to the element's DOM text — and
    // it must differ from the original (proves applyVariation ran, not just a 200).
    await expect(headline).toContainText(MOCK_VARIATION_SUFFIX, { timeout: 15_000 });
    const appliedText = (await headline.innerText()).trim();
    expect(appliedText, 'applied variation is identical to the original — nothing landed').not.toBe(
      originalText,
    );
  });

  // ── Section regen: the NEW section-toolbar Regen action ──────────────────────
  test('section regen: the Regen action shows in-flight state and lands mock content', async ({
    page,
  }) => {
    // Slow the regen response so the in-flight state is deterministically
    // observable (mock fetch is otherwise near-instant). The REAL route still runs.
    await page.route('**/api/regenerate-section', async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      await route.continue();
    });

    const heroHeadline = page.locator('[data-section-id^="hero"] [data-element-key="headline"]').first();
    await expect(heroHeadline, 'hero draft rendered no headline').toBeVisible({ timeout: 30_000 });
    const originalText = (await heroHeadline.innerText()).trim();

    // Select the hero SECTION (corner padding, not an element inside it) → section toolbar.
    await page.locator('[data-section-id^="hero"]').first().click({ position: { x: 4, y: 4 } });
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator(SHELL)).toHaveAttribute('data-toolbar-type', 'section');

    // The new Regen action is present on a body section, and it is NOT a placeholder.
    const ids = await actionIds(page);
    expect(ids, 'Regen action missing from the section toolbar').toContain('regen');
    const regen = page.locator(`${SHELL} [data-action="regen"]`);
    await expect(regen, 'Regen must be live, not a greyed placeholder').not.toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await regen.click();

    // In-flight: the always-mounted header Regen-Copy control reflects the shared
    // `aiGeneration.isGenerating` state, showing "Regenerating…" while the section
    // regen is in flight. (The SectionToolbar's own progress card only renders while
    // the section stays selected; the section re-render can detach the floating
    // toolbar, so the header control is the stable in-flight affordance to assert.)
    await expect(
      page.getByRole('button', { name: /Regenerating/i }),
      'no in-flight state after clicking Regen',
    ).toBeVisible({ timeout: 15_000 });

    // Content lands: the deterministic mock hero headline replaces the original.
    await expect(heroHeadline, 'mock section content never landed in the DOM').toContainText(
      MOCK_HERO_HEADLINE,
      { timeout: 30_000 },
    );
    const newText = (await heroHeadline.innerText()).trim();
    expect(newText, 'section headline did not change after regen').not.toBe(originalText);
  });

  // ── Button/CTA Regenerate is still present (regression guard) ─────────────────
  test('button/CTA Regenerate affordance is retained', async ({ page }) => {
    // Meridian's hero CTA is a single-click-selects button → the `element` set.
    await page.locator('[data-element-key="cta_text"]').first().click();
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator(SHELL)).toHaveAttribute('data-toolbar-type', 'element');

    // The Button/CTA Regenerate (→ regenerateElementWithVariations, the same call the
    // element-regen flow above exercised end-to-end) must still be on the toolbar.
    await expect(
      page.locator(`${SHELL} [data-action="regenerate-copy"]`),
      'Button/CTA Regenerate was dropped from the element toolbar',
    ).toHaveCount(1);
  });
});
