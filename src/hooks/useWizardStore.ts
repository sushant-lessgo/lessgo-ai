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
//     (trust/work skip `structure`). goToSlot/nextSlot/prevSlot operate on ids.
//   • Per-field state reuses the useOnboardingStore idea: `{ value, source, confirmed }`
//     plus the phase-1 waterfall `state` (scraped|inferred|ask|drop) so slots can
//     render ask-fields as questions and scraped/inferred as confirmable chips.
//     Field logic is NOT duplicated here — it comes from
//     `src/modules/wizard/waterfall.ts` (pure) + `src/modules/engines/inputContracts.ts`.
//   • `mode: 'review' | 'fill'` is DERIVED from the entry source: a URL/scrape
//     entry (rawInput is URL-like) ⇒ review; a manual one-liner ⇒ fill.
//   • Goal reuses scale-05: goalIntent/goalParam + intentToBriefGoal composer.
//   • Proof booleans are a SUPERSET of ServiceAssetAvailability (type-guarded).
//   • thing-only: sitemap/strategy + hero/style/mood picks. trust-only:
//     variantId/paletteId. (State slots only — UI wiring is phases 3/4/8.)
//
// FIREWALL: client store. Imports only pure helpers (contracts/waterfall/bridge/
// businessTypes) + types. Never imports a template resolver/registry/renderer or
// a published-renderer module.

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { Brief, CopyEngine } from '@/types/brief';
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
  wizardSlots,
  type ContractField,
  type WizardSlot,
} from '@/modules/engines/inputContracts';
import { computeFieldStates, type FieldState } from '@/modules/wizard/waterfall';
// Type-only — proves WizardProofState ⊇ ServiceAssetAvailability (see guard
// below). Canonical home is @/types/service since phase 10 retired the store.
import type { ServiceAssetAvailability } from '@/types/service';
// Type-only — the THING adapter input shape (the runtime module is loaded
// lazily inside fetchStrategy so the generation tree never enters the store's
// static import graph).
import type { ThingGenerationInput } from '@/modules/wizard/generation/thing';
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

  // thing-only — structure + style picks.
  sitemap: unknown[] | null;
  strategy: unknown | null;
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

/** Project the wizard store state → the THING adapter input (plain data). */
export function buildThingInput(s: WizardState): ThingGenerationInput {
  const fields = s.fields as Record<string, { value: unknown }>;
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
    strategy: (s.strategy as ProductStrategyOutput | null) ?? null,
    sitemap: (s.sitemap as SitemapPage[] | null) ?? null,
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

      fetchStrategy: async () => {
        const s = get();
        // Idempotency guard — the credit charge lives server-side in
        // /api/audience/product/strategy, so "never fetch twice" IS
        // "never charge twice". Back-navigation re-mounts the structure slot
        // with status 'done' ⇒ no-op. Concurrent calls: the status flips to
        // 'fetching' SYNCHRONOUSLY below, before any await, so a second call
        // in the same tick bails here too. Only 'idle' and 'error' (retry)
        // proceed.
        if (s.strategyStatus === 'fetching' || s.strategyStatus === 'done') return;
        if (s.strategy) {
          // Strategy already present (e.g. seeded externally) — mark done, no fetch.
          set((state) => {
            state.strategyStatus = 'done';
          });
          return;
        }
        set((state) => {
          state.strategyStatus = 'fetching';
          state.strategyError = null;
          state.strategyCreditsError = false;
        });

        // Lazy-load the adapter so the generation tree stays out of the store's
        // static import graph (firewall note at the top of this file).
        const { runStrategy } = await import('@/modules/wizard/generation/thing');
        const result = await runStrategy(buildThingInput(get()));

        if (result.status === 'done') {
          const { setStrategy, setSitemap, sitemap } = get();
          setStrategy(result.strategy);
          // Seed the sitemap from the (server-clamped) proposal only if the
          // user has no prior edits — never clobber an edited draft.
          if (!sitemap && result.strategy.sitemap) {
            setSitemap(result.strategy.sitemap);
          }
          set((state) => {
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
      buildBriefPatch: () => {
        const { goalIntent, goalParam } = get();
        const patch: Partial<Brief> = {};
        if (goalIntent) patch.goal = intentToBriefGoal(goalIntent, goalParam);
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
          });
        }),
    })),
    { name: 'WizardStore' }
  )
);
