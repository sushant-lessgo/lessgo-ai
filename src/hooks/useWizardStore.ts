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
// scale-10 phase 4 — Brief-carried collections (parallel channel). Pure helpers
// (slug re-derivation lives here — "slugs never AI"); NO waterfall change:
// collections are edited as a whole-list channel, not per-item ASK questions.
import type { CollectionKey } from '@/modules/collections/registry';
import {
  getCollections,
  makeCollectionEntry,
  type CollectionsFacts,
} from '@/modules/brief/collections';
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
import {
  applyConfirmedSections,
  filterSectionsByProof,
} from '@/modules/audience/product/strategy/parseStrategyProduct';
// atelier phase 2 — pure audience-level DATA (templateMeta/businessTypes siblings,
// firewall-safe): the multipage-capability gate + page-archetype menu that the
// served work→multipage skeleton path seeds its sitemap from.
import {
  getPageArchetypesForTemplate,
  isMultipage,
} from '@/modules/audience/product/pageArchetypes';
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
import type { WorkGenerationInput } from '@/modules/wizard/generation/work';
import type { ProductStrategyOutput, SitemapPage } from '@/types/product';
import type { WorkPageGoalKey } from '@/modules/engines/workPages';

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
  /**
   * proof-truth phase 5 — approximate testimonial count the user picks in the
   * wizard (bucket chips → representative hint number, e.g. 1–2→2, 3–5→4, 6+→8).
   * OPTIONAL: `null` ⇒ no hint ⇒ current behavior. Feeds the existing
   * `cardCountHint` eligibility seam ONLY on the manual (non-URL) path — a
   * scraped `importedTestimonials.length` always wins (see thing.ts/trust.ts).
   */
  testimonialCount: number | null;
}

// Compile-time guard: every ServiceAssetAvailability key MUST exist on
// WizardProofState (superset invariant — drift breaks the build, not runtime).
type _ProofIsSuperset = keyof ServiceAssetAvailability extends keyof WizardProofState
  ? true
  : never;
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
  testimonialCount: null,
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
  /**
   * The user explicitly chose "Skip for now" past a REQUIRED goal param (F14) —
   * unblocks the goal-step Continue without a destination. Reset whenever the
   * selected intent changes (a new intent re-arms the gate).
   */
  goalParamSkipped: boolean;

  // Proof (superset of ServiceAssetAvailability).
  proof: WizardProofState;

  // Structure (thing multipage sitemap; single-page for thing AND trust).
  sitemap: unknown[] | null;
  strategy: unknown | null;
  /**
   * scale-10 phase 4 — the COMPLETE `brief.facts` snapshot taken at hydrate.
   * `buildBriefPatch` re-emits it (with edited collections overlaid) because
   * saveDraft REPLACES facts wholesale on the shallow `BriefSchema.partial()`
   * merge — a partial `facts` would drop sibling keys (e.g. `facts.entry`).
   */
  briefFacts: Record<string, unknown> | null;
  /**
   * scale-10 phase 4 — the editable collection channel (`facts.collections`),
   * seeded verbatim from the scraped brief (phase 2) and rename/remove/add-
   * edited at the 7b gate BEFORE copy generation. Keyed by CollectionKey; slugs
   * are always code-derived (never AI). Empty list kept = index empty-state.
   */
  collections: CollectionsFacts;
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

  /**
   * work-onboarding-shell P2b — the JOURNEY step machine (2–6).
   *
   * ADDITIVE and fully INDEPENDENT of the slot machine above: a project renders
   * EITHER the legacy `WizardShell` (slots) OR the journey shell (this), never
   * both, so the two never interact. `slots`/`currentSlot`/`nextSlot`/`prevSlot`
   * are untouched by the journey.
   *
   * STEP 01 is absent by design — it is pre-confirm and owned by the entry page,
   * so the journey shell only ever mounts at 2+.
   */
  journeyStep: WizardJourneyStep;
}

/**
 * The journey steps the shell can be on (02 show-work → 06 reveal).
 *
 * Structurally identical to `JourneyStep` in
 * `src/components/onboarding/journey/engines/types.ts`, and deliberately NOT
 * imported from it: that module imports `WizardStore` from THIS file, so
 * importing back would be a cycle. Both are the same closed literal union, so
 * values pass between them without a cast.
 */
export type WizardJourneyStep = 2 | 3 | 4 | 5 | 6;

/**
 * work-onboarding-shell P3 — the OK half of a journey seam's `RailCommit`
 * (`src/components/onboarding/journey/engines/types.ts`).
 *
 * Declared HERE rather than imported for the same reason as `WizardJourneyStep`:
 * that module imports `WizardStore` from this file, so importing back would be a
 * cycle. Structurally identical, so a `RailCommit & {ok:true}` passes without a
 * cast — and the store stays engine-agnostic (it never learns what `work` is).
 */
export interface WizardRailCommit {
  /** The `/api/saveDraft` brief patch — a FULL-facts re-emit (landmine 4). */
  patch: Partial<Brief>;
  /** The SAME merged bag, so persist + `briefFacts` land in one `set`. */
  facts: Record<string, unknown>;
  /** Store-level mirrors the SEAM declares (e.g. work NAME → `fields['name']`). */
  fieldMirrors?: { fieldId: string; value: string }[];
}

/** `ok:false` ⇒ the optimistic state was REVERTED; the caller toasts. */
export type WizardRailCommitResult = { ok: true } | { ok: false; error: string };

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
  setGoalParamSkipped: (skipped: boolean) => void;

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
  /**
   * scale-10 phase 4 — collection-channel edits at the 7b gate. Whole-list
   * rename/remove/add (name-only for add); slugs are re-derived from the name
   * via `makeCollectionEntry` (`slugify`), never taken from user/AI. Targeted
   * by index (unambiguous when two names slugify alike). These are a SEPARATE
   * row type from section rows — they do NOT touch `toggleStructureSection`.
   * Edits ride `buildBriefPatch` → `save()`, so they persist to
   * `Brief.facts.collections` BEFORE copy generation reads the brief.
   */
  addCollectionEntry: (key: CollectionKey, name: string) => void;
  renameCollectionEntry: (key: CollectionKey, index: number, name: string) => void;
  removeCollectionEntry: (key: CollectionKey, index: number) => void;
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

  /**
   * work-onboarding-shell P2b — journey step machine. Additive; the journey
   * shell owns forward/back motion. No slot-machine interaction.
   */
  setJourneyStep: (step: WizardJourneyStep) => void;

  /**
   * work-onboarding-shell P3 — apply ONE rail write, atomically, and persist it.
   * ENGINE-AGNOSTIC: the seam builds the commit, this only applies + saves it.
   *
   * `briefFacts` is what GENERATION reads (`resolveWorkBrief` → `buildWorkInput`),
   * so an unpersisted rail belief would make STEP 05 generate from data that
   * vanishes on reload. Therefore, unlike `save()`, this is NOT fire-and-forget:
   * it checks `res.ok` and REVERTS both `briefFacts` and the mirrored `fields` on
   * any non-2xx/throw, returning `{ok:false}` for the caller to toast. The rail
   * must never show a belief we failed to persist.
   */
  commitRail: (commit: WizardRailCommit) => Promise<WizardRailCommitResult>;

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
    if (!Array.isArray(raw)) return emptyValueFor(field);
    return applyPrefillArrayFilter(field, raw as string[]);
  }
  return typeof raw === 'string' ? raw : emptyValueFor(field);
}

/**
 * The ONLY place the numeric-or-empty rule for proof lives. The thing engine's
 * `realNumbers` field wants claims with an ACTUAL number; the shared `outcomes`
 * entry field that feeds it (also consumed by trust/work, qualitatively) must
 * stay untouched — so we filter client-side, scoped by `field.id` (unique per
 * engine), never by `prefillKey` (shared as `outcomes`). Known tradeoff: the
 * "contains a digit" test drops non-numeric proof like "cut onboarding from
 * days to minutes" and keeps numeric-adjacent non-metrics like "ISO 9001
 * certified" — matches the spec's "actual numbers" intent, not a bug.
 */
function applyPrefillArrayFilter(field: ContractField, values: string[]): string[] {
  if (field.id === 'realNumbers') {
    return values.filter((v) => /\d/.test(v));
  }
  return values;
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

/**
 * The multipage brief-signal (businessType + persisted structure.mode) the
 * capability gate reads. Mirrors StructureSlot's `briefSignal` so slot inclusion,
 * fetchStrategy seeding, and generation dispatch all key off the SAME signal.
 */
export function briefSignalFromState(
  s: Pick<WizardState, 'businessTypeKey' | 'briefStructureMode'>,
): Pick<Brief, 'structure' | 'businessType'> | undefined {
  if (!s.businessTypeKey && !s.briefStructureMode) return undefined;
  return {
    ...(s.businessTypeKey ? { businessType: s.businessTypeKey } : {}),
    ...(s.briefStructureMode ? { structure: { mode: s.briefStructureMode } } : {}),
  } as Pick<Brief, 'structure' | 'businessType'>;
}

/**
 * Whether a thing-engine template exposes REAL style controls (hero-variant +
 * palette/mood pickers). Only `vestria` does today — its pickers are
 * VESTRIA-TYPED by construction (see StyleSlot's `showVestriaPickers`, which
 * consumes this SAME predicate so the vestria literal lives in ONE place). Any
 * future thing template with real pickers opts in by flipping this one
 * predicate; templates without controls have the `style` slot skipped at
 * runtime (below) so the user never hits a dead step.
 *
 * NB param is `tid`, not `templateId`: this is a render-layer UI-capability
 * predicate (same category as VestriaThemePopover's `tid`-form vestria gate),
 * and the scale-08 pipelineGuards test bans the `templateId`-operand vestria
 * literal outside its render-layer allowlist. The `tid` form is the codebase's
 * documented escape for legitimate render-layer vestria gates.
 */
export function thingTemplateHasStyleControls(
  tid: TemplateId | null | undefined,
): boolean {
  return tid === 'vestria';
}

/**
 * Slot skeleton minus this engine's skips, preserving canonical slot order.
 * atelier phase 2: work keeps its structure skip UNLESS the PICKED template is
 * multipage — a served work→multipage brief (e.g. atelier) goes THROUGH the
 * structure slot's page-archetype menu. Granth declares no `multipage`
 * capability, so `isMultipage` is false for it and its skip is retained.
 *
 * onboarding-fixes phase 2: thing templates WITHOUT real style controls skip
 * the `style` slot (dead one-line stub otherwise). vestria keeps it; `style`
 * stays in `wizardSlots` globally because trust + vestria still need it.
 */
function slotsForEngine(
  engine: CopyEngine,
  templateId: TemplateId | null | undefined,
  briefSignal?: Pick<Brief, 'structure' | 'businessType'> | null,
): WizardSlot[] {
  const skips = new Set<WizardSlot>(getContract(engine).slotSkips);
  if (engine === 'work' && isMultipage(templateId ?? undefined, briefSignal)) {
    skips.delete('structure');
  }
  if (engine === 'thing' && !thingTemplateHasStyleControls(templateId)) {
    skips.add('style');
  }
  return wizardSlots.filter((s) => !skips.has(s));
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
      pageDetails: sitemap.map((p) => {
        // `goal` rides on the work sitemap (WorkSitemapPage) which the store
        // types loosely as the product SitemapPage; read it via a narrow widen.
        const goal = (p as { goal?: WorkPageGoalKey }).goal;
        return {
          archetypeKey: p.archetypeKey,
          slug: p.pathSlug,
          sections: [...p.sections],
          title: p.title,
          ...(goal ? { goal } : {}),
        };
      }),
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
    businessTypeKey: s.businessTypeKey ?? undefined,
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
    proof: {
      hasTestimonials: s.proof.hasTestimonials,
      // proof-truth phase 5 — carry the user-answered count when set (manual
      // path). Null ⇒ omitted ⇒ byte-identical to prior behavior.
      ...(s.proof.testimonialCount != null
        ? { testimonialCount: s.proof.testimonialCount }
        : {}),
    },
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
      // proof-truth phase 5 — user-answered count (manual path). Scraped
      // `importedTestimonials.length` still wins in trust.ts's hint precedence.
      testimonialCount: s.proof.testimonialCount,
    },
    importedTestimonials: s.importedTestimonials,
    paletteId: s.paletteId ?? undefined,
    variantId: s.variantId ?? undefined,
  };
}

/**
 * work-copy-engine phase 5 — reconstruct the resolved Brief the WORK LLM routes
 * read (`facts.work` + businessType + composed goal). The store keeps the
 * COMPLETE `brief.facts` snapshot (`briefFacts`, taken at hydrate) so `facts.work`
 * rides it verbatim; businessType + goal are derived. Every BriefSchema field is
 * optional, so this minimal projection validates at the routes.
 */
function resolveWorkBrief(s: WizardState): Brief {
  const goal = s.goalIntent ? intentToBriefGoal(s.goalIntent, s.goalParam) : undefined;
  return {
    facts: (s.briefFacts ?? {}) as Brief['facts'],
    ...(s.businessTypeKey ? { businessType: s.businessTypeKey } : {}),
    copyEngine: 'work',
    ...(goal ? { goal } : {}),
  };
}

/**
 * Project the wizard store state → the WORK adapter input (plain data). Mirrors
 * buildThingInput / buildTrustInput. Adds (phase 5) the LLM fan-out fields:
 * the resolved Brief (facts.work), the SiteContext `sourceUrl` (derived from the
 * scrape entry when URL-like — tone-only), and the confirmed sitemap `pages`.
 * The granth generator + skeleton paths IGNORE brief/sourceUrl (they never call
 * the copy routes), so this is additive for those flows.
 */
export function buildWorkInput(s: WizardState): WorkGenerationInput {
  const fields = s.fields as Record<string, { value: unknown }>;
  const brief = resolveWorkBrief(s);
  const entry = getEntryFacts(brief);
  const sourceUrl = rawInputIsUrl(entry?.rawInput) ? entry!.rawInput : undefined;
  return {
    tokenId: s.tokenId ?? '',
    templateId: s.templateId ?? 'granth',
    writerName: fieldStr(fields, 'name'),
    oneLiner: fieldStr(fields, 'oneLiner'),
    // The 3–5 work uploads captured in ProofSlot (contract `theWork`).
    works: fieldArr(fields, 'theWork'),
    // The confirmed sitemap pages (multipage skeleton / LLM fan-out; ignored by
    // the single-page granth generator).
    pages: (s.sitemap as SitemapPage[] | null) ?? [],
    brief,
    ...(sourceUrl ? { sourceUrl } : {}),
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
  goalParamSkipped: false,
  proof: { ...initialProof },
  sitemap: null,
  strategy: null,
  briefFacts: null,
  collections: {},
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
  // Journey (P2b). 2 = the first resumable step; the entry page owns STEP 01.
  journeyStep: 2,
};

/**
 * work-onboarding-shell P4 — the `commitRail` SERIALIZATION chain.
 *
 * WHY (P3 review NB2): `commitRail` is optimistic + REVERTS WHOLESALE to a
 * pre-edit snapshot on a failed save. With ONE caller that was safe — the rail's
 * own `saving` flag disabled every submit control while a commit was in flight.
 * P4 adds a SECOND caller (STEP 03's questions) OUTSIDE the rail, where that
 * flag does not apply. Interleaved commits would then let a late failure's
 * revert wipe an EARLIER SUCCESS: B snapshots before A lands, A succeeds, B
 * fails, B restores the pre-A bag — and the DB (which has A) silently diverges
 * from `briefFacts`, which is what generation reads.
 *
 * Fix: commits run ONE AT A TIME, chained here. Each commit takes its snapshot
 * only when its turn starts, so a revert can only ever undo ITS OWN edit.
 *
 * Module-level (not store state) on purpose: a Promise is not serializable
 * state, nothing renders from it, and immer must never see it. It only ORDERS
 * work — `reset()` deliberately does not touch it (an in-flight save must still
 * settle in order).
 */
let railCommitChain: Promise<unknown> = Promise.resolve();

// ---------------------------------------------------------------------------
// Journey selectors (P2b) — selector-first reads for the journey shell.
// ---------------------------------------------------------------------------

export const selectJourneyStep = (s: WizardStore): WizardJourneyStep => s.journeyStep;
export const selectSetJourneyStep = (s: WizardStore) => s.setJourneyStep;
/** P3 — the rail's source of truth. Re-projected by the seam on every change. */
export const selectBriefFacts = (s: WizardStore): Record<string, unknown> | null =>
  s.briefFacts;
export const selectCommitRail = (s: WizardStore) => s.commitRail;
/** E3 — the profession wording key STEP 03's `questions(vm, ctx)` needs (D-B).
 *  Lives on the store (not the facts bag), so the seam reaches it via ctx. */
export const selectBusinessTypeKey = (s: WizardStore): BusinessTypeKey | null =>
  s.businessTypeKey;

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

          // scale-10 phase 4 — snapshot the COMPLETE facts (so buildBriefPatch
          // can re-emit siblings on the shallow saveDraft merge) + seed the
          // editable collection channel verbatim from the scrape (phase 2).
          state.briefFacts = (brief.facts as Record<string, unknown>) ?? null;
          state.collections = getCollections(brief);

          // No schema engine ⇒ can't build a contract; leave the store empty
          // (mirrors the old bridge hydrate no-op guard). Never throw.
          if (!engine) {
            state.hydrated = true;
            return;
          }

          state.engine = engine;
          state.mode = deriveMode(brief);

          const contract = getContract(engine);
          // atelier phase 5 — slot inclusion must key off the SAME confirmed-only
          // multipage signal that fetchStrategy/GeneratingSlot use
          // (briefSignalFromState), NOT the raw classify brief. classify stamps
          // EVERY brief with an UNCONFIRMED `structure:{ mode, pages: [] }` hint
          // (classify.ts) = the raw AI guess. Feeding that raw hint here let a
          // served photographer the AI read as single-page suppress the structure
          // slot (isMultipage(brief) → mode==='single' → skip retained), while the
          // dispatch derivation — which reads briefStructureMode, set ONLY from a
          // CONFIRMED structure — still went multipage → a zero-page skeleton.
          // Set briefStructureMode from a CONFIRMED structure FIRST (design intent,
          // comment below), then derive slots from the reconstructed signal so both
          // derivations agree. A CONFIRMED single still correctly stays single;
          // an unconfirmed hint never suppresses the slot for a multipage template.
          const confirmedStructure = brief.structure;
          const hasConfirmedStructure =
            !!confirmedStructure &&
            ((confirmedStructure.sections?.length ?? 0) > 0 ||
              (confirmedStructure.pageDetails?.length ?? 0) > 0);
          if (confirmedStructure && hasConfirmedStructure) {
            state.briefStructureMode = confirmedStructure.mode;
          }
          state.slots = slotsForEngine(engine, templateId ?? null, briefSignalFromState(state));
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
          // (briefStructureMode already set from the CONFIRMED structure above —
          // before slot derivation. This block seeds the sitemap/section state.)
          const persisted = brief.structure;
          const isConfirmedStructure =
            !!persisted &&
            ((persisted.sections?.length ?? 0) > 0 ||
              (persisted.pageDetails?.length ?? 0) > 0);
          if (persisted && isConfirmedStructure) {
            if (persisted.mode === 'multi' && persisted.pageDetails?.length) {
              state.sitemap = persisted.pageDetails.map((d) => ({
                archetypeKey: d.archetypeKey,
                // Title now persists (E4); fall back to prettifying the key for
                // older Briefs that carry key/slug/sections only.
                title:
                  d.title ??
                  d.archetypeKey.charAt(0).toUpperCase() + d.archetypeKey.slice(1),
                pathSlug: d.slug,
                sections: [...d.sections],
                // Goal round-trips symmetrically (WorkSitemapPage.goal); absent
                // on non-work / older Briefs.
                ...(d.goal ? { goal: d.goal } : {}),
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
          // A new intent re-arms the param gate (F14) — a prior "Skip for now"
          // must not carry over to a different goal.
          if (intent !== state.goalIntent) state.goalParamSkipped = false;
          state.goalIntent = intent;
        }),
      setGoalParam: (param) =>
        set((state) => {
          state.goalParam = param;
        }),
      setGoalParamSkipped: (skipped) =>
        set((state) => {
          state.goalParamSkipped = skipped;
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

      // ── Collection channel (scale-10 phase 4) ──
      // Required-capability recompute is intentionally NOT invoked here:
      // collections are a parallel channel and never feed
      // requiredCapabilitiesFromStructure (that derives from section topology).
      addCollectionEntry: (key, name) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed) return;
          if (!state.collections[key]) state.collections[key] = [];
          state.collections[key]!.push(makeCollectionEntry(trimmed));
        }),
      renameCollectionEntry: (key, index, name) =>
        set((state) => {
          const list = state.collections[key];
          const prev = list?.[index];
          if (!list || !prev) return;
          const trimmed = name.trim();
          if (!trimmed) return;
          // Re-derive the slug from the new name (never keep the old slug).
          list[index] = makeCollectionEntry(trimmed, {
            oneLiner: prev.oneLiner,
            imageUrl: prev.imageUrl,
          });
        }),
      removeCollectionEntry: (key, index) =>
        set((state) => {
          const list = state.collections[key];
          if (!list || index < 0 || index >= list.length) return;
          list.splice(index, 1);
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
        // atelier phase 2 — Work + a multipage picked template (e.g. atelier)
        // seeds the sitemap from the page-archetype menu defaults with ZERO
        // LLM fetch / ZERO credit charge (work copy-gen stays OUT — the served
        // skeleton path fills copy manually in the editor). Shaped like the
        // "strategy already present" early-exit above: mark done, no fetch.
        // Granth (work + single-page — no `multipage` capability) falls through
        // to the early return below unchanged.
        if (s.engine === 'work' && isMultipage(s.templateId ?? undefined, briefSignalFromState(s))) {
          set((state) => {
            if (!state.sitemap) {
              const menu = getPageArchetypesForTemplate(state.templateId) ?? [];
              state.sitemap = menu
                .filter((a) => a.defaultIncluded)
                .map((a) => ({
                  archetypeKey: a.key,
                  title: a.title,
                  pathSlug: a.pathSlug,
                  // Proof hard rule (F22) — same filter StructureSlot's addPage
                  // uses: an unpromised proof section can't be seeded.
                  sections: filterSectionsByProof([...a.defaultSections], {
                    hasTestimonials: state.proof.hasTestimonials,
                  }),
                }));
            }
            state.strategyStatus = 'done';
          });
          return;
        }
        // Only structure-gated engines fetch here (work single-page keeps its
        // slot skip; work multipage is handled chargeless above).
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

      // work-onboarding-shell P2b — journey step machine (additive). The union
      // is closed, so no range clamp is needed; the slot machine is untouched.
      setJourneyStep: (step) =>
        set((state) => {
          state.journeyStep = step;
        }),

      // work-onboarding-shell P3 — the atomic rail commit (decision 5).
      //
      // ORDER MATTERS, all of it:
      //  1. SNAPSHOT `briefFacts` + every field a mirror will overwrite BEFORE
      //     the optimistic `set` — after it, immer has replaced them and the
      //     pre-edit values are gone.
      //  2. ONE `set` applies `facts` + mirrors together. `facts` is the seam's
      //     merged bag (same object as `patch.facts`), so the rail re-projects
      //     immediately and the NEXT edit's `liveFacts` is this snapshot — which
      //     is what makes the seam's chip ids join correctly (chip stable-id
      //     rule). Never split this into two sets.
      //  3. POST + CHECK `res.ok`. `save()` swallows everything by design
      //     (autosave must not block the wizard); this must not — see the action
      //     doc. On failure we restore BOTH in one `set` and report `ok:false`.
      //
      // The toast lives at the CALL SITE (a store cannot use the `useToast`
      // hook); the revert — the part that protects generation — lives here.
      commitRail: (commit) => {
        // SERIALIZED (P4 — see `railCommitChain`). `perform` runs only after the
        // previous commit has SETTLED, so its snapshot is post-that-commit and
        // its revert can never undo someone else's successful edit. The queue is
        // what makes a second caller (STEP 03) safe against the wholesale revert.
        const perform = async (): Promise<WizardRailCommitResult> => {
          const { tokenId, currentSlot, slots } = get();
          if (!tokenId) return { ok: false, error: 'No project token' };

          const mirrors = commit.fieldMirrors ?? [];
          // Step 1 — pre-edit snapshots. Taken HERE (inside `perform`, i.e. when
          // this commit's turn starts), never at enqueue time — that is the
          // whole point of the chain.
          const prevFacts = get().briefFacts;
          const prevFields = mirrors.map(
            (m) => [m.fieldId, get().fields[m.fieldId]] as const
          );

          // Step 2 — the one optimistic set.
          set((state) => {
            state.briefFacts = commit.facts;
            for (const m of mirrors) {
              const prev = state.fields[m.fieldId];
              state.fields[m.fieldId] = {
                value: m.value,
                source: 'user',
                confirmed: prev?.confirmed ?? false,
                state: prev?.state ?? 'ask',
              };
            }
          });

          const revert = () =>
            set((state) => {
              state.briefFacts = prevFacts;
              for (const [id, entry] of prevFields) {
                // A field the mirror CREATED must be removed again, not left as
                // an `undefined`-valued entry.
                if (entry === undefined) delete state.fields[id];
                else state.fields[id] = entry;
              }
            });

          // Step 3 — persist. Body shape is `save()`'s, verbatim: the journey
          // has no slot, so `slots.indexOf(currentSlot)` is -1 → 0. Harmless —
          // the only consumer of the persisted stepIndex is dashboard
          // `continueRouting`, whose mid-journey branch routes 0 back through
          // onboarding (→ journey resume-mount) and whose `finalContent` branch
          // wins post-generation.
          try {
            const res = await fetch('/api/saveDraft', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tokenId,
                stepIndex: Math.max(0, slots.indexOf(currentSlot)),
                brief: commit.patch,
              }),
            });
            if (!res.ok) {
              revert();
              return { ok: false, error: `saveDraft failed (${res.status})` };
            }
            return { ok: true };
          } catch {
            revert();
            return { ok: false, error: 'saveDraft failed' };
          }
        };

        // Chain on SETTLEMENT (both arms), so one rejection cannot stall the
        // queue forever. `perform` never throws — it returns `{ok:false}` — so
        // the second arm is belt-and-braces.
        const run = railCommitChain.then(perform, perform);
        railCommitChain = run.then(
          () => undefined,
          () => undefined
        );
        return run;
      },

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
        // scale-10 phase 4 — collections ride `facts.collections`. saveDraft
        // shallow-merges the brief and REPLACES `facts` wholesale, so a partial
        // `{ facts: { collections } }` would DROP siblings (facts.entry, …).
        // Carry the COMPLETE facts snapshot with edited collections overlaid.
        // Only emit `facts` when we actually hold collection state, so autosaves
        // from earlier slots never touch (or clobber) persisted facts.
        if (Object.keys(state.collections).length > 0) {
          patch.facts = {
            ...(state.briefFacts ?? {}),
            collections: state.collections,
          };
        }
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
            goalParamSkipped: false,
            fields: {},
            slots: [],
            structureDisabled: [],
            collections: {},
            briefFacts: null,
          });
        }),
    })),
    { name: 'WizardStore' }
  )
);
