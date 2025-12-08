import { create } from "zustand";
import type {
  InputVariables,
  HiddenInferredFields,
  FeatureItem,
  CanonicalFieldName,
  AssetAvailability
} from "@/types/core/index";

// ✅ Import as values (not types) for runtime usage
import { 
  FIELD_DISPLAY_NAMES,
  DISPLAY_TO_CANONICAL
} from "@/types/core/index";

import { logger } from "@/lib/logger";

// ✅ PHASE 2A: Type-safe interfaces using canonical types
interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

type OnboardingStore = {
  oneLiner: string;
  confirmedFields: Partial<Record<CanonicalFieldName, ConfirmedFieldData>>; // ✅ Type-safe with canonical names
  validatedFields: Partial<InputVariables>; // ✅ Type-safe instead of Record<string, string>
  hiddenInferredFields: HiddenInferredFields; // ✅ Already properly typed
  stepIndex: number;
  featuresFromAI: FeatureItem[]; // ✅ Already properly typed
  forceManualFields: CanonicalFieldName[]; // ✅ Track fields that should bypass auto-confirmation
  pendingRevalidationFields: CanonicalFieldName[]; // ✅ Track fields needing revalidation due to dependencies
  assetAvailability: AssetAvailability | null; // Sprint 7: Asset availability for layout selection

  setOneLiner: (input: string) => void;
  setConfirmedFields: (fields: Partial<Record<CanonicalFieldName, ConfirmedFieldData>>) => void; // ✅ Type-safe
  setValidatedFields: (fields: Partial<InputVariables>) => void; // ✅ Type-safe
  confirmField: (displayField: string, value: string, options?: { skipDependencyValidation?: boolean }) => void; // Accepts display name, converts internally
  setHiddenInferredFields: (fields: HiddenInferredFields) => void;
  setStepIndex: (index: number) => void;
  setFeaturesFromAI: (features: FeatureItem[]) => void;
  reopenFieldForEditing: (canonicalField: CanonicalFieldName) => void; // ✅ Type-safe parameter
  addForceManualField: (canonicalField: CanonicalFieldName) => void; // ✅ Add field to force manual list
  isFieldForceManual: (canonicalField: CanonicalFieldName) => boolean; // ✅ Check if field should be forced manual
  addPendingRevalidationField: (canonicalField: CanonicalFieldName) => void; // ✅ Add field to pending revalidation
  removePendingRevalidationField: (canonicalField: CanonicalFieldName) => void; // ✅ Remove field from pending revalidation
  isFieldPendingRevalidation: (canonicalField: CanonicalFieldName) => boolean; // ✅ Check if field needs revalidation
  setAssetAvailability: (availability: AssetAvailability) => void; // Sprint 7: Set asset availability
  reset: () => void;
};

// ✅ FIELD ORDER: Using canonical names (matches types/index.ts)
const CANONICAL_FIELD_ORDER: readonly CanonicalFieldName[] = [
  'marketCategory',
  'marketSubcategory',
  'targetAudience',
  'keyProblem',
  'startupStage',
  'landingPageGoals', // ✅ FIXED: Canonical name (not landingGoal)
  'pricingModel'
] as const;

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  oneLiner: "",
  confirmedFields: {}, // ✅ Type-safe: Partial<Record<CanonicalFieldName, ConfirmedFieldData>>
  validatedFields: {}, // ✅ Type-safe: Partial<InputVariables>
  hiddenInferredFields: {},
  stepIndex: 0,
  featuresFromAI: [],
  forceManualFields: [], // ✅ Initialize empty array for force manual fields
  pendingRevalidationFields: [], // ✅ Initialize empty array for pending revalidation fields
  assetAvailability: null, // Sprint 7: Initialize as null

  setOneLiner: (input) => set({ oneLiner: input }),
  
  // ✅ Type-safe setters
  setConfirmedFields: (fields) => {
    logger.debug('Setting confirmed fields:', fields);
    set({ confirmedFields: fields });
  },
  
  setValidatedFields: (fields) => {
    // logger.debug('Setting validated fields:', fields);
    set({ validatedFields: fields });
  },
  
  setHiddenInferredFields: (fields) => set({ hiddenInferredFields: fields }),

  // ✅ FIXED: Move value from confirmedFields → validatedFields using canonical names
  confirmField: (displayField, value, options = {}) => {
    const { skipDependencyValidation = false } = options;
    // Convert display name to canonical name using types/index.ts mapping
    const canonicalField = DISPLAY_TO_CANONICAL[displayField as keyof typeof DISPLAY_TO_CANONICAL];
    
    if (!canonicalField) {
      logger.error(() => `Unknown display field: "${displayField}". Available fields:`, () => Object.keys(DISPLAY_TO_CANONICAL));
      return;
    }
    
    logger.debug(() => `Confirming field: ${displayField} → ${canonicalField} = "${value}"`);
    
    set((state) => {
      const newValidatedFields = {
        ...state.validatedFields,
        [canonicalField]: value, // ✅ Add to validated fields with canonical name
      };

      // ✅ CRITICAL FIX: Also clear from confirmedFields, not just validatedFields
      const newConfirmedFields = { ...state.confirmedFields };
      let newForceManualFields = [...state.forceManualFields];

      if (!skipDependencyValidation && canonicalField === 'marketCategory') {
        // Market Category changed - CLEAR old subcategory from BOTH stores
        if (newValidatedFields['marketSubcategory']) {
          delete newValidatedFields['marketSubcategory'];
        }
        if (newConfirmedFields['marketSubcategory']) {
          delete newConfirmedFields['marketSubcategory']; // Removes old AI guess, confidence, alternatives
        }
        logger.debug(() => `Market Category changed to "${value}" - clearing old subcategory from both stores`);

        // Force manual confirmation for subcategory
        if (!newForceManualFields.includes('marketSubcategory')) {
          newForceManualFields.push('marketSubcategory');
        }
      }

      return {
        validatedFields: newValidatedFields,
        confirmedFields: newConfirmedFields, // ✅ Update confirmedFields too
        forceManualFields: newForceManualFields,
      };
    });
  },

  // ✅ FIXED: Reopen field for editing using canonical names
  reopenFieldForEditing: (canonicalField) => {
    const displayField = FIELD_DISPLAY_NAMES[canonicalField];
    if (!displayField) {
      logger.error(() => `Unknown canonical field: "${canonicalField}". Available fields:`, () => Object.keys(FIELD_DISPLAY_NAMES));
      return;
    }
    
    const fieldIndex = CANONICAL_FIELD_ORDER.indexOf(canonicalField);
    if (fieldIndex !== -1) {
      // ✅ FIXED: Don't remove from validatedFields - keep the current value so user sees it when editing
      set((state) => {
        // ✅ Add to force manual fields to bypass auto-confirmation
        const newForceManualFields = [...state.forceManualFields];
        if (!newForceManualFields.includes(canonicalField)) {
          newForceManualFields.push(canonicalField);
        }
        
        return {
          stepIndex: fieldIndex,
          forceManualFields: newForceManualFields,
          // Keep validatedFields intact so current value is preserved
        };
      });
      
      logger.debug(() => `Reopened field "${canonicalField}" for editing at step ${fieldIndex} (forced manual)`);
    } else {
      logger.error(() => `Field "${canonicalField}" not found in field order`);
    }
  },

  // ✅ Add field to force manual confirmation list
  addForceManualField: (canonicalField) => {
    set((state) => {
      const newForceManualFields = [...state.forceManualFields];
      if (!newForceManualFields.includes(canonicalField)) {
        newForceManualFields.push(canonicalField);
      }
      return { forceManualFields: newForceManualFields };
    });
  },

  // ✅ Check if field should be forced to manual confirmation
  isFieldForceManual: (canonicalField) => {
    return get().forceManualFields.includes(canonicalField);
  },

  // ✅ Add field to pending revalidation list
  addPendingRevalidationField: (canonicalField) => {
    set((state) => {
      const newPendingFields = [...state.pendingRevalidationFields];
      if (!newPendingFields.includes(canonicalField)) {
        newPendingFields.push(canonicalField);
      }
      return { pendingRevalidationFields: newPendingFields };
    });
  },

  // ✅ Remove field from pending revalidation list
  removePendingRevalidationField: (canonicalField) => {
    set((state) => ({
      pendingRevalidationFields: state.pendingRevalidationFields.filter(field => field !== canonicalField)
    }));
  },

  // ✅ Check if field is pending revalidation
  isFieldPendingRevalidation: (canonicalField) => {
    return get().pendingRevalidationFields.includes(canonicalField);
  },

  setStepIndex: (index) => set({ stepIndex: index }),
  setFeaturesFromAI: (features) => set({ featuresFromAI: features }),

  // Sprint 7: Set asset availability
  setAssetAvailability: (availability) => {
    logger.debug('Setting asset availability:', availability);
    set({ assetAvailability: availability });
  },

  reset: () =>
    set({
      oneLiner: "",
      confirmedFields: {},
      validatedFields: {},
      hiddenInferredFields: {},
      stepIndex: 0,
      featuresFromAI: [],
      forceManualFields: [], // ✅ Reset force manual fields
      pendingRevalidationFields: [], // ✅ Reset pending revalidation fields
      assetAvailability: null, // Sprint 7: Reset asset availability
    }),
}));

// ✅ EXPORT: Helper functions for type-safe field operations
export const getCanonicalFieldOrder = (): readonly CanonicalFieldName[] => CANONICAL_FIELD_ORDER;

export const getDisplayNameForCanonicalField = (canonicalField: CanonicalFieldName): string => {
  return FIELD_DISPLAY_NAMES[canonicalField];
};

export const getCanonicalFieldForDisplayName = (displayField: string): CanonicalFieldName | null => {
  return DISPLAY_TO_CANONICAL[displayField as keyof typeof DISPLAY_TO_CANONICAL] || null;
};

// ✅ TYPE GUARD: Validate confirmed fields structure
export const isValidConfirmedFields = (
  fields: any
): fields is Partial<Record<CanonicalFieldName, ConfirmedFieldData>> => {
  if (typeof fields !== 'object' || fields === null) return false;
  
  return Object.entries(fields).every(([key, value]) => {
    // Check if key is a valid canonical field name
    if (!CANONICAL_FIELD_ORDER.includes(key as CanonicalFieldName)) return false;
    
    // Check if value has correct ConfirmedFieldData structure
    if (typeof value !== 'object' || value === null) return false;
    
    const fieldData = value as any;
    return (
      typeof fieldData.value === 'string' &&
      typeof fieldData.confidence === 'number' &&
      fieldData.confidence >= 0 &&
      fieldData.confidence <= 1 &&
      (fieldData.alternatives === undefined || Array.isArray(fieldData.alternatives))
    );
  });
};

// ✅ DEBUG: Development helper (remove in production)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // @ts-ignore - Development debugging
  window.__onboardingStoreDebug = {
    getState: () => useOnboardingStore.getState(),
    getCanonicalFieldOrder,
    getDisplayNameForCanonicalField,
    getCanonicalFieldForDisplayName,
    isValidConfirmedFields,
    CANONICAL_FIELD_ORDER,
  };
}