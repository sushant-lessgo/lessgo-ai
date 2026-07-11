// src/lib/i18n/localeContent.ts — i18n-phase-1 foundation (D1).
//
// PLAIN module — NOT `'use client'`. The published renderer + htmlGenerator will
// import it, so it must stay server-safe (published/client boundary law).
//
// The default-locale copy is the flat `content` map (Record<sectionId, SectionData>).
// Non-default locales are a sibling text OVERLAY (LocaleContentOverlay). These pure
// helpers merge overlay-over-base with default-locale fallback, WITHOUT mutating base.
// The single merge funnel: never reimplement per call site (parity-ordering invariant).

import type { SectionData, LocaleContentOverlay, LocaleConfig } from '@/types/core/content';

/**
 * Supported content locales: `en` (conventional default, first) + the 11
 * coverage-100 languages. `SupportedLocale` is derived from this list so the
 * two never drift.
 */
export const SUPPORTED_LOCALES = [
  'en', 'ja', 'es', 'pt', 'fr', 'it', 'id', 'nl', 'th', 'vi', 'de', 'pl',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * True when a project declares more than one locale (i.e. the locale machinery
 * should activate). Absent/empty/single-locale config ⇒ false (invisible).
 */
export function isMultiLocale(config?: LocaleConfig | null): boolean {
  return !!config && Array.isArray(config.locales) && config.locales.length > 1;
}

/**
 * Resolve the effective element values for `locale` by overlaying the locale's
 * text over the default-locale base, WITHOUT mutating `base`.
 *
 * Semantics (D1):
 *  - overlay value for an elementKey wins;
 *  - an absent elementKey falls back to the base (default-locale) value —
 *    including nested V2 collection values (arrays/objects), which pass through
 *    by reference untouched (never deep-merged);
 *  - if `overlay`/`locale` is absent or the locale has no overlay, `base` is
 *    returned AS-IS (same reference — nothing to merge).
 *
 * The merge is shallow at elementKey granularity: overlay carries text only
 * (`string | string[]`), so an overlaid key wholesale-replaces the base value
 * for that key; base values with no overlay key are preserved verbatim.
 */
export function resolveLocaleElements(
  base: Record<string, SectionData>,
  overlay?: LocaleContentOverlay,
  locale?: string,
): Record<string, SectionData> {
  const localeOverlay = overlay && locale ? overlay[locale] : undefined;
  // Nothing to merge → return base untouched (referentially identical).
  if (!localeOverlay) return base;

  const out: Record<string, SectionData> = {};
  for (const sectionId of Object.keys(base)) {
    const section = base[sectionId];
    const sectionOverlay = localeOverlay[sectionId];
    if (!sectionOverlay) {
      // No overlay for this section → keep base section reference.
      out[sectionId] = section;
      continue;
    }
    // New SectionData with a NEW elements object: overlay keys win, base keys
    // (incl. nested collections) fall back. base + base.elements are untouched.
    out[sectionId] = {
      ...section,
      elements: { ...section.elements, ...sectionOverlay },
    };
  }
  return out;
}

/**
 * Single-value resolver with the same fallback semantics as
 * `resolveLocaleElements`: overlay value for (sectionId, elementKey) wins;
 * absent ⇒ base (default-locale) element value; base is never mutated.
 *
 * Returns `undefined` when neither overlay nor base has the key.
 */
export function getEffectiveElementValue(
  base: Record<string, SectionData>,
  overlay: LocaleContentOverlay | undefined,
  locale: string | undefined,
  sectionId: string,
  elementKey: string,
): string | string[] | undefined {
  const overlaid = overlay && locale ? overlay[locale]?.[sectionId]?.[elementKey] : undefined;
  if (overlaid !== undefined) return overlaid;
  return base?.[sectionId]?.elements?.[elementKey];
}
