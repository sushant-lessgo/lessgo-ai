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
        const currentState = get() as EditStore;
        const section = currentState.content[sectionId];
        
        if (!section) {
          throw new Error(`Section ${sectionId} not found`);
        }
        
        // Get section type and layout
        const sectionType = sectionId.split('-')[0]; // Extract type from ID like "hero-123456"
        const layout = currentState.sectionLayouts?.[sectionId];
        
        console.log('Regenerating section:', {
          sectionId,
          sectionType,
          layout,
          tokenId: currentState.tokenId,
          hasUserGuidance: !!userGuidance
        });
        
        // Call the API endpoint
        const response = await fetch('/api/regenerate-section', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sectionId,
            tokenId: currentState.tokenId,
            userGuidance,
            currentContent: section.elements,
            sectionType,
            layout
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to regenerate section');
        }
        
        const data = await response.json();
        console.log('Section regeneration response:', data);
        
        // Update the section content
        set((state: EditStore) => {
          if (state.content[sectionId] && data.content) {
            // Preserve existing structure but update element content
            const updatedElements = { ...state.content[sectionId].elements };
            
            // Merge new content with existing elements
            Object.entries(data.content).forEach(([key, value]: [string, any]) => {
              if (updatedElements[key]) {
                // Update existing element
                if (typeof value === 'object' && value.content !== undefined) {
                  updatedElements[key] = {
                    ...updatedElements[key],
                    content: value.content,
                    ...(value.type && { type: value.type })
                  };
                } else if (typeof value === 'string') {
                  // Handle simple string content
                  if (typeof updatedElements[key] === 'object') {
                    updatedElements[key].content = value;
                  } else {
                    updatedElements[key] = {
                      content: value,
                      type: 'text',
                      isEditable: true,
                      editMode: 'inline'
                    };
                  }
                }
              } else {
                // Add new element
                updatedElements[key] = value;
              }
            });
            
            // Update the section
            state.content[sectionId].elements = updatedElements;
            
            // Update AI metadata
            state.content[sectionId].aiMetadata = {
              ...state.content[sectionId].aiMetadata,
              lastGenerated: Date.now(),
              isCustomized: false,
            };
            
            // Update generation state
            state.aiGeneration.isGenerating = false;
            state.aiGeneration.currentOperation = null;
            state.aiGeneration.progress = 100;
            state.aiGeneration.status = 'Section regenerated successfully';
            state.persistence.isDirty = true;
            state.lastUpdated = Date.now();
            
            // Track change for auto-save
            state.queuedChanges.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'content',
              sectionId,
              oldValue: section.elements,
              newValue: updatedElements,
              timestamp: Date.now(),
              source: 'ai',
            });
          }
        });
        
        // Trigger auto-save
        const autoSaveModule = await import('@/utils/autoSaveDraft');
        if (autoSaveModule.completeSaveDraft) {
          await autoSaveModule.completeSaveDraft(currentState.tokenId, {
            description: `Section ${sectionId} regenerated`,
          });
        }
        
      } catch (error) {
        console.error('Section regeneration error:', error);
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Regeneration failed');
        });
        
        // Show user-friendly error message
        set((state: EditStore) => {
          state.aiGeneration.status = 'Failed to regenerate section. Please try again.';
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
        
        // Handle both structures: section.elements[elementKey] and section[elementKey]
        let element = section?.elements?.[elementKey] || section?.[elementKey];
        
        if (!section || !element) {
          console.error('Element not found:', {
            sectionId,
            elementKey,
            sectionExists: !!section,
            hasElementsObject: !!section?.elements,
            elementInElements: section?.elements?.[elementKey],
            elementDirect: section?.[elementKey],
            availableSections: Object.keys(currentState.content || {}),
            availableElementKeys: section?.elements ? Object.keys(section.elements) : [],
            availableDirectKeys: section ? Object.keys(section) : []
          });
          throw new Error('Element not found');
        }

        // Extract content - handle both element.content and direct content
        let currentContent = element.content !== undefined ? element.content : element;
        
        // Handle array content by joining it or using the first element
        if (Array.isArray(currentContent)) {
          currentContent = currentContent.length > 0 ? currentContent.join(' ') : '';
        }
        
        // Ensure currentContent is a string
        currentContent = String(currentContent || '');
        
        console.log('Regenerate element request:', {
          sectionId,
          elementKey,
          currentContent: currentContent.substring(0, 100) + '...',
          tokenId: currentState.tokenId
        });
        
        // Call the new API endpoint
        const response = await fetch(`/api/regenerate-element?tokenId=${encodeURIComponent(currentState.tokenId)}`, {
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

    applyVariation: (sectionId: string, elementKey: string, variationIndex: number) => {
      const state = get() as EditStore;
      const variation = state.elementVariations.variations[variationIndex];
      
      if (variation) {
        // Use the proper updateElementContent function to update the content
        // This ensures proper state management, change tracking, and auto-save
        get().updateElementContent(sectionId, elementKey, variation);
        
        // Update AI metadata
        set((state: EditStore) => {
          const section = state.content[sectionId];
          if (section) {
            // Handle both structures: section.elements[elementKey] and section[elementKey]
            if (section.elements && section.elements[elementKey]) {
              // Update AI metadata
              (section.elements[elementKey] as any).aiMetadata = {
                ...(section.elements[elementKey] as any).aiMetadata,
                lastGenerated: Date.now(),
                isCustomized: variationIndex === 0, // First option is original content
              };
            }
            
            // Update section's edit metadata
            if (section.editMetadata) {
              section.editMetadata.lastModified = Date.now();
            }
          }
          
          // Hide variations modal after applying
          state.elementVariations = {
            visible: false,
            variations: [],
            selectedIndex: 0,
            sectionId: '',
            elementKey: ''
          };
        });
      }
    },

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