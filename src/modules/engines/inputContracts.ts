// src/modules/engines/inputContracts.ts
// scale-06 phase 1 — per-engine INPUT CONTRACTS (scalePlan §8 / spec scope 2).
//
// The wizard question set is COMPUTED, not designed:
//   ask = contract(engine) − scraped − inferred − dropped
// This module supplies the `contract(engine)` half — the SHAPE of what each
// engine needs, organised into the 5 universal fact groups
// (WHO / WHAT / WHY-BELIEVE / WHY-YOU / ACT). The businessType entry
// (`src/modules/businessTypes/config.ts`) supplies ONLY labels/examples for
// these fields (`wizardFields`) — never the shape (D9/D10 boundary).
//
// The waterfall that resolves each field to scraped|inferred|ask|drop lives in
// `src/modules/wizard/waterfall.ts`. This file is pure data + types — it MUST
// NOT import stores, React, or template modules (bundle firewall, mirrors the
// coreSections.ts invariant).
//
// Design decisions baked in (tunable at the phase-6 pilot gate — spec open Qs):
//   • differentiator  → GUIDED-CHIPS field (phase-6 gate decision: free text
//     freezes people). Never scrape-inferable → always an ASK. Chips SEED an
//     editable free-text box (starters, not a locked multi-select); the stored
//     value is the final text. Per-engine chip starters live on the field.
//   • real numbers    → satisfied by ≥1 of outcomes/credentials; modeled OPTIONAL
//     + `skippableWithWarning` (waterfall DROPS when absent) so a bare one-liner
//     stays within the ≤6-question acceptance budget while the ProofSlot can
//     still surface it as an ASK candidate with a warning.
//   • proof artifacts → T2 existence booleans; unanswered ⇒ section cut (dropTarget).
//   • goal param      → the ACT ask candidate (scale-05 goal machinery).

import type { CopyEngine } from '@/types/brief';
import type { EntryFacts } from '@/modules/brief/classify';

/**
 * ===== FACT GROUPS =====
 * The 5 universal groups every engine's strategy call is derived backwards from
 * (reader · claim · proof · objection · action). Closed set (scalePlan §8).
 */
export const factGroups = ['WHO', 'WHAT', 'WHY-BELIEVE', 'WHY-YOU', 'ACT'] as const;
export type FactGroup = (typeof factGroups)[number];

/**
 * ===== WIZARD SLOTS =====
 * The fixed slot skeleton (spec scope 1). `structure` is thing-only; `style`,
 * `generating` carry no waterfall fields (pickers / progress UI, not copy facts).
 */
export const wizardSlots = [
  'identity',
  'understanding',
  'goal',
  'offer',
  'proof',
  'style',
  'structure',
  'generating',
] as const;
export type WizardSlot = (typeof wizardSlots)[number];

export type FieldTier = 'T1' | 'T2' | 'T3';
export type FieldRequirement = 'required' | 'optional';

/** The four outside-unknowable fields every engine's ASK set converges on. */
export type AskCandidate = 'differentiator' | 'real-numbers' | 'proof-artifacts' | 'goal-param';

export interface ContractField {
  /** Stable id, unique within an engine contract. */
  id: string;
  group: FactGroup;
  slot: WizardSlot;
  /** Timing tier: T1 word (in copy) · T2 existence boolean · T3 artifact. */
  tier: FieldTier;
  requirement: FieldRequirement;
  /** Key into EntryFacts (`brief.facts.entry`) used for scrape/URL prefill. */
  prefillKey?: keyof EntryFacts;
  /**
   * Section type cut when this OPTIONAL field is unanswered + not inferable
   * (proof hard rule — never faked). MUST be a member of the engine's
   * `engineCoreSections` set (asserted in tests).
   */
  dropTarget?: string;
  /** Content section this field feeds. MUST be ⊆ engine core sections. */
  section?: string;
  /** One of the four converged ASK candidates (spec §8). */
  askCandidate?: AskCandidate;
  /** UI input hint (waterfall-agnostic; slot components consume it). */
  input?: 'free-text' | 'chips' | 'guided-chips' | 'boolean' | 'upload';
  /**
   * Starter phrases for a `guided-chips` field (differentiator only). Tapping a
   * chip SEEDS the phrase into an editable free-text box — starters, not a
   * locked multi-select. The stored value stays the final free text.
   */
  chips?: readonly string[];
  /** Numbers field: user may skip (⇒ waterfall DROP) with a trust warning. */
  skippableWithWarning?: boolean;
  /** Safe category-level inference source when no prefill exists. */
  inferFrom?: 'businessType-intent' | 'businessType-style';
  /** WORK exception: a T3 artifact collected IN the wizard (3–5 uploads). */
  wizardArtifact?: boolean;
  /** Special resolver hook (goal reads `brief.goal`, not entry facts). */
  resolver?: 'goal';
}

export interface EngineContract {
  engine: CopyEngine;
  fields: readonly ContractField[];
  /** Slots skipped entirely by this engine (structure is thing-only). */
  slotSkips: readonly WizardSlot[];
}

/**
 * DATA ONLY (scale-06 phase 1) — the quick-yes engine (P3, spec scope 1
 * "future-proofing only") skips the offer slot. No engine emits this yet;
 * reserved so the skip is already encoded when quick-yes ships.
 */
export const reservedSlotSkips: Record<string, readonly WizardSlot[]> = {
  'quick-yes': ['offer'],
} as const;

// ---------------------------------------------------------------------------
// THING — products (meridian / vestria). Core sections:
// header · hero · features · testimonials · footer.
// ---------------------------------------------------------------------------
const thingContract: EngineContract = {
  engine: 'thing',
  slotSkips: [],
  fields: [
    { id: 'name', group: 'WHO', slot: 'identity', tier: 'T1', requirement: 'required', prefillKey: 'businessName', input: 'free-text' },
    { id: 'oneLiner', group: 'WHAT', slot: 'identity', tier: 'T1', requirement: 'required', prefillKey: 'oneLiner', input: 'free-text' },
    { id: 'audience', group: 'WHO', slot: 'understanding', tier: 'T1', requirement: 'required', prefillKey: 'audiences', input: 'chips' },
    { id: 'capabilities', group: 'WHAT', slot: 'understanding', tier: 'T1', requirement: 'required', prefillKey: 'offerings', section: 'features', input: 'chips' },
    {
      id: 'differentiator', group: 'WHY-YOU', slot: 'understanding', tier: 'T1', requirement: 'required',
      askCandidate: 'differentiator', input: 'guided-chips',
      chips: [
        'Faster to set up', 'More affordable', 'Easier to use', 'More reliable',
        'Better support', 'The only one that…', 'Built for a specific niche', 'All-in-one',
      ],
    },
    { id: 'objectionFacts', group: 'WHY-BELIEVE', slot: 'understanding', tier: 'T1', requirement: 'optional', input: 'free-text' },
    { id: 'offer', group: 'WHAT', slot: 'offer', tier: 'T1', requirement: 'required', prefillKey: 'offer', input: 'free-text' },
    { id: 'realNumbers', group: 'WHY-BELIEVE', slot: 'proof', tier: 'T1', requirement: 'optional', prefillKey: 'outcomes', askCandidate: 'real-numbers', skippableWithWarning: true, input: 'chips' },
    { id: 'proofTestimonials', group: 'WHY-BELIEVE', slot: 'proof', tier: 'T2', requirement: 'optional', prefillKey: 'testimonials', dropTarget: 'testimonials', section: 'testimonials', askCandidate: 'proof-artifacts', input: 'boolean' },
    { id: 'goal', group: 'ACT', slot: 'goal', tier: 'T1', requirement: 'required', resolver: 'goal', inferFrom: 'businessType-intent', askCandidate: 'goal-param' },
  ],
};

// ---------------------------------------------------------------------------
// TRUST — expertise/services (hearth / lex / surge). Core sections:
// header · hero · services · testimonials · packages · cta · footer.
// ---------------------------------------------------------------------------
const trustContract: EngineContract = {
  engine: 'trust',
  slotSkips: ['structure'],
  fields: [
    { id: 'name', group: 'WHO', slot: 'identity', tier: 'T1', requirement: 'required', prefillKey: 'businessName', input: 'free-text' },
    { id: 'oneLiner', group: 'WHAT', slot: 'identity', tier: 'T1', requirement: 'required', prefillKey: 'oneLiner', input: 'free-text' },
    { id: 'whoProblem', group: 'WHO', slot: 'understanding', tier: 'T1', requirement: 'required', prefillKey: 'audiences', input: 'chips' },
    { id: 'services', group: 'WHAT', slot: 'understanding', tier: 'T1', requirement: 'required', prefillKey: 'offerings', section: 'services', input: 'chips' },
    {
      id: 'process', group: 'WHY-YOU', slot: 'understanding', tier: 'T1', requirement: 'required',
      askCandidate: 'differentiator', input: 'guided-chips',
      chips: [
        'More experienced', 'Specialized in a niche', 'Faster turnaround',
        'More personal attention', 'Proven track record', 'Certified / credentialed',
        'Transparent fixed pricing',
      ],
    },
    { id: 'offer', group: 'WHAT', slot: 'offer', tier: 'T1', requirement: 'required', prefillKey: 'offer', input: 'free-text' },
    { id: 'packages', group: 'WHAT', slot: 'offer', tier: 'T2', requirement: 'optional', dropTarget: 'packages', section: 'packages', input: 'boolean' },
    { id: 'outcomes', group: 'WHY-BELIEVE', slot: 'proof', tier: 'T1', requirement: 'optional', prefillKey: 'outcomes', askCandidate: 'real-numbers', skippableWithWarning: true, input: 'chips' },
    { id: 'credentials', group: 'WHY-BELIEVE', slot: 'proof', tier: 'T1', requirement: 'optional', input: 'free-text' },
    { id: 'testimonials', group: 'WHY-BELIEVE', slot: 'proof', tier: 'T2', requirement: 'optional', prefillKey: 'testimonials', dropTarget: 'testimonials', section: 'testimonials', askCandidate: 'proof-artifacts', input: 'boolean' },
    { id: 'goal', group: 'ACT', slot: 'goal', tier: 'T1', requirement: 'required', resolver: 'goal', inferFrom: 'businessType-intent', askCandidate: 'goal-param' },
  ],
};

// ---------------------------------------------------------------------------
// WORK — the work itself (granth). Core sections:
// hero · about · books · writing · praise · footer.
// WORK exception: the artifact IS the argument — `theWork` is a T3 upload asked
// IN the wizard (3–5 works), not deferred to the editor.
// ---------------------------------------------------------------------------
const workContract: EngineContract = {
  engine: 'work',
  slotSkips: ['structure'],
  fields: [
    { id: 'name', group: 'WHO', slot: 'identity', tier: 'T1', requirement: 'required', prefillKey: 'businessName', input: 'free-text' },
    { id: 'oneLiner', group: 'WHAT', slot: 'identity', tier: 'T1', requirement: 'required', prefillKey: 'oneLiner', input: 'free-text' },
    { id: 'whatYouTakeOn', group: 'WHO', slot: 'understanding', tier: 'T1', requirement: 'optional', prefillKey: 'audiences', input: 'chips' },
    { id: 'theWork', group: 'WHAT', slot: 'proof', tier: 'T3', requirement: 'required', prefillKey: 'offerings', section: 'books', wizardArtifact: true, input: 'upload' },
    { id: 'genresStyle', group: 'WHAT', slot: 'understanding', tier: 'T1', requirement: 'required', prefillKey: 'categories', section: 'writing', input: 'chips' },
    {
      id: 'bioStory', group: 'WHY-YOU', slot: 'understanding', tier: 'T1', requirement: 'required',
      section: 'about', askCandidate: 'differentiator', input: 'guided-chips',
      chips: [
        'A distinct voice/style', 'Award-winning', 'Published in known outlets',
        'A genre specialist', 'Bilingual', 'Decades of craft',
      ],
    },
    { id: 'achievements', group: 'WHY-BELIEVE', slot: 'proof', tier: 'T1', requirement: 'optional', prefillKey: 'outcomes', askCandidate: 'real-numbers', skippableWithWarning: true, input: 'chips' },
    { id: 'praise', group: 'WHY-BELIEVE', slot: 'proof', tier: 'T2', requirement: 'optional', prefillKey: 'testimonials', dropTarget: 'praise', section: 'praise', askCandidate: 'proof-artifacts', input: 'boolean' },
    { id: 'goal', group: 'ACT', slot: 'goal', tier: 'T1', requirement: 'required', resolver: 'goal', inferFrom: 'businessType-intent', askCandidate: 'goal-param' },
  ],
};

export const engineContracts: Record<CopyEngine, EngineContract> = {
  thing: thingContract,
  trust: trustContract,
  work: workContract,
};

/** Resolve the contract for an engine (thin accessor; keeps callers off the map). */
export function getContract(engine: CopyEngine): EngineContract {
  return engineContracts[engine];
}
