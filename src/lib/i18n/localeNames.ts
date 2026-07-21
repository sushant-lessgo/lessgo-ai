// src/lib/i18n/localeNames.ts — language-settings phase 1.
//
// PLAIN module — NOT `'use client'`, and it imports NOTHING client-side.
// Server-side prompt builders (`scopedRegen`, the audience copy prompts) and the
// published/static-export path consume `toPromptLanguage` / `labelToLocaleCode`,
// so pulling a `'use client'` module in here would re-open the published/client
// boundary trap ("F is not a function" at /p/{slug}). Only `localeContent.ts`
// (itself plain) is imported.
//
// TWO NAME MAPS, DELIBERATELY DISTINCT JOBS (plan ruling 3):
//
//  · `LOCALE_DISPLAY_NAMES` — NATIVE endonyms (`Nederlands`, `日本語`). UI ONLY
//    (language pills, the Languages panel). Moved here verbatim from the
//    `'use client'` LanguageToggle.tsx, which now re-exports it for back-compat.
//  · `LOCALE_ENGLISH_NAMES` — English EXONYMS (`Dutch`, `Japanese`). PROMPTS ONLY.
//    The generation prompts interpolate the value into English instructions
//    ("no English fragments (unless ${language} IS English)") — a native name
//    would read "unless Nederlands IS English". The work engine already speaks
//    exonyms (`'Dutch'`), so this keeps every engine on one vocabulary.
//
// `LOCALE_LABEL_TO_CODE` is the inverse of BOTH maps: it turns a human label
// (from the work engine's free-text `languages` question, which stores labels
// like `'English'`, never codes) back into an ISO code. Unmapped labels return
// `null` — the caller must then NOT write a localeConfig (a code outside
// SUPPORTED_LOCALES is not a legal declaration).

import { SUPPORTED_LOCALES } from './localeContent';

/** Native display names (endonyms) — UI surfaces only, never prompts. */
export const LOCALE_DISPLAY_NAMES: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  it: 'Italiano',
  id: 'Indonesia',
  nl: 'Nederlands',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  de: 'Deutsch',
  pl: 'Polski',
};

/** UI label for a locale code; unmapped ⇒ the uppercased code. */
export function localeLabel(code: string): string {
  return LOCALE_DISPLAY_NAMES[code] || code.toUpperCase();
}

/**
 * English exonyms — the ONLY names that may reach an AI prompt (ruling 3).
 * Covers every entry of SUPPORTED_LOCALES; `localeNames.test.ts` pins parity.
 */
export const LOCALE_ENGLISH_NAMES: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  it: 'Italian',
  id: 'Indonesian',
  nl: 'Dutch',
  th: 'Thai',
  vi: 'Vietnamese',
  de: 'German',
  pl: 'Polish',
};

/**
 * Prompt-facing language name for a locale code. Unknown code ⇒ the code itself
 * (callers that must not leak raw input validate against SUPPORTED_LOCALES
 * BEFORE calling — see phase 4's `resolvePromptLanguage`).
 */
export function toPromptLanguage(code: string): string {
  return LOCALE_ENGLISH_NAMES[code] ?? code;
}

/**
 * Inverse of both name maps: label (native OR English exonym) → ISO code.
 * Keys are the labels exactly as written; use `labelToLocaleCode()` for
 * trim/case-insensitive lookup.
 */
export const LOCALE_LABEL_TO_CODE: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const code of SUPPORTED_LOCALES) {
    const native = LOCALE_DISPLAY_NAMES[code];
    const english = LOCALE_ENGLISH_NAMES[code];
    if (native) map[native] = code;
    // English name wins on collision only when it points at the same code
    // ('English' → 'en' in both maps), so ordering is irrelevant today.
    if (english) map[english] = code;
  }
  return map;
})();

/** Case/whitespace-insensitive index over LOCALE_LABEL_TO_CODE. */
const NORMALIZED_LABEL_TO_CODE: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [label, code] of Object.entries(LOCALE_LABEL_TO_CODE)) {
    map[label.trim().toLowerCase()] = code;
  }
  return map;
})();

/**
 * Human label → supported ISO code, or `null` when the label is not one of the
 * 12 supported languages (e.g. `'Hindi'` — a real work-engine answer, but `hi`
 * is not in SUPPORTED_LOCALES, so no localeConfig may be written for it).
 * Non-string input is tolerated and returns `null`.
 */
export function labelToLocaleCode(label: unknown): string | null {
  if (typeof label !== 'string') return null;
  const key = label.trim().toLowerCase();
  if (!key) return null;
  return NORMALIZED_LABEL_TO_CODE[key] ?? null;
}
