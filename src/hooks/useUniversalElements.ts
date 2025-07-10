// hooks/useUniversalElements.ts - Universal element management system

import { useCallback, useMemo } from 'react';
import { useEditStore } from './useEditStore';
import type {
  UniversalElementType,
  UniversalElementInstance,
  UniversalElementConfig,
  AddElementOptions,
  RemoveElementOptions,
  DuplicateElementOptions,
  CreateElementRequest,
  ElementUpdate,
  ElementSearchCriteria,
  ElementValidationResult,
  ElementTemplate,
  ValidationError,
  ValidationWarning,
  UNIVERSAL_ELEMENTS,
} from '@/types/universalElements';

const generateElementKey = (type: UniversalElementType): string => {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateElementId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export function useUniversalElements() {
  const {
    content,
    updateElementContent,
    setSection,
    trackChange,
    triggerAutoSave,
    announceLiveRegion,
  } = useEditStore();

  // Element Creation
  const createElement = useCallback((
    sectionId: string,
    type: UniversalElementType,
    options: AddElementOptions = {}
  ): UniversalElementInstance => {
    const config = UNIVERSAL_ELEMENTS[type];
    const elementKey = generateElementKey(type);
    const elementId = generateElementId();

    const instance: UniversalElementInstance = {
      id: elementId,
      elementKey,
      sectionId,
      type,
      content: options.content ?? config.defaultContent,
      props: { ...config.defaultProps, ...options.props },
      metadata: {
        addedManually: true,
        addedAt: Date.now(),
        lastModified: Date.now(),
        position: options.position ?? 0,
        version: 1,
      },
      editState: {
        isSelected: false,
        isEditing: false,
        isDirty: false,
        hasErrors: false,
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };

    return instance;
  }, []);

  const createFromTemplate = useCallback((
    sectionId: string,
    template: ElementTemplate
  ): UniversalElementInstance => {
    return createElement(sectionId, template.type, {
      content: template.content,
      props: template.props,
    });
  }, [createElement]);

  // Element Retrieval
  const getElement = useCallback((
    sectionId: string,
    elementKey: string
  ): UniversalElementInstance | null => {
    const section = content[sectionId];
    if (!section?.elements?.[elementKey]) return null;

    const element = section.elements[elementKey];
    
    return {
      id: `${sectionId}.${elementKey}`,
      elementKey,
      sectionId,
      type: (element as any).type || 'text',
      content: (element as any).content || '',
      props: (element as any).props || {},
      metadata: {
        addedManually: true,
        addedAt: Date.now(),
        lastModified: Date.now(),
        position: 0,
        version: 1,
      },
      editState: {
        isSelected: false,
        isEditing: false,
        isDirty: false,
        hasErrors: false,
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };
  }, [content]);

  const getAllElements = useCallback((sectionId: string): UniversalElementInstance[] => {
    const section = content[sectionId];
    if (!section?.elements) return [];

    return Object.keys(section.elements).map(elementKey => 
      getElement(sectionId, elementKey)
    ).filter(Boolean) as UniversalElementInstance[];
  }, [content, getElement]);

  const getElementsByType = useCallback((
    sectionId: string,
    type: UniversalElementType
  ): UniversalElementInstance[] => {
    return getAllElements(sectionId).filter(element => element.type === type);
  }, [getAllElements]);

  // Element Updates
  const updateElementPosition = useCallback((
    sectionId: string,
    elementKey: string,
    newPosition: number
  ) => {
    const section = content[sectionId];
    if (!section?.elements?.[elementKey]) return;

    const updatedElements = { ...section.elements };
    const element = updatedElements[elementKey];
    
    if (element && typeof element === 'object') {
      (element as any).metadata = {
        ...(element as any).metadata,
        position: newPosition,
        lastModified: Date.now(),
      };
    }

    setSection(sectionId, { elements: updatedElements });
    trackChange({
      type: 'content',
      action: 'update-element-position',
      sectionId,
      elementKey,
      newPosition,
      timestamp: Date.now(),
    });
  }, [content, setSection, trackChange]);

  const updateElementProps = useCallback((
    sectionId: string,
    elementKey: string,
    props: Record<string, any>
  ) => {
    const section = content[sectionId];
    if (!section?.elements?.[elementKey]) return;

    const updatedElements = { ...section.elements };
    const element = updatedElements[elementKey];
    
    if (element && typeof element === 'object') {
      (element as any).props = {
        ...(element as any).props,
        ...props,
      };
      (element as any).metadata = {
        ...(element as any).metadata,
        lastModified: Date.now(),
      };
    }

    setSection(sectionId, { elements: updatedElements });
    trackChange({
      type: 'content',
      action: 'update-element-props',
      sectionId,
      elementKey,
      props,
      timestamp: Date.now(),
    });
  }, [content, setSection, trackChange]);

  // Element Addition
  const addElement = useCallback((
    sectionId: string,
    elementType: UniversalElementType,
    options: AddElementOptions = {}
  ): string => {
    const config = UNIVERSAL_ELEMENTS[elementType];
    const elementKey = generateElementKey(elementType);

    const section = content[sectionId];
    if (!section) return '';

    const newElement = {
      content: options.content ?? config.defaultContent,
      type: elementType,
      isEditable: true,
      editMode: 'inline' as const,
      props: { ...config.defaultProps, ...options.props },
      metadata: {
        addedManually: true,
        addedAt: Date.now(),
        lastModified: Date.now(),
        position: options.position ?? Object.keys(section.elements || {}).length,
        version: 1,
      },
    };

    const updatedElements = {
      ...section.elements,
      [elementKey]: newElement,
    };

    setSection(sectionId, { elements: updatedElements });

    trackChange({
      type: 'content',
      action: 'add-element',
      sectionId,
      elementKey,
      elementType,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Added ${config.label} element`);

    return elementKey;
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  const addElementFromTemplate = useCallback((
    sectionId: string,
    template: ElementTemplate
  ): string => {
    return addElement(sectionId, template.type, {
      content: template.content,
      props: template.props,
    });
  }, [addElement]);

  const addMultipleElements = useCallback((
    sectionId: string,
    elements: CreateElementRequest[]
  ): string[] => {
    const elementKeys: string[] = [];

    elements.forEach((elementRequest, index) => {
      const elementKey = addElement(sectionId, elementRequest.type, {
        content: elementRequest.content,
        props: elementRequest.props,
        position: elementRequest.position ?? index,
      });
      if (elementKey) {
        elementKeys.push(elementKey);
      }
    });

    return elementKeys;
  }, [addElement]);

  // Element Removal
  const removeElement = useCallback(async (
    sectionId: string,
    elementKey: string,
    options: RemoveElementOptions = {}
  ): Promise<boolean> => {
    const section = content[sectionId];
    if (!section?.elements?.[elementKey]) return false;

    if (options.confirmRequired && !confirm('Remove this element?')) {
      return false;
    }

    const { [elementKey]: removed, ...remainingElements } = section.elements;

    setSection(sectionId, { elements: remainingElements });

    trackChange({
      type: 'content',
      action: 'remove-element',
      sectionId,
      elementKey,
      removedElement: removed,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Removed element`);

    return true;
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  const removeElements = useCallback(async (
    sectionId: string,
    elementKeys: string[]
  ): Promise<boolean[]> => {
    const results = await Promise.all(
      elementKeys.map(elementKey => removeElement(sectionId, elementKey))
    );
    return results;
  }, [removeElement]);

  const removeAllElements = useCallback(async (sectionId: string): Promise<boolean> => {
    const section = content[sectionId];
    if (!section?.elements) return false;

    setSection(sectionId, { elements: {} });

    trackChange({
      type: 'content',
      action: 'remove-all-elements',
      sectionId,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Removed all elements from section`);

    return true;
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  // Element Duplication
  const duplicateElement = useCallback((
    sectionId: string,
    elementKey: string,
    options: DuplicateElementOptions = {}
  ): string => {
    const section = content[sectionId];
    const originalElement = section?.elements?.[elementKey];
    
    if (!originalElement) return '';

    const newElementKey = options.newElementKey ?? `${elementKey}-copy-${Date.now()}`;
    const duplicatedElement = {
      ...(originalElement as any),
      content: options.preserveContent !== false
        ? Array.isArray((originalElement as any).content)
          ? [...(originalElement as any).content]
          : (originalElement as any).content
        : UNIVERSAL_ELEMENTS[(originalElement as any).type]?.defaultContent,
      props: options.preserveProps !== false
        ? { ...(originalElement as any).props }
        : { ...UNIVERSAL_ELEMENTS[(originalElement as any).type]?.defaultProps },
      metadata: {
        addedManually: true,
        addedAt: Date.now(),
        lastModified: Date.now(),
        position: options.targetPosition ?? Object.keys(section.elements || {}).length,
        version: 1,
      },
    };

    const updatedElements = {
      ...section.elements,
      [newElementKey]: duplicatedElement,
    };

    setSection(sectionId, { elements: updatedElements });

    trackChange({
      type: 'content',
      action: 'duplicate-element',
      sectionId,
      originalElementKey: elementKey,
      newElementKey,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Duplicated element`);

    return newElementKey;
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  const duplicateElements = useCallback((
    sectionId: string,
    elementKeys: string[]
  ): string[] => {
    return elementKeys.map(elementKey => duplicateElement(sectionId, elementKey));
  }, [duplicateElement]);

  // Element Reordering
  const reorderElements = useCallback((
    sectionId: string,
    newOrder: string[]
  ) => {
    const section = content[sectionId];
    if (!section?.elements) return;

    const updatedElements = { ...section.elements };
    
    newOrder.forEach((elementKey, index) => {
      if (updatedElements[elementKey]) {
        const element = updatedElements[elementKey];
        if (element && typeof element === 'object') {
          (element as any).metadata = {
            ...(element as any).metadata,
            position: index,
            lastModified: Date.now(),
          };
        }
      }
    });

    setSection(sectionId, { elements: updatedElements });

    trackChange({
      type: 'content',
      action: 'reorder-elements',
      sectionId,
      newOrder,
      timestamp: Date.now(),
    });

    triggerAutoSave();
  }, [content, setSection, trackChange, triggerAutoSave]);

  const moveElementUp = useCallback((
    sectionId: string,
    elementKey: string
  ): boolean => {
    const elements = getAllElements(sectionId);
    const currentIndex = elements.findIndex(el => el.elementKey === elementKey);
    
    if (currentIndex <= 0) return false;

    const newOrder = elements.map(el => el.elementKey);
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    
    reorderElements(sectionId, newOrder);
    return true;
  }, [getAllElements, reorderElements]);

  const moveElementDown = useCallback((
    sectionId: string,
    elementKey: string
  ): boolean => {
    const elements = getAllElements(sectionId);
    const currentIndex = elements.findIndex(el => el.elementKey === elementKey);
    
    if (currentIndex >= elements.length - 1) return false;

    const newOrder = elements.map(el => el.elementKey);
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    
    reorderElements(sectionId, newOrder);
    return true;
  }, [getAllElements, reorderElements]);

  const moveElementToPosition = useCallback((
    sectionId: string,
    elementKey: string,
    targetPosition: number
  ): boolean => {
    const elements = getAllElements(sectionId);
    const currentIndex = elements.findIndex(el => el.elementKey === elementKey);
    
    if (currentIndex === -1 || targetPosition < 0 || targetPosition >= elements.length) {
      return false;
    }

    const newOrder = elements.map(el => el.elementKey);
    const [movedElement] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetPosition, 0, movedElement);
    
    reorderElements(sectionId, newOrder);
    return true;
  }, [getAllElements, reorderElements]);

  // Cross-section operations
  const moveElementToSection = useCallback((
    fromSectionId: string,
    toSectionId: string,
    elementKey: string,
    position?: number
  ): boolean => {
    const fromSection = content[fromSectionId];
    const toSection = content[toSectionId];
    const element = fromSection?.elements?.[elementKey];

    if (!element || !toSection) return false;

    // Remove from source section
    const { [elementKey]: moved, ...remainingElements } = fromSection.elements;
    setSection(fromSectionId, { elements: remainingElements });

    // Add to target section
    const targetPosition = position ?? Object.keys(toSection.elements || {}).length;
    const newElementKey = generateElementKey((element as any).type);
    
    const updatedElement = {
      ...(element as any),
      metadata: {
        ...(element as any).metadata,
        position: targetPosition,
        lastModified: Date.now(),
      },
    };

    const updatedToElements = {
      ...toSection.elements,
      [newElementKey]: updatedElement,
    };

    setSection(toSectionId, { elements: updatedToElements });

    trackChange({
      type: 'content',
      action: 'move-element-to-section',
      fromSectionId,
      toSectionId,
      elementKey,
      newElementKey,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Moved element to another section`);

    return true;
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  const copyElementToSection = useCallback((
    fromSectionId: string,
    toSectionId: string,
    elementKey: string,
    position?: number
  ): string => {
    const fromSection = content[fromSectionId];
    const toSection = content[toSectionId];
    const element = fromSection?.elements?.[elementKey];

    if (!element || !toSection) return '';

    const targetPosition = position ?? Object.keys(toSection.elements || {}).length;
    const newElementKey = generateElementKey((element as any).type);
    
    const copiedElement = {
      ...(element as any),
      content: Array.isArray((element as any).content)
        ? [...(element as any).content]
        : (element as any).content,
      props: { ...(element as any).props },
      metadata: {
        addedManually: true,
        addedAt: Date.now(),
        lastModified: Date.now(),
        position: targetPosition,
        version: 1,
      },
    };

    const updatedElements = {
      ...toSection.elements,
      [newElementKey]: copiedElement,
    };

    setSection(toSectionId, { elements: updatedElements });

    trackChange({
      type: 'content',
      action: 'copy-element-to-section',
      fromSectionId,
      toSectionId,
      elementKey,
      newElementKey,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Copied element to another section`);

    return newElementKey;
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  // Element Validation
  const validateElement = useCallback((
    sectionId: string,
    elementKey: string
  ): ElementValidationResult => {
    const element = getElement(sectionId, elementKey);
    
    if (!element) {
      return {
        elementKey,
        isValid: false,
        errors: [{ code: 'NOT_FOUND', message: 'Element not found', severity: 'error' }],
        warnings: [],
        hasRequiredContent: false,
        propsValid: false,
      };
    }

    const config = UNIVERSAL_ELEMENTS[element.type];
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

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
    const hasRequiredContent = element.content &&
      (typeof element.content === 'string' 
        ? element.content.trim().length > 0
        : Array.isArray(element.content) && element.content.length > 0);

    if (!hasRequiredContent && element.type !== 'spacer') {
      warnings.push({
        code: 'EMPTY_CONTENT',
        message: 'Element has no content',
        autoFixable: true,
        suggestion: 'Add content to this element',
      });
    }

    return {
      elementKey,
      isValid: errors.length === 0,
      errors,
      warnings,
      hasRequiredContent: !!hasRequiredContent,
      propsValid: errors.filter(e => e.code === 'MISSING_REQUIRED_PROP').length === 0,
    };
  }, [getElement]);

  const validateAllElements = useCallback((sectionId: string): ElementValidationResult[] => {
    const elements = getAllElements(sectionId);
    return elements.map(element => validateElement(sectionId, element.elementKey));
  }, [getAllElements, validateElement]);

  // Search and Filtering
  const searchElements = useCallback((
    criteria: ElementSearchCriteria
  ): UniversalElementInstance[] => {
    const sectionsToSearch = criteria.sectionId ? [criteria.sectionId] : Object.keys(content);
    const results: UniversalElementInstance[] = [];

    sectionsToSearch.forEach(sectionId => {
      const elements = getAllElements(sectionId);
      
      elements.forEach(element => {
        let matches = true;

        if (criteria.elementType && element.type !== criteria.elementType) {
          matches = false;
        }

        if (criteria.contentContains && typeof element.content === 'string') {
          if (!element.content.toLowerCase().includes(criteria.contentContains.toLowerCase())) {
            matches = false;
          }
        }

        if (criteria.propsMatch) {
          for (const [key, value] of Object.entries(criteria.propsMatch)) {
            if (element.props[key] !== value) {
              matches = false;
              break;
            }
          }
        }

        if (criteria.dateRange) {
          if (element.metadata.addedAt < criteria.dateRange.start || 
              element.metadata.addedAt > criteria.dateRange.end) {
            matches = false;
          }
        }

        if (matches) {
          results.push(element);
        }
      });
    });

    return results;
  }, [content, getAllElements]);

  const filterElementsByType = useCallback((
    sectionId: string,
    types: UniversalElementType[]
  ): UniversalElementInstance[] => {
    return getAllElements(sectionId).filter(element => types.includes(element.type));
  }, [getAllElements]);

  // Element Templates
  const saveElementAsTemplate = useCallback((
    sectionId: string,
    elementKey: string,
    templateName: string
  ): ElementTemplate => {
    const element = getElement(sectionId, elementKey);
    
    if (!element) {
      throw new Error('Element not found');
    }

    const template: ElementTemplate = {
      id: generateElementId(),
      name: templateName,
      type: element.type,
      content: Array.isArray(element.content) 
        ? [...element.content] 
        : element.content,
      props: { ...element.props },
      category: UNIVERSAL_ELEMENTS[element.type].category,
      tags: [element.type, UNIVERSAL_ELEMENTS[element.type].category],
      createdAt: Date.now(),
    };

    announceLiveRegion(`Saved ${templateName} as template`);
    return template;
  }, [getElement, announceLiveRegion]);

  const loadElementFromTemplate = useCallback((
    sectionId: string,
    template: ElementTemplate,
    position?: number
  ): string => {
    return addElement(sectionId, template.type, {
      content: template.content,
      props: template.props,
      position,
    });
  }, [addElement]);

  // Batch Operations
  const batchUpdateElements = useCallback((
    sectionId: string,
    updates: ElementUpdate[]
  ) => {
    const section = content[sectionId];
    if (!section?.elements) return;

    const updatedElements = { ...section.elements };
    
    updates.forEach(update => {
      const element = updatedElements[update.elementKey];
      if (element && typeof element === 'object') {
        (element as any)[update.field] = update.value;
        (element as any).metadata = {
          ...(element as any).metadata,
          lastModified: Date.now(),
          ...update.metadata,
        };
      }
    });

    setSection(sectionId, { elements: updatedElements });

    trackChange({
      type: 'content',
      action: 'batch-update-elements',
      sectionId,
      updates,
      timestamp: Date.now(),
    });

    triggerAutoSave();
  }, [content, setSection, trackChange, triggerAutoSave]);

  const batchDeleteElements = useCallback(async (
    sectionId: string,
    elementKeys: string[]
  ): Promise<boolean> => {
    const section = content[sectionId];
    if (!section?.elements) return false;

    const remainingElements = { ...section.elements };
    
    elementKeys.forEach(elementKey => {
      delete remainingElements[elementKey];
    });

    setSection(sectionId, { elements: remainingElements });

    trackChange({
      type: 'content',
      action: 'batch-delete-elements',
      sectionId,
      elementKeys,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Removed ${elementKeys.length} elements`);

    return true;
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  // Element Conversion
  const convertElementType = useCallback((
    sectionId: string,
    elementKey: string,
    newType: UniversalElementType
  ): boolean => {
    const element = getElement(sectionId, elementKey);
    if (!element) return false;

    const newConfig = UNIVERSAL_ELEMENTS[newType];
    const section = content[sectionId];
    
    if (!section?.elements?.[elementKey]) return false;

    const updatedElement = {
      ...(section.elements[elementKey] as any),
      type: newType,
      content: newConfig.defaultContent,
      props: { ...newConfig.defaultProps },
      metadata: {
        ...(section.elements[elementKey] as any).metadata,
        lastModified: Date.now(),
      },
    };

    const updatedElements = {
      ...section.elements,
      [elementKey]: updatedElement,
    };

    setSection(sectionId, { elements: updatedElements });

    trackChange({
      type: 'content',
      action: 'convert-element-type',
      sectionId,
      elementKey,
      oldType: element.type,
      newType,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Converted element to ${newConfig.label}`);

    return true;
  }, [getElement, content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  const convertToTemplate = useCallback((
    sectionId: string,
    elementKey: string
  ): ElementTemplate => {
    const element = getElement(sectionId, elementKey);
    
    if (!element) {
      throw new Error('Element not found');
    }

    return saveElementAsTemplate(sectionId, elementKey, `Template from ${element.type}`);
  }, [getElement, saveElementAsTemplate]);

  // Utility functions
  const getElementOrder = useCallback((sectionId: string): string[] => {
    const elements = getAllElements(sectionId);
    return elements
      .sort((a, b) => a.metadata.position - b.metadata.position)
      .map(element => element.elementKey);
  }, [getAllElements]);

  const getElementCount = useCallback((sectionId: string): number => {
    return getAllElements(sectionId).length;
  }, [getAllElements]);

  const getElementsByCategory = useCallback((
    sectionId: string,
    category: 'text' | 'interactive' | 'media' | 'layout'
  ): UniversalElementInstance[] => {
    return getAllElements(sectionId).filter(element => 
      UNIVERSAL_ELEMENTS[element.type].category === category
    );
  }, [getAllElements]);

  const getSectionElementSummary = useCallback((sectionId: string) => {
    const elements = getAllElements(sectionId);
    const summary = {
      total: elements.length,
      byType: {} as Record<UniversalElementType, number>,
      byCategory: {} as Record<string, number>,
      hasContent: 0,
      hasErrors: 0,
    };

    elements.forEach(element => {
      // Count by type
      summary.byType[element.type] = (summary.byType[element.type] || 0) + 1;
      
      // Count by category
      const category = UNIVERSAL_ELEMENTS[element.type].category;
      summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;
      
      // Check content
      if (element.content && 
          (typeof element.content === 'string' 
            ? element.content.trim().length > 0
            : Array.isArray(element.content) && element.content.length > 0)) {
        summary.hasContent++;
      }
      
      // Check errors
      if (element.validation.errors.length > 0) {
        summary.hasErrors++;
      }
    });

    return summary;
  }, [getAllElements]);

  // Memoized element configurations
  const elementConfigs = useMemo(() => UNIVERSAL_ELEMENTS, []);

  const elementConfigsByCategory = useMemo(() => {
    const categories: Record<string, UniversalElementConfig[]> = {};
    
    Object.values(UNIVERSAL_ELEMENTS).forEach(config => {
      if (!categories[config.category]) {
        categories[config.category] = [];
      }
      categories[config.category].push(config);
    });
    
    return categories;
  }, []);

  return {
    // Element creation
    createElement,
    createFromTemplate,
    
    // Element retrieval
    getElement,
    getAllElements,
    getElementsByType,
    
    // Element updates
    updateElementPosition,
    updateElementProps,
    
    // Element addition
    addElement,
    addElementFromTemplate,
    addMultipleElements,
    
    // Element removal
    removeElement,
    removeElements,
    removeAllElements,
    
    // Element duplication
    duplicateElement,
    duplicateElements,
    
    // Element reordering
    reorderElements,
    moveElementUp,
    moveElementDown,
    moveElementToPosition,
    
    // Cross-section operations
    moveElementToSection,
    copyElementToSection,
    
    // Element validation
    validateElement,
    validateAllElements,
    
    // Search and filtering
    searchElements,
    filterElementsByType,
    
    // Element templates
    saveElementAsTemplate,
    loadElementFromTemplate,
    
    // Batch operations
    batchUpdateElements,
    batchDeleteElements,
    
    // Element conversion
    convertElementType,
    convertToTemplate,
    
    // Utility functions
    getElementOrder,
    getElementCount,
    getElementsByCategory,
    getSectionElementSummary,
    
    // Configuration
    elementConfigs,
    elementConfigsByCategory,
  };
}