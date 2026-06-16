// src/hooks/useProductGenerationStore.ts
// Product-route (Meridian) generation flow state — P4.
// Mirrors useServiceGenerationStore but with product-specific shape
// (productName + UnderstandingData + landingGoal). Drives the parallel
// /onboarding/product/[token] wizard and the P3 /api/audience/product/* routes.
// Palette/variant are pilot-locked (mint/developer) — no style step.

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { LandingGoal, UnderstandingData } from '@/types/generation';

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
  'generating', // 4: strategy + copy generation, then redirect to /edit
] as const;

export type ProductGenerationStep = (typeof PRODUCT_GENERATION_STEPS)[number];

interface ProductGenerationState {
  currentStep: ProductGenerationStep;
  stepIndex: number;

  // Step 0
  productName: string;
  oneLiner: string;

  // Step 1
  understanding: UnderstandingData | null;
  understandingLoading: boolean;
  understandingError: string | null;

  // Step 2
  landingGoal: LandingGoal | null;

  // Step 3
  offer: string;

  // Website import (optional) — carried forward verbatim into generation.
  importSourceUrl: string | null;
  importedTestimonials: ImportedTestimonial[];

  // Step 4
  generationProgress: number;
  generationError: string | null;
}

interface ProductGenerationActions {
  goToStep: (step: ProductGenerationStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  setProductName: (value: string) => void;
  setOneLiner: (value: string) => void;

  setUnderstanding: (data: UnderstandingData) => void;
  setUnderstandingLoading: (loading: boolean) => void;
  setUnderstandingError: (error: string | null) => void;
  resetUnderstanding: () => void;

  setLandingGoal: (goal: LandingGoal) => void;
  setOffer: (offer: string) => void;

  setImportSourceUrl: (url: string | null) => void;
  setImportedTestimonials: (testimonials: ImportedTestimonial[]) => void;

  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;

  reset: () => void;
}

type ProductGenerationStore = ProductGenerationState & ProductGenerationActions;

const initialState: ProductGenerationState = {
  currentStep: 'oneLiner',
  stepIndex: 0,
  productName: '',
  oneLiner: '',
  understanding: null,
  understandingLoading: false,
  understandingError: null,
  landingGoal: null,
  offer: '',
  importSourceUrl: null,
  importedTestimonials: [],
  generationProgress: 0,
  generationError: null,
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
    { name: 'ProductGenerationStore' }
  )
);
