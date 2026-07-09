// src/modules/wizard/generation/trust.ts
// scale-06 phase 8 — the TRUST generation adapter.
//
// Maps unified wizard/Brief state → the EXACT payloads the service audience
// routes (/api/audience/service/strategy + /generate-copy) already expect today
// (route contracts UNCHANGED). PORTED — not moved — from the ~410-line service
// GeneratingStep:
//   • strategy → copy → save (single page — service has no multi-page fan-out)
//   • the ServiceUnderstanding / ServiceGoal / ServiceAssetInput mapping
//   • realTestimonials passthrough (injectRealTestimonials path untouched)
//   • the shared scale-05 goal tail via `finalize.ts` (seedGoalForm +
//     injectGoalSections — identical to the old service tail)
//
// SECTION-DROP FIDELITY: the store's proof booleans become a `ServiceAssetInput`
// that reaches `selectServiceSections` UNCHANGED IN SHAPE (via the strategy
// route → assembleServiceStrategy), so awareness-driven ordering + the
// testimonials drop are byte-identical to the old service path. Awareness +
// `servicePresentation.format` (which drops packages) stay LLM-decided, exactly
// as before — the packages T2 boolean is captured but, per plan D "routes
// unchanged", is not wired to a route-level drop in this phase.
//
// FIREWALL: PLAIN module (no `'use client'`), executed client-side by
// `GeneratingSlot`. Imports only plain helpers + the shared `finalize` tail;
// NEVER imports `useWizardStore` — the slot reads the store and hands this
// adapter PLAIN DATA. The published-client boundary is preserved.

import type { SectionCopy } from '@/types/generation';
import type {
  ServiceStrategyOutputAssembled,
  ServiceUnderstandingInput,
  ServiceAssetInput,
  ServiceGoal,
  TemplateId,
} from '@/types/service';
import { palettesForTemplate, defaultVariantForTemplate } from '@/types/service';
import { defaultHearthPalette } from '@/modules/templates/hearth/palettes';
import type { GoalIntent } from '@/modules/goals/vocabulary';
import {
  intentToBriefGoal,
  intentToLegacyGoal,
  serviceTypeForBusinessType,
  type GoalParamInput,
} from '@/modules/brief/bridge';
import { applyConfirmedStructure } from '@/modules/audience/service/strategy/parseStrategyService';
import { lockedSectionsForEngine } from '@/modules/engines/inputContracts';
import { buildFinalContent, saveDraft, type BriefGoal } from './finalize';
import type { GenerationCallbacks, GenerationResult } from './index';

// ---------------------------------------------------------------------------
// Adapter input — the PLAIN projection of `useWizardStore` the slot builds.
// ---------------------------------------------------------------------------

export interface TrustGenerationInput {
  tokenId: string;
  /** Resolved service template (serveGate). Drives palette/variant defaults. */
  templateId: TemplateId | null;
  /** businessType key (Brief) — resolves the ServiceType (persona is dead). */
  businessTypeKey?: string;

  // Copy facts (wizard contract fields).
  businessName: string;
  oneLiner: string;
  /** whoProblem (WHO) — the target clients. */
  targetClients: string[];
  /** services (WHAT) — the service list. */
  services: string[];
  /** process (WHY-YOU differentiator, guided-chips → free text). */
  process?: string;
  /** credentials (WHY-BELIEVE, free text). */
  credentials?: string;
  /** delivery model — not asked in the wizard; defaults to 'remote'. */
  deliveryModel?: 'remote' | 'in-person' | 'hybrid';

  // Offer.
  offer: string;

  // Proof (numbers) — WHY-BELIEVE outcomes.
  outcomes: string[];

  // Goal (scale-05).
  goalIntent: GoalIntent | null;
  goalParam?: GoalParamInput;

  // Proof existence booleans — SUPERSET-safe subset that maps 1:1 to
  // ServiceAssetInput and drives section selection (testimonials drop).
  proof: {
    hasTestimonials: boolean;
    hasClientLogos: boolean;
    hasOutcomes: boolean;
    hasCaseStudies: boolean;
    hasTeamPhotos: boolean;
    hasFounderPhoto: boolean;
    testimonialType: 'text' | 'photos' | 'video' | 'transformation' | null;
  };

  /** Verbatim testimonials imported from the user's site (injectRealTestimonials). */
  importedTestimonials?: Array<{ quote: string; author_name: string; author_role: string }>;

  // Style picks (trust picker) — palette/variant for the resolved template.
  paletteId?: string;
  variantId?: string;

  // Structure (7b gate output — scale-07 phase 4). When `strategy` is present
  // runTrustGeneration NEVER refetches (credit charge-once); when
  // `confirmedSections` is present, sections absent from it get NO copy.
  // GeneratingSlot's projection does not forward these yet — the module-scoped
  // pre-gate handoff below bridges them (see runTrustStrategy).
  strategy?: ServiceStrategyOutputAssembled | null;
  confirmedSections?: string[] | null;
}

// ---------------------------------------------------------------------------
// Payload builders — the fidelity surface asserted by trust.test.ts.
// ---------------------------------------------------------------------------

/** Legacy ServiceGoal the routes require (derived from the captured intent). */
export function serviceGoalFor(input: TrustGenerationInput): ServiceGoal {
  return input.goalIntent ? intentToLegacyGoal(input.goalIntent, 'service') : 'book-call';
}

/** Composed Brief.goal — seeds the M1 form + goal sections in the shared tail. */
export function briefGoalFor(input: TrustGenerationInput): BriefGoal | null {
  return input.goalIntent
    ? intentToBriefGoal(input.goalIntent, input.goalParam, {
        businessName: input.businessName,
        offer: input.offer,
      })
    : null;
}

/** The ServiceUnderstanding shape both service routes require. */
export function buildUnderstanding(input: TrustGenerationInput): ServiceUnderstandingInput {
  return {
    serviceType: serviceTypeForBusinessType(input.businessTypeKey),
    // whatYouDo ≈ the one-line description of the practice (bridge idiom:
    // whatYouDo = entry.summary; the wizard's closest is the one-liner).
    whatYouDo: input.oneLiner,
    services: input.services,
    targetClients: input.targetClients,
    outcomes: input.outcomes,
    deliveryModel: input.deliveryModel ?? 'remote',
  };
}

/** The ServiceAssetInput that reaches selectServiceSections UNCHANGED in shape. */
export function buildAssets(input: TrustGenerationInput): ServiceAssetInput {
  const p = input.proof;
  return {
    hasTestimonials: p.hasTestimonials,
    hasClientLogos: p.hasClientLogos,
    hasOutcomes: p.hasOutcomes,
    hasCaseStudies: p.hasCaseStudies,
    hasTeamPhotos: p.hasTeamPhotos,
    hasFounderPhoto: p.hasFounderPhoto,
    testimonialType: p.testimonialType,
  };
}

/** Effective palette — the picked value, else the template's first palette. */
export function effectivePalette(input: TrustGenerationInput): string {
  if (input.paletteId) return input.paletteId;
  if (input.templateId) {
    const list = palettesForTemplate(input.templateId);
    if (list.length > 0) return list[0];
  }
  return defaultHearthPalette;
}

/** The EXACT /api/audience/service/strategy request body. */
export function buildStrategyPayload(input: TrustGenerationInput): Record<string, unknown> {
  return {
    oneLiner: input.oneLiner,
    businessName: input.businessName,
    understanding: buildUnderstanding(input),
    goal: serviceGoalFor(input),
    offer: input.offer,
    assets: buildAssets(input),
    paletteId: effectivePalette(input),
    // Selection-only: widens the section SET for templates that declare extra
    // section types (Surge). Server passes it to section selection, NEVER to a
    // prompt builder (firewall preserved).
    ...(input.templateId ? { templateId: input.templateId } : {}),
  };
}

/** The EXACT /api/audience/service/generate-copy request body. */
export function buildCopyPayload(
  input: TrustGenerationInput,
  strategy: ServiceStrategyOutputAssembled
): Record<string, unknown> {
  return {
    strategy,
    uiblocks: strategy.uiblocks,
    oneLiner: input.oneLiner,
    businessName: input.businessName,
    offer: input.offer,
    goal: serviceGoalFor(input),
    understanding: buildUnderstanding(input),
    ...(input.importedTestimonials?.length ? { realTestimonials: input.importedTestimonials } : {}),
  };
}

/** Service onboardingData snapshot persisted in finalContent (mirror old tail). */
function buildOnboardingData(input: TrustGenerationInput): Record<string, unknown> {
  return {
    oneLiner: input.oneLiner,
    businessName: input.businessName,
    understanding: buildUnderstanding(input),
    goal: serviceGoalFor(input),
    offer: input.offer,
    assets: buildAssets(input),
  };
}

// ---------------------------------------------------------------------------
// The adapter entry point (dispatched by runGeneration).
// ---------------------------------------------------------------------------

const REDIRECT = (tokenId: string) => `/edit/${tokenId}`;

function isCreditFail(status: number, error: string | undefined): boolean {
  return status === 402 || /credit/i.test(error ?? '');
}

// ---------------------------------------------------------------------------
// Strategy step (scale-07 phase 4) — extracted so the STRUCTURE slot can run
// it PRE-gate via the wizard store's `fetchStrategy` action (mirrors the thing
// adapter's `runStrategy`, phase 3).
// ---------------------------------------------------------------------------

export type RunTrustStrategyResult =
  | { status: 'done'; strategy: ServiceStrategyOutputAssembled }
  | { status: 'credits' }
  | { status: 'error'; error: string };

/**
 * PRE-GATE HANDOFF (deliberate bridge — see audit). `GeneratingSlot`'s trust
 * projection predates phase 4 and does not forward `strategy`/
 * `confirmedSections` (that file is outside this phase's touch list), so the
 * gate-fetched strategy and the user's confirmed structure are handed to
 * `runTrustGeneration` through this module-scoped record instead, keyed by
 * tokenId so a stale wizard session can never leak into another project.
 * Explicit `input.strategy`/`input.confirmedSections` ALWAYS win over the
 * handoff — when a later phase forwards them through the projection, this
 * bridge becomes dead code and should be deleted.
 *
 * Charge-once: `runTrustStrategy` (called exactly once by the store's
 * status-guarded `fetchStrategy`) records the strategy here; runTrustGeneration
 * finds it and NEVER refetches — including on copy-failure retries. The record
 * is PEEKED, never cleared, so a retry cannot trigger a second charged fetch.
 */
let pregate: {
  tokenId: string;
  strategy: ServiceStrategyOutputAssembled;
  confirmedSections: string[] | null;
} | null = null;

/** Store-side sync: the 7b gate's confirmed (toggled/reordered) section list. */
export function setConfirmedTrustStructure(tokenId: string, sections: string[]): void {
  if (pregate && pregate.tokenId === tokenId) {
    pregate.confirmedSections = [...sections];
  }
}

/** Test hook — clears the pre-gate handoff between fixtures. */
export function resetTrustPregateForTest(): void {
  pregate = null;
}

/**
 * The trust strategy call as a standalone step: SAME payload builder
 * (`buildStrategyPayload`), SAME route (server owns the credit charge), SAME
 * credit-fail detection as the previous inline call.
 */
export async function runTrustStrategy(
  input: TrustGenerationInput
): Promise<RunTrustStrategyResult> {
  try {
    const res = await fetch('/api/audience/service/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildStrategyPayload(input)),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      if (isCreditFail(res.status, json?.error)) return { status: 'credits' };
      throw new Error(json?.message || 'Strategy generation failed');
    }
    const strategy = json.data as ServiceStrategyOutputAssembled;
    pregate = { tokenId: input.tokenId, strategy, confirmedSections: null };
    return { status: 'done', strategy };
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Strategy generation failed.' };
  }
}

export async function runTrustGeneration(
  input: TrustGenerationInput,
  cb: GenerationCallbacks = {}
): Promise<GenerationResult> {
  const { tokenId } = input;
  const title = (input.businessName.trim() || input.oneLiner || 'Untitled Studio').slice(0, 50);
  const briefGoal = briefGoalFor(input);
  const briefPatch = briefGoal ? { brief: { goal: briefGoal } } : {};
  const paletteId = effectivePalette(input);
  const templateId = input.templateId ?? 'hearth';
  const variantId = input.variantId ?? defaultVariantForTemplate[templateId as TemplateId];

  // ─── Strategy (PRIMARY: pre-gate fetch from the structure slot; fallback:
  //     one self-fetch for structure-skipping/reloaded flows) ───
  cb.onStage?.('strategy');
  const handoff = pregate && pregate.tokenId === tokenId ? pregate : null;
  const confirmedSections =
    input.confirmedSections !== undefined
      ? input.confirmedSections
      : handoff?.confirmedSections ?? null;
  let strategy: ServiceStrategyOutputAssembled;
  const pregateStrategy = input.strategy ?? handoff?.strategy ?? null;
  if (pregateStrategy) {
    // Fetched (and charged) exactly once at the 7b gate — never refetch here.
    strategy = pregateStrategy;
  } else {
    const result = await runTrustStrategy(input);
    if (result.status === 'credits') return { status: 'credits' };
    if (result.status === 'error') return { status: 'error', error: result.error };
    strategy = result.strategy;
  }

  // Confirmed 7b structure: clamp law (unknown dropped, dupes deduped, locked
  // trust-core sections forced, hero first, chrome forced), then reduce
  // sections + uiblocks — a toggled-off section gets NO copy below.
  strategy = applyConfirmedStructure(
    strategy,
    confirmedSections,
    lockedSectionsForEngine('trust')
  );

  // ─── Copy ───
  cb.onStage?.('copy');
  let copySections: Record<string, SectionCopy>;
  try {
    const res = await fetch('/api/audience/service/generate-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCopyPayload(input, strategy)),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      if (isCreditFail(res.status, json?.error)) return { status: 'credits' };
      throw new Error(json?.message || 'Copy generation failed');
    }
    copySections = json.sections as Record<string, SectionCopy>;
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Copy generation failed.' };
  }

  // ─── Save (shared scale-05 goal tail via finalize.ts) ───
  cb.onStage?.('saving');
  try {
    const { finalContent } = buildFinalContent({
      tokenId,
      title,
      sections: strategy.sections,
      uiblocks: strategy.uiblocks,
      copy: copySections,
      onboardingData: buildOnboardingData(input),
      briefGoal,
      // No lead-form provisioning: service core templates have no vestria-style
      // contact form; the M1 goal-form seed (finalize tail) handles lead capture.
      injectCtx: { socialProfiles: undefined },
    });

    await saveDraft({
      tokenId,
      title,
      paletteId,
      templateId,
      variantId,
      ...briefPatch,
      finalContent,
    });
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Could not save the draft.' };
  }

  // Generation finished — drop the pre-gate handoff so a stale strategy can
  // never leak into a later run for this token. (Error/credits paths KEEP it:
  // a retry after a copy failure must reuse the already-charged strategy.)
  if (pregate && pregate.tokenId === tokenId) pregate = null;

  cb.onStage?.('done');
  return { status: 'done', redirectTo: REDIRECT(tokenId) };
}
