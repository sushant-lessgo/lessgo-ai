// src/modules/social/presets.ts
// Data-driven per-platform preset table. This is the ONLY place platform
// personality lives. Adding / activating a platform is a DATA change here (a
// preset row + an `ACTIVE_PLATFORMS` entry) — NEVER a new code path in the
// engine, route, or UI. Phase 6 activates x + facebook by flipping DATA only.
//
// PURE data + types. No runtime imports, no AI, safe to read anywhere.

import type { Platform } from './types';

/**
 * Per-platform generation constraints. Consumed by `buildSocialPostPrompt`
 * (injected as explicit prompt constraints) and by `validatePostOutput`
 * (`maxChars` hard length check).
 */
export interface PlatformPreset {
  /** Human label for pickers / badges. */
  label: string;
  /** Hard upper bound on generated post length (characters). */
  maxChars: number;
  /** One-line tone directive fed to the model. */
  tone: string;
  /** Formatting guidance (paragraphs, line breaks, emoji policy). */
  formatHints: string;
  /** Hashtag policy for this platform. */
  hashtagGuidance: string;
}

/**
 * Every platform has a preset row (typed + present), but only those listed in
 * `ACTIVE_PLATFORMS` are selectable. X + Facebook rows are fully typed and
 * present NOW so phase 6 activates them by editing `ACTIVE_PLATFORMS` alone.
 *
 * `x.maxChars = 280` is a fact about the platform (not a phase-6 decision), so
 * it is correct today even while X is inactive.
 */
export const PLATFORM_PRESETS: Record<Platform, PlatformPreset> = {
  linkedin: {
    label: 'LinkedIn',
    maxChars: 1300,
    tone: 'professional-warm, credible, first-person, no corporate jargon or hype',
    formatHints:
      'Open with a strong hook line. Use short paragraphs (1-3 sentences) separated by blank lines for scannability. End with a clear point or soft call to reflection. No markdown headings, no bullet-list markup.',
    hashtagGuidance:
      '0-3 relevant hashtags at the very end, only if they add reach; never stuff.',
  },

  // ---- Activated in phase 6 by adding them to ACTIVE_PLATFORMS (DATA only) ----
  x: {
    label: 'X',
    maxChars: 280,
    tone: 'punchy, conversational, one sharp idea, no filler',
    formatHints:
      'A single tight thought. No preamble. Line breaks only if they sharpen it. Fit comfortably under the character limit.',
    hashtagGuidance: '0-1 hashtag maximum; usually none.',
  },
  facebook: {
    label: 'Facebook',
    maxChars: 700,
    tone: 'conversational-warm, personable, community-oriented',
    formatHints:
      'Friendly opening. Short paragraphs separated by blank lines. An optional question or light call-to-action at the end.',
    hashtagGuidance: '0-2 hashtags at most; optional.',
  },
};

/**
 * The platforms a user may currently select. Phase 6 sets this to
 * `['linkedin','x','facebook']` — DATA change only, no code path added.
 */
export const ACTIVE_PLATFORMS: Platform[] = ['linkedin', 'x', 'facebook'];

/** True when a platform is currently selectable (preset present AND active). */
export function isPlatformActive(platform: Platform): boolean {
  return ACTIVE_PLATFORMS.includes(platform);
}
