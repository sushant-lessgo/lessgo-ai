// src/modules/audience/work/pricePosition.ts
// ============================================================================
// WORK PRICE POSITION — derived band (premium | middle | friendly).
//
// Phase-A ships the price MODE/AMOUNT per group (WorkPrice, workFacts.schema.ts)
// but NOT the premium/middle/friendly POSITION the voice key needs. Rather than
// add a new wizard slot / contract field, this module DERIVES the band in pure
// code from signals already present in WorkFacts. No schema change, no AI.
//
// ── THE RUBRIC (documented; the ONE place it lives) ─────────────────────────
//   Two opposing scores are summed from three signal families, then netted.
//   `'middle'` is the SAFE DEFAULT — a band only wins when it clears the net
//   threshold, so ambiguous/thin facts stay middle.
//
//   PREMIUM signals (+premiumScore):
//     • any group priced `on-request`            +1  (concealed price = premium
//                                                     positioning)
//     • a high stated amount (max >= HIGH_HINT)  +1  (currency-naive hint; a
//                                                     weak tiebreak — see note)
//     • dreamClient text carries premium words   +2  (strongest signal — who the
//                                                     seller wants says the most)
//     • praise text carries premium words        +1
//
//   FRIENDLY signals (+friendlyScore):
//     • a low stated amount (max <= LOW_HINT)     +1  (currency-naive hint)
//     • dreamClient text carries friendly words   +2
//     • every priced group uses `from` mode       +1  (entry-level / accessible
//                                                     "from X" pricing)
//
//   CLASSIFY on net = premiumScore − friendlyScore:
//     net >= +2  → 'premium'
//     net <= -2  → 'friendly'
//     otherwise  → 'middle'  (the default; on-request-only with no other signal
//                             stays middle — conservative, not auto-premium)
//
//   AMOUNT HINTS are deliberately WEAK (+1 each, never decisive alone) because a
//   single absolute threshold cannot span currencies (EUR studio vs INR studio).
//   Keywords + mode dominate; amounts only tiebreak. HIGH_HINT / LOW_HINT are
//   track-E tuning knobs, not law.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   Pure code. `import type` only. No react / stores / hooks / templateId.
// ============================================================================

import type { WorkFacts } from '@/lib/schemas/workFacts.schema';

export type PricePosition = 'premium' | 'middle' | 'friendly';

/** Safe default when signals are thin/ambiguous. */
export const DEFAULT_PRICE_POSITION: PricePosition = 'middle';

/** Currency-naive amount hints — WEAK tiebreak only (track-E tuning knobs). */
export const HIGH_AMOUNT_HINT = 2000;
export const LOW_AMOUNT_HINT = 300;

/** Net score needed for a band to beat the `'middle'` default. */
export const NET_THRESHOLD = 2;

// Lowercased word stems matched as substrings against dreamClient / praise text.
const PREMIUM_WORDS = [
  'premium',
  'luxury',
  'high-end',
  'high end',
  'discerning',
  'exclusive',
  'bespoke',
  'editorial',
  'timeless',
  'refined',
  'considered',
  'selective',
  'discreet',
  'elevated',
  'sophisticated',
  'uncompromising',
  'flagship',
  'couture',
];

const FRIENDLY_WORDS = [
  'affordable',
  'budget',
  'everyday',
  'accessible',
  'friendly',
  'value',
  'local families',
  'families',
  'students',
  'small business',
  'startups',
  'starter',
  'casual',
  'fun',
  'approachable',
];

function hasWord(haystack: string, words: string[]): boolean {
  const h = haystack.toLowerCase();
  return words.some((w) => h.includes(w));
}

/**
 * Derive the price position band from WorkFacts. Pure, deterministic, no AI.
 * See the file header for the full rubric. Returns `'middle'` by default.
 */
export function derivePricePosition(facts: WorkFacts | null | undefined): PricePosition {
  if (!facts) return DEFAULT_PRICE_POSITION;

  const groups = facts.groups ?? [];
  const prices = groups.map((g) => g.price).filter(Boolean);

  const onRequestPresent = prices.some((p) => p.mode === 'on-request');
  const pricedGroups = prices.filter((p) => p.mode !== 'on-request' && p.amount !== undefined);
  const amounts = pricedGroups.map((p) => p.amount as number);
  const maxAmount = amounts.length ? Math.max(...amounts) : undefined;
  const allFromMode =
    pricedGroups.length > 0 && pricedGroups.every((p) => p.mode === 'from');

  const dreamClient = facts.dreamClient ?? '';
  const praiseText = (facts.praise ?? []).join(' ');

  let premium = 0;
  let friendly = 0;

  // ── premium signals ──
  if (onRequestPresent) premium += 1;
  if (maxAmount !== undefined && maxAmount >= HIGH_AMOUNT_HINT) premium += 1;
  if (hasWord(dreamClient, PREMIUM_WORDS)) premium += 2;
  if (hasWord(praiseText, PREMIUM_WORDS)) premium += 1;

  // ── friendly signals ──
  if (maxAmount !== undefined && maxAmount <= LOW_AMOUNT_HINT) friendly += 1;
  if (hasWord(dreamClient, FRIENDLY_WORDS)) friendly += 2;
  if (allFromMode) friendly += 1;

  const net = premium - friendly;
  if (net >= NET_THRESHOLD) return 'premium';
  if (net <= -NET_THRESHOLD) return 'friendly';
  return DEFAULT_PRICE_POSITION;
}
