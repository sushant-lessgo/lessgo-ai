// src/modules/wizard/generation/thing.ts
// scale-06 phase 5 — the THING generation adapter.
//
// Maps unified wizard/Brief state → the EXACT payloads the product audience
// routes (/api/audience/product/strategy + /generate-copy) already expect today
// (route contracts UNCHANGED except the phase-4 additive `proof` object, which
// we now POPULATE from the store's proof booleans). PORTED — not moved — from
// the ~930-line product GeneratingStep:
//   • single-page strategy → copy → save
//   • multi-page fan-out (`runFanOut`, per-page persistence + resume)
//   • manufacturer field remap (features←valueAdds, categories←productCategories,
//     otherAudiences←industriesServed) + whatYouMake
//   • manufacturer deterministic TechPremium path (buildTechPremiumHomeFinalContent)
//   • resume-from-DB (in-progress multi-page generation wins)
//
// FIREWALL: PLAIN module (no `'use client'`), executed client-side by
// `GeneratingSlot`. Imports only plain helpers + the shared `finalize` tail;
// NEVER imports `useWizardStore` — the slot reads the store and hands this
// adapter PLAIN DATA. The published-client boundary is preserved (this path is
// never imported by a published renderer).

import type { SectionCopy, LandingGoal } from '@/types/generation';
import type { ProductStrategyOutput, SitemapPage } from '@/types/product';
import {
  defaultMeridianPalette,
  defaultMeridianVariant,
  defaultTechPremiumPalette,
  defaultTechPremiumVariant,
  defaultVestriaPalette,
  meridianPalettes,
} from '@/types/product';
import { selectEligibleBlock } from '@/modules/generation/blockEligibility';
import { pickSeeded } from '@/modules/generation/spread';
import type { GoalIntent } from '@/modules/goals/vocabulary';
import {
  intentToBriefGoal,
  intentToLegacyGoal,
  type GoalParamInput,
} from '@/modules/brief/bridge';
import { buildTechPremiumHomeFinalContent } from '@/hooks/editStore/archetypes';
import { selectProductBlocks } from '@/modules/audience/product/selectBlocks';
import { isMultipage } from '@/modules/audience/product/pageArchetypes';
import { businessTypes, type BusinessTypeKey } from '@/modules/businessTypes/config';
import {
  buildMultiPageSkeleton,
  mergePageIntoFinalContent,
  finalizeMultiPageGeneration,
  isResumableGeneration,
  runCollectionFanOut,
  type MultiPageOnboardingData,
} from '@/modules/generation/multiPageAssembly';
import { templateMeta } from '@/modules/templates/templateMeta';
import type { CollectionsFacts } from '@/modules/brief/collections';
import { isImagesAtBirthEnabled } from '@/lib/generation/flag';
import { injectImagesForPage } from '@/lib/generation/imagesAtBirth';
import {
  DEFAULT_VESTRIA_LEAD_FIELDS,
  VESTRIA_LEAD_SUBMIT_TEXT,
  VESTRIA_LEAD_SUCCESS_MESSAGE,
} from '@/modules/templates/vestria/blocks/Contact/contactFields';
import { buildFinalContent, saveDraft, type BriefGoal } from './finalize';
import type { GenerationCallbacks, GenerationResult } from './index';
import { trackFailure, failureEventName } from '@/utils/trackTelemetry';

// Pilot locks — single-page THING (meridian). Style pickers only affect vestria.
const PILOT_PALETTE = defaultMeridianPalette; // 'mint'
const PILOT_VARIANT = defaultMeridianVariant; // 'developer'
const PILOT_TEMPLATE = 'meridian';

const VESTRIA_HERO_LAYOUTS = ['VestriaTailoredHero', 'VestriaFullBleedHero'];

// ---------------------------------------------------------------------------
// Adapter input — the PLAIN projection of `useWizardStore` the slot builds.
// ---------------------------------------------------------------------------

export interface ThingGenerationInput {
  tokenId: string;
  /** Resolved template (serveGate). techpremium ⇒ deterministic path. */
  templateId: 'meridian' | 'vestria' | 'techpremium' | null;
  /**
   * businessType key (serveGate/classify) — the SINGLE source of product
   * copy-voice (scale-08 phase 1, `productVoiceForBusinessType`). Always set on
   * served flows (serve gate resolves a template only for a KNOWN businessType);
   * absent only on legacy/fallback inputs (voice then defaults to modern-tech).
   */
  businessTypeKey?: string;

  // Copy facts (wizard contract fields).
  productName: string;
  oneLiner: string;
  /** capabilities (SaaS) — the generic feature list. */
  features: string[];
  audiences: string[];
  categories: string[];
  differentiator?: string;
  objectionFacts?: string;
  offer: string;

  // Manufacturer (vestria) extras — absent on the SaaS path.
  whatYouMake?: string;
  productCategories?: string[];
  industriesServed?: string[];
  valueAdds?: string[];

  // Goal (scale-05).
  goalIntent: GoalIntent | null;
  goalParam?: GoalParamInput;

  // Proof hard rule (phase-4 additive) — populated from proof booleans.
  // proof-truth phase 5: `testimonialCount` is the user-answered approximate
  // count (manual path); feeds the fan-out `cardCountHints.testimonials` seam
  // ONLY when no scraped `importedTestimonials` exist (scraped stays authoritative).
  proof?: { hasTestimonials?: boolean; testimonialCount?: number | null };
  importedTestimonials?: Array<{ quote: string; author_name: string; author_role: string }>;
  importSourceUrl?: string;

  // Structure (multi-page gate output) — from StructureSlot / gate.
  strategy?: ProductStrategyOutput | null;
  sitemap?: SitemapPage[] | null;

  // scale-10 phase 5 — Brief-carried collection entries (facts.collections).
  // Threaded into the persisted onboardingData so the (DORMANT) collections
  // bridge can build index + item pages. Not populated by the store projection
  // yet — the bridge is inert until a product template declares a collection-
  // family capability (rung-C).
  collections?: CollectionsFacts;

  // Style picks (vestria only) — mirrors the old generation-store picks.
  paletteId?: string;
  variantId?: string;
  mood?: string;
  heroVariant?: string;
  heroVariantPicked?: boolean;
  styleVariantPicked?: boolean;
  stylePalettePicked?: boolean;
  styleMoodPicked?: boolean;

  /**
   * template-factory phase 10 — DETERMINISTIC generation spread signal. When the
   * user made NO explicit style pick (meridian pilot has no picker), the wizard
   * slot sets this to spread the STARTING palette + block-variants deterministically
   * from the project token (same token → same start; different tokens vary). An
   * explicit `paletteId`/`variantId` ALWAYS wins over spread. Absent/false ⇒ the
   * pilot-locked defaults (mint / declared blocks) — byte-identical to today; the
   * mechanism is threaded-but-DORMANT until the slot feeds this flag (mirrors the
   * cardCountHints / collections seams).
   */
  styleAutoAssign?: boolean;
}

// ---------------------------------------------------------------------------
// Payload builders — the fidelity surface asserted by thing.test.ts.
// ---------------------------------------------------------------------------

/** Legacy LandingGoal enum the routes require (derived from the captured intent). */
export function landingGoalFor(input: ThingGenerationInput): LandingGoal {
  return input.goalIntent ? intentToLegacyGoal(input.goalIntent, 'product') : 'signup';
}

/**
 * proof-truth phase 5 — precedence for the testimonials card-count hint:
 * SCRAPED (`importedTestimonials.length`) wins → else the user-answered
 * approximate count → else undefined (no hint ⇒ current behavior). Pure so
 * both the fan-out and tests share the exact rule.
 */
export function testimonialCountHint(
  importedCount: number | undefined,
  userCount: number | null | undefined
): number | undefined {
  if (importedCount && importedCount > 0) return importedCount;
  if (userCount && userCount > 0) return userCount;
  return undefined;
}

/** Composed Brief.goal — seeds the M1 form + goal sections in the shared tail. */
export function briefGoalFor(input: ThingGenerationInput): BriefGoal | null {
  return input.goalIntent
    ? intentToBriefGoal(input.goalIntent, input.goalParam, {
        businessName: input.productName,
        offer: input.offer,
      })
    : null;
}

/**
 * Whether this run uses the manufacturer EXTRACTION-SCHEMA shape (field remap:
 * valueAdds→features, industriesServed→otherAudiences, productCategories→
 * categories, + whatYouMake). scale-08 phase 2: derived from the businessType
 * config entry's `extractionSchemaKey`, NOT the templateId — the remap is a
 * property of the business type's captured fields, not the visual template.
 */
function isManufacturerInput(input: ThingGenerationInput): boolean {
  const entry = businessTypes[input.businessTypeKey as BusinessTypeKey];
  return entry?.extractionSchemaKey === 'manufacturer';
}

/** Effective feature list — manufacturer remap (valueAdds win) else SaaS features. */
function effectiveFeatures(input: ThingGenerationInput, isMfr: boolean): string[] {
  return isMfr ? input.valueAdds ?? input.features ?? [] : input.features ?? [];
}

/** The EXACT /api/audience/product/strategy request body. */
export function buildStrategyPayload(input: ThingGenerationInput): Record<string, unknown> {
  const isMfr = isManufacturerInput(input);
  const features = effectiveFeatures(input, isMfr);
  const audiences = input.audiences ?? [];
  const briefGoal = briefGoalFor(input);
  return {
    productName: input.productName.trim() || 'Your Product',
    oneLiner: input.oneLiner,
    features,
    landingGoal: landingGoalFor(input),
    offer: input.offer,
    primaryAudience:
      audiences[0] || (isMfr ? 'trade buyers / procurement teams' : 'early adopters'),
    otherAudiences: isMfr ? input.industriesServed ?? [] : audiences.slice(1),
    categories: isMfr ? input.productCategories ?? input.categories ?? [] : input.categories ?? [],
    ...(isMfr && input.whatYouMake ? { whatYouMake: input.whatYouMake } : {}),
    templateId: input.templateId ?? undefined,
    // Proof hard rule (phase 4) — fed to assembleProductStrategy so an unpromised
    // testimonials section is never generated. Absent ⇒ old behavior.
    ...(input.proof ? { proof: input.proof } : {}),
    // scale-07 phase 5 (carryover a): the Brief goal reaches the route so the
    // single-page assembly re-surfaces Brief-required capability sections
    // (meridian: an M1 goal ⇒ lead-form ⇒ cta). Fed ONLY to isMultipage
    // detection + assembleProductStrategy server-side, never the prompt.
    // scale-08 phase 1: brief now ALSO carries `businessType` (voice source) —
    // sent whenever a goal OR a businessType key exists.
    ...(briefGoal || input.businessTypeKey
      ? {
          brief: {
            ...(briefGoal ? { goal: briefGoal } : {}),
            ...(input.businessTypeKey ? { businessType: input.businessTypeKey } : {}),
          },
        }
      : {}),
  };
}

/** The EXACT /api/audience/product/generate-copy request body (single-page). */
export function buildCopyPayload(
  input: ThingGenerationInput,
  strategy: ProductStrategyOutput
): Record<string, unknown> {
  const isMfr = isManufacturerInput(input);
  return {
    strategy,
    uiblocks: strategy.uiblocks,
    productName: input.productName.trim() || 'Your Product',
    oneLiner: input.oneLiner,
    offer: input.offer,
    landingGoal: landingGoalFor(input),
    features: effectiveFeatures(input, isMfr),
    ...(input.importedTestimonials?.length ? { realTestimonials: input.importedTestimonials } : {}),
    templateId: input.templateId ?? undefined,
    // scale-08 phase 1: the copy route derives voice from businessType.
    businessType: input.businessTypeKey,
  };
}

/** Product onboardingData snapshot persisted in finalContent (SiteContext link). */
function buildOnboardingData(input: ThingGenerationInput): Record<string, unknown> {
  const understanding = {
    features: input.features,
    audiences: input.audiences,
    categories: input.categories,
    ...(input.valueAdds ? { valueAdds: input.valueAdds } : {}),
    ...(input.productCategories ? { productCategories: input.productCategories } : {}),
    ...(input.industriesServed ? { industriesServed: input.industriesServed } : {}),
    ...(input.whatYouMake ? { whatYouMake: input.whatYouMake } : {}),
    ...(input.differentiator ? { differentiator: input.differentiator } : {}),
    ...(input.objectionFacts ? { objectionFacts: input.objectionFacts } : {}),
  };
  return {
    oneLiner: input.oneLiner,
    productName: input.productName,
    understanding,
    landingGoal: landingGoalFor(input),
    offer: input.offer,
    ...(input.importSourceUrl ? { importSourceUrl: input.importSourceUrl } : {}),
    // scale-08 phase 1: persist the businessType key so a resume-from-DB run
    // (multipage fan-out) can re-derive the copy voice without the store.
    ...(input.businessTypeKey ? { businessTypeKey: input.businessTypeKey } : {}),
  };
}

// ---------------------------------------------------------------------------
// Hero-variant application (ported verbatim from the old GeneratingStep).
// ---------------------------------------------------------------------------

function applyHeroVariantToFinalContent(fc: any, variant: string): void {
  if (!fc) return;
  const applyTo = (
    content: Record<string, any> | undefined,
    sectionLayouts: Record<string, string> | undefined
  ) => {
    if (!content) return;
    for (const id of Object.keys(content)) {
      if (!id.startsWith('hero-')) continue;
      const entry = content[id];
      if (!entry || !VESTRIA_HERO_LAYOUTS.includes(entry.layout)) continue;
      entry.layout = variant; // authoritative
      if (sectionLayouts && id in sectionLayouts) sectionLayouts[id] = variant; // mirror
    }
  };
  applyTo(fc.content, fc.layout?.sectionLayouts);
  if (fc.pages) {
    for (const key of Object.keys(fc.pages)) {
      const page = fc.pages[key];
      applyTo(page?.content, page?.sectionLayouts);
    }
  }
}

// ---------------------------------------------------------------------------
// Generation spread (template-factory phase 10) — meridian single-page only.
// Reproducible variety from the project token; an explicit user pick wins.
// ---------------------------------------------------------------------------

/** Spread applies only when the user made NO explicit style pick AND the wizard
 * signalled auto-assign. An explicit palette/variant is honoured (never spread). */
function shouldSpreadMeridian(input: ThingGenerationInput): boolean {
  if (input.paletteId || input.variantId) return false;
  return input.styleAutoAssign === true;
}

/** Seeded meridian starting palette (else the pilot default 'mint'). */
function spreadMeridianPalette(token: string): string {
  return pickSeeded(meridianPalettes, token, 'palette') ?? PILOT_PALETTE;
}

/**
 * Re-pick each section's block among its ELIGIBLE variants, seeded by the token.
 * Keys of `uiblocks` are section TYPES. No asset facts ⇒ asset-gated variants
 * (e.g. EditorialPhotoHero) stay ineligible, so the hero keeps its declared
 * default; only same-contract variants (features/testimonials) spread. Sections
 * with no manifest entry keep their incoming layout name. Copy is unchanged —
 * spread only swaps among co-eligible, same-consumes blocks.
 */
function spreadMeridianBlocks(
  uiblocks: Record<string, string>,
  token: string
): Record<string, string> {
  const out: Record<string, string> = { ...uiblocks };
  for (const sectionType of Object.keys(uiblocks)) {
    const pick = selectEligibleBlock(PILOT_TEMPLATE, sectionType, { seed: token });
    if (pick) out[sectionType] = pick;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The adapter entry point (dispatched by runGeneration).
// ---------------------------------------------------------------------------

const REDIRECT = (tokenId: string) => `/edit/${tokenId}`;

function isCreditFail(status: number, error: string | undefined): boolean {
  return status === 402 || /credit/i.test(error ?? '');
}

// ---------------------------------------------------------------------------
// Strategy step (scale-07 phase 3) — extracted so the STRUCTURE slot can run
// it PRE-gate via the wizard store's `fetchStrategy` action.
// ---------------------------------------------------------------------------

export type RunStrategyResult =
  | { status: 'done'; strategy: ProductStrategyOutput }
  | { status: 'credits' }
  | { status: 'error'; error: string };

/**
 * The strategy call as a standalone step: SAME payload builder
 * (`buildStrategyPayload`), SAME route (the server owns the credit charge AND
 * the `clampSitemap` law over the LLM's sitemap proposal), SAME credit-fail
 * detection as the old inline call.
 *
 * Charged EXACTLY ONCE per run: the primary caller is the wizard store's
 * `fetchStrategy` action (fired when the wizard reaches the structure slot),
 * which writes the result into the store via `setStrategy`/`setSitemap`.
 * `runThingGeneration` then receives a non-null `input.strategy` and NEVER
 * refetches — its tail call below survives only as a fallback for
 * structure-skipping flows where no strategy was fetched pre-gate.
 */
export async function runStrategy(input: ThingGenerationInput): Promise<RunStrategyResult> {
  try {
    const res = await fetch('/api/audience/product/strategy', {
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
        audienceType: 'product',
      });
      throw new Error(json?.message || 'Strategy generation failed');
    }
    return { status: 'done', strategy: json.data as ProductStrategyOutput };
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Strategy generation failed.' };
  }
}

export async function runThingGeneration(
  input: ThingGenerationInput,
  cb: GenerationCallbacks = {}
): Promise<GenerationResult> {
  const { tokenId } = input;
  const title = (input.productName.trim() || input.oneLiner || 'Untitled Page').slice(0, 50);
  const briefGoal = briefGoalFor(input);
  const briefPatch = briefGoal ? { brief: { goal: briefGoal } } : {};
  // scale-07 phase 5 re-key: was the vestria hardcode. Multipage is a
  // CAPABILITY question — today only vestria declares it, so behavior is
  // identical, but the key is honest. This flag also selects the multipage
  // template's style defaults + lead-form provisioning below (vestria-shaped
  // today — the only multipage template), plus the hero-variant + style
  // re-apply in saveFC (scale-08 phase 2: style pickers ship with the
  // multipage pilot — a capability question, not a businessType one).
  const multipageTemplate = isMultipage(input.templateId);
  // The resolved template for payloads/persistence on this run (never a
  // hardcoded id): the input's template, else the single-page pilot.
  const resolvedTemplateId = input.templateId ?? PILOT_TEMPLATE;

  // ─── saveFC: persist a multi-page finalContent (hero/style picks re-applied) ──
  const saveFC = async (
    fc: any,
    templateInfo?: { templateId: string; paletteId: string; variantId: string }
  ) => {
    if (multipageTemplate && input.heroVariantPicked && input.heroVariant) {
      applyHeroVariantToFinalContent(fc, input.heroVariant);
    }
    const styleInfo = multipageTemplate
      ? {
          ...(input.styleVariantPicked && input.variantId ? { variantId: input.variantId } : {}),
          ...(input.stylePalettePicked && input.paletteId ? { paletteId: input.paletteId } : {}),
          ...(input.styleMoodPicked && input.mood ? { themeValues: { mood: input.mood } } : {}),
        }
      : {};
    await saveDraft({
      tokenId,
      title: fc.meta?.title || title,
      ...(templateInfo ?? {}),
      ...styleInfo,
      ...briefPatch,
      finalContent: fc,
    });
  };

  // ─── Multi-page fan-out (ported): per-page copy + persistence + resume ───
  const runFanOut = async (fc: any): Promise<GenerationResult> => {
    const ob = fc.onboardingData as MultiPageOnboardingData;
    const sitemap: SitemapPage[] = ob.sitemap;
    const fanStrategy = ob.strategy;
    const fanFeatures: string[] = ob.understanding?.valueAdds ?? ob.understanding?.features ?? [];
    const sitePages = sitemap.map((p) => ({ title: p.title, pathSlug: p.pathSlug }));
    const total = sitemap.length;

    cb.onStage?.('copy');
    try {
      for (let i = 0; i < sitemap.length; i++) {
        const page = sitemap[i];
        if (fc.generationProgress.completedPageKeys.includes(page.archetypeKey)) continue;
        cb.onPageProgress?.({ done: fc.generationProgress.completedPageKeys.length + 1, total });

        const isHome = page.pathSlug === '/';
        const types = isHome ? ['header', ...page.sections, 'footer'] : [...page.sections];
        // scale-09 phase 4 — deterministic card-count hints (feature / imported-
        // testimonial counts). Optional; no-op for existing single-variant sections.
        const cardCountHints: Record<string, number> = {};
        if (fanFeatures.length > 0) cardCountHints.features = fanFeatures.length;
        // proof-truth phase 5 — scraped count wins; user-answered count only
        // when no scraped quotes exist; neither ⇒ no hint (prior behavior).
        const tHint = testimonialCountHint(
          ob.importedTestimonials?.length,
          input.proof?.testimonialCount
        );
        if (tHint) cardCountHints.testimonials = tHint;
        const { uiblocks } = selectProductBlocks({
          sections: types,
          templateId: resolvedTemplateId,
          cardCountHints,
        });

        const res = await fetch('/api/audience/product/generate-copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy: fanStrategy,
            uiblocks,
            productName: (ob.productName || '').trim() || 'Your Product',
            oneLiner: ob.oneLiner,
            offer: ob.offer,
            landingGoal: ob.landingGoal,
            features: fanFeatures,
            ...(page.sections.includes('testimonials') && ob.importedTestimonials?.length
              ? { realTestimonials: ob.importedTestimonials }
              : {}),
            templateId: resolvedTemplateId,
            // scale-08 phase 1: voice source. Fan-out is multipage-only (=
            // manufacturer today); the fallback covers in-flight resumable
            // drafts persisted before this key existed. Transitional.
            businessType: ob.businessTypeKey ?? 'manufacturer',
            page: {
              archetypeKey: page.archetypeKey,
              title: page.title,
              pathSlug: page.pathSlug,
              isHome,
            },
            sitePages,
            ...(ob.importSourceUrl ? { sourceUrl: ob.importSourceUrl } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          if (isCreditFail(res.status, json?.error)) return { status: 'credits' };
          // data-capture phase 4 — non-credit per-page copy failure.
          trackFailure(failureEventName(json?.message), {
            reason: json?.error ?? json?.message ?? null,
            stage: 'copy',
            templateId: resolvedTemplateId,
            audienceType: 'product',
            pageKey: page.archetypeKey,
          });
          throw new Error(json?.message || `Copy generation failed (${page.title})`);
        }

        mergePageIntoFinalContent({
          fc,
          page,
          order: i,
          copy: json.sections,
          templateId: resolvedTemplateId,
          formSpec: {
            fields: DEFAULT_VESTRIA_LEAD_FIELDS,
            submitButtonText: VESTRIA_LEAD_SUBMIT_TEXT,
            successMessage: VESTRIA_LEAD_SUCCESS_MESSAGE,
          },
        });

        if (isImagesAtBirthEnabled()) {
          const imgPaletteId = input.stylePalettePicked && input.paletteId ? input.paletteId : defaultVestriaPalette;
          const imgCategories: string[] = ob.understanding?.productCategories ?? ob.understanding?.categories ?? [];
          await injectImagesForPage({
            content: fc.pages[page.archetypeKey].content,
            templateId: resolvedTemplateId,
            paletteId: imgPaletteId,
            categories: imgCategories,
          });
        }

        await saveFC(fc); // persist THIS page before generating the next
      }
    } catch (e: any) {
      return { status: 'error', error: e?.message || 'Copy generation failed.' };
    }

    // scale-10 phase 5 — collections bridge (DORMANT: no product template
    // declares a collection-family capability, so runCollectionFanOut no-ops
    // today). Item pages POST with the record; the merge CLAMPS to Brief entries
    // + keeps record fields VERBATIM. Charge stays FLAT (no extra strategy call);
    // item page keys ride completedPageKeys for per-page persistence/resume.
    const declaredCaps = templateMeta[resolvedTemplateId as keyof typeof templateMeta]?.capabilities ?? [];
    const collResult = await runCollectionFanOut({
      fc,
      collections: (ob.collections ?? {}) as CollectionsFacts,
      declaredCapabilities: declaredCaps,
      persist: saveFC,
      generateItemCopy: async (plan) => {
        const itemPage = fc.pages[plan.pageKey];
        const types: string[] = (itemPage?.sections ?? []).map(
          (id: string) => itemPage.content?.[id]?.type ?? id.split('-')[0]
        );
        const { uiblocks } = selectProductBlocks({ sections: types, templateId: resolvedTemplateId });
        try {
          const res = await fetch('/api/audience/product/generate-copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strategy: fanStrategy,
              uiblocks,
              productName: (ob.productName || '').trim() || 'Your Product',
              oneLiner: ob.oneLiner,
              offer: ob.offer,
              landingGoal: ob.landingGoal,
              features: fanFeatures,
              templateId: resolvedTemplateId,
              businessType: ob.businessTypeKey ?? 'manufacturer',
              // Record in the payload — AI writes connective copy only; record
              // fields are kept verbatim by the clamp on merge.
              collectionItem: plan.entry,
              collectionKey: plan.collectionKey,
              page: { archetypeKey: plan.pageKey, title: plan.entry.name, pathSlug: plan.pathSlug, isHome: false },
              sitePages,
              ...(ob.importSourceUrl ? { sourceUrl: ob.importSourceUrl } : {}),
            }),
          });
          const json = await res.json();
          if (!res.ok || !json?.success) {
            if (isCreditFail(res.status, json?.error)) return { status: 'credits' };
            // data-capture phase 4 — non-credit collection-item copy failure.
            trackFailure(failureEventName(json?.message), {
              reason: json?.error ?? json?.message ?? null,
              stage: 'copy',
              templateId: resolvedTemplateId,
              audienceType: 'product',
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

    cb.onStage?.('saving');
    try {
      finalizeMultiPageGeneration(fc, briefGoal);
      await saveFC(fc);
    } catch (e: any) {
      return { status: 'error', error: e?.message || 'Could not save the draft.' };
    }

    cb.onStage?.('done');
    return { status: 'done', redirectTo: REDIRECT(tokenId) };
  };

  // ─── Resume check FIRST: an in-progress multi-page generation in the DB wins ──
  try {
    const res = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
    if (res.ok) {
      const json = await res.json();
      const loaded = json?.finalContent || json?.content?.finalContent || json?.content;
      if (isResumableGeneration(loaded)) {
        return runFanOut(loaded);
      }
    }
  } catch {
    /* resume is best-effort — fall through to a fresh run */
  }

  const isMfr = isManufacturerInput(input);

  // ─── Manufacturer deterministic TechPremium path (persona is dead in the
  //     unified wizard: keyed on the resolved templateId instead) ───
  if (input.templateId === 'techpremium') {
    cb.onStage?.('saving');
    try {
      const finalContent = buildTechPremiumHomeFinalContent({
        tokenId,
        title,
        productName: input.productName.trim(),
        oneLiner: input.oneLiner,
        understanding: buildOnboardingData(input).understanding,
        landingGoal: landingGoalFor(input),
        offer: input.offer,
      });
      await saveDraft({
        tokenId,
        title,
        paletteId: defaultTechPremiumPalette,
        templateId: 'techpremium',
        variantId: defaultTechPremiumVariant,
        ...briefPatch,
        finalContent,
      });
    } catch (e: any) {
      return { status: 'error', error: e?.message || 'Could not save the draft.' };
    }
    cb.onStage?.('done');
    return { status: 'done', redirectTo: REDIRECT(tokenId) };
  }

  // ─── Copy + Save (shared tail; strategy from the gate or the fetch below) ───
  const runCopyAndSave = async (rawStrategy: ProductStrategyOutput): Promise<GenerationResult> => {
    // phase 10 — meridian single-page block-variant spread (seeded, reproducible).
    // Multipage/vestria unaffected; explicit picks honoured via shouldSpreadMeridian.
    const strategy: ProductStrategyOutput =
      !multipageTemplate && shouldSpreadMeridian(input)
        ? { ...rawStrategy, uiblocks: spreadMeridianBlocks(rawStrategy.uiblocks, tokenId) }
        : rawStrategy;

    cb.onStage?.('copy');
    let copySections: Record<string, SectionCopy>;
    try {
      const res = await fetch('/api/audience/product/generate-copy', {
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
          templateId: resolvedTemplateId,
          audienceType: 'product',
        });
        throw new Error(json?.message || 'Copy generation failed');
      }
      copySections = json.sections as Record<string, SectionCopy>;
    } catch (e: any) {
      return { status: 'error', error: e?.message || 'Copy generation failed.' };
    }

    cb.onStage?.('saving');
    const templateId = multipageTemplate ? resolvedTemplateId : PILOT_TEMPLATE;
    // phase 10 — meridian STARTING palette spread (seeded) when no explicit pick.
    const paletteId = multipageTemplate
      ? input.paletteId ?? defaultVestriaPalette
      : input.paletteId ?? (shouldSpreadMeridian(input) ? spreadMeridianPalette(tokenId) : PILOT_PALETTE);
    const variantId = multipageTemplate ? input.variantId ?? 'tailored' : PILOT_VARIANT;
    try {
      const { finalContent } = buildFinalContent({
        tokenId,
        title,
        sections: strategy.sections,
        uiblocks: strategy.uiblocks,
        copy: copySections,
        onboardingData: buildOnboardingData(input),
        briefGoal,
        ...(multipageTemplate
          ? {
              leadForm: {
                sectionType: 'contact',
                name: 'Contact',
                fields: DEFAULT_VESTRIA_LEAD_FIELDS,
                submitButtonText: VESTRIA_LEAD_SUBMIT_TEXT,
                successMessage: VESTRIA_LEAD_SUCCESS_MESSAGE,
              },
            }
          : {}),
      });

      if (multipageTemplate && input.heroVariantPicked && input.heroVariant) {
        applyHeroVariantToFinalContent(finalContent, input.heroVariant);
      }

      if (isImagesAtBirthEnabled()) {
        const imgCategories: string[] = isMfr
          ? input.productCategories ?? input.categories ?? []
          : input.categories ?? [];
        await injectImagesForPage({ content: finalContent.content, templateId, paletteId, categories: imgCategories });
      }

      await saveDraft({
        tokenId,
        title,
        paletteId,
        templateId,
        variantId,
        ...(multipageTemplate && input.styleMoodPicked && input.mood ? { themeValues: { mood: input.mood } } : {}),
        ...briefPatch,
        finalContent,
      });
    } catch (e: any) {
      return { status: 'error', error: e?.message || 'Could not save the draft.' };
    }

    cb.onStage?.('done');
    return { status: 'done', redirectTo: REDIRECT(tokenId) };
  };

  // ─── Strategy (PRIMARY path: fetched pre-gate at the structure slot) ───
  // The wizard store's fetchStrategy action already ran `runStrategy` when the
  // user reached the structure slot, so `input.strategy` (and, for multipage,
  // `input.sitemap`) carry the USER-CONFIRMED shape — reuse it, NO second
  // charge. A section/page absent from the confirmed structure gets no copy
  // call (fan-out iterates `input.sitemap`; single-page copies
  // `strategy.sections`).
  if (input.strategy) {
    if (input.sitemap?.length) {
      const ob: MultiPageOnboardingData = {
        oneLiner: input.oneLiner,
        productName: input.productName,
        understanding: buildOnboardingData(input).understanding,
        landingGoal: landingGoalFor(input),
        offer: input.offer,
        ...(input.importSourceUrl ? { importSourceUrl: input.importSourceUrl } : {}),
        ...(input.importedTestimonials?.length ? { importedTestimonials: input.importedTestimonials } : {}),
        ...(input.businessTypeKey ? { businessTypeKey: input.businessTypeKey } : {}),
        ...(input.collections ? { collections: input.collections } : {}),
        sitemap: input.sitemap,
        strategy: input.strategy,
      };
      const fc = buildMultiPageSkeleton({ tokenId, title, onboardingData: ob });
      try {
        await saveFC(fc, {
          templateId: resolvedTemplateId,
          paletteId: input.paletteId ?? defaultVestriaPalette,
          variantId: input.variantId ?? 'tailored',
        });
      } catch (e: any) {
        return { status: 'error', error: e?.message || 'Could not save the draft.' };
      }
      return runFanOut(fc);
    }
    return runCopyAndSave(input.strategy);
  }

  // ─── Fallback: no pre-gate strategy (structure-skipping flow) — fetch here ───
  cb.onStage?.('strategy');
  const strategyResult = await runStrategy(input);
  if (strategyResult.status !== 'done') return strategyResult;

  return runCopyAndSave(strategyResult.strategy);
}
