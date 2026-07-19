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

import type { Brief, CopyEngine, DesignStyle, ResolvedEngine } from '@/types/brief';
import { copyEngines } from '@/types/brief';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { goalIntentMeta, type GoalIntent } from '@/modules/goals/vocabulary';
import {
  businessTypes,
  type BusinessTypeKey,
} from '@/modules/businessTypes/config';
import type { CollectionKey } from '@/modules/collections/registry';
import {
  makeCollectionEntry,
  setCollections,
  type CollectionsFacts,
} from '@/modules/brief/collections';

/** Chooser renders upfront below this classification confidence (plan D7). */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

/**
 * Full 5-engine resolution union — WIDER than the `copyEngines` schema enum.
 * Canonical home is `@/types/brief` (engineDecider R2, breaks the config↔classify
 * import cycle); re-exported here for back-compat with existing importers.
 */
export type { ResolvedEngine };

export type TiebreakerRung =
  | 'expertise'
  | 'portfolio-is-proof'
  | 'browsing-place'
  | 'offer-already-understood'
  | 'none';

export type ClassificationSource = 'lookup' | 'tiebreaker' | 'user-pick';

/**
 * Decider presentation status (engineDecider — scout state model). `resolving`
 * is a UI transient (Phase 2); `known`/`almost-sure` are committed lookups
 * (confidence modulates which, per R1); `ambiguous` is a pre-D4-pick state
 * (nullable resolvedEngine); `confirmed` is set by `applyEnginePick`.
 */
export type EngineStatus =
  | 'resolving'
  | 'known'
  | 'almost-sure'
  | 'ambiguous'
  | 'confirmed';

/**
 * Result of `resolveEngine` (engineDecider R2). Either a single engine is
 * `resolved` (committed lookup, or an unknown type with a definite tiebreaker
 * rung) OR the engine is genuinely undetermined and we must `ask` (D4): an
 * ambiguous registry type, or an unknown type with no tiebreaker signal.
 */
export type EngineResolution =
  | { state: 'resolved'; engine: ResolvedEngine; source: 'lookup' | 'tiebreaker' }
  | {
      state: 'ask';
      candidates: ResolvedEngine[];
      prior: ResolvedEngine | null;
      reason: 'ambiguous-type' | 'unknown-type';
    };

export type PlatformNeeds = 'none' | 'checkout' | 'ordering' | 'booking-payments';

/**
 * One collection entry as extracted verbatim from the scrape (scale-10 phase 2).
 * Carries only what the AI is allowed to emit — name + optional one-liner/image.
 * The `slug` is NOT here: it is derived in code (buildBriefDraft) via slugify,
 * never taken from AI output ("slugs never AI").
 */
export interface CollectionEntryDraft {
  name: string;
  oneLiner?: string;
  imageUrl?: string;
}

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
  // scale-10 phase 2: collection entries extracted verbatim in the SAME scrape
  // call (folded here by the engine's enrichSignals). Optional/absent when the
  // engine has no collection or the crawl saw none — buildBriefDraft DROPs empty
  // keys and code-derives slugs when writing facts.collections.
  collections?: Partial<Record<CollectionKey, CollectionEntryDraft[]>>;
}

/**
 * The D1 carrier payload stored at `brief.facts.entry` (facts is
 * z.record(z.unknown()) — no schema change needed). Everything the wizard
 * bridge + serve gate read lives here.
 */
export interface EntryFacts {
  rawInput: string;
  /**
   * The resolved 5-value engine, or `null` while the engine is undetermined
   * (an `ask` state, pre-D4-pick). The decider guarantees a non-null engine by
   * `/api/brief/confirm` time; a null here reaching `decideServe` is a defect
   * (backstopped with the `engine-unresolved` tag), never a served page.
   */
  resolvedEngine: ResolvedEngine | null;
  /** Decider presentation status. Optional so pre-existing EntryFacts fixtures
   * stay valid; `buildBriefDraft`/`applyEnginePick` always set it. */
  engineStatus?: EngineStatus;
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

/** Tiebreaker → engine ladder. Definite rungs resolve; `none` = no signal. */
const TIEBREAKER_LADDER: Record<TiebreakerRung, ResolvedEngine> = {
  'expertise': 'trust',
  'portfolio-is-proof': 'work',
  'browsing-place': 'place',
  'offer-already-understood': 'quick-yes',
  'none': 'thing',
};

/**
 * Engine resolution (engineDecider R2). ZERO AI — the AI only signals; code
 * decides. Returns an `EngineResolution` union:
 * - KNOWN + `committed` ⇒ `resolved` via config lookup (zero-question path).
 * - KNOWN + `ambiguous` ⇒ `ask` (D4) with the registry candidates + prior.
 * - UNKNOWN + a definite tiebreaker rung ⇒ `resolved` via the ladder (this
 *   preserves the serve-gate's honest place/quick-yes → demand routing, e.g.
 *   an unknown restaurant with `browsing-place` resolves to `place`).
 * - UNKNOWN + `none` (no type match AND no trust signal) ⇒ `ask` (D4). This is
 *   the change from the old silent `→ 'thing'` collapse: we no longer guess an
 *   engine when we truly cannot tell. Prior = the ladder's neutral `thing`,
 *   retained only as the D4 pre-selection, NOT as a verdict.
 */
export function resolveEngine(
  signals: Pick<EntrySignals, 'businessTypeGuess' | 'tiebreaker'>
): EngineResolution {
  if (isKnownBusinessType(signals.businessTypeGuess)) {
    const entry = businessTypes[signals.businessTypeGuess];
    if (entry.engineState === 'committed') {
      return { state: 'resolved', engine: entry.copyEngine, source: 'lookup' };
    }
    return {
      state: 'ask',
      candidates: [...entry.candidateEngines],
      prior: entry.priorEngine,
      reason: 'ambiguous-type',
    };
  }
  if (signals.tiebreaker === 'none') {
    return {
      state: 'ask',
      candidates: [],
      prior: TIEBREAKER_LADDER['none'],
      reason: 'unknown-type',
    };
  }
  return { state: 'resolved', engine: TIEBREAKER_LADDER[signals.tiebreaker], source: 'tiebreaker' };
}

function isSchemaEngine(engine: ResolvedEngine): engine is CopyEngine {
  return (copyEngines as readonly string[]).includes(engine);
}

/**
 * Map the signal-carried collection drafts → a `facts.collections` payload with
 * CODE-DERIVED slugs (via makeCollectionEntry → slugify). Empty names and empty
 * per-key lists are DROPPED (no key ⇒ no collection). Returns null when nothing
 * survives, so buildBriefDraft leaves `facts.collections` unset entirely.
 */
function collectionsFromSignals(signals: EntrySignals): CollectionsFacts | null {
  if (!signals.collections) return null;
  const facts: CollectionsFacts = {};
  let any = false;
  for (const [key, drafts] of Object.entries(signals.collections) as [
    CollectionKey,
    CollectionEntryDraft[] | undefined,
  ][]) {
    if (!Array.isArray(drafts)) continue;
    const entries = drafts
      .map((d) => makeCollectionEntry(d.name, { oneLiner: d.oneLiner, imageUrl: d.imageUrl }))
      .filter((e) => e.name.length > 0);
    if (entries.length > 0) {
      facts[key] = entries;
      any = true;
    }
  }
  return any ? facts : null;
}

/**
 * Build the Brief draft from raw signals (plan step 1). Validated via
 * BriefSchema.parse — safe by construction for place/quick-yes because
 * copyEngine is OMITTED for non-enum engines (D2).
 */
/** Clamp the AI self-report confidence into [0,1] (engineDecider R1). Done in
 * CODE, not as a Zod `.min/.max` on the AI-facing field — OpenAI strict
 * structured outputs reject `minimum`/`maximum` (see entryClassify.schema.ts
 * header), so the constraint must live post-parse. Confidence modulates the
 * D2/D3 presentation only; it never changes WHICH engine resolves (R1). */
function clampConfidence(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

export function buildBriefDraft(signals: EntrySignals, rawInput: string): Brief {
  const resolution = resolveEngine(signals);
  const confidence = clampConfidence(signals.businessTypeConfidence);

  // Fold the resolution into the flat carrier fields. `ask` ⇒ null engine +
  // `ambiguous` status (copyEngine stays unset — the D4 pick fills it via
  // applyEnginePick). `resolved` ⇒ the engine + a presentation status per R1
  // (a committed lookup below the confidence floor shows as `almost-sure`).
  const engine: ResolvedEngine | null =
    resolution.state === 'resolved' ? resolution.engine : null;
  const source: ClassificationSource =
    resolution.state === 'resolved'
      ? resolution.source
      : resolution.reason === 'ambiguous-type'
        ? 'lookup'
        : 'tiebreaker';
  const engineStatus: EngineStatus =
    resolution.state === 'ask'
      ? 'ambiguous'
      : resolution.source === 'lookup'
        ? confidence >= LOW_CONFIDENCE_THRESHOLD
          ? 'known'
          : 'almost-sure'
        : 'known';

  const entry: EntryFacts = {
    rawInput,
    resolvedEngine: engine,
    engineStatus,
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
    // D2: written ONLY when the engine is resolved AND ∈ {thing,trust,work};
    // NEVER place/quick-yes (BriefSchema.parse would throw) and NEVER while the
    // engine is undetermined (an `ask` state ⇒ null engine ⇒ unset).
    copyEngine: engine !== null && isSchemaEngine(engine) ? engine : undefined,
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
    confidence,
  };

  const parsed = BriefSchema.parse(draft);
  // scale-10 phase 2: write scrape-carried collection entries to
  // facts.collections VERBATIM, slugs code-derived (setCollections re-derives via
  // slugify). Absent/all-empty ⇒ leave facts.collections unset (DROP).
  const collections = collectionsFromSignals(signals);
  return collections ? setCollections(parsed, collections) : parsed;
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
  const btEntry = businessTypes[businessType];
  // Union-aware: a committed type re-resolves to its single engine; an ambiguous
  // corrected type carries its `priorEngine` as the resolved engine (the D4 pick
  // can still overturn it via applyEnginePick).
  const engine: ResolvedEngine =
    btEntry.engineState === 'committed' ? btEntry.copyEngine : btEntry.priorEngine;
  const entry = getEntryFacts(draft);
  return BriefSchema.parse({
    ...draft,
    businessType,
    copyEngine: isSchemaEngine(engine) ? engine : undefined,
    facts: {
      ...draft.facts,
      entry: {
        ...entry,
        classificationSource: 'lookup' satisfies ClassificationSource,
        tiebreaker: 'none' satisfies TiebreakerRung,
        resolvedEngine: engine,
        engineStatus: (btEntry.engineState === 'committed'
          ? 'known'
          : 'ambiguous') satisfies EngineStatus,
      },
    },
  });
}

/**
 * The D4 buyer-decision PICK writer (engineDecider). The user has chosen an
 * engine at D4; write it as the confirmed resolution. Sets `resolvedEngine` to
 * the picked engine, `engineStatus: 'confirmed'`, source `'user-pick'`, and
 * re-parses the Brief. `brief.copyEngine` is written ONLY when the pick is a
 * schema engine ({thing,trust,work}) — place/quick-yes are NEVER written to
 * `brief.copyEngine` (they route to the demand board), and any previously-set
 * copyEngine is cleared when switching to a non-schema engine.
 */
export function applyEnginePick(draft: Brief, engine: ResolvedEngine): Brief {
  const entry = getEntryFacts(draft);
  return BriefSchema.parse({
    ...draft,
    copyEngine: isSchemaEngine(engine) ? engine : undefined,
    facts: {
      ...draft.facts,
      entry: {
        ...entry,
        resolvedEngine: engine,
        engineStatus: 'confirmed' satisfies EngineStatus,
        classificationSource: 'user-pick' satisfies ClassificationSource,
        tiebreaker: 'none' satisfies TiebreakerRung,
      },
    },
  });
}
