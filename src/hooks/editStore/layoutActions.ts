// hooks/editStore/layoutActions.ts - Layout and theme management actions
import { generateColorTokens, generateColorTokensFromBackgroundSystem } from '@/modules/Design/ColorSystem/colorTokens';
import type { BackgroundSystem } from '@/modules/Design/ColorSystem/colorTokens';
import type { Theme, ColorTokens } from '@/types/core/index';
// ✅ CORRECT
import type { EditStore, EditHistoryEntry } from '@/types/store';
import type { LayoutActions } from '@/types/store';
import { pickFontFromOnboarding } from '@/modules/Design/fontSystem/pickFont';
import type { FontTheme, TypographyState } from '@/types/core/index';

/**
 * ===== UTILITY FUNCTIONS =====
 */

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Infer element type from element key
const inferElementType = (elementKey: string) => {
  if (elementKey.includes('headline')) return 'headline';
  if (elementKey.includes('subheadline')) return 'subheadline';
  if (elementKey.includes('cta')) return 'button';
  if (elementKey.includes('image')) return 'image';
  if (elementKey.includes('video')) return 'video';
  if (elementKey.includes('form')) return 'form';
  if (elementKey.includes('list') || elementKey.includes('items')) return 'list';
  if (elementKey.includes('rich') || elementKey.includes('html')) return 'richtext';
  return 'text';
};

/**
 * ===== BACKGROUND SYSTEM GENERATION =====
 */

// Mock function - will be replaced with actual rule-based engine integration
const generateCompleteBackgroundSystem = (onboardingData: any): BackgroundSystem => {
  // This is a placeholder that generates a basic background system
  // In production, this would use the sophisticated rule-based engine
  
  const baseColors = ['blue', 'purple', 'green', 'orange', 'red', 'teal'];
  const baseColor = baseColors[Math.floor(Math.random() * baseColors.length)];
  
  return {
    primary: `bg-gradient-to-r from-${baseColor}-500 to-${baseColor}-600`,
    secondary: `bg-${baseColor}-50`,
    neutral: 'bg-white',
    divider: 'bg-gray-100/50',
    baseColor,
    accentColor: baseColor,
    accentCSS: `bg-${baseColor}-600`
  };
};

/**
 * ===== LAYOUT ACTIONS CREATOR =====
 */
export function createLayoutActions(set: any, get: any): LayoutActions {
  return {
    /**
     * ===== SECTION MANAGEMENT =====
     */
    
    addSection: (sectionType: string, position?: number) => {
      const sectionId = `${sectionType}-${Date.now()}`;
      set((state: EditStore) => {
        const insertPos = position ?? state.sections.length;
        state.sections.splice(insertPos, 0, sectionId);
        state.sectionLayouts[sectionId] = 'default';
        
        // Create section data
        state.content[sectionId] = {
          id: sectionId,
          layout: 'default',
          elements: {},
          aiMetadata: {
            aiGenerated: false,
            isCustomized: false,
            aiGeneratedElements: [],
          },
          editMetadata: {
            isSelected: false,
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
            completionPercentage: 0,
          },
        };
        
        state.persistence.isDirty = true;
        
        // Add to history
        state.history.undoStack.push({
          type: 'section',
          description: `Added ${sectionType} section`,
          timestamp: Date.now(),
          beforeState: null,
          afterState: { sectionId, sectionType },
          sectionId,
        });
        
        // Clear redo stack
        state.history.redoStack = [];
      });
      return sectionId;
    },
    
    removeSection: (sectionId: string) =>
      set((state: EditStore) => {
        const sectionIndex = state.sections.indexOf(sectionId);
        if (sectionIndex === -1) return;
        
        // Store section data for undo
        const sectionData = state.content[sectionId];
        
        // Remove section
        state.sections.splice(sectionIndex, 1);
        delete state.sectionLayouts[sectionId];
        delete state.content[sectionId];
        
        // Clean up UI state
        if (state.selectedSection === sectionId) {
          state.selectedSection = undefined;
        }
        delete state.loadingStates[sectionId];
        delete state.errors[sectionId];
        
        state.persistence.isDirty = true;
        
        // Add to history
        state.history.undoStack.push({
          type: 'section',
          description: `Removed section`,
          timestamp: Date.now(),
          beforeState: { sectionId, sectionData, sectionIndex },
          afterState: null,
          sectionId,
        });
        
        state.history.redoStack = [];
      }),
    
    reorderSections: (newOrder: string[]) =>
      set((state: EditStore) => {
        const oldOrder = [...state.sections];
        state.sections = newOrder;
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'layout',
          description: 'Reordered sections',
          timestamp: Date.now(),
          beforeState: { sections: oldOrder },
          afterState: { sections: newOrder },
        });
        
        state.history.redoStack = [];
      }),
    
    duplicateSection: (sectionId: string) => {
      const newId = `${sectionId}-copy-${Date.now()}`;
      set((state: EditStore) => {
        const originalSection = state.content[sectionId];
        if (!originalSection) return;
        
        const index = state.sections.findIndex(id => id === sectionId);
        state.sections.splice(index + 1, 0, newId);
        state.sectionLayouts[newId] = state.sectionLayouts[sectionId];
        
        // Deep clone section data
        state.content[newId] = {
          ...originalSection,
          id: newId,
          aiMetadata: {
            ...originalSection.aiMetadata,
            lastGenerated: Date.now(),
          },
          editMetadata: {
            ...originalSection.editMetadata,
            isSelected: false,
            isEditing: false,
          },
        };
        
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'section',
          description: 'Duplicated section',
          timestamp: Date.now(),
          beforeState: null,
          afterState: { sectionId: newId },
          sectionId: newId,
        });
        
        state.history.redoStack = [];
      });
      return newId;
    },
    
    setLayout: (sectionId: string, layout: string) =>
      set((state: EditStore) => {
        const oldLayout = state.sectionLayouts[sectionId];
        state.sectionLayouts[sectionId] = layout;
        
        if (state.content[sectionId]) {
          state.content[sectionId].layout = layout;
        }
        
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'layout',
          description: `Changed section layout to ${layout}`,
          timestamp: Date.now(),
          beforeState: { sectionId, layout: oldLayout },
          afterState: { sectionId, layout },
          sectionId,
        });
        
        state.history.redoStack = [];
      }),
    
    setSectionLayouts: (layouts: Record<string, string>) =>
      set((state: EditStore) => {
        const oldLayouts = { ...state.sectionLayouts };
        Object.assign(state.sectionLayouts, layouts);
        
        // Update section layout properties
        Object.entries(layouts).forEach(([sectionId, layout]) => {
          if (state.content[sectionId]) {
            state.content[sectionId].layout = layout;
          }
        });
        
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'layout',
          description: 'Updated multiple section layouts',
          timestamp: Date.now(),
          beforeState: { layouts: oldLayouts },
          afterState: { layouts },
        });
        
        state.history.redoStack = [];
      }),

      // Enhanced updateSectionLayout with proper integration
updateSectionLayout: (sectionId: string, newLayout: string) =>
  set((state: EditStore) => {
    const oldLayout = state.sectionLayouts[sectionId];
    
    if (oldLayout !== newLayout) {
      state.sectionLayouts[sectionId] = newLayout;
      
      // Update section content layout property
      if (state.content[sectionId]) {
        state.content[sectionId].layout = newLayout;
      }
      
      // Track change
      state.queuedChanges.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'layout',
        sectionId,
        oldValue: oldLayout,
        newValue: newLayout,
        timestamp: Date.now(),
        source: 'user',
      });
      
      state.persistence.isDirty = true;
      state.lastUpdated = Date.now();
      
      // Add to history
      state.history.undoStack.push({
        type: 'layout',
        description: `Changed section layout to ${newLayout}`,
        timestamp: Date.now(),
        beforeState: { sectionId, layout: oldLayout },
        afterState: { sectionId, layout: newLayout },
        sectionId,
      });
      
      state.history.redoStack = [];
    }
  }),

// Enhanced moveSection for toolbar integration
moveSection: (sectionId: string, direction: 'up' | 'down') =>
  set((state: EditStore) => {
    const currentIndex = state.sections.indexOf(sectionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < state.sections.length) {
      const newSections = [...state.sections];
      [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];
      
      // Update sections
      state.sections = newSections;
      
      // Track change
      state.queuedChanges.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'layout',
        oldValue: { sections: [...state.sections] },
        newValue: { sections: newSections },
        timestamp: Date.now(),
        source: 'user',
      });
      
      state.persistence.isDirty = true;
      state.lastUpdated = Date.now();
      
      // Add to history
      state.history.undoStack.push({
        type: 'layout',
        description: `Moved section ${direction}`,
        timestamp: Date.now(),
        beforeState: { sections: [...state.sections] },
        afterState: { sections: newSections },
      });
      
      state.history.redoStack = [];
    }
  }),

    /**
     * ===== THEME MANAGEMENT =====
     */
    
    updateTheme: (theme: Partial<Theme>) =>
      set((state: EditStore) => {
        const oldTheme = { ...state.theme };
        Object.assign(state.theme, theme);
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'theme',
          description: 'Updated theme',
          timestamp: Date.now(),
          beforeState: { theme: oldTheme },
          afterState: { theme: state.theme },
        });
        
        state.history.redoStack = [];
      }),
    
    updateBaseColor: (baseColor: string) =>
      set((state: EditStore) => {
        const oldBaseColor = state.theme.colors.baseColor;
        state.theme.colors.baseColor = baseColor;
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'theme',
          description: `Changed base color to ${baseColor}`,
          timestamp: Date.now(),
          beforeState: { baseColor: oldBaseColor },
          afterState: { baseColor },
        });
        
        state.history.redoStack = [];
      }),

    updateAccentColor: (accentColor: string) =>
      set((state: EditStore) => {
        const oldAccentColor = state.theme.colors.accentColor;
        state.theme.colors.accentColor = accentColor;
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'theme',
          description: `Changed accent color to ${accentColor}`,
          timestamp: Date.now(),
          beforeState: { accentColor: oldAccentColor },
          afterState: { accentColor },
        });
        
        state.history.redoStack = [];
      }),
    
    updateSectionBackground: (type: keyof Theme['colors']['sectionBackgrounds'], value: string) =>
      set((state: EditStore) => {
        const oldValue = state.theme.colors.sectionBackgrounds[type];
        state.theme.colors.sectionBackgrounds[type] = value;
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'theme',
          description: `Updated ${type} background`,
          timestamp: Date.now(),
          beforeState: { type, value: oldValue },
          afterState: { type, value },
        });
        
        state.history.redoStack = [];
      }),
    
    updateFromBackgroundSystem: (backgroundSystem: BackgroundSystem) =>
      set((state: EditStore) => {
        const oldTheme = { ...state.theme };
        
        // Update all color-related theme properties
        state.theme.colors.baseColor = backgroundSystem.baseColor;
        state.theme.colors.accentColor = backgroundSystem.accentColor;
        state.theme.colors.accentCSS = backgroundSystem.accentCSS;
        
        // Update section backgrounds
        state.theme.colors.sectionBackgrounds.primary = backgroundSystem.primary;
        state.theme.colors.sectionBackgrounds.secondary = backgroundSystem.secondary;
        state.theme.colors.sectionBackgrounds.neutral = backgroundSystem.neutral;
        state.theme.colors.sectionBackgrounds.divider = backgroundSystem.divider;
        
        // ✅ CLEAR CUSTOM SECTION BACKGROUND OVERRIDES
        // When global background changes, reset all sections to use the new global theme
        Object.keys(state.content).forEach(sectionId => {
          const section = state.content[sectionId];
          if (section && section.backgroundType && section.backgroundType !== 'primary' && section.backgroundType !== 'secondary' && section.backgroundType !== 'neutral' && section.backgroundType !== 'divider') {
            // Reset custom colors back to theme-based backgrounds
            const sectionType = sectionId.toLowerCase();
            if (sectionType.includes('hero') || sectionType.includes('cta')) {
              section.backgroundType = 'primary';
            } else if (sectionType.includes('faq')) {
              section.backgroundType = 'divider';
            } else {
              section.backgroundType = 'secondary';
            }
            // Clear custom background data
            if (section.sectionBackground) {
              delete section.sectionBackground;
            }
          }
        });
        
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'theme',
          description: 'Updated from background system',
          timestamp: Date.now(),
          beforeState: { theme: oldTheme },
          afterState: { theme: state.theme },
        });
        
        state.history.redoStack = [];
      }),
    
    updateTypography: (typography: Partial<Theme['typography']>) =>
      set((state: EditStore) => {
        const oldTypography = { ...state.theme.typography };
        Object.assign(state.theme.typography, typography);
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'theme',
          description: 'Updated typography',
          timestamp: Date.now(),
          beforeState: { typography: oldTypography },
          afterState: { typography: state.theme.typography },
        });
        
        state.history.redoStack = [];
      }),

      /**
 * ===== BACKGROUND MANAGEMENT =====
 */


      /**
 * ===== TYPOGRAPHY MANAGEMENT =====
 */

updateTypographyTheme: (newTheme: FontTheme) =>
  set((state: EditStore) => {
    const oldTypography = { ...state.theme.typography };
    
    // Update theme typography
    state.theme.typography.headingFont = newTheme.headingFont;
    state.theme.typography.bodyFont = newTheme.bodyFont;
    
    state.persistence.isDirty = true;
    
    // Add to history
    state.history.undoStack.push({
      type: 'theme',
      description: 'Updated typography theme',
      timestamp: Date.now(),
      beforeState: { typography: oldTypography },
      afterState: { typography: state.theme.typography },
    });
    
    state.history.redoStack = [];
  }),

resetTypographyToGenerated: () =>
  set((state: EditStore) => {
    const oldTypography = { ...state.theme.typography };
    
    // Generate original typography from onboarding data
    const originalFont = pickFontFromOnboarding();
    
    state.theme.typography.headingFont = originalFont.headingFont;
    state.theme.typography.bodyFont = originalFont.bodyFont;
    
    state.persistence.isDirty = true;
    
    // Add to history
    state.history.undoStack.push({
      type: 'theme',
      description: 'Reset typography to generated',
      timestamp: Date.now(),
      beforeState: { typography: oldTypography },
      afterState: { typography: state.theme.typography },
    });
    
    state.history.redoStack = [];
    
    // console.log('🔄 Reset typography to LessGo-generated fonts', {
    //   originalFont,
    //   headingFont: originalFont.headingFont,
    //   bodyFont: originalFont.bodyFont,
    // });
  }),

getTypographyForSection: (sectionId: string) => {
  const state = get();
  
  // Check for section-level customizations first
  // For now, return global typography (section customizations can be added later)
  return {
    toneId: state.onboardingData?.hiddenInferredFields?.toneProfile || 'minimal-technical',
    headingFont: state.theme.typography.headingFont,
    bodyFont: state.theme.typography.bodyFont,
  } as FontTheme;
},

    /**
     * ===== RESET TO GENERATED =====
     */
    
    resetToGenerated: () =>
      set((state: EditStore) => {
        // Store current state for undo
        const currentState = {
          theme: { ...state.theme },
          sections: [...state.sections],
          sectionLayouts: { ...state.sectionLayouts },
          content: { ...state.content },
        };
        
        // Generate original background system from onboarding data
        const originalBackgroundSystem = generateCompleteBackgroundSystem(state.onboardingData);
        
        // Reset theme to original AI-generated state
        state.theme.colors.baseColor = originalBackgroundSystem.baseColor;
        state.theme.colors.accentColor = originalBackgroundSystem.accentColor;
        state.theme.colors.accentCSS = originalBackgroundSystem.accentCSS;
        
        // Reset section backgrounds
        state.theme.colors.sectionBackgrounds.primary = originalBackgroundSystem.primary;
        state.theme.colors.sectionBackgrounds.secondary = originalBackgroundSystem.secondary;
        state.theme.colors.sectionBackgrounds.neutral = originalBackgroundSystem.neutral;
        state.theme.colors.sectionBackgrounds.divider = originalBackgroundSystem.divider;
        
        // Reset typography to default (if we had original typography, we'd use that)
        // For now, keeping current typography since we don't have original typography stored
        
        // Mark sections as AI-generated again
        Object.values(state.content).forEach(section => {
          if (section.aiMetadata) {
            section.aiMetadata.isCustomized = false;
            section.aiMetadata.aiGenerated = true;
            section.aiMetadata.lastGenerated = Date.now();
          }
        });
        
        state.persistence.isDirty = true;
        
        // Add to history - using 'theme' type since it's primarily a theme reset
        state.history.undoStack.push({
          type: 'theme',
          description: 'Reset to LessGo-generated design',
          timestamp: Date.now(),
          beforeState: currentState,
          afterState: {
            theme: { ...state.theme },
            backgroundSystem: originalBackgroundSystem,
          },
        });
        
        state.history.redoStack = [];
        
        // console.log('🔄 Reset to original LessGo-generated design', {
        //   originalBackgroundSystem,
        //   sectionsReset: Object.keys(state.content).length,
        // });
      }),

    /**
     * ===== GLOBAL SETTINGS =====
     */
    
    setDeviceMode: (mode: 'desktop' | 'mobile') =>
      set((state: EditStore) => {
        state.globalSettings.deviceMode = mode;
      }),
    
    setZoomLevel: (level: number) =>
      set((state: EditStore) => {
        state.globalSettings.zoomLevel = Math.max(25, Math.min(200, level));
      }),

    /**
     * ===== COLOR TOKENS INTEGRATION =====
     */
    
    getColorTokens: () => {
      const { theme } = get();
      
      console.log('🎨 [TOKENS-DEBUG] getColorTokens called with theme:', {
        baseColor: theme.colors.baseColor,
        accentColor: theme.colors.accentColor,
        accentCSS: theme.colors.accentCSS,
        sectionBackgrounds: theme.colors.sectionBackgrounds,
        typography: {
          headingFont: theme.typography.headingFont,
          bodyFont: theme.typography.bodyFont
        }
      });
      
      // Check if we have a complete background system
      const hasCompleteBackgroundSystem = 
        theme.colors.sectionBackgrounds.primary && 
        theme.colors.sectionBackgrounds.secondary;

      console.log('🎨 [TOKENS-DEBUG] Background system completeness check:', {
        hasCompleteBackgroundSystem,
        hasPrimary: !!theme.colors.sectionBackgrounds.primary,
        hasSecondary: !!theme.colors.sectionBackgrounds.secondary,
        hasAccentCSS: !!theme.colors.accentCSS
      });

      if (hasCompleteBackgroundSystem && theme.colors.accentCSS) {
        // Properly construct the BackgroundSystem object
        const backgroundSystemData: BackgroundSystem = {
          primary: theme.colors.sectionBackgrounds.primary!,
          secondary: theme.colors.sectionBackgrounds.secondary!,
          neutral: theme.colors.sectionBackgrounds.neutral || 'bg-white',
          divider: theme.colors.sectionBackgrounds.divider || 'bg-gray-100/50',
          baseColor: theme.colors.baseColor,
          accentColor: theme.colors.accentColor,
          accentCSS: theme.colors.accentCSS
        };

        console.log('🎨 [TOKENS-DEBUG] Using integrated background system for color tokens:', backgroundSystemData);
        const tokens = generateColorTokensFromBackgroundSystem(backgroundSystemData);
        console.log('🎨 [TOKENS-DEBUG] Generated integrated tokens:', tokens);
        return tokens;
      } else {
        // Fallback to basic generation
        console.warn('🎨 [TOKENS-DEBUG] Using fallback color token generation - background system not fully integrated');
        const fallbackInput = {
          baseColor: theme.colors.baseColor,
          accentColor: theme.colors.accentColor,
          accentCSS: theme.colors.accentCSS,
          sectionBackgrounds: theme.colors.sectionBackgrounds
        };
        console.log('🎨 [TOKENS-DEBUG] Fallback input:', fallbackInput);
        const tokens = generateColorTokens(fallbackInput);
        console.log('🎨 [TOKENS-DEBUG] Generated fallback tokens:', tokens);
        return tokens;
      }
    },

    updateColorTokens: (newTokens: ColorTokens) =>
      set((state: EditStore) => {
        // Update the theme with the new color tokens
        // This method would integrate the color tokens back into the theme structure
        // For now, we'll add a placeholder that developers can extend
        // console.log('🎨 Updating color tokens:', newTokens);
        
        // Track the change for auto-save
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'theme',
          oldValue: state.theme.colors,
          newValue: newTokens,
          timestamp: Date.now(),
          source: 'user',
        });
        
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    initializeSections: (sectionIds: string[], sectionLayouts: Record<string, string>) =>
      set((state: EditStore) => {
        state.sections = sectionIds;
        state.sectionLayouts = sectionLayouts;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),
  };
}