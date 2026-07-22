import { test, expect, type Page } from '@playwright/test';

// ============================================================================
// section-background phase 2 (slice 1b) — THE DECISION GATE.
//
// Proves the Background toolbar control actually REPAINTS a section's band, on
// both delivery channels, in all three renderer call sites that resolve a
// surface, and that the choice survives autosave.
//
// ⚠️ WHY COMPUTED STYLE, NOT `data-surface`. The wrapper attribute lands whether
// or not a single pixel changes — the block roots SELF-PAINT
// `background:var(--u-bg, <default>)`, so a wrapper-only override is painted
// over. Every assertion below therefore reads `getComputedStyle` on the BLOCK
// ROOT (`[data-sid]`) for BOTH `backgroundColor` and `color`, against a captured
// baseline. An attribute-presence check here would be inert: it would stay green
// with the `[data-sid]{--u-*}` CSS channel completely severed (e.g. if
// EditLayout stopped passing `styleTokens` to the ThemeInjector, the exact gap
// phase 1 closed).
//
// ⚠️ SEEDING (plan note N1). `POST /api/saveDraft` never writes
// `Project.audienceType` and `loadDraft` defaults it to `'product'`. Seeding with
// saveDraft ALONE would give ('product','atelier') → `usesTemplateModule` false →
// the editor takes the LEGACY 47-block path: no `data-surface` wrapper, no
// ThemeInjector, no `[data-sid]{--u-*}` CSS, no work blocks at all. The spec
// would pass having tested nothing. Hence the standard editor-seed prelude:
// persona → GET /api/start (this is where audienceType is captured) → saveDraft
// on the returned token.
//
// ⚠️ REGISTRATION: `playwright.config.ts` `testMatch` is an explicit ALLOWLIST;
// this file is listed under the `authed` project. An unregistered spec matches
// no project and the suite goes green having never run it.
// ============================================================================

test.describe.configure({ mode: 'serial' });

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

const SHELL = '[data-toolbar-chrome]';
const BG_ACTION = `${SHELL} [data-action="background"]`;
const BG_PANEL = '[data-testid="section-bg-panel"]';

// Deterministic ids so the assertions can target one exact block root.
const HEADER = 'header-e2ebg001';
const HERO = 'hero-e2ebg002';
const ABOUT = 'about-e2ebg003';
// N2: the atelier GALLERY's section type is `work`, NOT `gallery`
// (`resolveWorkBlock.ts` registers it under `work`). It is the centrepiece body
// section, and an allowlist copied from the plan's matrix would have shipped it
// greyed — hence the explicit "gallery is LIVE" case below.
const GALLERY = 'work-e2ebg004';
const FOOTER = 'footer-e2ebg005';

/** A work-skeleton page: chrome + hero + two body sections + footer. */
function seedFinalContent() {
  const section = (id: string, type: string, layout: string, elements: Record<string, any>) => ({
    id,
    type,
    layout,
    elements,
    aiMetadata: {
      aiGenerated: true, isCustomized: false, lastGenerated: 0,
      aiGeneratedElements: Object.keys(elements), excludedElements: [],
    },
  });

  return {
    layout: {
      sections: [HEADER, HERO, ABOUT, GALLERY, FOOTER],
      sectionLayouts: {
        [HEADER]: 'workheader',
        [HERO]: 'workheroslider',
        [ABOUT]: 'workabout',
        [GALLERY]: 'workgallerygrid',
        [FOOTER]: 'workfooter',
      },
      theme: {},
      globalSettings: {},
    },
    content: {
      [HEADER]: section(HEADER, 'header', 'workheader', {
        logo_text: 'Kundius',
        nav_items: [{ id: 'n1', label: 'Work', href: '#work' }],
      }),
      [HERO]: section(HERO, 'hero', 'workheroslider', {
        role_line: 'Photographer',
        name: 'Kundius',
        quote: 'Pictures that keep their nerve.',
      }),
      [ABOUT]: section(ABOUT, 'about', 'workabout', {
        eyebrow: 'About',
        heading: 'The person behind the work',
        bio: 'Fifteen years behind a camera, most of it in other people’s living rooms.',
      }),
      [GALLERY]: section(GALLERY, 'work', 'workgallerygrid', {
        eyebrow: 'Selected work',
        heading: 'The work',
        groups: [
          { id: 'g1', name: 'Weddings', cover_image: '', href: '/works/weddings' },
        ],
      }),
      [FOOTER]: section(FOOTER, 'footer', 'workfooter', {
        eyebrow: 'Get in touch',
        heading: 'Let’s make yours.',
        // Explicit `note` so `.wk-footer__note` — one of the on-dark-pinned
        // children the N8 fix targets — is genuinely in the DOM.
        note: 'Booking a handful of stories each year.',
        copyright: '© Kundius',
      }),
    },
    meta: { title: 'Kundius (e2e bg)', slug: '', version: 1 },
    onboardingData: {},
  };
}

/** Computed background + foreground of a BLOCK ROOT (`[data-sid]`). */
async function rootColors(page: Page, sid: string) {
  const res = await page.evaluate((s) => {
    const el = document.querySelector(`[data-sid="${s}"]`);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, color: cs.color };
  }, sid);
  expect(res, `no block root [data-sid="${sid}"] in the DOM`).not.toBeNull();
  return res!;
}

/** Computed `color` of a descendant of a block root. */
async function childColor(page: Page, sid: string, selector: string) {
  const res = await page.evaluate(
    ({ s, sel }) => {
      const el = document.querySelector(`[data-sid="${s}"] ${sel}`);
      return el ? getComputedStyle(el).color : null;
    },
    { s: sid, sel: selector },
  );
  expect(res, `no "${selector}" inside [data-sid="${sid}"]`).not.toBeNull();
  return res!;
}

/**
 * Resolve a skin custom property to the same rgb() form `getComputedStyle`
 * returns, via a throwaway probe element — so the contrast assertion compares
 * like with like instead of comparing a colour to itself (the tautology trap).
 */
async function resolveVarAsColor(page: Page, varName: string) {
  return page.evaluate((n) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${n})`;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, varName);
}

/** Click a section wrapper (not an element inside it) → the section toolbar. */
async function selectSection(page: Page, sectionId: string, chipLabel: string) {
  // Dismiss any open toolbar AND wait for it to actually go: the floating shell
  // is `position:fixed` and can sit over the next section's top-left corner, so
  // clicking before it unmounts silently hits the old toolbar instead.
  await page.keyboard.press('Escape');
  await expect(page.locator(SHELL)).toHaveCount(0, { timeout: 10_000 });
  const wrapper = page.locator(`[data-section-root="${sectionId}"]`);
  await wrapper.scrollIntoViewIfNeeded();
  await wrapper.click({ position: { x: 4, y: 4 } });
  await expect(page.locator(SHELL), 'no floating toolbar after selecting the section').toHaveCount(
    1,
    { timeout: 15_000 },
  );
  await expect(page.locator(SHELL)).toHaveAttribute('data-toolbar-type', 'section');
  // The label chip proves we selected the section we MEANT to (a mis-click that
  // grabbed a neighbour would otherwise silently move the assertions elsewhere).
  await expect(page.locator(`${SHELL} [data-toolbar-label]`)).toContainText(chipLabel);
}

/** Open the Background dropdown, pick a chip, and wait for the autosave commit. */
async function pickSurface(page: Page, chipTestId: string) {
  await page.locator(BG_ACTION).click();
  await expect(page.locator(BG_PANEL)).toBeVisible({ timeout: 10_000 });

  const saved = page.waitForResponse(
    (r) =>
      r.url().includes('/api/saveDraft') &&
      r.request().method() === 'POST' &&
      (r.request().postData() || '').includes('"styleTokens"'),
    { timeout: 60_000 },
  );
  await page.locator(`[data-testid="section-bg-chip-${chipTestId}"]`).click();
  const res = await saved;
  expect(res.status(), 'saveDraft did not accept the styleTokens write').toBe(200);
}

test.describe('section background (work skeleton): Colour on body sections', () => {
  let token: string;

  test.beforeAll(async ({ browser }) => {
    test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

    const page = await browser.newPage();
    await page.goto('/');
    await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
    const api = page.request;

    // N1 prelude — persona → /api/start is the ONLY place `audienceType` is
    // captured. Without it the editor renders the legacy path and this whole
    // spec tests nothing.
    const personaRes = await api.post('/api/user/persona', { data: { persona: 'agency' } });
    expect(personaRes.ok(), `persona agency: ${personaRes.status()}`).toBeTruthy();

    const startRes = await api.get('/api/start');
    expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
    const { url } = await startRes.json();
    token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
    expect(token, `bad token from ${url}`).toBeTruthy();

    const seedRes = await api.post('/api/saveDraft', {
      data: {
        tokenId: token,
        title: 'Kundius (e2e bg)',
        templateId: 'atelier',
        finalContent: seedFinalContent(),
      },
    });
    expect(seedRes.ok(), `saveDraft seed -> ${seedRes.status()}`).toBeTruthy();
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH_ENV, 'authed env not configured');
    // SaveStateChip registers a `beforeunload` dirty-guard. Playwright AUTO-DISMISSES
    // dialogs when no handler is attached, and dismissing a beforeunload prompt
    // CANCELS the navigation — which surfaces as `page.goto: net::ERR_ABORTED` on
    // the preview hop below (observed, not theoretical). Accepting it is the
    // equivalent of a user clicking "Leave"; the assertions after each hop still
    // prove the value round-tripped through the SERVER, so nothing is papered over.
    page.on('dialog', (d) => {
      d.accept().catch(() => {});
    });
    await page.goto(`/edit/${token}`);
    // The work skeleton actually rendered (NOT the legacy fallback) — this is the
    // N1 tripwire. `data-sid` is emitted by work block cores only.
    await expect(
      page.locator(`[data-sid="${ABOUT}"]`),
      'work-skeleton block root never rendered — the editor took the legacy path (see N1)',
    ).toBeVisible({ timeout: 60_000 });
  });

  test('Ink on a body section repaints bg AND fg, does not bleed, survives preview + reload', async ({
    page,
  }) => {
    const aboutBefore = await rootColors(page, ABOUT);
    const galleryBefore = await rootColors(page, GALLERY);

    await selectSection(page, ABOUT, 'About');

    // N2 tripwire, part 1: a body section's Background action must be LIVE.
    await expect(page.locator(BG_ACTION)).not.toHaveAttribute('aria-disabled', 'true');

    await pickSurface(page, 'dark');

    // ── CHANNEL 1 (the one that actually paints): the block root's own
    //    background/colour changed. `--u-bg`/`--u-fg` reach it via the
    //    `[data-sid]` block the ThemeInjector inlines.
    const aboutAfter = await rootColors(page, ABOUT);
    expect(aboutAfter.bg, 'section background did not change').not.toBe(aboutBefore.bg);
    expect(aboutAfter.color, 'section foreground did not change').not.toBe(aboutBefore.color);
    // Contrast pair, not just "something moved": Ink resolves to the skin's own
    // dark/on-dark pair.
    expect(aboutAfter.bg).toBe(await resolveVarAsColorBg(page, '--wk-dark'));
    expect(aboutAfter.color).toBe(await resolveVarAsColor(page, '--wk-on-dark'));

    // ── CHANNEL 2 (the wrapper attribute): carries the same resolved value.
    const wrapper = page.locator(`[data-section-root="${ABOUT}"]`);
    await expect(wrapper).toHaveAttribute('data-surface', 'dark');
    await expect(wrapper).toHaveAttribute('data-section-id', ABOUT);

    // ── NO BLEED at paint level (not merely at attribute level): the sibling
    //    body section is untouched. The id-vs-type key-space trap would show up
    //    here as the gallery moving with the about section.
    const galleryAfter = await rootColors(page, GALLERY);
    expect(galleryAfter.bg, 'the override bled onto a sibling section').toBe(galleryBefore.bg);
    expect(galleryAfter.color, 'the override bled onto a sibling section').toBe(
      galleryBefore.color,
    );

    // ── PREVIEW HOP — the THIRD renderer call site (LandingPageRenderer's
    //    usesTemplate branch). Without this it would ship unexercised.
    // The `about:blank` hop is load-bearing: navigating STRAIGHT from the live
    // editor to another route reliably yields `net::ERR_ABORTED` (the editor page
    // aborts the in-flight navigation on unload). Tearing the editor down first
    // makes the hop deterministic. The `/edit/{token}/preview` sub-route is the
    // chromeless render that goes through LandingPageRenderer.
    await page.goto('about:blank');
    await page.goto(`/edit/${token}/preview`);
    await expect(page.locator(`[data-sid="${ABOUT}"]`)).toBeVisible({ timeout: 60_000 });
    const aboutPreview = await rootColors(page, ABOUT);
    expect(aboutPreview.bg, 'the surface did not survive the preview renderer').toBe(aboutAfter.bg);
    expect(aboutPreview.color, 'the surface did not survive the preview renderer').toBe(
      aboutAfter.color,
    );

    // ── ROUND-TRIP: reload the editor; the override came back from the server.
    await page.goto('about:blank');
    await page.goto(`/edit/${token}`);
    await expect(page.locator(`[data-sid="${ABOUT}"]`)).toBeVisible({ timeout: 60_000 });
    const aboutReloaded = await rootColors(page, ABOUT);
    expect(aboutReloaded.bg, 'the override did not persist across a reload').toBe(aboutAfter.bg);
    expect(aboutReloaded.color, 'the override did not persist across a reload').toBe(
      aboutAfter.color,
    );
  });

  test('Paper on the DARK-default footer keeps every child readable (N8 contrast)', async ({
    page,
  }) => {
    // The footer is the hard case: its root is dark by default AND its children
    // hard-code ON-DARK values (`.wk-footer__note` → var(--wk-on-dark-soft),
    // `.wk-footer__top` → 1px solid var(--wk-line-dark)). Fixing only the root
    // pair leaves near-white secondary text on a light band — spec AC: "No
    // surface choice can produce an unreadable text/background pairing."
    const noteBefore = await childColor(page, FOOTER, '.wk-footer__note');
    const borderBefore = await footerTopBorderColor(page, FOOTER);

    await selectSection(page, FOOTER, 'Footer');
    await pickSurface(page, 'paper');

    const footerAfter = await rootColors(page, FOOTER);
    // ROOT: the D2 pair, asserted against the RESOLVED token — not "it changed".
    expect(footerAfter.bg).toBe(await resolveVarAsColorBg(page, '--wk-paper'));
    expect(footerAfter.color).toBe(await resolveVarAsColor(page, '--wk-ink'));

    // CHILDREN (N8): the secondary text followed the band instead of staying
    // near-white, and it landed on the ink-soft token, not on some arbitrary value.
    const noteAfter = await childColor(page, FOOTER, '.wk-footer__note');
    expect(noteAfter, 'footer secondary text stayed on-dark over a light band').not.toBe(
      noteBefore,
    );
    expect(noteAfter).toBe(await resolveVarAsColor(page, '--wk-ink-soft'));

    // HAIRLINE (N8): the `--wk-line-dark` border re-points to the light hairline.
    // BOTH halves matter. The equals-`--wk-line` half alone would pass vacuously on
    // any skin whose `line` and `lineDark` resolve to the same colour (nothing in the
    // token contract forbids that) — the changed-from-baseline half is what proves the
    // re-point actually fired, exactly as `noteBefore`/`noteAfter` does above.
    const borderAfter = await footerTopBorderColor(page, FOOTER);
    expect(borderBefore, 'no .wk-footer__top in the footer').not.toBeNull();
    expect(borderAfter, 'the footer hairline stayed on-dark over a light band').not.toBe(
      borderBefore,
    );
    expect(borderAfter).toBe(await resolveVarAsColor(page, '--wk-line'));
  });

  test('gate: gallery is LIVE, hero is greyed with its own why-tooltip', async ({
    page,
  }) => {
    // N2: the gallery's section type is `work`, not `gallery`. An allowlist
    // transcribed from the plan's matrix would ship the centrepiece body section
    // greyed — this is the assertion that catches it.
    await selectSection(page, GALLERY, 'Work');
    await expect(
      page.locator(BG_ACTION),
      'the atelier gallery (section type `work`) must NOT be greyed',
    ).not.toHaveAttribute('aria-disabled', 'true');
    await page.locator(BG_ACTION).click();
    await expect(page.locator(BG_PANEL)).toBeVisible({ timeout: 10_000 });
    // Accent is GONE (founder ruling G2 at the slice-1 gate supersedes R3's greyed
    // placeholder): live chips are exactly Auto · Paper · Subtle · Ink, and no
    // Accent chip ships in either state. UI-only — `accent` is still a valid stored
    // value, which is why this asserts on the chip, not on the type.
    await expect(page.locator('[data-testid="section-bg-chip-accent-disabled"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="section-bg-chip-accent"]')).toHaveCount(0);
    // Auto reads as a MODE, not a colour (ruling G1): no solid swatch, and the panel
    // says which surface it resolves to here.
    const auto = page.locator('[data-testid="section-bg-chip-auto"]');
    await expect(auto).toBeVisible();
    expect(await auto.getAttribute('data-auto-surface')).toBe('paper'); // gallery default
    await expect(page.locator('[data-testid="section-bg-auto-hint"]')).toContainText('Paper');

    // HERO — greyed until phase 3 (its band is covered by the media + scrim).
    await selectSection(page, HERO, 'Hero');
    const heroBg = page.locator(BG_ACTION);
    await expect(heroBg).toHaveAttribute('aria-disabled', 'true');
    expect(await heroBg.getAttribute('title')).toMatch(/image mode/i);
    // Inert: forcing the click opens nothing.
    await heroBg.click({ force: true });
    await expect(page.locator(BG_PANEL)).toHaveCount(0);

    // HEADER — excluded entirely (D5: `--wk-header-bg` is declared on `:root` and
    // cannot be retro-bound per-section; the header's surface belongs to the
    // header toolbar).
    //
    // NOT ASSERTED HERE, deliberately: on the WORK skeleton, clicking the header
    // section wrapper dispatches NO toolbar at all today. The wrapper is present
    // and focusable (`role="button"`, `aria-selected`), but `[data-toolbar-chrome]`
    // never mounts — verified against this seed, and consistent with the header
    // toolbar being toolbar-wave-2's deliverable. There is therefore no Background
    // button to inspect on an atelier header, so a header case here would either
    // be vacuous or would be testing wave-2's missing host rather than this gate.
    // The header entry in `BACKGROUND_DENIED_SECTION_TYPES` is the SAME one-line
    // lookup the hero case above exercises. (`toolbar-dispatch.spec.ts` covers the
    // header toolbar on meridian, where it does dispatch.)
  });
});

/** Computed `border-bottom-color` of `.wk-footer__top` inside a section wrapper
 *  (`null` when the element is absent). Used for the before/after hairline pair. */
async function footerTopBorderColor(page: Page, sectionId: string) {
  return page.evaluate((s) => {
    const el = document.querySelector(`[data-sid="${s}"] .wk-footer__top`);
    return el ? getComputedStyle(el).borderBottomColor : null;
  }, sectionId);
}

/** Same probe as `resolveVarAsColor`, for BACKGROUND colours. */
async function resolveVarAsColorBg(page: Page, varName: string) {
  return page.evaluate((n) => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${n})`;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return c;
  }, varName);
}
