/**
 * Logo resolution (editor phase-3, phase 5).
 *
 * PLAIN module — imported by BOTH the edit renderer and the published renderer, so
 * NO 'use client', no React, no hooks. The 'use client' editing UI lives in
 * `EditableLogo`; published blocks import ONLY this module.
 *
 * The logo is SITE-SCOPED: one value the nav (LIGHT surface) and footer (DARK
 * surface) both derive from. A single asset does not suffice — a dark-colored mark
 * vanishes on the dark footer — so an OPTIONAL dark-surface asset (`logoUrlDark`,
 * MECHANISM A) is preferred on the dark surface.
 *
 * Resolution (empty string treated as UNSET, same discipline as `resolveAlt`):
 *  - surface 'light' (header): globalSettings.logoUrl → section logo_image → wordmark
 *  - surface 'dark'  (footer): globalSettings.logoUrlDark → globalSettings.logoUrl →
 *                              section logo_image → wordmark
 *
 * Back-compat (naayom safety): a project with ONLY the legacy per-section
 * `logo_image` set (no globalSettings) resolves to that image on BOTH surfaces —
 * byte-identical to pre-phase-5 rendering. The live logo can never blank.
 */

import type { Surface } from './primitiveTypes';

/** Site-scoped logo settings (subset of `globalSettings`). */
export interface LogoGlobalSettings {
  logoUrl?: string;
  logoUrlDark?: string;
}

/** Per-section legacy logo fields a block carries. */
export interface LogoSectionContent {
  /** Legacy per-section uploaded logo (pre-phase-5 techpremium path). */
  logo_image?: string;
  /** Wordmark / text fallback (header: `logo_text`; footer: `wordmark`). */
  wordmark?: string;
}

/**
 * What the block should render: a resolved image URL, or the wordmark text.
 */
export type ResolvedLogo =
  | { kind: 'image'; url: string }
  | { kind: 'wordmark'; text: string };

/** Empty/non-string ⇒ unset. */
function firstNonEmpty(...vals: Array<string | undefined>): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

/**
 * Resolve the logo for a target surface. See module doc for the fallback chains.
 */
export function resolveLogo(
  globalSettings: LogoGlobalSettings | undefined,
  sectionContent: LogoSectionContent | undefined,
  surface: Surface,
): ResolvedLogo {
  const gs = globalSettings || {};
  const sc = sectionContent || {};

  const url =
    surface === 'dark'
      ? firstNonEmpty(gs.logoUrlDark, gs.logoUrl, sc.logo_image)
      : firstNonEmpty(gs.logoUrl, sc.logo_image);

  if (url) return { kind: 'image', url };

  return { kind: 'wordmark', text: firstNonEmpty(sc.wordmark) ?? '' };
}
