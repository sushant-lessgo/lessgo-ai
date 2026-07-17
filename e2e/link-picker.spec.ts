import { test, expect, type Page } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// toolbar-standard-beta phase 3 — the t4 LinkPicker, end-to-end in a real editor.
//
// WHAT THIS PINS: the picker mounts, opens, and its emitted `Link` actually lands
// in the edit-side DOM as the right href. That is the integration half of the
// contract; the payload half (dest + source:'manual'|'derived') is pinned by the
// vitest parity test (`src/components/editor/LinkPicker.test.tsx`), whose constants
// were validated DIFFERENTIALLY against the old LinkTargetPopover before deletion.
//
// ⚠️ DEVIATION FROM THE PLAN — read this before "fixing" the entry point.
// The plan said: "open picker from the BUTTON TOOLBAR, choose a section anchor +
// an external URL". That is NOT possible this phase: the Button/CTA `link-action`
// could not be enabled (its published link contract is `elementMetadata[key]
// .buttonConfig`, a `CtaButtonConfig` — NOT the `Link{dest,source}` the picker
// emits). See the phase-3 audit's BLOCKER. So this spec drives the picker from a
// REAL migrated mount instead — the meridian nav header, one of the 15 sites the
// popover was swapped out of. That is genuine coverage of the thing phase 3
// actually shipped, not a proxy for it.
//
// ⚠️ Registration: `playwright.config.ts` testMatch is an explicit ALLOWLIST. This
// spec is registered in the `authed` project — without that it silently runs zero
// tests (the trap that cost phase 1 a review loop).
test.describe.configure({ mode: 'serial' });

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

// Meridian: its nav header renders `nav_items` with a LinkPicker per item.
const cfg = AUDIENCES.find((a) => a.templateId === 'meridian')!;

const TRIGGER = '[aria-label="Set link target"]';
const PANEL = '[data-testid="link-picker"]';

/** Open the first nav-item link picker and return its panel locator. */
async function openPicker(page: Page) {
  const trigger = page.locator(TRIGGER).first();
  await expect(trigger, 'no LinkPicker trigger rendered in the editor').toBeVisible({
    timeout: 15_000,
  });
  await trigger.click();
  const panel = page.locator(PANEL);
  await expect(panel, 'LinkPicker panel did not open').toBeVisible({ timeout: 10_000 });
  return panel;
}

test.describe('t4 LinkPicker (phase 3)', () => {
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
    ).toBeVisible({ timeout: 30_000 });
  });

  test('the t4 picker opens with the segmented type control (and NO new-tab switch)', async ({
    page,
  }) => {
    const panel = await openPicker(page);

    // t4 chrome.
    await expect(panel).toContainText('Where should this go?');
    await expect(panel).toContainText('Destination');

    // Segmented types. The derived tab is labelled from the options actually
    // passed: "Link" when legal/social are present, else "Page". A freshly seeded
    // single-page project has no privacy page and no social profiles, so meridian's
    // nav yields page options only ⇒ "Page". (The "Link" branch is covered by the
    // vitest parity test, which passes legal/social explicitly.)
    // Exact-equality: a leaked or missing tab fails.
    const tabs = await panel.locator('[role="radio"]').allTextContents();
    expect(tabs.map((t) => t.trim())).toEqual(['Section', 'Page', 'Web']);

    // Ruling 1: NO new-tab switch — `Link` has no newTab field; it is derived at
    // render by externalLinkProps. If someone adds one, this fails loudly.
    await expect(panel).not.toContainText(/new tab/i);
  });

  // NOTE ON THE ASSERTION SHAPE: in EDIT mode meridian renders a nav item as a
  // <span> + inline editor, NOT an <a href> (MeridianNavHeader.tsx:133-165 — the
  // <a> is the non-edit branch). So "assert the rendered edit-side anchor" (the
  // plan's wording) is not observable for nav items. Instead we prove the write
  // for real, the way edit-persistence.spec does: assert the emitted Link reaches
  // the SERVER (a saveDraft POST whose body carries our href) and SURVIVES A
  // RELOAD (the picker re-reads it from persisted state via its string|Link
  // dual-read). A reload is what makes this non-vacuous — the picker's own
  // `urlDraft`/`mode` are local state that would otherwise echo our own input back.

  /** Arm a saveDraft listener that positively identifies OUR edit by its body. */
  function armSave(page: Page, needle: string) {
    return page.waitForResponse(
      (r) => r.url().includes('/api/saveDraft') && (r.request().postData() || '').includes(needle),
      { timeout: 30_000 },
    );
  }

  test('choosing a section anchor persists the emitted Link to the server and survives reload', async ({
    page,
  }) => {
    const panel = await openPicker(page);
    const select = panel.locator('select');
    await expect(select).toBeVisible();

    // A real anchor offered by buildSectionLinkOptions.
    const value = await select.locator('option:not([disabled])').first().getAttribute('value');
    expect(value, 'no section options offered').toBeTruthy();
    expect(value!.startsWith('#'), `section option "${value}" is not an anchor`).toBeTruthy();

    // The emitted Link is {dest:{kind:'section',anchor}, source:'manual'} — the
    // anchor (sans '#') is what lands in the saved JSON.
    const anchor = value!.slice(1);
    const savePromise = armSave(page, `"anchor":"${anchor}"`);
    await select.selectOption(value!);
    await page.keyboard.press('Escape');
    const saveRes = await savePromise;
    expect(saveRes.status(), 'saveDraft did not return 200').toBe(200);

    // Round-trip: reload remounts the picker, which dual-reads the persisted Link.
    await page.reload();
    const reopened = await openPicker(page);
    await expect(reopened.locator('select')).toHaveValue(value!, { timeout: 10_000 });
  });

  test('a custom external URL persists to the server and survives reload', async ({ page }) => {
    const panel = await openPicker(page);
    await panel.locator('[role="radio"]', { hasText: 'Web' }).click();
    const input = panel.locator('[aria-label="Custom URL"]');
    await expect(input).toBeVisible();

    const url = 'https://cal.com/lessgo-e2e';
    const savePromise = armSave(page, url);
    await input.fill(url);
    await page.keyboard.press('Escape');
    const saveRes = await savePromise;
    expect(saveRes.status(), 'saveDraft did not return 200').toBe(200);

    await page.reload();
    const reopened = await openPicker(page);
    // The picker opens on the URL mode because the persisted href is external.
    await expect(reopened.locator('[aria-label="Custom URL"]')).toHaveValue(url, {
      timeout: 10_000,
    });
  });
});
