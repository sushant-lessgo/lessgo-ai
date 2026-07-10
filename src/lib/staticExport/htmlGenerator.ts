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
import { escapeHTML, robotsMetaTag, faviconLinkTag, jsonLdScriptTag } from './headTags';
import { usesTemplateModule } from '@/types/service';
import type { PageSeo } from '@/types/store/pages';

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
  // JSON-LD (Phase 3): pre-serialized (script-breakout-safe) structured data;
  // the caller builds it via structuredData.ts — root page only.
  jsonLd?: string;

  // Configuration
  analyticsOptIn?: boolean;
  baseURL?: string;
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
      jsonLd: options.jsonLd,
    },
    analyticsOptIn: options.analyticsOptIn || false,
    hasForms,
    usesNaayom,
    usesLumen,
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
    jsonLd?: string;
  };
  analyticsOptIn: boolean;
  hasForms: boolean;
  usesNaayom: boolean;
  usesLumen: boolean;
}): string {
  const { bodyHTML, cssVariables, metadata, analyticsOptIn, hasForms, usesNaayom, usesLumen } = params;

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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Title & Description -->
  <title>${escapeHTML(metadata.title)}</title>
  <meta name="description" content="${escapeHTML(metadata.description)}">

  <!-- Canonical URL -->
  <link rel="canonical" href="${canonicalURL}">${robotsMetaTag(metadata.noIndex)}${faviconLinkTag(metadata.faviconUrl)}

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalURL}">
  <meta property="og:title" content="${escapeHTML(metadata.title)}">
  <meta property="og:description" content="${escapeHTML(metadata.description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:site_name" content="Lessgo.ai">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalURL}">
  <meta name="twitter:title" content="${escapeHTML(metadata.title)}">
  <meta name="twitter:description" content="${escapeHTML(metadata.description)}">
  <meta name="twitter:image" content="${ogImage}">

  <!-- Self-hosted template fonts (Inter, Inter Tight, JetBrains Mono, DM Sans,
       Fraunces, Source Serif 4, Lora, EB Garamond) -->
  <link rel="stylesheet" href="${assetBase}/assets/fonts-self-hosted.css">

  <!-- Shared CSS -->
  <link rel="stylesheet" href="/assets/published.css">

  <!-- Theme CSS Variables (inline, per-page) -->
  ${cssVariablesStyle}${jsonLdScriptTag(metadata.jsonLd)}
</head>
<body>
  ${bodyHTML}
  ${renderLessgoBadge()}

  <!-- Phase 4: Form handler (loaded if page has forms) -->
  ${hasForms ? `<script src="${assetBase}/assets/form.v1.js" defer></script>` : ''}

  <!-- Phase 4: TechPremium behaviors (dropdown nav, lightbox, gallery filter, readout tick) -->
  ${usesNaayom ? `<script src="${assetBase}/assets/naayom.v1.js" defer></script>` : ''}

  <!-- Lumen behaviors (lightbox + reveal + EN·NL toggle/geo) -->
  ${usesLumen ? `<script src="${assetBase}/assets/lumen.v1.js" defer></script>` : ''}

  <!-- Phase 4: Analytics beacon (opt-in) -->
  ${
    analyticsOptIn
      ? `<script src="${assetBase}/assets/a.v1.js" data-page-id="${metadata.publishedPageId}" data-slug="${metadata.slug}" defer></script>`
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
