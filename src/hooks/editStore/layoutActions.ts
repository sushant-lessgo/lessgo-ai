// hooks/editStore/layoutActions.ts - Layout and theme management actions
import { generateColorTokens, generateColorTokensFromBackgroundSystem } from '@/modules/Design/ColorSystem/colorTokens';
import type { BackgroundSystem } from '@/modules/Design/ColorSystem/colorTokens';
import type { Theme, ColorTokens } from '@/types/core/index';
// ✅ CORRECT
import type { EditStore, EditHistoryEntry } from '@/types/store';
import type { LayoutActions } from '@/types/store';
import { pickFontFromOnboarding } from '@/modules/Design/fontSystem/pickFont';
import type { FontTheme, TypographyState } from '@/types/core/index';

import { logger } from '@/lib/logger';
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
        
        // Enhanced debug logging for layoutActions.addSection
        logger.debug('➕ LayoutActions adding section:', {
          sectionType,
          requestedPosition: position,
          insertPos,
          sectionId,
          beforeSections: [...state.sections],
          sectionsLength: state.sections.length,
          willInsertAt: `position ${insertPos} (${insertPos === state.sections.length ? 'end' : 'middle'})`
        });
        
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
        
        // Final success logging
        logger.debug('✅ LayoutActions section added successfully:', {
          sectionId,
          finalPosition: state.sections.indexOf(sectionId),
          afterSections: [...state.sections],
          sectionsLength: state.sections.length,
          layoutSet: state.sectionLayouts[sectionId],
          contentCreated: !!state.content[sectionId]
        });
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
    
    updateTheme: (theme: Partial<Theme>) => {
      set((state: EditStore) => {
        const oldTheme = { ...state.theme };
        
        // Deep merge for nested properties like colors
        if (theme.colors) {
          state.theme.colors = {
            ...state.theme.colors,
            ...theme.colors,
            // Deep merge sectionBackgrounds if provided
            sectionBackgrounds: theme.colors.sectionBackgrounds ? {
              ...state.theme.colors.sectionBackgrounds,
              ...theme.colors.sectionBackgrounds
            } : state.theme.colors.sectionBackgrounds,
            // Preserve textColors unless explicitly updated
            textColors: theme.colors.textColors || state.theme.colors.textColors
          };
          // Remove colors from theme object to avoid overwriting
          const { colors, ...otherThemeUpdates } = theme;
          Object.assign(state.theme, otherThemeUpdates);
        } else {
          Object.assign(state.theme, theme);
        }
        
        state.persistence.isDirty = true;
        
        state.history.undoStack.push({
          type: 'theme',
          description: 'Updated theme',
          timestamp: Date.now(),
          beforeState: { theme: oldTheme },
          afterState: { theme: state.theme },
        });
        
        state.history.redoStack = [];
      });
      
      // If background colors changed, recalculate text colors
      if (theme.colors?.sectionBackgrounds) {
        const { recalculateTextColors } = get();
        recalculateTextColors();
      }
    },
    
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
          if (section && section.backgroundType === 'custom') {
            // Reset custom backgrounds back to theme-based backgrounds
            section.backgroundType = 'theme';
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
     * ===== LOGO MANAGEMENT =====
     */
    
    setLogoUrl: (url: string) =>
      set((state: EditStore) => {
        state.globalSettings.logoUrl = url;
      }),
    
    clearLogo: () =>
      set((state: EditStore) => {
        state.globalSettings.logoUrl = undefined;
      }),

    /**
     * ===== COLOR TOKENS INTEGRATION =====
     */
    
    getColorTokens: (() => {
      let cache: any = null;
      let cacheKey = '';
      
      return () => {
        const { theme } = get();
        
        // Create cache key from essential theme properties
        const newCacheKey = `${theme.colors.baseColor}-${theme.colors.accentColor}-${theme.colors.accentCSS}`;
        
        // Return cached result if key hasn't changed
        if (cache && cacheKey === newCacheKey) {
          return cache;
        }
        
        // console.log('🎨 [TOKENS-DEBUG] getColorTokens called with theme:', {
        //   baseColor: theme.colors.baseColor,
        //   accentColor: theme.colors.accentColor,
        //   accentCSS: theme.colors.accentCSS,
        //   cacheKey: newCacheKey
        // });
      
      // Check if we have a complete background system
      const hasCompleteBackgroundSystem = 
        theme.colors.sectionBackgrounds.primary && 
        theme.colors.sectionBackgrounds.secondary;

      // console.log('🎨 [TOKENS-DEBUG] Background system completeness check:', {
      //   hasCompleteBackgroundSystem,
      //   hasPrimary: !!theme.colors.sectionBackgrounds.primary,
      //   hasSecondary: !!theme.colors.sectionBackgrounds.secondary,
      //   hasAccentCSS: !!theme.colors.accentCSS
      // }); // Disabled to prevent log spam

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

        // console.log('🎨 [TOKENS-DEBUG] Using integrated background system for color tokens:', backgroundSystemData); // Disabled
        
        // Pass stored text colors to avoid recalculation
        const tokens = generateColorTokens({
          baseColor: backgroundSystemData.baseColor,
          accentColor: backgroundSystemData.accentColor,
          accentCSS: backgroundSystemData.accentCSS,
          sectionBackgrounds: {
            primary: backgroundSystemData.primary,
            secondary: backgroundSystemData.secondary,
            neutral: backgroundSystemData.neutral,
            divider: backgroundSystemData.divider
          },
          storedTextColors: theme.colors.textColors // Use stored text colors
        });
        
        // console.log('🎨 [TOKENS-DEBUG] Generated integrated tokens with stored text colors:', tokens); // Disabled
        
        // Cache the result
        cache = tokens;
        cacheKey = newCacheKey;
        return tokens;
      } else {
        // Fallback to basic generation
        logger.warn('🎨 [TOKENS-DEBUG] Using fallback color token generation - background system not fully integrated');
        const fallbackInput = {
          baseColor: theme.colors.baseColor,
          accentColor: theme.colors.accentColor,
          accentCSS: theme.colors.accentCSS,
          sectionBackgrounds: theme.colors.sectionBackgrounds,
          storedTextColors: theme.colors.textColors // Use stored text colors even in fallback
        };
        // console.log('🎨 [TOKENS-DEBUG] Fallback input:', fallbackInput);
        const tokens = generateColorTokens(fallbackInput);
        // console.log('🎨 [TOKENS-DEBUG] Generated fallback tokens:', tokens);
        
        // Cache the result
        cache = tokens;
        cacheKey = newCacheKey;
        return tokens;
      }
      };
    })(),

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

    // ✅ NEW: Update stored text colors when backgrounds change
    recalculateTextColors: () => {
      const { theme } = get();
      const { getSmartTextColor } = require('@/utils/improvedTextColors');
      
      const calculateForBackground = (bg: string) => ({
        heading: getSmartTextColor(bg, 'heading'),
        body: getSmartTextColor(bg, 'body'),
        muted: getSmartTextColor(bg, 'muted')
      });
      
      const newTextColors = {
        primary: calculateForBackground(theme.colors.sectionBackgrounds.primary || 'bg-gradient-to-br from-blue-500 to-blue-600'),
        secondary: calculateForBackground(theme.colors.sectionBackgrounds.secondary || 'bg-gray-50'),
        neutral: calculateForBackground(theme.colors.sectionBackgrounds.neutral || 'bg-white'),
        divider: calculateForBackground(theme.colors.sectionBackgrounds.divider || 'bg-gray-100/50'),
      };
      
      set((state: EditStore) => {
        state.theme.colors.textColors = newTextColors;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      });
      
      logger.debug('🎨 [EDIT-DEBUG] Recalculated text colors:', newTextColors);
    },

    initializeSections: (sectionIds: string[], sectionLayouts: Record<string, string>) =>
      set((state: EditStore) => {
        state.sections = sectionIds;
        state.sectionLayouts = sectionLayouts;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    /**
     * ===== NAVIGATION MANAGEMENT =====
     */
    
    initializeNavigation: () => {
      logger.debug('🧭 [NAV-DEBUG] initializeNavigation action called');
      
      const { initializeNavigation } = require('@/utils/sectionScanner');
      const state = get();
      logger.debug('🧭 [NAV-DEBUG] Current store state:', {
        hasSections: !!state.sections,
        sectionsLength: state.sections?.length || 0,
        hasNavigationConfig: !!state.navigationConfig
      });
      
      if (state.navigationConfig) {
        logger.debug('🧭 [NAV-DEBUG] Navigation already configured, skipping');
        return;
      }
      
      const navItems = initializeNavigation(state);
      
      set((state: EditStore) => {
        logger.debug('🧭 [NAV-DEBUG] Setting navigation config in store');
        
        // Find header section to determine max items
        const headerSection = state.sections.find(id => id.includes('header'));
        const headerLayout = headerSection ? state.sectionLayouts[headerSection] || 'MinimalNavHeader' : 'MinimalNavHeader';
        const { getMaxNavItemsForHeader } = require('@/utils/sectionScanner');
        const maxItems = getMaxNavItemsForHeader(headerLayout);
        
        logger.debug('🧭 [NAV-DEBUG] Creating navigation config:', {
          navItemsCount: navItems.length,
          maxItems,
          headerSection,
          headerLayout
        });
        
        state.navigationConfig = {
          items: navItems,
          autoConfigured: true,
          maxItems,
          lastUpdated: Date.now(),
        };
        
        state.persistence.isDirty = true;
        
        logger.debug('🧭 [NAV-DEBUG] Navigation config set:', state.navigationConfig);
      });
    },

    updateNavItem: (itemId: string, updates: Partial<{ label: string; link: string; sectionId?: string }>) =>
      set((state: EditStore) => {
        if (!state.navigationConfig) return;
        
        const itemIndex = state.navigationConfig.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const oldItem = { ...state.navigationConfig.items[itemIndex] };
        
        // Create new item object with updates
        const updatedItem = { ...oldItem };
        if (updates.label !== undefined) updatedItem.label = updates.label;
        if (updates.link !== undefined) updatedItem.link = updates.link;
        if (updates.sectionId !== undefined) updatedItem.sectionId = updates.sectionId;
        
        // Mark as user-modified if it was auto-generated
        if (updatedItem.isAutoGenerated && (updates.label || updates.link)) {
          updatedItem.isAutoGenerated = false;
        }
        
        // Create new items array with updated item
        state.navigationConfig.items = [
          ...state.navigationConfig.items.slice(0, itemIndex),
          updatedItem,
          ...state.navigationConfig.items.slice(itemIndex + 1)
        ];
        
        state.navigationConfig.lastUpdated = Date.now();
        state.persistence.isDirty = true;
        
        logger.debug('🧭 [STORE-DEBUG] Navigation item updated:', {
          itemId,
          updates,
          oldItem,
          newItem: updatedItem,
          totalItems: state.navigationConfig.items.length,
          timestamp: state.navigationConfig.lastUpdated
        });
        
        // Add to history
        state.history.undoStack.push({
          type: 'layout',
          description: 'Updated navigation item',
          timestamp: Date.now(),
          beforeState: { navItem: oldItem },
          afterState: { navItem: { ...updatedItem } },
        });
        
        state.history.redoStack = [];
      }),

    addNavItem: (label: string, link: string, sectionId?: string) =>
      set((state: EditStore) => {
        if (!state.navigationConfig) return;
        
        const newItem = {
          id: `nav-custom-${Date.now()}`,
          label,
          link,
          sectionId,
          isAutoGenerated: false,
          order: state.navigationConfig.items.length,
        };
        
        // Check if we're at max items
        if (state.navigationConfig.items.length >= state.navigationConfig.maxItems) {
          // Remove the last auto-generated item if possible
          const lastAutoGenerated = state.navigationConfig.items
            .reverse()
            .find(item => item.isAutoGenerated);
          
          if (lastAutoGenerated) {
            state.navigationConfig.items = state.navigationConfig.items.filter(
              item => item.id !== lastAutoGenerated.id
            );
          } else {
            // Can't add more items
            return;
          }
        }
        
        state.navigationConfig.items.push(newItem);
        state.navigationConfig.lastUpdated = Date.now();
        state.persistence.isDirty = true;
        
        // Add to history
        state.history.undoStack.push({
          type: 'layout',
          description: 'Added navigation item',
          timestamp: Date.now(),
          beforeState: null,
          afterState: { navItem: newItem },
        });
        
        state.history.redoStack = [];
      }),

    removeNavItem: (itemId: string) =>
      set((state: EditStore) => {
        if (!state.navigationConfig) return;
        
        const itemIndex = state.navigationConfig.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const removedItem = state.navigationConfig.items[itemIndex];
        state.navigationConfig.items.splice(itemIndex, 1);
        
        // Reorder remaining items
        state.navigationConfig.items.forEach((item, index) => {
          item.order = index;
        });
        
        state.navigationConfig.lastUpdated = Date.now();
        state.persistence.isDirty = true;
        
        // Add to history
        state.history.undoStack.push({
          type: 'layout',
          description: 'Removed navigation item',
          timestamp: Date.now(),
          beforeState: { navItem: removedItem, index: itemIndex },
          afterState: null,
        });
        
        state.history.redoStack = [];
      }),

    reorderNavItems: (newOrder: string[]) =>
      set((state: EditStore) => {
        if (!state.navigationConfig) return;
        
        const oldOrder = state.navigationConfig.items.map(item => item.id);
        const reorderedItems = newOrder.map(id => 
          state.navigationConfig!.items.find(item => item.id === id)!
        ).filter(Boolean);
        
        // Update order property
        reorderedItems.forEach((item, index) => {
          item.order = index;
        });
        
        state.navigationConfig.items = reorderedItems;
        state.navigationConfig.lastUpdated = Date.now();
        state.persistence.isDirty = true;
        
        // Add to history
        state.history.undoStack.push({
          type: 'layout',
          description: 'Reordered navigation items',
          timestamp: Date.now(),
          beforeState: { navOrder: oldOrder },
          afterState: { navOrder: newOrder },
        });
        
        state.history.redoStack = [];
      }),

    updateNavigationOnSectionChange: () => {
      const { updateNavigationForSectionChanges } = require('@/utils/sectionScanner');
      const state = get();
      
      if (!state.navigationConfig) return;
      
      const updatedNav = updateNavigationForSectionChanges(
        state.navigationConfig.items,
        state.sections,
        state.sectionLayouts
      );
      
      set((state: EditStore) => {
        if (state.navigationConfig) {
          state.navigationConfig.items = updatedNav;
          state.navigationConfig.lastUpdated = Date.now();
          state.persistence.isDirty = true;
        }
      });
    },

    setNavigationMaxItems: (maxItems: number) =>
      set((state: EditStore) => {
        if (!state.navigationConfig) return;
        
        const oldMax = state.navigationConfig.maxItems;
        state.navigationConfig.maxItems = maxItems;
        
        // If reducing max items, keep the highest priority items
        if (maxItems < state.navigationConfig.items.length) {
          // Sort by priority (auto-generated first, then by order)
          state.navigationConfig.items.sort((a, b) => {
            if (a.isAutoGenerated && !b.isAutoGenerated) return -1;
            if (!a.isAutoGenerated && b.isAutoGenerated) return 1;
            return a.order - b.order;
          });
          
          state.navigationConfig.items = state.navigationConfig.items.slice(0, maxItems);
        }
        
        state.navigationConfig.lastUpdated = Date.now();
        state.persistence.isDirty = true;
        
        // Add to history
        state.history.undoStack.push({
          type: 'layout',
          description: 'Changed navigation max items',
          timestamp: Date.now(),
          beforeState: { maxItems: oldMax },
          afterState: { maxItems },
        });
        
        state.history.redoStack = [];
      }),

    // ====== SOCIAL MEDIA MANAGEMENT ======
    // TEMP: commented for build - methods not defined in interface
    /*
    initializeSocialMedia: () =>
      set((state: EditStore) => {
        if (state.socialMediaConfig) return; // Already initialized
        
        state.socialMediaConfig = {
          items: [],
          maxItems: 8, // Default maximum social media links
          lastUpdated: Date.now(),
        };
      }),

    addSocialMediaItem: (platform: string, url: string, icon: string) =>
      set((state: EditStore) => {
        if (!state.socialMediaConfig) {
          // Auto-initialize if not exists
          state.socialMediaConfig = {
            items: [],
            maxItems: 8,
            lastUpdated: Date.now(),
          };
        }

        // Check if we're at max items
        if (state.socialMediaConfig.items.length >= state.socialMediaConfig.maxItems) {
          return; // Don't add if at limit
        }

        const newItem = {
          id: `social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          platform,
          url,
          icon,
          order: state.socialMediaConfig.items.length,
        };

        state.socialMediaConfig.items.push(newItem);
        state.socialMediaConfig.lastUpdated = Date.now();
        state.persistence.isDirty = true;

        logger.debug('🔗 [SOCIAL-DEBUG] Added social media item:', newItem);
      }),

    updateSocialMediaItem: (itemId: string, updates: Partial<{ platform: string; url: string; icon: string }>) =>
      set((state: EditStore) => {
        if (!state.socialMediaConfig) return;
        
        const itemIndex = state.socialMediaConfig.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const updatedItem = {
          ...state.socialMediaConfig.items[itemIndex],
          ...updates,
        };

        state.socialMediaConfig.items[itemIndex] = updatedItem;
        state.socialMediaConfig.lastUpdated = Date.now();
        state.persistence.isDirty = true;

        logger.debug('🔗 [SOCIAL-DEBUG] Updated social media item:', updatedItem);
      }),

    removeSocialMediaItem: (itemId: string) =>
      set((state: EditStore) => {
        if (!state.socialMediaConfig) return;
        
        const itemIndex = state.socialMediaConfig.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const removedItem = state.socialMediaConfig.items[itemIndex];
        state.socialMediaConfig.items.splice(itemIndex, 1);
        
        // Reorder remaining items
        state.socialMediaConfig.items.forEach((item, index) => {
          item.order = index;
        });
        
        state.socialMediaConfig.lastUpdated = Date.now();
        state.persistence.isDirty = true;

        logger.debug('🔗 [SOCIAL-DEBUG] Removed social media item:', removedItem);
      }),

    reorderSocialMediaItems: (newOrder: string[]) =>
      set((state: EditStore) => {
        if (!state.socialMediaConfig) return;
        
        const reorderedItems = newOrder.map(id => 
          state.socialMediaConfig!.items.find(item => item.id === id)!
        ).filter(Boolean);
        
        // Update order property
        reorderedItems.forEach((item, index) => {
          item.order = index;
        });
        
        state.socialMediaConfig.items = reorderedItems;
        state.socialMediaConfig.lastUpdated = Date.now();
        state.persistence.isDirty = true;

        logger.debug('🔗 [SOCIAL-DEBUG] Reordered social media items:', reorderedItems);
      }),
    */

  };
}