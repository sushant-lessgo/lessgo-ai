// src/lib/staticExport/__tests__/i18nStaticExport.test.ts
// i18n-phase-1 Phase 5 — per-locale static export head/script emission.
//
// Exercises the PUBLISHED side at the generateStaticHTML layer (the same producer
// renderPublishedExport drives per locale):
//   • multi-locale: <html lang> per doc, self-canonical, the FULL reciprocal
//     hreflang set + x-default (mutually consistent across the en/nl docs), and
//     the switcher script + inline __lessgoLocales config;
//   • resolve-then-render: a non-default doc rendered from resolveLocaleElements
//     output actually shows the overlay copy;
//   • single-locale: output byte-identical whether the (single-locale) localeConfig
//     is passed or not — no hreflang/canonical/switcher/lang change.

import { vi, describe, it, expect } from 'vitest';
// htmlGenerator is `import 'server-only'`; neutralize so it runs under vitest.
vi.mock('server-only', () => ({}));

import { generateStaticHTML } from '../htmlGenerator';
import { resolveCanonicalURL } from '../canonicalUrl';
import { resolveLocaleElements } from '@/lib/i18n/localeContent';

const SECTION_ID = 'hero-abc12345';
const SLUG = 'myslug';

const EN_HEADLINE = 'WELCOMEHOMEUNIQUE build fast';
const NL_HEADLINE = 'WELKOMTHUISUNIQUE bouw snel';

function baseContent(): Record<string, any> {
  return {
    layout: { sections: [SECTION_ID], theme: {} },
    [SECTION_ID]: {
      id: SECTION_ID,
      type: 'hero',
      layout: 'leftCopyRightImage',
      elements: {
        headline: EN_HEADLINE,
        subheadline: 'A base subheadline',
      },
      backgroundType: 'primary',
    },
  };
}

// Mirror renderPublishedExport.buildAlternates for the root page ('/'). The
// generator is fed exactly this list, so asserting the HTML echoes it proves the
// self-canonical + reciprocal set stay consistent.
function alternatesForRoot(locales: string[], defaultLocale: string) {
  const pathFor = (loc: string) => (loc === defaultLocale ? '/' : `/${loc}`);
  const hrefFor = (loc: string) =>
    resolveCanonicalURL({ slug: SLUG, canonicalPath: pathFor(loc) });
  return [
    ...locales.map((loc) => ({ hreflang: loc, href: hrefFor(loc) })),
    { hreflang: 'x-default', href: hrefFor(defaultLocale) },
  ];
}

function extractHreflang(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out[m[1]] = m[2];
  return out;
}

const LOCALES = ['en', 'nl'];
const CONFIG = { locales: LOCALES, defaultLocale: 'en' };

async function renderDoc(opts: {
  locale: string;
  content: Record<string, any>;
  canonicalPath: string;
  localeConfig?: { locales: string[]; defaultLocale: string };
  localeAlternates?: Array<{ hreflang: string; href: string }>;
}) {
  const res = await generateStaticHTML({
    sections: opts.content.layout.sections,
    content: opts.content,
    theme: {},
    publishedPageId: 'p',
    pageOwnerId: 'u',
    slug: SLUG,
    title: 'Title',
    audienceType: 'product',
    templateId: 'meridian',
    paletteId: null,
    variantId: null,
    goal: null,
    canonicalPath: opts.canonicalPath,
    locale: opts.locale,
    localeConfig: opts.localeConfig as any,
    localeAlternates: opts.localeAlternates,
  });
  return res.html;
}

describe('Phase 5 — multi-locale static export', () => {
  it('emits per-locale lang, self-canonical, reciprocal hreflang, and switcher', async () => {
    const alternates = alternatesForRoot(LOCALES, 'en');

    const enHtml = await renderDoc({
      locale: 'en',
      content: baseContent(),
      canonicalPath: '/',
      localeConfig: CONFIG,
      localeAlternates: alternates,
    });

    const nlContent = resolveLocaleElements(
      baseContent(),
      { nl: { [SECTION_ID]: { headline: NL_HEADLINE } } },
      'nl'
    );
    const nlHtml = await renderDoc({
      locale: 'nl',
      content: nlContent,
      canonicalPath: '/nl',
      localeConfig: CONFIG,
      localeAlternates: alternates,
    });

    // <html lang> per doc.
    expect(enHtml).toContain('<html lang="en">');
    expect(nlHtml).toContain('<html lang="nl">');

    // Self-referencing canonical points at THIS doc's path.
    const enCanonical = resolveCanonicalURL({ slug: SLUG, canonicalPath: '/' });
    const nlCanonical = resolveCanonicalURL({ slug: SLUG, canonicalPath: '/nl' });
    expect(enHtml).toContain(`<link rel="canonical" href="${enCanonical}">`);
    expect(nlHtml).toContain(`<link rel="canonical" href="${nlCanonical}">`);

    // Full reciprocal hreflang set + x-default on BOTH docs, mutually consistent.
    const enSet = extractHreflang(enHtml);
    const nlSet = extractHreflang(nlHtml);
    const expected = {
      en: resolveCanonicalURL({ slug: SLUG, canonicalPath: '/' }),
      nl: resolveCanonicalURL({ slug: SLUG, canonicalPath: '/nl' }),
      'x-default': resolveCanonicalURL({ slug: SLUG, canonicalPath: '/' }),
    };
    expect(enSet).toEqual(expected);
    expect(nlSet).toEqual(expected); // reciprocity: nl doc uses the SAME URLs as en

    // Switcher asset + inline config injected on both docs, current locale correct.
    expect(enHtml).toContain('/assets/switcher.v1.js');
    expect(nlHtml).toContain('/assets/switcher.v1.js');
    expect(enHtml).toContain(
      'window.__lessgoLocales={"locales":["en","nl"],"defaultLocale":"en","current":"en"}'
    );
    expect(nlHtml).toContain(
      'window.__lessgoLocales={"locales":["en","nl"],"defaultLocale":"en","current":"nl"}'
    );
  });

  it('non-default doc renders the overlay copy (resolve applied before render)', async () => {
    const nlContent = resolveLocaleElements(
      baseContent(),
      { nl: { [SECTION_ID]: { headline: NL_HEADLINE } } },
      'nl'
    );
    const nlHtml = await renderDoc({
      locale: 'nl',
      content: nlContent,
      canonicalPath: '/nl',
      localeConfig: CONFIG,
      localeAlternates: alternatesForRoot(LOCALES, 'en'),
    });
    expect(nlHtml).toContain(NL_HEADLINE);
    expect(nlHtml).not.toContain(EN_HEADLINE);

    // Default doc keeps the base copy.
    const enHtml = await renderDoc({
      locale: 'en',
      content: baseContent(),
      canonicalPath: '/',
      localeConfig: CONFIG,
      localeAlternates: alternatesForRoot(LOCALES, 'en'),
    });
    expect(enHtml).toContain(EN_HEADLINE);
  });
});

describe('Phase 5 — single-locale back-compat (byte-identical)', () => {
  it('passing a single-locale localeConfig produces IDENTICAL bytes to omitting it', async () => {
    // Baseline: no i18n options at all (== today's exact call shape).
    const baseline = await generateStaticHTML({
      sections: baseContent().layout.sections,
      content: baseContent(),
      theme: {},
      publishedPageId: 'p',
      pageOwnerId: 'u',
      slug: SLUG,
      title: 'Title',
      audienceType: 'product',
      templateId: 'meridian',
      paletteId: null,
      variantId: null,
      goal: null,
      canonicalPath: '/',
    });

    // Same call but WITH a single-locale config + locale 'en'. isMultiLocale is
    // false → no head/script emission → identical output.
    const withConfig = await generateStaticHTML({
      sections: baseContent().layout.sections,
      content: baseContent(),
      theme: {},
      publishedPageId: 'p',
      pageOwnerId: 'u',
      slug: SLUG,
      title: 'Title',
      audienceType: 'product',
      templateId: 'meridian',
      paletteId: null,
      variantId: null,
      goal: null,
      canonicalPath: '/',
      locale: 'en',
      localeConfig: { locales: ['en'], defaultLocale: 'en' },
    });

    expect(withConfig.html).toBe(baseline.html);
    // And none of the multi-locale surface leaked in.
    expect(baseline.html).toContain('<html lang="en">');
    expect(baseline.html).not.toContain('hreflang');
    expect(baseline.html).not.toContain('switcher.v1.js');
    expect(baseline.html).not.toContain('__lessgoLocales');
  });
});
