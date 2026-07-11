// src/modules/social/mockPosts.ts
// DETERMINISTIC mock post generator for env-mock mode + tests. No Math.random(),
// no Date.now() — same inputs always yield the same output. Every mock includes
// `ctx.businessName` so tests can assert brand data flowed through, and every
// mock respects the platform's `maxChars` (especially X's 280).
//
// Pure module: no AI, no Prisma, no next/*, no 'use client' imports.

import type { Archetype, Mode, Platform } from './types';
import type { BrandContext } from './types';
import { PLATFORM_PRESETS } from './presets';

export interface GetMockPostArgs {
  platform: Platform;
  mode: Mode;
  ctx: BrandContext;
  archetype?: Archetype;
  freshContext?: string;
  draft?: string;
}

/** Deterministic per-archetype opening line. */
const ARCHETYPE_OPENER: Record<Archetype, string> = {
  inspirational: 'Some things are worth building slowly and well.',
  product_spotlight: 'Here is one thing we are genuinely proud of.',
  testimonial_quote: 'Nothing beats hearing it from the people we serve.',
  tip: 'A small tip that makes a real difference:',
  announcement: 'A quick update we are excited to share.',
};

/**
 * Trim `text` to at most `maxChars` on a word boundary where possible, without
 * ever exceeding the limit. Deterministic.
 */
function clampToLimit(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const hard = text.slice(0, maxChars);
  const lastSpace = hard.lastIndexOf(' ');
  // Only cut on a space if it doesn't lose more than ~30% of the budget.
  if (lastSpace > maxChars * 0.7) return hard.slice(0, lastSpace);
  return hard;
}

/**
 * Deterministic, plausible on-brand-ish mock text. Includes the business name
 * (falls back to a stable placeholder) and honors the platform char limit.
 */
export function getMockPost(args: GetMockPostArgs): string {
  const { platform, mode, ctx, archetype, freshContext, draft } = args;
  const preset = PLATFORM_PRESETS[platform];
  const name = ctx.businessName ?? 'our brand';

  let body: string;

  if (mode === 'polish') {
    const source = (draft ?? '').trim();
    body = source
      ? `${source}\n\n— polished for ${platform} by ${name}.`
      : `${name} — a polished ${platform} post.`;
  } else {
    const opener = ARCHETYPE_OPENER[archetype ?? 'inspirational'];
    const offerLine = ctx.offer ? ` ${ctx.offer}.` : '';
    const contextLine =
      mode === 'archetype_context' && freshContext ? ` ${freshContext.trim()}` : '';
    body =
      `${opener}\n\n` +
      `At ${name}, we focus on what actually matters to the people we serve.${offerLine}${contextLine}`;
  }

  return clampToLimit(body.trim(), preset.maxChars);
}
