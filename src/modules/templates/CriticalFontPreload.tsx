// src/modules/templates/CriticalFontPreload.tsx
// Server component that preloads the LCP-critical font face(s) for the rendered
// template, resolved by variant where the display font changes.
//
// Why: published pages SSR through `p/[slug]`, whose shared `p/layout` statically
// preloads only the broadly-shared near-body faces (Inter 400 + Inter Tight 400).
// The hero HEADLINE — the LCP element — uses the template's *display* face at a
// heavier weight that the layout can't know about. Without a preload the browser
// only discovers it after HTML → CSS → @font-face, pushing mobile LCP past 2s.
//
// Fonts are self-hosted on the page's own origin (see fonts-self-hosted.css), so
// preload here is a pure same-origin early-fetch — no extra DNS/TLS hop.
//
// This is ADDITIVE to the layout preloads: each entry below is a face the layout
// does NOT already cover.
import ReactDOM from 'react-dom';
import type { TemplateId } from '@/types/service';

/**
 * LCP-critical faces to preload for a (templateId, variantId) pair.
 * Returns hrefs under /fonts/ (same-origin, woff2).
 */
function criticalFontHrefs(
  templateId: TemplateId | null | undefined,
  variantId: string | null | undefined
): string[] {
  switch (templateId) {
    case 'meridian':
      // Hero headline = Inter Tight (display). Default/light variants render the
      // headline at 600; the `marketing` variant rescales it to 500.
      // Body + subhead (Inter 400 / Inter Tight 400) are preloaded in the layout.
      return variantId === 'marketing'
        ? ['/fonts/inter-tight/inter-tight-latin-500-normal.woff2']
        : ['/fonts/inter-tight/inter-tight-latin-600-normal.woff2'];

    case 'lex':
      // Body = Inter Tight 400 (layout). Hero headline = display face, which the
      // variant swaps. Source Serif 4 is a single variable file (covers 500).
      switch (variantId) {
        case 'clinical':
          return ['/fonts/lora/lora-latin-500-normal.woff2'];
        case 'civic':
          return ['/fonts/eb-garamond/eb-garamond-latin-500-normal.woff2'];
        default: // statesman
          return ['/fonts/source-serif-4/source-serif-4-latin-opsz-normal.woff2'];
      }

    case 'hearth':
      // Neither Hearth face is in the layout preloads: Fraunces (display/LCP,
      // variable) + DM Sans 400 (body).
      return [
        '/fonts/fraunces/fraunces-latin-opsz-normal.woff2',
        '/fonts/dm-sans/dm-sans-v17-latin-regular.woff2',
      ];

    case 'granth':
      // Hero NAME (LCP) = Tiro Devanagari Hindi 400 (Devanagari subset). The
      // `adhunik` variant swaps the display face to Mukta; preload its 400.
      // Devanagari subset file, since the hero name is Hindi.
      return variantId === 'adhunik'
        ? ['/fonts/mukta/mukta-devanagari-400-normal.woff2']
        : ['/fonts/tiro-devanagari-hindi/tiro-devanagari-hindi-devanagari-400-normal.woff2'];

    case 'vestria':
      // Hero headline (LCP) = the variant's display face (typeface variants swap
      // it — see vestria/tokens.ts serializeVariantOverrides). Body faces are
      // small enough to ride the CSS discovery path. Italic covers the hero
      // <em> accent (the `modern` variant renders its em upright — no italic file).
      switch (variantId) {
        case 'modern':
          return ['/fonts/space-grotesk/space-grotesk-latin-wght-normal.woff2'];
        case 'heritage':
          return [
            '/fonts/cormorant-garamond/cormorant-garamond-latin-wght-normal.woff2',
            '/fonts/cormorant-garamond/cormorant-garamond-latin-wght-italic.woff2',
          ];
        default: // tailored
          return [
            '/fonts/bodoni-moda/bodoni-moda-latin-opsz-normal.woff2',
            '/fonts/bodoni-moda/bodoni-moda-latin-opsz-italic.woff2',
          ];
      }

    case 'atelier':
      // Hero headline (LCP) = the display face. `editorial` (baseline) uses
      // Bricolage Grotesque (variable wght); `compact` swaps display to Fraunces
      // (variable opsz, single file). Body = Hanken Grotesk rides the CSS
      // discovery path (small near-body weights), like the other grotesk templates.
      return variantId === 'compact'
        ? ['/fonts/fraunces/fraunces-latin-opsz-normal.woff2']
        : ['/fonts/bricolage-grotesque/bricolage-grotesque-latin-wght-normal.woff2'];

    default:
      return [];
  }
}

export function CriticalFontPreload({
  templateId,
  variantId,
}: {
  templateId: TemplateId | null | undefined;
  variantId: string | null | undefined;
}) {
  for (const href of criticalFontHrefs(templateId, variantId)) {
    ReactDOM.preload(href, {
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    });
  }
  return null;
}

export default CriticalFontPreload;
