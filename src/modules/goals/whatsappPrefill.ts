// src/modules/goals/whatsappPrefill.ts
// scale-05 (phase 6) — deterministic WhatsApp prefill message.
//
// PURE module (NO 'use client', NO AI, NO network). Builds the prefilled
// WhatsApp `?text=` body from Brief facts by pure string interpolation, so the
// same message is materialized at generation writeback (bridge.ts) and can be
// recomputed anywhere without a provider call. Design call #3 / §11.6: NO AI.
//
// Facts keys mirror what `src/modules/brief/classify.ts` writes onto
// `EntryFacts` — `businessName` and `offer`. Callers pass those two slots (the
// GeneratingSteps source them from the wizard store).

/** The two Brief slots the prefill reads. Both optional — see degradation. */
export interface WhatsappFacts {
  businessName?: string | null;
  offer?: string | null;
}

/** Trimmed value, or undefined when absent/blank. */
function clean(v: string | null | undefined): string | undefined {
  const t = typeof v === 'string' ? v.trim() : '';
  return t.length > 0 ? t : undefined;
}

/**
 * Build the deterministic WhatsApp prefill body from facts.
 *
 * - businessName + offer → `Hi {businessName}, I found your website — interested in {offer}`
 * - businessName, no offer → `Hi {businessName}, I found your website and I'm interested.`
 * - no businessName (facts absent/blank) → `Hi, I found your website and I'm interested.`
 *
 * Pure: no randomness, no AI, no network. Same input ⇒ same output.
 */
export function buildWhatsappPrefill(facts?: WhatsappFacts | null): string {
  const businessName = clean(facts?.businessName);
  const offer = clean(facts?.offer);

  if (businessName && offer) {
    return `Hi ${businessName}, I found your website — interested in ${offer}`;
  }
  if (businessName) {
    return `Hi ${businessName}, I found your website and I'm interested.`;
  }
  return `Hi, I found your website and I'm interested.`;
}
