import { useCallback, useState, useEffect, useRef } from 'react';
import { useEditStore } from './useEditStore';
import { useSelection } from './useSelection';
import { useToolbarActions } from './useToolbarActions';

export interface DragDropState {
  isDragging: boolean;
  draggedType: 'section' | 'element' | null;
  draggedId: string | null;
  draggedFromSection: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | null;
  dragStartPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  showDropZones: boolean;
  showDragPreview: boolean;
}

export interface DragDropConfig {
  enableSections: boolean;
  enableElements: boolean;
  enableCrossSection: boolean;
  enableTouch: boolean;
  enableKeyboard: boolean;
  animationDuration: number;
  dropZoneHighlight: boolean;
  dragPreview: boolean;
  autoScroll: boolean;
  scrollThreshold: number;
  scrollSpeed: number;
}

const defaultConfig: DragDropConfig = {
  enableSections: true,
  enableElements: true,
  enableCrossSection: true,
  enableTouch: true,
  enableKeyboard: true,
  animationDuration: 200,
  dropZoneHighlight: true,
  dragPreview: true,
  autoScroll: true,
  scrollThreshold: 50,
  scrollSpeed: 2,
};

export function useDragDrop(config: Partial<DragDropConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [dragDropState, setDragDropState] = useState<DragDropState>({
    isDragging: false,
    draggedType: null,
    draggedId: null,
    draggedFromSection: null,
    dropTargetId: null,
    dropPosition: null,
    dragStartPosition: null,
    currentPosition: null,
    showDropZones: false,
    showDragPreview: false,
  });

  const dragImageRef = useRef<HTMLElement | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ghostElementRef = useRef<HTMLElement | null>(null);

  const {
    mode,
    sections,
    content,
    reorderSections,
    reorderUniversalElements,
    moveElementToSection,
    announceLiveRegion,
    hideSectionToolbar,
    hideElementToolbar,
  } = useEditStore();

  const { clearSelection } = useSelection();
  const { executeAction } = useToolbarActions();

  // Initialize drag-and-drop
  const initializeDragDrop = useCallback(() => {
    if (mode !== 'edit') return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragDropState.isDragging) return;

      setDragDropState(prev => ({
        ...prev,
        currentPosition: { x: e.clientX, y: e.clientY },
      }));

      updateDragPreview(e.clientX, e.clientY);
      handleAutoScroll(e.clientY);
    };

    const handleGlobalMouseUp = () => {
      if (dragDropState.isDragging) {
        handleDragEnd();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [mode, dragDropState.isDragging]);

  // Auto-scroll when dragging near edges
  const handleAutoScroll = useCallback((clientY: number) => {
    if (!finalConfig.autoScroll) return;

    const viewportHeight = window.innerHeight;
    const scrollThreshold = finalConfig.scrollThreshold;
    
    if (clientY < scrollThreshold) {
      // Scroll up
      if (!scrollIntervalRef.current) {
        scrollIntervalRef.current = setInterval(() => {
          window.scrollBy(0, -finalConfig.scrollSpeed);
        }, 16);
      }
    } else if (clientY > viewportHeight - scrollThreshold) {
      // Scroll down
      if (!scrollIntervalRef.current) {
        scrollIntervalRef.current = setInterval(() => {
          window.scrollBy(0, finalConfig.scrollSpeed);
        }, 16);
      }
    } else {
      // Stop scrolling
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }
  }, [finalConfig.autoScroll, finalConfig.scrollThreshold, finalConfig.scrollSpeed]);

  // Section drag handlers
  const handleSectionDragStart = useCallback((sectionId: string, event: DragEvent) => {
    if (!finalConfig.enableSections) return;

    event.dataTransfer?.setData('text/plain', sectionId);
    event.dataTransfer?.setData('application/section-id', sectionId);

    setDragDropState(prev => ({
      ...prev,
      isDragging: true,
      draggedType: 'section',
      draggedId: sectionId,
      draggedFromSection: null,
      dragStartPosition: { x: event.clientX, y: event.clientY },
      showDropZones: true,
    }));

    // Create drag image
    const dragElement = event.target as HTMLElement;
    const rect = dragElement.getBoundingClientRect();
    
    const ghostElement = createGhostElement(dragElement, 'section');
    ghostElementRef.current = ghostElement;
    
    // Hide toolbars during drag
    hideSectionToolbar();
    hideElementToolbar();
    
    announceLiveRegion(`Started dragging section ${sectionId}`);
  }, [finalConfig.enableSections, hideSectionToolbar, hideElementToolbar, announceLiveRegion]);

  const handleSectionDrop = useCallback((
    draggedSectionId: string, 
    targetSectionId: string, 
    position: 'before' | 'after'
  ) => {
    if (!canDropSection(draggedSectionId, targetSectionId, position)) return;

    const draggedIndex = sections.indexOf(draggedSectionId);
    const targetIndex = sections.indexOf(targetSectionId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSections = [...sections];
    newSections.splice(draggedIndex, 1);

    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const insertIndex = position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;

    newSections.splice(insertIndex, 0, draggedSectionId);
    
    reorderSections(newSections);
    
    announceLiveRegion(`Moved section ${draggedSectionId} ${position} ${targetSectionId}`);
  }, [sections, reorderSections, announceLiveRegion]);

  // Element drag handlers
  const handleElementDragStart = useCallback((
    sectionId: string, 
    elementKey: string, 
    event: DragEvent
  ) => {
    if (!finalConfig.enableElements) return;

    event.dataTransfer?.setData('text/plain', `${sectionId}.${elementKey}`);
    event.dataTransfer?.setData('application/element-id', `${sectionId}.${elementKey}`);

    setDragDropState(prev => ({
      ...prev,
      isDragging: true,
      draggedType: 'element',
      draggedId: elementKey,
      draggedFromSection: sectionId,
      dragStartPosition: { x: event.clientX, y: event.clientY },
      showDropZones: true,
    }));

    const dragElement = event.target as HTMLElement;
    const ghostElement = createGhostElement(dragElement, 'element');
    ghostElementRef.current = ghostElement;

    hideElementToolbar();
    
    announceLiveRegion(`Started dragging element ${elementKey}`);
  }, [finalConfig.enableElements, hideElementToolbar, announceLiveRegion]);

  const handleElementDrop = useCallback((
    sectionId: string,
    draggedElementKey: string,
    targetElementKey: string,
    position: 'before' | 'after'
  ) => {
    if (!canDropElement(sectionId, draggedElementKey, targetElementKey, position)) return;

    const section = content[sectionId];
    if (!section?.elements) return;

    const elementKeys = Object.keys(section.elements);
    const draggedIndex = elementKeys.indexOf(draggedElementKey);
    const targetIndex = elementKeys.indexOf(targetElementKey);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...elementKeys];
    newOrder.splice(draggedIndex, 1);

    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const insertIndex = position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;

    newOrder.splice(insertIndex, 0, draggedElementKey);
    
    reorderUniversalElements(sectionId, newOrder);
    
    announceLiveRegion(`Moved element ${draggedElementKey} ${position} ${targetElementKey}`);
  }, [content, reorderUniversalElements, announceLiveRegion]);

  // Cross-section element movement
  const handleCrossSectionDrop = useCallback((
    fromSectionId: string,
    toSectionId: string,
    elementKey: string,
    position: number
  ) => {
    if (!finalConfig.enableCrossSection) return;
    if (!canDropCrossSection(fromSectionId, toSectionId, elementKey)) return;

    moveElementToSection(fromSectionId, toSectionId, elementKey, position);
    
    announceLiveRegion(`Moved element ${elementKey} from ${fromSectionId} to ${toSectionId}`);
  }, [finalConfig.enableCrossSection, moveElementToSection, announceLiveRegion]);

  // Validation functions
  const canDropSection = useCallback((
    draggedSectionId: string, 
    targetSectionId: string, 
    position: 'before' | 'after'
  ): boolean => {
    if (draggedSectionId === targetSectionId) return false;
    if (!sections.includes(draggedSectionId) || !sections.includes(targetSectionId)) return false;
    return true;
  }, [sections]);

  const canDropElement = useCallback((
    sectionId: string,
    draggedElementKey: string,
    targetElementKey: string,
    position: 'before' | 'after'
  ): boolean => {
    if (draggedElementKey === targetElementKey) return false;
    const section = content[sectionId];
    if (!section?.elements) return false;
    
    const elementKeys = Object.keys(section.elements);
    return elementKeys.includes(draggedElementKey) && elementKeys.includes(targetElementKey);
  }, [content]);

  const canDropCrossSection = useCallback((
    fromSectionId: string,
    toSectionId: string,
    elementKey: string
  ): boolean => {
    if (fromSectionId === toSectionId) return false;
    
    const fromSection = content[fromSectionId];
    const toSection = content[toSectionId];
    
    return !!(fromSection?.elements?.[elementKey] && toSection);
  }, [content]);

  // Visual feedback
  const createGhostElement = useCallback((
    originalElement: HTMLElement,
    type: 'section' | 'element'
  ): HTMLElement => {
    const ghost = originalElement.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.8';
    ghost.style.transform = 'rotate(2deg)';
    ghost.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
    ghost.style.border = type === 'section' ? '2px solid #3B82F6' : '1px solid #6B7280';
    ghost.style.borderRadius = '8px';
    ghost.style.maxWidth = '300px';
    ghost.style.maxHeight = '200px';
    ghost.style.overflow = 'hidden';
    
    document.body.appendChild(ghost);
    return ghost;
  }, []);

  const updateDragPreview = useCallback((x: number, y: number) => {
    if (!finalConfig.dragPreview || !ghostElementRef.current) return;

    const ghost = ghostElementRef.current;
    ghost.style.left = `${x + 10}px`;
    ghost.style.top = `${y + 10}px`;
  }, [finalConfig.dragPreview]);

  // Drop zone management
  const showDropZone = useCallback((targetId: string, type: 'section' | 'element') => {
    if (!finalConfig.dropZoneHighlight) return;

    const selector = type === 'section' 
      ? `[data-section-id="${targetId}"]`
      : `[data-element-key="${targetId}"]`;
    
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('drag-drop-zone-active');
    }
  }, [finalConfig.dropZoneHighlight]);

  const hideDropZone = useCallback(() => {
    const activeZones = document.querySelectorAll('.drag-drop-zone-active');
    activeZones.forEach(zone => zone.classList.remove('drag-drop-zone-active'));
  }, []);

  // Drag end cleanup
  const handleDragEnd = useCallback(() => {
    // Clean up ghost element
    if (ghostElementRef.current) {
      document.body.removeChild(ghostElementRef.current);
      ghostElementRef.current = null;
    }

    // Stop auto-scroll
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

    // Hide drop zones
    hideDropZone();

    // Reset state
    setDragDropState({
      isDragging: false,
      draggedType: null,
      draggedId: null,
      draggedFromSection: null,
      dropTargetId: null,
      dropPosition: null,
      dragStartPosition: null,
      currentPosition: null,
      showDropZones: false,
      showDragPreview: false,
    });
  }, [hideDropZone]);

  // Keyboard support
  const handleKeyboardReorder = useCallback((
    itemId: string, 
    direction: 'up' | 'down', 
    type: 'section' | 'element'
  ) => {
    if (!finalConfig.enableKeyboard) return;

    if (type === 'section') {
      executeAction('move-section', { sectionId: itemId, direction });
    } else {
      const [sectionId, elementKey] = itemId.split('.');
      const action = direction === 'up' ? 'move-element-up' : 'move-element-down';
      executeAction(action, { sectionId, elementKey });
    }
  }, [finalConfig.enableKeyboard, executeAction]);

  // Touch support
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!finalConfig.enableTouch) return;
    
    const touch = event.touches[0];
    const target = event.target as HTMLElement;
    
    // Determine if this is a draggable element
    const sectionId = target.closest('[data-section-id]')?.getAttribute('data-section-id');
    const elementKey = target.closest('[data-element-key]')?.getAttribute('data-element-key');
    
    if (sectionId && !elementKey) {
      // Section drag
      setDragDropState(prev => ({
        ...prev,
        isDragging: true,
        draggedType: 'section',
        draggedId: sectionId,
        dragStartPosition: { x: touch.clientX, y: touch.clientY },
        showDropZones: true,
      }));
    } else if (sectionId && elementKey) {
      // Element drag
      setDragDropState(prev => ({
        ...prev,
        isDragging: true,
        draggedType: 'element',
        draggedId: elementKey,
        draggedFromSection: sectionId,
        dragStartPosition: { x: touch.clientX, y: touch.clientY },
        showDropZones: true,
      }));
    }
  }, [finalConfig.enableTouch]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!dragDropState.isDragging || !finalConfig.enableTouch) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    
    setDragDropState(prev => ({
      ...prev,
      currentPosition: { x: touch.clientX, y: touch.clientY },
    }));
    
    updateDragPreview(touch.clientX, touch.clientY);
  }, [dragDropState.isDragging, finalConfig.enableTouch, updateDragPreview]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!dragDropState.isDragging || !finalConfig.enableTouch) return;
    
    const touch = event.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementBelow) {
      // Handle drop logic based on element below
      const targetSectionId = elementBelow.closest('[data-section-id]')?.getAttribute('data-section-id');
      const targetElementKey = elementBelow.closest('[data-element-key]')?.getAttribute('data-element-key');
      
      if (dragDropState.draggedType === 'section' && targetSectionId) {
        handleSectionDrop(dragDropState.draggedId!, targetSectionId, 'after');
      } else if (dragDropState.draggedType === 'element' && targetElementKey) {
        handleElementDrop(
          dragDropState.draggedFromSection!,
          dragDropState.draggedId!,
          targetElementKey,
          'after'
        );
      }
    }
    
    handleDragEnd();
  }, [dragDropState, finalConfig.enableTouch, handleSectionDrop, handleElementDrop, handleDragEnd]);

  // Initialize on mount
  useEffect(() => {
    if (mode === 'edit') {
      return initializeDragDrop();
    }
  }, [mode, initializeDragDrop]);

  // Touch event listeners
  useEffect(() => {
    if (finalConfig.enableTouch && mode === 'edit') {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [finalConfig.enableTouch, mode, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    // State
    dragDropState,
    config: finalConfig,
    
    // Section drag-drop
    handleSectionDragStart,
    handleSectionDrop,
    canDropSection,
    
    // Element drag-drop
    handleElementDragStart,
    handleElementDrop,
    canDropElement,
    
    // Cross-section
    handleCrossSectionDrop,
    canDropCrossSection,
    
    // Visual feedback
    showDropZone,
    hideDropZone,
    updateDragPreview,
    
    // Keyboard support
    handleKeyboardReorder,
    
    // Touch support
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    // Cleanup
    handleDragEnd,
  };
}