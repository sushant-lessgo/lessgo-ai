import { create } from "zustand";

type FeatureItem = {
  feature: string;
  benefit: string;
};

interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

type HiddenInferredFields = {
  awarenessLevel?: string;
  copyIntent?: string;
  brandTone?: string;
  layoutPersona?: string;
  [key: string]: string | undefined;
};

type OnboardingStore = {
  oneLiner: string;
  confirmedFields: Record<string, ConfirmedFieldData>; // AI guesses with confidence
  validatedFields: Record<string, string>; // User-confirmed final values
  hiddenInferredFields: HiddenInferredFields;
  stepIndex: number;
  featuresFromAI: FeatureItem[];

  setOneLiner: (input: string) => void;
  setConfirmedFields: (fields: Record<string, ConfirmedFieldData>) => void;
  setValidatedFields: (fields: Record<string, string>) => void;
  confirmField: (field: string, value: string) => void; // Move from confirmed → validated
  setHiddenInferredFields: (fields: HiddenInferredFields) => void;
  setStepIndex: (index: number) => void;
  setFeaturesFromAI: (features: FeatureItem[]) => void;
  reopenFieldForEditing: (field: string) => void;
  reset: () => void;
};

// Field name mapping (display name -> internal name)
const fieldNameMap: Record<string, string> = {
  "Market Category": "marketCategory",
  "Market Subcategory": "marketSubcategory", 
  "Target Audience": "targetAudience",
  "Key Problem Getting Solved": "keyProblem",
  "Startup Stage": "startupStage",
  "Landing Page Goals": "landingGoal",
  "Pricing Category and Model": "pricingModel",
};

// Reverse mapping (internal name -> display name)
const displayNameMap: Record<string, string> = Object.fromEntries(
  Object.entries(fieldNameMap).map(([display, internal]) => [internal, display])
);

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  oneLiner: "",
  confirmedFields: {}, // AI guesses with confidence
  validatedFields: {}, // User-confirmed values only
  hiddenInferredFields: {},
  stepIndex: 0,
  featuresFromAI: [],

  setOneLiner: (input) => set({ oneLiner: input }),
  
  setConfirmedFields: (fields) => {
    console.log('Setting confirmed fields:', fields);
    set({ confirmedFields: fields });
  },
  
  setValidatedFields: (fields) => {
    console.log('Setting validated fields:', fields);
    set({ validatedFields: fields });
  },
  
  setHiddenInferredFields: (fields) => set({ hiddenInferredFields: fields }),

  // ✅ CORRECT: Move value from confirmedFields → validatedFields
  confirmField: (displayField, value) => {
    const internalField = fieldNameMap[displayField] || displayField;
    
    console.log(`Confirming field: ${displayField} → ${internalField} = "${value}"`);
    
    set((state) => ({
      validatedFields: {
        ...state.validatedFields,
        [internalField]: value, // Add to validated fields
      },
    }));
  },

  // ✅ Reopen field for editing
  reopenFieldForEditing: (internalField) => {
    const displayField = displayNameMap[internalField];
    if (displayField) {
      const fieldOrder = [
        "Market Category",
        "Market Subcategory", 
        "Target Audience",
        "Key Problem Getting Solved",
        "Startup Stage",
        "Landing Page Goals",
        "Pricing Category and Model",
      ];
      
      const fieldIndex = fieldOrder.indexOf(displayField);
      if (fieldIndex !== -1) {
        // Remove from validated fields so user can re-confirm
        set((state) => {
          const newValidatedFields = { ...state.validatedFields };
          delete newValidatedFields[internalField];
          return {
            validatedFields: newValidatedFields,
            stepIndex: fieldIndex,
          };
        });
      }
    }
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