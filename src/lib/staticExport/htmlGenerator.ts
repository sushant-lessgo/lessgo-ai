import 'server-only';

/**
 * HTML Generator - Phase 1
 *
 * Generates complete static HTML documents from published page data
 * Uses ReactDOMServer.renderToStaticMarkup() with LandingPagePublishedRenderer
 */

import React from 'react';
import { LandingPagePublishedRenderer } from '@/modules/generatedLanding/LandingPagePublishedRenderer';
import { validateAndResolveAssetURLs } from './assetResolver';
import { renderLessgoBadge } from './lessgoBadge';
import { resolveCanonicalURL } from './canonicalUrl';
import { resolveOgImage } from './buildPageMetadata';
import { escapeHTML, isSafeURL, robotsMetaTag, faviconLinkTag, jsonLdScriptTag, metaPixelSnippet, ga4Snippet } from './headTags';
import { usesTemplateModule } from '@/types/service';
import { isSkeletonBacked } from '@/modules/skeletons/ids';
import type { PageSeo } from '@/types/store/pages';
import type { LocaleConfig } from '@/types/core/content';

export interface StaticHTMLOptions {
  // Content
  sections: string[];
  content: Record<string, any>;
  theme: any;

  // Metadata
  publishedPageId: string;
  pageOwnerId: string;
  slug: string;
  title: string;
  description?: string;
  previewImage?: string;
  audienceType?: 'product' | 'service' | 'writer';
  templateId?: string | null;
  paletteId?: string | null;
  variantId?: string | null;
  /** Neutral mood (vestria) — Project.themeValues.mood; default bone. */
  mood?: string | null;
  /** Knob selection (template-factory phase 3) — Project.themeValues.knobs.
   *  Threaded to the published renderer → template SSRTokens, which applies
   *  `data-knob-*` attrs + inlines the knob CSS. Absent/all-default ⇒ no attrs,
   *  no CSS ⇒ byte-identical output. Only knob-tokenized templates consume it. */
  knobs?: import('@/types/template').KnobSelection | null;
  /** User style tokens (work-skeleton D1/§D) — Project.themeValues.styleTokens.
   *  Threaded to the published renderer → skeleton SSRTokens → buildWorkStylesheet →
   *  serializeStyleTokens, which emits `[data-sid]{--u-*}` CSS. Absent/empty ⇒ the
   *  serializer returns '' ⇒ no CSS ⇒ byte-identical output. Only skeleton-backed
   *  templates consume it; classic templates ignore the extra prop. Mirrors `knobs`. */
  styleTokens?: import('@/modules/skeletons/styleTokens').StyleTokens | null;
  /** scale-04 (phase 3): the project's Brief.goal, threaded into the renderer's
   *  normalization pre-pass so GOAL_REF primaries resolve. OPTIONAL — blog/no-goal
   *  callers omit it → null-goal legacy fallback. */
  goal?: import('@/types/brief').Brief['goal'] | null;
  /** goal-ref-cta phase 3 (F23): the path of THIS page ('/', '/contact') and the
   *  path of the page that holds the conversion form. Both derived once by
   *  renderPublishedExport (which holds every page); threaded into the renderer's
   *  normalization pre-pass so multipage M1 primaries emit a cross-page `page`
   *  dest. Single-page callers omit both → same-page anchor. */
  currentPagePath?: string;
  formPagePath?: string;

  // Canonical / social URL resolution.
  // canonicalDomain: the live custom domain (no scheme) when one is active; when unset,
  // canonical falls back to `${slug}.lessgo.site`. canonicalPath: this page's path
  // (leading slash; '/' for root) so multi-page subpages self-report their own URL
  // instead of the root's.
  canonicalDomain?: string;
  canonicalPath?: string;

  // SEO (Phase 2): this page's sanitized seo overrides (ogImage precedence +
  // noindex). Title/description overrides are already resolved by the caller via
  // buildPageMetadata. faviconUrl is resolved separately (root seo cascades).
  seo?: PageSeo | null;
  faviconUrl?: string;
  // Tracking pixels (site-level, threaded by the caller like faviconUrl — root
  // seo cascades to every page). Absent/invalid ⇒ builder returns '' ⇒
  // byte-identical head.
  metaPixelId?: string;
  ga4MeasurementId?: string;
  // JSON-LD (Phase 3): pre-serialized (script-breakout-safe) structured data;
  // the caller builds it via structuredData.ts — root page only.
  jsonLd?: string;

  // Configuration
  analyticsOptIn?: boolean;
  baseURL?: string;
  /** pricing-v2 (phase 2): suppress the "Made with Lessgo" badge. Only true when
   *  the page owner's plan has the `removeBranding` feature (Pro/LTD). Default
   *  false ⇒ badge shown — FAIL-CLOSED to branded so a missing/failed plan lookup
   *  never silently drops branding on a free page. */
  removeBranding?: boolean;

  // i18n (Phase 5) — all OPTIONAL. Absent ⇒ single-locale byte-identical output.
  /** The locale THIS doc renders (for `<html lang>`). Defaults to 'en' when absent. */
  locale?: string;
  /** Project locale declaration. Presence WITH >1 locale triggers hreflang +
   *  switcher emission; single/absent ⇒ none of it (legacy output unchanged). */
  localeConfig?: LocaleConfig;
  /** Reciprocal hreflang set (every locale + x-default), precomputed by
   *  renderPublishedExport from the SAME resolveCanonicalURL source as canonical
   *  so the self-canonical and self-alternate always agree. */
  localeAlternates?: Array<{ hreflang: string; href: string }>;
}

export interface StaticHTMLResult {
  html: string;
  metadata: {
    size: number;
    cssVariableCount: number;
  };
}

/**
 * Generate complete static HTML document for a published page
 */
export async function generateStaticHTML(
  options: StaticHTMLOptions
): Promise<StaticHTMLResult> {
  // Dynamic import - avoids Next.js static analysis
  const ReactDOMServer = await import('react-dom/server');

  // Preload the template module (service = Hearth; product+meridian = Meridian)
  // so the sync renderer resolves blocks.
  if (usesTemplateModule(options.audienceType, options.templateId)) {
    const { preloadTemplate } = await import('@/modules/templates/registry');
    await preloadTemplate((options.templateId || 'hearth') as any);
  }

  // 1. Generate CSS variables from theme
  const cssVariables = generateThemeVariables(options.theme);

  // 3. Render React components to HTML string
  const bodyHTML = ReactDOMServer.renderToStaticMarkup(
    React.createElement(LandingPagePublishedRenderer, {
      sections: options.sections,
      content: options.content,
      theme: options.theme,
      publishedPageId: options.publishedPageId,
      pageOwnerId: options.pageOwnerId,
      audienceType: options.audienceType ?? 'product',
      templateId: options.templateId ?? null,
      paletteId: options.paletteId ?? null,
      variantId: options.variantId ?? null,
      mood: options.mood ?? null,
      knobs: options.knobs ?? null,
      styleTokens: options.styleTokens ?? null,
      goal: options.goal ?? null,
      currentPagePath: options.currentPagePath,
      formPagePath: options.formPagePath,
    })
  );

  // 4. Detect if page has forms
  const hasForms = Boolean(options.content?.forms && Object.keys(options.content.forms).length > 0);

  // Phase 4: TechPremium pages load the shared naayom.v1.js behaviors asset
  // (dropdown nav, mobile menu, lightbox, gallery filter, live readout tick).
  const usesNaayom = options.templateId === 'techpremium';

  // Lumen (bespoke §13) pages load lumen.v1.js (lightbox + reveal + EN·NL toggle/geo).
  const usesLumen = options.templateId === 'lumen';

  // Skeleton-backed pages (atelier, atelier2) load work.v1.js (hero slider + fixed
  // header). Gated ONLY off the pure-data skeletonBackedTemplateIds list — NO
  // skeleton/registry React import enters the static-export path. Each behavior is
  // independently guarded, so a page missing a section is a no-op.
  const usesWorkSkeleton = isSkeletonBacked(options.templateId);

  // 5. Build complete HTML document
  const html = buildHTMLDocument({
    bodyHTML,
    cssVariables,
    metadata: {
      title: options.title,
      description: options.description || '',
      previewImage: options.previewImage,
      slug: options.slug,
      baseURL: options.baseURL || 'https://lessgo.ai',
      publishedPageId: options.publishedPageId,
      canonicalDomain: options.canonicalDomain,
      canonicalPath: options.canonicalPath,
      ogImageOverride: options.seo?.ogImage,
      noIndex: !!options.seo?.noIndex,
      faviconUrl: options.faviconUrl,
      metaPixelId: options.metaPixelId,
      ga4MeasurementId: options.ga4MeasurementId,
      jsonLd: options.jsonLd,
    },
    analyticsOptIn: options.analyticsOptIn || false,
    removeBranding: options.removeBranding || false,
    hasForms,
    usesNaayom,
    usesLumen,
    usesWorkSkeleton,
    locale: options.locale,
    localeConfig: options.localeConfig,
    localeAlternates: options.localeAlternates,
  });

  // 5. Validate and resolve asset URLs
  const validatedHTML = validateAndResolveAssetURLs(
    html,
    options.baseURL || 'https://lessgo.ai'
  );

  return {
    html: validatedHTML,
    metadata: {
      size: Buffer.byteLength(validatedHTML, 'utf8'),
      cssVariableCount: Object.keys(cssVariables).length,
    },
  };
}

/**
 * Generate CSS variables object from theme
 */
function generateThemeVariables(theme: any): Record<string, string> {
  const vars: Record<string, string> = {};

  // Background colors
  const backgrounds = theme?.colors?.sectionBackgrounds || {};
  if (backgrounds.primary) vars['--bg-primary-base'] = backgrounds.primary;
  if (backgrounds.secondary) vars['--bg-secondary-base'] = backgrounds.secondary;
  if (backgrounds.neutral) vars['--bg-neutral-base'] = backgrounds.neutral;


  // Accent colors
  const accentColor = theme?.colors?.accentColor;
  if (accentColor) {
    vars['--accent-primary'] = accentColor;
    vars['--accent-primary-hover'] = adjustColorBrightness(accentColor, -10);
    vars['--accent-primary-active'] = adjustColorBrightness(accentColor, -20);
  }

  // Gradient colors (if custom gradients exist)
  if (theme?.colors?.gradientColors) {
    vars['--gradient-from'] = theme.colors.gradientColors.from;
    vars['--gradient-via'] =
      theme.colors.gradientColors.via || theme.colors.gradientColors.from;
    vars['--gradient-to'] = theme.colors.gradientColors.to;
  }

  // Text colors (pre-calculated in theme.colors.textColors)
  const textColors = theme?.colors?.textColors || {};
  Object.entries(textColors).forEach(([bg, colors]: [string, any]) => {
    if (colors.heading) vars[`--text-${bg}-heading`] = colors.heading;
    if (colors.body) vars[`--text-${bg}-body`] = colors.body;
    if (colors.muted) vars[`--text-${bg}-muted`] = colors.muted;
  });

  return vars;
}

/**
 * Build complete HTML document structure
 */
function buildHTMLDocument(params: {
  bodyHTML: string;
  cssVariables: Record<string, string>;
  metadata: {
    title: string;
    description: string;
    previewImage?: string;
    slug: string;
    baseURL: string;
    publishedPageId: string;
    canonicalDomain?: string;
    canonicalPath?: string;
    ogImageOverride?: string;
    noIndex?: boolean;
    faviconUrl?: string;
    metaPixelId?: string;
    ga4MeasurementId?: string;
    jsonLd?: string;
  };
  analyticsOptIn: boolean;
  removeBranding: boolean;
  hasForms: boolean;
  usesNaayom: boolean;
  usesLumen: boolean;
  usesWorkSkeleton: boolean;
  locale?: string;
  localeConfig?: LocaleConfig;
  localeAlternates?: Array<{ hreflang: string; href: string }>;
}): string {
  const { bodyHTML, cssVariables, metadata, analyticsOptIn, removeBranding, hasForms, usesNaayom, usesLumen, usesWorkSkeleton } = params;

  // i18n (Phase 5): multi-locale head/script emission. When the project declares
  // only one locale (or none), NONE of this fires and the document is
  // byte-identical to legacy output (back-compat law at the publish layer).
  const multiLocale =
    !!params.localeConfig &&
    Array.isArray(params.localeConfig.locales) &&
    params.localeConfig.locales.length > 1;
  // <html lang>: the locale THIS doc renders (fixes the old hardcoded "en").
  // Single-locale ⇒ 'en' ⇒ byte-identical.
  const lang = params.locale || 'en';
  const alternates = params.localeAlternates || [];
  // (b) reciprocal hreflang for ALL locales + (c) x-default — self-canonical (a)
  // is the existing <link rel="canonical"> below (its canonicalPath is already the
  // locale-prefixed path for non-default docs).
  // Scheme-gate each alternate href (publish-trust M4). Reject semantics = OMIT the
  // whole <link>: an alternate with an unusable href has no safe degraded form, and an
  // empty href would self-link this page under a foreign hreflang. Filtered BEFORE the
  // length check so an all-unsafe set emits no comment block either.
  const safeAlternates = alternates.filter((a) => isSafeURL(a.href));
  const hreflangTags =
    multiLocale && safeAlternates.length
      ? `\n\n  <!-- i18n hreflang alternates -->` +
        safeAlternates
          .map(
            (a) =>
              `\n  <link rel="alternate" hreflang="${escapeHTML(a.hreflang)}" href="${escapeHTML(a.href)}">`
          )
          .join('')
      : '';
  // Inline locale config (drives switcher.v1.js) + the shared switcher asset.
  // `<` escaped to < so a stray locale code can't break out of the script.
  const localeJson = multiLocale
    ? JSON.stringify({
        locales: params.localeConfig!.locales,
        defaultLocale: params.localeConfig!.defaultLocale,
        current: lang,
      }).replace(/</g, '\\u003c')
    : '';

  // Asset origin for the injected fonts/scripts. Absolute origin (NOT relative):
  // these platform assets are served from prod subdomains AND custom domains
  // (where a relative /assets/* would 404). NOTE: a dev-relative shim here is a
  // footgun — when publishing to a real subdomain from `npm run dev`,
  // validateAndResolveAssetURLs rewrites the relative src to the local baseURL
  // (http://localhost:3000), freezing a broken localhost URL into the static
  // HTML. So keep it absolute regardless of env. Env-driven so a local publish
  // loads the local build of the beacon/form JS instead of production's copy;
  // falls back to https://lessgo.ai in prod where NEXT_PUBLIC_APP_URL points there.
  const assetBase = process.env.NEXT_PUBLIC_APP_URL || 'https://lessgo.ai';

  // Generate CSS variables style tag
  const cssVariablesStyle = generateCSSVariablesStyle(cssVariables);

  // Canonical host: live custom domain when present, else the lessgo.ai subdomain.
  // Path: this page's own path so subpages don't all claim the root canonical.
  //
  // NOTE (publish-trust M4) — canonicalURL is escape-only, deliberately NOT isSafeURL-gated,
  // and that is not an oversight: resolveCanonicalURL ALWAYS builds `https://${host}${path}`
  // (canonicalUrl.ts:18-21), so the scheme is a literal — the gate could never fire, and a
  // gate that can't fail is a false reassurance. The only user-influenced parts are host
  // (slug / canonicalDomain) and path, which sit AFTER the scheme; there the whole attack is
  // attribute breakout, for which escapeHTML at the sink is the correct and sufficient
  // defense. Please don't "harden" this with a scheme gate later.
  const canonicalURL = resolveCanonicalURL({
    slug: metadata.slug,
    canonicalDomain: metadata.canonicalDomain,
    canonicalPath: metadata.canonicalPath,
  });

  // OG image URL. Shared with the dynamic routes via resolveOgImage: seo.ogImage
  // (per-page override) wins, then previewImage (manual upload), else auto
  // /api/og/{slug} served from the live custom domain when one exists (absolute
  // URL matches the host the page lives on), else off baseURL. No-seo output
  // stays byte-identical.
  const ogImage = resolveOgImage({
    slug: metadata.slug,
    previewImage: metadata.ogImageOverride || metadata.previewImage,
    canonicalDomain: metadata.canonicalDomain,
    baseUrl: metadata.baseURL,
    canonicalPath: metadata.canonicalPath,
  });

  // Switcher tag block (needs assetBase, resolved above). Empty for single-locale.
  const switcherTags = multiLocale
    ? `\n\n  <!-- i18n locale switcher (multi-locale) -->\n  <script>window.__lessgoLocales=${localeJson}</script>\n  <script src="${assetBase}/assets/switcher.v1.js" defer></script>`
    : '';

  return `<!DOCTYPE html>
<html lang="${escapeHTML(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Title & Description -->
  <title>${escapeHTML(metadata.title)}</title>
  <meta name="description" content="${escapeHTML(metadata.description)}">

  <!-- Canonical URL -->
  <link rel="canonical" href="${escapeHTML(canonicalURL)}">${robotsMetaTag(metadata.noIndex)}${faviconLinkTag(metadata.faviconUrl)}${hreflangTags}

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHTML(canonicalURL)}">
  <meta property="og:title" content="${escapeHTML(metadata.title)}">
  <meta property="og:description" content="${escapeHTML(metadata.description)}">
  <meta property="og:image" content="${escapeHTML(ogImage)}">
  <meta property="og:site_name" content="Lessgo AI">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHTML(canonicalURL)}">
  <meta name="twitter:title" content="${escapeHTML(metadata.title)}">
  <meta name="twitter:description" content="${escapeHTML(metadata.description)}">
  <meta name="twitter:image" content="${escapeHTML(ogImage)}">

  <!-- Self-hosted template fonts (Inter, Inter Tight, JetBrains Mono, DM Sans,
       Fraunces, Source Serif 4, Lora, EB Garamond) -->
  <link rel="stylesheet" href="${assetBase}/assets/fonts-self-hosted.css">

  <!-- Shared CSS -->
  <link rel="stylesheet" href="/assets/published.css">

  <!-- Theme CSS Variables (inline, per-page) -->
  ${cssVariablesStyle}${jsonLdScriptTag(metadata.jsonLd)}${metaPixelSnippet(metadata.metaPixelId)}${ga4Snippet(metadata.ga4MeasurementId)}
</head>
<body>
  ${bodyHTML}
  ${removeBranding ? '' : renderLessgoBadge()}

  <!-- Phase 4: Form handler (loaded if page has forms) -->
  ${hasForms ? `<script src="${assetBase}/assets/form.v2.js" defer></script>` : ''}

  <!-- Phase 4: TechPremium behaviors (dropdown nav, lightbox, gallery filter, readout tick) -->
  ${usesNaayom ? `<script src="${assetBase}/assets/naayom.v1.js" defer></script>` : ''}

  <!-- Lumen behaviors (lightbox + reveal + EN·NL toggle/geo) -->
  ${usesLumen ? `<script src="${assetBase}/assets/lumen.v1.js" defer></script>` : ''}

  <!-- Work skeleton behaviors (hero slider + fixed header) -->
  ${usesWorkSkeleton ? `<script src="${assetBase}/assets/work.v1.js" defer></script>` : ''}${switcherTags}

  <!-- Phase 4: Analytics beacon (opt-in) -->
  ${
    analyticsOptIn
      ? `<script src="${assetBase}/assets/a.v2.js" data-page-id="${escapeHTML(metadata.publishedPageId)}" data-slug="${escapeHTML(metadata.slug)}" defer></script>`
      : ''
  }
</body>
</html>`;
}

/**
 * Generate inline <style> tag with CSS variables
 */
function generateCSSVariablesStyle(
  variables: Record<string, string>
): string {
  if (!Object.keys(variables).length) return '';

  const declarations = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `<style>
:root {
${declarations}
}
</style>`;
}

/**
 * Helper: Adjust color brightness (simple hex manipulation)
 * For now, returns as-is - can enhance with color library if needed
 */
function adjustColorBrightness(hex: string, percent: number): string {
  // Simple implementation - return as-is for Phase 1
  // Can enhance with actual color manipulation in future phases
  return hex;
}
