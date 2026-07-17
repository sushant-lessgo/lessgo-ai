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
//   6. phase 3.5 (founder ruling 9): every DEFERRED Beta action ships as a greyed
//      placeholder — present + disabled + tooltipped + inert — rather than omitted,
//      so the t2 anatomy reads visually complete and the roadmap is visible instead
//      of looking finished-but-thin. Several assertions here flipped from
//      `not.toContain(x)` to `toContain(x)` at that ruling; each is marked. NOTE the
//      capability verdicts did NOT change — nothing was built behind these.
//      Form + Menu are OUT ENTIRELY (not greyed): neither dispatches a toolbar, so
//      there is nowhere to put one. The next spec builds those hosts.
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

/**
 * phase 3.5 (founder ruling 9) — the greyed-placeholder contract, in one place.
 *
 * Deferred Beta actions ship PRESENT but disabled rather than omitted, so that the
 * t2 anatomy reads complete and the roadmap is visible. All four properties below
 * are load-bearing:
 *   - present + aria-disabled → it reads as "coming", not missing;
 *   - a NON-EMPTY title → the mandatory "why". A dead button with no explanation is
 *     the naayom-C2 bug report this convention exists to prevent, so emptiness fails;
 *   - INERT on force-click → nothing behind it. The onClick guard is what makes this
 *     true; removing it is the mutation this assertion is designed to catch.
 *
 * phase 3.5: `toBeDisabled()` is deliberately NOT used — it asserts the NATIVE
 * disabled attribute, which these buttons intentionally no longer carry (a natively
 * disabled button suppresses the `title` tooltip and the mousedown that retains
 * contenteditable focus; see ToolbarButton.tsx). `aria-disabled` alone is only a
 * CLAIM, so it is never asserted on its own — the force-click inertness check below
 * is the assertion that actually has teeth.
 */
async function expectGreyedPlaceholder(page: Page, action: string, whyPattern: RegExp) {
  const btn = page.locator(`${SHELL} [data-action="${action}"]`);
  await expect(btn, `placeholder "${action}" is missing from the toolbar`).toHaveCount(1);
  await expect(btn, `placeholder "${action}" is not aria-disabled`).toHaveAttribute(
    'aria-disabled',
    'true',
  );

  const title = await btn.getAttribute('title');
  expect(title, `placeholder "${action}" has no tooltip — a dead button with no "why" reads as a bug`)
    .toBeTruthy();
  expect(title!.trim().length, `placeholder "${action}" tooltip is empty`).toBeGreaterThan(0);
  expect(title, `placeholder "${action}" tooltip must say WHY it is off`).toMatch(whyPattern);

  // Inert: force past the disabled state and assert nothing happened — the shell
  // survives, no picker/modal/panel opened.
  await btn.click({ force: true });
  await expect(page.locator(SHELL), `clicking "${action}" tore the shell down`).toHaveCount(1);
  await expect(
    page.locator('[data-testid="link-picker"]'),
    `"${action}" opened a link picker — it is supposed to have NOTHING behind it`,
  ).toHaveCount(0);
  await expect(
    page.locator('[role="dialog"]'),
    `"${action}" opened a dialog — it is supposed to have NOTHING behind it`,
  ).toHaveCount(0);
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
    // The Beta text set: B/I/U · align · size · colour · Link · variations (+ Design ▾).
    // `link` is phase 3.5's greyed placeholder (ruling 9) — present, never enabled.
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
        'link',
        'text-color',
        'underline',
      ].sort(),
    );
    // Ask AI is phase 5, behind a human gate — it must not have leaked in.
    expect(ids).not.toContain('ask-ai');
  });

  test('text: Link is a greyed placeholder (no text link field exists)', async ({ page }) => {
    await page.locator('[data-element-key="headline"]').first().click();
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    await expectGreyedPlaceholder(page, 'link', /schema|link field/i);
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
    // phase 3.5 REVERSAL (ruling 9): Background is still deferred as a CAPABILITY
    // (D-1 — the write has nowhere to land in served templates), but it now SHIPS as
    // a greyed placeholder instead of being omitted. This assertion was
    // `not.toContain('background')` through phase 3.
    expect(ids).toContain('background');
    // `manage-links` is FOOTER-only — it must not leak onto body sections.
    expect(ids, 'manage-links leaked out of the footer').not.toContain('manage-links');
    // phase 4: same gate, same risk.
    expect(ids, 'manage-social leaked out of the footer').not.toContain('manage-social');
    expect(ids, 'social-orientation leaked out of the footer').not.toContain('social-orientation');

    await expectGreyedPlaceholder(page, 'background', /design system/i);
  });

  test('image target: reskin + greyed Link placeholder', async ({ page }) => {
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
      [
        'delete-image',
        'design-menu',
        'edit-image',
        'image-link',
        'replace-image',
        'stock-photos',
      ].sort(),
    );
    // phase 3.5 REVERSAL (ruling 9): Image → Link is still DEFERRED as a CAPABILITY
    // (ruling 5 — no published-consumed image-link field exists), but it now SHIPS
    // greyed instead of omitted. This assertion was `not.toContain('image-link')`
    // through phase 3. The tooltip is what stops it promising something publish drops.
    await expectGreyedPlaceholder(page, 'image-link', /link field/i);
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
    // The Beta Button/CTA set: Edit Text · Link/Action · Style · Button Settings ·
    // Regenerate · Delete (+ Design ▾). Equality, not a subset: every one of these
    // is unconditional for a flat `cta_text` key (hasTextContent ✓,
    // canConvertToForm ✓, no dot in the key ⇒ Delete ✓), so a missing OR a leaked
    // action fails. `link-action` is the phase-2 addition; `style` is phase 3.5's.
    expect(ids).toEqual(
      [
        'button-config',
        'delete',
        'design-menu',
        'edit-text',
        'link-action',
        'regenerate-copy',
        'style',
      ].sort(),
    );
    expect(ids).not.toContain('ask-ai');
  });

  // phase 3.5 (ruling 9): "Style" ships as a SEPARATE greyed button. It is NOT a
  // relabel of `button-config` — that rename was correctly refused in phase 2
  // because the panel it opens has ZERO style controls, so the label would lie.
  // Both must therefore exist, distinctly.
  test('button/CTA: Style is a greyed placeholder, distinct from Button Settings', async ({
    page,
  }) => {
    await page.locator('[data-element-key="cta_text"]').first().click();
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });

    await expectGreyedPlaceholder(page, 'style', /design system/i);

    // Button Settings must still be present AND still enabled — proof that `style`
    // was ADDED beside it rather than laundered out of it.
    const settings = page.locator(`${SHELL} [data-action="button-config"]`);
    await expect(settings).toHaveCount(1);
    await expect(settings).toBeEnabled();
    await expect(settings, 'Button Settings was relabelled — ruling 9 forbids it').toContainText(
      'Button Settings',
    );
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
    // aria-disabled, not native disabled — see expectGreyedPlaceholder's note.
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
    // phase 3.5 REVERSAL (ruling 9): Footer links (ruling 2) + Background (D-1) are
    // still deferred as CAPABILITIES, but both now ship as greyed placeholders —
    // toolbarPlan's Footer Beta column is exactly `manage links · background`, so the
    // footer's anatomy is now visually complete. Both assertions were
    // `not.toContain(...)` through phase 3.
    expect(ids).toContain('manage-links');
    expect(ids).toContain('background');
    // phase 4: the footer additionally hosts the SOCIAL pair. `manage-social` is the
    // one REAL new entry point in this slice (see e2e/manage-items.spec.ts for its
    // behaviour); `social-orientation` is a greyed placeholder (ruling 9 / D-2).
    // They live on the footer because social icons are NOT spine-selectable —
    // `ToolbarType` has no 'social' member and no `data-element-key` is emitted for a
    // socialMediaConfig item, so there is no element toolbar to host them.
    expect(ids).toContain('manage-social');
    expect(ids).toContain('social-orientation');

    // CRITICAL: this must not have been achieved by widening CHROME_HIDDEN_ACTIONS
    // or by dropping the chrome gate — re-assert the hidden set AFTER the additions.
    for (const hidden of ['move-up', 'move-down', 'duplicate', 'delete']) {
      expect(ids, `${hidden} leaked back onto the footer`).not.toContain(hidden);
    }

    await expectGreyedPlaceholder(page, 'manage-links', /store|coming/i);
    await expectGreyedPlaceholder(page, 'background', /design system/i);
    await expectGreyedPlaceholder(page, 'social-orientation', /coming|stored/i);

    // ...and `manage-social` must NOT be greyed — it is the one action here with
    // something behind it. Asserting the placeholders alone would let a regression
    // that greys out the real action pass unnoticed.
    const social = page.locator(`${SHELL} [data-action="manage-social"]`);
    await expect(social).toHaveCount(1);
    await expect(social, 'Manage social must be live, not a placeholder').not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  // The header is the OTHER chrome section, and it is the leak this phase most
  // plausibly introduces: `isChromeId` is true for BOTH header and footer, so gating
  // `manage-links` on it (instead of a footer-specific check) would silently put a
  // "Manage links" button on the header — whose Beta column is Menu, deferred
  // ENTIRELY per ruling 9 (there is nowhere to grey it; the next spec builds the host).
  test('header target: no manage-links leak, chrome gating intact', async ({ page }) => {
    const header = page.locator('[data-section-id^="header"]').first();
    await expect(header, 'meridian draft rendered no header section').toBeVisible({
      timeout: 30_000,
    });
    await header.click({ position: { x: 4, y: 4 } });

    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });
    const ids = await actionIds(page);

    expect(ids, 'manage-links is FOOTER-only — it leaked onto the header').not.toContain(
      'manage-links',
    );
    // phase 4: the social pair is footer-only for the same reason (FOOTER_ONLY_ACTIONS
    // is gated by `isFooterId`, NOT `isChromeId` — the latter is true for the header
    // too, whose Beta column is Menu, deferred entirely per ruling 9).
    expect(ids, 'manage-social is FOOTER-only — it leaked onto the header').not.toContain(
      'manage-social',
    );
    expect(ids, 'social-orientation is FOOTER-only — it leaked onto the header').not.toContain(
      'social-orientation',
    );
    // Background is a whole-Section placeholder, so the header legitimately has it.
    expect(ids).toContain('background');
    for (const hidden of ['move-up', 'move-down', 'duplicate', 'delete']) {
      expect(ids, `${hidden} leaked onto the shared header`).not.toContain(hidden);
    }
  });

  test('Design ▾ renders disabled and inert', async ({ page }) => {
    await page.locator('[data-element-key="headline"]').first().click();
    await expect(page.locator(SHELL)).toHaveCount(1, { timeout: 15_000 });

    const design = page.locator(`${SHELL} [data-action="design-menu"]`);
    await expect(design, 'Design ▾ slot missing').toHaveCount(1);
    await expect(design).toHaveAttribute('aria-disabled', 'true');
    await expect(design).toHaveAttribute('title', /design system/i);

    // MECHANISM, not coordinates. Design ▾ lives in the SHELL's trailing slot —
    // OUTSIDE TextToolbarMVP's body, which is the thing that preventDefaults its
    // own mousedown. So until phase 3.5 the shell's chrome had no such handler and
    // pressing Design ▾ genuinely blurred the contenteditable: selection collapsed,
    // the anchor changed, and the toolbar MOVED mid-gesture — the trailing click
    // then landed wherever the pill used to be. This test only ever passed because
    // that stray click happened to land back on the disabled button (whose click
    // Chromium suppresses). Widening the pill by one slot moved it onto <main> and
    // floating-ui's outsidePress tore the shell down. Assert the invariant that was
    // silently untrue, so the luck can't come back:
    // phase 3.5 RULING: the fix is a `mousedown`+`preventDefault` on the BUTTON
    // (ToolbarButton.tsx), which requires the button NOT be natively disabled —
    // Chromium dispatches no pointer events on a disabled control, so a
    // preventDefault there is dead code. A chrome-level handler was tried and
    // rejected: it also killed focus into the LinkPicker's <Input>.
    const editableBefore = await page.evaluate(
      () => document.activeElement?.closest('[contenteditable="true"]')?.tagName ?? null,
    );
    expect(editableBefore, 'precondition: expected a focused contenteditable').toBeTruthy();

    // Trace the WHOLE gesture, not just the endpoints. Native focus transfer happens
    // AFTER mousedown dispatch unless prevented, so `mousedown` alone can't tell the
    // two worlds apart — mouseup/click are where a lost preventDefault shows up.
    await page.evaluate(() => {
      (window as any).__focusTrace = [];
      const rec = (phase: string) => {
        const active = document.activeElement;
        const editable = active?.closest('[contenteditable="true"]') ?? null;
        (window as any).__focusTrace.push({
          phase,
          active: editable ? editable.tagName : active?.tagName ?? 'NONE',
        });
      };
      for (const p of ['mousedown', 'mouseup', 'click']) {
        document.addEventListener(p, () => rec(p), true);
      }
    });

    await design.click({ force: true });

    const trace = await page.evaluate(() => (window as any).__focusTrace);
    // eslint-disable-next-line no-console
    console.log('[focus-trace] Design ▾ press:', JSON.stringify(trace));
    expect(trace.length, 'no pointer events reached the document').toBeGreaterThan(0);
    for (const entry of trace) {
      expect(
        entry.active,
        `focus left the contenteditable at "${entry.phase}" (saw ${entry.active}) — ToolbarButton is missing its disabled mousedown preventDefault`,
      ).toBe(editableBefore);
    }

    const editableAfter = await page.evaluate(
      () => document.activeElement?.closest('[contenteditable="true"]')?.tagName ?? null,
    );
    expect(
      editableAfter,
      'pressing Design ▾ blurred the contenteditable — ToolbarButton lost its mousedown preventDefault',
    ).toBe(editableBefore);

    // ...and it must not open anything or tear the shell down.
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
