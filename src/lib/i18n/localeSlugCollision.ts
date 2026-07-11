// src/lib/i18n/localeSlugCollision.ts — i18n-phase-1 (Phase 6).
//
// Reserved-path collision guard for the publish route. A multi-page subpage slug
// must not equal a declared NON-DEFAULT locale code: the non-default locale doc
// is served at `/{loc}` (+ `/{loc}/{sub}`) via the SAME `route:{domain}:{path}`
// KV key that a subpage `/{slug}` would use, so `/{slug}` and `/{loc}` would
// clobber each other. This pure helper (plain module, server-safe) finds the
// first colliding first-path-segment so the route can reject the publish.
//
// Only fires for multi-locale projects (declared > 1 locale) and only against the
// NON-DEFAULT declared locales (the default stays at root and emits no `/{loc}`
// route). Single-locale publishes therefore see NO new rejection — back-compat law.

import type { LocaleConfig } from '@/types/core/content';
import { isMultiLocale } from './localeContent';

/**
 * Returns the first subpage first-path-segment that collides with a declared
 * non-default locale code, or `null` when there is no collision (incl. every
 * single-locale project — `isMultiLocale` is false).
 */
export function findLocaleSubpageCollision(
  subpagePaths: string[],
  localeConfig: LocaleConfig | null | undefined,
): string | null {
  if (!isMultiLocale(localeConfig)) return null;

  const nonDefault = new Set(
    localeConfig!.locales
      .filter((l) => l !== localeConfig!.defaultLocale)
      .map((l) => String(l).toLowerCase()),
  );
  if (nonDefault.size === 0) return null;

  for (const raw of subpagePaths) {
    const seg = String(raw)
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .split('/')[0]
      .toLowerCase();
    if (seg && nonDefault.has(seg)) return seg;
  }
  return null;
}
