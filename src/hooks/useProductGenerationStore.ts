// src/hooks/useProductGenerationStore.ts
// Product-route (Meridian) generation flow state — P4.
// Mirrors useServiceGenerationStore but with product-specific shape
// (productName + UnderstandingData + landingGoal). Drives the parallel
// /onboarding/product/[token] wizard and the P3 /api/audience/product/* routes.
// Meridian palette/variant stay pilot-locked (mint/developer); the vestria/
// manufacturer flow picks variant/palette/mood non-blockingly mid-generation
// (onboarding2 Phase 6).

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { LandingGoal, UnderstandingData } from '@/types/generation';
import type { GoalParamInput } from '@/modules/brief/bridge';
import type { GoalIntent } from '@/modules/goals/vocabulary';
import type {
  ProductStrategyOutput,
  SitemapPage,
  VestriaPalette,
  VestriaVariant,
} from '@/types/product';

/** Real testimonial imported from a user's existing website (verbatim). */
export interface ImportedTestimonial {
  quote: string;
  author_name: string;
  author_role: string;
}

/**
 * Product generation flow steps. Lean vs the legacy /create flow: no vibe /
 * research / 47-block selection / design-questions — strategy is lean and the
 * block map is fixed (Meridian 7).
 */
export const PRODUCT_GENERATION_STEPS = [
  'oneLiner', // 0: product name + one-liner
  'understanding', // 1: AI extracts categories / audiences / whatItDoes / features
  'goal', // 2: primary CTA (landingGoal)
  'offer', // 3: what the visitor gets
  'sitemap', // 4: sitemap proposal + human gate (multi-page templates ONLY — OfferStep skips it when the template has no page menu)
  'generating', // 5: copy generation, then redirect to /generate
] as const;

export type ProductGenerationStep = (typeof PRODUCT_GENERATION_STEPS)[number];

/** Product template selection (pilot: query param; future: product picker sets
 *  the same field). vestria is admin-gated server-side until GA metering. */
export type ProductTemplateId = 'meridian' | 'vestria';

/** Vestria hero variant (onboarding2 Axis B). Picked non-blockingly while copy
 *  streams; written into `content[heroId].layout` (the authoritative field the
 *  renderers read) at save time. Default = tailored (existing behavior). */
export type VestriaHeroVariant = 'VestriaTailoredHero' | 'VestriaFullBleedHero';

/** Vestria neutral mood (onboarding2 Axis A). Mirrors vestriaMoods in
 *  modules/templates/vestria/tokens.ts; persisted via Project.themeValues.mood. */
export type VestriaLookMood = 'bone' | 'slate';

interface ProductGenerationState {
  currentStep: ProductGenerationStep;
  stepIndex: number;

  // Template selection — checked BEFORE the persona branch in GeneratingStep.
  templateId: ProductTemplateId;

  // Step 0
  productName: string;
  oneLiner: string;

  // Step 1
  understanding: UnderstandingData | null;
  understandingLoading: boolean;
  understandingError: string | null;

  // Step 2
  landingGoal: LandingGoal | null;
  // Intent-first capture (scale-05 phase 9). The wizard now captures a
  // GoalIntent directly; `landingGoal` is kept ALONGSIDE (mirrored via
  // intentToLegacyGoal) so every downstream generation path stays untouched.
  goalIntent: GoalIntent | null;
  // Goal-slot param (scale-05 phase 1) — raw capture (store links, booking
  // URL, …); composed into Brief.goal at save via legacyGoalToBriefGoal.
  goalParam: GoalParamInput;

  // Step 3
  offer: string;

  // Website import (optional) — carried forward verbatim into generation.
  importSourceUrl: string | null;
  importedTestimonials: ImportedTestimonial[];

  // Step 4 (sitemap gate — multi-page templates only). strategy is fetched by
  // SitemapReviewStep and reused by GeneratingStep (no second strategy charge);
  // sitemap is the USER-AGREED shape (edited from strategy.sitemap).
  strategy: ProductStrategyOutput | null;
  sitemap: SitemapPage[] | null;

  // Step 5
  generationProgress: number;
  generationError: string | null;

  // Hero variant (vestria/manufacturer only) — non-blocking mid-generation pick.
  heroVariant: VestriaHeroVariant;
  // True only after an EXPLICIT user pick this session. Guards the save-time
  // application: a resumed run (store reset → false) must never re-apply the
  // default and clobber a previously persisted choice in the DB draft.
  heroVariantPicked: boolean;

  // Cosmetic look (onboarding2 Axis A, vestria/manufacturer only) — typeface
  // variant + accent palette + neutral mood, picked non-blockingly while copy
  // streams. Defaults = tailored/cobalt/bone (existing behavior when skipped).
  variantId: VestriaVariant;
  paletteId: VestriaPalette;
  mood: VestriaLookMood;
  // Same resume-safe guard pattern as heroVariantPicked, but PER FIELD: only an
  // EXPLICITLY picked field may be written to the draft. Per-field (not one
  // shared flag) because a RESUMED run can re-open the picker — a mood-only
  // pick there must not re-send the default variant/palette over previously
  // persisted choices.
  styleVariantPicked: boolean;
  stylePalettePicked: boolean;
  styleMoodPicked: boolean;
}

interface ProductGenerationActions {
  goToStep: (step: ProductGenerationStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  setTemplateId: (id: ProductTemplateId) => void;

  setProductName: (value: string) => void;
  setOneLiner: (value: string) => void;

  setUnderstanding: (data: UnderstandingData) => void;
  setUnderstandingLoading: (loading: boolean) => void;
  setUnderstandingError: (error: string | null) => void;
  resetUnderstanding: () => void;

  setLandingGoal: (goal: LandingGoal) => void;
  setGoalIntent: (intent: GoalIntent) => void;
  setGoalParam: (param: GoalParamInput) => void;
  setOffer: (offer: string) => void;

  setImportSourceUrl: (url: string | null) => void;
  setImportedTestimonials: (testimonials: ImportedTestimonial[]) => void;

  setStrategy: (strategy: ProductStrategyOutput | null) => void;
  setSitemap: (sitemap: SitemapPage[] | null) => void;

  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;

  setHeroVariant: (variant: VestriaHeroVariant) => void;

  setStyleVariantId: (variantId: VestriaVariant) => void;
  setStylePaletteId: (paletteId: VestriaPalette) => void;
  setStyleMood: (mood: VestriaLookMood) => void;

  reset: () => void;
}

type ProductGenerationStore = ProductGenerationState & ProductGenerationActions;

const initialState: ProductGenerationState = {
  currentStep: 'oneLiner',
  stepIndex: 0,
  templateId: 'meridian',
  productName: '',
  oneLiner: '',
  understanding: null,
  understandingLoading: false,
  understandingError: null,
  landingGoal: null,
  goalIntent: null,
  goalParam: {},
  offer: '',
  importSourceUrl: null,
  importedTestimonials: [],
  strategy: null,
  sitemap: null,
  generationProgress: 0,
  generationError: null,
  heroVariant: 'VestriaTailoredHero',
  heroVariantPicked: false,
  variantId: 'tailored',
  paletteId: 'cobalt',
  mood: 'bone',
  styleVariantPicked: false,
  stylePalettePicked: false,
  styleMoodPicked: false,
};

export const useProductGenerationStore = create<ProductGenerationStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      goToStep: (step) =>
        set((state) => {
          state.currentStep = step;
          state.stepIndex = PRODUCT_GENERATION_STEPS.indexOf(step);
        }),

      nextStep: () =>
        set((state) => {
          const next = Math.min(
            state.stepIndex + 1,
            PRODUCT_GENERATION_STEPS.length - 1
          );
          state.stepIndex = next;
          state.currentStep = PRODUCT_GENERATION_STEPS[next];
        }),

      prevStep: () =>
        set((state) => {
          const prev = Math.max(state.stepIndex - 1, 0);
          state.stepIndex = prev;
          state.currentStep = PRODUCT_GENERATION_STEPS[prev];
        }),

      setTemplateId: (id) =>
        set((state) => {
          state.templateId = id;
        }),

      setProductName: (value) =>
        set((state) => {
          state.productName = value;
        }),
      setOneLiner: (value) =>
        set((state) => {
          state.oneLiner = value;
        }),

      setUnderstanding: (data) =>
        set((state) => {
          state.understanding = data;
          state.understandingLoading = false;
          state.understandingError = null;
        }),
      setUnderstandingLoading: (loading) =>
        set((state) => {
          state.understandingLoading = loading;
        }),
      setUnderstandingError: (error) =>
        set((state) => {
          state.understandingError = error;
          state.understandingLoading = false;
        }),
      resetUnderstanding: () =>
        set((state) => {
          state.understanding = null;
          state.understandingLoading = false;
          state.understandingError = null;
        }),

      setLandingGoal: (goal) =>
        set((state) => {
          state.landingGoal = goal;
        }),
      setGoalIntent: (intent) =>
        set((state) => {
          state.goalIntent = intent;
        }),
      setGoalParam: (param) =>
        set((state) => {
          state.goalParam = param;
        }),
      setOffer: (offer) =>
        set((state) => {
          state.offer = offer;
        }),

      setImportSourceUrl: (url) =>
        set((state) => {
          state.importSourceUrl = url;
        }),
      setImportedTestimonials: (testimonials) =>
        set((state) => {
          state.importedTestimonials = testimonials;
        }),

      setStrategy: (strategy) =>
        set((state) => {
          state.strategy = strategy as any;
        }),
      setSitemap: (sitemap) =>
        set((state) => {
          state.sitemap = sitemap as any;
        }),

      setGenerationProgress: (progress) =>
        set((state) => {
          state.generationProgress = progress;
        }),
      setGenerationError: (error) =>
        set((state) => {
          state.generationError = error;
        }),

      setHeroVariant: (variant) =>
        set((state) => {
          state.heroVariant = variant;
          state.heroVariantPicked = true;
        }),

      setStyleVariantId: (variantId) =>
        set((state) => {
          state.variantId = variantId;
          state.styleVariantPicked = true;
        }),
      setStylePaletteId: (paletteId) =>
        set((state) => {
          state.paletteId = paletteId;
          state.stylePalettePicked = true;
        }),
      setStyleMood: (mood) =>
        set((state) => {
          state.mood = mood;
          state.styleMoodPicked = true;
        }),

      reset: () => set(initialState),
    })),
    { name: 'ProductGenerationStore' }
  )
);
