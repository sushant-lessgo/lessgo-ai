// src/lib/staticExport/htmlGenerator.test.ts
// Phase 10 (atelier-template) — behaviors-asset gating on generateStaticHTML.
// The Atelier hero cover slider is animated by public/assets/slider.v1.js, which
// must be injected ONLY on atelier pages (templateId === 'atelier') and NEVER on
// other templates. This guards the gating flag + <script> tag wiring.

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

describe('generateStaticHTML — atelier slider.v1.js gating', () => {
  it('injects slider.v1.js for an atelier page', async () => {
    const html = await render('atelier', 'service');
    expect(html).toContain(SLIDER_TAG);
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

// Work skeleton (phase 5): work.v1.js (hero slider + fixed header) is injected ONLY
// for skeleton-backed templateIds (skeletonBackedTemplateIds, e.g. atelier2) and
// NEVER for classic templates — including the OLD atelier module, which keeps its
// own slider.v1.js and must not gain work.v1.js.
const WORK_TAG = '/assets/work.v1.js';

describe('generateStaticHTML — work.v1.js skeleton gating', () => {
  it('injects work.v1.js for a skeleton-backed atelier2 page', async () => {
    const html = await render('atelier2', 'service');
    expect(html).toContain(WORK_TAG);
  });

  it('does NOT inject work.v1.js for a meridian (product) page', async () => {
    const html = await render('meridian', 'product');
    expect(html).not.toContain(WORK_TAG);
  });

  it('does NOT inject work.v1.js for a hearth (service) page', async () => {
    const html = await render('hearth', 'service');
    expect(html).not.toContain(WORK_TAG);
  });

  it('does NOT inject work.v1.js for the OLD atelier page', async () => {
    const html = await render('atelier', 'service');
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

  it('emits the [data-sid]{--u-*} CSS block for a skeleton-backed atelier2 page', async () => {
    const html = await render('atelier2', 'service', STYLED);
    // serializeStyleTokens output: `[data-sid="hero-abc12345"]{--u-bg:…;--u-fg:…;--u-radius:10px;}`
    expect(html).toContain(CSS_BLOCK);
    expect(html).toContain('--u-radius:10px;');
    expect(html).toContain('--u-bg:');
  });

  it('emits NO [data-sid]{…} CSS block when styleTokens is absent (byte-neutral)', async () => {
    const html = await render('atelier2', 'service', null);
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
