// src/modules/email/brandContext.ts
// PURE, read-only Brief extractor for email-sequence prompting. No AI, no Prisma,
// no next/*, no 'use client' imports.
//
// The email prompt only needs a compact, honest slice of the Brief:
//   { offer, offerings, audiences, testimonials, proofAvailable }
// drawn from `brief.facts.entry.*` (the scrape/wizard prefill carrier — see
// src/modules/brief/classify.ts EntryFacts) plus top-level `brief.proofAvailable`.
//
// INVARIANT (decision #7): `BriefSchema.facts` is `z.record(z.unknown())`, so
// `facts.entry` is UNTYPED at runtime. Every read here narrows defensively with
// safe fallbacks — a missing, partial, or malformed Brief degrades the prompt
// gracefully and NEVER throws.

import type { Brief } from '@/types/brief';

/** The normalized, prompt-ready slice consumed by the sequence engine. */
export interface EmailBrandContext {
  offer?: string;
  offerings: string[];
  audiences: string[];
  testimonials: string[];
  proofAvailable: string[];
}

type AnyRecord = Record<string, unknown>;

function asRecord(v: unknown): AnyRecord | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as AnyRecord) : undefined;
}

function str(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  }
  return undefined;
}

/** Coerce an unknown value into a clean, deduped array of non-empty strings. */
function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    const s = str(item);
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

/**
 * Build the email brand context from a Brief. Read-only, never throws. Accepts
 * `Brief | null | undefined` (and tolerates a malformed object) — absent fields
 * fall back to empty arrays / undefined `offer`.
 */
export function buildBrandContext(brief: Brief | null | undefined): EmailBrandContext {
  const briefRec = asRecord(brief);
  const facts = asRecord(briefRec?.facts);
  const entry = asRecord(facts?.entry);

  return {
    offer: str(entry?.offer),
    offerings: strArray(entry?.offerings),
    audiences: strArray(entry?.audiences),
    testimonials: strArray(entry?.testimonials),
    proofAvailable: strArray(briefRec?.proofAvailable),
  };
}

/** Whether the context carries at least one usable testimonial. */
export function hasTestimonials(ctx: EmailBrandContext): boolean {
  return ctx.testimonials.length > 0;
}

/**
 * Compact, prompt-ready text block. Omits absent sections instead of emitting
 * empty headings. Always returns a non-empty string (a safe fallback line when
 * the Brief carried nothing) so the prompt never has a blank context section.
 */
export function summarizeBrandContext(ctx: EmailBrandContext): string {
  const lines: string[] = [];

  if (ctx.offer) lines.push(`Offer: ${ctx.offer}`);

  if (ctx.offerings.length > 0) {
    lines.push('Offerings:');
    for (const o of ctx.offerings) lines.push(`- ${o}`);
  }

  if (ctx.audiences.length > 0) {
    lines.push('Audience:');
    for (const a of ctx.audiences) lines.push(`- ${a}`);
  }

  if (ctx.testimonials.length > 0) {
    lines.push('Testimonials (verbatim, honor exactly — do not embellish):');
    for (const t of ctx.testimonials) lines.push(`- "${t}"`);
  }

  if (ctx.proofAvailable.length > 0) {
    lines.push('Available proof:');
    for (const p of ctx.proofAvailable) lines.push(`- ${p}`);
  }

  if (lines.length === 0) {
    return 'No specific brand facts were captured — write generically and honestly, and do not invent facts.';
  }

  return lines.join('\n');
}
