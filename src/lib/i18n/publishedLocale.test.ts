// src/lib/i18n/publishedLocale.test.ts — language-settings phase 6.
//
// Pins the SSR side of the published locale contract:
//  • which `/p/{slug}/…` requests are locale routes (mirrors switcher.v2 `segAt`);
//  • the switcher config the SSR pages stamp — same shape + `<` escaping as the
//    static generator, with the phase-6 `basePath` addition;
//  • basePath resolution from the HOST (the owed vercel.app item: a preview host
//    serving /p/{slug} must produce '/p/{slug}', not '');
//  • the hreflang map matches the export's buildAlternates semantics.

import { describe, it, expect } from 'vitest';
import type { LocaleConfig } from '@/types/core/content';
import {
  resolvePublishedLocale,
  resolveSsrBasePath,
  switcherConfigJson,
  switcherTagsForSsr,
  buildLocaleAlternateMap,
  SWITCHER_SCRIPT_SRC,
} from './publishedLocale';

const BI: LocaleConfig = { locales: ['en', 'nl'], defaultLocale: 'en' };
const BI_NL_DEFAULT: LocaleConfig = { locales: ['nl', 'en'], defaultLocale: 'nl' };
/** Ruling 10: a declared SINGLE non-English locale is legal and is NOT multi-locale. */
const SINGLE_NL: LocaleConfig = { locales: ['nl'], defaultLocale: 'nl' };

describe('resolvePublishedLocale — the /{loc} route matrix', () => {
  it('splits a declared non-default locale off the front', () => {
    expect(resolvePublishedLocale(BI, ['nl'])).toEqual({ locale: 'nl', remainder: [] });
    expect(resolvePublishedLocale(BI, ['nl', 'about'])).toEqual({ locale: 'nl', remainder: ['about'] });
    expect(resolvePublishedLocale(BI, ['nl', 'products', 'widget'])).toEqual({
      locale: 'nl',
      remainder: ['products', 'widget'],
    });
  });

  it('NEVER treats the default locale as a prefix (default content lives at the bare path)', () => {
    expect(resolvePublishedLocale(BI, ['en'])).toBeNull();
    expect(resolvePublishedLocale(BI, ['en', 'about'])).toBeNull();
    // …and with a non-English default it is 'nl' that is bare and 'en' that is prefixed.
    expect(resolvePublishedLocale(BI_NL_DEFAULT, ['nl'])).toBeNull();
    expect(resolvePublishedLocale(BI_NL_DEFAULT, ['en'])).toEqual({ locale: 'en', remainder: [] });
  });

  it('ignores undeclared segments — a real subpage named like a locale still 404s/serves as a subpage', () => {
    expect(resolvePublishedLocale(BI, ['de'])).toBeNull();
    expect(resolvePublishedLocale(BI, ['about'])).toBeNull();
    expect(resolvePublishedLocale(BI, ['about', 'nl'])).toBeNull();
  });

  it('single-locale + absent config never create locale routes (ruling 10)', () => {
    expect(resolvePublishedLocale(SINGLE_NL, ['nl'])).toBeNull();
    expect(resolvePublishedLocale(SINGLE_NL, ['en'])).toBeNull();
    expect(resolvePublishedLocale(null, ['nl'])).toBeNull();
    expect(resolvePublishedLocale(undefined, ['nl'])).toBeNull();
  });

  it('tolerates empty/degenerate segment lists', () => {
    expect(resolvePublishedLocale(BI, [])).toBeNull();
    expect(resolvePublishedLocale(BI, undefined)).toBeNull();
    expect(resolvePublishedLocale(BI, ['', 'nl'])).toEqual({ locale: 'nl', remainder: [] });
  });
});

describe('resolveSsrBasePath — the server stamps its own mount path', () => {
  it('preview + local + app hosts serve the literal /p/{slug} URL', () => {
    // THE owed phase-5 item: the client-side hostname gate does not know
    // *.vercel.app, so QA on a preview deployment would have rebuilt /nl/p/{slug}.
    expect(resolveSsrBasePath('lessgo-ai-git-x.vercel.app', 'my-page')).toBe('/p/my-page');
    expect(resolveSsrBasePath('localhost:3000', 'my-page')).toBe('/p/my-page');
    expect(resolveSsrBasePath('lessgo.ai', 'my-page')).toBe('/p/my-page');
    expect(resolveSsrBasePath('app.lessgo.ai', 'my-page')).toBe('/p/my-page');
  });

  it('middleware-rewritten hosts (publish subdomain, custom domain) serve at the host root', () => {
    expect(resolveSsrBasePath('my-page.lessgo.site', 'my-page')).toBe('');
    expect(resolveSsrBasePath('my-page.lessgo.ai', 'my-page')).toBe('');
    expect(resolveSsrBasePath('example.com', 'my-page')).toBe('');
    expect(resolveSsrBasePath('www.example.com', 'my-page')).toBe('');
  });

  it('degrades to host-root when the host is unknown', () => {
    expect(resolveSsrBasePath(null, 'my-page')).toBe('');
    expect(resolveSsrBasePath('lessgo.ai', '')).toBe('');
  });
});

describe('switcherConfigJson — parity with the htmlGenerator emission', () => {
  it('stamps locales/defaultLocale/current/slug/style/basePath', () => {
    expect(
      switcherConfigJson({
        locales: ['en', 'nl'],
        defaultLocale: 'en',
        current: 'nl',
        slug: 'my-page',
        style: 'dropdown',
        basePath: '/p/my-page',
      }),
    ).toBe(
      '{"locales":["en","nl"],"defaultLocale":"en","current":"nl","slug":"my-page","style":"dropdown","basePath":"/p/my-page"}',
    );
  });

  it('escapes `<` so a hostile slug cannot break out of the inline <script>', () => {
    const json = switcherConfigJson({
      locales: ['en', 'nl'],
      defaultLocale: 'en',
      current: 'en',
      slug: '</script><img src=x>',
      style: 'dropdown',
      basePath: '',
    });
    expect(json).not.toContain('</script>');
    expect(json).toContain('\\u003c/script>');
  });
});

describe('switcherTagsForSsr — same suppression semantics as the blob path', () => {
  const host = () => 'lessgo-ai-git-x.vercel.app';

  it('emits config + script for a multi-locale project', () => {
    const tags = switcherTagsForSsr({ config: BI, current: 'en', slug: 'my-page', host });
    expect(tags).not.toBeNull();
    expect(tags!.scriptSrc).toBe(SWITCHER_SCRIPT_SRC);
    expect(tags!.configScript).toContain('window.__lessgoLocales=');
    // stamped basePath = the preview mount path (the owed item, end to end)
    expect(tags!.configScript).toContain('"basePath":"/p/my-page"');
    expect(tags!.configScript).toContain('"slug":"my-page"');
    expect(tags!.configScript).toContain('"style":"dropdown"');
  });

  it("switcherStyle 'none' suppresses the SSR switcher entirely (pill AND geo redirect)", () => {
    expect(
      switcherTagsForSsr({
        config: { ...BI, switcherStyle: 'none' },
        current: 'en',
        slug: 'my-page',
        host,
      }),
    ).toBeNull();
  });

  it('single-locale + absent config emit nothing', () => {
    expect(switcherTagsForSsr({ config: SINGLE_NL, current: 'nl', slug: 's', host })).toBeNull();
    expect(switcherTagsForSsr({ config: null, current: 'en', slug: 's', host })).toBeNull();
  });

  it('never reads the host when nothing is emitted (keeps monolingual pages statically rendered)', () => {
    let reads = 0;
    const counting = () => {
      reads += 1;
      return 'lessgo.ai';
    };
    switcherTagsForSsr({ config: null, current: 'en', slug: 's', host: counting });
    switcherTagsForSsr({ config: { ...BI, switcherStyle: 'none' }, current: 'en', slug: 's', host: counting });
    expect(reads).toBe(0);
    switcherTagsForSsr({ config: BI, current: 'en', slug: 's', host: counting });
    expect(reads).toBe(1);
  });
});

describe('buildLocaleAlternateMap — matches the export buildAlternates', () => {
  it('reciprocal entries + x-default at the default locale (root)', () => {
    expect(buildLocaleAlternateMap({ config: BI, slug: 'my-page', barePath: '/' })).toEqual({
      en: 'https://my-page.lessgo.site',
      nl: 'https://my-page.lessgo.site/nl',
      'x-default': 'https://my-page.lessgo.site',
    });
  });

  it('prefixes a subpage path and honors a live custom domain', () => {
    expect(
      buildLocaleAlternateMap({
        config: BI,
        slug: 'my-page',
        canonicalDomain: 'example.com',
        barePath: '/about',
      }),
    ).toEqual({
      en: 'https://example.com/about',
      nl: 'https://example.com/nl/about',
      'x-default': 'https://example.com/about',
    });
  });

  it('empty for single-locale/absent configs ⇒ callers omit the key (zero-diff)', () => {
    expect(buildLocaleAlternateMap({ config: SINGLE_NL, slug: 's', barePath: '/' })).toEqual({});
    expect(buildLocaleAlternateMap({ config: null, slug: 's', barePath: '/' })).toEqual({});
  });
});
