import { test, expect, type Page } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// toolbar-standard-beta phase 4 — t5 manage-items.
//
// What it pins:
//   1. SOCIAL: the footer toolbar's "Manage social" action opens the t5 editor, and
//      reordering a profile genuinely reorders it. Asserted as the FULL ordered list
//      (an endpoint-only check can sit green while the rest of the list permutes).
//   2. FORM: the FormBuilder is REACHABLE IN A REAL BROWSER via the path a user
//      actually walks (button toolbar → Button Settings → Native Form → Create New
//      Form). This is phase 4's premise gate: the brief warned "NOBODY HAS EVER
//      OBSERVED FormBuilder OPENING" and forbade building reorder into a modal
//      nobody can open. This test is what makes that observable, in CI, forever.
//   3. FORM: the add-field type list offers ONLY the published-supported union —
//      driven through the REAL Radix Select (which cannot be opened in jsdom).
//   4. FORM: field reorder moves the draft.
//
// HONEST SPLIT — WHAT IS **NOT** HERE, AND WHY:
//   - The form-reorder SAVE-PERSISTENCE assertion lives in
//     `src/components/forms/FormBuilder.test.tsx`, not here. FormBuilder commits to
//     the store and closes; re-opening the SAME form for edit needs a form-edit
//     affordance that ButtonConfigurationModal does not expose (it only lists forms
//     for SELECTION, :784-799). Asserting "the modal closed" would be an endpoint
//     that passes whether or not the order persisted — exactly the theatre the brief
//     forbids. The unit test reads the REAL store after Save and is mutation-proven
//     (gutting handleMoveField, and separately making Save write the stale order,
//     each fail it). Stated rather than faked.
//   - The social CAP + first/last move-button gating are unit-tested
//     (`SocialItemsEditor.test.tsx`): maxItems is 8, so an e2e cap test would have to
//     add eight profiles one at a time through the UI.
//
// ⚠️ Registration: `playwright.config.ts` testMatch is an explicit ALLOWLIST. This
// spec is listed in the `authed` project — without that it silently runs zero tests
// (the trap that cost phase 1 a review loop).
test.describe.configure({ mode: 'serial' });

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

const cfg = AUDIENCES.find((a) => a.templateId === 'meridian')!;
const SHELL = '[data-toolbar-chrome]';
const PANEL = '[data-testid="social-items-editor"]';

/** Platform names in the order the t5 panel renders them. */
async function socialOrder(page: Page): Promise<string[]> {
  return page
    .locator('[data-testid="social-item-platform"]')
    .evaluateAll((els) => els.map((e) => e.textContent?.trim() ?? ''));
}

/** Add one profile through the panel's real add form. */
async function addProfile(page: Page, platform: string, url: string) {
  await page.locator('[data-testid="social-add"]').click();
  await page.locator('[data-testid="social-platform-select"]').selectOption(platform);
  await page.locator('[data-testid="social-url-input"]').fill(url);
  await page.locator('[data-testid="social-save"]').click();
  // The form resets (and closes) on a successful save.
  await expect(page.locator('[data-testid="social-item-form"]')).toHaveCount(0);
}

/** Open the footer's toolbar. */
async function selectFooter(page: Page) {
  const footer = page.locator('[data-section-id^="footer"]').first();
  await expect(footer, 'meridian draft rendered no footer section').toBeVisible({ timeout: 30_000 });
  await footer.click({ position: { x: 4, y: 4 } });
  await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
}

test.describe('manage items (phase 4: social t5 + form field reorder)', () => {
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

  // ── SOCIAL ────────────────────────────────────────────────────────────────
  //
  // ENTRY POINT NOTE: "Manage social" is hosted on the FOOTER's chrome-section
  // toolbar, not on an element toolbar. Phase 4 verified that social icons are NOT
  // spine-selectable — `ToolbarType` has no 'social' member and nothing in src/ emits
  // a `data-element-key` for a socialMediaConfig item. The plan's step 2 sanctioned
  // exactly this fallback ("if not, surface Manage-items on the containing
  // chrome-section (footer) toolbar instead").
  test('footer toolbar hosts Manage social; it opens the t5 editor', async ({ page }) => {
    await selectFooter(page);

    const manage = page.locator(`${SHELL} [data-action="manage-social"]`);
    await expect(manage, 'Manage social is missing from the footer toolbar').toHaveCount(1);
    await expect(manage, 'Manage social must be REAL, not a placeholder').not.toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await manage.click();
    await expect(page.locator(PANEL), 'Manage social did not open the t5 editor').toBeVisible({
      timeout: 10_000,
    });
  });

  // Manage social is FOOTER-only — the header's Beta column is Menu, deferred
  // entirely (ruling 9). Gating on `isChromeId` instead of `isFooterId` would leak
  // it onto the header; this is the assertion that catches that.
  test('Manage social + Orientation do not leak onto the header or body sections', async ({
    page,
  }) => {
    const header = page.locator('[data-section-id^="header"]').first();
    await expect(header).toBeVisible({ timeout: 30_000 });
    await header.click({ position: { x: 4, y: 4 } });
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });

    for (const leaked of ['manage-social', 'social-orientation']) {
      await expect(
        page.locator(`${SHELL} [data-action="${leaked}"]`),
        `${leaked} leaked onto the shared header`,
      ).toHaveCount(0);
    }
  });

  // THE REORDER INVARIANT (mutation target: break the adjacent swap in
  // SocialItemsEditor.moveItem and this must fail).
  //
  // Asserts the FULL ordered list before AND after. `reorderSocialMediaItems` rewrites
  // every item's `order`, so the whole list — not just the moved row — is the
  // invariant. A "first item changed" assertion would pass on a list that silently
  // scrambled the tail.
  test('reordering a social profile changes the rendered order', async ({ page }) => {
    await selectFooter(page);
    await page.locator(`${SHELL} [data-action="manage-social"]`).click();
    await expect(page.locator(PANEL)).toBeVisible({ timeout: 10_000 });

    await addProfile(page, 'Twitter/X', 'https://twitter.com/lessgo');
    await addProfile(page, 'LinkedIn', 'https://linkedin.com/company/lessgo');
    await addProfile(page, 'GitHub', 'https://github.com/lessgo');

    expect(await socialOrder(page)).toEqual(['Twitter/X', 'LinkedIn', 'GitHub']);

    // Move the FIRST profile down → it swaps with the second, third untouched.
    await page
      .locator('[data-testid="social-item"]')
      .first()
      .locator('[data-testid="social-move-down"]')
      .click();

    expect(
      await socialOrder(page),
      'the social profile order did not change — reorder is broken',
    ).toEqual(['LinkedIn', 'Twitter/X', 'GitHub']);

    // ...and move it back up, proving the swap is symmetric rather than a one-way
    // shuffle that happens to look right once.
    await page
      .locator('[data-testid="social-item"]')
      .nth(1)
      .locator('[data-testid="social-move-up"]')
      .click();
    expect(await socialOrder(page)).toEqual(['Twitter/X', 'LinkedIn', 'GitHub']);
  });

  // Orientation is a GREYED PLACEHOLDER (ruling 9 + plan D-2: SocialMediaConfig has
  // no orientation field, and adding one = a published-renderer read). Present +
  // aria-disabled + a mandatory "why" tooltip + inert.
  test('Social Orientation is a greyed placeholder with a why-tooltip', async ({ page }) => {
    await selectFooter(page);

    const orientation = page.locator(`${SHELL} [data-action="social-orientation"]`);
    await expect(orientation, 'the Orientation placeholder is missing').toHaveCount(1);
    await expect(orientation).toHaveAttribute('aria-disabled', 'true');

    const title = await orientation.getAttribute('title');
    expect(title, 'a dead button with no "why" reads as a bug (naayom C2)').toBeTruthy();
    expect(title, 'the Orientation tooltip must say WHY it is off').toMatch(/coming|stored/i);

    // Inert: force past the disabled state — nothing opens, the shell survives.
    await orientation.click({ force: true });
    await expect(page.locator(SHELL)).toHaveCount(1);
    await expect(
      page.locator(PANEL),
      'Orientation opened the social editor — it must have NOTHING behind it',
    ).toHaveCount(0);
  });

  // ── FORM ──────────────────────────────────────────────────────────────────
  //
  // PHASE 4'S PREMISE GATE, in a real browser. Walks the user's actual path:
  // hero CTA → Button Settings → Native Form → Create New Form → FormBuilder.
  //
  // ⚠️ LOCATOR NOTE — reading this before touching the locators will save an hour.
  //
  // A REAL PRE-EXISTING BUG shapes every locator here. It was DISCOVERED by phase 4
  // (this spec is the first test that ever CLICKED Button Settings — phase 2/3.5 only
  // asserted that the button exists), is REPORTED in the audit, and is NOT fixed
  // here: both files involved are outside phase 4's files-touched.
  //
  // THE BUG: `GlobalButtonConfigModal` is mounted TWICE — `EditLayout.tsx:223` AND
  // `GlobalModals.tsx:99` (itself mounted at MainContent.tsx:682) — and both read the
  // same GLOBAL `useButtonConfigModal` zustand store. So opening Button Settings
  // renders TWO identical, perfectly-stacked dialogs. Consequences:
  //   1. Radix aria-hides each on behalf of the other ⇒ BOTH end up
  //      `aria-hidden="true"`, so `getByRole('dialog')` and EVERY role query INSIDE
  //      them match ZERO elements — even though the dialogs are open and visible.
  //      Hence CSS `[role="dialog"]` + `.locator('button', { hasText })` throughout.
  //      (This first showed up as an `isVisible()` guard silently skipping the Detach
  //      click, leaving followGoal true so `#form` never rendered.)
  //   2. Both are `fixed inset-50% z-50`, so the SECOND covers the first and
  //      intercepts its pointer events ⇒ `.last()` is the interactive one. `.first()`
  //      is click-blocked by its own duplicate.
  // A screen-reader user currently gets NO dialog announced at all — worth its own
  // ticket.
  //
  // FORWARD-COMPATIBLE: if someone de-duplicates the mount, `.last()` still resolves
  // (one dialog ⇒ last === first) and these tests keep passing. This spec does not
  // cement the bug in place.
  async function openFormBuilder(page: Page) {
    await page.locator('[data-element-key="cta_text"]').first().click();
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    await page.locator(`${SHELL} [data-action="button-config"]`).click();

    const modal = page
      .locator('[role="dialog"]')
      .filter({ hasText: 'Button Configuration' })
      .last();
    await expect(modal, 'Button Settings never opened').toBeVisible({ timeout: 15_000 });

    // A primary CTA follows the project goal by default (`dest: 'GOAL_REF'`), and
    // BCM hides the whole action-type picker while it does (`{!followGoal && ...}`,
    // BCM:689). Meridian's hero CTA IS primary, so this step is REQUIRED, not
    // defensive — without it `#form` never renders and the form section is
    // unreachable. `.locator('button', { hasText })` and NOT `getByRole('button')`:
    // the enclosing dialog is aria-hidden (see the note above), so role queries
    // INSIDE it also match nothing and an `isVisible()` guard would silently skip
    // this click — which is exactly how this failed the first time.
    const detach = modal.locator('button', { hasText: /Detach/i }).first();
    await expect(detach, 'expected a goal-following primary CTA to offer Detach').toBeVisible({
      timeout: 10_000,
    });
    await detach.click();

    // Switch the button to a native form so the form section renders.
    await modal.locator('#form').first().click();

    await modal.locator('button', { hasText: /Create New Form/i }).first().click();

    const builder = page.locator('[role="dialog"]').filter({ hasText: 'Form Fields' }).last();
    await expect(
      builder,
      'FormBuilder did NOT open — phase 4 would have built field reorder into an unreachable modal',
    ).toBeVisible({ timeout: 15_000 });
    return builder;
  }

  test('FormBuilder is reachable from Button Settings → Create New Form', async ({ page }) => {
    const builder = await openFormBuilder(page);
    // It is the real builder, not an empty shell.
    await expect(builder.locator('h2', { hasText: 'Create New Form' }).first()).toBeVisible();
    await expect(builder.locator('button', { hasText: /Add Field/i }).first()).toBeVisible();
  });

  // THE TYPE-RESTRICTION ASSERTION, through the REAL Radix Select (jsdom cannot open
  // it). Mutation target: append an unpublishable type to FIELD_TYPES and this fails.
  // Set EQUALITY, not a subset — a subset check would pass while a 6th, unpublishable
  // option sat in the list.
  test('the add-field type list offers ONLY the published-supported types', async ({ page }) => {
    const builder = await openFormBuilder(page);
    await builder.locator('button', { hasText: /Add Field/i }).first().click();

    await builder.locator('[data-testid="form-field-type-trigger"]').first().click();

    const options = page.locator('[data-testid="form-field-type-option"]');
    await expect(options.first()).toBeVisible({ timeout: 10_000 });

    const labels = await options.evaluateAll((els) => els.map((e) => e.textContent?.trim() ?? ''));
    // FormMarkupPublished.tsx:16-22 renders exactly: text | email | tel | textarea | select.
    expect(labels.sort()).toEqual(['Dropdown', 'Email', 'Phone', 'Text Area', 'Text Input'].sort());
    // The store's 10-member FormFieldType must not have leaked in — those would be
    // buildable but would silently vanish on publish.
    for (const unsupported of ['Radio', 'Checkbox', 'File', 'Date', 'Number']) {
      expect(labels, `"${unsupported}" is offered but publish cannot render it`).not.toContain(
        unsupported,
      );
    }
  });

  // Field reorder in the draft. (Save-persistence is asserted in FormBuilder.test.tsx
  // against the real store — see the header note; there is no form-edit affordance to
  // re-open a saved form through here.)
  test('form fields reorder via move up/down', async ({ page }) => {
    const builder = await openFormBuilder(page);

    await builder.locator('button', { hasText: /Add Field/i }).first().click();
    await builder.locator('button', { hasText: /Add Field/i }).first().click();

    const labels = builder.locator('input[placeholder="Enter field label"]');
    await expect(labels).toHaveCount(2);
    await labels.nth(0).fill('First');
    await labels.nth(1).fill('Second');

    await expect(labels.nth(0)).toHaveValue('First');
    await expect(labels.nth(1)).toHaveValue('Second');

    // Move field 1 down → the two swap.
    await builder
      .locator('[data-testid="form-field-row"]')
      .first()
      .locator('[data-testid="form-field-move-down"]')
      .click();

    await expect(labels.nth(0), 'the field order did not change — reorder is broken').toHaveValue(
      'Second',
    );
    await expect(labels.nth(1)).toHaveValue('First');

    // Boundary controls: the (now) first row cannot move up, the last cannot move down.
    await expect(
      builder.locator('[data-testid="form-field-row"]').first().locator('[data-testid="form-field-move-up"]'),
    ).toBeDisabled();
    await expect(
      builder.locator('[data-testid="form-field-row"]').last().locator('[data-testid="form-field-move-down"]'),
    ).toBeDisabled();
  });
});
