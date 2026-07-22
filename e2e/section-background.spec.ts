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

  // ⚠️ Layout names are PascalCase — the SAME casing real drafts store. The element
  // SCHEMA (`audience/work/elementSchema.ts`) is keyed PascalCase, so a lowercase
  // layout makes `getSchemaDefaults` return null and every block renders with EMPTY
  // content (placeholders only). The colour assertions would still pass, but any
  // assertion about seeded CONTENT — e.g. the hero's slides being on screen — would
  // silently test nothing. `resolveWorkBlock` lowercases before its own lookup, so
  // the component dispatch is unaffected either way.
  return {
    layout: {
      sections: [HEADER, HERO, ABOUT, GALLERY, FOOTER],
      sectionLayouts: {
        [HEADER]: 'WorkHeader',
        [HERO]: 'WorkHeroSlider',
        [ABOUT]: 'WorkAbout',
        [GALLERY]: 'WorkGalleryGrid',
        [FOOTER]: 'WorkFooter',
      },
      theme: {},
      globalSettings: {},
    },
    content: {
      [HEADER]: section(HEADER, 'header', 'WorkHeader', {
        logo_text: 'Kundius',
        nav_items: [{ id: 'n1', label: 'Work', href: '#work' }],
      }),
      [HERO]: section(HERO, 'hero', 'WorkHeroSlider', {
        role_line: 'Photographer',
        name: 'Kundius',
        quote: 'Pictures that keep their nerve.',
        // phase 3: TWO slides so the hero is genuinely in the slideshow state on
        // load — that is what makes the chip read `Slideshow · 2` and what Color
        // mode has to suppress. Same-origin assets on purpose: an unreachable
        // remote host would stall `page.goto`'s load event.
        slides: [
          { id: 'hs1', image: '/hero-placeholder.jpg' },
          { id: 'hs2', image: '/design-editor.jpg' },
        ],
      }),
      [ABOUT]: section(ABOUT, 'about', 'WorkAbout', {
        eyebrow: 'About',
        heading: 'The person behind the work',
        bio: 'Fifteen years behind a camera, most of it in other people’s living rooms.',
      }),
      [GALLERY]: section(GALLERY, 'work', 'WorkGalleryGrid', {
        eyebrow: 'Selected work',
        heading: 'The work',
        groups: [
          { id: 'g1', name: 'Weddings', cover_image: '', href: '/works/weddings' },
        ],
      }),
      [FOOTER]: section(FOOTER, 'footer', 'WorkFooter', {
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

  test('gate: gallery is LIVE, hero is LIVE since phase 3, header dispatches no toolbar', async ({
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

    // HERO — LIVE since phase 3 (Color | Image | Video-greyed). Its own cases are
    // in the phase-3 describe below.
    await selectSection(page, HERO, 'Hero');
    await expect(
      page.locator(BG_ACTION),
      'the hero must be LIVE now that image mode shipped',
    ).not.toHaveAttribute('aria-disabled', 'true');

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

  // ══════════════════════════════════════════════════════════════════════════
  // phase 3 (slice 2) — the HERO: Color | Image | Video(greyed) + `bgMode`.
  // ══════════════════════════════════════════════════════════════════════════

  test('hero: Color mode repaints the band AND removes the media (not just hides it)', async ({
    page,
  }) => {
    // The hero seed is a 2-slide slideshow, so the chip names the state without a
    // menu entry (spec §A — slideshow is emergent from count, not a 4th type).
    await selectSection(page, HERO, 'Hero');
    await expect(page.locator(BG_ACTION)).toContainText('Slideshow · 2');

    const heroBefore = await rootColors(page, HERO);
    // Media is genuinely on screen first — otherwise "no img after" is vacuous.
    expect(await heroImgCount(page)).toBeGreaterThan(0);

    await page.locator(BG_ACTION).click();
    await expect(page.locator(BG_PANEL)).toBeVisible({ timeout: 10_000 });

    // Video ships greyed WITH a why (founder ruling 9) — `WorkHeroVideo` is a
    // declared-but-unbuilt slot; there is nothing behind it.
    const video = page.locator('[data-testid="section-bg-tab-video"]');
    await expect(video).toHaveAttribute('aria-disabled', 'true');
    expect(await video.getAttribute('title')).toMatch(/video/i);
    // Image is LIVE on the slider variant.
    await expect(page.locator('[data-testid="section-bg-tab-image"]')).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );

    // → Color. The tab write is a `bgMode` write; the chip pick is a `background`
    // write. Both land through the same autosaved styleTokens channel.
    await waitForStyleTokensSave(page, async () => {
      await page.locator('[data-testid="section-bg-tab-color"]').click();
    });
    // PAPER, not Ink: the atelier skin's hero default ALREADY resolves to `dark`,
    // so picking Ink here would be indistinguishable from the baseline and the
    // "band repainted" assertion would be vacuous. (Chip clicked directly rather
    // than via `pickSurface`, whose first act is to TOGGLE the panel open — it is
    // already open here.)
    await waitForStyleTokensSave(page, async () => {
      await page.locator('[data-testid="section-bg-chip-paper"]').click();
    });

    const heroAfter = await rootColors(page, HERO);
    expect(heroAfter.bg, 'the hero band did not repaint').not.toBe(heroBefore.bg);
    expect(heroAfter.bg).toBe(await resolveVarAsColorBg(page, '--wk-paper'));
    expect(heroAfter.color).toBe(await resolveVarAsColor(page, '--wk-ink'));

    // THE point of `bgMode` (and why it is a prop, not a CSS var): the images are
    // GONE FROM THE MARKUP, so the browser never downloads them. A `display:none`
    // rule would still fetch them and this assertion would fail.
    expect(await heroImgCount(page), 'hero media survived Color mode').toBe(0);
    await expect(page.locator(`[data-sid="${HERO}"] .wk-hero__scrim`)).toHaveCount(0);
    // The copy is untouched.
    await expect(page.locator(`[data-sid="${HERO}"] .wk-hero__name`)).toContainText('Kundius');
    // Color mode is not a slideshow, so the chip stops claiming one.
    await expect(page.locator(BG_ACTION)).not.toContainText('Slideshow');

    // ── LOSSLESS ROUND TRIP (spec AC): back to Image and the slides return, with
    //    no confirm dialog and nothing cleared.
    // (The panel stays open across chip/tab clicks — re-clicking the toolbar
    // button here would TOGGLE it shut.)
    await expect(page.locator(BG_PANEL)).toBeVisible();
    await waitForStyleTokensSave(page, async () => {
      await page.locator('[data-testid="section-bg-tab-image"]').click();
    });
    expect(await heroImgCount(page), 'Color → Image was lossy').toBe(2);
    await expect(page.locator(BG_ACTION)).toContainText('Slideshow · 2');
    // The colour choice survived the mode switch (the two axes are independent).
    await expect(page.locator(`[data-section-root="${HERO}"]`)).toHaveAttribute(
      'data-surface',
      'paper',
    );

    // ── PERSISTS: reload, and the hero is still in image mode with both slides.
    await page.goto('about:blank');
    await page.goto(`/edit/${token}`);
    await expect(page.locator(`[data-sid="${HERO}"]`)).toBeVisible({ timeout: 60_000 });
    expect(await heroImgCount(page)).toBe(2);
  });

  test('hero: the Image tab exposes an always-visible Add slot with the slideshow hint', async ({
    page,
  }) => {
    await selectSection(page, HERO, 'Hero');
    await page.locator(BG_ACTION).click();
    await expect(page.locator(BG_PANEL)).toBeVisible({ timeout: 10_000 });

    // Image is the default tab for a hero variant that renders media (absent
    // `bgMode` → derive from data = today's behaviour; nothing is written).
    await expect(page.locator('[data-testid="section-bg-tab-image"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    // Standing discoverability rule: the Add slot is ALWAYS visible, never
    // hover-revealed — a control that appears later is a capability the user never
    // learns they have.
    // phase 4: at ≥2 the ADD control is the filmstrip's trailing "+" card — the
    // single-image `section-bg-add-image` slot belongs to state A only (one add
    // control, never two). It is still ALWAYS visible, which is what the rule asks.
    const add = page.locator('[data-testid="hero-slide-add"]');
    await expect(add).toBeVisible();
    await expect(page.locator('[data-testid="section-bg-add-image"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="section-bg-slides-count"]')).toContainText('2 images');
    // No autoplay / interval / transition / crop control anywhere (spec Scope OUT).
    // Read BEFORE opening the picker: the modal takes focus and closes the docked
    // panel behind it, so this must not run after the dialog hop.
    const panelText = (await page.locator(BG_PANEL).innerText()).toLowerCase();
    for (const forbidden of ['autoplay', 'interval', 'transition', 'crop', 'focal']) {
      expect(panelText, `"${forbidden}" must not appear in the panel`).not.toContain(forbidden);
    }

    // It opens the shared media picker — the promote path's entry point. (The pick
    // itself is not driven here: the picker's Library grid depends on this
    // project's uploaded assets and its Stock tab on a live Pexels key, neither of
    // which a hermetic run can rely on. The promote MUTATION is proven
    // deterministically in `heroSlides.test.ts` instead.)
    await add.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // phase 4 (slice 3) — the FILMSTRIP TRAY. Drag feel is the manual check; what
  // is automated here is that a REAL drag repaints the canvas in the new order,
  // and that a thumbnail click previews that slide.
  // ══════════════════════════════════════════════════════════════════════════

  test('hero: the tray reorders the live slides and a thumbnail previews one', async ({ page }) => {
    await selectSection(page, HERO, 'Hero');
    await page.locator(BG_ACTION).click();
    await expect(page.locator(BG_PANEL)).toBeVisible({ timeout: 10_000 });

    const tray = page.locator('[data-testid="hero-slides-tray"]');
    await expect(tray, 'the 2+ state must grow the same panel into the filmstrip').toBeVisible();
    const cards = page.locator('[data-testid="hero-slide"]');
    await expect(cards).toHaveCount(2);

    // Numbered 01/02 — the number IS the play position.
    await expect(cards.nth(0)).toHaveAttribute('aria-label', 'Slide 01');
    await expect(cards.nth(1)).toHaveAttribute('aria-label', 'Slide 02');

    const idBefore = await cards.nth(0).getAttribute('data-slide-id');
    const slideImgs = page.locator(`[data-sid="${HERO}"] .wk-hero__slide img`);
    const firstSrcBefore = await slideImgs.nth(0).getAttribute('src');
    const secondSrcBefore = await slideImgs.nth(1).getAttribute('src');
    expect(firstSrcBefore).not.toBe(secondSrcBefore);

    // A REAL pointer drag: the PointerSensor has a 6px activation distance, so the
    // intermediate moves are load-bearing — a single jump would never start a drag.
    const handle = page.locator('[data-testid="hero-slide-drag"]').nth(1);
    const from = (await handle.boundingBox())!;
    const target = (await cards.nth(0).boundingBox())!;
    const saved = page.waitForResponse(
      (r) => r.url().includes('/api/saveDraft') && r.request().method() === 'POST',
      { timeout: 60_000 },
    );
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 - 10, from.y + from.height / 2, { steps: 3 });
    await page.mouse.move(target.x + 4, target.y + target.height / 2, { steps: 8 });
    await page.mouse.up();
    expect((await saved).status(), 'the reorder never reached the server').toBe(200);

    // The strip re-ordered…
    await expect(cards.nth(1)).toHaveAttribute('data-slide-id', idBefore!);
    // …and so did the CANVAS: play order IS document order (what `work.v1.js`
    // iterates), so the first slide in the DOM is now the one that was second.
    await expect(slideImgs.nth(0)).toHaveAttribute('src', secondSrcBefore!);

    // ── PREVIEW: clicking a thumbnail shows that slide and pauses autoplay, so
    //    it STAYS shown (a running interval would flip it back within 5s).
    await page.locator('[data-testid="hero-slide-preview"]').nth(1).click();
    const domSlides = page.locator(`[data-sid="${HERO}"] .wk-hero__slide`);
    await expect(domSlides.nth(1)).toHaveClass(/is-active/);
    await page.waitForTimeout(6_000);
    await expect(domSlides.nth(1), 'autoplay was not paused by the preview').toHaveClass(
      /is-active/,
    );
  });
});

/** How many hero media images are in the DOM right now. Presence, not visibility —
 *  Color mode must REMOVE them (a hidden `<img>` is still downloaded). */
async function heroImgCount(page: Page) {
  return page.locator(`[data-sid="${HERO}"] img`).count();
}

/** Run a panel gesture and wait for the styleTokens autosave commit it triggers. */
async function waitForStyleTokensSave(page: Page, gesture: () => Promise<void>) {
  const saved = page.waitForResponse(
    (r) =>
      r.url().includes('/api/saveDraft') &&
      r.request().method() === 'POST' &&
      (r.request().postData() || '').includes('"styleTokens"'),
    { timeout: 60_000 },
  );
  await gesture();
  const res = await saved;
  expect(res.status(), 'saveDraft did not accept the bgMode write').toBe(200);
}

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
