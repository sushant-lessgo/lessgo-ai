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
    
    updateContent: (sectionId: string, elementKey: string, content: string | string[]) =>
      set((state: EditStore) => {
        if (!state.content[sectionId]) {
          console.warn(`Section ${sectionId} not found`);
          return;
        }

        if (!state.content[sectionId].elements[elementKey]) {
          console.warn(`Element ${elementKey} not found in section ${sectionId}`);
          return;
        }

        const oldValue = state.content[sectionId].elements[elementKey].content;
        
        // Update the content
        state.content[sectionId].elements[elementKey].content = content;
        
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
      }),

    // Include all section CRUD actions
    ...sectionCRUDActions,

    /**
     * ===== AI GENERATION OPERATIONS =====
     */

    regenerateSection: async (sectionId: string, userGuidance?: string): Promise<void> => {
      // Mock AI regeneration - replace with actual API call
      console.log('🤖 Regenerating section:', sectionId, userGuidance);
      
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'section';
        state.aiGeneration.status = 'Generating new content...';
      });

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          // Update AI metadata
          state.content[sectionId].aiMetadata = {
            ...state.content[sectionId].aiMetadata,
            lastGenerated: Date.now(),
            isCustomized: false,
          };
          
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.status = 'Section regenerated successfully';
        }
      });
    },

    regenerateElement: async (sectionId: string, elementKey: string, variationCount: number = 3): Promise<void> => {
      console.log('🤖 Regenerating element:', `${sectionId}.${elementKey}`, { variationCount });
      
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'element';
        state.aiGeneration.status = 'Generating element variations...';
      });

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      set((state: EditStore) => {
        const section = state.content[sectionId];
        if (section && section.elements[elementKey]) {
          // Update element with new content
          (section.elements[elementKey] as any).aiMetadata = {
            ...(section.elements[elementKey] as any).aiMetadata,
            lastGenerated: Date.now(),
            isCustomized: false,
          };
          
          section.editMetadata.lastModified = Date.now();
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.status = 'Element regenerated successfully';
        }
      });
    },

    /**
     * ===== HISTORY MANAGEMENT =====
     */

    undo: () =>
      set((state: EditStore) => {
        // History functionality simplified for now
        console.log('Undo action triggered');
      }),

    redo: () =>
      set((state: EditStore) => {
        // History functionality simplified for now
        console.log('Redo action triggered');
      }),

    clearHistory: () =>
      set((state: EditStore) => {
        // History functionality simplified for now
        console.log('Clear history action triggered');
      }),

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

    getContentSummary: () => {
      const state = get();
      return {
        totalSections: state.sections.length,
        totalElements: state.sections.reduce((total: number, sectionId: string) => {
          const section = state.content[sectionId];
          return total + (section ? Object.keys(section.elements || {}).length : 0);
        }, 0),
        lastModified: state.lastUpdated,
        isDirty: state.persistence.isDirty,
      };
    },

  };
}