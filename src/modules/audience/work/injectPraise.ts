// src/modules/audience/work/injectPraise.ts
// ============================================================================
// WORK PRAISE INJECTOR — work-LOCAL (plan design decision #9).
//
// Maps EVERY stated praise string VERBATIM into the `proof` section's `quotes`
// collection, in facts order. This is the FACTS-LAW seam for proof: real client
// words land on the page byte-for-byte, at PARSE time (code, not the LLM), so
// there is zero rewrite / invention / attribution risk.
//
// Why work-LOCAL and NOT the service `injectRealTestimonials`
// (src/modules/audience/service/parseCopy.ts) — three shape mismatches:
//   1. service targets sections['testimonials']; the work proof key is `proof`.
//   2. service picks a SINGLE best quote (drops the rest); work keeps ALL praise.
//   3. service expects ScrapedTestimonial OBJECTS; work praise is `string[]`.
// So the service seam would silently no-op (wrong key) and drop praise even if
// re-keyed. This injector is the correct-shaped work equivalent.
//
// LAW:
//   • Every praise string present, VERBATIM, in facts order.
//   • Zero invention, zero padding beyond the stated list.
//   • Deterministic clamp to the contract max (`proof.quotes` max = 3) if over —
//     first N kept (contract law: amend the contract, never bypass it).
//   • FACTS-LAW STRIP: when a `proof` section exists but praise is empty/absent,
//     force its `quotes` to [] — a misbehaving LLM may have written a fabricated
//     testimonial there, and zero-fabrication demands we strip it (never no-op it
//     through to output).
//   • No-op when the page has no `proof` section (defensive).
//
// The `text` field carries the verbatim string; `source` is omitted (tolerated —
// the scrape/facts shape carries no attribution, and an invented one would be a
// fabricated claim). Item `id`s are backfilled downstream (system fillMode).
// ============================================================================

import type { SectionCopy } from '@/types/generation';
import { workElementContract } from '@/modules/engines/workSections';

/** The proof section key + its praise collection key (from the frozen contract). */
const PROOF_SECTION = 'proof';
const QUOTES_KEY = 'quotes';

/** The contract max for `proof.quotes` — law-driven, never hard-coded here. */
export function proofQuotesMax(): number {
  return (
    workElementContract[PROOF_SECTION]?.collections?.[QUOTES_KEY]?.constraints.max ?? 3
  );
}

/**
 * Inject every praise string verbatim into `proof.quotes`. Mutates and returns
 * the same sections map. No-op when the page has no `proof` section. When a
 * `proof` section exists but praise is empty/absent, its `quotes` are stripped to
 * [] (facts-law: never let an LLM-written testimonial survive to output).
 */
export function injectPraise(
  sections: Record<string, SectionCopy>,
  praise: string[] | undefined
): Record<string, SectionCopy> {
  const section = sections[PROOF_SECTION];
  if (!section || !section.elements) return sections; // no proof section → no-op

  // No stated praise → strip anything the model may have written (fabrication guard).
  if (!praise?.length) {
    (section.elements as Record<string, unknown>)[QUOTES_KEY] = [];
    return sections;
  }

  const max = proofQuotesMax();
  const kept = praise.slice(0, max); // deterministic clamp — first N, facts order

  (section.elements as Record<string, unknown>)[QUOTES_KEY] = kept.map((text) => ({
    text,
  }));

  return sections;
}
