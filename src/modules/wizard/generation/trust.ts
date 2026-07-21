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
import { runCollectionFanOut } from '@/modules/generation/multiPageAssembly';
import { templateMeta, type TemplateLook } from '@/modules/templates/templateMeta';
import { pickSeeded } from '@/modules/generation/spread';
import type { CollectionsFacts } from '@/modules/brief/collections';
import { buildFinalContent, saveDraft, localeConfigPatch, type BriefGoal } from './finalize';
import type { GenerationCallbacks, GenerationResult, GenerationMeta } from './index';
import { trackFailure, failureEventName } from '@/utils/trackTelemetry';

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
    /**
     * proof-truth phase 5 — user-answered approximate testimonial count (manual
     * path). Mirrors thing.ts. Feeds the `cardCountHints.testimonials` seam that
     * selectServiceUIBlocks reads (selectUIBlocks.ts:49-50) ONLY when no scraped
     * `importedTestimonials` exist. NOTE (asymmetry): the service strategy route
     * + assembleServiceStrategy do NOT yet forward cardCountHints to
     * selectServiceUIBlocks, so this hint is plumbed into the strategy payload
     * but DORMANT until that (out-of-scope) forward lands.
     */
    testimonialCount?: number | null;
  };

  /** Verbatim testimonials imported from the user's site (injectRealTestimonials). */
  importedTestimonials?: Array<{ quote: string; author_name: string; author_role: string }>;

  // Style picks (trust picker) — palette/variant for the resolved template.
  paletteId?: string;
  variantId?: string;

  /**
   * template-factory phase 10 — DETERMINISTIC generation spread signal. When the
   * user made NO explicit style pick, the wizard slot sets this to spread the
   * STARTING LOOK for look-bearing templates (hearth): a seeded look bundles
   * palette + variant + knobs, written to the flat columns + `themeValues`
   * (lookId/knobs). Same token → same look (reproducible); different tokens
   * spread across the named looks. An explicit `paletteId`/`variantId` ALWAYS
   * wins. Absent/false ⇒ the template's default palette/variant — byte-identical
   * to today; threaded-but-DORMANT until the slot feeds this flag.
   */
  styleAutoAssign?: boolean;

  // Structure (7b gate output — scale-07 phase 4/5). When `strategy` is
  // present runTrustGeneration NEVER refetches (credit charge-once); when
  // `confirmedSections` is present, sections absent from it get NO copy. Both
  // are forwarded by the store's `buildTrustInput` projection (scale-07
  // phase 5 — the phase-4 module-scoped pre-gate bridge is deleted).
  strategy?: ServiceStrategyOutputAssembled | null;
  confirmedSections?: string[] | null;

  // scale-10 phase 5 — Brief-carried collection entries (facts.collections).
  // Mirror of thing.ts; the collections bridge is DORMANT (no service template
  // declares a collection-family capability) — inert until rung-C.
  collections?: CollectionsFacts;

  /**
   * language-settings phase 3 — the ONBOARDING-declared site language (bare ISO
   * code, e.g. `'nl'`). Absent ⇒ `'en'`. Rides EVERY service route request body
   * as `language` (ruling 11 — mirror of `ThingGenerationInput.siteLanguage`).
   */
  siteLanguage?: string;
}

// ---------------------------------------------------------------------------
// Payload builders — the fidelity surface asserted by trust.test.ts.
// ---------------------------------------------------------------------------

/**
 * The `language` value carried by EVERY service-route request body of this run
 * (strategy, copy, collection-item copy). ONE resolver, called from ALL THREE
 * call sites — including the INLINE collection-item body — so a fan-out path can
 * never silently omit it and half-translate the site. Always emitted (ruling 2);
 * ISO CODE, never an exonym (mapping is server-side, phase 4).
 */
export function payloadLanguage(input: Pick<TrustGenerationInput, 'siteLanguage'>): string {
  return input.siteLanguage || 'en';
}

/**
 * proof-truth phase 5 — testimonials card-count hint precedence, mirror of
 * thing.ts: SCRAPED (`importedTestimonials.length`) wins → else the
 * user-answered approximate count → else undefined (no hint).
 */
export function testimonialCountHint(
  importedCount: number | undefined,
  userCount: number | null | undefined
): number | undefined {
  if (importedCount && importedCount > 0) return importedCount;
  if (userCount && userCount > 0) return userCount;
  return undefined;
}

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

/**
 * template-factory phase 10 — seeded STARTING look for look-bearing templates.
 * Returns a look ONLY when: the user made no explicit palette/variant pick, the
 * wizard signalled auto-assign, and the resolved template declares `looks`
 * (hearth). Deterministic per token; spreads across the named looks. `undefined`
 * ⇒ no spread (the effectivePalette default + declared variant apply — today's
 * behaviour). An explicit pick is honoured here (returns undefined).
 */
export function spreadLook(input: TrustGenerationInput): TemplateLook | undefined {
  if (input.paletteId || input.variantId) return undefined; // explicit pick wins
  if (input.styleAutoAssign !== true) return undefined; // dormant until slot signals
  const templateId = input.templateId ?? 'hearth';
  const looks = templateMeta[templateId as keyof typeof templateMeta]?.looks;
  if (!looks || looks.length === 0) return undefined;
  return pickSeeded(looks, input.tokenId, 'look');
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
    // language-settings phase 3 — always sent (ruling 11 / call-site #1 of 3).
    language: payloadLanguage(input),
    // Selection-only: widens the section SET for templates that declare extra
    // section types (Surge). Server passes it to section selection, NEVER to a
    // prompt builder (firewall preserved).
    ...(input.templateId ? { templateId: input.templateId } : {}),
    // proof-truth phase 5 — deterministic testimonials card-count hint (scraped
    // count wins, else user-answered). Emitted only when a hint exists ⇒ the
    // no-count path is byte-identical. DORMANT until the service route +
    // assembleServiceStrategy forward it to selectServiceUIBlocks (out of scope).
    ...(() => {
      const tHint = testimonialCountHint(
        input.importedTestimonials?.length,
        input.proof.testimonialCount
      );
      return tHint ? { cardCountHints: { testimonials: tHint } } : {};
    })(),
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
    // language-settings phase 3 — always sent (ruling 11 / call-site #2 of 3).
    language: payloadLanguage(input),
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
 * The trust strategy call as a standalone step: SAME payload builder
 * (`buildStrategyPayload`), SAME route (server owns the credit charge), SAME
 * credit-fail detection as the previous inline call.
 *
 * Charge-once (scale-07 phase 5 — bridge deleted): the store's status-guarded
 * `fetchStrategy` calls this exactly once and writes the result into the
 * store; `buildTrustInput` forwards it as `input.strategy` (plus the gate's
 * confirmed body as `input.confirmedSections`), so `runTrustGeneration` never
 * refetches — including on copy-failure retries.
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
      // data-capture phase 4 — non-credit strategy failure (fire-and-forget).
      trackFailure(failureEventName(json?.message), {
        reason: json?.error ?? json?.message ?? null,
        stage: 'strategy',
        templateId: input.templateId ?? null,
        audienceType: 'service',
      });
      throw new Error(json?.message || 'Strategy generation failed');
    }
    return { status: 'done', strategy: json.data as ServiceStrategyOutputAssembled };
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
  const templateId = input.templateId ?? 'hearth';
  // phase 10 — seeded starting look (hearth) when no explicit pick. The look's
  // palette/variant write to the flat columns; its knobs + lookId to themeValues.
  const look = spreadLook(input);
  const paletteId = look?.paletteId ?? effectivePalette(input);
  const variantId =
    look?.variantId ?? input.variantId ?? defaultVariantForTemplate[templateId as TemplateId];
  const lookPatch = look ? { themeValues: { lookId: look.id, knobs: look.knobs } } : {};

  // ─── Strategy (PRIMARY: pre-gate fetch from the structure slot, forwarded
  //     through `input.strategy` by the store's buildTrustInput projection;
  //     fallback: one self-fetch for structure-skipping/reloaded flows) ───
  cb.onStage?.('strategy');
  const confirmedSections = input.confirmedSections ?? null;
  let strategy: ServiceStrategyOutputAssembled;
  if (input.strategy) {
    // Fetched (and charged) exactly once at the 7b gate — never refetch here.
    strategy = input.strategy;
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
  // silent-fallback: the route's degraded-generation signal (mock / incomplete)
  // — surfaced to the slot so a too-fast/canned run isn't mistaken for success.
  let copyMeta: GenerationMeta | undefined;
  try {
    const res = await fetch('/api/audience/service/generate-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCopyPayload(input, strategy)),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      if (isCreditFail(res.status, json?.error)) return { status: 'credits' };
      // data-capture phase 4 — non-credit single-page copy failure.
      trackFailure(failureEventName(json?.message), {
        reason: json?.error ?? json?.message ?? null,
        stage: 'copy',
        templateId: input.templateId ?? null,
        audienceType: 'service',
      });
      throw new Error(json?.message || 'Copy generation failed');
    }
    copySections = json.sections as Record<string, SectionCopy>;
    copyMeta = json.meta as GenerationMeta | undefined;
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
      ...lookPatch,
      ...briefPatch,
      // language-settings phase 3 — durable declaration; `{}` for en/absent.
      ...localeConfigPatch(input.siteLanguage),
      finalContent,
    });

    // scale-10 phase 5 — collections bridge (DORMANT: no service template
    // declares a collection-family capability, so runCollectionFanOut no-ops
    // today). Mirror of thing.ts: item pages carry the record; the merge CLAMPS
    // to Brief entries + keeps record fields VERBATIM. Charge stays FLAT.
    const declaredCaps = templateMeta[templateId as keyof typeof templateMeta]?.capabilities ?? [];
    const collResult = await runCollectionFanOut({
      fc: finalContent,
      collections: (input.collections ?? {}) as CollectionsFacts,
      declaredCapabilities: declaredCaps,
      persist: async (fc) => {
        await saveDraft({ tokenId, title, paletteId, templateId, variantId, ...lookPatch, ...briefPatch, ...localeConfigPatch(input.siteLanguage), finalContent: fc });
      },
      generateItemCopy: async (plan) => {
        try {
          const res = await fetch('/api/audience/service/generate-copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strategy,
              uiblocks: strategy.uiblocks,
              oneLiner: input.oneLiner,
              businessName: input.businessName,
              offer: input.offer,
              goal: serviceGoalFor(input),
              understanding: buildUnderstanding(input),
              // language-settings phase 3 — call-site #3 of 3 (COLLECTION-ITEM
              // fan-out). Inline body (not buildCopyPayload) ⇒ explicit field, or
              // a Dutch site's item pages would come back in English.
              language: payloadLanguage(input),
              // Record in the payload — AI writes connective copy only; record
              // fields are kept verbatim by the clamp on merge.
              collectionItem: plan.entry,
              collectionKey: plan.collectionKey,
            }),
          });
          const json = await res.json();
          if (!res.ok || !json?.success) {
            if (isCreditFail(res.status, json?.error)) return { status: 'credits' };
            // data-capture phase 4 — non-credit collection-item copy failure.
            trackFailure(failureEventName(json?.message), {
              reason: json?.error ?? json?.message ?? null,
              stage: 'copy',
              templateId: input.templateId ?? null,
              audienceType: 'service',
              pageKey: plan.pageKey,
            });
            return { status: 'error', error: json?.message || `Copy generation failed (${plan.entry.name})` };
          }
          return { status: 'done', copy: json.sections as Record<string, SectionCopy> };
        } catch (e: any) {
          return { status: 'error', error: e?.message || 'Copy generation failed.' };
        }
      },
    });
    if (collResult.status === 'credits') return { status: 'credits' };
    if (collResult.status === 'error') return { status: 'error', error: collResult.error };
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Could not save the draft.' };
  }

  cb.onStage?.('done');
  return { status: 'done', redirectTo: REDIRECT(tokenId), meta: copyMeta };
}
