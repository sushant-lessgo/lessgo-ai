'use client';

// src/hooks/useWizardStore.ts
// scale-06 phase 2 — the UNIFIED, Brief-backed wizard store.
//
// Single source of truth for the one wizard that serves every engine. Replaces
// the product/service fork (useProductGenerationStore + useServiceGenerationStore
// stay UNTOUCHED until phase 10; NOTHING consumes this store yet).
//
// Design (plan D "Store"):
//   • engine / businessTypeKey / audienceType / templateId are RESOLVED from the
//     confirmed Brief + serveGate result (persisted on the Project at confirm).
//   • Slot machine is keyed by SLOT IDs (not indices) — the slot list is COMPUTED
//     from the engine contract (`getContract`) with per-engine slot skips applied
//     (work skips `structure`; trust joined the 7b gate in scale-07 phase 4).
//     goToSlot/nextSlot/prevSlot operate on ids.
//   • Per-field state reuses the useOnboardingStore idea: `{ value, source, confirmed }`
//     plus the phase-1 waterfall `state` (scraped|inferred|ask|drop) so slots can
//     render ask-fields as questions and scraped/inferred as confirmable chips.
//     Field logic is NOT duplicated here — it comes from
//     `src/modules/wizard/waterfall.ts` (pure) + `src/modules/engines/inputContracts.ts`.
//   • `mode: 'review' | 'fill'` is DERIVED from the entry source: a URL/scrape
//     entry (rawInput is URL-like) ⇒ review; a manual one-liner ⇒ fill.
//   • Goal reuses scale-05: goalIntent/goalParam + intentToBriefGoal composer.
//   • Proof booleans are a SUPERSET of ServiceAssetAvailability (type-guarded).
//   • structure: strategy + sitemap (thing multipage) / structureSections
//     (single-page, thing AND trust — scale-07 phase 4). thing-only:
//     hero/style/mood picks. trust-only: variantId/paletteId.
//
// FIREWALL: client store. Imports only pure helpers (contracts/waterfall/bridge/
// businessTypes) + types. Never imports a template resolver/registry/renderer or
// a published-renderer module.

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { Brief, CapabilityId, CopyEngine } from '@/types/brief';
import type { AudienceType, TemplateId } from '@/types/service';
import type { GoalIntent } from '@/modules/goals/vocabulary';
import type { GoalParamInput } from '@/modules/brief/bridge';
import { intentToBriefGoal } from '@/modules/brief/bridge';
import { getEntryFacts, type EntryFacts } from '@/modules/brief/classify';
import {
  businessTypes,
  type BusinessTypeEntry,
  type BusinessTypeKey,
} from '@/modules/businessTypes/config';
import {
  getContract,
  lockedSectionsForEngine,
  wizardSlots,
  type ContractField,
  type WizardSlot,
} from '@/modules/engines/inputContracts';
import { computeFieldStates, type FieldState } from '@/modules/wizard/waterfall';
// Single-page structure clamp law (scale-07 phase 4) — plain data-layer module
// (generalized clampSitemap sibling), safe for the client store.
import { applyConfirmedSections } from '@/modules/audience/product/strategy/parseStrategyProduct';
// scale-07 phase 6 — pure data-layer hard-fit helper (templateMeta/coreSections
// data only, no template modules; firewall-safe for the client store).
import {
  requiredCapabilitiesFromStructure,
  type ConfirmedStructure,
} from '@/modules/templates/fit';
// Type-only — proves WizardProofState ⊇ ServiceAssetAvailability (see guard
// below). Canonical home is @/types/service since phase 10 retired the store.
import type { ServiceAssetAvailability } from '@/types/service';
// Type-only — the THING adapter input shape (the runtime module is loaded
// lazily inside fetchStrategy so the generation tree never enters the store's
// static import graph).
import type { ThingGenerationInput } from '@/modules/wizard/generation/thing';
import type { TrustGenerationInput } from '@/modules/wizard/generation/trust';
import type { ProductStrategyOutput, SitemapPage } from '@/types/product';

// ---------------------------------------------------------------------------
// Field state model
// ---------------------------------------------------------------------------

/** A wizard field value — shape depends on the contract field's `input`. */
export type WizardFieldValue = string | string[] | boolean | null;

/** Provenance of a field value (useOnboardingStore idiom). */
export type FieldSource = 'scraped' | 'inferred' | 'user';

export interface WizardFieldEntry {
  value: WizardFieldValue;
  source: FieldSource;
  confirmed: boolean;
  /** The phase-1 waterfall verdict (scraped|inferred|ask|drop) — drives rendering. */
  state: FieldState;
}

// ---------------------------------------------------------------------------
// Proof state — SUPERSET of ServiceAssetAvailability (T2 existence booleans).
// ---------------------------------------------------------------------------

export interface WizardProofState {
  hasTestimonials: boolean;
  hasClientLogos: boolean;
  hasOutcomes: boolean;
  hasCaseStudies: boolean;
  hasTeamPhotos: boolean;
  hasFounderPhoto: boolean;
  /** Superset addition — trust `packages` T2 boolean. */
  hasPackages: boolean;
  testimonialType: 'text' | 'photos' | 'video' | 'transformation' | null;
}

// Compile-time guard: every ServiceAssetAvailability key MUST exist on
// WizardProofState (superset invariant — drift breaks the build, not runtime).
type _ProofIsSuperset = keyof ServiceAssetAvailability extends keyof WizardProofState
  ? true
  : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _proofSupersetCheck: _ProofIsSuperset = true;

const initialProof: WizardProofState = {
  hasTestimonials: false,
  hasClientLogos: false,
  hasOutcomes: false,
  hasCaseStudies: false,
  hasTeamPhotos: false,
  hasFounderPhoto: false,
  hasPackages: false,
  testimonialType: null,
};

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface WizardHydratePayload {
  tokenId?: string;
  brief: Brief;
  /** serveGate result (persisted on the Project at confirm). */
  audienceType?: AudienceType | null;
  templateId?: TemplateId | null;
}

interface WizardState {
  tokenId: string | null;
  hydrated: boolean;

  // Resolved from Brief + serveGate result.
  engine: CopyEngine | null;
  businessTypeKey: BusinessTypeKey | null;
  audienceType: AudienceType | null;
  templateId: TemplateId | null;

  // Entry-source-derived: review (URL/scrape prefill) vs fill (manual one-liner).
  mode: 'review' | 'fill';

  // Slot machine (keyed by slot IDs; `slots` = contract skeleton minus skips).
  slots: WizardSlot[];
  currentSlot: WizardSlot;

  // Per-field state map (keyed by contract field id).
  fields: Record<string, WizardFieldEntry>;

  // Goal (scale-05 machinery).
  goalIntent: GoalIntent | null;
  goalParam: GoalParamInput;

  // Proof (superset of ServiceAssetAvailability).
  proof: WizardProofState;

  // Structure (thing multipage sitemap; single-page for thing AND trust).
  sitemap: unknown[] | null;
  strategy: unknown | null;
  /**
   * Single-page 7b structure (scale-07 phase 4): the ordered BODY section list
   * (chrome excluded — header/footer are law-forced, never user-facing).
   * Seeded from the fetched strategy's sections when the template is
   * single-page; null for multipage (sitemap carries structure) and before the
   * strategy fetch.
   */
  structureSections: string[] | null;
  /**
   * Sections the user toggled OFF at the gate (capability/gated optionals
   * only — locked engine-core sections are refused by the toggle action).
   * Confirmed structure = structureSections minus structureDisabled.
   */
  structureDisabled: string[];
  /**
   * The PERSISTED Brief `structure.mode` (scale-07 phase 6) — retained from a
   * previously CONFIRMED structure at hydrate (a bare classify hint
   * `{mode, pages: []}` without sections/pageDetails is NOT retained, so the
   * pre-phase-6 mode signal to `isMultipage` is unchanged for fresh runs).
   * StructureSlot feeds it into `isMultipage` so slot UI and generation read
   * the same persisted mode (phase-5 open-risk alignment).
   */
  briefStructureMode: 'single' | 'multi' | null;
  /**
   * Required-capability set recomputed from the CONFIRMED structure (scale-07
   * phase 6) via `requiredCapabilitiesFromStructure` — dropping a section at
   * the 7b gate removes its owning capability, widening the swap shortlist
   * (phase 7 consumer). Null until a structure exists to derive from.
   */
  requiredCapabilities: CapabilityId[] | null;
  /**
   * Strategy-fetch lifecycle (scale-07 phase 3). Fired by the STRUCTURE slot on
   * mount; the guard on this status is the credit-charge-once/idempotency
   * mechanism (back-navigation must never trigger a second charged fetch).
   */
  strategyStatus: 'idle' | 'fetching' | 'done' | 'error';
  strategyError: string | null;
  /** The strategy fetch failed with an out-of-credits response (402). */
  strategyCreditsError: boolean;
  heroVariant: string | null;
  heroVariantPicked: boolean;
  styleVariantId: string | null;
  styleVariantPicked: boolean;
  stylePaletteId: string | null;
  stylePalettePicked: boolean;
  styleMood: string | null;
  styleMoodPicked: boolean;

  // trust-only — template variant + palette.
  variantId: string | null;
  paletteId: string | null;

  // Verbatim testimonials imported at entry (scrape) — passed to the service
  // copy route's realTestimonials (injectRealTestimonials). Hydrate-only: the
  // Brief entry facts carry only quote strings, mapped to the {quote,
  // author_name, author_role} shape the route expects (authors blank).
  importedTestimonials: Array<{ quote: string; author_name: string; author_role: string }>;

  // generating slot.
  generationProgress: number;
  generationError: string | null;
}

interface WizardActions {
  hydrate: (payload: WizardHydratePayload) => void;

  // Slot machine — operates on slot IDs.
  goToSlot: (slot: WizardSlot) => void;
  nextSlot: () => void;
  prevSlot: () => void;

  // Field state.
  setFieldValue: (id: string, value: WizardFieldValue) => void;
  confirmField: (id: string) => void;

  // Goal.
  setGoalIntent: (intent: GoalIntent) => void;
  setGoalParam: (param: GoalParamInput) => void;

  // Proof.
  setProof: (patch: Partial<WizardProofState>) => void;

  // thing style/structure.
  setSitemap: (sitemap: unknown[] | null) => void;
  setStrategy: (strategy: unknown) => void;
  /**
   * Run the strategy step (scale-07 phase 3) — called by the STRUCTURE slot.
   * Delegates to `runStrategy` (thing adapter: same payload/credit charge/clamp
   * path as generation) and writes the result via setStrategy/setSitemap.
   * Idempotent: no-ops while `fetching` or after `done` (no double charge);
   * re-callable after `error` (retry).
   */
  fetchStrategy: () => Promise<void>;
  /**
   * Single-page 7b structure actions (scale-07 phase 4). Toggle-OFF only (no
   * adds — the list membership is fixed by the strategy proposal); locked
   * engine-core sections are refused at the STATE level, not just the UI; hero
   * is pinned first (moves involving hero are refused). Generation consumes
   * the confirmed (reduced) structure via the projections: `buildThingInput`
   * clamps the strategy directly; `buildTrustInput` forwards
   * `confirmedSections` (scale-07 phase 5 — the trust pre-gate bridge is gone).
   */
  setStructureSections: (sections: string[] | null) => void;
  toggleStructureSection: (section: string) => void;
  moveStructureSection: (index: number, dir: -1 | 1) => void;
  /**
   * scale-07 phase 6 — recompute `requiredCapabilities` from the CURRENT
   * confirmed structure (single-page body or multipage sitemap). Called by
   * StructureSlot whenever the structure changes; the persisted write itself
   * rides `buildBriefPatch` → `save()` (the shell's Continue = the confirm
   * tap), so confirm carries the saveDraft brief patch.
   */
  recomputeRequiredCapabilities: () => void;
  setHeroVariant: (v: string) => void;
  setStyleVariantId: (v: string) => void;
  setStylePaletteId: (v: string) => void;
  setStyleMood: (v: string) => void;

  // trust style.
  setVariantId: (v: string) => void;
  setPaletteId: (v: string) => void;

  // generating.
  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;

  // Persistence (reuses /api/saveDraft — no new API).
  buildBriefPatch: () => Partial<Brief>;
  save: () => Promise<void>;

  reset: () => void;
}

export type WizardStore = WizardState & WizardActions;

// ---------------------------------------------------------------------------
// Pure helpers (no store/UI deps) — mode derivation + field value prefill.
// ---------------------------------------------------------------------------

/** URL-like rawInput ⇒ came from scrape ⇒ review-mode (EntryInputStep idiom). */
function rawInputIsUrl(rawInput: string | undefined): boolean {
  const trimmed = (rawInput ?? '').trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    return u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Derive review|fill from the brief's entry source (plan D). */
export function deriveMode(brief: Brief | null | undefined): 'review' | 'fill' {
  const entry = getEntryFacts(brief);
  return rawInputIsUrl(entry?.rawInput) ? 'review' : 'fill';
}

function emptyValueFor(field: ContractField): WizardFieldValue {
  switch (field.input) {
    case 'chips':
    case 'upload':
      return [];
    case 'boolean':
      return false;
    default:
      return '';
  }
}

/** Read the prefilled value for a SCRAPED field from entry facts / brief.goal. */
function prefillValueFor(
  brief: Brief | null | undefined,
  entry: EntryFacts | null,
  field: ContractField,
): WizardFieldValue {
  if (field.resolver === 'goal') {
    return brief?.goal?.intent ?? null;
  }
  if (!entry || !field.prefillKey) return emptyValueFor(field);
  const raw = entry[field.prefillKey] as unknown;
  if (field.input === 'boolean') {
    // T2 existence: array/string non-empty ⇒ present.
    if (Array.isArray(raw)) return raw.length > 0;
    if (typeof raw === 'string') return raw.trim().length > 0;
    return raw != null;
  }
  if (field.input === 'chips' || field.input === 'upload') {
    return Array.isArray(raw) ? (raw as string[]) : emptyValueFor(field);
  }
  return typeof raw === 'string' ? raw : emptyValueFor(field);
}

function sourceForState(state: FieldState): FieldSource {
  if (state === 'scraped') return 'scraped';
  if (state === 'inferred') return 'inferred';
  return 'user'; // ask/drop have no prefilled value yet
}

function businessTypeEntryFor(brief: Brief): BusinessTypeEntry | null {
  const key = brief.businessType as BusinessTypeKey | undefined;
  return key && key in businessTypes ? businessTypes[key] : null;
}

/** Slot skeleton minus this engine's skips, preserving canonical slot order. */
function slotsForEngine(engine: CopyEngine): WizardSlot[] {
  const { slotSkips } = getContract(engine);
  return wizardSlots.filter((s) => !slotSkips.includes(s));
}

// ---------------------------------------------------------------------------
// Store → THING adapter projection (scale-07 phase 3).
// ONE projection shared by the store's fetchStrategy action AND GeneratingSlot
// (which imports it) so the pre-gate strategy call and the generation run can
// never drift apart on payload fields.
// ---------------------------------------------------------------------------

/** Read a store field value as a string (empty fallback). */
export function fieldStr(fields: Record<string, { value: unknown }>, id: string): string {
  const v = fields[id]?.value;
  return typeof v === 'string' ? v : '';
}

/** Read a store field value as a string[] (empty fallback). */
export function fieldArr(fields: Record<string, { value: unknown }>, id: string): string[] {
  const v = fields[id]?.value;
  return Array.isArray(v) ? (v as string[]) : [];
}

/**
 * Confirmed single-page structure body (order preserved, toggled-off removed);
 * null when the single-page gate never populated (multipage / pre-fetch).
 */
export function confirmedStructureBody(s: WizardState): string[] | null {
  if (!s.structureSections) return null;
  return s.structureSections.filter((x) => !s.structureDisabled.includes(x));
}

/**
 * scale-07 phase 6 — the Brief `structure` patch persisted at confirm (the
 * FIRST real runtime writer of `Project.brief.structure`). Shape mirrors the
 * extended BriefSchema.structure:
 * - multipage: `{ mode:'multi', pages, pageDetails }` from the (user-edited)
 *   sitemap — `pages` kept for back-compat readers, `pageDetails` carries the
 *   per-page surviving section lists.
 * - single-page: `{ mode:'single', sections }` — the confirmed body (toggled-
 *   off removed, order preserved). NO `pages` key: the schema made `pages`
 *   optional precisely so this patch survives `BriefSchema.partial()`.
 * - null before any structure exists (pre-strategy) so autosaves from earlier
 *   slots never write (or clobber) structure.
 */
export function buildStructurePatch(s: WizardState): ConfirmedStructure | null {
  const sitemap = s.sitemap as SitemapPage[] | null;
  if (sitemap && sitemap.length > 0) {
    return {
      mode: 'multi',
      pages: sitemap.map((p) => p.archetypeKey),
      pageDetails: sitemap.map((p) => ({
        archetypeKey: p.archetypeKey,
        slug: p.pathSlug,
        sections: [...p.sections],
      })),
    };
  }
  const body = confirmedStructureBody(s);
  if (body) return { mode: 'single', sections: body };
  return null;
}

/** Project the wizard store state → the THING adapter input (plain data). */
export function buildThingInput(s: WizardState): ThingGenerationInput {
  const fields = s.fields as Record<string, { value: unknown }>;
  const sitemap = (s.sitemap as SitemapPage[] | null) ?? null;
  let strategy = (s.strategy as ProductStrategyOutput | null) ?? null;
  // Single-page 7b confirmed structure (scale-07 phase 4): reduce the strategy
  // through the clamp law BEFORE it reaches the adapter — a toggled-off
  // section leaves both `sections` and `uiblocks`, so it gets NO copy call.
  // Multipage (sitemap present) is untouched — the sitemap gate owns it.
  if (strategy && !sitemap) {
    const confirmed = confirmedStructureBody(s);
    if (confirmed) {
      strategy = applyConfirmedSections(strategy, confirmed, lockedSectionsForEngine('thing'));
    }
  }
  return {
    tokenId: s.tokenId ?? '',
    templateId: (s.templateId as ThingGenerationInput['templateId']) ?? 'meridian',
    productName: fieldStr(fields, 'name'),
    oneLiner: fieldStr(fields, 'oneLiner'),
    features: fieldArr(fields, 'capabilities'),
    audiences: fieldArr(fields, 'audience'),
    categories: [],
    differentiator: fieldStr(fields, 'differentiator') || undefined,
    objectionFacts: fieldStr(fields, 'objectionFacts') || undefined,
    offer: fieldStr(fields, 'offer'),
    goalIntent: s.goalIntent,
    goalParam: s.goalParam,
    proof: { hasTestimonials: s.proof.hasTestimonials },
    strategy,
    sitemap,
    paletteId: s.stylePaletteId ?? undefined,
    variantId: s.styleVariantId ?? undefined,
    mood: s.styleMood ?? undefined,
    heroVariant: s.heroVariant ?? undefined,
    heroVariantPicked: s.heroVariantPicked,
    styleVariantPicked: s.styleVariantPicked,
    stylePalettePicked: s.stylePalettePicked,
    styleMoodPicked: s.styleMoodPicked,
  };
}

/**
 * Project the wizard store state → the TRUST adapter input (plain data) —
 * scale-07 phases 4/5. THE single trust projection: used by the store's
 * `fetchStrategy` for the pre-gate trust strategy call AND by GeneratingSlot
 * for the generation run (consolidated in phase 5; the slot's local duplicate
 * is deleted). Forwards the gate-fetched `strategy` (charge-once: with it
 * present, `runTrustGeneration` never refetches) and the 7b-confirmed section
 * body (`confirmedSections` — a toggled-off section gets NO copy); the
 * phase-4 module-scoped pre-gate bridge in trust.ts is deleted.
 */
export function buildTrustInput(s: WizardState): TrustGenerationInput {
  const fields = s.fields as Record<string, { value: unknown }>;
  return {
    strategy: (s.strategy as TrustGenerationInput['strategy']) ?? null,
    confirmedSections: confirmedStructureBody(s),
    tokenId: s.tokenId ?? '',
    templateId: (s.templateId as TrustGenerationInput['templateId']) ?? 'hearth',
    businessTypeKey: s.businessTypeKey ?? undefined,
    businessName: fieldStr(fields, 'name'),
    oneLiner: fieldStr(fields, 'oneLiner'),
    targetClients: fieldArr(fields, 'whoProblem'),
    services: fieldArr(fields, 'services'),
    process: fieldStr(fields, 'process') || undefined,
    credentials: fieldStr(fields, 'credentials') || undefined,
    offer: fieldStr(fields, 'offer'),
    outcomes: fieldArr(fields, 'outcomes'),
    goalIntent: s.goalIntent,
    goalParam: s.goalParam,
    proof: {
      hasTestimonials: s.proof.hasTestimonials,
      hasClientLogos: s.proof.hasClientLogos,
      hasOutcomes: s.proof.hasOutcomes,
      hasCaseStudies: s.proof.hasCaseStudies,
      hasTeamPhotos: s.proof.hasTeamPhotos,
      hasFounderPhoto: s.proof.hasFounderPhoto,
      testimonialType: s.proof.testimonialType,
    },
    importedTestimonials: s.importedTestimonials,
    paletteId: s.paletteId ?? undefined,
    variantId: s.variantId ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Single-page structure helpers (scale-07 phase 4)
// ---------------------------------------------------------------------------

/**
 * Seed the single-page gate list from a fetched strategy (immer draft
 * mutator). Multipage results seed `sitemap` instead (existing behavior);
 * single-page results (no sitemap on the strategy) seed `structureSections`
 * with the strategy's BODY sections. Never clobbers prior user edits.
 */
function seedStructureFromStrategy(state: WizardState): void {
  const strat = state.strategy as { sections?: string[]; sitemap?: unknown[] } | null;
  if (!strat) return;
  if (!state.sitemap && Array.isArray(strat.sitemap) && strat.sitemap.length) {
    state.sitemap = strat.sitemap;
  }
  if (!strat.sitemap && !state.structureSections && Array.isArray(strat.sections)) {
    state.structureSections = strat.sections.filter((x) => x !== 'header' && x !== 'footer');
    state.structureDisabled = [];
  }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: WizardState = {
  tokenId: null,
  hydrated: false,
  engine: null,
  businessTypeKey: null,
  audienceType: null,
  templateId: null,
  mode: 'fill',
  slots: [],
  currentSlot: 'identity',
  fields: {},
  goalIntent: null,
  goalParam: {},
  proof: { ...initialProof },
  sitemap: null,
  strategy: null,
  structureSections: null,
  structureDisabled: [],
  briefStructureMode: null,
  requiredCapabilities: null,
  strategyStatus: 'idle',
  strategyError: null,
  strategyCreditsError: false,
  heroVariant: null,
  heroVariantPicked: false,
  styleVariantId: null,
  styleVariantPicked: false,
  stylePaletteId: null,
  stylePalettePicked: false,
  styleMood: null,
  styleMoodPicked: false,
  variantId: null,
  paletteId: null,
  importedTestimonials: [],
  generationProgress: 0,
  generationError: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useWizardStore = create<WizardStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      hydrate: (payload) =>
        set((state) => {
          const { brief, audienceType, templateId, tokenId } = payload;
          const engine = brief.copyEngine ?? null;

          state.tokenId = tokenId ?? state.tokenId;
          state.audienceType = audienceType ?? null;
          state.templateId = templateId ?? null;
          state.businessTypeKey =
            brief.businessType && brief.businessType in businessTypes
              ? (brief.businessType as BusinessTypeKey)
              : null;

          // No schema engine ⇒ can't build a contract; leave the store empty
          // (mirrors the old bridge hydrate no-op guard). Never throw.
          if (!engine) {
            state.hydrated = true;
            return;
          }

          state.engine = engine;
          state.mode = deriveMode(brief);

          const contract = getContract(engine);
          state.slots = slotsForEngine(engine);
          state.currentSlot = state.slots[0] ?? 'identity';

          // Per-field state via the phase-1 waterfall (logic NOT duplicated here).
          const btEntry = businessTypeEntryFor(brief);
          const states = computeFieldStates(brief, contract, btEntry);
          const entry = getEntryFacts(brief);
          const fields: Record<string, WizardFieldEntry> = {};
          for (const field of contract.fields) {
            const fs = states.get(field.id) ?? 'ask';
            const hasValue = fs === 'scraped' || fs === 'inferred';
            fields[field.id] = {
              value: hasValue ? prefillValueFor(brief, entry, field) : emptyValueFor(field),
              source: sourceForState(fs),
              confirmed: false,
              state: fs,
            };
          }
          state.fields = fields;

          // Goal (scale-05).
          state.goalIntent = brief.goal?.intent ?? null;
          state.goalParam = brief.goal?.param ?? {};

          // Proof — seed the one boolean we can safely infer from entry facts.
          state.proof = { ...initialProof };
          if (entry?.testimonials && entry.testimonials.length > 0) {
            state.proof.hasTestimonials = true;
          }

          // Imported testimonials (scrape) — entry facts carry quote strings;
          // map to the {quote, author_name, author_role} shape the service copy
          // route requires (authors blank; injectRealTestimonials tolerates it).
          state.importedTestimonials = (entry?.testimonials ?? []).map((quote) => ({
            quote,
            author_name: '',
            author_role: '',
          }));

          // scale-07 phase 6 — READ a persisted CONFIRMED structure on load.
          // Only a structure carrying sections/pageDetails counts as confirmed
          // (a real 7b write); classify's bare `{mode, pages: []}` hint is
          // ignored so fresh-run behavior is unchanged. Seeding here means a
          // reload after confirm resumes the user's structure edits (the
          // strategy-seed guards never clobber these), and the required set
          // reflects the confirmed structure immediately.
          const persisted = brief.structure;
          const isConfirmedStructure =
            !!persisted &&
            ((persisted.sections?.length ?? 0) > 0 ||
              (persisted.pageDetails?.length ?? 0) > 0);
          if (persisted && isConfirmedStructure) {
            state.briefStructureMode = persisted.mode;
            if (persisted.mode === 'multi' && persisted.pageDetails?.length) {
              state.sitemap = persisted.pageDetails.map((d) => ({
                archetypeKey: d.archetypeKey,
                // Title isn't persisted (schema carries key/slug/sections
                // only) — prettify the key; the slot's title input remains
                // editable.
                title: d.archetypeKey.charAt(0).toUpperCase() + d.archetypeKey.slice(1),
                pathSlug: d.slug,
                sections: [...d.sections],
              }));
            } else if (persisted.mode === 'single' && persisted.sections?.length) {
              state.structureSections = persisted.sections.filter(
                (x) => x !== 'header' && x !== 'footer'
              );
              state.structureDisabled = [];
            }
            state.requiredCapabilities = requiredCapabilitiesFromStructure(
              persisted,
              engine ?? undefined
            );
          }

          state.hydrated = true;
        }),

      goToSlot: (slot) =>
        set((state) => {
          if (state.slots.includes(slot)) state.currentSlot = slot;
        }),

      nextSlot: () =>
        set((state) => {
          const i = state.slots.indexOf(state.currentSlot);
          if (i === -1) return;
          const next = Math.min(i + 1, state.slots.length - 1);
          state.currentSlot = state.slots[next];
        }),

      prevSlot: () =>
        set((state) => {
          const i = state.slots.indexOf(state.currentSlot);
          if (i === -1) return;
          const prev = Math.max(i - 1, 0);
          state.currentSlot = state.slots[prev];
        }),

      setFieldValue: (id, value) =>
        set((state) => {
          const prev = state.fields[id];
          state.fields[id] = {
            value,
            source: 'user',
            confirmed: prev?.confirmed ?? false,
            state: prev?.state ?? 'ask',
          };
        }),

      confirmField: (id) =>
        set((state) => {
          if (state.fields[id]) state.fields[id].confirmed = true;
        }),

      setGoalIntent: (intent) =>
        set((state) => {
          state.goalIntent = intent;
        }),
      setGoalParam: (param) =>
        set((state) => {
          state.goalParam = param;
        }),

      setProof: (patch) =>
        set((state) => {
          state.proof = { ...state.proof, ...patch };
        }),

      setSitemap: (sitemap) =>
        set((state) => {
          state.sitemap = sitemap;
        }),
      setStrategy: (strategy) =>
        set((state) => {
          state.strategy = strategy;
        }),

      // ── Single-page 7b structure (scale-07 phase 4) ──
      setStructureSections: (sections) =>
        set((state) => {
          state.structureSections = sections ? [...sections] : null;
        }),
      toggleStructureSection: (section) =>
        set((state) => {
          if (!state.structureSections?.includes(section)) return;
          // Required-locked enforcement lives HERE (state level), not just in
          // the UI: engine-core required sections can never be toggled off.
          if (state.engine && lockedSectionsForEngine(state.engine).includes(section)) return;
          const i = state.structureDisabled.indexOf(section);
          if (i >= 0) state.structureDisabled.splice(i, 1);
          else state.structureDisabled.push(section);
        }),
      moveStructureSection: (index, dir) =>
        set((state) => {
          const list = state.structureSections;
          if (!list) return;
          const to = index + dir;
          if (index < 0 || index >= list.length || to < 0 || to >= list.length) return;
          // Hero pinned first — any move involving hero is refused.
          if (list[index] === 'hero' || list[to] === 'hero') return;
          const tmp = list[index];
          list[index] = list[to];
          list[to] = tmp;
        }),
      recomputeRequiredCapabilities: () =>
        set((state) => {
          const patch = buildStructurePatch(state);
          state.requiredCapabilities = patch
            ? requiredCapabilitiesFromStructure(patch, state.engine ?? undefined)
            : null;
        }),

      fetchStrategy: async () => {
        const s = get();
        // Idempotency guard — the credit charge lives server-side in the
        // strategy routes (/api/audience/product/strategy for thing,
        // /api/audience/service/strategy for trust), so "never fetch twice" IS
        // "never charge twice". Back-navigation re-mounts the structure slot
        // with status 'done' ⇒ no-op. Concurrent calls: the status flips to
        // 'fetching' SYNCHRONOUSLY below, before any await, so a second call
        // in the same tick bails here too. Only 'idle' and 'error' (retry)
        // proceed.
        if (s.strategyStatus === 'fetching' || s.strategyStatus === 'done') return;
        // scale-07 phase 6 (charge-dedup scope note): a reload after a
        // persisted structure confirm re-runs this charged fetch — DELIBERATE.
        // Skipping it would leave `strategy` null, which (a) degrades a
        // multipage resume to the single-page tail path (fan-out needs
        // strategy + sitemap) and (b) bypasses the confirmed-sections clamp
        // (applyConfirmedSections needs a strategy object) — both worse than
        // the charge. Total charges across abandon+reload are unchanged vs
        // pre-phase-6 (the tail fallback would charge instead); what phase 6
        // adds is that the PERSISTED structure survives the reload (hydrate
        // seeds it; the seed guards below never clobber it). True cross-
        // session dedup requires persisting the strategy blob itself —
        // deferred (out of this phase's file scope).
        if (s.strategy) {
          // Strategy already present (e.g. seeded externally) — mark done, no
          // fetch; seed the single-page gate list if it's still empty.
          set((state) => {
            state.strategyStatus = 'done';
            seedStructureFromStrategy(state);
          });
          return;
        }
        // Only structure-gated engines fetch here (work keeps its slot skip).
        if (s.engine !== 'thing' && s.engine !== 'trust') return;
        set((state) => {
          state.strategyStatus = 'fetching';
          state.strategyError = null;
          state.strategyCreditsError = false;
        });

        // Lazy-load the engine's adapter so the generation tree stays out of
        // the store's static import graph (firewall note at the top of this
        // file). Both runners share the {done|credits|error} result shape.
        let result:
          | { status: 'done'; strategy: { sections?: string[]; sitemap?: unknown[] } }
          | { status: 'credits' }
          | { status: 'error'; error: string };
        if (s.engine === 'trust') {
          const { runTrustStrategy } = await import('@/modules/wizard/generation/trust');
          result = await runTrustStrategy(buildTrustInput(get()));
        } else {
          const { runStrategy } = await import('@/modules/wizard/generation/thing');
          result = await runStrategy(buildThingInput(get()));
        }

        if (result.status === 'done') {
          const strategy = result.strategy;
          set((state) => {
            state.strategy = strategy;
            // Multipage: seed the sitemap from the (server-clamped) proposal;
            // single-page: seed the gate's section list. Either way, never
            // clobber prior user edits (seedStructureFromStrategy guards).
            seedStructureFromStrategy(state);
            state.strategyStatus = 'done';
          });
        } else if (result.status === 'credits') {
          set((state) => {
            state.strategyStatus = 'error';
            state.strategyCreditsError = true;
            state.strategyError = 'Out of credits.';
          });
        } else {
          set((state) => {
            state.strategyStatus = 'error';
            state.strategyError = result.error || 'Strategy generation failed.';
          });
        }
      },
      setHeroVariant: (v) =>
        set((state) => {
          state.heroVariant = v;
          state.heroVariantPicked = true;
        }),
      setStyleVariantId: (v) =>
        set((state) => {
          state.styleVariantId = v;
          state.styleVariantPicked = true;
        }),
      setStylePaletteId: (v) =>
        set((state) => {
          state.stylePaletteId = v;
          state.stylePalettePicked = true;
        }),
      setStyleMood: (v) =>
        set((state) => {
          state.styleMood = v;
          state.styleMoodPicked = true;
        }),

      setVariantId: (v) =>
        set((state) => {
          state.variantId = v;
        }),
      setPaletteId: (v) =>
        set((state) => {
          state.paletteId = v;
        }),

      setGenerationProgress: (progress) =>
        set((state) => {
          state.generationProgress = progress;
        }),
      setGenerationError: (error) =>
        set((state) => {
          state.generationError = error;
        }),

      // Compose the Brief patch persisted on save — goal is the well-defined
      // writeback (scale-05); field→Brief mapping lands with the phase-5
      // adapters. Mirrors the old GoalStep/GeneratingStep brief passthrough.
      //
      // scale-07 phase 6: the CONFIRMED structure rides this patch too — the
      // shell's Continue on the structure slot calls save(), making that tap
      // the first real runtime writer of `Project.brief.structure` (via
      // saveDraft's key-wise shallow brief merge). Pre-structure saves return
      // no `structure` key, so earlier-slot autosaves can never clobber it.
      buildBriefPatch: () => {
        const state = get();
        const { goalIntent, goalParam } = state;
        const patch: Partial<Brief> = {};
        if (goalIntent) patch.goal = intentToBriefGoal(goalIntent, goalParam);
        const structure = buildStructurePatch(state);
        if (structure) patch.structure = structure;
        return patch;
      },

      // Persist onboarding progress + brief draft via the SAME /api/saveDraft
      // path the old stores use (no new persistence API). No-op without a token.
      save: async () => {
        const { tokenId, currentSlot, slots, buildBriefPatch } = get();
        if (!tokenId) return;
        const brief = buildBriefPatch();
        try {
          await fetch('/api/saveDraft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenId,
              stepIndex: Math.max(0, slots.indexOf(currentSlot)),
              ...(Object.keys(brief).length > 0 ? { brief } : {}),
            }),
          });
        } catch {
          /* best-effort — autosave never blocks the wizard */
        }
      },

      reset: () =>
        set((state) => {
          Object.assign(state, {
            ...initialState,
            proof: { ...initialProof },
            goalParam: {},
            fields: {},
            slots: [],
            structureDisabled: [],
          });
        }),
    })),
    { name: 'WizardStore' }
  )
);
