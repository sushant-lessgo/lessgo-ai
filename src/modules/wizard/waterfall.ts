// src/modules/wizard/waterfall.ts
// scale-06 phase 1 — the QUESTION WATERFALL (scalePlan §8 / spec scope 3).
//
// Resolves every contract field to one of four states, in order:
//   SCRAPED   — a concrete value rode in from URL/scrape prefill
//               (`brief.facts.entry`). Confirmable in review-mode.
//   INFERRED  — no prefill, but a SAFE category-level default exists
//               (businessType-derived). Also confirmable.
//   ASK       — no prefill, no safe inference, and the field is required
//               (or a required-by-satisfaction ask candidate).
//   DROP      — optional + unanswered + not inferable ⇒ the field is skipped
//               and, if it carries a `dropTarget`, that section is CUT
//               (proof hard rule — never faked).
//
// The wizard length is therefore a COMPUTED property:
//   asks = contract.fields where state === 'ask'
// Acceptance (locked in the test): rich-site brief ⇒ ≤3 asks; bare one-liner
// ⇒ ≤6 asks.
//
// PURE MODULE: no store / UI / React imports; deterministic given its inputs.

import type { Brief } from '@/types/brief';
import type { BusinessTypeEntry } from '@/modules/businessTypes/config';
import { getEntryFacts, type EntryFacts } from '@/modules/brief/classify';
import {
  wizardSlots,
  type ContractField,
  type EngineContract,
  type WizardSlot,
} from '@/modules/engines/inputContracts';

export type FieldState = 'scraped' | 'inferred' | 'ask' | 'drop';

/**
 * Minimum brief confidence for a category-level inference to be trusted. Below
 * it, an otherwise-inferable field falls through to ASK (low confidence ⇒ ask
 * rather than guess). `undefined` confidence is treated as sufficient (the
 * entry pipeline has not scored it) so absence never blocks inference.
 */
export const INFER_CONFIDENCE_MIN = 0.5;

function hasEntryValue(entry: EntryFacts | null, key: keyof EntryFacts): boolean {
  if (!entry) return false;
  const v = entry[key];
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim().length > 0;
  return v != null;
}

/** Goal is "scraped" once a concrete destination/param exists (spec: goal param). */
function goalParamPresent(brief: Brief | null | undefined): boolean {
  const g = brief?.goal;
  if (!g) return false;
  if (g.destination != null && (Array.isArray(g.destination) ? g.destination.length > 0 : g.destination.trim().length > 0)) {
    return true;
  }
  const param = g.param;
  if (param && typeof param === 'object') {
    return Object.values(param).some((x) => typeof x === 'string' && x.trim().length > 0);
  }
  return false;
}

/** Proof T2 booleans can also be satisfied by the top-level `proofAvailable`. */
function proofAvailableNonEmpty(brief: Brief | null | undefined): boolean {
  return Array.isArray(brief?.proofAvailable) && (brief!.proofAvailable!.length > 0);
}

function resolveGoalState(
  brief: Brief | null | undefined,
  field: ContractField,
  businessTypeEntry: BusinessTypeEntry | null | undefined,
  canInfer: boolean,
): FieldState {
  if (goalParamPresent(brief)) return 'scraped';
  // Intent already chosen (e.g. entry classifier) but no destination yet.
  if (brief?.goal?.intent) return 'inferred';
  // Safe category-level inference from the businessType's likely intents.
  if (canInfer && field.inferFrom === 'businessType-intent' && businessTypeEntry && businessTypeEntry.likelyIntents.length > 0) {
    return 'inferred';
  }
  return 'ask';
}

function resolveFieldState(
  brief: Brief | null | undefined,
  entry: EntryFacts | null,
  field: ContractField,
  businessTypeEntry: BusinessTypeEntry | null | undefined,
  canInfer: boolean,
): FieldState {
  // Goal has its own resolver (reads brief.goal, not entry facts).
  if (field.resolver === 'goal') {
    return resolveGoalState(brief, field, businessTypeEntry, canInfer);
  }

  // 1. SCRAPED — prefill present.
  if (field.prefillKey && hasEntryValue(entry, field.prefillKey)) return 'scraped';
  // Proof existence can also be satisfied by the top-level proofAvailable list.
  if (field.tier === 'T2' && field.group === 'WHY-BELIEVE' && proofAvailableNonEmpty(brief)) {
    return 'scraped';
  }

  // 2. INFERRED — safe category-level default.
  if (canInfer && field.inferFrom && businessTypeEntry) {
    if (field.inferFrom === 'businessType-style' && businessTypeEntry.defaultStyle) return 'inferred';
    if (field.inferFrom === 'businessType-intent' && businessTypeEntry.likelyIntents.length > 0) return 'inferred';
  }

  // 3/4. ASK (required) vs DROP (optional + unanswered).
  return field.requirement === 'required' ? 'ask' : 'drop';
}

/**
 * Resolve every field in a contract to scraped|inferred|ask|drop for a Brief.
 * Deterministic. `businessTypeEntry` supplies safe inference sources only.
 */
export function computeFieldStates(
  brief: Brief | null | undefined,
  contract: EngineContract,
  businessTypeEntry?: BusinessTypeEntry | null,
): Map<string, FieldState> {
  const entry = getEntryFacts(brief);
  const conf = brief?.confidence;
  const canInfer = conf === undefined || conf >= INFER_CONFIDENCE_MIN;

  const states = new Map<string, FieldState>();
  for (const field of contract.fields) {
    states.set(field.id, resolveFieldState(brief, entry, field, businessTypeEntry, canInfer));
  }
  return states;
}

const slotOrder: Record<WizardSlot, number> = wizardSlots.reduce(
  (acc, slot, i) => {
    acc[slot] = i;
    return acc;
  },
  {} as Record<WizardSlot, number>,
);

/**
 * The ordered ASK list — fields the wizard must actually surface as questions.
 * Ordered by slot skeleton, then contract declaration order (stable).
 */
export function computeAsks(
  brief: Brief | null | undefined,
  contract: EngineContract,
  businessTypeEntry?: BusinessTypeEntry | null,
): ContractField[] {
  const states = computeFieldStates(brief, contract, businessTypeEntry);
  const indexOf = new Map(contract.fields.map((f, i) => [f.id, i] as const));
  return contract.fields
    .filter((f) => states.get(f.id) === 'ask')
    .sort((a, b) => {
      const bySlot = slotOrder[a.slot] - slotOrder[b.slot];
      if (bySlot !== 0) return bySlot;
      return (indexOf.get(a.id) ?? 0) - (indexOf.get(b.id) ?? 0);
    });
}

/**
 * Section types cut by the waterfall: optional fields that resolved to DROP and
 * carry a `dropTarget` (proof hard rule — never generate an unbacked section).
 */
export function computeDroppedSections(
  brief: Brief | null | undefined,
  contract: EngineContract,
  businessTypeEntry?: BusinessTypeEntry | null,
): string[] {
  const states = computeFieldStates(brief, contract, businessTypeEntry);
  const dropped: string[] = [];
  for (const field of contract.fields) {
    if (field.dropTarget && states.get(field.id) === 'drop') dropped.push(field.dropTarget);
  }
  return dropped;
}
