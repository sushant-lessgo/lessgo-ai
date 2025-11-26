// hooks/useElementCRUD.ts - Element CRUD operations hook

import { useCallback } from 'react';
import { useEditStoreLegacy as useEditStore } from './useEditStoreLegacy';
import { UNIVERSAL_ELEMENTS } from '@/types/universalElements';
import { getLayoutElements } from '@/modules/sections/layoutElementSchema';
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
import type { ElementType } from '@/types/core/index';

const generateElementKey = (type: UniversalElementType, position: number = 0) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${type}_${position}_${timestamp}_${random}`;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to format element names for display
const formatElementLabel = (elementName: string): string => {
  return elementName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper to infer type from element name
const inferElementType = (elementName: string): ElementType => {
  if (elementName.includes('icon')) return 'image';
  if (elementName.includes('cta') || elementName.includes('button')) return 'button';
  if (elementName.includes('headline')) return 'headline';
  if (elementName.includes('badge') || elementName.includes('eyebrow')) return 'text';
  if (elementName.includes('list') || elementName.includes('items')) return 'list';
  return 'text'; // default
};

// Default content for optional elements
const getDefaultOptionalContent = (elementName: string): string | string[] => {
  if (elementName.includes('icon')) return '/placeholder-icon.svg';
  if (elementName.includes('trust_item')) return 'Trust indicator text';
  if (elementName.includes('cta')) return 'Click here';
  if (elementName.includes('badge') || elementName.includes('eyebrow')) return 'NEW';
  return `${formatElementLabel(elementName)} content`;
};

export function useElementCRUD() {
  const {
    content,
    setSection,
    trackChange,
    announceLiveRegion,
    triggerAutoSave,
    history
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

  // Create optional element from layout schema
  const createOptionalElement = useCallback((
    sectionId: string,
    elementName: string,
    options?: AddElementOptions
  ) => {
    const section = content[sectionId];
    const layoutType = section?.layout;

    // Get element position from layout schema
    const getElementPositionInSchema = (elementName: string, layoutType: string): number => {
      try {
        const layoutElements = getLayoutElements(layoutType);
        const index = layoutElements.findIndex(el => el.element === elementName);
        return index >= 0 ? index : 999; // Default to end if not found
      } catch (error) {
        return 999;
      }
    };

    // Calculate actual position considering existing elements
    const calculateInsertPosition = (sectionId: string, schemaPosition: number): number => {
      const section = content[sectionId];
      const existingElements = Object.entries(section?.elements || {});

      // Find elements with position >= schemaPosition
      const elementsAfter = existingElements.filter(([key, el]) =>
        (el.metadata?.position || 0) >= schemaPosition
      );

      // If no elements after, use schemaPosition
      if (elementsAfter.length === 0) return schemaPosition;

      // Otherwise insert before first element after
      const firstAfterPosition = Math.min(...elementsAfter.map(([k, el]) => el.metadata?.position || 0));
      return firstAfterPosition;
    };

    const schemaPosition = getElementPositionInSchema(elementName, layoutType || '');
    const actualPosition = calculateInsertPosition(sectionId, schemaPosition);
    const elementKey = elementName; // Use schema name as key
    const now = Date.now();

    return {
      id: generateId(),
      elementKey,
      sectionId,
      type: inferElementType(elementName),
      content: options?.content || getDefaultOptionalContent(elementName),
      props: options?.props || {},
      metadata: {
        addedManually: true,
        addedAt: now,
        lastModified: now,
        position: actualPosition,
        version: 1,
        isOptional: true,
        optionalElementName: elementName,
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

  // Add element to section
  const addElement = useCallback(async (
    sectionId: string,
    elementType: string, // Changed to accept string for optional elements
    options?: AddElementOptions
  ): Promise<string> => {
    const section = content[sectionId];
    if (!section) {
      throw new Error(`Section ${sectionId} not found`);
    }

    // Check if elementType is a universal element or optional element
    const isOptionalElement = !UNIVERSAL_ELEMENTS[elementType as UniversalElementType];

    // Create the appropriate element
    const element = isOptionalElement
      ? createOptionalElement(sectionId, elementType, options)
      : createElement(sectionId, elementType as UniversalElementType, options);
    
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

    // Create new element object
    const newElement = {
      content: element.content,
      type: element.type,
      isEditable: true,
      editMode: 'inline' as const,
      props: element.props,
      metadata: element.metadata,
    };
    
    // Create updated elements object with position adjustments
    const updatedElements = { ...section.elements };
    
    // Update positions of existing elements that need to be shifted
    Object.keys(updatedElements).forEach(existingKey => {
      const existingElement = updatedElements[existingKey];
      if (existingElement.metadata?.position >= element.metadata.position) {
        updatedElements[existingKey] = {
          ...existingElement,
          metadata: {
            ...existingElement.metadata,
            position: (existingElement.metadata?.position || 0) + 1,
            lastModified: Date.now(),
          }
        };
      }
    });
    
    // Add the new element
    updatedElements[element.elementKey] = newElement as any;
    
    setSection(sectionId, { elements: updatedElements });
    
    // Track change and trigger auto-save
    trackChange({
      type: 'content',
      sectionId,
      elementKey: element.elementKey,
      oldValue: null,
      newValue: element,
      source: 'user',
    });

    triggerAutoSave();

    // Announce with appropriate label
    const elementLabel = isOptionalElement
      ? formatElementLabel(elementType)
      : UNIVERSAL_ELEMENTS[elementType as UniversalElementType]?.label || elementType;
    announceLiveRegion(`Added ${elementLabel} element`);

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
  }, [content, setSection, createElement, createOptionalElement, trackChange, triggerAutoSave, announceLiveRegion]);

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

    // Create updated elements object without the removed element
    const { [elementKey]: removed, ...remainingElements } = section.elements;
    
    // Update positions if requested
    if (options?.updatePositions !== false) {
      Object.keys(remainingElements).forEach(key => {
        const el = remainingElements[key];
        if (el.metadata?.position > element.metadata?.position) {
          remainingElements[key] = {
            ...el,
            metadata: {
              ...el.metadata,
              position: (el.metadata?.position || 0) - 1,
              lastModified: Date.now(),
            }
          };
        }
      });
    }
    
    // Update section with new elements
    setSection(sectionId, { elements: remainingElements });

    // Track change
    trackChange({
      type: 'content',
      sectionId,
      elementKey,
      oldValue: element,
      newValue: null,
      source: 'user',
    });

    announceLiveRegion(`Deleted ${element.type} element`);
    return true;
  }, [content, setSection, trackChange, announceLiveRegion]);

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
      duplicate.uiProps = { ...config.defaultProps };
    }

    // Create updated elements object with position adjustments
    const updatedElements = { ...section.elements };
    
    // Update positions of existing elements that need to be shifted
    Object.keys(updatedElements).forEach(existingKey => {
      const existingElement = updatedElements[existingKey];
      if (existingElement.metadata?.position >= duplicate.metadata.position) {
        updatedElements[existingKey] = {
          ...existingElement,
          metadata: {
            ...existingElement.metadata,
            position: (existingElement.metadata?.position || 0) + 1,
            lastModified: Date.now(),
          }
        };
      }
    });
    
    // Add the duplicate element
    updatedElements[newElementKey] = duplicate;
    
    setSection(sectionId, { elements: updatedElements });

    // Track change
    trackChange({
      type: 'content',
      sectionId,
      elementKey: newElementKey,
      oldValue: null,
      newValue: duplicate,
      source: 'user',
    });

    announceLiveRegion(`Duplicated ${originalElement.type} element`);
    return newElementKey;
  }, [content, setSection, trackChange, announceLiveRegion]);

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
        if (section.elements[elementKey].metadata) {
          section.elements[elementKey].metadata.position = index;
        }
      }
    });

    // Track change
    trackChange({
      type: 'layout',
      sectionId,
      oldValue: oldOrder,
      newValue: newOrder,
      source: 'user',
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
      (elementAbove as any).metadata.position = currentPosition;
      (element as any).metadata.position = currentPosition - 1;

      // Track change
      trackChange({
        type: 'layout',
        sectionId,
        elementKey,
        oldValue: { position: currentPosition },
        newValue: { position: currentPosition - 1 },
        source: 'user',
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
      (elementBelow as any).metadata.position = currentPosition;
      (element as any).metadata.position = currentPosition + 1;

      // Track change
      trackChange({
        type: 'layout',
        sectionId,
        elementKey,
        oldValue: { position: currentPosition },
        newValue: { position: currentPosition + 1 },
        source: 'user',
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

    // Create updated elements object with position adjustments
    const updatedElements = { ...section.elements };
    
    if (targetPosition > currentPosition) {
      // Moving down - shift elements up
      Object.keys(updatedElements).forEach(key => {
        const el = updatedElements[key];
        const pos = el.metadata?.position || 0;
        if (pos > currentPosition && pos <= targetPosition) {
          updatedElements[key] = {
            ...el,
            metadata: {
              ...el.metadata,
              position: pos - 1,
              lastModified: Date.now(),
            }
          };
        }
      });
    } else {
      // Moving up - shift elements down
      Object.keys(updatedElements).forEach(key => {
        const el = updatedElements[key];
        const pos = el.metadata?.position || 0;
        if (pos >= targetPosition && pos < currentPosition) {
          updatedElements[key] = {
            ...el,
            metadata: {
              ...el.metadata,
              position: pos + 1,
              lastModified: Date.now(),
            }
          };
        }
      });
    }

    // Set new position for the moved element
    updatedElements[elementKey] = {
      ...element,
      metadata: {
        ...element.metadata,
        position: targetPosition,
        lastModified: Date.now(),
      }
    };
    
    // Update section with new elements
    setSection(sectionId, { elements: updatedElements });

    // Track change
    trackChange({
      type: 'layout',
      sectionId,
      elementKey,
      oldValue: { position: currentPosition },
      newValue: { position: targetPosition },
      source: 'user',
    });

    announceLiveRegion(`Moved ${element.type} element to position ${targetPosition + 1}`);
    return true;
  }, [content, setSection, trackChange, announceLiveRegion]);

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
    (element as any).sectionId = toSectionId;
    if (element.metadata) {
      element.metadata.position = newPosition;
      element.metadata.lastModified = Date.now();
    }

    // Add to target section
    toSection.elements[elementKey] = element;

    // Track change
    trackChange({
      type: 'layout',
      oldValue: { sectionId: fromSectionId, elementKey },
      newValue: { sectionId: toSectionId, elementKey, position: newPosition },
      source: 'user',
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
      type: 'content',
      oldValue: { sectionId: fromSectionId, elementKey },
      newValue: { sectionId: toSectionId, elementKey: newElementKey },
      source: 'user',
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
    element.type = newType as any;
    element.uiProps = { ...newConfig.defaultProps };
    if (element.metadata) {
      element.metadata.lastModified = Date.now();
      element.metadata.version += 1;
    }

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
      type: 'content',
      sectionId,
      elementKey,
      oldValue: { type: oldType },
      newValue: { type: newType },
      source: 'user',
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
        if (element.metadata) {
          element.metadata.lastModified = Date.now();
        }
        
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
        type: 'content',
        sectionId,
        oldValue: null,
        newValue: changes,
        source: 'user',
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
        type: 'content',
        sectionId,
        oldValue: deletedElements,
        newValue: null,
        source: 'user',
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
    ) as unknown as UniversalElementInstance[];
  }, [content]);

  // Get element
  const getElement = useCallback((
    sectionId: string, 
    elementKey: string
  ): UniversalElementInstance | null => {
    const section = content[sectionId];
    return (section?.elements[elementKey] as unknown as UniversalElementInstance) || null;
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
      }) as unknown as UniversalElementInstance[];
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
      }) as unknown as UniversalElementInstance[];
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
    const hasRequiredContent = !!(element.content && (
      typeof element.content === 'string' ? element.content.trim().length > 0 :
      Array.isArray(element.content) && element.content.length > 0
    ));

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
  const loadElementFromTemplate = useCallback(async (
    sectionId: string, 
    template: ElementTemplate, 
    position?: number
  ): Promise<string> => {
    return await addElement(sectionId, template.type, {
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