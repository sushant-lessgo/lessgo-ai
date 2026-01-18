// src/hooks/useGenerationStore.ts
// New generation flow state management - Phase 1 Foundation
// Reference: newOnboarding.md, newOnboardingPlan.md

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  LandingGoal,
  Vibe,
  OneReader,
  OneIdea,
  IVOC,
  FeatureAnalysis,
  AssetAvailability,
  StrategyOutput,
  SectionType,
  UIBlockQuestion,
  UnderstandingData,
} from "@/types/generation";

/**
 * Generation flow steps (0-indexed)
 */
export const GENERATION_STEPS = [
  'oneLiner',           // 0: User provides product description
  'understanding',      // 1: AI extracts categories, audiences, features (playback)
  'landingGoal',        // 2: What should visitors do?
  'offer',              // 3: What does user get?
  'assetAvailability',  // 4: Testimonials/SocialProof/Results checkboxes
  'research',           // 5: IVOC (Tavily + LLM)
  'strategy',           // 6: oneReader, oneIdea, vibe, sections
  'uiblockSelection',   // 7: UIBlock choices + questions
  'generating',         // 8: Copy generation in progress
  'complete'            // 9: Page ready
] as const;

export type GenerationStep = (typeof GENERATION_STEPS)[number];

/**
 * Generation store state
 */
interface GenerationState {
  // Progress
  currentStep: GenerationStep;
  stepIndex: number;

  // Step 0: One-liner
  oneLiner: string;

  // Step 1: Understanding (AI-extracted, user-confirmed)
  understanding: UnderstandingData | null;
  understandingLoading: boolean;
  understandingError: string | null;

  // Step 2: Landing goal
  landingGoal: LandingGoal | null;

  // Step 3: Offer
  offer: string;

  // Step 4: Asset availability
  assetAvailability: AssetAvailability | null;

  // Step 5: Research (IVOC)
  ivoc: IVOC | null;
  ivocLoading: boolean;
  ivocError: string | null;

  // Step 6: Strategy
  strategy: StrategyOutput | null;
  strategyLoading: boolean;
  strategyError: string | null;

  // Step 7: UIBlock selection
  selectedSections: SectionType[];  // from strategy output
  uiblockSelections: Partial<Record<SectionType, string | null>>;  // null = pending question
  uiblockQuestions: UIBlockQuestion[];
  uiblockQuestionsAnswered: boolean;
  uiblockLoading: boolean;
  uiblockError: string | null;

  // Step 8-9: Generation
  generationProgress: number;  // 0-100
  generationError: string | null;
}

/**
 * Generation store actions
 */
interface GenerationActions {
  // Navigation
  goToStep: (step: GenerationStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: () => boolean;

  // Step 0: One-liner
  setOneLiner: (value: string) => void;

  // Step 1: Understanding
  setUnderstanding: (data: UnderstandingData) => void;
  setUnderstandingLoading: (loading: boolean) => void;
  setUnderstandingError: (error: string | null) => void;

  // Step 2: Landing goal
  setLandingGoal: (goal: LandingGoal) => void;

  // Step 3: Offer
  setOffer: (offer: string) => void;

  // Step 4: Asset availability
  setAssetAvailability: (assets: AssetAvailability) => void;

  // Step 5: Research (IVOC)
  setIVOC: (ivoc: IVOC) => void;
  setIVOCLoading: (loading: boolean) => void;
  setIVOCError: (error: string | null) => void;

  // Step 6: Strategy
  setStrategy: (strategy: StrategyOutput) => void;
  setStrategyLoading: (loading: boolean) => void;
  setStrategyError: (error: string | null) => void;

  // Step 7: UIBlock selection
  setSelectedSections: (sections: SectionType[]) => void;
  setUIBlockSelection: (section: SectionType, uiblock: string) => void;
  setUIBlockQuestions: (questions: UIBlockQuestion[]) => void;
  answerUIBlockQuestion: (section: SectionType, answer: string) => void;
  markQuestionsAnswered: () => void;
  setUIBlockLoading: (loading: boolean) => void;
  setUIBlockError: (error: string | null) => void;

  // Step 8-9: Generation
  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

type GenerationStore = GenerationState & GenerationActions;

/**
 * Initial state
 */
const initialState: GenerationState = {
  currentStep: 'oneLiner',
  stepIndex: 0,
  oneLiner: '',
  understanding: null,
  understandingLoading: false,
  understandingError: null,
  landingGoal: null,
  offer: '',
  assetAvailability: null,
  ivoc: null,
  ivocLoading: false,
  ivocError: null,
  strategy: null,
  strategyLoading: false,
  strategyError: null,
  selectedSections: [],
  uiblockSelections: {},
  uiblockQuestions: [],
  uiblockQuestionsAnswered: false,
  uiblockLoading: false,
  uiblockError: null,
  generationProgress: 0,
  generationError: null,
};

/**
 * Check if can proceed from current step
 */
const canProceedFromStep = (state: GenerationState): boolean => {
  switch (state.currentStep) {
    case 'oneLiner':
      return state.oneLiner.trim().length >= 10;
    case 'understanding':
      return state.understanding !== null && !state.understandingLoading;
    case 'landingGoal':
      return state.landingGoal !== null;
    case 'offer':
      return state.offer.trim().length > 0;
    case 'assetAvailability':
      return state.assetAvailability !== null;
    case 'research':
      return state.ivoc !== null && !state.ivocLoading;
    case 'strategy':
      return state.strategy !== null && !state.strategyLoading;
    case 'uiblockSelection':
      return (
        state.uiblockQuestionsAnswered ||
        state.uiblockQuestions.length === 0
      ) && !state.uiblockLoading;
    case 'generating':
      return state.generationProgress >= 100 && !state.generationError;
    case 'complete':
      return true;
    default:
      return false;
  }
};

/**
 * Generation store
 */
export const useGenerationStore = create<GenerationStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // Navigation
      goToStep: (step) => set((state) => {
        state.currentStep = step;
        state.stepIndex = GENERATION_STEPS.indexOf(step);
      }),

      nextStep: () => set((state) => {
        const nextIndex = Math.min(state.stepIndex + 1, GENERATION_STEPS.length - 1);
        state.stepIndex = nextIndex;
        state.currentStep = GENERATION_STEPS[nextIndex];
      }),

      prevStep: () => set((state) => {
        const prevIndex = Math.max(state.stepIndex - 1, 0);
        state.stepIndex = prevIndex;
        state.currentStep = GENERATION_STEPS[prevIndex];
      }),

      canProceed: () => canProceedFromStep(get()),

      // Step 0: One-liner
      setOneLiner: (value) => set((state) => {
        state.oneLiner = value;
      }),

      // Step 1: Understanding
      setUnderstanding: (data) => set((state) => {
        state.understanding = data;
        state.understandingLoading = false;
        state.understandingError = null;
      }),
      setUnderstandingLoading: (loading) => set((state) => {
        state.understandingLoading = loading;
      }),
      setUnderstandingError: (error) => set((state) => {
        state.understandingError = error;
        state.understandingLoading = false;
      }),

      // Step 2: Landing goal
      setLandingGoal: (goal) => set((state) => {
        state.landingGoal = goal;
      }),

      // Step 3: Offer
      setOffer: (offer) => set((state) => {
        state.offer = offer;
      }),

      // Step 4: Asset availability
      setAssetAvailability: (assets) => set((state) => {
        state.assetAvailability = assets;
      }),

      // Step 5: Research (IVOC)
      setIVOC: (ivoc) => set((state) => {
        state.ivoc = ivoc;
        state.ivocLoading = false;
        state.ivocError = null;
      }),
      setIVOCLoading: (loading) => set((state) => {
        state.ivocLoading = loading;
      }),
      setIVOCError: (error) => set((state) => {
        state.ivocError = error;
        state.ivocLoading = false;
      }),

      // Step 6: Strategy
      setStrategy: (strategy) => set((state) => {
        state.strategy = strategy;
        state.selectedSections = strategy.sections;
        state.strategyLoading = false;
        state.strategyError = null;
      }),
      setStrategyLoading: (loading) => set((state) => {
        state.strategyLoading = loading;
      }),
      setStrategyError: (error) => set((state) => {
        state.strategyError = error;
        state.strategyLoading = false;
      }),

      // Step 7: UIBlock selection
      setSelectedSections: (sections) => set((state) => {
        state.selectedSections = sections;
      }),

      setUIBlockSelection: (section, uiblock) => set((state) => {
        state.uiblockSelections[section] = uiblock;
      }),

      setUIBlockQuestions: (questions) => set((state) => {
        state.uiblockQuestions = questions;
        state.uiblockQuestionsAnswered = questions.length === 0;
      }),

      answerUIBlockQuestion: (section, answer) => set((state) => {
        state.uiblockSelections[section] = answer;
        state.uiblockQuestions = state.uiblockQuestions.filter(q => q.section !== section);
        if (state.uiblockQuestions.length === 0) {
          state.uiblockQuestionsAnswered = true;
        }
      }),

      markQuestionsAnswered: () => set((state) => {
        state.uiblockQuestionsAnswered = true;
      }),

      setUIBlockLoading: (loading) => set((state) => {
        state.uiblockLoading = loading;
      }),

      setUIBlockError: (error) => set((state) => {
        state.uiblockError = error;
        state.uiblockLoading = false;
      }),

      // Step 8-9: Generation
      setGenerationProgress: (progress) => set((state) => {
        state.generationProgress = progress;
      }),
      setGenerationError: (error) => set((state) => {
        state.generationError = error;
      }),

      // Reset
      reset: () => set(initialState),
    })),
    { name: 'GenerationStore' }
  )
);

/**
 * Selector hooks for common access patterns
 */
export const useCurrentStep = () => useGenerationStore((s) => s.currentStep);
export const useStepIndex = () => useGenerationStore((s) => s.stepIndex);
export const useOneLiner = () => useGenerationStore((s) => s.oneLiner);
export const useUnderstanding = () => useGenerationStore((s) => s.understanding);
export const useLandingGoal = () => useGenerationStore((s) => s.landingGoal);
export const useOffer = () => useGenerationStore((s) => s.offer);
export const useAssetAvailability = () => useGenerationStore((s) => s.assetAvailability);
export const useIVOC = () => useGenerationStore((s) => s.ivoc);
export const useStrategy = () => useGenerationStore((s) => s.strategy);
export const useSelectedSections = () => useGenerationStore((s) => s.selectedSections);
export const useUIBlockSelections = () => useGenerationStore((s) => s.uiblockSelections);
export const useUIBlockQuestions = () => useGenerationStore((s) => s.uiblockQuestions);
export const useGenerationProgress = () => useGenerationStore((s) => s.generationProgress);

/**
 * Loading state selectors
 */
export const useIsLoading = () => useGenerationStore((s) =>
  s.understandingLoading || s.ivocLoading || s.strategyLoading || s.uiblockLoading
);

/**
 * Error state selectors
 */
export const useHasError = () => useGenerationStore((s) =>
  s.understandingError || s.ivocError || s.strategyError || s.uiblockError || s.generationError
);

/**
 * Step completion status
 */
export const useStepCompletion = () => useGenerationStore((s) => ({
  oneLiner: s.oneLiner.trim().length >= 10,
  understanding: s.understanding !== null,
  landingGoal: s.landingGoal !== null,
  offer: s.offer.trim().length > 0,
  assetAvailability: s.assetAvailability !== null,
  research: s.ivoc !== null,
  strategy: s.strategy !== null,
  uiblockSelection: s.uiblockQuestionsAnswered || s.uiblockQuestions.length === 0,
  generating: s.generationProgress >= 100,
  complete: s.generationProgress >= 100,
}));
