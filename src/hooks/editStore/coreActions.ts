// hooks/editStore/coreActions.ts - Core content, layout, and UI actions
import type { EditStore, SectionData, ElementSelection } from '@/types/store';
import type { Theme, BackgroundType, ElementType } from '@/types/core/index';

/**
 * Consolidated core actions for content, layout, and UI management
 */
export function createCoreActions(set: any, get: any) {
  return {
    /**
     * ===== LAYOUT ACTIONS =====
     */
    addSection: (sectionId: string, layout: string) =>
      set((state: EditStore) => {
        if (!state.sections.includes(sectionId)) {
          state.sections.push(sectionId);
          state.sectionLayouts[sectionId] = layout;
          state.content[sectionId] = {
            id: sectionId,
            layout,
            elements: {},
            aiMetadata: {
              aiGenerated: false,
              isCustomized: false,
              lastGenerated: Date.now(),
              aiGeneratedElements: [],
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
          state.persistence.isDirty = true;
        }
      }),

    removeSection: (sectionId: string) =>
      set((state: EditStore) => {
        state.sections = state.sections.filter(id => id !== sectionId);
        delete state.sectionLayouts[sectionId];
        delete state.content[sectionId];
        
        // Clear selection if removing selected section
        if (state.selectedSection === sectionId) {
          state.selectedSection = undefined;
          state.selectedElement = undefined;
          state.toolbar.visible = false;
          state.toolbar.type = null;
        }
        
        state.persistence.isDirty = true;
      }),

    moveSection: (from: number, to: number) =>
      set((state: EditStore) => {
        const newSections = [...state.sections];
        const [moved] = newSections.splice(from, 1);
        newSections.splice(to, 0, moved);
        state.sections = newSections;
        state.persistence.isDirty = true;
      }),

    moveSectionUp: (sectionId: string) =>
      set((state: EditStore) => {
        const currentIndex = state.sections.indexOf(sectionId);
        if (currentIndex > 0) {
          const newSections = [...state.sections];
          const [moved] = newSections.splice(currentIndex, 1);
          newSections.splice(currentIndex - 1, 0, moved);
          state.sections = newSections;
          state.persistence.isDirty = true;
        }
      }),

    moveSectionDown: (sectionId: string) =>
      set((state: EditStore) => {
        const currentIndex = state.sections.indexOf(sectionId);
        if (currentIndex < state.sections.length - 1) {
          const newSections = [...state.sections];
          const [moved] = newSections.splice(currentIndex, 1);
          newSections.splice(currentIndex + 1, 0, moved);
          state.sections = newSections;
          state.persistence.isDirty = true;
        }
      }),

    updateSectionLayout: (sectionId: string, layout: string) =>
      set((state: EditStore) => {
        if (state.sectionLayouts[sectionId]) {
          state.sectionLayouts[sectionId] = layout;
          if (state.content[sectionId]) {
            state.content[sectionId].layout = layout;
          }
          state.persistence.isDirty = true;
        }
      }),

    setBackgroundType: (sectionId: string, backgroundType: BackgroundType) =>
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          state.content[sectionId].backgroundType = backgroundType;
          state.persistence.isDirty = true;
        }
      }),

    updateTheme: (themeUpdates: Partial<Theme>) =>
      set((state: EditStore) => {
        state.theme = { ...state.theme, ...themeUpdates };
        state.persistence.isDirty = true;
      }),

    /**
     * ===== CONTENT ACTIONS =====
     */
    setSection: (sectionId: string, updates: Partial<SectionData>) =>
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          Object.assign(state.content[sectionId], updates);
          state.content[sectionId].editMetadata.lastModified = Date.now();
          state.persistence.isDirty = true;
        }
      }),

    updateElementContent: (sectionId: string, elementKey: string, content: any) =>
      set((state: EditStore) => {
        const section = state.content[sectionId];
        if (section && section.elements[elementKey]) {
          section.elements[elementKey].content = content;
          section.editMetadata.lastModified = Date.now();
          state.persistence.isDirty = true;
        }
      }),

    duplicateSection: (sectionId: string) =>
      set((state: EditStore) => {
        const originalSection = state.content[sectionId];
        if (originalSection) {
          const newSectionId = `${sectionId}-copy-${Date.now()}`;
          const newSection = JSON.parse(JSON.stringify(originalSection));
          newSection.id = newSectionId;
          
          // Add to sections array
          const index = state.sections.indexOf(sectionId);
          state.sections.splice(index + 1, 0, newSectionId);
          
          // Add layout and content
          state.sectionLayouts[newSectionId] = state.sectionLayouts[sectionId];
          state.content[newSectionId] = newSection;
          
          state.persistence.isDirty = true;
        }
      }),

    markAsCustomized: (sectionId: string) =>
      set((state: EditStore) => {
        if (state.content[sectionId]?.aiMetadata) {
          state.content[sectionId].aiMetadata.isCustomized = true;
          state.persistence.isDirty = true;
        }
      }),

    /**
     * ===== UI ACTIONS =====
     */
    setMode: (mode: 'preview' | 'edit') =>
      set((state: EditStore) => {
        state.mode = mode;
        if (mode === 'preview') {
          state.selectedSection = undefined;
          state.selectedElement = undefined;
          state.toolbar.visible = false;
          state.toolbar.type = null;
        }
      }),

    setEditMode: (mode: 'section' | 'element' | 'global') =>
      set((state: EditStore) => {
        state.editMode = mode;
        if (mode === 'global') {
          state.selectedSection = undefined;
          state.selectedElement = undefined;
          state.toolbar.visible = false;
          state.toolbar.type = null;
        }
      }),

    setActiveSection: (sectionId?: string) =>
      set((state: EditStore) => {
        state.selectedSection = sectionId;
        if (state.selectedElement && state.selectedElement.sectionId !== sectionId) {
          state.selectedElement = undefined;
          if (state.toolbar.type === 'element') {
            state.toolbar.visible = false;
            state.toolbar.type = null;
          }
        }
        
        // Update section metadata
        Object.values(state.content).forEach(section => {
          if (section.editMetadata) {
            section.editMetadata.isSelected = section.id === sectionId;
          }
        });
      }),

    selectElement: (selection: ElementSelection | null) =>
      set((state: EditStore) => {
        const currentSelection = state.selectedElement;
        const isSameSelection = currentSelection && selection && 
          currentSelection.sectionId === selection.sectionId && 
          currentSelection.elementKey === selection.elementKey;
        
        if (isSameSelection) return;
        
        state.selectedElement = selection || undefined;
        
        if (selection) {
          state.selectedSection = selection.sectionId;
        }
      }),

    /**
     * ===== CHANGE TRACKING =====
     */
    trackChange: (change: any) => {
      set((state: EditStore) => {
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      });
    },

    triggerAutoSave: () => {
      const state = get();
      if (state.persistence.isDirty && !state.persistence.isSaving) {
        setTimeout(async () => {
          try {
            await state.save();
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }, 2000);
      }
    },
  };
}