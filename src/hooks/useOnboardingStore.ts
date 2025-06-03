import { create } from "zustand";

type FeatureItem = {
  feature: string;
  benefit: string;
};

type OnboardingStore = {
  oneLiner: string;
  confirmedFields: Record<string, string>; // From OpenAI + taxonomy
  validatedFields: Record<string, string>; // Confirmed by user
  stepIndex: number;
  featuresFromAI: FeatureItem[];
  
  setOneLiner: (input: string) => void;
  setConfirmedFields: (fields: Record<string, string>) => void;
  confirmField: (field: string, value: string) => void;
  setValidatedFields: (fields: Record<string, string>) => void;
  setStepIndex: (index: number) => void;
  setFeaturesFromAI: (features: FeatureItem[]) => void;
  reset: () => void;

  
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  oneLiner: "",
  confirmedFields: {},
  validatedFields: {},
  stepIndex: 0,

  setOneLiner: (input) => set({ oneLiner: input }),
  setConfirmedFields: (fields) => set({ confirmedFields: fields }),
  setValidatedFields: (fields) => set({ validatedFields: fields }),

  confirmField: (field, value) =>
    set((state) => ({
      validatedFields: {
        ...state.validatedFields,
        [field]: value,
      },
    })),

  setStepIndex: (index) => set({ stepIndex: index }),

    featuresFromAI: [],
    setFeaturesFromAI: (features) => set({ featuresFromAI: features }),

  reset: () =>
    set({
      oneLiner: "",
      confirmedFields: {},
      validatedFields: {},
      stepIndex: 0,
    }),
}));
