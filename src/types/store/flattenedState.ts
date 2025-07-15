// types/store/flattenedState.ts - Normalized/flattened state structure for better performance

/**
 * Normalized store structure to reduce deep nesting and improve Immer performance
 */

// Core entity types
export interface FlatSection {
  id: string;
  layout: string;
  backgroundType?: string;
  elementIds: string[]; // Array of element IDs instead of nested objects
  aiGenerated: boolean;
  isCustomized: boolean;
  lastModified: number;
  isSelected: boolean;
}

export interface FlatElement {
  id: string;
  sectionId: string;
  type: string;
  content: string | string[] | number | boolean;
  isEditable: boolean;
  editMode: 'inline' | 'modal';
  aiGenerated?: boolean;
  lastModified: number;
}

export interface FlatForm {
  id: string;
  sectionId?: string;
  elementId?: string;
  fieldIds: string[];
  settings: Record<string, any>;
}

export interface FlatFormField {
  id: string;
  formId: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  validation: Record<string, any>;
  options?: string[];
}

export interface FlatImage {
  id: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  uploadedAt: number;
}

// Flattened state structure
export interface FlattenedEditState {
  // Core content - normalized
  entities: {
    sections: Record<string, FlatSection>;
    elements: Record<string, FlatElement>;
    forms: Record<string, FlatForm>;
    formFields: Record<string, FlatFormField>;
    images: Record<string, FlatImage>;
  };
  
  // Ordered lists for maintaining sequence
  sectionOrder: string[];
  sectionLayouts: Record<string, string>;
  
  // UI state (separate from content)
  ui: {
    mode: 'preview' | 'edit';
    editMode: 'section' | 'element' | 'global';
    selectedSectionId: string | null;
    selectedElementId: string | null;
    
    // Simplified toolbar
    toolbar: {
      type: 'section' | 'element' | 'text' | 'image' | 'form' | null;
      visible: boolean;
      targetId: string | null;
      actions: string[];
    };
    
    leftPanel: {
      width: number;
      collapsed: boolean;
      activeTab: 'pageStructure' | 'styles' | 'settings';
    };
  };
  
  // Theme and settings
  theme: Record<string, any>;
  globalSettings: Record<string, any>;
  
  // Meta data
  meta: {
    id: string;
    title: string;
    slug: string;
    tokenId: string;
    lastUpdated: number;
    version: number;
  };
  
  // Onboarding
  onboarding: {
    oneLiner: string;
    validatedFields: Record<string, any>;
    featuresFromAI: string[];
    hiddenInferredFields: Record<string, any>;
    confirmedFields: Record<string, any>;
  };
  
  // AI generation state
  ai: {
    isGenerating: boolean;
    currentOperation: 'section' | 'element' | 'page' | null;
    progress: number;
    status: string;
    errors: string[];
  };
  
  // Persistence
  persistence: {
    isDirty: boolean;
    isSaving: boolean;
    isLoading: boolean;
    lastSaved?: number;
    saveError?: string;
    loadError?: string;
  };
}

/**
 * Migration utilities to convert between nested and flat structures
 */

export interface LegacySectionData {
  id: string;
  layout: string;
  elements: Record<string, any>;
  backgroundType?: string;
  aiMetadata?: any;
  editMetadata?: any;
}

export function migrateLegacyToFlat(legacyState: any): Partial<FlattenedEditState> {
  const flatState: Partial<FlattenedEditState> = {
    entities: {
      sections: {},
      elements: {},
      forms: {},
      formFields: {},
      images: {},
    },
    sectionOrder: [],
    ui: {
      mode: legacyState.mode || 'edit',
      editMode: legacyState.editMode || 'section',
      selectedSectionId: legacyState.selectedSection || null,
      selectedElementId: legacyState.selectedElement?.elementKey ? 
        `${legacyState.selectedElement.sectionId}.${legacyState.selectedElement.elementKey}` : null,
      toolbar: {
        type: legacyState.toolbar?.type || null,
        visible: legacyState.toolbar?.visible || false,
        targetId: legacyState.toolbar?.targetId || null,
        actions: legacyState.toolbar?.actions || [],
      },
      leftPanel: legacyState.leftPanel || {
        width: 300,
        collapsed: false,
        activeTab: 'pageStructure',
      },
    },
  };
  
  // Migrate sections and elements
  if (legacyState.sections && Array.isArray(legacyState.sections)) {
    flatState.sectionOrder = [...legacyState.sections];
    
    // Convert section content
    legacyState.sections.forEach((sectionId: string) => {
      const legacySection = legacyState.content?.[sectionId] as LegacySectionData;
      if (legacySection) {
        // Create flat section
        const elementIds: string[] = [];
        
        // Convert elements
        if (legacySection.elements) {
          Object.entries(legacySection.elements).forEach(([elementKey, elementData]: [string, any]) => {
            const elementId = `${sectionId}.${elementKey}`;
            elementIds.push(elementId);
            
            flatState.entities!.elements[elementId] = {
              id: elementId,
              sectionId,
              type: elementData.type || 'text',
              content: elementData.content || '',
              isEditable: elementData.isEditable !== false,
              editMode: elementData.editMode || 'inline',
              aiGenerated: elementData.aiMetadata?.aiGenerated || false,
              lastModified: Date.now(),
            };
          });
        }
        
        // Create flat section
        flatState.entities!.sections[sectionId] = {
          id: sectionId,
          layout: legacySection.layout || 'default',
          backgroundType: legacySection.backgroundType,
          elementIds,
          aiGenerated: legacySection.aiMetadata?.aiGenerated || false,
          isCustomized: legacySection.aiMetadata?.isCustomized || false,
          lastModified: legacySection.editMetadata?.lastModified || Date.now(),
          isSelected: legacySection.editMetadata?.isSelected || false,
        };
      }
    });
  }
  
  return flatState;
}

export function migrateFlatToLegacy(flatState: FlattenedEditState): any {
  const legacyState: any = {
    sections: [...flatState.sectionOrder],
    sectionLayouts: {},
    content: {},
    mode: flatState.ui.mode,
    editMode: flatState.ui.editMode,
    selectedSection: flatState.ui.selectedSectionId,
    selectedElement: flatState.ui.selectedElementId ? {
      sectionId: flatState.ui.selectedElementId.split('.')[0],
      elementKey: flatState.ui.selectedElementId.split('.')[1],
    } : undefined,
    toolbar: flatState.ui.toolbar,
    leftPanel: flatState.ui.leftPanel,
  };
  
  // Convert sections back to nested structure
  Object.values(flatState.entities.sections).forEach(section => {
    legacyState.sectionLayouts[section.id] = section.layout;
    
    const elements: Record<string, any> = {};
    section.elementIds.forEach(elementId => {
      const element = flatState.entities.elements[elementId];
      if (element) {
        const elementKey = elementId.split('.')[1];
        elements[elementKey] = {
          content: element.content,
          type: element.type,
          isEditable: element.isEditable,
          editMode: element.editMode,
          aiMetadata: {
            aiGenerated: element.aiGenerated,
          },
        };
      }
    });
    
    legacyState.content[section.id] = {
      id: section.id,
      layout: section.layout,
      elements,
      backgroundType: section.backgroundType,
      aiMetadata: {
        aiGenerated: section.aiGenerated,
        isCustomized: section.isCustomized,
      },
      editMetadata: {
        isSelected: section.isSelected,
        lastModified: section.lastModified,
      },
    };
  });
  
  return legacyState;
}

/**
 * Performance-optimized selectors for flat state
 */
export function selectSection(state: FlattenedEditState, sectionId: string): FlatSection | undefined {
  return state.entities.sections[sectionId];
}

export function selectSectionElements(state: FlattenedEditState, sectionId: string): FlatElement[] {
  const section = selectSection(state, sectionId);
  if (!section) return [];
  
  return section.elementIds
    .map(elementId => state.entities.elements[elementId])
    .filter(Boolean);
}

export function selectElement(state: FlattenedEditState, elementId: string): FlatElement | undefined {
  return state.entities.elements[elementId];
}

export function selectAllSections(state: FlattenedEditState): FlatSection[] {
  return state.sectionOrder
    .map(sectionId => state.entities.sections[sectionId])
    .filter(Boolean);
}