// src/lib/staticExport/assetBase.guard.test.ts
// app-subdomain phase 7 — asset-origin regression guard (decision D5).
//
// Invariant: published static HTML must ALWAYS load its platform assets
// (fonts + form handler + analytics beacon) from the APEX origin
// `https://lessgo.ai/assets/*`, forever — even after the app/dashboard moves to
// its own subdomain. The app-host var (NEXT_PUBLIC_DASHBOARD_URL) must NEVER
// leak into asset origins.
//
// This test renders a FORM-BEARING, analytics-enabled published page through the
// real exporter (generateStaticHTML → published renderer → renderToStaticMarkup)
// with NEXT_PUBLIC_DASHBOARD_URL stubbed to the app subdomain, and asserts all
// three apex asset URLs appear. That pins BOTH origin sources against a future
// env refactor:
//   • htmlGenerator's `assetBase = NEXT_PUBLIC_APP_URL || 'https://lessgo.ai'`
//     (fonts-self-hosted.css, form.v1.js, a.v2.js), and
//   • the hardcoded `https://lessgo.ai/assets/{form.v1.js,a.v2.js}` literals in
//     LandingPagePublishedRenderer's SSR-fallback <Script> tags.
//
// We also stub NEXT_PUBLIC_APP_URL to '' so assetBase deterministically falls
// back to the apex default regardless of the ambient test env — this pins the
// literal default and keeps the guard hermetic.

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
// htmlGenerator/renderPublishedExport are `import 'server-only'`; neutralize it
// so the exporter's real HTML producer runs under vitest (jsdom).
vi.mock('server-only', () => ({}));

import { generateStaticHTML } from './htmlGenerator';

const HERO_ID = 'hero-abc12345';

function buildFormBearingPage() {
  const content: Record<string, any> = {
    layout: { sections: [HERO_ID] },
    [HERO_ID]: {
      id: HERO_ID,
      type: 'hero',
      layout: 'leftCopyRightImage',
      elements: {
        headline: 'Apex asset origin guard',
        subheadline: 'Assets must load from lessgo.ai forever.',
        cta_text: 'Get started',
        form_id: 'form-1',
      },
      backgroundType: 'neutral',
    },
    // Presence of `content.forms` is what gates htmlGenerator's form.v1.js tag
    // (and the published renderer's hardcoded form.v1.js <Script>).
    forms: {
      'form-1': {
        id: 'form-1',
        fields: [{ id: 'email', type: 'email', label: 'Email', required: true }],
        submitButton: { text: 'Submit' },
      },
    },
  };
  return content;
}

async function render() {
  return (
    await generateStaticHTML({
      sections: [HERO_ID],
      content: buildFormBearingPage(),
      theme: {},
      publishedPageId: 'p-guard',
      pageOwnerId: 'u-guard',
      slug: 'apex-guard',
      title: 'Apex Guard',
      audienceType: 'product',
      templateId: 'meridian',
      paletteId: null,
      variantId: null,
      goal: null,
      // Emits the a.v2.js analytics beacon tag (apex origin).
      analyticsOptIn: true,
    })
  ).html;
}

describe('app-subdomain D5 — published assets always load from apex (lessgo.ai)', () => {
  beforeEach(() => {
    // The app/dashboard host var must NOT leak into asset origins.
    vi.stubEnv('NEXT_PUBLIC_DASHBOARD_URL', 'https://app.lessgo.ai');
    // Force assetBase to its apex default, hermetically, regardless of env.
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('references fonts, form handler, and analytics beacon from https://lessgo.ai/assets/*', async () => {
    const html = await render();

    // 1. Fonts stylesheet (htmlGenerator assetBase).
    expect(html).toContain('https://lessgo.ai/assets/fonts-self-hosted.css');
    // 2. Form handler (htmlGenerator assetBase + published-renderer literal).
    expect(html).toContain('https://lessgo.ai/assets/form.v1.js');
    // 3. Analytics beacon (htmlGenerator assetBase + published-renderer literal).
    expect(html).toContain('https://lessgo.ai/assets/a.v2.js');

    // The app-host var must never leak into any asset origin.
    expect(html).not.toContain('https://app.lessgo.ai/assets/');
  });
});
