// src/modules/templates/lumen/i18nKeys.ts
// PLAIN, server-safe bilingual helpers (NO 'use client'). Safe to import from
// both edit `.tsx` and published `.published.tsx` (§3f client-boundary rule).
// Lumen's bilingual model = independent twin `_nl` fields; the published page
// carries BOTH via data-en / data-nl and lumen.v1.js toggles them.

export type LumenLang = 'en' | 'nl';

/** Element key for a base key + active language ('headline' → 'headline_nl' in NL). */
export function langKey(baseKey: string, lang: LumenLang): string {
  return lang === 'nl' ? `${baseKey}_nl` : baseKey;
}

/**
 * data-en / data-nl attribute pair for a published text node. Visible text stays
 * EN; lumen.v1.js swaps innerHTML to the matching data-{lang} on toggle/geo.
 * NL falls back to EN when empty so the page never shows blanks.
 */
export function bilingualAttrs(en: string, nl: string): { 'data-en': string; 'data-nl': string } {
  return { 'data-en': en || '', 'data-nl': nl || en || '' };
}
