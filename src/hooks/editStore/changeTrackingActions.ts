
// ================================================================
// hooks/editStore/changeTrackingActions.ts - NEW FILE
// ================================================================

import type { EditStore } from '@/types/store';
import type { CanonicalFieldName, InputVariables, HiddenInferredFields } from '@/types/core/index';

export interface ChangeTrackingActions {
  initializeChangeTracking: (onboardingData: any) => void;
  trackFieldChange: (field: CanonicalFieldName, newValue: string) => void;
  getChangedFields: () => CanonicalFieldName[];
  getHasChanges: () => boolean;
  resetChangeTracking: () => void;
  getChangesSummary: () => {
    changedFields: CanonicalFieldName[];
    hasChanges: boolean;
    changeCount: number;
    lastChange: number;
  };
}

export function createChangeTrackingActions(set: any, get: () => EditStore): ChangeTrackingActions {
  return {
    initializeChangeTracking: (onboardingData: any) => {
      set((state: EditStore) => {
        const combinedInputs = {
          ...onboardingData.validatedFields,
          ...onboardingData.hiddenInferredFields,
        };
        
        state.changeTracking = {
          originalInputs: { ...combinedInputs },
          currentInputs: { ...combinedInputs },
          hasChanges: false,
          changedFields: [],
          lastChangeTimestamp: Date.now(),
        };
      });
    },

    trackFieldChange: (field: CanonicalFieldName, newValue: string) => {
      set((state: EditStore) => {
        const oldValue = state.changeTracking.originalInputs[field as keyof typeof state.changeTracking.originalInputs];
        
        // Update current value
        state.changeTracking.currentInputs[field as keyof typeof state.changeTracking.currentInputs] = newValue as any;
        
        // Track changes
        if (oldValue !== newValue) {
          if (!state.changeTracking.changedFields.includes(field)) {
            state.changeTracking.changedFields.push(field);
          }
        } else {
          // Remove from changed if reverted to original
          state.changeTracking.changedFields = state.changeTracking.changedFields.filter(f => f !== field);
        }
        
        state.changeTracking.hasChanges = state.changeTracking.changedFields.length > 0;
        state.changeTracking.lastChangeTimestamp = Date.now();
      });
    },

    getChangedFields: () => {
      const state = get();
      return [...state.changeTracking.changedFields];
    },

    getHasChanges: () => {
      const state = get();
      return state.changeTracking.hasChanges;
    },

    resetChangeTracking: () => {
      set((state: EditStore) => {
        state.changeTracking.originalInputs = { ...state.changeTracking.currentInputs };
        state.changeTracking.changedFields = [];
        state.changeTracking.hasChanges = false;
        state.changeTracking.lastChangeTimestamp = Date.now();
      });
    },

    getChangesSummary: () => {
      const state = get();
      return {
        changedFields: [...state.changeTracking.changedFields],
        hasChanges: state.changeTracking.hasChanges,
        changeCount: state.changeTracking.changedFields.length,
        lastChange: state.changeTracking.lastChangeTimestamp,
      };
    },
  };
}
