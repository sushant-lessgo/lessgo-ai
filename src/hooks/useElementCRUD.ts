// hooks/useElementCRUD.ts - Element CRUD operations hook

import { useCallback } from 'react';
import { useEditStore } from './useEditStore';
import { UNIVERSAL_ELEMENTS } from '@/types/universalElements';
import type { 
  UniversalElementType, 
  UniversalElementInstance, 
  AddElementOptions,
  RemoveElementOptions,
  DuplicateElementOptions,
  ElementUpdate,
  ElementSearchCriteria,
  ElementValidationResult,
  ElementTemplate
} from '@/types/universalElements';

const generateElementKey = (type: UniversalElementType, position: number = 0) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${type}_${position}_${timestamp}_${random}`;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useElementCRUD() {
  const { 
    content, 
    updateElementContent, 
    trackChange, 
    announceLiveRegion,
    history,
    autoSave 
  } = useEditStore();

  // Create element instance
  const createElement = useCallback((
    sectionId: string, 
    type: UniversalElementType, 
    options?: AddElementOptions
  ): UniversalElementInstance => {
    const config = UNIVERSAL_ELEMENTS[type];
    const elementKey = generateElementKey(type, options?.position || 0);
    const now = Date.now();

    return {
      id: generateId(),
      elementKey,
      sectionId,
      type,
      content: options?.content || config.defaultContent,
      props: { ...config.defaultProps, ...options?.props },
      metadata: {
        addedManually: true,
        addedAt: now,
        lastModified: now,
        position: options?.position || 0,
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
  }, []);

  // Add element to section
  const addElement = useCallback(async (
    sectionId: string, 
    elementType: UniversalElementType, 
    options?: AddElementOptions
  ): Promise<string> => {
    const section = content[sectionId];
    if (!section) {
      throw new Error(`Section ${sectionId} not found`);
    }

    const element = createElement(sectionId, elementType, options);
    
    // Add to store
    const oldElements = { ...section.elements };
    
    // Insert at specified position
    if (options?.insertMode && options?.referenceElementKey) {
      const referenceElement = section.elements[options.referenceElementKey];
      if (referenceElement) {
        element.metadata.position = referenceElement.metadata?.position || 0;
        if (options.insertMode === 'after') {
          element.metadata.position += 1;
        }
      }
    }

    // Update positions of existing elements if needed
    const elements = Object.values(section.elements);
    elements.forEach((el: any) => {
      if (el.metadata?.position >= element.metadata.position) {
        el.metadata.position += 1;
      }
    });

    // Add new element
    updateElementContent(sectionId, element.elementKey, element.content);
    
    // Track change
    trackChange({
      type: 'element-add',
      sectionId,
      elementKey: element.elementKey,
      elementType,
      oldValue: null,
      newValue: element,
    });

    announceLiveRegion(`Added ${elementType} element`);
    
    // Auto-focus if requested
    if (options?.autoFocus) {
      setTimeout(() => {
        const elementEl = document.querySelector(`[data-element-key="${element.elementKey}"]`);
        if (elementEl) {
          (elementEl as HTMLElement).focus();
        }
      }, 100);
    }

    return element.elementKey;
  }, [content, createElement, updateElementContent, trackChange, announceLiveRegion]);

  // Remove element from section
  const removeElement = useCallback(async (
    sectionId: string, 
    elementKey: string, 
    options?: RemoveElementOptions
  ): Promise<boolean> => {
    const section = content[sectionId];
    if (!section || !section.elements[elementKey]) {
      return false;
    }

    // Confirmation check
    if (options?.confirmRequired !== false) {
      const confirmed = window.confirm('Are you sure you want to delete this element?');
      if (!confirmed) return false;
    }

    const element = section.elements[elementKey];
    
    // Save backup if requested
    if (options?.saveBackup) {
      const backup = {
        elementKey,
        element,
        timestamp: Date.now(),
        sectionId,
      };
      localStorage.setItem(`element_backup_${elementKey}`, JSON.stringify(backup));
    }

    // Remove from store
    delete section.elements[elementKey];
    
    // Update positions if requested
    if (options?.updatePositions !== false) {
      const elements = Object.values(section.elements);
      elements.forEach((el: any) => {
        if (el.metadata?.position > element.metadata?.position) {
          el.metadata.position -= 1;
        }
      });
    }

    // Track change
    trackChange({
      type: 'element-remove',
      sectionId,
      elementKey,
      oldValue: element,
      newValue: null,
    });

    announceLiveRegion(`Deleted ${element.type} element`);
    return true;
  }, [content, trackChange, announceLiveRegion]);

  // Duplicate element
  const duplicateElement = useCallback(async (
    sectionId: string, 
    elementKey: string, 
    options?: DuplicateElementOptions
  ): Promise<string> => {
    const section = content[sectionId];
    if (!section || !section.elements[elementKey]) {
      throw new Error(`Element ${elementKey} not found in section ${sectionId}`);
    }

    const originalElement = section.elements[elementKey];
    const newElementKey = options?.newElementKey || generateElementKey(
      originalElement.type as UniversalElementType,
      options?.targetPosition || (originalElement.metadata?.position || 0) + 1
    );

    // Create duplicate
    const duplicate = {
      ...originalElement,
      elementKey: newElementKey,
      id: generateId(),
      metadata: {
        ...originalElement.metadata,
        addedAt: Date.now(),
        lastModified: Date.now(),
        position: options?.targetPosition || (originalElement.metadata?.position || 0) + 1,
        version: 1,
      },
      editState: {
        isSelected: false,
        isEditing: false,
        isDirty: false,
        hasErrors: false,
      },
    };

    // Preserve or reset content/props based on options
    if (!options?.preserveContent) {
      const config = UNIVERSAL_ELEMENTS[originalElement.type as UniversalElementType];
      duplicate.content = config.defaultContent;
    }
    
    if (!options?.preserveProps) {
      const config = UNIVERSAL_ELEMENTS[originalElement.type as UniversalElementType];
      duplicate.props = { ...config.defaultProps };
    }

    // Update positions of existing elements
    const elements = Object.values(section.elements);
    elements.forEach((el: any) => {
      if (el.metadata?.position >= duplicate.metadata.position) {
        el.metadata.position += 1;
      }
    });

    // Add to store
    updateElementContent(sectionId, newElementKey, duplicate.content);

    // Track change
    trackChange({
      type: 'element-duplicate',
      sectionId,
      elementKey: newElementKey,
      sourceElementKey: elementKey,
      oldValue: null,
      newValue: duplicate,
    });

    announceLiveRegion(`Duplicated ${originalElement.type} element`);
    return newElementKey;
  }, [content, updateElementContent, trackChange, announceLiveRegion]);

  // Reorder elements
  const reorderElements = useCallback((sectionId: string, newOrder: string[]) => {
    const section = content[sectionId];
    if (!section) return;

    const oldOrder = Object.keys(section.elements).sort((a, b) => {
      const aPos = section.elements[a].metadata?.position || 0;
      const bPos = section.elements[b].metadata?.position || 0;
      return aPos - bPos;
    });

    // Update positions
    newOrder.forEach((elementKey, index) => {
      if (section.elements[elementKey]) {
        section.elements[elementKey].metadata.position = index;
      }
    });

    // Track change
    trackChange({
      type: 'element-reorder',
      sectionId,
      oldValue: oldOrder,
      newValue: newOrder,
    });

    announceLiveRegion(`Reordered ${newOrder.length} elements`);
  }, [content, trackChange, announceLiveRegion]);

  // Move element up
  const moveElementUp = useCallback((sectionId: string, elementKey: string): boolean => {
    const section = content[sectionId];
    if (!section || !section.elements[elementKey]) return false;

    const element = section.elements[elementKey];
    const currentPosition = element.metadata?.position || 0;
    
    if (currentPosition <= 0) return false;

    // Find element at position above
    const elements = Object.values(section.elements);
    const elementAbove = elements.find((el: any) => 
      el.metadata?.position === currentPosition - 1
    );

    if (elementAbove) {
      // Swap positions
      elementAbove.metadata.position = currentPosition;
      element.metadata.position = currentPosition - 1;

      // Track change
      trackChange({
        type: 'element-move',
        sectionId,
        elementKey,
        oldValue: { position: currentPosition },
        newValue: { position: currentPosition - 1 },
      });

      announceLiveRegion(`Moved ${element.type} element up`);
      return true;
    }

    return false;
  }, [content, trackChange, announceLiveRegion]);

  // Move element down
  const moveElementDown = useCallback((sectionId: string, elementKey: string): boolean => {
    const section = content[sectionId];
    if (!section || !section.elements[elementKey]) return false;

    const element = section.elements[elementKey];
    const currentPosition = element.metadata?.position || 0;
    
    // Find element at position below
    const elements = Object.values(section.elements);
    const elementBelow = elements.find((el: any) => 
      el.metadata?.position === currentPosition + 1
    );

    if (elementBelow) {
      // Swap positions
      elementBelow.metadata.position = currentPosition;
      element.metadata.position = currentPosition + 1;

      // Track change
      trackChange({
        type: 'element-move',
        sectionId,
        elementKey,
        oldValue: { position: currentPosition },
        newValue: { position: currentPosition + 1 },
      });

      announceLiveRegion(`Moved ${element.type} element down`);
      return true;
    }

    return false;
  }, [content, trackChange, announceLiveRegion]);

  // Move element to specific position
  const moveElementToPosition = useCallback((
    sectionId: string, 
    elementKey: string, 
    targetPosition: number
  ): boolean => {
    const section = content[sectionId];
    if (!section || !section.elements[elementKey]) return false;

    const element = section.elements[elementKey];
    const currentPosition = element.metadata?.position || 0;
    
    if (currentPosition === targetPosition) return false;

    // Update all affected positions
    const elements = Object.values(section.elements);
    
    if (targetPosition > currentPosition) {
      // Moving down - shift elements up
      elements.forEach((el: any) => {
        const pos = el.metadata?.position || 0;
        if (pos > currentPosition && pos <= targetPosition) {
          el.metadata.position = pos - 1;
        }
      });
    } else {
      // Moving up - shift elements down
      elements.forEach((el: any) => {
        const pos = el.metadata?.position || 0;
        if (pos >= targetPosition && pos < currentPosition) {
          el.metadata.position = pos + 1;
        }
      });
    }

    // Set new position
    element.metadata.position = targetPosition;

    // Track change
    trackChange({
      type: 'element-move',
      sectionId,
      elementKey,
      oldValue: { position: currentPosition },
      newValue: { position: targetPosition },
    });

    announceLiveRegion(`Moved ${element.type} element to position ${targetPosition + 1}`);
    return true;
  }, [content, trackChange, announceLiveRegion]);

  // Move element to different section
  const moveElementToSection = useCallback((
    fromSectionId: string, 
    toSectionId: string, 
    elementKey: string, 
    position?: number
  ): boolean => {
    const fromSection = content[fromSectionId];
    const toSection = content[toSectionId];
    
    if (!fromSection || !toSection || !fromSection.elements[elementKey]) {
      return false;
    }

    const element = fromSection.elements[elementKey];
    const newPosition = position ?? Object.keys(toSection.elements).length;

    // Remove from source section
    delete fromSection.elements[elementKey];

    // Update element's section reference
    element.sectionId = toSectionId;
    element.metadata.position = newPosition;
    element.metadata.lastModified = Date.now();

    // Add to target section
    toSection.elements[elementKey] = element;

    // Track change
    trackChange({
      type: 'element-move-section',
      oldValue: { sectionId: fromSectionId, elementKey },
      newValue: { sectionId: toSectionId, elementKey, position: newPosition },
    });

    announceLiveRegion(`Moved ${element.type} element to different section`);
    return true;
  }, [content, trackChange, announceLiveRegion]);

  // Copy element to different section
  const copyElementToSection = useCallback((
    fromSectionId: string, 
    toSectionId: string, 
    elementKey: string, 
    position?: number
  ): string => {
    const fromSection = content[fromSectionId];
    const toSection = content[toSectionId];
    
    if (!fromSection || !toSection || !fromSection.elements[elementKey]) {
      throw new Error('Invalid section or element');
    }

    const originalElement = fromSection.elements[elementKey];
    const newElementKey = generateElementKey(
      originalElement.type as UniversalElementType,
      position ?? Object.keys(toSection.elements).length
    );

    // Create copy
    const copy = {
      ...originalElement,
      id: generateId(),
      elementKey: newElementKey,
      sectionId: toSectionId,
      metadata: {
        ...originalElement.metadata,
        addedAt: Date.now(),
        lastModified: Date.now(),
        position: position ?? Object.keys(toSection.elements).length,
        version: 1,
      },
      editState: {
        isSelected: false,
        isEditing: false,
        isDirty: false,
        hasErrors: false,
      },
    };

    // Add to target section
    toSection.elements[newElementKey] = copy;

    // Track change
    trackChange({
      type: 'element-copy-section',
      oldValue: { sectionId: fromSectionId, elementKey },
      newValue: { sectionId: toSectionId, elementKey: newElementKey },
    });

    announceLiveRegion(`Copied ${copy.type} element to different section`);
    return newElementKey;
  }, [content, trackChange, announceLiveRegion]);

  // Convert element type
  const convertElementType = useCallback((
    sectionId: string, 
    elementKey: string, 
    newType: UniversalElementType
  ): boolean => {
    const section = content[sectionId];
    if (!section || !section.elements[elementKey]) return false;

    const element = section.elements[elementKey];
    const oldType = element.type;
    const newConfig = UNIVERSAL_ELEMENTS[newType];

    // Update element
    element.type = newType;
    element.props = { ...newConfig.defaultProps };
    element.metadata.lastModified = Date.now();
    element.metadata.version += 1;

    // Try to preserve content if compatible
    if (typeof element.content === 'string' && typeof newConfig.defaultContent === 'string') {
      // Keep existing content
    } else if (Array.isArray(element.content) && Array.isArray(newConfig.defaultContent)) {
      // Keep existing content
    } else {
      // Use default content for new type
      element.content = newConfig.defaultContent;
    }

    // Track change
    trackChange({
      type: 'element-convert',
      sectionId,
      elementKey,
      oldValue: { type: oldType },
      newValue: { type: newType },
    });

    announceLiveRegion(`Converted ${oldType} to ${newType}`);
    return true;
  }, [content, trackChange, announceLiveRegion]);

  // Batch update elements
  const batchUpdateElements = useCallback((
    sectionId: string, 
    updates: ElementUpdate[]
  ) => {
    const section = content[sectionId];
    if (!section) return;

    const changes: any[] = [];

    updates.forEach(update => {
      const element = section.elements[update.elementKey];
      if (element) {
        const oldValue = element[update.field as keyof typeof element];
        (element as any)[update.field] = update.value;
        element.metadata.lastModified = Date.now();
        
        changes.push({
          elementKey: update.elementKey,
          field: update.field,
          oldValue,
          newValue: update.value,
        });
      }
    });

    if (changes.length > 0) {
      // Track change
      trackChange({
        type: 'element-batch-update',
        sectionId,
        oldValue: null,
        newValue: changes,
      });

      announceLiveRegion(`Updated ${changes.length} elements`);
    }
  }, [content, trackChange, announceLiveRegion]);

  // Batch delete elements
  const batchDeleteElements = useCallback(async (
    sectionId: string, 
    elementKeys: string[]
  ): Promise<boolean> => {
    const section = content[sectionId];
    if (!section) return false;

    const confirmed = window.confirm(`Are you sure you want to delete ${elementKeys.length} elements?`);
    if (!confirmed) return false;

    const deletedElements: any[] = [];

    elementKeys.forEach(elementKey => {
      const element = section.elements[elementKey];
      if (element) {
        deletedElements.push({ elementKey, element });
        delete section.elements[elementKey];
      }
    });

    if (deletedElements.length > 0) {
      // Track change
      trackChange({
        type: 'element-batch-delete',
        sectionId,
        oldValue: deletedElements,
        newValue: null,
      });

      announceLiveRegion(`Deleted ${deletedElements.length} elements`);
    }

    return true;
  }, [content, trackChange, announceLiveRegion]);

  // Search elements
  const searchElements = useCallback((criteria: ElementSearchCriteria): UniversalElementInstance[] => {
    const results: UniversalElementInstance[] = [];
    
    const searchSections = criteria.sectionId ? [criteria.sectionId] : Object.keys(content);
    
    searchSections.forEach(sectionId => {
      const section = content[sectionId];
      if (!section) return;

      Object.values(section.elements).forEach((element: any) => {
        let matches = true;

        // Type filter
        if (criteria.elementType && element.type !== criteria.elementType) {
          matches = false;
        }

        // Content filter
        if (criteria.contentContains && matches) {
          const content = Array.isArray(element.content) 
            ? element.content.join(' ') 
            : element.content;
          if (!content.toLowerCase().includes(criteria.contentContains.toLowerCase())) {
            matches = false;
          }
        }

        // Props filter
        if (criteria.propsMatch && matches) {
          for (const [key, value] of Object.entries(criteria.propsMatch)) {
            if (element.props[key] !== value) {
              matches = false;
              break;
            }
          }
        }

        // Date range filter
        if (criteria.dateRange && matches) {
          const lastModified = element.metadata?.lastModified || 0;
          if (lastModified < criteria.dateRange.start || lastModified > criteria.dateRange.end) {
            matches = false;
          }
        }

        if (matches) {
          results.push(element);
        }
      });
    });

    return results;
  }, [content]);

  // Filter elements by type
  const filterElementsByType = useCallback((
    sectionId: string, 
    types: UniversalElementType[]
  ): UniversalElementInstance[] => {
    const section = content[sectionId];
    if (!section) return [];

    return Object.values(section.elements).filter((element: any) => 
      types.includes(element.type)
    );
  }, [content]);

  // Get element
  const getElement = useCallback((
    sectionId: string, 
    elementKey: string
  ): UniversalElementInstance | null => {
    const section = content[sectionId];
    return section?.elements[elementKey] || null;
  }, [content]);

  // Get all elements in section
  const getAllElements = useCallback((sectionId: string): UniversalElementInstance[] => {
    const section = content[sectionId];
    if (!section) return [];

    return Object.values(section.elements)
      .sort((a: any, b: any) => {
        const aPos = a.metadata?.position || 0;
        const bPos = b.metadata?.position || 0;
        return aPos - bPos;
      });
  }, [content]);

  // Get elements by type
  const getElementsByType = useCallback((
    sectionId: string, 
    type: UniversalElementType
  ): UniversalElementInstance[] => {
    const section = content[sectionId];
    if (!section) return [];

    return Object.values(section.elements)
      .filter((element: any) => element.type === type)
      .sort((a: any, b: any) => {
        const aPos = a.metadata?.position || 0;
        const bPos = b.metadata?.position || 0;
        return aPos - bPos;
      });
  }, [content]);

  // Validate element
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
    const errors: any[] = [];
    const warnings: any[] = [];

    // Check required props
    config.requiredProps.forEach(prop => {
      if (!(prop in element.props) || element.props[prop] === undefined || element.props[prop] === '') {
        errors.push({
          code: 'MISSING_REQUIRED_PROP',
          message: `Missing required property: ${prop}`,
          severity: 'error',
        });
      }
    });

    // Check content
    const hasRequiredContent = element.content && (
      typeof element.content === 'string' ? element.content.trim().length > 0 :
      Array.isArray(element.content) && element.content.length > 0
    );

    if (!hasRequiredContent) {
      errors.push({
        code: 'MISSING_CONTENT',
        message: 'Element has no content',
        severity: 'error',
      });
    }

    // Check props validity
    const propsValid = config.allowedProps.every(prop => {
      if (prop in element.props) {
        // Add specific validation rules here
        return true;
      }
      return true;
    });

    return {
      elementKey,
      isValid: errors.length === 0,
      errors,
      warnings,
      hasRequiredContent,
      propsValid,
    };
  }, [getElement]);

  // Validate all elements in section
  const validateAllElements = useCallback((sectionId: string): ElementValidationResult[] => {
    const elements = getAllElements(sectionId);
    return elements.map(element => validateElement(sectionId, element.elementKey));
  }, [getAllElements, validateElement]);

  // Save element as template
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
      id: generateId(),
      name: templateName,
      type: element.type,
      content: element.content,
      props: { ...element.props },
      category: UNIVERSAL_ELEMENTS[element.type].category,
      tags: [element.type, 'custom'],
      createdAt: Date.now(),
    };

    // Save to localStorage for now
    const templates = JSON.parse(localStorage.getItem('elementTemplates') || '[]');
    templates.push(template);
    localStorage.setItem('elementTemplates', JSON.stringify(templates));

    announceLiveRegion(`Saved template: ${templateName}`);
    return template;
  }, [getElement, announceLiveRegion]);

  // Load element from template
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

  return {
    // Core CRUD operations
    addElement,
    removeElement,
    duplicateElement,
    reorderElements,
    moveElementUp,
    moveElementDown,
    moveElementToPosition,
    
    // Cross-section operations
    moveElementToSection,
    copyElementToSection,
    
    // Element conversion
    convertElementType,
    
    // Batch operations
    batchUpdateElements,
    batchDeleteElements,
    
    // Search and filtering
    searchElements,
    filterElementsByType,
    
    // Element retrieval
    getElement,
    getAllElements,
    getElementsByType,
    
    // Validation
    validateElement,
    validateAllElements,
    
    // Templates
    saveElementAsTemplate,
    loadElementFromTemplate,
  };
}