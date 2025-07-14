// usePageStore.ts - FIXED: Section management and content synchronization issues
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { landingTypography } from '@/modules/Design/fontSystem/landingTypography';
import { 
  generateColorTokens, 
  generateColorTokensFromBackgroundSystem, 
  SectionBackgroundInput,
  type BackgroundSystem
} from '@/modules/Design/ColorSystem/colorTokens';
import { pickFontFromOnboarding } from '@/modules/Design/fontSystem/pickFont';
import { getSectionBackgroundType, getSectionBackgroundCSS } from '@/modules/Design/background/backgroundIntegration';
import { useOnboardingStore } from './useOnboardingStore';

// Add typography scales
const typographyScales = {
  default: landingTypography,
  compact: landingTypography,
  comfortable: landingTypography,
  spacious: landingTypography
};

type Theme = {
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: keyof typeof typographyScales;
  };
  colors: {
    baseColor: string;
    accentColor: string;
    accentCSS?: string;
    sectionBackgrounds: SectionBackgroundInput;
  };
  spacing: {
    unit: number;
    scale: 'compact' | 'comfortable' | 'spacious';
  };
  corners: {
    radius: number;
  };
};

type FeatureItem = {
  feature: string;
  benefit: string;
};

type SectionData = {
  id: string;
  layout: string;
  elements: Record<string, string | string[]>;
  backgroundType?: 'primary' | 'secondary' | 'neutral' | 'divider';
  media?: {
    image?: string;
    video?: string;
    icon?: string;
    alt?: string;
  };
  cta?: {
    label?: string;
    url?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  aiPrompt?: string;
  lastGenerated?: number;
  isCustomized?: boolean;
  aiGeneratedElements?: string[];
};

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

type LayoutSlice = {
  sections: string[];
  sectionLayouts: Record<string, string>;
  theme: Theme;
  globalSettings: {
    maxWidth: string;
    containerPadding: string;
    sectionSpacing: string;
  };
};

type ContentSlice = {
  [sectionId: string]: SectionData | undefined;
};

type UISlice = {
  mode: "preview" | "edit";
  activeSection?: string;
  completionStatus: Record<string, boolean>;
  isLoading: boolean;
  loadingStates: Record<string, boolean>;
  errors: Record<string, string>;
  lastSaved?: number;
  unsavedChanges: boolean;
  aiGeneration: AIGenerationStatus;
};

type MetaSlice = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  lastUpdated: number;
  version: number;
  onboardingData: {
    oneLiner: string;
    validatedFields: Record<string, string>;
    featuresFromAI: FeatureItem[];
    targetAudience?: string;
    businessType?: string;
  };
};

type PageStore = {
  layout: LayoutSlice;
  content: ContentSlice;
  ui: UISlice;
  meta: MetaSlice;

  loadFromDraft: (apiResponse: any) => Promise<void>;
  
  // ✅ NEW: Bulk section initialization method
  initializeSections: (sectionIds: string[], sectionLayouts: Record<string, string>) => void;
  
  // AI actions
  updateFromAIResponse: (aiResponse: any) => void;
  setAIGenerationStatus: (status: Partial<AIGenerationStatus>) => void;
  clearAIErrors: () => void;

  // Layout Actions
  setSection: (sectionId: string, data: Partial<SectionData>) => void;
  setLayout: (sectionId: string, layout: string) => void;
  setSectionLayouts: (layouts: Record<string, string>) => void; 
  addSection: (sectionType: string, position?: number) => string;
  removeSection: (sectionId: string) => void;
  reorderSections: (newOrder: string[]) => void;
  duplicateSection: (sectionId: string) => string;

  // Theme Actions
  setTheme: (theme: Partial<Theme>) => void;
  updateBaseColor: (baseColor: string) => void;
  updateAccentColor: (accentColor: string) => void;
  updateSectionBackground: (type: keyof SectionBackgroundInput, value: string) => void;
  getColorTokens: () => ReturnType<typeof generateColorTokens>;
  updateTypography: (typography: Partial<Theme['typography']>) => void;
  updateFontsFromTone: () => void;
  setCustomFonts: (headingFont: string, bodyFont: string) => void;
  updateFromBackgroundSystem: (backgroundSystem: BackgroundSystem) => void;

  // Content Actions
  updateElementContent: (sectionId: string, element: string, content: string | string[]) => void;
  bulkUpdateSection: (sectionId: string, elements: Record<string, string>) => void;
  regenerateSection: (sectionId: string) => Promise<void>;
  regenerateAllContent: () => Promise<void>;
  markAsCustomized: (sectionId: string) => void;
  setBackgroundType: (sectionId: string, backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider') => void;

  // UI Actions
  setMode: (mode: "preview" | "edit") => void;
  setActiveSection: (sectionId?: string) => void;
  markSectionComplete: (sectionId: string, isComplete: boolean) => void;
  setLoading: (isLoading: boolean, sectionId?: string) => void;
  setError: (error: string, sectionId?: string) => void;
  clearError: (sectionId?: string) => void;

  // Validation & Business Logic
  validateSection: (sectionId: string) => boolean;
  getIncompleteElements: (sectionId: string) => string[];
  canPublish: () => boolean;
  getOptimizationSuggestions: () => string[];
  
  // Persistence
  save: () => Promise<void>;
  load: (pageId: string) => Promise<void>;
  export: () => object;
  
  // Utility
  reset: () => void;
  undo: () => void;
  redo: () => void;
};

const defaultTheme: Theme = {
  typography: {
    headingFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    scale: 'comfortable',
  },
  colors: {
    baseColor: 'gray',
    accentColor: 'purple',
    accentCSS: undefined,
    sectionBackgrounds: {
      primary: undefined,
      secondary: undefined,
      neutral: undefined,
      divider: undefined
    },
  },
  spacing: {
    unit: 8,
    scale: 'comfortable',
  },
  corners: {
    radius: 8,
  },
};

// Mock AI service
const generateSectionContent = async (sectionId: string, prompt?: string): Promise<Record<string, string>> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    headline: `AI Generated Headline for ${sectionId}`,
    subtext: `AI Generated description content...`,
  };
};

const defaultUIState = {
  mode: "edit" as const,
  activeSection: undefined,
  completionStatus: {},
  isLoading: false,
  loadingStates: {},
  errors: {},
  lastSaved: undefined,
  unsavedChanges: false,
  aiGeneration: {
    isGenerating: false,
    success: false,
    isPartial: false,
    warnings: [],
    errors: [],
    sectionsGenerated: [],
    sectionsSkipped: [],
  },
};

export const usePageStore = create<PageStore>()(
  devtools(
    immer((set, get) => ({
      layout: {
        sections: [],
        sectionLayouts: {},
        theme: defaultTheme,
        globalSettings: {
          maxWidth: '1200px',
          containerPadding: '32px',
          sectionSpacing: '64px',
        },
      },
      content: {},
      ui: defaultUIState,
      meta: {
        id: "",
        title: "",
        slug: "",
        description: "",
        lastUpdated: Date.now(),
        version: 1,
        onboardingData: {
          oneLiner: "",
          validatedFields: {},
          featuresFromAI: [],
          targetAudience: "",
          businessType: "",
        },
      },

      // ✅ FIXED: Proper section initialization method
      initializeSections: (sectionIds: string[], sectionLayouts: Record<string, string>) =>
        set((state) => {
          console.log('🏗️ Initializing sections:', { sectionIds, sectionLayouts });
          
          // Set sections array
          state.layout.sections = [...sectionIds];
          
          // Set section layouts
          state.layout.sectionLayouts = { ...sectionLayouts };
          
          // ✅ CRITICAL FIX: Initialize content for ALL sections
          sectionIds.forEach(sectionId => {
            const layout = sectionLayouts[sectionId] || 'default';
            const backgroundType = getSectionBackgroundType(sectionId);
            
            // Create content entry for each section
            state.content[sectionId] = {
              id: sectionId,
              layout: layout,
              elements: {}, // Will be populated by AI
              backgroundType: backgroundType,
              lastGenerated: Date.now(),
              isCustomized: false,
              aiGeneratedElements: []
            };
            
            console.log(`✅ Section ${sectionId} initialized with layout: ${layout}, background: ${backgroundType}`);
          });
          
          state.ui.unsavedChanges = true;
          
          console.log('📊 Initialization complete:', {
            sectionsCount: state.layout.sections.length,
            contentCount: Object.keys(state.content).length,
            layoutsCount: Object.keys(state.layout.sectionLayouts).length
          });
        }),

      getColorTokens: () => {
        const { theme } = get().layout;
        
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

          console.log('🎨 Using integrated background system for color tokens:', backgroundSystemData);
          return generateColorTokensFromBackgroundSystem(backgroundSystemData);
        } else {
          console.warn('Using fallback color token generation - background system not fully integrated');
          return generateColorTokens({
            baseColor: theme.colors.baseColor,
            accentColor: theme.colors.accentColor,
            accentCSS: theme.colors.accentCSS,
            sectionBackgrounds: theme.colors.sectionBackgrounds
          });
        }
      },

      updateFromBackgroundSystem: (backgroundSystem: BackgroundSystem) =>
        set((state) => {
          console.log('🔄 Updating theme from background system:', backgroundSystem);
          
          state.layout.theme.colors.baseColor = backgroundSystem.baseColor;
          state.layout.theme.colors.accentColor = backgroundSystem.accentColor;
          state.layout.theme.colors.accentCSS = backgroundSystem.accentCSS;
          
          state.layout.theme.colors.sectionBackgrounds.primary = backgroundSystem.primary;
          state.layout.theme.colors.sectionBackgrounds.secondary = backgroundSystem.secondary;
          state.layout.theme.colors.sectionBackgrounds.neutral = backgroundSystem.neutral;
          state.layout.theme.colors.sectionBackgrounds.divider = backgroundSystem.divider;
          
          state.ui.unsavedChanges = true;
          
          console.log('✅ Theme updated with sophisticated background system');
        }),

      // ✅ FIXED: Proper section creation with content initialization
      setSection: (sectionId, data) =>
        set((state) => {
          if (!state.content[sectionId]) {
            // Create new section with proper defaults
            state.content[sectionId] = { 
              id: sectionId, 
              layout: data.layout || "default", 
              elements: {},
              backgroundType: data.backgroundType || getSectionBackgroundType(sectionId),
              lastGenerated: Date.now(),
              isCustomized: false,
              aiGeneratedElements: []
            };
            
            // Also ensure it's in sections array if not already
            if (!state.layout.sections.includes(sectionId)) {
              state.layout.sections.push(sectionId);
            }
            
            // And in section layouts
            if (!state.layout.sectionLayouts[sectionId]) {
              state.layout.sectionLayouts[sectionId] = data.layout || 'default';
            }
          }
          
          // Apply the updates
          Object.assign(state.content[sectionId]!, data);
          state.ui.unsavedChanges = true;
          
          console.log(`✅ Section ${sectionId} set/updated:`, data);
        }),

      setLayout: (sectionId, layout) =>
        set((state) => {
          // Update layout mapping
          state.layout.sectionLayouts[sectionId] = layout;
          
          // Update content if it exists
          if (state.content[sectionId]) {
            state.content[sectionId]!.layout = layout;
          } else {
            // Create content if it doesn't exist
            state.content[sectionId] = {
              id: sectionId,
              layout: layout,
              elements: {},
              backgroundType: getSectionBackgroundType(sectionId),
              lastGenerated: Date.now(),
              isCustomized: false,
              aiGeneratedElements: []
            };
          }
          
          state.ui.unsavedChanges = true;
          console.log(`✅ Layout set for ${sectionId}: ${layout}`);
        }),
      
      // ✅ FIXED: Proper bulk section layout updates with content sync
      setSectionLayouts: (layouts) =>
        set((state) => {
          console.log('🔄 Setting section layouts:', layouts);
          
          // Update all section layouts
          Object.assign(state.layout.sectionLayouts, layouts);
          
          // Ensure content exists for each section and update layout
          Object.entries(layouts).forEach(([sectionId, layout]) => {
            if (!state.content[sectionId]) {
              // Create content if it doesn't exist
              state.content[sectionId] = {
                id: sectionId,
                layout: layout,
                elements: {},
                backgroundType: getSectionBackgroundType(sectionId),
                lastGenerated: Date.now(),
                isCustomized: false,
                aiGeneratedElements: []
              };
              console.log(`✅ Created content for section ${sectionId} with layout ${layout}`);
            } else {
              // Update existing content layout
              state.content[sectionId]!.layout = layout;
              console.log(`✅ Updated layout for section ${sectionId} to ${layout}`);
            }
            
            // Ensure section is in sections array
            if (!state.layout.sections.includes(sectionId)) {
              state.layout.sections.push(sectionId);
              console.log(`✅ Added section ${sectionId} to sections array`);
            }
          });
          
          state.ui.unsavedChanges = true;
          
          console.log('📊 setSectionLayouts complete:', {
            layoutsSet: Object.keys(layouts).length,
            totalSections: state.layout.sections.length,
            totalContent: Object.keys(state.content).length
          });
        }),

      addSection: (sectionType, position) => {
        const sectionId = `${sectionType}-${Date.now()}`;
        set((state) => {
          const insertPos = position ?? state.layout.sections.length;
          state.layout.sections.splice(insertPos, 0, sectionId);
          state.layout.sectionLayouts[sectionId] = 'default';
          
          // ✅ FIXED: Proper content initialization
          state.content[sectionId] = {
            id: sectionId,
            layout: 'default',
            elements: {},
            backgroundType: getSectionBackgroundType(sectionId),
            lastGenerated: Date.now(),
            isCustomized: false,
            aiGeneratedElements: []
          };
          
          state.ui.unsavedChanges = true;
          console.log(`✅ Added section ${sectionId} at position ${insertPos}`);
        });
        return sectionId;
      },

      removeSection: (sectionId) =>
        set((state) => {
          state.layout.sections = state.layout.sections.filter((id: string) => id !== sectionId);
          delete state.layout.sectionLayouts[sectionId];
          delete state.content[sectionId];
          delete state.ui.completionStatus[sectionId];
          delete state.ui.loadingStates[sectionId];
          delete state.ui.errors[sectionId];
          if (state.ui.activeSection === sectionId) {
            state.ui.activeSection = undefined;
          }
          state.ui.unsavedChanges = true;
          console.log(`✅ Removed section ${sectionId}`);
        }),

      reorderSections: (newOrder) =>
        set((state) => {
          state.layout.sections = newOrder;
          state.ui.unsavedChanges = true;
          console.log('✅ Sections reordered:', newOrder);
        }),

      duplicateSection: (sectionId) => {
        const newId = `${sectionId}-copy-${Date.now()}`;
        set((state) => {
          const originalSection = state.content[sectionId];
          if (originalSection) {
            const index = state.layout.sections.findIndex((id: string) => id === sectionId);
            state.layout.sections.splice(index + 1, 0, newId);
            state.layout.sectionLayouts[newId] = state.layout.sectionLayouts[sectionId];
            state.content[newId] = {
              ...originalSection,
              id: newId,
              lastGenerated: Date.now(),
              isCustomized: false // Reset customization flag for copy
            };
            state.ui.unsavedChanges = true;
            console.log(`✅ Duplicated section ${sectionId} to ${newId}`);
          }
        });
        return newId;
      },

      // Theme Actions (unchanged)
      setTheme: (theme) =>
        set((state) => {
          Object.assign(state.layout.theme, theme);
          state.ui.unsavedChanges = true;
        }),

      updateBaseColor: (baseColor) =>
        set((state) => {
          state.layout.theme.colors.baseColor = baseColor;
          state.ui.unsavedChanges = true;
        }),

      updateAccentColor: (accentColor) =>
        set((state) => {
          state.layout.theme.colors.accentColor = accentColor;
          state.ui.unsavedChanges = true;
        }),

      updateSectionBackground: (type, value) =>
        set((state) => {
          state.layout.theme.colors.sectionBackgrounds[type] = value;
          state.ui.unsavedChanges = true;
        }),

      updateTypography: (typography) =>
        set((state) => {
          Object.assign(state.layout.theme.typography, typography);
          state.ui.unsavedChanges = true;
        }),

      updateFontsFromTone: () => {
        try {
          const fontTheme = pickFontFromOnboarding();
          set((state) => {
            state.layout.theme.typography.headingFont = fontTheme.headingFont;
            state.layout.theme.typography.bodyFont = fontTheme.bodyFont;
            state.ui.unsavedChanges = true;
          });
        } catch (error) {
          console.error('Failed to update fonts from tone:', error);
          set((state) => {
            state.ui.errors['global'] = 'Failed to update fonts from tone';
          });
        }
      },

      setCustomFonts: (headingFont, bodyFont) =>
        set((state) => {
          state.layout.theme.typography.headingFont = headingFont;
          state.layout.theme.typography.bodyFont = bodyFont;
          state.ui.unsavedChanges = true;
        }),

      // Content Actions (mostly unchanged but with better error handling)
      updateElementContent: (sectionId, element, content) =>
        set((state) => {
          if (!state.content[sectionId]) {
            // Create section if it doesn't exist
            state.content[sectionId] = { 
              id: sectionId, 
              layout: state.layout.sectionLayouts[sectionId] || "default", 
              elements: {},
              backgroundType: getSectionBackgroundType(sectionId),
              lastGenerated: Date.now(),
              isCustomized: false,
              aiGeneratedElements: []
            };
          }
          state.content[sectionId]!.elements[element] = content;
          state.content[sectionId]!.isCustomized = true;
          state.ui.unsavedChanges = true;
        }),

      bulkUpdateSection: (sectionId, elements) =>
        set((state) => {
          if (!state.content[sectionId]) {
            state.content[sectionId] = { 
              id: sectionId, 
              layout: state.layout.sectionLayouts[sectionId] || "default", 
              elements: {},
              backgroundType: getSectionBackgroundType(sectionId),
              lastGenerated: Date.now(),
              isCustomized: false,
              aiGeneratedElements: []
            };
          }
          Object.assign(state.content[sectionId]!.elements, elements);
          state.content[sectionId]!.isCustomized = true;
          state.ui.unsavedChanges = true;
        }),

      regenerateSection: async (sectionId) => {
        set((state) => {
          state.ui.loadingStates[sectionId] = true;
          delete state.ui.errors[sectionId];
        });

        try {
          const section = get().content[sectionId];
          const newContent = await generateSectionContent(sectionId, section?.aiPrompt);
          
          set((state) => {
            if (state.content[sectionId]) {
              state.content[sectionId]!.elements = newContent;
              state.content[sectionId]!.lastGenerated = Date.now();
              state.content[sectionId]!.isCustomized = false;
            }
            state.ui.loadingStates[sectionId] = false;
            state.ui.unsavedChanges = true;
          });
        } catch (error) {
          set((state) => {
            state.ui.loadingStates[sectionId] = false;
            state.ui.errors[sectionId] = error instanceof Error ? error.message : 'Failed to regenerate content';
          });
        }
      },

      regenerateAllContent: async () => {
        const { layout } = get();
        set((state) => { state.ui.isLoading = true; });

        try {
          await Promise.all(
            layout.sections.map(sectionId => get().regenerateSection(sectionId))
          );
        } finally {
          set((state) => { state.ui.isLoading = false; });
        }
      },

      markAsCustomized: (sectionId) =>
        set((state) => {
          if (state.content[sectionId]) {
            state.content[sectionId]!.isCustomized = true;
          }
        }),

      setBackgroundType: (sectionId, backgroundType) =>
        set((state) => {
          if (state.content[sectionId]) {
            state.content[sectionId]!.backgroundType = backgroundType;
            state.ui.unsavedChanges = true;
          }
        }),

      // UI Actions (unchanged)
      setMode: (mode) =>
        set((state) => {
          state.ui.mode = mode;
        }),

      setActiveSection: (sectionId) =>
        set((state) => {
          state.ui.activeSection = sectionId;
        }),

      markSectionComplete: (sectionId, isComplete) =>
        set((state) => {
          state.ui.completionStatus[sectionId] = isComplete;
        }),

      setLoading: (isLoading, sectionId) =>
        set((state) => {
          if (sectionId) {
            state.ui.loadingStates[sectionId] = isLoading;
          } else {
            state.ui.isLoading = isLoading;
          }
        }),

      setError: (error, sectionId) =>
        set((state) => {
          if (sectionId) {
            state.ui.errors[sectionId] = error;
          } else {
            state.ui.errors['global'] = error;
          }
        }),

      clearError: (sectionId) =>
        set((state) => {
          if (sectionId) {
            delete state.ui.errors[sectionId];
          } else {
            state.ui.errors = {};
          }
        }),

      // Validation & Business Logic (unchanged)
      validateSection: (sectionId) => {
        const state = get();
        const section = state.content[sectionId];
        if (!section) return false;
        
        const requiredElements = ['headline'];
        return requiredElements.every(element => 
          section.elements[element] && 
          (typeof section.elements[element] === 'string' 
            ? section.elements[element].trim().length > 0 
            : Array.isArray(section.elements[element]) && section.elements[element].length > 0)
        );
      },

      getIncompleteElements: (sectionId) => {
        const state = get();
        const section = state.content[sectionId];
        if (!section) return [];
        
        const requiredElements = ['headline'];
        return requiredElements.filter(element => 
          !section.elements[element] || 
          (typeof section.elements[element] === 'string' 
            ? section.elements[element].trim().length === 0 
            : Array.isArray(section.elements[element]) && section.elements[element].length === 0)
        );
      },

      canPublish: () => {
        const state = get();
        return state.layout.sections.every(sectionId => 
          get().validateSection(sectionId)
        );
      },

      getOptimizationSuggestions: () => {
        const state = get();
        const suggestions: string[] = [];
        
        if (!state.meta.title) suggestions.push("Add a page title");
        if (!state.meta.description) suggestions.push("Add a meta description");
        if (state.layout.sections.length < 3) suggestions.push("Consider adding more sections");
        
        return suggestions;
      },

      // Persistence (implement based on your backend)
      save: async () => {
        set((state) => { state.ui.isLoading = true; });
        try {
          set((state) => {
            state.ui.lastSaved = Date.now();
            state.ui.unsavedChanges = false;
            state.meta.lastUpdated = Date.now();
            state.meta.version += 1;
          });
        } catch (error) {
          set((state) => {
            state.ui.errors['global'] = error instanceof Error ? error.message : 'Failed to save';
          });
        } finally {
          set((state) => { state.ui.isLoading = false; });
        }
      },

      load: async (pageId) => {
        set((state) => { state.ui.isLoading = true; });
        try {
          // Implement load logic here
        } catch (error) {
          set((state) => {
            state.ui.errors['global'] = error instanceof Error ? error.message : 'Failed to load';
          });
        } finally {
          set((state) => { state.ui.isLoading = false; });
        }
      },

      export: () => {
        const state = get();
        return {
          layout: state.layout,
          content: state.content,
          meta: state.meta,
          exportedAt: Date.now(),
        };
      },

      // Utility
      reset: () =>
        set(() => ({
          layout: {
            sections: [],
            sectionLayouts: {},
            theme: defaultTheme,
            globalSettings: {
              maxWidth: '1200px',
              containerPadding: '32px',
              sectionSpacing: '64px',
            },
          },
          content: {},
          ui: defaultUIState, 
          meta: {
            id: "",
            title: "",
            slug: "",
            description: "",
            lastUpdated: Date.now(),
            version: 1,
            onboardingData: {
              oneLiner: "",
              validatedFields: {},
              featuresFromAI: [],
              targetAudience: "",
              businessType: "",
            },
          },
        })),

      undo: () => {
        console.log("Undo not implemented yet");
      },

      redo: () => {
        console.log("Redo not implemented yet");
      },

      // ✅ COMPLETELY FIXED: updateFromAIResponse with proper section management
      updateFromAIResponse: (aiResponse: any) => {
        set((state) => {
          console.log('🤖 updateFromAIResponse called with:', {
            success: aiResponse.success,
            isPartial: aiResponse.isPartial,
            contentKeys: Object.keys(aiResponse.content || {}),
            currentSections: state.layout.sections,
            currentContent: Object.keys(state.content)
          });

          // Update AI generation status
          state.ui.aiGeneration.isGenerating = false;
          state.ui.aiGeneration.success = aiResponse.success || false;
          state.ui.aiGeneration.isPartial = aiResponse.isPartial || false;
          state.ui.aiGeneration.warnings = aiResponse.warnings || [];
          state.ui.aiGeneration.errors = aiResponse.errors || [];
          state.ui.aiGeneration.lastGenerated = Date.now();
          state.ui.aiGeneration.sectionsGenerated = [];
          state.ui.aiGeneration.sectionsSkipped = [];

          // ✅ CRITICAL FIX: Get pre-selected sections that should already exist in the store
          const preSelectedSections = state.layout.sections;
          console.log('🔒 Pre-selected sections from store:', preSelectedSections);
          
          // ✅ CRITICAL FIX: If no sections in store, this means sections weren't properly initialized
          if (preSelectedSections.length === 0) {
            console.error('❌ CRITICAL: No sections found in store! Sections should be initialized before AI response.');
            state.ui.aiGeneration.errors.push('No sections initialized in store before AI response');
            return;
          }

          // Get background system from theme
          const theme = state.layout.theme.colors;
          const backgroundSystem = {
            primary: theme.sectionBackgrounds.primary || 'bg-white',
            secondary: theme.sectionBackgrounds.secondary || 'bg-gray-50',
            neutral: theme.sectionBackgrounds.neutral || 'bg-white',
            divider: theme.sectionBackgrounds.divider || 'bg-gray-100',
          };

          // ✅ FIXED: Process AI content only for pre-selected sections
          if (aiResponse.content && typeof aiResponse.content === 'object') {
            Object.entries(aiResponse.content).forEach(([sectionId, sectionData]: [string, any]) => {
              // ✅ CRITICAL: Only process sections that were pre-selected by rules
              if (!preSelectedSections.includes(sectionId)) {
                console.warn(`🚫 Ignoring section "${sectionId}" - not in pre-selected sections`);
                state.ui.aiGeneration.sectionsSkipped.push(sectionId);
                return;
              }

              if (!sectionData || typeof sectionData !== 'object') {
                console.warn(`⚠️ Section ${sectionId} has invalid data format`);
                state.ui.aiGeneration.sectionsSkipped.push(sectionId);
                return;
              }

              console.log(`✅ Processing pre-selected section: ${sectionId}`);

              // ✅ FIXED: Section should already exist in content, but verify
              if (!state.content[sectionId]) {
                console.error(`❌ CRITICAL: Section ${sectionId} not found in content store! This should not happen.`);
                // Create it as fallback, but this indicates a bug in initialization
                state.content[sectionId] = {
                  id: sectionId,
                  layout: state.layout.sectionLayouts[sectionId] || 'default',
                  elements: {},
                  backgroundType: getSectionBackgroundType(sectionId),
                  lastGenerated: Date.now(),
                  isCustomized: false,
                  aiGeneratedElements: []
                };
              }

              // Get the section and update its content
              const section = state.content[sectionId]!;
              const generatedElements: string[] = [];

              // Update elements with AI-generated content
              Object.entries(sectionData).forEach(([elementKey, elementValue]: [string, any]) => {
                if (elementValue !== undefined && elementValue !== null) {
                  section.elements[elementKey] = elementValue;
                  generatedElements.push(elementKey);
                }
              });

              // Update section metadata
              section.lastGenerated = Date.now();
              section.isCustomized = false;
              section.aiGeneratedElements = generatedElements;
              
              // Ensure background type is set
              if (!section.backgroundType) {
                section.backgroundType = getSectionBackgroundType(sectionId);
              }

              console.log(`✅ Section ${sectionId} updated with ${generatedElements.length} elements`);
              state.ui.aiGeneration.sectionsGenerated.push(sectionId);
            });
          }

          // ✅ VALIDATION: Check if all pre-selected sections were processed
          const processedSections = state.ui.aiGeneration.sectionsGenerated;
          const missingSections = preSelectedSections.filter(sectionId => !processedSections.includes(sectionId));
          
          if (missingSections.length > 0) {
            console.warn('⚠️ Some pre-selected sections were not returned by AI:', missingSections);
            state.ui.aiGeneration.warnings.push(`AI did not generate content for: ${missingSections.join(', ')}`);
            state.ui.aiGeneration.isPartial = true;
          }

          // ✅ FINAL VALIDATION: Ensure content and layout are in sync
          const finalSectionCount = state.layout.sections.length;
          const finalContentCount = Object.keys(state.content).length;
          
          if (finalSectionCount !== finalContentCount) {
            console.error('❌ CRITICAL: Section/Content mismatch after AI response!', {
              sectionsInLayout: finalSectionCount,
              sectionsInContent: finalContentCount,
              layoutSections: state.layout.sections,
              contentSections: Object.keys(state.content)
            });
            state.ui.aiGeneration.errors.push(`Section/Content count mismatch: ${finalSectionCount} layout vs ${finalContentCount} content`);
          }

          console.log('📊 updateFromAIResponse Summary:', {
            preSelectedSections: preSelectedSections.length,
            sectionsFromAI: Object.keys(aiResponse.content || {}).length,
            sectionsProcessed: state.ui.aiGeneration.sectionsGenerated.length,
            sectionsSkipped: state.ui.aiGeneration.sectionsSkipped.length,
            missingSections: missingSections.length,
            finalStoreSections: state.layout.sections.length,
            finalContentSections: Object.keys(state.content).length,
            isSuccessful: state.ui.aiGeneration.sectionsGenerated.length > 0
          });

          state.ui.unsavedChanges = true;
        });
      },

      setAIGenerationStatus: (status: Partial<AIGenerationStatus>) => {
        set((state) => {
          Object.assign(state.ui.aiGeneration, status);
        });
      },

      clearAIErrors: () => {
        set((state) => {
          state.ui.aiGeneration.warnings = [];
          state.ui.aiGeneration.errors = [];
        });
      },

      // ✅ FIXED: loadFromDraft with proper section initialization
      loadFromDraft: async (apiResponse: any) => {
        try {
          console.log('🔄 Loading from draft API response:', apiResponse);
          
          set((state) => {
            state.ui.isLoading = true;
            state.ui.errors = {};
          });

          // 1. Populate Onboarding Store (if available)
          if (apiResponse.validatedFields || apiResponse.featuresFromAI) {
            const onboardingStore = useOnboardingStore.getState();
            
            if (apiResponse.inputText) {
              onboardingStore.setOneLiner(apiResponse.inputText);
            }
            
            if (apiResponse.validatedFields) {
              onboardingStore.setValidatedFields(apiResponse.validatedFields);
            }
            
            if (apiResponse.featuresFromAI) {
              onboardingStore.setFeaturesFromAI(apiResponse.featuresFromAI);
            }
            
            if (apiResponse.stepIndex !== undefined) {
              onboardingStore.setStepIndex(apiResponse.stepIndex);
            }
            
            if (apiResponse.confirmedFields) {
              onboardingStore.setConfirmedFields(apiResponse.confirmedFields);
            }
            
            if (apiResponse.hiddenInferredFields) {
              onboardingStore.setHiddenInferredFields(apiResponse.hiddenInferredFields);
            }
            
            console.log('✅ Onboarding store populated from API');
          }

          // 2. Check if we have complete page data (finalContent)
          if (apiResponse.finalContent && apiResponse.finalContent.layout && apiResponse.finalContent.content) {
            console.log('📦 Found complete finalContent, restoring page state...');
            
            const { finalContent } = apiResponse;
            
            set((state) => {
              // ✅ FIXED: Restore layout data with proper validation
              if (finalContent.layout) {
                state.layout.sections = finalContent.layout.sections || [];
                state.layout.sectionLayouts = finalContent.layout.sectionLayouts || {};
                
                // Restore theme if available
                if (finalContent.layout.theme) {
                  Object.assign(state.layout.theme, finalContent.layout.theme);
                }
                
                // Restore global settings if available
                if (finalContent.layout.globalSettings) {
                  Object.assign(state.layout.globalSettings, finalContent.layout.globalSettings);
                }
              }
              
              // ✅ FIXED: Restore content with validation
              if (finalContent.content) {
                state.content = { ...finalContent.content };
                
                // ✅ CRITICAL: Ensure all sections in layout have corresponding content
                state.layout.sections.forEach(sectionId => {
                  if (!state.content[sectionId]) {
                    console.warn(`⚠️ Creating missing content for section: ${sectionId}`);
                    state.content[sectionId] = {
                      id: sectionId,
                      layout: state.layout.sectionLayouts[sectionId] || 'default',
                      elements: {},
                      backgroundType: getSectionBackgroundType(sectionId),
                      lastGenerated: Date.now(),
                      isCustomized: false,
                      aiGeneratedElements: []
                    };
                  }
                });
                
                // ✅ CRITICAL: Remove any orphaned content (content without corresponding layout)
                Object.keys(state.content).forEach(sectionId => {
                  if (!state.layout.sections.includes(sectionId)) {
                    console.warn(`⚠️ Removing orphaned content for section: ${sectionId}`);
                    delete state.content[sectionId];
                  }
                });
              }
              
              // Restore meta data
              if (finalContent.meta) {
                Object.assign(state.meta, {
                  ...finalContent.meta,
                  id: apiResponse.tokenId || state.meta.id,
                  title: apiResponse.title || finalContent.meta.title || state.meta.title,
                  lastUpdated: Date.now(),
                });
              }
              
              // Update meta with onboarding data
              state.meta.onboardingData = {
                oneLiner: apiResponse.inputText || '',
                validatedFields: apiResponse.validatedFields || {},
                featuresFromAI: apiResponse.featuresFromAI || [],
                targetAudience: apiResponse.validatedFields?.targetAudience || '',
                businessType: apiResponse.validatedFields?.marketCategory || '',
              };
              
              state.ui.isLoading = false;
              state.ui.unsavedChanges = false;
              state.ui.lastSaved = new Date(apiResponse.lastUpdated).getTime();
            });
            
            // ✅ VALIDATION: Final check after loading
            const finalState = get();
            const sectionCount = finalState.layout.sections.length;
            const contentCount = Object.keys(finalState.content).length;
            
            if (sectionCount !== contentCount) {
              console.error('❌ CRITICAL: Section/Content mismatch after loading!', {
                sectionsInLayout: sectionCount,
                sectionsInContent: contentCount
              });
              throw new Error(`Data integrity error: ${sectionCount} sections vs ${contentCount} content entries`);
            }
            
            console.log('✅ Complete page state restored from finalContent:', {
              sections: sectionCount,
              contentEntries: contentCount,
              hasTheme: !!finalState.layout.theme,
              hasOnboardingData: Object.keys(finalState.meta.onboardingData.validatedFields).length > 0
            });
            
          } else {
            console.log('⚠️ No complete finalContent found, page will need regeneration');
            
            // We have onboarding data but no generated page - set appropriate state
            set((state) => {
              // Clear any partial data
              state.layout.sections = [];
              state.layout.sectionLayouts = {};
              state.content = {};
              
              // Update meta with available data
              state.meta.id = apiResponse.tokenId || '';
              state.meta.title = apiResponse.title || 'Untitled Project';
              state.meta.onboardingData = {
                oneLiner: apiResponse.inputText || '',
                validatedFields: apiResponse.validatedFields || {},
                featuresFromAI: apiResponse.featuresFromAI || [],
                targetAudience: apiResponse.validatedFields?.targetAudience || '',
                businessType: apiResponse.validatedFields?.marketCategory || '',
              };
              
              state.ui.isLoading = false;
              state.ui.unsavedChanges = false;
            });
            
            // This indicates the page needs to be regenerated
            throw new Error('Page content not found - regeneration required');
          }
          
          // 3. Apply theme values if provided separately
          if (apiResponse.themeValues) {
            set((state) => {
              console.log('🎨 Applying separate theme values:', apiResponse.themeValues);
              
              if (apiResponse.themeValues.primary) {
                state.layout.theme.colors.accentColor = apiResponse.themeValues.primary;
              }
              if (apiResponse.themeValues.background) {
                state.layout.theme.colors.baseColor = apiResponse.themeValues.background;
              }
            });
          }

          console.log('🎉 Draft loaded successfully');

        } catch (error) {
          console.error('❌ Failed to load from draft:', error);
          
          set((state) => {
            state.ui.isLoading = false;
            state.ui.errors['global'] = error instanceof Error ? error.message : 'Failed to load draft data';
          });
          
          throw error;
        }
      },

    })),
    { name: "PageStore" }
  )
);