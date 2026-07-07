// src/modules/brief/classify.ts
// Entry classification — PURE module (scale-02 phase 1, plan D6/D7).
// AI emits raw EntrySignals; ALL engine resolution + Brief construction is
// code here (zero AI). Firewall: no 'use client', no template
// resolver/registry/renderer imports — importable from server routes AND
// client components.
//
// Engine carriage rule (plan D2): `copyEngines` in @/types/brief is exactly
// {thing,trust,work} and BriefSchema.copyEngine is that enum. The RESOLVED
// engine can also be 'place' | 'quick-yes' — writing those to brief.copyEngine
// would make BriefSchema.parse THROW. So the resolved engine (full 5-value
// union) ALWAYS rides `facts.entry.resolvedEngine`; `brief.copyEngine` is set
// only when the resolved engine ∈ {thing,trust,work}.

import type { Brief, CopyEngine, DesignStyle } from '@/types/brief';
import { copyEngines } from '@/types/brief';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { goalIntentMeta, type GoalIntent } from '@/modules/goals/vocabulary';
import {
  businessTypes,
  type BusinessTypeKey,
} from '@/modules/businessTypes/config';

/** Chooser renders upfront below this classification confidence (plan D7). */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

/** Full 5-engine resolution union — WIDER than the `copyEngines` schema enum. */
export type ResolvedEngine = CopyEngine | 'place' | 'quick-yes';

export type TiebreakerRung =
  | 'expertise'
  | 'portfolio-is-proof'
  | 'browsing-place'
  | 'offer-already-understood'
  | 'none';

export type ClassificationSource = 'lookup' | 'tiebreaker';

export type PlatformNeeds = 'none' | 'checkout' | 'ordering' | 'booking-payments';

/**
 * Raw AI output shape from the entry-mode understand/scrape call (phase 3
 * emits this; phase 1 only defines + consumes it). AI guesses — code decides.
 */
export interface EntrySignals {
  businessTypeGuess: string | null;
  businessTypeConfidence: number;
  category: string | null;
  goalIntentGuess: GoalIntent | null;
  tiebreaker: TiebreakerRung;
  structureHint: 'single' | 'multi';
  designStyleHint: DesignStyle | null;
  platformNeeds: PlatformNeeds;
  // Neutral prefill superset (rides into facts.entry for wizard hydrate).
  summary: string;
  businessName: string;
  offerings: string[];
  audiences: string[];
  categories: string[];
  outcomes: string[];
  deliveryModel: 'remote' | 'in-person' | 'hybrid' | null;
  offer: string;
  oneLiner: string;
  proofAvailable: string[];
  socialProfiles: { platform: string; url: string }[];
  testimonials: string[];
}

/**
 * The D1 carrier payload stored at `brief.facts.entry` (facts is
 * z.record(z.unknown()) — no schema change needed). Everything the wizard
 * bridge + serve gate read lives here.
 */
export interface EntryFacts {
  rawInput: string;
  resolvedEngine: ResolvedEngine;
  classificationSource: ClassificationSource;
  tiebreaker: TiebreakerRung;
  platformNeeds: PlatformNeeds;
  summary: string;
  businessName: string;
  offerings: string[];
  audiences: string[];
  categories: string[];
  outcomes: string[];
  deliveryModel: 'remote' | 'in-person' | 'hybrid' | null;
  offer: string;
  oneLiner: string;
  testimonials: string[];
}

/** Safe reader for `brief.facts.entry` (facts is a loose record). */
export function getEntryFacts(brief: Brief | null | undefined): EntryFacts | null {
  const entry = brief?.facts?.['entry'];
  if (!entry || typeof entry !== 'object') return null;
  return entry as EntryFacts;
}

function isKnownBusinessType(guess: string | null | undefined): guess is BusinessTypeKey {
  return !!guess && guess in businessTypes;
}

/**
 * Engine resolution (plan step 1 / D6). Known businessType ⇒ config lookup
 * (ZERO AI, source 'lookup'). Unknown ⇒ tiebreaker ladder (source
 * 'tiebreaker' = the rung-A marker):
 *   expertise → trust · portfolio-is-proof → work · browsing-place → place ·
 *   offer-already-understood → quick-yes · else → thing
 */
export function resolveEngine(
  signals: Pick<EntrySignals, 'businessTypeGuess' | 'tiebreaker'>
): { engine: ResolvedEngine; source: ClassificationSource } {
  if (isKnownBusinessType(signals.businessTypeGuess)) {
    return { engine: businessTypes[signals.businessTypeGuess].copyEngine, source: 'lookup' };
  }
  const ladder: Record<TiebreakerRung, ResolvedEngine> = {
    'expertise': 'trust',
    'portfolio-is-proof': 'work',
    'browsing-place': 'place',
    'offer-already-understood': 'quick-yes',
    'none': 'thing',
  };
  return { engine: ladder[signals.tiebreaker], source: 'tiebreaker' };
}

function isSchemaEngine(engine: ResolvedEngine): engine is CopyEngine {
  return (copyEngines as readonly string[]).includes(engine);
}

/**
 * Build the Brief draft from raw signals (plan step 1). Validated via
 * BriefSchema.parse — safe by construction for place/quick-yes because
 * copyEngine is OMITTED for non-enum engines (D2).
 */
export function buildBriefDraft(signals: EntrySignals, rawInput: string): Brief {
  const { engine, source } = resolveEngine(signals);

  const entry: EntryFacts = {
    rawInput,
    resolvedEngine: engine,
    classificationSource: source,
    tiebreaker: signals.tiebreaker,
    platformNeeds: signals.platformNeeds,
    summary: signals.summary,
    businessName: signals.businessName,
    offerings: signals.offerings,
    audiences: signals.audiences,
    categories: signals.categories,
    outcomes: signals.outcomes,
    deliveryModel: signals.deliveryModel,
    offer: signals.offer,
    oneLiner: signals.oneLiner,
    testimonials: signals.testimonials,
  };

  const draft: Brief = {
    // Known key or the raw guess (rungA carries it into the demand board).
    businessType: signals.businessTypeGuess ?? undefined,
    // D2: NEVER write place/quick-yes here — BriefSchema.parse would throw.
    copyEngine: isSchemaEngine(engine) ? engine : undefined,
    category: signals.category ?? undefined,
    goal: signals.goalIntentGuess
      ? {
          intent: signals.goalIntentGuess,
          mechanism: goalIntentMeta[signals.goalIntentGuess].mechanisms[0],
        }
      : undefined,
    facts: { entry },
    proofAvailable: signals.proofAvailable,
    socialProfiles: signals.socialProfiles,
    structure: { mode: signals.structureHint, pages: [] },
    designStyleHint: signals.designStyleHint ?? undefined,
    confidence: signals.businessTypeConfidence,
  };

  return BriefSchema.parse(draft);
}

/**
 * The SINGLE sanctioned correction path (plan D7) — the confirm-card chooser
 * (phase 5) must use it. Sets businessType, re-resolves engine via lookup,
 * sets copyEngine, and RESETS facts.entry classification state — a lingering
 * tiebreaker must never survive a correction (else the gate's gallery-cap
 * injection mis-fires on a serveable corrected type).
 */
export function applyBusinessTypeCorrection(
  draft: Brief,
  businessType: BusinessTypeKey
): Brief {
  const engine = businessTypes[businessType].copyEngine;
  const entry = getEntryFacts(draft);
  return BriefSchema.parse({
    ...draft,
    businessType,
    copyEngine: engine,
    facts: {
      ...draft.facts,
      entry: {
        ...entry,
        classificationSource: 'lookup' satisfies ClassificationSource,
        tiebreaker: 'none' satisfies TiebreakerRung,
        resolvedEngine: engine,
      },
    },
  });
}
