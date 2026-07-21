// src/lib/i18n/projectLocale.ts — language-settings phase 4.
//
// PLAIN module (no `'use client'`, no client imports, no prisma). It is the ONE
// place where an OUTSIDE-WORLD language value becomes a prompt-facing language
// name, and it is deliberately LENIENT.
//
// TWO SEAMS, TWO FUNCTIONS (plan ruling 11):
//
//  · `resolvePromptLanguage(input)` — FIRST GENERATION. The four audience routes
//    (`product|service` × `strategy|generate-copy`) have no tokenId to bind a
//    Project read to, so the wizard sends the resolved ISO code on the request
//    body. That value is client-controlled, therefore: validate against
//    `SUPPORTED_LOCALES` → fall back to `'en'` on absent/invalid/non-string →
//    map to an English exonym via `toPromptLanguage`. NEVER throws and never
//    400s: language is a PROMPT input, not an authz input, and the worst a
//    forged value could do is generate the user's own page in another language
//    (already possible from the UI). The hard guarantee this function makes is
//    that **raw client input can never reach a prompt** — the return value is
//    always one of the 12 `LOCALE_ENGLISH_NAMES` strings.
//
//  · `readDefaultLocale(content)` — REGENERATION. `scopedRegen` genuinely holds
//    the Project row, so it reads the durable declaration
//    (`content.localeConfig.defaultLocale`) instead of trusting a request field.
//    Safe-parse of untyped JSON: anything that is not a non-empty string at that
//    exact path yields `null` (the caller then defaults to `'en'`).
//
// First-gen and regen agree by construction: both derive from the same wizard
// pick (the payload field and `content.localeConfig` are written from the same
// `siteLanguage`).

import { SUPPORTED_LOCALES } from './localeContent';
import { toPromptLanguage } from './localeNames';

/** English exonym for a validated locale code; ALWAYS falls back to 'English'. */
export function resolvePromptLanguage(input: unknown): string {
  const code =
    typeof input === 'string' &&
    (SUPPORTED_LOCALES as readonly string[]).includes(input.trim())
      ? input.trim()
      : 'en';
  return toPromptLanguage(code);
}

/**
 * `content.localeConfig.defaultLocale` off an untyped `Project.content` JSON, or
 * `null` when the project declares no site language (legacy/monolingual).
 * Unsupported codes are rejected too — a declaration outside the closed
 * vocabulary is not a legal declaration (`localeConfigPatch` never writes one).
 */
export function readDefaultLocale(content: unknown): string | null {
  if (!content || typeof content !== 'object') return null;
  const cfg = (content as Record<string, unknown>)['localeConfig'];
  if (!cfg || typeof cfg !== 'object') return null;
  const def = (cfg as Record<string, unknown>)['defaultLocale'];
  if (typeof def !== 'string') return null;
  const code = def.trim();
  return (SUPPORTED_LOCALES as readonly string[]).includes(code) ? code : null;
}
