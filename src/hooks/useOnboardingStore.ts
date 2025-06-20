import { create } from "zustand";

type FeatureItem = {
  feature: string;
  benefit: string;
};

type HiddenInferredFields = {
  awarenessLevel?: string;
  copyIntent?: string;
  brandTone?: string;
  layoutPersona?: string;
  [key: string]: string | undefined;
};

type OnboardingStore = {
  oneLiner: string;
  confirmedFields: Record<string, string>; // From OpenAI + taxonomy
  validatedFields: Record<string, string>; // Confirmed by user
  hiddenInferredFields: HiddenInferredFields; // AI-only values (not user-facing)
  stepIndex: number;
  featuresFromAI: FeatureItem[];

  setOneLiner: (input: string) => void;
  setConfirmedFields: (fields: Record<string, string>) => void;
  confirmField: (field: string, value: string) => void;
  setValidatedFields: (fields: Record<string, string>) => void;
  setHiddenInferredFields: (fields: HiddenInferredFields) => void;
  setStepIndex: (index: number) => void;
  setFeaturesFromAI: (features: FeatureItem[]) => void;
  reset: () => void;
};

// Field name mapping (display name -> internal name)
const fieldNameMap: Record<string, string> = {
  "Market Category": "marketCategory",
  "Market Subcategory": "marketSubcategory",
  "Target Audience": "targetAudience",
  "Startup Stage": "startupStage",
  "Landing Page Goals": "landingGoal",
  "Pricing Category and Model": "pricingModel",
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  oneLiner: "",
  confirmedFields: {},
  validatedFields: {},
  hiddenInferredFields: {},
  stepIndex: 0,
  featuresFromAI: [],

  setOneLiner: (input) => set({ oneLiner: input }),
  setConfirmedFields: (fields) => set({ confirmedFields: fields }),
  setValidatedFields: (fields) => set({ validatedFields: fields }),
  setHiddenInferredFields: (fields) => set({ hiddenInferredFields: fields }),

 confirmField: (displayField, value) => {
    // Convert display name to internal name before storing
    const internalField = fieldNameMap[displayField] || displayField;
    
    set((state) => ({
      validatedFields: {
        ...state.validatedFields,
        [internalField]: value, // Store using internal name
      },
    }));
  },

  setStepIndex: (index) => set({ stepIndex: index }),
  setFeaturesFromAI: (features) => set({ featuresFromAI: features }),

  reset: () =>
    set({
      oneLiner: "",
      confirmedFields: {},
      validatedFields: {},
      hiddenInferredFields: {},
      stepIndex: 0,
      featuresFromAI: [],
    }),
}));
