// Enhanced useEditStore actions with drag-drop support
import { useCallback } from 'react';
import { useEditStore } from '../useEditStore';
import { validateSectionDrop, validateElementDrop, validateCrossSectionDrop } from '@/utils/dragDropUtils';

export function useEnhancedStoreActions() {
  const {
    sections,
    content,
    reorderSections,
    reorderUniversalElements,
    removeUniversalElement,
    addUniversalElement,
    updateUniversalElementProps,
    moveUniversalElementUp,
    moveUniversalElementDown,
    announceLiveRegion,
    trackChange,
    triggerAutoSave,
  } = useEditStore();

  // Enhanced section reordering with drag-drop
  const reorderSectionsByDrag = useCallback((
    draggedSectionId: string,
    targetSectionId: string,
    position: 'before' | 'after'
  ) => {
    // Validate the drop
    const validation = validateSectionDrop(draggedSectionId, targetSectionId, position, sections);
    if (!validation.isValid) {
      console.warn('Invalid section drop:', validation.reason);
      return false;
    }

    const draggedIndex = sections.indexOf(draggedSectionId);
    const targetIndex = sections.indexOf(targetSectionId);
    
    if (draggedIndex === -1 || targetIndex === -1) return false;

    // Calculate new order
    const newSections = [...sections];
    newSections.splice(draggedIndex, 1);

    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const insertIndex = position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;

    newSections.splice(insertIndex, 0, draggedSectionId);
    
    // Update store
    reorderSections(newSections);
    
    // Track change
    trackChange({
      type: 'drag-drop',
      action: 'reorder-sections',
      data: { draggedSectionId, targetSectionId, position, newOrder: newSections },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    return true;
  }, [sections, reorderSections, trackChange, triggerAutoSave]);

  // Enhanced element reordering with drag-drop
  const reorderElementsByDrag = useCallback((
    sectionId: string,
    draggedElementKey: string,
    targetElementKey: string,
    position: 'before' | 'after'
  ) => {
    // Validate the drop
    const validation = validateElementDrop(sectionId, draggedElementKey, targetElementKey, position, content);
    if (!validation.isValid) {
      console.warn('Invalid element drop:', validation.reason);
      return false;
    }

    const section = content[sectionId];
    if (!section?.elements) return false;

    const elementKeys = Object.keys(section.elements);
    const draggedIndex = elementKeys.indexOf(draggedElementKey);
    const targetIndex = elementKeys.indexOf(targetElementKey);

    if (draggedIndex === -1 || targetIndex === -1) return false;

    // Calculate new order
    const newOrder = [...elementKeys];
    newOrder.splice(draggedIndex, 1);

    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const insertIndex = position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;

    newOrder.splice(insertIndex, 0, draggedElementKey);
    
    // Update store
    reorderUniversalElements(sectionId, newOrder);
    
    // Track change
    trackChange({
      type: 'drag-drop',
      action: 'reorder-elements',
      data: { sectionId, draggedElementKey, targetElementKey, position, newOrder },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    return true;
  }, [content, reorderUniversalElements, trackChange, triggerAutoSave]);

  // Cross-section element movement with drag-drop
  const moveElementBetweenSections = useCallback((
    fromSectionId: string,
    toSectionId: string,
    elementKey: string,
    position: number
  ) => {
    // Validate the cross-section drop
    const validation = validateCrossSectionDrop(fromSectionId, toSectionId, elementKey, content);
    if (!validation.isValid) {
      console.warn('Invalid cross-section drop:', validation.reason);
      return false;
    }

    const fromSection = content[fromSectionId];
    const toSection = content[toSectionId];
    
    if (!fromSection?.elements?.[elementKey] || !toSection) return false;

    // Get the element data
    const element = fromSection.elements[elementKey];
    
    // Remove from source section
    const removalSuccess = removeUniversalElement(fromSectionId, elementKey, { 
      confirmRequired: false,
      updatePositions: true 
    });
    
    if (!removalSuccess) return false;

    // Add to target section
    const newElementKey = addUniversalElement(toSectionId, element.type, {
      content: element.content,
      props: element.props,
      position,
    });

    // Track change
    trackChange({
      type: 'drag-drop',
      action: 'move-element-cross-section',
      data: { fromSectionId, toSectionId, elementKey, newElementKey, position },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    return true;
  }, [content, removeUniversalElement, addUniversalElement, trackChange, triggerAutoSave]);

  // Batch operations for drag-drop
  const batchReorderSections = useCallback((newSectionOrder: string[]) => {
    if (newSectionOrder.length !== sections.length) {
      console.warn('Batch reorder: section count mismatch');
      return false;
    }

    // Validate all sections exist
    const missingStions = newSectionOrder.filter(id => !sections.includes(id));
    if (missingStions.length > 0) {
      console.warn('Batch reorder: missing sections:', missingStions);
      return false;
    }

    reorderSections(newSectionOrder);
    
    trackChange({
      type: 'drag-drop',
      action: 'batch-reorder-sections',
      data: { oldOrder: sections, newOrder: newSectionOrder },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    return true;
  }, [sections, reorderSections, trackChange, triggerAutoSave]);

  const batchReorderElements = useCallback((
    sectionId: string,
    newElementOrder: string[]
  ) => {
    const section = content[sectionId];
    if (!section?.elements) return false;

    const currentKeys = Object.keys(section.elements);
    if (newElementOrder.length !== currentKeys.length) {
      console.warn('Batch reorder: element count mismatch');
      return false;
    }

    // Validate all elements exist
    const missingElements = newElementOrder.filter(key => !currentKeys.includes(key));
    if (missingElements.length > 0) {
      console.warn('Batch reorder: missing elements:', missingElements);
      return false;
    }

    reorderUniversalElements(sectionId, newElementOrder);
    
    trackChange({
      type: 'drag-drop',
      action: 'batch-reorder-elements',
      data: { sectionId, oldOrder: currentKeys, newOrder: newElementOrder },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    return true;
  }, [content, reorderUniversalElements, trackChange, triggerAutoSave]);

  // Keyboard-based drag-drop actions
  const moveElementWithKeyboard = useCallback((
    sectionId: string,
    elementKey: string,
    direction: 'up' | 'down'
  ) => {
    if (direction === 'up') {
      const success = moveUniversalElementUp(sectionId, elementKey);
      if (success) {
        announceLiveRegion(`Moved ${elementKey} up`);
        trackChange({
          type: 'keyboard-drag',
          action: 'move-element-up',
          data: { sectionId, elementKey },
          timestamp: Date.now(),
        });
        triggerAutoSave();
      }
      return success;
    } else {
      const success = moveUniversalElementDown(sectionId, elementKey);
      if (success) {
        announceLiveRegion(`Moved ${elementKey} down`);
        trackChange({
          type: 'keyboard-drag',
          action: 'move-element-down',
          data: { sectionId, elementKey },
          timestamp: Date.now(),
        });
        triggerAutoSave();
      }
      return success;
    }
  }, [moveUniversalElementUp, moveUniversalElementDown, announceLiveRegion, trackChange, triggerAutoSave]);

  const moveSectionWithKeyboard = useCallback((
    sectionId: string,
    direction: 'up' | 'down'
  ) => {
    const currentIndex = sections.indexOf(sectionId);
    if (currentIndex === -1) return false;

    let newIndex: number;
    if (direction === 'up') {
      if (currentIndex === 0) return false;
      newIndex = currentIndex - 1;
    } else {
      if (currentIndex === sections.length - 1) return false;
      newIndex = currentIndex + 1;
    }

    const newSections = [...sections];
    [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];

    reorderSections(newSections);
    
    announceLiveRegion(`Moved section ${sectionId} ${direction}`);
    trackChange({
      type: 'keyboard-drag',
      action: `move-section-${direction}`,
      data: { sectionId, oldIndex: currentIndex, newIndex },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    return true;
  }, [sections, reorderSections, announceLiveRegion, trackChange, triggerAutoSave]);

  // Advanced drag-drop operations
  const swapSections = useCallback((sectionId1: string, sectionId2: string) => {
    const index1 = sections.indexOf(sectionId1);
    const index2 = sections.indexOf(sectionId2);
    
    if (index1 === -1 || index2 === -1) return false;

    const newSections = [...sections];
    [newSections[index1], newSections[index2]] = [newSections[index2], newSections[index1]];

    reorderSections(newSections);
    
    trackChange({
      type: 'drag-drop',
      action: 'swap-sections',
      data: { sectionId1, sectionId2, index1, index2 },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    return true;
  }, [sections, reorderSections, trackChange, triggerAutoSave]);

  const swapElements = useCallback((
    sectionId: string,
    elementKey1: string,
    elementKey2: string
  ) => {
    const section = content[sectionId];
    if (!section?.elements) return false;

    const elementKeys = Object.keys(section.elements);
    const index1 = elementKeys.indexOf(elementKey1);
    const index2 = elementKeys.indexOf(elementKey2);
    
    if (index1 === -1 || index2 === -1) return false;

    const newOrder = [...elementKeys];
    [newOrder[index1], newOrder[index2]] = [newOrder[index2], newOrder[index1]];

    reorderUniversalElements(sectionId, newOrder);
    
    trackChange({
      type: 'drag-drop',
      action: 'swap-elements',
      data: { sectionId, elementKey1, elementKey2, index1, index2 },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    return true;
  }, [content, reorderUniversalElements, trackChange, triggerAutoSave]);

  // Drag-drop state management
  const getDragDropCapabilities = useCallback((
    type: 'section' | 'element',
    id: string,
    sectionId?: string
  ) => {
    if (type === 'section') {
      const sectionIndex = sections.indexOf(id);
      return {
        canMoveUp: sectionIndex > 0,
        canMoveDown: sectionIndex < sections.length - 1,
        canSwap: sections.length > 1,
        canDelete: sections.length > 1,
        canDuplicate: true,
      };
    } else {
      const section = content[sectionId!];
      if (!section?.elements) return null;

      const elementKeys = Object.keys(section.elements);
      const elementIndex = elementKeys.indexOf(id);
      
      return {
        canMoveUp: elementIndex > 0,
        canMoveDown: elementIndex < elementKeys.length - 1,
        canSwap: elementKeys.length > 1,
        canDelete: elementKeys.length > 1,
        canDuplicate: true,
        canMoveCrossSection: Object.keys(content).length > 1,
      };
    }
  }, [sections, content]);

  const getDragDropPreview = useCallback((
    type: 'section' | 'element',
    id: string,
    sectionId?: string
  ) => {
    if (type === 'section') {
      const section = content[id];
      if (!section) return null;

      const elementCount = Object.keys(section.elements || {}).length;
      return {
        title: `Section ${id}`,
        description: `${elementCount} element${elementCount !== 1 ? 's' : ''}`,
        type: section.type || 'custom',
        isVisible: section.isVisible !== false,
      };
    } else {
      const element = content[sectionId!]?.elements?.[id];
      if (!element) return null;

      return {
        title: id,
        description: typeof element.content === 'string' 
          ? element.content.slice(0, 50) + (element.content.length > 50 ? '...' : '')
          : `${element.content.length} items`,
        type: element.type,
        isEditable: element.isEditable,
      };
    }
  }, [content]);

  const validateDragDropOperation = useCallback((
    operation: 'reorder-sections' | 'reorder-elements' | 'move-cross-section' | 'swap-sections' | 'swap-elements',
    data: any
  ) => {
    switch (operation) {
      case 'reorder-sections':
        return validateSectionDrop(data.draggedSectionId, data.targetSectionId, data.position, sections);
      
      case 'reorder-elements':
        return validateElementDrop(data.sectionId, data.draggedElementKey, data.targetElementKey, data.position, content);
      
      case 'move-cross-section':
        return validateCrossSectionDrop(data.fromSectionId, data.toSectionId, data.elementKey, content);
      
      case 'swap-sections':
        return {
          isValid: sections.includes(data.sectionId1) && sections.includes(data.sectionId2),
          reason: sections.includes(data.sectionId1) && sections.includes(data.sectionId2) ? undefined : 'One or both sections not found',
        };
      
      case 'swap-elements':
        const section = content[data.sectionId];
        const hasElements = section?.elements && 
          section.elements[data.elementKey1] && 
          section.elements[data.elementKey2];
        return {
          isValid: !!hasElements,
          reason: hasElements ? undefined : 'One or both elements not found',
        };
      
      default:
        return { isValid: false, reason: 'Unknown operation' };
    }
  }, [sections, content]);

  // Performance optimizations
  const optimizeDragDropState = useCallback(() => {
    // Clean up any inconsistent states
    const validSections = sections.filter(sectionId => content[sectionId]);
    if (validSections.length !== sections.length) {
      reorderSections(validSections);
    }

    // Clean up element positions within sections
    Object.entries(content).forEach(([sectionId, section]) => {
      if (section.elements) {
        const elementKeys = Object.keys(section.elements);
        const needsReordering = elementKeys.some((key, index) => {
          const element = section.elements[key] as any;
          return element.metadata?.position !== index;
        });

        if (needsReordering) {
          reorderUniversalElements(sectionId, elementKeys);
        }
      }
    });
  }, [sections, content, reorderSections, reorderUniversalElements]);

  // Drag-drop analytics
  const getDragDropStats = useCallback(() => {
    const totalSections = sections.length;
    const totalElements = Object.values(content).reduce((sum, section) => {
      return sum + Object.keys(section.elements || {}).length;
    }, 0);

    const sectionsWithElements = Object.values(content).filter(section => 
      section.elements && Object.keys(section.elements).length > 0
    ).length;

    const averageElementsPerSection = sectionsWithElements > 0 ? totalElements / sectionsWithElements : 0;

    return {
      totalSections,
      totalElements,
      sectionsWithElements,
      averageElementsPerSection: Math.round(averageElementsPerSection * 100) / 100,
      emptySections: totalSections - sectionsWithElements,
    };
  }, [sections, content]);

  return {
    // Core drag-drop operations
    reorderSectionsByDrag,
    reorderElementsByDrag,
    moveElementBetweenSections,
    
    // Batch operations
    batchReorderSections,
    batchReorderElements,
    
    // Keyboard operations
    moveElementWithKeyboard,
    moveSectionWithKeyboard,
    
    // Advanced operations
    swapSections,
    swapElements,
    
    // State management
    getDragDropCapabilities,
    getDragDropPreview,
    validateDragDropOperation,
    optimizeDragDropState,
    getDragDropStats,
  };
}