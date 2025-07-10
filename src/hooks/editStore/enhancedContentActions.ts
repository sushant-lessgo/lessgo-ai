// hooks/editStore/enhancedContentActions.ts - Enhanced content actions with universal element support

import type { EditStore } from '@/types/store';
import type { 
  UniversalElementType, 
  AddElementOptions, 
  RemoveElementOptions,
  DuplicateElementOptions,
  ElementUpdate,
  UNIVERSAL_ELEMENTS 
} from '@/types/universalElements';

// Generate unique IDs
const generateElementKey = (type: UniversalElementType): string => {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Infer element type from element key
const inferElementType = (elementKey: string): UniversalElementType => {
  if (elementKey.includes('headline')) return 'headline';
  if (elementKey.includes('button') || elementKey.includes('cta')) return 'button';
  if (elementKey.includes('image')) return 'image';
  if (elementKey.includes('list')) return 'list';
  if (elementKey.includes('link')) return 'link';
  if (elementKey.includes('icon')) return 'icon';
  if (elementKey.includes('spacer')) return 'spacer';
  if (elementKey.includes('container')) return 'container';
  return 'text';
};

// Enhanced content actions with universal element support
export function createEnhancedContentActions(set: any, get: any) {
  return {
    /**
     * ===== UNIVERSAL ELEMENT MANAGEMENT =====
     */
    
    // Add universal element to section
    addUniversalElement: (
      sectionId: string, 
      elementType: UniversalElementType, 
      options: AddElementOptions = {}
    ): string => {
      const config = UNIVERSAL_ELEMENTS[elementType];
      const elementKey = generateElementKey(elementType);

      set((state: EditStore) => {
        if (!state.content[sectionId]) {
          state.content[sectionId] = {
            id: sectionId,
            layout: state.sectionLayouts[sectionId] || 'default',
            elements: {},
            aiMetadata: {
              aiGenerated: false,
              lastGenerated: Date.now(),
              isCustomized: true,
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
              completionPercentage: 100,
            },
          };
        }

        const newElement = {
          content: options.content ?? config.defaultContent,
          type: elementType,
          isEditable: true,
          editMode: config.toolbarType === 'text' ? 'inline' as const : 'toolbar' as const,
          props: { ...config.defaultProps, ...options.props },
          metadata: {
            addedManually: true,
            addedAt: Date.now(),
            lastModified: Date.now(),
            position: options.position ?? Object.keys(state.content[sectionId].elements).length,
            version: 1,
            elementType,
          },
          validation: {
            isValid: true,
            errors: [],
            warnings: [],
          },
        };

        state.content[sectionId].elements[elementKey] = newElement;
        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;

        // Track change for auto-save
        state.queuedChanges.push({
          id: generateId(),
          type: 'content',
          action: 'add-universal-element',
          sectionId,
          elementKey,
          elementType,
          timestamp: Date.now(),
        });

        // Add to history
        state.history.undoStack.push({
          type: 'content',
          description: `Added ${config.label} element`,
          timestamp: Date.now(),
          beforeState: null,
          afterState: { sectionId, elementKey, elementType },
          sectionId,
        });

        state.history.redoStack = [];
      });

      return elementKey;
    },

    // Remove universal element
    removeUniversalElement: async (
      sectionId: string, 
      elementKey: string, 
      options: RemoveElementOptions = {}
    ): Promise<boolean> => {
      const state = get();
      const section = state.content[sectionId];
      const element = section?.elements?.[elementKey];

      if (!element) return false;

      if (options.confirmRequired && !confirm('Remove this element?')) {
        return false;
      }

      set((state: EditStore) => {
        if (!state.content[sectionId]?.elements?.[elementKey]) return;

        const removedElement = state.content[sectionId].elements[elementKey];
        delete state.content[sectionId].elements[elementKey];

        // Update positions of remaining elements if requested
        if (options.updatePositions) {
          const remainingElements = Object.entries(state.content[sectionId].elements);
          remainingElements.forEach(([key, el], index) => {
            if (el && typeof el === 'object' && 'metadata' in el) {
              (el as any).metadata.position = index;
            }
          });
        }

        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;

        // Track change
        state.queuedChanges.push({
          id: generateId(),
          type: 'content',
          action: 'remove-universal-element',
          sectionId,
          elementKey,
          removedElement,
          timestamp: Date.now(),
        });

        // Add to history
        state.history.undoStack.push({
          type: 'content',
          description: `Removed element ${elementKey}`,
          timestamp: Date.now(),
          beforeState: { sectionId, elementKey, element: removedElement },
          afterState: null,
          sectionId,
        });

        state.history.redoStack = [];
      });

      return true;
    },

    // Duplicate universal element
    duplicateUniversalElement: (
      sectionId: string, 
      elementKey: string, 
      options: DuplicateElementOptions = {}
    ): string => {
      const state = get();
      const section = state.content[sectionId];
      const originalElement = section?.elements?.[elementKey];

      if (!originalElement) return '';

      const newElementKey = options.newElementKey ?? `${elementKey}-copy-${Date.now()}`;

      set((state: EditStore) => {
        if (!state.content[sectionId]?.elements?.[elementKey]) return;

        const original = state.content[sectionId].elements[elementKey] as any;
        const duplicatedElement = {
          ...original,
          content: options.preserveContent !== false
            ? Array.isArray(original.content)
              ? [...original.content]
              : original.content
            : UNIVERSAL_ELEMENTS[original.type]?.defaultContent,
          props: options.preserveProps !== false
            ? { ...original.props }
            : { ...UNIVERSAL_ELEMENTS[original.type]?.defaultProps },
          metadata: {
            addedManually: true,
            addedAt: Date.now(),
            lastModified: Date.now(),
            position: options.targetPosition ?? Object.keys(state.content[sectionId].elements).length,
            version: 1,
            elementType: original.type,
          },
        };

        state.content[sectionId].elements[newElementKey] = duplicatedElement;
        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;

        // Track change
        state.queuedChanges.push({
          id: generateId(),
          type: 'content',
          action: 'duplicate-universal-element',
          sectionId,
          originalElementKey: elementKey,
          newElementKey,
          timestamp: Date.now(),
        });

        // Add to history
        state.history.undoStack.push({
          type: 'content',
          description: `Duplicated element ${elementKey}`,
          timestamp: Date.now(),
          beforeState: null,
          afterState: { sectionId, originalElementKey: elementKey, newElementKey },
          sectionId,
        });

        state.history.redoStack = [];
      });

      return newElementKey;
    },

    // Reorder universal elements
    reorderUniversalElements: (sectionId: string, newOrder: string[]) => {
      set((state: EditStore) => {
        if (!state.content[sectionId]?.elements) return;

        const elements = state.content[sectionId].elements;
        const oldOrder = Object.keys(elements);

        // Update positions based on new order
        newOrder.forEach((elementKey, index) => {
          if (elements[elementKey] && typeof elements[elementKey] === 'object') {
            const element = elements[elementKey] as any;
            if (element.metadata) {
              element.metadata.position = index;
              element.metadata.lastModified = Date.now();
            }
          }
        });

        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;

        // Track change
        state.queuedChanges.push({
          id: generateId(),
          type: 'content',
          action: 'reorder-universal-elements',
          sectionId,
          oldOrder,
          newOrder,
          timestamp: Date.now(),
        });

        // Add to history
        state.history.undoStack.push({
          type: 'content',
          description: `Reordered elements in ${sectionId}`,
          timestamp: Date.now(),
          beforeState: { sectionId, order: oldOrder },
          afterState: { sectionId, order: newOrder },
          sectionId,
        });

        state.history.redoStack = [];
      });
    },

    // Move element up
    moveUniversalElementUp: (sectionId: string, elementKey: string): boolean => {
      const state = get();
      const section = state.content[sectionId];
      if (!section?.elements) return false;

      const elementKeys = Object.keys(section.elements);
      const currentIndex = elementKeys.indexOf(elementKey);

      if (currentIndex <= 0) return false;

      const newOrder = [...elementKeys];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = 
        [newOrder[currentIndex], newOrder[currentIndex - 1]];

      get().reorderUniversalElements(sectionId, newOrder);
      return true;
    },

    // Move element down
    moveUniversalElementDown: (sectionId: string, elementKey: string): boolean => {
      const state = get();
      const section = state.content[sectionId];
      if (!section?.elements) return false;

      const elementKeys = Object.keys(section.elements);
      const currentIndex = elementKeys.indexOf(elementKey);

      if (currentIndex >= elementKeys.length - 1) return false;

      const newOrder = [...elementKeys];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = 
        [newOrder[currentIndex + 1], newOrder[currentIndex]];

      get().reorderUniversalElements(sectionId, newOrder);
      return true;
    },

    // Update element properties
    updateUniversalElementProps: (
      sectionId: string, 
      elementKey: string, 
      props: Record<string, any>
    ) => {
      set((state: EditStore) => {
        if (!state.content[sectionId]?.elements?.[elementKey]) return;

        const element = state.content[sectionId].elements[elementKey] as any;
        const oldProps = { ...element.props };

        element.props = { ...element.props, ...props };
        if (element.metadata) {
          element.metadata.lastModified = Date.now();
        }

        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;

        // Track change
        state.queuedChanges.push({
          id: generateId(),
          type: 'content',
          action: 'update-universal-element-props',
          sectionId,
          elementKey,
          oldProps,
          newProps: element.props,
          timestamp: Date.now(),
        });

        // Add to history
        state.history.undoStack.push({
          type: 'content',
          description: `Updated ${elementKey} properties`,
          timestamp: Date.now(),
          beforeState: { sectionId, elementKey, props: oldProps },
          afterState: { sectionId, elementKey, props: element.props },
          sectionId,
        });

        state.history.redoStack = [];
      });
    },

    // Convert element type
    convertUniversalElementType: (
      sectionId: string, 
      elementKey: string, 
      newType: UniversalElementType
    ): boolean => {
      const state = get();
      const element = state.content[sectionId]?.elements?.[elementKey];
      if (!element) return false;

      const newConfig = UNIVERSAL_ELEMENTS[newType];

      set((state: EditStore) => {
        const element = state.content[sectionId].elements[elementKey] as any;
        const oldType = element.type;

        element.type = newType;
        element.content = newConfig.defaultContent;
        element.props = { ...newConfig.defaultProps };
        element.editMode = newConfig.toolbarType === 'text' ? 'inline' : 'toolbar';
        
        if (element.metadata) {
          element.metadata.lastModified = Date.now();
          element.metadata.elementType = newType;
        }

        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;

        // Track change
        state.queuedChanges.push({
          id: generateId(),
          type: 'content',
          action: 'convert-universal-element-type',
          sectionId,
          elementKey,
          oldType,
          newType,
          timestamp: Date.now(),
        });

        // Add to history
        state.history.undoStack.push({
          type: 'content',
          description: `Converted ${elementKey} to ${newConfig.label}`,
          timestamp: Date.now(),
          beforeState: { sectionId, elementKey, type: oldType },
          afterState: { sectionId, elementKey, type: newType },
          sectionId,
        });

        state.history.redoStack = [];
      });

      return true;
    },

    // Batch update elements
    batchUpdateUniversalElements: (sectionId: string, updates: ElementUpdate[]) => {
      set((state: EditStore) => {
        if (!state.content[sectionId]?.elements) return;

        const elements = state.content[sectionId].elements;
        const oldState = JSON.parse(JSON.stringify(elements));

        updates.forEach(update => {
          const element = elements[update.elementKey];
          if (element && typeof element === 'object') {
            (element as any)[update.field] = update.value;
            if ((element as any).metadata) {
              (element as any).metadata.lastModified = Date.now();
              if (update.metadata) {
                Object.assign((element as any).metadata, update.metadata);
              }
            }
          }
        });

        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;

        // Track change
        state.queuedChanges.push({
          id: generateId(),
          type: 'content',
          action: 'batch-update-universal-elements',
          sectionId,
          updates,
          timestamp: Date.now(),
        });

        // Add to history
        state.history.undoStack.push({
          type: 'content',
          description: `Batch updated ${updates.length} elements`,
          timestamp: Date.now(),
          beforeState: { sectionId, elements: oldState },
          afterState: { sectionId, elements: JSON.parse(JSON.stringify(elements)) },
          sectionId,
        });

        state.history.redoStack = [];
      });
    },

    // Validate universal element
    validateUniversalElement: (sectionId: string, elementKey: string) => {
      const state = get();
      const element = state.content[sectionId]?.elements?.[elementKey] as any;
      
      if (!element) {
        return {
          isValid: false,
          errors: [{ code: 'NOT_FOUND', message: 'Element not found', severity: 'error' }],
          warnings: [],
        };
      }

      const config = UNIVERSAL_ELEMENTS[element.type];
      const errors: any[] = [];
      const warnings: any[] = [];

      // Check required props
      config.requiredProps.forEach(prop => {
        if (!(prop in element.props)) {
          errors.push({
            code: 'MISSING_REQUIRED_PROP',
            message: `Required property '${prop}' is missing`,
            severity: 'error',
            suggestion: `Add the '${prop}' property`,
          });
        }
      });

      // Check content
      const hasContent = element.content &&
        (typeof element.content === 'string' 
          ? element.content.trim().length > 0
          : Array.isArray(element.content) && element.content.length > 0);

      if (!hasContent && element.type !== 'spacer') {
        warnings.push({
          code: 'EMPTY_CONTENT',
          message: 'Element has no content',
          autoFixable: true,
          suggestion: 'Add content to this element',
        });
      }

      const result = {
        isValid: errors.length === 0,
        errors,
        warnings,
      };

      // Update element validation state
      set((state: EditStore) => {
        if (state.content[sectionId]?.elements?.[elementKey]) {
          const element = state.content[sectionId].elements[elementKey] as any;
          if (element.validation) {
            element.validation = result;
          }
        }
      });

      return result;
    },

    // Get universal elements by type
    getUniversalElementsByType: (sectionId: string, elementType: UniversalElementType) => {
      const state = get();
      const section = state.content[sectionId];
      if (!section?.elements) return [];

      return Object.entries(section.elements)
        .filter(([_, element]) => (element as any).type === elementType)
        .map(([elementKey, element]) => ({ elementKey, element }));
    },

    // Get universal elements summary
    getUniversalElementsSummary: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      if (!section?.elements) return null;

      const elements = Object.entries(section.elements);
      const summary = {
        total: elements.length,
        byType: {} as Record<UniversalElementType, number>,
        byCategory: {} as Record<string, number>,
        hasContent: 0,
        hasErrors: 0,
        addedManually: 0,
      };

      elements.forEach(([_, element]) => {
        const el = element as any;
        const type = el.type as UniversalElementType;
        
        // Count by type
        summary.byType[type] = (summary.byType[type] || 0) + 1;
        
        // Count by category
        const category = UNIVERSAL_ELEMENTS[type]?.category || 'unknown';
        summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;
        
        // Check content
        if (el.content && 
            (typeof el.content === 'string' 
              ? el.content.trim().length > 0
              : Array.isArray(el.content) && el.content.length > 0)) {
          summary.hasContent++;
        }
        
        // Check errors
        if (el.validation?.errors?.length > 0) {
          summary.hasErrors++;
        }

        // Check if added manually
        if (el.metadata?.addedManually) {
          summary.addedManually++;
        }
      });

      return summary;
    },

    // Export universal elements
    exportUniversalElements: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      if (!section?.elements) return null;

      return {
        sectionId,
        elements: Object.entries(section.elements).map(([elementKey, element]) => ({
          elementKey,
          ...(element as any),
        })),
        exportedAt: Date.now(),
      };
    },

    // Import universal elements
    importUniversalElements: (sectionId: string, importData: any) => {
      if (!importData?.elements) return false;

      set((state: EditStore) => {
        if (!state.content[sectionId]) {
          state.content[sectionId] = {
            id: sectionId,
            layout: state.sectionLayouts[sectionId] || 'default',
            elements: {},
            aiMetadata: {
              aiGenerated: false,
              lastGenerated: Date.now(),
              isCustomized: true,
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
              completionPercentage: 100,
            },
          };
        }

        const oldElements = { ...state.content[sectionId].elements };

        importData.elements.forEach((elementData: any) => {
          const elementKey = elementData.elementKey || generateElementKey(elementData.type);
          const { elementKey: _, ...elementWithoutKey } = elementData;
          
          state.content[sectionId].elements[elementKey] = {
            ...elementWithoutKey,
            metadata: {
              ...elementWithoutKey.metadata,
              lastModified: Date.now(),
            },
          };
        });

        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;

        // Track change
        state.queuedChanges.push({
          id: generateId(),
          type: 'content',
          action: 'import-universal-elements',
          sectionId,
          importData,
          timestamp: Date.now(),
        });

        // Add to history
        state.history.undoStack.push({
          type: 'content',
          description: `Imported ${importData.elements.length} elements`,
          timestamp: Date.now(),
          beforeState: { sectionId, elements: oldElements },
          afterState: { sectionId, elements: state.content[sectionId].elements },
          sectionId,
        });

        state.history.redoStack = [];
      });

      return true;
    },
  };
}