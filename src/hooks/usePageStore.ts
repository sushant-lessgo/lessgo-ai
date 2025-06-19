import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { landingTypography } from '@/modules/Design/fontSystem/landingTypography';
import { generateColorTokens, SectionBackgroundInput } from '@/modules/Design/ColorSystem/colorTokens';
import { pickFontFromOnboarding } from '@/modules/Design/fontSystem/pickFont';

// Add typography scales
const typographyScales = {
  default: landingTypography,
  compact: landingTypography, // You can create variants later
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
    baseColor: string;        // "gray", "slate", "stone"
    accentColor: string;      // "purple", "blue", "emerald"
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
  // Add metadata for AI regeneration
  aiPrompt?: string;
  lastGenerated?: number;
  isCustomized?: boolean; // Has user manually edited?
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

  // Add new AI actions
  
  updateFromAIResponse: (aiResponse: any) => void;
  setAIGenerationStatus: (status: Partial<AIGenerationStatus>) => void;
  clearAIErrors: () => void;

  // Layout Actions
  setSection: (sectionId: string, data: Partial<SectionData>) => void;
  setLayout: (sectionId: string, layout: string) => void;
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
    sectionBackgrounds: {
      primary: undefined,    // Will use auto-generated gradient
      secondary: undefined,  // Will use auto-generated bg-gray-50
      neutral: undefined,    // Will use bg-white
      divider: undefined     // Will use pattern
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

// Mock AI service - replace with your actual implementation
const generateSectionContent = async (sectionId: string, prompt?: string): Promise<Record<string, string>> => {
  // Simulate API call
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

      // Layout Actions
      setSection: (sectionId, data) =>
        set((state) => {
          if (!state.content[sectionId]) {
            state.content[sectionId] = { 
              id: sectionId, 
              layout: "default", 
              elements: {},
              lastGenerated: Date.now(),
            };
          }
          Object.assign(state.content[sectionId]!, data);
          state.ui.unsavedChanges = true;
        }),

      setLayout: (sectionId, layout) =>
        set((state) => {
          state.layout.sectionLayouts[sectionId] = layout;
          if (state.content[sectionId]) {
            state.content[sectionId]!.layout = layout;
          }
          state.ui.unsavedChanges = true;
        }),

      addSection: (sectionType, position) => {
        const sectionId = `${sectionType}-${Date.now()}`;
        set((state) => {
          const insertPos = position ?? state.layout.sections.length;
          state.layout.sections.splice(insertPos, 0, sectionId);
          state.layout.sectionLayouts[sectionId] = 'default';
          state.content[sectionId] = {
            id: sectionId,
            layout: 'default',
            elements: {},
            lastGenerated: Date.now(),
          };
          state.ui.unsavedChanges = true;
        });
        return sectionId;
      },

      removeSection: (sectionId) =>
        set((state) => {
          state.layout.sections = state.layout.sections.filter(id => id !== sectionId);
          delete state.layout.sectionLayouts[sectionId];
          delete state.content[sectionId];
          delete state.ui.completionStatus[sectionId];
          delete state.ui.loadingStates[sectionId];
          delete state.ui.errors[sectionId];
          if (state.ui.activeSection === sectionId) {
            state.ui.activeSection = undefined;
          }
          state.ui.unsavedChanges = true;
        }),

      reorderSections: (newOrder) =>
        set((state) => {
          state.layout.sections = newOrder;
          state.ui.unsavedChanges = true;
        }),

      duplicateSection: (sectionId) => {
        const newId = `${sectionId}-copy-${Date.now()}`;
        set((state) => {
          const originalSection = state.content[sectionId];
          if (originalSection) {
            const index = state.layout.sections.findIndex(id => id === sectionId);
            state.layout.sections.splice(index + 1, 0, newId);
            state.layout.sectionLayouts[newId] = state.layout.sectionLayouts[sectionId];
            state.content[newId] = {
              ...originalSection,
              id: newId,
              lastGenerated: Date.now(),
            };
            state.ui.unsavedChanges = true;
          }
        });
        return newId;
      },

      // Theme Actions
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

      getColorTokens: () => {
        const { theme } = get().layout;
        return generateColorTokens({
          baseColor: theme.colors.baseColor,
          accentColor: theme.colors.accentColor,
          sectionBackgrounds: theme.colors.sectionBackgrounds
        });
      },

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

      // Content Actions
      updateElementContent: (sectionId, element, content) =>
        set((state) => {
          if (!state.content[sectionId]) {
            state.content[sectionId] = { id: sectionId, layout: "default", elements: {} };
          }
          state.content[sectionId]!.elements[element] = content;
          state.content[sectionId]!.isCustomized = true;
          state.ui.unsavedChanges = true;
        }),

      bulkUpdateSection: (sectionId, elements) =>
        set((state) => {
          if (!state.content[sectionId]) {
            state.content[sectionId] = { id: sectionId, layout: "default", elements: {} };
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

      // UI Actions
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

      // Validation & Business Logic
      validateSection: (sectionId) => {
        const state = get();
        const section = state.content[sectionId];
        if (!section) return false;
        
        // Add your validation logic here - this should be configurable per layout type
        const requiredElements = ['headline']; // This should come from your layout schema
        return requiredElements.every(element => 
          section.elements[element] && section.elements[element].trim().length > 0
        );
      },

      getIncompleteElements: (sectionId) => {
        const state = get();
        const section = state.content[sectionId];
        if (!section) return [];
        
        // This should come from your layout schema
        const requiredElements = ['headline']; // Define per section type
        return requiredElements.filter(element => 
          !section.elements[element] || section.elements[element].trim().length === 0
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
        
        // Add business logic for suggestions
        if (!state.meta.title) suggestions.push("Add a page title");
        if (!state.meta.description) suggestions.push("Add a meta description");
        if (state.layout.sections.length < 3) suggestions.push("Consider adding more sections");
        
        return suggestions;
      },

      // Persistence (implement based on your backend)
      save: async () => {
        set((state) => { state.ui.isLoading = true; });
        try {
          // Implement save logic here
          // await savePageData(get().export());
          
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
          // const pageData = await loadPageData(pageId);
          // set(pageData);
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

      // TODO: Implement undo/redo with history tracking
      undo: () => {
        console.log("Undo not implemented yet");
      },

      redo: () => {
        console.log("Redo not implemented yet");
      },
updateFromAIResponse: (aiResponse: any) => {
    set((state) => {
      // Update AI generation status
      state.ui.aiGeneration.isGenerating = false;
      state.ui.aiGeneration.success = aiResponse.success || false;
      state.ui.aiGeneration.isPartial = aiResponse.isPartial || false;
      state.ui.aiGeneration.warnings = aiResponse.warnings || [];
      state.ui.aiGeneration.errors = aiResponse.errors || [];
      state.ui.aiGeneration.lastGenerated = Date.now();
      state.ui.aiGeneration.sectionsGenerated = [];
      state.ui.aiGeneration.sectionsSkipped = [];

      // Process the content
      if (aiResponse.content && typeof aiResponse.content === 'object') {
        Object.entries(aiResponse.content).forEach(([sectionId, sectionData]: [string, any]) => {
          if (sectionData && typeof sectionData === 'object') {
            // Add section to layout if not exists
            if (!state.layout.sections.includes(sectionId)) {
              state.layout.sections.push(sectionId);
            }

            // Create or update section content
            if (!state.content[sectionId]) {
              state.content[sectionId] = {
                id: sectionId,
                layout: 'default', // This should come from your layout logic
                elements: {},
                lastGenerated: Date.now(),
                aiGeneratedElements: [],
              };
            }

            // Update elements
            const section = state.content[sectionId]!;
            const generatedElements: string[] = [];

            Object.entries(sectionData).forEach(([elementKey, elementValue]: [string, any]) => {
              if (elementValue !== undefined && elementValue !== null) {
                section.elements[elementKey] = elementValue;
                generatedElements.push(elementKey);
              }
            });

            // Update metadata
            section.lastGenerated = Date.now();
            section.isCustomized = false;
            section.aiGeneratedElements = generatedElements;

            state.ui.aiGeneration.sectionsGenerated.push(sectionId);
          } else {
            state.ui.aiGeneration.sectionsSkipped.push(sectionId);
          }
        });
      }

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


    })),
    { name: "PageStore" }
  )
);