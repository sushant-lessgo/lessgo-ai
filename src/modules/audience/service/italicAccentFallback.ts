// src/modules/service/copy/italicAccentFallback.ts
// Deterministic <em>...</em> wrapper for Hearth headlines / ledes when the LLM
// omits the italic-accent convention. Picks the longest non-stopword token
// (>=5 chars) in the string and wraps it. No-op if <em> already present.
//
// Phase 6 may tune the prompt to reduce reliance on this; it always runs as
// a safety net so accent never goes missing.

import type { SectionCopy } from '@/types/generation';

const STOPWORDS = new Set<string>([
  'a','an','and','as','at','be','but','by','for','from','if','in','is','it',
  'its','of','on','or','our','so','that','the','their','this','to','we','will',
  'with','you','your','yours','i','me','my','they','them','these','those',
  'are','was','were','have','has','had','do','does','did','can','could','should',
  'would','than','then','what','when','which','who','how','about','into','onto',
  'over','under','through','before','after','again','also','just','very','more',
  'most','some','any','all','no','not','one','two','three','only',
]);

/**
 * Element keys that get the italic-accent treatment. Mirrors the convention
 * declared in serviceElementSchema (only `headline` and `lede` are display
 * fields where italic accent is the visual signature).
 */
const ITALIC_ACCENT_KEYS = new Set<string>(['headline', 'lede']);

/**
 * Extract candidate words and return the token to wrap.
 * Strategy: take alphabetic tokens >= 5 chars, drop stopwords, prefer the
 * longest. Tie-break by last position (closer to end → more emphatic).
 */
function pickAccentToken(value: string): string | null {
  // Skip if HTML tags exist anywhere — avoid mangling pre-formatted strings.
  if (/<[a-z][^>]*>/i.test(value)) return null;

  const tokens = value.match(/[A-Za-z][A-Za-z'-]+/g);
  if (!tokens) return null;

  let best: { token: string; index: number } | null = null;
  let cursor = 0;
  for (const tok of tokens) {
    const idx = value.indexOf(tok, cursor);
    cursor = idx + tok.length;
    const lower = tok.toLowerCase();
    if (lower.length < 5 || STOPWORDS.has(lower)) continue;
    if (!best || tok.length > best.token.length || tok.length === best.token.length) {
      best = { token: tok, index: idx };
    }
  }

  return best?.token ?? null;
}

/**
 * Wrap the chosen token at its position. Replaces only the first match to
 * avoid mangling repeated words.
 */
function wrapToken(value: string, token: string): string {
  const idx = value.indexOf(token);
  if (idx < 0) return value;
  return (
    value.slice(0, idx) +
    `<em>${token}</em>` +
    value.slice(idx + token.length)
  );
}

/**
 * Apply italic-accent fallback to a single string value.
 * Returns the original string if it already contains <em>, has no eligible
 * token, or is empty/non-string.
 */
export function applyItalicEmFallbackToValue(value: unknown): unknown {
  if (typeof value !== 'string' || !value.trim()) return value;
  if (/<em\b/i.test(value)) return value;

  const token = pickAccentToken(value);
  if (!token) return value;

  return wrapToken(value, token);
}

/**
 * Walk a SectionCopy map and apply the fallback to every `headline` / `lede`
 * element. Mutation-free; returns a new object.
 */
export function applyItalicEmFallback(
  sections: Record<string, SectionCopy>
): Record<string, SectionCopy> {
  const result: Record<string, SectionCopy> = {};

  for (const [sectionType, sectionCopy] of Object.entries(sections)) {
    const elements = sectionCopy.elements ?? {};
    const next: Record<string, unknown> = { ...elements };

    for (const key of Object.keys(next)) {
      if (ITALIC_ACCENT_KEYS.has(key)) {
        next[key] = applyItalicEmFallbackToValue(next[key]);
      }
    }

    result[sectionType] = { ...sectionCopy, elements: next as SectionCopy['elements'] };
  }

  return result;
}
