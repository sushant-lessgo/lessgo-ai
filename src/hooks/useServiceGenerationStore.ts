// src/hooks/useServiceGenerationStore.ts
// Service-route generation flow state - Phase 0 skeleton.
// Mirrors useGenerationStore but with service-specific shape (oneClient,
// ourPosition, servicePresentation — no oneReader/oneIdea/vibe).
// Phase 4 wires this into the service onboarding UI.

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ServiceType,
  ServiceGoal,
  TemplateId,
  ServiceStrategyOutput,
} from '@/types/service';
import { defaultVariantForTemplate } from '@/types/service';
import type { ScrapedTestimonial } from '@/lib/schemas';

/**
 * Service generation flow steps
 */
export const SERVICE_GENERATION_STEPS = [
  'oneLiner', // 0: User describes the service
  'understanding', // 1: AI extracts whatYouDo, services, targetClients, outcomes
  'goal', // 2: Primary CTA
  'offer', // 3: What does the visitor get
  'assets', // 4: Testimonials/logos/outcomes/case-studies/photos
  'style', // 5: Hearth palette picker
  'generating', // 6: Strategy + copy generation
  'complete', // 7: Page ready
] as const;

export type ServiceGenerationStep = (typeof SERVICE_GENERATION_STEPS)[number];

// Lean, de-overlapped service understanding (mirrors product's 4-field UX 1:1).
// serviceType is persona-seeded (no UI badge) and kept for strategy / section
// selection / palette fallback. The other five map onto the product shape:
//   whatYouDo ≈ whatItDoes, services ≈ categories, targetClients ≈ audiences,
//   outcomes ≈ features. deliveryModel is service-specific.
export interface ServiceUnderstanding {
  serviceType: ServiceType;
  whatYouDo: string;
  services: string[];
  targetClients: string[];
  outcomes: string[];
  deliveryModel: 'remote' | 'in-person' | 'hybrid';
}

/** Service-shaped AI extraction (no serviceType — that's persona-derived). */
export interface ServiceUnderstandingExtract {
  whatYouDo: string;
  services: string[];
  targetClients: string[];
  outcomes: string[];
  deliveryModel: 'remote' | 'in-person' | 'hybrid';
}

export interface ServiceAssetAvailability {
  hasTestimonials: boolean;
  hasClientLogos: boolean;
  hasOutcomes: boolean;
  hasCaseStudies: boolean;
  hasTeamPhotos: boolean;
  hasFounderPhoto: boolean;
  testimonialType: 'text' | 'photos' | 'video' | 'transformation' | null;
}

interface ServiceGenerationState {
  // Progress
  currentStep: ServiceGenerationStep;
  stepIndex: number;

  // Step 0
  oneLiner: string;
  // Optional studio/business name (manual or import-prefilled). Used for the
  // draft title and threaded into strategy/copy for brand-aware wording.
  businessName: string;

  // Step 1
  understanding: ServiceUnderstanding | null;
  understandingLoading: boolean;
  understandingError: string | null;

  // Website import (optional) — carried forward into AssetsStep + copy.
  importSourceUrl: string | null;
  importedTestimonials: ScrapedTestimonial[];

  // Step 2
  goal: ServiceGoal | null;

  // Step 3
  offer: string;

  // Step 4
  assets: ServiceAssetAvailability | null;

  // Step 5 — template + variant + palette (Phase 11b picker).
  // Palette is a template-agnostic slug (Hearth + Lex have disjoint palette ids).
  templateId: TemplateId;
  variantId: string;
  paletteId: string | null;

  // Step 6: Strategy
  strategy: ServiceStrategyOutput | null;
  strategyLoading: boolean;
  strategyError: string | null;

  // Step 6: Copy generation
  generationProgress: number;
  generationError: string | null;
}

interface ServiceGenerationActions {
  goToStep: (step: ServiceGenerationStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  setOneLiner: (value: string) => void;
  setBusinessName: (value: string) => void;
  setImportSourceUrl: (url: string | null) => void;
  setImportedTestimonials: (testimonials: ScrapedTestimonial[]) => void;

  setUnderstanding: (data: ServiceUnderstanding) => void;
  setUnderstandingLoading: (loading: boolean) => void;
  setUnderstandingError: (error: string | null) => void;
  resetUnderstanding: () => void;

  setGoal: (goal: ServiceGoal) => void;
  setOffer: (offer: string) => void;
  setAssets: (assets: ServiceAssetAvailability) => void;
  /** Switch template — resets variant + palette to the new template's defaults
   *  (Hearth/Lex ids don't overlap, so stale ids would break render). */
  setTemplateId: (templateId: TemplateId) => void;
  setVariantId: (variantId: string) => void;
  setPaletteId: (palette: string) => void;

  setStrategy: (strategy: ServiceStrategyOutput) => void;
  setStrategyLoading: (loading: boolean) => void;
  setStrategyError: (error: string | null) => void;

  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;

  reset: () => void;
}

type ServiceGenerationStore = ServiceGenerationState & ServiceGenerationActions;

const initialState: ServiceGenerationState = {
  currentStep: 'oneLiner',
  stepIndex: 0,
  oneLiner: '',
  businessName: '',
  understanding: null,
  understandingLoading: false,
  understandingError: null,
  importSourceUrl: null,
  importedTestimonials: [],
  goal: null,
  offer: '',
  assets: null,
  templateId: 'hearth',
  variantId: defaultVariantForTemplate['hearth'],
  paletteId: null,
  strategy: null,
  strategyLoading: false,
  strategyError: null,
  generationProgress: 0,
  generationError: null,
};

export const useServiceGenerationStore = create<ServiceGenerationStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      goToStep: (step) =>
        set((state) => {
          state.currentStep = step;
          state.stepIndex = SERVICE_GENERATION_STEPS.indexOf(step);
        }),

      nextStep: () =>
        set((state) => {
          const next = Math.min(
            state.stepIndex + 1,
            SERVICE_GENERATION_STEPS.length - 1
          );
          state.stepIndex = next;
          state.currentStep = SERVICE_GENERATION_STEPS[next];
        }),

      prevStep: () =>
        set((state) => {
          const prev = Math.max(state.stepIndex - 1, 0);
          state.stepIndex = prev;
          state.currentStep = SERVICE_GENERATION_STEPS[prev];
        }),

      setOneLiner: (value) =>
        set((state) => {
          state.oneLiner = value;
        }),
      setBusinessName: (value) =>
        set((state) => {
          state.businessName = value;
        }),
      setImportSourceUrl: (url) =>
        set((state) => {
          state.importSourceUrl = url;
        }),
      setImportedTestimonials: (testimonials) =>
        set((state) => {
          state.importedTestimonials = testimonials;
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

      setGoal: (goal) =>
        set((state) => {
          state.goal = goal;
        }),
      setOffer: (offer) =>
        set((state) => {
          state.offer = offer;
        }),
      setAssets: (assets) =>
        set((state) => {
          state.assets = assets;
        }),
      setTemplateId: (templateId) =>
        set((state) => {
          if (state.templateId === templateId) return;
          state.templateId = templateId;
          // Reset variant + palette — cross-template ids don't overlap.
          state.variantId = defaultVariantForTemplate[templateId];
          state.paletteId = null;
        }),
      setVariantId: (variantId) =>
        set((state) => {
          state.variantId = variantId;
        }),
      setPaletteId: (palette) =>
        set((state) => {
          state.paletteId = palette;
        }),

      setStrategy: (strategy) =>
        set((state) => {
          state.strategy = strategy;
          state.strategyLoading = false;
          state.strategyError = null;
        }),
      setStrategyLoading: (loading) =>
        set((state) => {
          state.strategyLoading = loading;
        }),
      setStrategyError: (error) =>
        set((state) => {
          state.strategyError = error;
          state.strategyLoading = false;
        }),

      setGenerationProgress: (progress) =>
        set((state) => {
          state.generationProgress = progress;
        }),
      setGenerationError: (error) =>
        set((state) => {
          state.generationError = error;
        }),

      reset: () => set(initialState),
    })),
    { name: 'ServiceGenerationStore' }
  )
);
