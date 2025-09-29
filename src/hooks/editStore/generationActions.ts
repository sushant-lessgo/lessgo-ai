// hooks/editStore/generationActions.ts - Generation-specific actions for EditStore
import type { StateCreator } from 'zustand';
import type { EditStore, SectionData } from '@/types/store';
import type { BackgroundType } from '@/types/sectionBackground';
import { getSectionBackgroundType } from '@/modules/Design/background/backgroundIntegration';
import { 
  generateColorTokens, 
  generateColorTokensFromBackgroundSystem, 
  type BackgroundSystem
} from '@/modules/Design/ColorSystem/colorTokens';
import { pickFontFromOnboarding } from '@/modules/Design/fontSystem/pickFont';

import { logger } from '@/lib/logger';
// AI Generation Status type
type AIGenerationStatus = {
  isGenerating: boolean;
  lastGenerated?: number;
  success: boolean;
  isPartial: boolean;
  warnings: string[];
  errors: string[];
  sectionsGenerated: string[];
  sectionsSkipped: string[];
};

// Mock AI service for regeneration
const generateSectionContent = async (sectionId: string, prompt?: string): Promise<Record<string, string>> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    headline: `AI Generated Headline for ${sectionId}`,
    subtext: `AI Generated description content...`,
  };
};

export function createGenerationActions(set: any, get: any) {
  return {

  // ✅ Bulk section initialization method from PageStore
  initializeSections: (sectionIds: string[], sectionLayouts: Record<string, string>) =>
    set((state: EditStore) => {
      logger.debug('🏗️ EditStore: START initializeSections:', {
        sectionIds,
        sectionLayouts,
        heroLayout: sectionLayouts.hero,
        layoutKeys: Object.keys(sectionLayouts),
        currentContentKeys: Object.keys(state.content || {}),
        timestamp: Date.now()
      });

      // Set sections array
      state.sections = [...sectionIds];
      logger.debug('✅ Sections array set:', state.sections);

      // Set section layouts
      state.sectionLayouts = { ...sectionLayouts };
      logger.debug('✅ Section layouts set:', state.sectionLayouts);
      
      // ✅ CRITICAL: Initialize content for ALL sections
      sectionIds.forEach(sectionId => {
        const layout = sectionLayouts[sectionId] || 'default';
        const themeColor = getSectionBackgroundType(sectionId, sectionIds, undefined, state.onboardingData as any);
        const backgroundType: BackgroundType = themeColor;
        
        logger.debug(`🔧 Processing section ${sectionId}:`, {
          availableLayout: sectionLayouts[sectionId],
          finalLayout: layout,
          isDefault: layout === 'default',
          backgroundType: backgroundType,
          themeColor: themeColor,
          hasOnboardingData: !!state.onboardingData,
          sectionCount: sectionIds.length
        });
        
        // Create content entry for each section
        logger.debug(`🔧 Creating content entry for section: ${sectionId}`);
        state.content[sectionId] = {
          id: sectionId,
          layout: layout,
          elements: {}, // Will be populated by AI
          backgroundType: backgroundType,
          aiMetadata: {
            lastGenerated: Date.now(),
            aiGenerated: false,
            isCustomized: false,
            aiGeneratedElements: []
          },
          editMetadata: {
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
          },
        };
        
        logger.debug(`✅ Section ${sectionId} initialized with layout: ${layout}, background: ${backgroundType}`);
      });
      
      state.persistence.isDirty = true;
      
      logger.debug('📊 Initialization complete:', {
        sectionsCount: state.sections.length,
        contentCount: Object.keys(state.content).length,
        layoutsCount: Object.keys(state.sectionLayouts).length,
        finalSections: state.sections,
        finalContentKeys: Object.keys(state.content),
        timestamp: Date.now()
      });
    }),

  // ✅ AI Response Processing from PageStore (adapted for EditStore structure)
  updateFromAIResponse: (aiResponse: any, elementsMap?: any) => {
    logger.debug('🔍 updateFromAIResponse RAW INPUT:', JSON.stringify(aiResponse, null, 2));

    // Debug logging for elementsMap
    logger.debug('📥 elementsMap received in updateFromAIResponse:', {
      hasElementsMap: !!elementsMap,
      sections: elementsMap ? Object.keys(elementsMap) : [],
      firstSectionExclusions: elementsMap && Object.keys(elementsMap)[0] ? {
        sectionId: Object.keys(elementsMap)[0],
        excludedElements: elementsMap[Object.keys(elementsMap)[0]]?.excludedElements || []
      } : null,
      totalExclusionsReceived: elementsMap ?
        Object.values(elementsMap).reduce((sum: number, section: any) =>
          sum + (section.excludedElements?.length || 0), 0) : 0
    });

    set((state: EditStore) => {
      logger.debug('🤖 EditStore: updateFromAIResponse called with:', {
        success: aiResponse.success,
        isPartial: aiResponse.isPartial,
        hasContent: !!aiResponse.content,
        contentType: typeof aiResponse.content,
        contentKeys: aiResponse.content ? Object.keys(aiResponse.content) : [],
        currentSections: state.sections,
        currentContent: Object.keys(state.content),
        fullAiResponse: aiResponse
      });

      // ✅ CRITICAL: Verify content store state BEFORE processing
      logger.debug('🔍 CONTENT STORE VERIFICATION:', {
        sectionsArray: state.sections,
        sectionsCount: state.sections.length,
        contentKeys: Object.keys(state.content),
        contentCount: Object.keys(state.content).length,
        sectionLayoutsKeys: Object.keys(state.sectionLayouts),
        detailedContentCheck: state.sections.map(sectionId => ({
          sectionId,
          existsInContent: !!state.content[sectionId],
          contentValue: state.content[sectionId] ? 'exists' : 'MISSING'
        })),
        timestamp: Date.now()
      });

      // Update AI generation status
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      state.aiGeneration.progress = 100;
      state.aiGeneration.status = aiResponse.success ? 'completed' : 'failed';
      state.aiGeneration.errors = aiResponse.errors || [];
      state.aiGeneration.warnings = aiResponse.warnings || [];

      // ✅ Get pre-selected sections that should already exist in the store
      const preSelectedSections = state.sections;
      logger.debug('🔒 Pre-selected sections from store:', preSelectedSections);
      
      // ✅ If no sections in store, this means sections weren't properly initialized
      if (preSelectedSections.length === 0) {
        logger.error('❌ CRITICAL: No sections found in store! Sections should be initialized before AI response.');
        state.aiGeneration.errors.push('No sections initialized in store before AI response');
        return;
      }

      const sectionsGenerated: string[] = [];
      const sectionsSkipped: string[] = [];

      // ✅ Process AI content only for pre-selected sections
      if (aiResponse.content && typeof aiResponse.content === 'object') {
        logger.debug('🎯 Processing AI response content:', {
          contentKeys: Object.keys(aiResponse.content),
          totalSections: Object.keys(aiResponse.content).length,
          fullRawContent: JSON.stringify(aiResponse.content, null, 2),
          sampleContent: Object.entries(aiResponse.content).slice(0, 2).map(([k, v]) => ({
            section: k,
            hasContent: !!v,
            contentType: typeof v,
            keys: v && typeof v === 'object' ? Object.keys(v) : [],
            rawValue: v
          }))
        });

        // ✅ CRITICAL: Pre-check if content store is completely empty (indicates initialization failure)
        const missingSections = preSelectedSections.filter(sectionId => !state.content[sectionId]);
        if (missingSections.length > 0) {
          logger.error('🚨 INITIALIZATION FAILURE DETECTED:', {
            missingSectionsCount: missingSections.length,
            totalExpectedSections: preSelectedSections.length,
            missingSections,
            availableContentKeys: Object.keys(state.content),
            isCompleteFailure: missingSections.length === preSelectedSections.length,
            timestamp: Date.now()
          });

          if (missingSections.length === preSelectedSections.length) {
            logger.error('💥 COMPLETE CONTENT STORE FAILURE: All sections missing! initializeSections was never called or state was completely reset.');

            // ✅ EMERGENCY RECOVERY: Reinitialize missing sections inline
            logger.debug('🚑 EMERGENCY RECOVERY: Reinitializing all missing sections...');

            // Ensure sections array is set if empty
            if (state.sections.length === 0) {
              state.sections = [...preSelectedSections];
              logger.debug('🚑 Emergency recovery: Set sections array:', state.sections);
            }
            preSelectedSections.forEach(sectionId => {
              if (!state.content[sectionId]) {
                const layout = state.sectionLayouts[sectionId] || 'default';
                const backgroundType = getSectionBackgroundType(sectionId, state.sections, undefined, state.onboardingData as any) as BackgroundType;

                logger.debug(`🛠️ Emergency creating section: ${sectionId} with layout: ${layout}`);
                state.content[sectionId] = {
                  id: sectionId,
                  layout: layout,
                  elements: {},
                  backgroundType: backgroundType,
                  aiMetadata: {
                    lastGenerated: Date.now(),
                    aiGenerated: false,
                    isCustomized: false,
                    aiGeneratedElements: []
                  },
                  editMetadata: {
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
                      lastValidated: Date.now()
                    }
                  }
                };
              }
            });

            logger.debug('🚑 Emergency recovery complete. Content keys now:', Object.keys(state.content));
          }
        }

        Object.entries(aiResponse.content).forEach(([sectionId, sectionData]: [string, any]) => {
          // ✅ Only process sections that were pre-selected by rules
          if (!preSelectedSections.includes(sectionId)) {
            logger.warn(`🚫 Ignoring section "${sectionId}" - not in pre-selected sections`);
            sectionsSkipped.push(sectionId);
            return;
          }

          if (!sectionData || typeof sectionData !== 'object') {
            logger.warn(`⚠️ Section ${sectionId} has invalid data format`);
            sectionsSkipped.push(sectionId);
            return;
          }

          logger.debug(`✅ Processing pre-selected section: ${sectionId}`);

          // ✅ Section should already exist in content, but verify
          if (!state.content[sectionId]) {
            logger.error(`❌ CRITICAL: Section ${sectionId} not found in content store!`, {
              sectionId,
              availableContentKeys: Object.keys(state.content),
              preSelectedSections,
              sectionLayouts: state.sectionLayouts,
              totalExpectedSections: preSelectedSections.length,
              timestamp: Date.now(),
              debugInfo: 'This indicates initializeSections was not called or state was reset'
            });

            // Create it as fallback with comprehensive logging
            logger.debug(`🛠️ Creating fallback content for missing section: ${sectionId}`);
            state.content[sectionId] = {
              id: sectionId,
              layout: state.sectionLayouts[sectionId] || 'default',
              elements: {},
              backgroundType: getSectionBackgroundType(sectionId, state.sections, undefined, state.onboardingData as any) as BackgroundType,
              aiMetadata: {
                lastGenerated: Date.now(),
                aiGenerated: false,
                isCustomized: false,
                aiGeneratedElements: []
              },
              editMetadata: {
                isSelected: false,
                isEditing: false,
                lastModified: Date.now(),
                lastModifiedBy: 'user',
                isDeletable: false,
                isMovable: true,
                isDuplicable: true,
                validationStatus: {
                  isValid: true,
                  errors: [],
                  warnings: [],
                  missingRequired: [],
                  lastValidated: Date.now(),
                },
                completionPercentage: 100,
              }
            };
          }

          // Get the section and update its content
          const section = state.content[sectionId]!;
          const generatedElements: string[] = [];

          // Update elements with AI-generated content
          logger.debug(`📝 Processing elements for section ${sectionId}:`, {
            elementKeys: Object.keys(sectionData),
            elementCount: Object.keys(sectionData).length,
            sectionDataType: typeof sectionData,
            rawSectionData: sectionData
          });
          
          Object.entries(sectionData).forEach(([elementKey, elementValue]: [string, any]) => {
            logger.debug(`🔍 Processing element: ${elementKey}`, {
              elementKey,
              elementValue,
              elementType: typeof elementValue,
              isUndefined: elementValue === undefined,
              isNull: elementValue === null,
              isEmpty: elementValue === '',
              elementLength: typeof elementValue === 'string' ? elementValue.length : 'N/A'
            });
            
            if (elementValue !== undefined && elementValue !== null) {
              section.elements[elementKey] = elementValue;
              generatedElements.push(elementKey);
              logger.debug(`  ✅ Added element: ${elementKey} = "${typeof elementValue === 'string' ? elementValue.substring(0, 50) + '...' : elementValue}"`);
            } else {
              logger.debug(`  ⚠️ Skipped null/undefined element: ${elementKey}`, {
                reason: elementValue === undefined ? 'undefined' : 'null',
                originalValue: elementValue
              });
            }
          });

          // ✅ ADDED: Store excluded elements from generation time for UI rendering
          let excludedElementsFromGeneration: string[] = [];
          if (elementsMap && elementsMap[sectionId]) {
            excludedElementsFromGeneration = elementsMap[sectionId].excludedElements || [];

            // ✅ CRITICAL FIX: Validate that exclusions are actually present
            if (excludedElementsFromGeneration.length === 0) {
              logger.warn(`⚠️ [GENERATION_EXCLUSIONS] Empty exclusions for ${sectionId}, checking for fallback data:`, {
                hasExcludedElements: !!elementsMap[sectionId].excludedElements,
                excludedElementsValue: elementsMap[sectionId].excludedElements,
                allElementsCount: elementsMap[sectionId].allElements?.length || 0,
                mandatoryCount: elementsMap[sectionId].mandatoryElements?.length || 0,
                optionalCount: elementsMap[sectionId].optionalElements?.length || 0,
                fullSectionMap: elementsMap[sectionId]
              });
            } else {
              logger.debug(`💾 [GENERATION_EXCLUSIONS] Storing ${excludedElementsFromGeneration.length} exclusions for ${sectionId}:`, {
                excludedCount: excludedElementsFromGeneration.length,
                excludedElements: excludedElementsFromGeneration,
                sourceLayout: elementsMap[sectionId].layout,
                sampleExclusions: excludedElementsFromGeneration.slice(0, 5)
              });
            }
          } else {
            logger.warn(`⚠️ [GENERATION_EXCLUSIONS] No elementsMap entry for ${sectionId}:`, {
              hasElementsMap: !!elementsMap,
              elementsMapKeys: elementsMap ? Object.keys(elementsMap) : [],
              sectionId: sectionId
            });
          }

          // Update section metadata
          section.aiMetadata = {
            lastGenerated: Date.now(),
            aiGenerated: true,
            isCustomized: false,
            aiGeneratedElements: generatedElements,
            excludedElements: excludedElementsFromGeneration  // ✅ ADDED: Store exclusions
          };

          // ✅ VALIDATION: Confirm exclusions were actually saved
          logger.debug(`✅ [EXCLUSIONS_SAVED] Section ${sectionId} metadata updated:`, {
            savedExclusionsCount: section.aiMetadata.excludedElements?.length || 0,
            savedExclusions: section.aiMetadata.excludedElements || [],
            aiGenerated: section.aiMetadata.aiGenerated
          });
          
          // Ensure background type is set
          if (!section.backgroundType) {
            section.backgroundType = getSectionBackgroundType(sectionId, state.sections, undefined, state.onboardingData as any) as BackgroundType;
          }

          logger.debug(`✅ Section ${sectionId} updated with ${generatedElements.length} elements`);
          sectionsGenerated.push(sectionId);
          
          // Debug: Verify the section content was actually updated
          logger.debug(`🔍 Verifying section ${sectionId} content:`, {
            hasContent: !!state.content[sectionId],
            elementCount: Object.keys(state.content[sectionId]?.elements || {}).length,
            elements: Object.keys(state.content[sectionId]?.elements || {})
          });
        });
      } else {
        logger.error('❌ No AI content received or content is not an object:', {
          hasContent: !!aiResponse.content,
          contentType: typeof aiResponse.content,
          aiResponse
        });
      }

      // ✅ Check if all pre-selected sections were processed
      const missingSections = preSelectedSections.filter(sectionId => !sectionsGenerated.includes(sectionId));
      
      if (missingSections.length > 0) {
        logger.warn('⚠️ Some pre-selected sections were not returned by AI:', missingSections);
        state.aiGeneration.warnings.push(`AI did not generate content for: ${missingSections.join(', ')}`);
      }

      // ✅ Final validation: Ensure content and layout are in sync
      const finalSectionCount = state.sections.length;
      const finalContentCount = Object.keys(state.content).length;
      
      if (finalSectionCount !== finalContentCount) {
        logger.error('❌ CRITICAL: Section/Content mismatch after AI response!', {
          sectionsInLayout: finalSectionCount,
          sectionsInContent: finalContentCount,
          layoutSections: [...state.sections], // Create a copy to avoid Proxy issues
          contentSections: Object.keys(state.content)
        });
        state.aiGeneration.errors.push(`Section/Content count mismatch: ${finalSectionCount} layout vs ${finalContentCount} content`);
      }

      logger.debug('📊 updateFromAIResponse Summary:', () => ({
        preSelectedSections: preSelectedSections.length,
        sectionsFromAI: Object.keys(aiResponse.content || {}).length,
        sectionsProcessed: sectionsGenerated.length,
        sectionsSkipped: sectionsSkipped.length,
        missingSections: missingSections.length,
        finalStoreSections: state.sections.length,
        finalContentSections: Object.keys(state.content).length,
        isSuccessful: sectionsGenerated.length > 0
      }));

      state.persistence.isDirty = true;
      
      // Final content check
      logger.debug('✅ Final store content state after AI update:', {
        sections: [...state.sections], // Create a copy to avoid Proxy issues
        contentKeys: Object.keys(state.content),
        sampleContent: Object.entries(state.content).map(([id, section]) => ({
          id,
          elementCount: Object.keys(section.elements || {}).length,
          elements: Object.keys(section.elements || {})
        }))
      });
    });
  },

  // ✅ AI Generation Status Management
  setAIGenerationStatus: (status: Partial<AIGenerationStatus>) => {
    set((state: EditStore) => {
      if (status.isGenerating !== undefined) state.aiGeneration.isGenerating = status.isGenerating;
      if (status.success !== undefined) state.aiGeneration.status = status.success ? 'completed' : 'failed';
      if (status.isPartial !== undefined) {
        // Handle isPartial flag
        if (status.isPartial) {
          state.aiGeneration.warnings.push('Generation was partial - some content may be missing');
        }
      }
      if (status.warnings) state.aiGeneration.warnings = status.warnings;
      if (status.errors) state.aiGeneration.errors = status.errors;
      if (status.sectionsGenerated) {
        // Mark sections as successfully generated
        status.sectionsGenerated.forEach(sectionId => {
          if (state.content[sectionId]?.aiMetadata) {
            state.content[sectionId]!.aiMetadata!.aiGenerated = true;
          }
        });
      }
      if (status.sectionsSkipped) {
        // Add warnings for skipped sections
        state.aiGeneration.warnings.push(`Sections skipped: ${status.sectionsSkipped.join(', ')}`);
      }
    });
  },

  // ✅ Clear AI Errors
  clearAIErrors: () => {
    set((state: EditStore) => {
      state.aiGeneration.warnings = [];
      state.aiGeneration.errors = [];
    });
  },

  // ✅ Regenerate All Content
  regenerateAllContent: async () => {
    const state = get();
    
    set((draft: EditStore) => { 
      draft.aiGeneration.isGenerating = true;
      draft.aiGeneration.currentOperation = 'page';
      draft.aiGeneration.progress = 0;
      draft.aiGeneration.status = 'Regenerating all content...';
    });

    try {
      const sections = state.sections;
      let completed = 0;
      
      await Promise.all(
        sections.map(async (sectionId: string) => {
          try {
            await state.regenerateSection(sectionId);
            completed++;
            
            set((draft: EditStore) => {
              draft.aiGeneration.progress = Math.round((completed / sections.length) * 100);
            });
          } catch (error) {
            logger.error(`Failed to regenerate section ${sectionId}:`, error);
            set((draft: EditStore) => {
              draft.aiGeneration.errors.push(`Failed to regenerate ${sectionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            });
          }
        })
      );
      
      set((draft: EditStore) => {
        draft.aiGeneration.isGenerating = false;
        draft.aiGeneration.currentOperation = null;
        draft.aiGeneration.progress = 100;
        draft.aiGeneration.status = completed === sections.length ? 'All content regenerated successfully' : 'Content regeneration completed with some errors';
      });
      
    } catch (error) {
      set((draft: EditStore) => {
        draft.aiGeneration.isGenerating = false;
        draft.aiGeneration.currentOperation = null;
        draft.aiGeneration.status = 'Failed to regenerate content';
        draft.aiGeneration.errors.push(error instanceof Error ? error.message : 'Unknown error during regeneration');
      });
    }
  },

  // ✅ Background System Integration from PageStore
  updateFromBackgroundSystem: (backgroundSystem: BackgroundSystem) =>
    set((state: EditStore) => {
      logger.debug('🔄 [STORE DEBUG] EditStore: BEFORE update:', {
        oldPrimary: state.theme.colors.sectionBackgrounds.primary,
        oldSecondary: state.theme.colors.sectionBackgrounds.secondary,
        oldBaseColor: state.theme.colors.baseColor
      });
      
      logger.debug('🔄 [STORE DEBUG] EditStore: Updating with new background system:', {
        newPrimary: backgroundSystem.primary,
        newSecondary: backgroundSystem.secondary,
        newBaseColor: backgroundSystem.baseColor,
        newAccentColor: backgroundSystem.accentColor
      });
      
      state.theme.colors.baseColor = backgroundSystem.baseColor;
      state.theme.colors.accentColor = backgroundSystem.accentColor;
      state.theme.colors.accentCSS = backgroundSystem.accentCSS;
      
      state.theme.colors.sectionBackgrounds.primary = backgroundSystem.primary;
      state.theme.colors.sectionBackgrounds.secondary = backgroundSystem.secondary;
      state.theme.colors.sectionBackgrounds.neutral = backgroundSystem.neutral;
      state.theme.colors.sectionBackgrounds.divider = backgroundSystem.divider;
      
      state.persistence.isDirty = true;
      
      logger.debug('✅ [STORE DEBUG] EditStore: AFTER update:', {
        actualPrimary: state.theme.colors.sectionBackgrounds.primary,
        actualSecondary: state.theme.colors.sectionBackgrounds.secondary,
        actualBaseColor: state.theme.colors.baseColor,
        isDirty: state.persistence.isDirty
      });
    }),

  // ✅ Font System Integration from PageStore
  updateFontsFromTone: () => {
    try {
      const fontTheme = pickFontFromOnboarding();
      set((state: EditStore) => {
        state.theme.typography.headingFont = fontTheme.headingFont;
        state.theme.typography.bodyFont = fontTheme.bodyFont;
        state.persistence.isDirty = true;
      });
    } catch (error) {
      logger.error('Failed to update fonts from tone:', error);
      set((state: EditStore) => {
        state.errors['fontUpdate'] = 'Failed to update fonts from tone';
      });
    }
  },

  // ✅ Custom Fonts Setter
  setCustomFonts: (headingFont: string, bodyFont: string) =>
    set((state: EditStore) => {
      state.theme.typography.headingFont = headingFont;
      state.theme.typography.bodyFont = bodyFont;
      state.persistence.isDirty = true;
    }),

  // ✅ Color Token Generation from PageStore
  getColorTokens: () => {
    const { theme } = get();
    
    const hasCompleteBackgroundSystem = 
      theme.colors.sectionBackgrounds.primary && 
      theme.colors.sectionBackgrounds.secondary;

    if (hasCompleteBackgroundSystem && theme.colors.accentCSS) {
      const backgroundSystemData: BackgroundSystem = {
        primary: theme.colors.sectionBackgrounds.primary!,
        secondary: theme.colors.sectionBackgrounds.secondary!,
        neutral: theme.colors.sectionBackgrounds.neutral || 'bg-white',
        divider: theme.colors.sectionBackgrounds.divider || 'bg-gray-100/50',
        baseColor: theme.colors.baseColor,
        accentColor: theme.colors.accentColor,
        accentCSS: theme.colors.accentCSS
      };

      logger.debug('🎨 EditStore: Using integrated background system for color tokens:', backgroundSystemData);
      return generateColorTokensFromBackgroundSystem(backgroundSystemData);
    } else {
      logger.warn('EditStore: Using fallback color token generation - background system not fully integrated');
      return generateColorTokens({
        baseColor: theme.colors.baseColor,
        accentColor: theme.colors.accentColor,
        accentCSS: theme.colors.accentCSS,
        sectionBackgrounds: theme.colors.sectionBackgrounds
      });
    }
  },

  };
}