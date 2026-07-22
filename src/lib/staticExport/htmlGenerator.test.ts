// src/lib/staticExport/htmlGenerator.test.ts
// Behaviors-asset gating on generateStaticHTML.
//
// atelier-skeleton-cutover phase 1: `atelier` now dispatches through the work-
// skeleton, so NEW atelier publishes get work.v1.js (via skeletonBackedTemplateIds)
// and NO LONGER emit slider.v1.js — the NEW-embed gate for the old cover slider was
// removed. slider.v1.js keeps building (immutable-asset contract for old blobs) but
// is never injected into a freshly generated page anymore.

import { vi, describe, it, expect } from 'vitest';
// htmlGenerator is `import 'server-only'`; neutralize so it runs under vitest.
vi.mock('server-only', () => ({}));

import { generateStaticHTML } from './htmlGenerator';

const SECTION_ID = 'hero-abc12345';

function buildPage() {
  return {
    layout: { sections: [SECTION_ID] },
    [SECTION_ID]: {
      id: SECTION_ID,
      type: 'hero',
      layout: 'centerStacked',
      elements: { headline: 'A studio that holds the room.' },
    },
  } as Record<string, any>;
}

async function render(
  templateId: string,
  audienceType: 'product' | 'service',
  styleTokens?: import('@/modules/skeletons/styleTokens').StyleTokens | null
) {
  const res = await generateStaticHTML({
    sections: [SECTION_ID],
    content: buildPage(),
    theme: {},
    publishedPageId: 'p',
    pageOwnerId: 'u',
    slug: 'gate',
    title: 'Gate',
    audienceType,
    templateId,
    paletteId: null,
    variantId: null,
    goal: null,
    styleTokens: styleTokens ?? null,
  });
  return res.html;
}

const SLIDER_TAG = '/assets/slider.v1.js';

describe('generateStaticHTML — slider.v1.js is NEVER injected into a new page', () => {
  // The NEW-embed gate was removed at atelier-skeleton-cutover phase 1. No freshly
  // generated page — including atelier — emits slider.v1.js anymore.
  it('does NOT inject slider.v1.js for an atelier page (now a skeleton page)', async () => {
    const html = await render('atelier', 'service');
    expect(html).not.toContain(SLIDER_TAG);
  });

  it('does NOT inject slider.v1.js for a meridian (product) page', async () => {
    const html = await render('meridian', 'product');
    expect(html).not.toContain(SLIDER_TAG);
  });

  it('does NOT inject slider.v1.js for a hearth (service) page', async () => {
    const html = await render('hearth', 'service');
    expect(html).not.toContain(SLIDER_TAG);
  });
});

// work.v1.js (hero slider + fixed header) is injected ONLY for skeleton-backed
// templateIds (skeletonBackedTemplateIds — atelier) and NEVER for classic templates.
const WORK_TAG = '/assets/work.v1.js';

describe('generateStaticHTML — work.v1.js skeleton gating', () => {
  it('injects work.v1.js for a skeleton-backed atelier page (and NOT slider.v1.js)', async () => {
    const html = await render('atelier', 'service');
    expect(html).toContain(WORK_TAG);
    expect(html).not.toContain(SLIDER_TAG);
  });

  it('does NOT inject work.v1.js for a meridian (product) page', async () => {
    const html = await render('meridian', 'product');
    expect(html).not.toContain(WORK_TAG);
  });

  it('does NOT inject work.v1.js for a hearth (service) page', async () => {
    const html = await render('hearth', 'service');
    expect(html).not.toContain(WORK_TAG);
  });
});

// AC-L123 (phase 6b): user style tokens (Project.themeValues.styleTokens) must
// render on a REAL static-export page, not just in the editor. This proves the
// generator→published-renderer→SSRTokens→serializeStyleTokens thread fires end to
// end (the `[data-sid]{--u-*}` CSS block reaches the static HTML), and that with
// NO styleTokens no such block appears (byte-neutral for non-styled pages).
describe('generateStaticHTML — styleTokens in static export (AC-L123)', () => {
  const STYLED = { [SECTION_ID]: { corners: 'soft' as const, background: 'dark' as const } };

  // The serialized CSS block `[data-sid="…"]{…}` (note the trailing `{`) is the
  // discriminator: skeleton block cores DO carry a `data-sid="…"` HTML attribute
  // and reference `var(--u-radius, …)` fallbacks in markup, but ONLY the
  // serializer emits the CSS-selector form `[data-sid="…"]{--u-…}`.
  const CSS_BLOCK = `[data-sid="${SECTION_ID}"]{`;

  it('emits the [data-sid]{--u-*} CSS block for a skeleton-backed atelier page', async () => {
    const html = await render('atelier', 'service', STYLED);
    // serializeStyleTokens output: `[data-sid="hero-abc12345"]{--u-bg:…;--u-fg:…;--u-radius:10px;}`
    expect(html).toContain(CSS_BLOCK);
    expect(html).toContain('--u-radius:10px;');
    expect(html).toContain('--u-bg:');
  });

  it('emits NO [data-sid]{…} CSS block when styleTokens is absent (byte-neutral)', async () => {
    const html = await render('atelier', 'service', null);
    expect(html).not.toContain(CSS_BLOCK);
    // No serialized declaration (block cores may still use var(--u-radius, …) fallbacks).
    expect(html).not.toContain('--u-radius:10px;');
  });

  it('ignores styleTokens for a classic (meridian) template — no --u-* CSS at all', async () => {
    const html = await render('meridian', 'product', STYLED);
    expect(html).not.toContain(CSS_BLOCK);
    expect(html).not.toContain('--u-radius');
  });
});

// section-background phase 1 — the PUBLISHED-side proof of BOTH delivery channels
// (D2): the `[data-sid]{--u-bg;--u-fg}` CSS pair AND the wrapper `data-surface`
// attribute, resolved from the SAME stored value. Also pins the no-bleed guarantee
// (a second, unstyled section keeps the skin default) and the `id`+`data-surface`
// attribute PAIR that `analyticsGenerator.js:126` reads (`[data-surface][id]`).
//
// This case owns a LOCAL two-section fixture — the shared buildPage()/render()
// helpers above are used by every other suite in this file and are not mutated.
// String-level assertions are the published equivalent of a computed-style check:
// jsdom cannot resolve the `var()` cascade (the live computed-style check is the
// phase-2 e2e).
describe('generateStaticHTML — per-section background override (both channels)', () => {
  const HERO = 'hero-aaa11111';
  const ABOUT = 'about-bbb22222';

  async function renderTwoSections(
    styleTokens?: import('@/modules/skeletons/styleTokens').StyleTokens | null,
  ) {
    const content: Record<string, any> = {
      layout: { sections: [HERO, ABOUT] },
      [HERO]: {
        id: HERO,
        type: 'hero',
        layout: 'workherocenter',
        elements: { headline: 'A studio that holds the room.' },
      },
      [ABOUT]: {
        id: ABOUT,
        type: 'about',
        layout: 'workabout',
        elements: { about_heading: 'About the studio.' },
      },
    };
    const res = await generateStaticHTML({
      sections: [HERO, ABOUT],
      content,
      theme: {},
      publishedPageId: 'p',
      pageOwnerId: 'u',
      slug: 'gate',
      title: 'Gate',
      audienceType: 'service',
      templateId: 'atelier',
      paletteId: null,
      variantId: null,
      goal: null,
      styleTokens: styleTokens ?? null,
    });
    return res.html;
  }

  // The wrapper's `id` is the in-page ANCHOR (buildSectionAnchorMap: first section
  // of a type keeps the bare type), not the sectionId — `data-sid` lives on the
  // block core root inside.
  const HERO_ANCHOR = 'hero';
  const ABOUT_ANCHOR = 'about';

  /** The wrapper div for an anchor — matched on the `id`+`data-surface` pair. */
  function wrapperFor(html: string, anchor: string): string {
    const m = html.match(new RegExp(`<div[^>]*id="${anchor}"[^>]*>`));
    return m?.[0] ?? '';
  }

  it('CHANNEL 1 (CSS): emits the [data-sid] block with BOTH --u-bg and --u-fg', async () => {
    const html = await renderTwoSections({ [ABOUT]: { background: 'dark' } });
    const block = html.match(new RegExp(`\\[data-sid="${ABOUT}"\\]\\{[^}]*\\}`))?.[0] ?? '';
    expect(block).toContain('--u-bg:var(--wk-dark);');
    expect(block).toContain('--u-fg:var(--wk-on-dark);');
    // The untouched sibling gets no block at all.
    expect(html).not.toContain(`[data-sid="${HERO}"]{`);
  });

  it('CHANNEL 2 (wrapper): data-surface carries the override, id intact, no bleed', async () => {
    const html = await renderTwoSections({ [ABOUT]: { background: 'dark' } });

    const about = wrapperFor(html, ABOUT_ANCHOR);
    expect(about).toContain('data-surface="dark"');
    // analyticsGenerator.js reads `[data-surface][id]` — BOTH attrs must survive.
    expect(about).toContain(`id="${ABOUT_ANCHOR}"`);

    // No-bleed: the sibling wrapper is byte-identical to the no-override baseline.
    // (Compared against a baseline rather than "not dark" — the atelier skin's own
    // hero default IS dark, so a value assertion would be vacuous here.)
    const baseline = await renderTwoSections(null);
    expect(wrapperFor(html, HERO_ANCHOR)).toBe(wrapperFor(baseline, HERO_ANCHOR));
    expect(wrapperFor(html, HERO_ANCHOR)).toContain('data-surface=');
  });

  it('absent override → the wrapper keeps the skin default (byte-neutral)', async () => {
    const baseline = await renderTwoSections(null);
    const withDefault = await renderTwoSections({ [ABOUT]: { background: 'default' } });
    expect(wrapperFor(withDefault, ABOUT_ANCHOR)).toBe(wrapperFor(baseline, ABOUT_ANCHOR));
    expect(withDefault).not.toContain(`[data-sid="${ABOUT}"]{`);
  });
});

// publish-trust M4: the <head> is a raw template string, so every user-influenced value
// interpolated into it is a stored-XSS sink on live customer domains (*.lessgo.site).
// These are the end-to-end guards: hostile input must be inert, benign input unchanged.
describe('generateStaticHTML — head XSS hardening (M4)', () => {
  const PAYLOAD = '"><script>alert(1)</script>';

  function head(html: string) {
    return html.slice(0, html.indexOf('</head>'));
  }

  async function renderHead(overrides: Record<string, any> = {}) {
    const res = await generateStaticHTML({
      sections: [SECTION_ID],
      content: buildPage(),
      theme: {},
      publishedPageId: 'p1',
      pageOwnerId: 'u',
      slug: 'gate',
      title: 'Gate',
      audienceType: 'service',
      templateId: 'hearth',
      paletteId: null,
      variantId: null,
      goal: null,
      analyticsOptIn: true,
      ...overrides,
    });
    return res.html;
  }

  it('escapes an attribute-breakout payload in slug/canonicalDomain (canonical + og:url + twitter:url)', async () => {
    const html = await renderHead({ slug: `gate${PAYLOAD}`, canonicalDomain: `evil.com${PAYLOAD}` });
    const h = head(html);
    expect(h).not.toContain('<script>alert(1)</script>');
    expect(h).not.toContain(PAYLOAD);
    // The payload survives only in inert, escaped form inside the attribute value.
    expect(h).toContain('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('drops a javascript: previewImage to the auto /api/og URL (no live scheme in og:image)', async () => {
    const html = await renderHead({ previewImage: 'javascript:alert(1)' });
    const h = head(html);
    expect(h).not.toContain('javascript:');
    expect(h).toContain('<meta property="og:image" content="https://lessgo.ai/api/og/gate">');
    expect(h).toContain('<meta name="twitter:image" content="https://lessgo.ai/api/og/gate">');
  });

  it('escapes a breakout payload in an og:image override rather than emitting raw markup', async () => {
    const html = await renderHead({ previewImage: `https://cdn/x.png${PAYLOAD}` });
    const h = head(html);
    expect(h).not.toContain('<script>alert(1)</script>');
    expect(h).toContain('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes slug/publishedPageId in the analytics beacon data attributes', async () => {
    const html = await renderHead({ slug: `gate${PAYLOAD}`, publishedPageId: `p1${PAYLOAD}` });
    expect(html).not.toContain(`data-slug="gate${PAYLOAD}"`);
    expect(html).toContain('data-page-id="p1&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"');
    expect(html).toContain('data-slug="gate&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"');
  });

  it('omits a hreflang alternate whose href fails the scheme gate, keeps the safe ones', async () => {
    const html = await renderHead({
      locale: 'en',
      localeConfig: { locales: ['en', 'nl'], defaultLocale: 'en' } as any,
      localeAlternates: [
        { hreflang: 'en', href: 'https://gate.lessgo.site/' },
        { hreflang: 'nl', href: 'javascript:alert(1)' },
      ],
    });
    const h = head(html);
    expect(h).toContain('<link rel="alternate" hreflang="en" href="https://gate.lessgo.site/">');
    expect(h).not.toContain('hreflang="nl"');
    expect(h).not.toContain('javascript:');
  });

  it('leaves a benign head unchanged — & escaped exactly once, never double-escaped', async () => {
    const html = await renderHead({ previewImage: 'https://cdn/x.png?a=1&b=2' });
    const h = head(html);
    expect(h).toContain('<meta property="og:image" content="https://cdn/x.png?a=1&amp;b=2">');
    expect(h).toContain('<link rel="canonical" href="https://gate.lessgo.site">');
    expect(h).toContain('<meta property="og:url" content="https://gate.lessgo.site">');
    expect(h).not.toContain('&amp;amp;');
  });
});

// ---------------------------------------------------------------------------
// language-settings phase 5 — switcher.v2 emission + switcherStyle
// ---------------------------------------------------------------------------
describe('generateStaticHTML — locale switcher emission (v2 + switcherStyle)', () => {
  const ALTERNATES = [
    { hreflang: 'en', href: 'https://gate.lessgo.site/' },
    { hreflang: 'nl', href: 'https://gate.lessgo.site/nl' },
    { hreflang: 'x-default', href: 'https://gate.lessgo.site/' },
  ];

  async function renderDoc(overrides: Record<string, any> = {}) {
    const res = await generateStaticHTML({
      sections: [SECTION_ID],
      content: buildPage(),
      theme: {},
      publishedPageId: 'p1',
      pageOwnerId: 'u',
      slug: 'gate',
      title: 'Gate',
      audienceType: 'service',
      templateId: 'hearth',
      paletteId: null,
      variantId: null,
      goal: null,
      ...overrides,
    });
    return res.html;
  }

  it('multi-locale doc loads switcher.v2.js (NEVER v1 — old blobs keep the frozen v1)', async () => {
    const html = await renderDoc({
      locale: 'en',
      localeConfig: { locales: ['en', 'nl'], defaultLocale: 'en' } as any,
      localeAlternates: ALTERNATES,
    });
    expect(html).toContain('/assets/switcher.v2.js');
    expect(html).not.toContain('/assets/switcher.v1.js');
  });

  it('stamps slug + style into the inline config so the runtime can derive its basePath', async () => {
    const html = await renderDoc({
      locale: 'nl',
      localeConfig: { locales: ['en', 'nl'], defaultLocale: 'en' } as any,
      localeAlternates: ALTERNATES,
    });
    expect(html).toContain(
      'window.__lessgoLocales={"locales":["en","nl"],"defaultLocale":"en","current":"nl","slug":"gate","style":"dropdown"}'
    );
  });

  it("switcherStyle 'none' omits the config AND the script (no pill, no geo redirect) but keeps hreflang", async () => {
    const html = await renderDoc({
      locale: 'en',
      localeConfig: {
        locales: ['en', 'nl'],
        defaultLocale: 'en',
        switcherStyle: 'none',
      } as any,
      localeAlternates: ALTERNATES,
    });
    expect(html).not.toContain('switcher.v2.js');
    expect(html).not.toContain('__lessgoLocales');
    // SEO is independent of widget style.
    expect(html).toContain('<link rel="alternate" hreflang="nl" href="https://gate.lessgo.site/nl">');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://gate.lessgo.site/">');
  });

  it("switcherStyle 'dropdown' emits exactly the same bytes as an absent style", async () => {
    const absent = await renderDoc({
      locale: 'en',
      localeConfig: { locales: ['en', 'nl'], defaultLocale: 'en' } as any,
      localeAlternates: ALTERNATES,
    });
    const explicit = await renderDoc({
      locale: 'en',
      localeConfig: {
        locales: ['en', 'nl'],
        defaultLocale: 'en',
        switcherStyle: 'dropdown',
      } as any,
      localeAlternates: ALTERNATES,
    });
    expect(explicit).toBe(absent);
  });

  it('single-locale + no-config output is byte-identical and carries no switcher at all', async () => {
    const baseline = await renderDoc({});
    // A declared single-locale config (ruling 10) is NOT multi-locale ⇒ no switcher,
    // and with an 'en' default the bytes are unchanged.
    const single = await renderDoc({
      locale: 'en',
      localeConfig: { locales: ['en'], defaultLocale: 'en', switcherStyle: 'none' } as any,
    });
    expect(single).toBe(baseline);
    expect(baseline).not.toContain('switcher.v2.js');
    expect(baseline).not.toContain('__lessgoLocales');
    expect(baseline).toContain('<html lang="en">');
  });

  it('a declared single-locale nl config sets <html lang="nl"> without emitting a switcher', async () => {
    const html = await renderDoc({
      locale: 'nl',
      localeConfig: { locales: ['nl'], defaultLocale: 'nl' } as any,
    });
    expect(html).toContain('<html lang="nl">');
    expect(html).not.toContain('switcher.v2.js');
    expect(html).not.toContain('hreflang');
  });
});
