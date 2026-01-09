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

  // Configuration
  analyticsOptIn?: boolean;
  baseURL?: string;
}

export interface StaticHTMLResult {
  html: string;
  metadata: {
    size: number;
    fonts: string[];
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

  // 1. Extract fonts from theme
  const fonts = extractFontsFromTheme(options.theme);

  // 2. Generate CSS variables from theme
  const cssVariables = generateThemeVariables(options.theme);

  // 3. Render React components to HTML string
  const bodyHTML = ReactDOMServer.renderToStaticMarkup(
    React.createElement(LandingPagePublishedRenderer, {
      sections: options.sections,
      content: options.content,
      theme: options.theme,
      publishedPageId: options.publishedPageId,
      pageOwnerId: options.pageOwnerId,
    })
  );

  // 4. Detect if page has forms
  const hasForms = Boolean(options.content?.forms && Object.keys(options.content.forms).length > 0);

  // 5. Build complete HTML document
  const html = buildHTMLDocument({
    bodyHTML,
    cssVariables,
    fonts,
    metadata: {
      title: options.title,
      description: options.description || '',
      previewImage: options.previewImage,
      slug: options.slug,
      baseURL: options.baseURL || 'https://lessgo.ai',
      publishedPageId: options.publishedPageId,
    },
    analyticsOptIn: options.analyticsOptIn || false,
    hasForms,
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
      fonts,
      cssVariableCount: Object.keys(cssVariables).length,
    },
  };
}

/**
 * Extract unique font families from theme.typography
 */
function extractFontsFromTheme(theme: any): string[] {
  const fonts = new Set<string>();

  // Extract base font names (remove CSS quotes and fallbacks)
  const headingFont = theme?.typography?.headingFont
    ?.replace(/['"]/g, '')
    .split(',')[0]
    .trim();
  const bodyFont = theme?.typography?.bodyFont
    ?.replace(/['"]/g, '')
    .split(',')[0]
    .trim();

  // Add fonts if they exist and aren't default
  if (headingFont && headingFont !== 'Inter') fonts.add(headingFont);
  if (bodyFont && bodyFont !== 'Inter') fonts.add(bodyFont);

  // Always include Inter as fallback (already loaded in /p/layout.tsx)
  fonts.add('Inter');

  return Array.from(fonts);
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
  if (backgrounds.divider) vars['--bg-divider-base'] = backgrounds.divider;

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
  fonts: string[];
  metadata: {
    title: string;
    description: string;
    previewImage?: string;
    slug: string;
    baseURL: string;
    publishedPageId: string;
  };
  analyticsOptIn: boolean;
  hasForms: boolean;
}): string {
  const { bodyHTML, cssVariables, fonts, metadata, analyticsOptIn, hasForms } = params;

  // Generate Google Fonts URL
  const fontsURL = generateGoogleFontsURL(fonts);

  // Generate CSS variables style tag
  const cssVariablesStyle = generateCSSVariablesStyle(cssVariables);

  // OG image URL
  const ogImage =
    metadata.previewImage ||
    `${metadata.baseURL}/api/og/${metadata.slug}`;
  const canonicalURL = `https://${metadata.slug}.lessgo.ai`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Title & Description -->
  <title>${escapeHTML(metadata.title)}</title>
  <meta name="description" content="${escapeHTML(metadata.description)}">

  <!-- Canonical URL -->
  <link rel="canonical" href="${canonicalURL}">

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

  <!-- Google Fonts -->
  ${fontsURL ? `<link href="${fontsURL}" rel="stylesheet">` : ''}

  <!-- Shared CSS -->
  <link rel="stylesheet" href="/assets/published.css">

  <!-- Theme CSS Variables (inline, per-page) -->
  ${cssVariablesStyle}
</head>
<body>
  ${bodyHTML}

  <!-- Phase 4: Form handler (loaded if page has forms) -->
  ${hasForms ? `<script src="https://lessgo.ai/assets/form.v1.js" defer></script>` : ''}

  <!-- Phase 4: Analytics beacon (opt-in) -->
  ${
    analyticsOptIn
      ? `<script src="https://lessgo.ai/assets/a.v1.js" data-page-id="${metadata.publishedPageId}" data-slug="${metadata.slug}" defer></script>`
      : ''
  }
</body>
</html>`;
}

/**
 * Generate Google Fonts CDN URL with display=swap
 */
function generateGoogleFontsURL(fonts: string[]): string {
  if (!fonts.length) return '';

  // Filter out default fonts already loaded
  const fontsToLoad = fonts.filter(
    (f) => f !== 'Inter' && f !== 'Bricolage Grotesque'
  );

  if (!fontsToLoad.length) return '';

  // Format: https://fonts.googleapis.com/css2?family=Poppins&family=Open+Sans&display=swap
  const families = fontsToLoad
    .map((f) => `family=${f.replace(/\s/g, '+')}`)
    .join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
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
 * Helper: Escape HTML special characters
 */
function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
