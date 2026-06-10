// src/modules/audience/product/accentFallback.ts
// Deterministic <em>...</em> wrapper for Meridian HEADLINES when the LLM omits
// the accent convention. Mirror of audience/service/italicAccentFallback.ts,
// but the Meridian accent is RESTRAINED Modern-Tech: only `headline` keys get
// an accent (NOT ledes), and the renderer styles <em> as accent-COLOR (upright)
// — never italic. Picks the longest non-stopword token (>=5 chars) and wraps
// it. No-op if <em> already present. Always runs as a safety net.

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
 * Element keys that get the accent treatment. Meridian = HEADLINE ONLY.
 */
const ACCENT_KEYS = new Set<string>(['headline']);

/**
 * Sections whose headline carries the accent. Meridian's accent budget is
 * deliberately small — only the hero and the cta headline get an <em> word.
 * (The fallback never accents features/pricing/testimonials headlines.)
 */
const ACCENT_SECTIONS = new Set<string>(['hero', 'cta']);

/**
 * Take alphabetic tokens >= 5 chars, drop stopwords, prefer the longest.
 * Tie-break by last position (closer to end → more emphatic).
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

function wrapToken(value: string, token: string): string {
  const idx = value.indexOf(token);
  if (idx < 0) return value;
  return value.slice(0, idx) + `<em>${token}</em>` + value.slice(idx + token.length);
}

/**
 * Apply accent fallback to a single string value. Returns the original if it
 * already contains <em>, has no eligible token, or is empty/non-string.
 */
export function applyAccentEmFallbackToValue(value: unknown): unknown {
  if (typeof value !== 'string' || !value.trim()) return value;
  if (/<em\b/i.test(value)) return value;

  const token = pickAccentToken(value);
  if (!token) return value;

  return wrapToken(value, token);
}

/**
 * Walk a SectionCopy map and apply the fallback to the `headline` element of
 * the hero + cta sections only. Mutation-free; returns a new object.
 */
export function applyAccentEmFallback(
  sections: Record<string, SectionCopy>
): Record<string, SectionCopy> {
  const result: Record<string, SectionCopy> = {};

  for (const [sectionType, sectionCopy] of Object.entries(sections)) {
    const elements = sectionCopy.elements ?? {};
    const next: Record<string, unknown> = { ...elements };

    if (ACCENT_SECTIONS.has(sectionType)) {
      for (const key of Object.keys(next)) {
        if (ACCENT_KEYS.has(key)) {
          next[key] = applyAccentEmFallbackToValue(next[key]);
        }
      }
    }

    result[sectionType] = { ...sectionCopy, elements: next as SectionCopy['elements'] };
  }

  return result;
}
