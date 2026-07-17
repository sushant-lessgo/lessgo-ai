// src/lib/leadReply/brandGrounding.ts
// PURE, server-side brand grounding for the lead-reply draft. No 'use client',
// no prisma, no next/*, no AI — a plain module a server route imports. NOT safe
// for client import (it pulls the email brand-context machinery + Brief schema).
//
// B1 (CRITICAL — derive mode from FACTS, not summary/parse):
//   Two signals that LOOK like "is the Brief thin?" are actually dead:
//     1. parse-success — BriefSchema fields are ALL optional, so any non-null
//        object (even `{}`) safeParses OK. Parse success ≠ has facts.
//     2. summary-emptiness — summarizeBrandContext NEVER returns empty; a thin
//        Brief yields the fallback sentence "No specific brand facts were
//        captured…". Empty-summary can't be observed.
//   So mode is derived ONLY from whether buildBrandContext yielded ≥ 1 real
//   fact (offer OR offerings/audiences/testimonials/proofAvailable non-empty).
//   In 'light' mode we ship ONLY the site name — never the fallback sentence.

import { BriefSchema } from '@/lib/schemas/brief.schema';
import {
  buildBrandContext,
  summarizeBrandContext,
  type EmailBrandContext,
} from '@/modules/email/brandContext';

export interface ReplyGrounding {
  mode: 'brief' | 'light';
  summary: string;
}

/** Whether the extracted brand context carries at least one real, usable fact. */
function hasAnyFact(ctx: EmailBrandContext): boolean {
  return (
    Boolean(ctx.offer) ||
    ctx.offerings.length > 0 ||
    ctx.audiences.length > 0 ||
    ctx.testimonials.length > 0 ||
    ctx.proofAvailable.length > 0
  );
}

function lightSummary(siteName: string | null): string {
  const name = siteName?.trim();
  return name
    ? `You are replying on behalf of ${name}.`
    : 'You are replying on behalf of the business.';
}

/**
 * Resolve the grounding for a lead-reply draft from a project's `brief`.
 *
 * - `mode: 'brief'` IFF the Brief yielded ≥ 1 real fact → rich summary from
 *   summarizeBrandContext.
 * - Otherwise (zero facts, parse failure, or null/undefined/non-object/garbage
 *   brief) → `mode: 'light'`, summary = site name only.
 *
 * Never throws.
 */
export function resolveReplyGrounding(
  brief: unknown,
  siteName: string | null
): ReplyGrounding {
  try {
    const parsed = BriefSchema.safeParse(brief);
    if (parsed.success) {
      const ctx = buildBrandContext(parsed.data);
      if (hasAnyFact(ctx)) {
        return { mode: 'brief', summary: summarizeBrandContext(ctx) };
      }
    }
  } catch {
    // Defensive — resolution must never error; degrade to light.
  }
  return { mode: 'light', summary: lightSummary(siteName) };
}
