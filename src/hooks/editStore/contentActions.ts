// hooks/editStore/contentActions.ts - Enhanced content actions with section CRUD methods
import { useOnboardingStore } from '../useOnboardingStore';
import { buildFullPrompt, buildSectionPrompt, buildElementPrompt } from '@/modules/prompt/buildPrompt';
import { parseAiResponse } from '@/modules/prompt/parseAiResponse';
import { createSectionCRUDActions } from './sectionCRUDActions';
import type { BackgroundType } from '@/types/core/index';
import type { EditStore, APIRequest, ValidationError } from '@/types/store';
import type { ContentActions } from '@/types/store';
import type { ElementSelection } from '@/types/core/ui';
import type { ImageAsset } from '@/types/core/images';
import type { SectionType } from '@/types/core/content';

/**
 * ===== UTILITY FUNCTIONS =====
 */

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Validation helper
const validateSection = (section: any): string[] => {
  const errors: string[] = [];
  
  if (!section.id) errors.push('Section must have an ID');
  if (!section.elements || Object.keys(section.elements).length === 0) {
    errors.push('Section must have at least one element');
  }
  
  return errors;
};

// Validation helper for elements
const validateElement = (element: any, elementKey: string): string[] => {
  const errors: string[] = [];
  
  if (!element.type) errors.push(`Element ${elementKey} must have a type`);
  if (element.type === 'text' && !element.content) {
    errors.push(`Text element ${elementKey} must have content`);
  }
  
  return errors;
};

/**
 * ===== MAIN CONTENT ACTIONS FACTORY =====
 */

export function createContentActions(set: any, get: any): ContentActions {
  // Import section CRUD actions - this includes addSection, removeSection, etc.
  const sectionCRUDActions = createSectionCRUDActions(set, get);

  return {
    /**
     * ===== BASIC CONTENT OPERATIONS =====
     */
    
    updateElementContent: (sectionId: string, elementKey: string, content: string | string[]) =>
      set((state: EditStore) => {
        const updateTime = Date.now();
        console.log(`🔄 [${updateTime}] updateElementContent CALLED:`, {
          sectionId,
          elementKey,
          contentType: typeof content,
          contentLength: Array.isArray(content) ? content.length : content?.length,
          contentPreview: Array.isArray(content) ? content[0]?.substring(0, 50) : content?.toString().substring(0, 50),
          callStack: new Error().stack?.split('\n')[2]?.trim()
        });
        
        if (!state.content[sectionId]) {
          console.warn(`🔄 [${updateTime}] Section ${sectionId} not found`);
          return;
        }

        // Check if element exists and handle different content structures
        if (!state.content[sectionId].elements) {
          console.warn(`Elements not found in section ${sectionId}`);
          return;
        }

        // If element doesn't exist, create it (for cases like hero_image)
        if (!state.content[sectionId].elements[elementKey]) {
          console.log(`Creating missing element: ${elementKey} in section ${sectionId}`);
          state.content[sectionId].elements[elementKey] = {
            content: '',
            type: elementKey.includes('image') ? 'image' : 'text',
            isEditable: true,
            editMode: 'inline',
          };
        }

        const element = state.content[sectionId].elements[elementKey];
        
        // CRITICAL FIX: Ensure content is always a primitive string, never an object
        let stringContent: string;
        if (Array.isArray(content)) {
          stringContent = content.join(' ');
        } else if (typeof content === 'string') {
          stringContent = content;
        } else {
          console.warn('Unexpected content type, converting to string:', typeof content, content);
          stringContent = String(content);
        }
        
        // CRITICAL: Strip any object properties and ensure pure string
        if (typeof stringContent === 'object') {
          console.error('CRITICAL: String content is actually an object! Converting...', stringContent);
          stringContent = JSON.stringify(stringContent);
        }
        
        // Handle different content structures
        let oldValue;
        if (typeof element === 'string') {
          // Element is directly a string (legacy format)
          oldValue = element;
          // Ensure we store a pure string, not an object
          (state.content[sectionId].elements[elementKey] as any) = stringContent;
        } else if (element && typeof element === 'object') {
          // Element is an object with content property
          oldValue = element.content;
          // Ensure we store a pure string in the content property
          element.content = stringContent;
        } else {
          console.warn(`Unexpected element structure for ${elementKey}:`, element);
          return;
        }
        
        
        // Mark as customized
        state.content[sectionId].aiMetadata.isCustomized = true;
        state.persistence.isDirty = true;
        
        // Track change for auto-save
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'content',
          sectionId,
          elementKey,
          oldValue,
          newValue: content,
          timestamp: Date.now(),
          source: 'user',
        });
        
        state.lastUpdated = Date.now();
        
        console.log(`🔄 [${updateTime}] updateElementContent COMPLETED:`, {
          sectionId,
          elementKey,
          oldValue: String(oldValue).substring(0, 50) + '...',
          newValue: (Array.isArray(content) ? content[0] : content)?.toString().substring(0, 50) + '...',
          isDirty: state.persistence.isDirty,
          queuedChangesCount: state.queuedChanges.length
        });
      }),

    // Include all section CRUD actions
    ...sectionCRUDActions,



    /**
     * ===== SECTION DATA MANAGEMENT =====
     */

    setSection: (sectionId: string, sectionData: Partial<any>) => 
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          const oldSection = { ...state.content[sectionId] };
          
          // Merge new data
          Object.assign(state.content[sectionId], sectionData);
          
          // Track change
          state.queuedChanges.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'content',
            sectionId,
            oldValue: oldSection,
            newValue: state.content[sectionId],
            timestamp: Date.now(),
            source: 'user',
          });
          
          state.persistence.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    validateContent: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return false;
      
      const errors = validateSection(section);
      const elementErrors = Object.entries(section.elements).flatMap(([key, element]) => 
        validateElement(element, key)
      );
      
      const allErrors = [...errors, ...elementErrors];
      
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          // Initialize editMetadata if it doesn't exist
          if (!state.content[sectionId].editMetadata) {
            state.content[sectionId].editMetadata = {
              isSelected: false,
              lastModified: Date.now(),
              completionPercentage: 0,
              isEditing: false,
              isDeletable: true,
              isMovable: true,
              isDuplicable: true,
              validationStatus: {
                isValid: true,
                errors: [],
                warnings: [],
                missingRequired: [],
                lastValidated: Date.now(),
              },
            };
          }
          
          // Initialize validationStatus if it doesn't exist
          if (!state.content[sectionId].editMetadata.validationStatus) {
            state.content[sectionId].editMetadata.validationStatus = {
              isValid: true,
              errors: [],
              warnings: [],
              missingRequired: [],
              lastValidated: Date.now(),
            };
          }
          
          // Update validation
          state.content[sectionId].editMetadata.validationStatus.isValid = allErrors.length === 0;
          state.content[sectionId].editMetadata.validationStatus.errors = allErrors as any;
          state.content[sectionId].editMetadata.validationStatus.lastValidated = Date.now();
        }
      });
      
      return allErrors.length === 0;
    },

    exportSectionContent: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return null;
      
      return {
        sectionId,
        content: section,
        layout: state.sectionLayouts[sectionId],
        metadata: {
          exported: Date.now(),
          version: '1.0',
          backgroundType: section.backgroundType,
          isVisible: (section as any).isVisible,
        },
      };
    },

    importSectionContent: (sectionId: string, importData: any) =>
      set((state: EditStore) => {
        if (!state.content[sectionId] || !importData.content) return;
        
        const section = state.content[sectionId];
        
        // Merge imported elements
        Object.assign(section.elements, importData.content.elements);
        
        // Update metadata
        section.aiMetadata.isCustomized = true;
        section.backgroundType = importData.metadata?.backgroundType || section.backgroundType;
        if (importData.metadata?.isVisible !== undefined) {
          (section as any).isVisible = importData.metadata.isVisible;
        }
        
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    getContentSummary: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return null;
      
      return {
        sectionId,
        elementCount: Object.keys(section.elements || {}).length,
        isCustomized: section.aiMetadata?.isCustomized || false,
        lastModified: section.editMetadata?.lastModified || 0,
        completionPercentage: section.editMetadata?.completionPercentage || 0,
        backgroundType: section.backgroundType,
      };
    },

    // Missing methods that should be delegated to other action creators
    bulkUpdateSection: (sectionId: string, elements: Record<string, string | string[]>) =>
      set((state: EditStore) => {
        if (!state.content[sectionId]) {
          console.warn(`Section ${sectionId} not found`);
          return;
        }

        const section = state.content[sectionId];
        
        // Update all elements in bulk
        Object.entries(elements).forEach(([elementKey, content]) => {
          if (section.elements[elementKey]) {
            section.elements[elementKey].content = content;
          }
        });
        
        // Mark as customized
        section.aiMetadata.isCustomized = true;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    selectVariation: (index: number) =>
      set((state: EditStore) => {
        // This is a placeholder - actual implementation would select from shown variations
        console.log('Selecting variation:', index);
      }),

    applySelectedVariation: () =>
      set((state: EditStore) => {
        // This is a placeholder - actual implementation would apply the selected variation
        console.log('Applying selected variation');
      }),

    // These methods are implemented in coreActions.ts but required by ContentActions interface
    setBackgroundType: (sectionId: string, backgroundType: BackgroundType) => {
      console.warn('setBackgroundType should be called from coreActions');
    },

    markAsCustomized: (sectionId: string) => {
      console.warn('markAsCustomized should be called from coreActions');
    },

    // These methods are implemented in aiActions.ts but required by ContentActions interface
    regenerateSection: async (sectionId: string, userGuidance?: string) => {
      console.warn('regenerateSection should be called from aiActions');
    },

    regenerateElement: async (sectionId: string, elementKey: string, variationCount?: number) => {
      console.warn('regenerateElement should be called from aiActions');
    },

    showElementVariations: (elementId: string, variations: string[]) => {
      console.warn('showElementVariations should be called from aiActions');
    },

    hideElementVariations: () => {
      console.warn('hideElementVariations should be called from aiActions');
    },

    clearAIErrors: () => {
      console.warn('clearAIErrors should be called from aiActions');
    },

    // These methods are implemented in generationActions.ts but required by ContentActions interface
    regenerateAllContent: async () => {
      console.warn('regenerateAllContent should be called from generationActions');
    },

    updateFromAIResponse: (aiResponse: any) => {
      console.warn('updateFromAIResponse should be called from generationActions');
    },

    // This method is implemented in coreActions.ts but required by ContentActions interface
    setSectionBackground: (sectionId: string, sectionBackground: any) => {
      console.warn('setSectionBackground should be called from coreActions');
    },

  };
}