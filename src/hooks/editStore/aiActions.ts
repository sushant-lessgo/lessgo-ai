// hooks/editStore/aiActions.ts - AI generation and regeneration actions
import type { EditStore } from '@/types/store';

/**
 * Consolidated AI actions for content generation and regeneration
 */
export function createAIActions(set: any, get: any) {
  return {
    /**
     * ===== GENERATION ACTIONS =====
     */
    regenerateSection: async (sectionId: string, userGuidance?: string) => {
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'section';
        state.aiGeneration.progress = 0;
        state.aiGeneration.status = 'Regenerating section content...';
      });

      try {
        // Mock regeneration logic - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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
            state.aiGeneration.progress = 100;
            state.aiGeneration.status = 'Section regenerated successfully';
            state.persistence.isDirty = true;
          }
        });
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Regeneration failed');
        });
        throw error;
      }
    },

    regenerateElement: async (sectionId: string, elementKey: string, variationCount: number = 1) => {
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'element';
        state.aiGeneration.progress = 0;
        state.aiGeneration.status = 'Regenerating element content...';
      });

      try {
        // Mock regeneration logic - replace with actual API call
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
            state.aiGeneration.progress = 100;
            state.aiGeneration.status = 'Element regenerated successfully';
            state.persistence.isDirty = true;
          }
        });
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Element regeneration failed');
        });
        throw error;
      }
    },

    // Unified regenerate function that always returns variations
    regenerateElementWithVariations: async (sectionId: string, elementKey: string, variationCount: number = 5) => {
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'element';
        state.aiGeneration.progress = 0;
        state.aiGeneration.status = 'Generating variations...';
      });

      try {
        const currentState = get() as any;
        const section = currentState.content[sectionId];
        if (!section || !section.elements[elementKey]) {
          throw new Error('Element not found');
        }

        const currentContent = section.elements[elementKey].content;
        
        // Call the new API endpoint
        const response = await fetch('/api/regenerate-element', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sectionId,
            elementKey,
            currentContent,
            variationCount
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        
        set((state: EditStore) => {
          state.elementVariations = {
            visible: true,
            variations: [currentContent, ...result.variations], // Include current as first option
            selectedIndex: 0,
            sectionId,
            elementKey
          };
          
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.progress = 100;
          state.aiGeneration.status = 'Variations generated successfully';
        });

        return result.variations;
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Variation generation failed');
        });
        throw error;
      }
    },

    generateVariations: async (sectionId: string, elementKey: string, count: number = 5) => {
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'element';
        state.aiGeneration.status = 'Generating variations...';
      });

      try {
        // Mock variation generation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockVariations = Array.from({ length: count }, (_, i) => 
          `Variation ${i + 1} - Generated content with different tone and style`
        );

        set((state: EditStore) => {
          state.elementVariations = {
            visible: true,
            variations: mockVariations,
            selectedIndex: 0,
            sectionId,
            elementKey
          };
          
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.status = 'Variations generated successfully';
        });

        return mockVariations;
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Variation generation failed');
        });
        throw error;
      }
    },

    /**
     * ===== VARIATION MANAGEMENT =====
     */
    showElementVariations: (elementId: string, variations: string[]) =>
      set((state: EditStore) => {
        // Parse elementId to get sectionId and elementKey
        const [sectionId, elementKey] = elementId.split('.');
        state.elementVariations = {
          visible: true,
          variations,
          selectedIndex: 0,
          sectionId: sectionId || '',
          elementKey: elementKey || ''
        };
      }),

    hideElementVariations: () =>
      set((state: EditStore) => {
        state.elementVariations = {
          visible: false,
          variations: [],
          selectedIndex: 0,
          sectionId: '',
          elementKey: ''
        };
      }),

    setVariationSelection: (index: number) =>
      set((state: EditStore) => {
        state.elementVariations.selectedIndex = index;
      }),

    applyVariation: (sectionId: string, elementKey: string, variationIndex: number) =>
      set((state: EditStore) => {
        const variation = state.elementVariations.variations[variationIndex];
        if (variation) {
          const section = state.content[sectionId];
          if (section && section.elements[elementKey]) {
            section.elements[elementKey].content = variation;
            section.editMetadata.lastModified = Date.now();
            state.persistence.isDirty = true;
            
            // Update AI metadata
            (section.elements[elementKey] as any).aiMetadata = {
              ...(section.elements[elementKey] as any).aiMetadata,
              lastGenerated: Date.now(),
              isCustomized: variationIndex === 0, // First option is original content
            };
            
            // Hide variations after applying
            state.elementVariations = {
              visible: false,
              variations: [],
              selectedIndex: 0,
              sectionId: '',
              elementKey: ''
            };
          }
        }
      }),

    /**
     * ===== AI GENERATION STATUS =====
     */
    setGenerationMode: (enabled: boolean) =>
      set((state: EditStore) => {
        (state as any).generationMode = enabled;
        
        if (enabled) {
          // Disable heavy features during generation
          state.leftPanel.collapsed = true;
          // state.toolbar.visible = false;
          // state.toolbar.type = null;
        }
      }),

    clearAIErrors: () =>
      set((state: EditStore) => {
        state.aiGeneration.errors = [];
        state.aiGeneration.warnings = [];
      }),

    updateGenerationProgress: (progress: number, status: string) =>
      set((state: EditStore) => {
        state.aiGeneration.progress = Math.max(0, Math.min(100, progress));
        state.aiGeneration.status = status;
      }),

    /**
     * ===== INFERENCE AND VALIDATION =====
     */
    inferFields: async (inputText: string) => {
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'page';
        state.aiGeneration.status = 'Analyzing input and inferring fields...';
      });

      try {
        // Mock field inference - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockInferredFields = {
          marketCategory: { value: 'Software', confidence: 0.85 },
          targetAudience: { value: 'Small businesses', confidence: 0.75 },
          keyProblem: { value: 'Manual processes', confidence: 0.8 },
        };

        set((state: EditStore) => {
          state.onboardingData.validatedFields = mockInferredFields as any;
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.status = 'Field inference completed';
        });

        return mockInferredFields;
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Field inference failed');
        });
        throw error;
      }
    },

    validateGeneratedContent: (sectionId: string) => {
      set((state: EditStore) => {
        const section = state.content[sectionId];
        if (section) {
          const errors: string[] = [];
          const warnings: string[] = [];
          
          // Basic validation logic
          if (!section.elements || Object.keys(section.elements).length === 0) {
            errors.push('Section has no content elements');
          }
          
          if (!section.layout) {
            errors.push('Section has no layout defined');
          }
          
          // Update validation status
          section.editMetadata.validationStatus = {
            isValid: errors.length === 0,
            errors: errors as any,
            warnings: warnings as any,
            missingRequired: [],
            lastValidated: Date.now(),
          };
          
          section.editMetadata.completionPercentage = errors.length === 0 ? 100 : 50;
        }
      });
    },
  };
}