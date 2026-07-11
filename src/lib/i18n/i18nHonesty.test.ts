// src/lib/i18n/i18nHonesty.test.ts
// i18n-phase-1 Phase 7 (D5) — `bilingual` capability HONESTY test.
//
// `bilingual` is a queryable serve-gate capability, and — unlike a block-backed
// capability — it is exempt from conformance.test.ts's block-evidence check
// (it lives in STRUCTURAL_CAPABILITIES). This test is the STRUCTURAL check that
// backs that exemption: it proves the capability is NOT a lie by asserting the
// platform machinery it promises actually exists and is wired end to end —
//   (a) `bilingual` is in the closed capability vocab;
//   (b) DERIVATION: a >1-locale Brief requires it; a ≤1-locale Brief does not;
//   (c) SATISFACTION: fit() passes it for EVERY active (non-retired) template;
//   (d) MACHINERY: the resolver is exported, the switcher asset is registered in
//       the build, and a 2-locale fixture through generateStaticHTML emits the
//       switcher script + per-locale <html lang> + reciprocal hreflang.
//
// D5 LIMITATION (stated, not solved): this proves the platform MACHINERY exists,
// NOT per-template Dutch/other-locale RENDER FIDELITY. Fixed-width text
// assumptions, hardcoded English strings inside block components, and long-word
// overflow are per-template typography risks that NO structural test can catch.
// That remains a MANUAL per-template gate (first exercised in the atelier
// template build). The honesty test proves the machinery, not the typography.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { vi, describe, it, expect } from 'vitest';

import { capabilityIds } from '@/types/brief';
import type { Brief } from '@/types/brief';
import { fit, requiredCapabilitiesFromBrief } from '@/modules/templates/fit';
import { templateMeta } from '@/modules/templates/templateMeta';
import { templateIds, type TemplateId } from '@/types/service';
import { resolveLocaleElements } from '@/lib/i18n/localeContent';

// htmlGenerator is `import 'server-only'`; neutralize so it runs under vitest.
vi.mock('server-only', () => ({}));

describe('i18n honesty — `bilingual` capability is backed by real machinery (D5)', () => {
  // ── (a) closed vocab ──────────────────────────────────────────────────────
  it('(a) `bilingual` is a member of the closed capability vocabulary', () => {
    expect(capabilityIds).toContain('bilingual');
  });

  // ── (b) DERIVATION ────────────────────────────────────────────────────────
  describe('(b) requiredCapabilitiesFromBrief derives bilingual from >1 locale', () => {
    it('a Brief with 2 locales requires `bilingual`', () => {
      const brief = { locales: ['en', 'nl'] } as Brief;
      expect(requiredCapabilitiesFromBrief(brief)).toContain('bilingual');
    });

    it('a Brief with a single locale does NOT require `bilingual`', () => {
      const brief = { locales: ['en'] } as Brief;
      expect(requiredCapabilitiesFromBrief(brief)).not.toContain('bilingual');
    });

    it('a Brief with no locales field does NOT require `bilingual`', () => {
      const brief = {} as Brief;
      expect(requiredCapabilitiesFromBrief(brief)).not.toContain('bilingual');
    });
  });

  // ── (c) SATISFACTION — platform-level, every active template ───────────────
  describe('(c) fit() satisfies `bilingual` for every active (non-retired) template', () => {
    const active = templateIds.filter(
      (t) => !templateMeta[t].retired && !templateMeta[t].bespoke
    );

    it('there is at least one active template to exercise', () => {
      expect(active.length).toBeGreaterThan(0);
    });

    for (const templateId of active) {
      it(`${templateId}: fit(${templateId}, <its engine>, ['bilingual']) === true`, () => {
        const engine = templateMeta[templateId].copyEngines[0];
        expect(fit(templateId as TemplateId, engine, ['bilingual'])).toBe(true);
      });
    }

    it('retired/bespoke templates are NOT auto-satisfied (platform ≠ retired override)', () => {
      // techpremium is retired, lumen is bespoke → fit() rejects up front
      // regardless of the platform capability. Proves PLATFORM_CAPABILITIES did
      // not weaken the retired/bespoke firewall.
      expect(fit('techpremium', 'thing', ['bilingual'])).toBe(false);
      expect(fit('lumen', 'work', ['bilingual'])).toBe(false);
    });
  });

  // ── (d) MACHINERY EXISTS ───────────────────────────────────────────────────
  describe('(d) the platform machinery `bilingual` promises actually exists', () => {
    it('resolveLocaleElements is exported and merges overlay over base', () => {
      expect(typeof resolveLocaleElements).toBe('function');
      const SECTION = 'hero-abc12345';
      const base = { [SECTION]: { elements: { headline: 'EN' } } } as any;
      const merged = resolveLocaleElements(
        base,
        { nl: { [SECTION]: { headline: 'NL' } } },
        'nl'
      );
      expect(merged[SECTION].elements.headline).toBe('NL');
      // base untouched (no materialization / frozen-fallback bug)
      expect(base[SECTION].elements.headline).toBe('EN');
    });

    it('switcherBehaviors.js source exists and is registered as switcher.v1.js in buildAssets', () => {
      const root = path.join(__dirname, '..', '..', '..'); // src/lib/i18n → repo root
      const src = path.join(
        root,
        'src',
        'lib',
        'staticExport',
        'switcherBehaviors.js'
      );
      expect(existsSync(src), 'switcherBehaviors.js source must exist').toBe(true);

      const buildAssets = readFileSync(
        path.join(root, 'scripts', 'buildAssets.js'),
        'utf8'
      );
      expect(buildAssets).toMatch(/switcherBehaviors\.js/);
      expect(buildAssets).toMatch(/switcher\.v1\.js/);
    });

    it('a 2-locale fixture through generateStaticHTML emits switcher + lang + reciprocal hreflang', async () => {
      const { generateStaticHTML } = await import(
        '@/lib/staticExport/htmlGenerator'
      );
      const { resolveCanonicalURL } = await import(
        '@/lib/staticExport/canonicalUrl'
      );

      const SECTION_ID = 'hero-abc12345';
      const SLUG = 'honesty-fixture';
      const baseContent = (): Record<string, any> => ({
        layout: { sections: [SECTION_ID], theme: {} },
        [SECTION_ID]: {
          id: SECTION_ID,
          type: 'hero',
          layout: 'leftCopyRightImage',
          elements: { headline: 'BUILDFAST', subheadline: 'sub' },
          backgroundType: 'primary',
        },
      });

      const LOCALES = ['en', 'nl'];
      const CONFIG = { locales: LOCALES, defaultLocale: 'en' };
      const pathFor = (loc: string) => (loc === 'en' ? '/' : `/${loc}`);
      const alternates = [
        ...LOCALES.map((loc) => ({
          hreflang: loc,
          href: resolveCanonicalURL({ slug: SLUG, canonicalPath: pathFor(loc) }),
        })),
        {
          hreflang: 'x-default',
          href: resolveCanonicalURL({ slug: SLUG, canonicalPath: '/' }),
        },
      ];

      const render = (locale: string, content: Record<string, any>, canonicalPath: string) =>
        generateStaticHTML({
          sections: content.layout.sections,
          content,
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
          canonicalPath,
          locale,
          localeConfig: CONFIG as any,
          localeAlternates: alternates,
        });

      const nlContent = resolveLocaleElements(
        baseContent(),
        { nl: { [SECTION_ID]: { headline: 'BOUWSNEL' } } },
        'nl'
      );

      const en = (await render('en', baseContent(), '/')).html;
      const nl = (await render('nl', nlContent, '/nl')).html;

      // per-locale <html lang>
      expect(en).toContain('<html lang="en">');
      expect(nl).toContain('<html lang="nl">');

      // switcher script injected on both docs
      expect(en).toContain('/assets/switcher.v1.js');
      expect(nl).toContain('/assets/switcher.v1.js');

      // reciprocal hreflang (all locales + x-default) present on both docs
      const enUrl = resolveCanonicalURL({ slug: SLUG, canonicalPath: '/' });
      const nlUrl = resolveCanonicalURL({ slug: SLUG, canonicalPath: '/nl' });
      for (const html of [en, nl]) {
        expect(html).toContain(`<link rel="alternate" hreflang="en" href="${enUrl}">`);
        expect(html).toContain(`<link rel="alternate" hreflang="nl" href="${nlUrl}">`);
        expect(html).toContain(`<link rel="alternate" hreflang="x-default" href="${enUrl}">`);
      }

      // overlay copy actually rendered on the nl doc
      expect(nl).toContain('BOUWSNEL');
    });
  });
});
