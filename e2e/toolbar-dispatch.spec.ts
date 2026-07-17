import { test, expect, type Page } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// toolbar-standard-beta phase 1 — the dispatch + anatomy net.
//
// What it pins (the things phase 1 actually changed, and the things a later phase
// could silently break):
//   1. SINGLE-VISIBILITY: clicking any target yields exactly ONE floating shell.
//      The whole point of the ToolbarShell spine; two shells = the renegade-toolbar
//      regression the track exists to kill.
//   2. Per-type `data-action` sets. Before phase 1 only SectionToolbar tagged
//      `data-action`; now every ToolbarButton does, so the curated action set per
//      element type is finally assertable from the DOM.
//   3. Design ▾ renders, is `aria-disabled`, and does nothing (skeleton-gated, D-3).
//   4. Ask AI is NOT present (it lands in phase 5 behind a human gate).
//   5. Esc dismisses.
//
// phase 2 adds the Button/CTA + Footer cases. NOTE: there is deliberately NO form
// case, and there is no longer any form toolbar to test — phase 3 DELETED the inert
// `FormToolbar` + `actionSets['form']` per founder ruling 8. Form dispatch is
// over-determined dead: `determineElementType` (useEditor.ts:182-189) returns 'text'
// on the tagName branch before `elementKey.includes('form')` (:197) is reached, AND
// `isTextEditing` outranks `form` (selectionPriority.ts:45-47), AND the real
// <input>s carry no element key. Form is deferred to Final; it needs a spec that
// decides what selects a form and lands the DOM affordance.
//
// Shape mirrors edit-persistence.spec: authed Clerk session (storageState from the
// `setup` project) → persona → /api/start → seed a mock-mode Meridian draft via the
// real routes → open /edit/<token>. Mock mode = no LLM, no credits, deterministic.
//
// ⚠️ Registration: `playwright.config.ts` testMatch is an explicit ALLOWLIST. This
// spec must be listed in the `authed` project or it silently runs zero tests. See
// the audit — that file was outside phase 1's Files-touched list.
test.describe.configure({ mode: 'serial' });

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

// Meridian: fixed product section list, stable `headline` key → text/section cases.
const cfg = AUDIENCES.find((a) => a.templateId === 'meridian')!;
// Hearth for the IMAGE case. Meridian emits no `[data-image-id]` at all — the
// blocks that tag one are hearth/surge/lex's hero+testimonial images (see
// ImageToolbar.tsx's own note), so a meridian-only image test can never do more
// than skip itself green.
const imageCfg = AUDIENCES.find((a) => a.templateId === 'hearth')!;

const SHELL = '[data-toolbar-chrome]';

/** Every `data-action` id currently rendered inside the one floating shell. */
async function actionIds(page: Page): Promise<string[]> {
  return page.locator(`${SHELL} [data-action]`).evaluateAll((els) =>
    els.map((e) => e.getAttribute('data-action') || '').sort(),
  );
}

/** Dismiss any open toolbar so each case starts from a clean selection. */
async function dismiss(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.locator(SHELL)).toHaveCount(0, { timeout: 10_000 });
}

test.describe('toolbar dispatch (phases 1-2: one shell, curated actions)', () => {
  let token: string;
  let imageToken: string;

  test.beforeAll(async ({ browser }) => {
    test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

    const page = await browser.newPage();
    await page.goto('/');
    await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
    const api = page.request;

    /** persona → /api/start → seed a real mock-mode draft; returns the token. */
    async function seed(audience: typeof cfg) {
      const personaRes = await api.post('/api/user/persona', { data: { persona: audience.persona } });
      expect(personaRes.ok(), `persona ${audience.persona}: ${personaRes.status()}`).toBeTruthy();

      const startRes = await api.get('/api/start');
      expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
      const { url } = await startRes.json();
      const t = new URL(url).pathname.split('/').filter(Boolean).pop()!;
      expect(t, `bad token from ${url}`).toBeTruthy();

      await seedDraft(api, t, audience);
      return t;
    }

    token = await seed(cfg);
    imageToken = await seed(imageCfg);
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

  test('text target: one shell, format actions, no Ask AI', async ({ page }) => {
    // Clicking a contenteditable enters text-edit mode → the `text` action set.
    await page.locator('[data-element-key="headline"]').first().click();

    await expect(page.locator(SHELL), 'expected exactly ONE floating shell').toHaveCount(1, {
      timeout: 15_000,
    });
    await expect(page.locator(SHELL)).toHaveAttribute('data-toolbar-type', 'text');

    const ids = await actionIds(page);
    // The Beta text set: B/I/U · align · size · colour · variations (+ Design ▾).
    expect(ids).toEqual(
      [
        'ai-variations',
        'align-center',
        'align-left',
        'align-right',
        'bold',
        'design-menu',
        'font-size',
        'italic',
        'text-color',
        'underline',
      ].sort(),
    );
    // Ask AI is phase 5, behind a human gate — it must not have leaked in.
    expect(ids).not.toContain('ask-ai');
  });

  test('section target: one shell with the section action set', async ({ page }) => {
    // Click the section shell itself (not an element inside it).
    await page.locator('[data-section-id]').first().click({ position: { x: 4, y: 4 } });

    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    const ids = await actionIds(page);

    // Structural actions are always present for a non-chrome section. `change-layout`
    // is conditional (eligibleVariantCount > 1) and `delete`/`duplicate`/move-* are
    // hidden on chrome sections — so assert the invariant subset, not equality.
    expect(ids).toContain('add-element');
    expect(ids).toContain('design-menu');
    expect(ids).not.toContain('ask-ai');
    // Background is deferred (D-1): the write has nowhere to land in served templates.
    expect(ids).not.toContain('background');
  });

  test('image target: reskin only — no Link action', async ({ page }) => {
    // Hearth, not the shared meridian token (see `imageCfg` above).
    await page.goto(`/edit/${imageToken}`);
    const image = page.locator('[data-image-id]').first();
    await expect(image, 'hearth draft rendered no [data-image-id] target').toBeVisible({
      timeout: 60_000,
    });
    await image.click();

    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    const ids = await actionIds(page);
    expect(ids).toEqual(
      ['delete-image', 'design-menu', 'edit-image', 'replace-image', 'stock-photos'].sort(),
    );
    // Image → Link is DEFERRED (ruling 5): no published-consumed image-link field
    // exists, so shipping the action would promise something publish drops.
    expect(ids).not.toContain('image-link');
  });

  // ── phase 2: Button/CTA ────────────────────────────────────────────────────
  // Meridian's hero CTA is a `MeridianEditable ... isButton` (EditorialPhotoHero
  // :114-125), i.e. single click SELECTS (element toolbar) and only a DOUBLE click
  // enters text editing — which is precisely why Button/CTA is the one element
  // family that reaches the `element` action set with a button context.
  test('button/CTA target: Beta action set with Link/Action disabled', async ({ page }) => {
    await page.locator('[data-element-key="cta_text"]').first().click();

    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator(SHELL)).toHaveAttribute('data-toolbar-type', 'element');

    const ids = await actionIds(page);
    // The Beta Button/CTA set: Edit Text · Link/Action · Button Settings ·
    // Regenerate · Delete (+ Design ▾). Equality, not a subset: every one of these
    // is unconditional for a flat `cta_text` key (hasTextContent ✓,
    // canConvertToForm ✓, no dot in the key ⇒ Delete ✓), so a missing OR a leaked
    // action fails. `link-action` is the phase-2 addition.
    expect(ids).toEqual(
      [
        'button-config',
        'delete',
        'design-menu',
        'edit-text',
        'link-action',
        'regenerate-copy',
      ].sort(),
    );
    expect(ids).not.toContain('ask-ai');
  });

  // phase 3 UPDATE: Link/Action is STILL disabled — deliberately, and not because
  // it is unfinished. The t4 LinkPicker shipped and replaced the popover at all 15
  // mounts, but a button's link lives in `elementMetadata[key].buttonConfig`
  // (a CtaButtonConfig), NOT the `Link{dest,source}` the picker emits, and there is
  // no inverse mapping. "Button Settings" is the real link editor for buttons, so
  // the tooltip now points there instead of promising a phase. See the phase-3 audit.
  test('button/CTA: Link/Action is disabled and points at the control that works', async ({
    page,
  }) => {
    await page.locator('[data-element-key="cta_text"]').first().click();
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });

    const link = page.locator(`${SHELL} [data-action="link-action"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toBeDisabled();
    await expect(link).toHaveAttribute('aria-disabled', 'true');
    // The tooltip must say WHY (the disabled convention phase 1 standardised) and
    // must NOT promise a future phase — that promise is what went stale.
    await expect(link).toHaveAttribute('title', /button settings/i);
    // The control it points at must actually be there, or the tooltip is a dead end.
    await expect(page.locator(`${SHELL} [data-action="button-config"]`)).toHaveCount(1);

    // Force-click must not open a picker or tear the shell down.
    await link.click({ force: true });
    await expect(page.locator(SHELL)).toHaveCount(1);
    await expect(page.locator('[data-testid="link-picker"]')).toHaveCount(0);
  });

  // ── phase 2: Footer ────────────────────────────────────────────────────────
  // Honest scope (plan ruling 2 + D-1): the footer gains NO new capability. What
  // is asserted is exactly what phase 2 claims — it dispatches into the ONE shell,
  // it is labelled "Footer" (not `Footer-a1b2c3d4`), and the chrome-section gating
  // that predates this track is intact.
  test('footer target: chrome-section set in the one shell, labelled "Footer"', async ({ page }) => {
    const footer = page.locator('[data-section-id^="footer"]').first();
    await expect(footer, 'meridian draft rendered no footer section').toBeVisible({
      timeout: 30_000,
    });
    // Top-left corner: section padding, so this lands on the section container
    // rather than any element inside it.
    await footer.click({ position: { x: 4, y: 4 } });

    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator(SHELL)).toHaveAttribute('data-toolbar-type', 'section');

    // The phase-2 deliverable: a human label. Pre-phase-2 this chip read
    // `Footer-<uuid8>`, so the exact-match assertion genuinely fails on a revert.
    await expect(page.locator(`${SHELL} [data-toolbar-label]`)).toContainText('Footer', {
      timeout: 10_000,
    });
    const labelText = await page.locator(`${SHELL} [data-toolbar-label]`).innerText();
    expect(labelText, 'section uuid leaked into the label chip').not.toMatch(/footer-[0-9a-f]{8}/i);

    const ids = await actionIds(page);
    // CHROME_HIDDEN_ACTIONS (SectionToolbar.tsx:18) — untouched by this phase, and
    // the thing most likely to be broken by a later "just add one action" edit.
    expect(ids).toContain('add-element');
    expect(ids).toContain('design-menu');
    for (const hidden of ['move-up', 'move-down', 'duplicate', 'delete']) {
      expect(ids, `${hidden} must stay hidden on the shared footer`).not.toContain(hidden);
    }
    // Ruling 2 / D-1: Footer links + Background are deferred to Final. If either
    // shows up in Beta it promises something the store cannot persist.
    expect(ids).not.toContain('manage-links');
    expect(ids).not.toContain('background');
  });

  test('Design ▾ renders disabled and inert', async ({ page }) => {
    await page.locator('[data-element-key="headline"]').first().click();
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });

    const design = page.locator(`${SHELL} [data-action="design-menu"]`);
    await expect(design, 'Design ▾ slot missing').toHaveCount(1);
    await expect(design).toHaveAttribute('aria-disabled', 'true');
    await expect(design).toBeDisabled();
    await expect(design).toHaveAttribute('title', /design system/i);

    // Clicking it must not open anything or tear the shell down.
    await design.click({ force: true });
    await expect(page.locator(SHELL)).toHaveCount(1);
  });

  // The #1 risk of hoisting the chrome into the shell. The toolbars' dropdown
  // panels are `absolute top-full left-0` SIBLINGS of each toolbar's inner div,
  // so wrapping the body in chrome puts them INSIDE the bordered box: an
  // `overflow: hidden` on the chrome would clip them out of existence, and a
  // `position: static` chrome would re-anchor `top-full` to the wrong box.
  // Neither failure mode throws — the panel just silently isn't there.
  test('dropdown panels are not clipped by the chrome box', async ({ page }) => {
    await page.locator('[data-element-key="headline"]').first().click();
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });

    await page.locator(`${SHELL} [data-action="font-size"]`).click();

    const panel = page.getByRole('button', { name: /Hero.*48px|48px/ }).first();
    await expect(panel, 'font-size panel never rendered').toBeVisible({ timeout: 10_000 });

    // HIT-TEST, not boundingBox(). `overflow: hidden` clips PAINT but leaves
    // layout geometry untouched, so boundingBox()/toBeVisible() both still pass
    // on a fully-clipped panel — verified by mutation (adding `overflow-hidden`
    // to the chrome left a boundingBox-based version of this test green). Only
    // elementFromPoint asks the question that matters: can the user actually
    // click this row?
    const hit = await panel.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { reachable: !!top && (el === top || el.contains(top) || top.contains(el)) };
    });
    expect(hit.reachable, 'font-size panel is painted but unreachable — clipped by the chrome box').toBe(true);

    // ...and it hangs BELOW the pill (a `position: static` chrome would re-anchor it).
    const chromeBox = await page.locator(SHELL).boundingBox();
    const panelBox = await panel.boundingBox();
    expect(panelBox!.y, 'panel is not below the toolbar').toBeGreaterThan(chromeBox!.y);
  });

  test('Esc dismisses the shell', async ({ page }) => {
    await page.locator('[data-element-key="headline"]').first().click();
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    await dismiss(page);
  });
});
