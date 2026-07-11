// src/modules/brief/serveMatrix.ts
// serve-gate-v2 phase 3 — admin serveability matrix unification.
//
// PURE / firewall-safe: no React, no component imports. `/admin` (a server
// component) imports this so the Business Types serveability display is the
// REAL `decideServe` output per businessType × likelyIntent — gate and admin
// can never disagree (design decision 6).
//
// The synthetic EntrySignals MUST fill EVERY field with a neutral default,
// mirroring `makeSignals` in serveGate.test.ts exactly. Missing fields would
// produce silently wrong decisions.

import { buildBriefDraft, type EntrySignals } from './classify';
import { decideServe, type ServeDecision } from './serveGate';
import {
  businessTypes,
  businessTypeKeys,
  type BusinessTypeKey,
} from '@/modules/businessTypes/config';
import type { GoalIntent } from '@/modules/goals/vocabulary';

/**
 * Build the neutral synthetic EntrySignals for a businessType × intent probe.
 * Every field mirrors `makeSignals` (serveGate.test.ts) at its neutral value;
 * only businessTypeGuess, goalIntentGuess and structureHint are meaningful.
 */
function matrixSignals(
  key: BusinessTypeKey,
  intent: GoalIntent,
  structureHint: 'single' | 'multi'
): EntrySignals {
  return {
    businessTypeGuess: key,
    businessTypeConfidence: 0.9,
    category: null,
    goalIntentGuess: intent,
    tiebreaker: 'none',
    structureHint,
    designStyleHint: null,
    platformNeeds: 'none',
    summary: 'A business.',
    businessName: 'Acme',
    offerings: [],
    audiences: [],
    categories: [],
    outcomes: [],
    deliveryModel: null,
    offer: '',
    oneLiner: 'We do things.',
    proofAvailable: [],
    socialProfiles: [],
    testimonials: [],
  };
}

export interface ServeMatrixRow {
  businessType: BusinessTypeKey;
  intent: GoalIntent;
  decision: ServeDecision;
}

/**
 * The real serveability matrix: for each businessType × its likelyIntents,
 * run the synthetic signals through the REAL classifier (`buildBriefDraft`)
 * and the REAL gate (`decideServe`). `structureHint` defaults to the entry's
 * `structureDefault`; inference is a soft signal so this never changes a row.
 */
export function serveabilityMatrix(): ServeMatrixRow[] {
  const rows: ServeMatrixRow[] = [];
  for (const key of businessTypeKeys) {
    const entry = businessTypes[key];
    for (const intent of entry.likelyIntents) {
      const brief = buildBriefDraft(
        matrixSignals(key, intent, entry.structureDefault),
        entry.label
      );
      rows.push({ businessType: key, intent, decision: decideServe(brief) });
    }
  }
  return rows;
}
