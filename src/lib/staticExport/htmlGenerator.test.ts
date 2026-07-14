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

async function render(templateId: string, audienceType: 'product' | 'service') {
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
