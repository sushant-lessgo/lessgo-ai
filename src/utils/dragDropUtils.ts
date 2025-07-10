import type { DragDropState } from '@/hooks/useDragDrop';

export interface DragDropValidation {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
}

export interface DragDropAnimationConfig {
  duration: number;
  easing: string;
  scale: number;
  opacity: number;
}

export interface DragDropPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Validation utilities
export function validateSectionDrop(
  draggedSectionId: string,
  targetSectionId: string,
  position: 'before' | 'after',
  sections: string[]
): DragDropValidation {
  if (draggedSectionId === targetSectionId) {
    return {
      isValid: false,
      reason: 'Cannot drop section on itself',
    };
  }

  if (!sections.includes(draggedSectionId)) {
    return {
      isValid: false,
      reason: 'Dragged section not found',
    };
  }

  if (!sections.includes(targetSectionId)) {
    return {
      isValid: false,
      reason: 'Target section not found',
    };
  }

  const draggedIndex = sections.indexOf(draggedSectionId);
  const targetIndex = sections.indexOf(targetSectionId);
  
  // Check if the drop would result in the same position
  if (
    (position === 'before' && draggedIndex === targetIndex - 1) ||
    (position === 'after' && draggedIndex === targetIndex + 1)
  ) {
    return {
      isValid: false,
      reason: 'Section is already in this position',
    };
  }

  return { isValid: true };
}

export function validateElementDrop(
  sectionId: string,
  draggedElementKey: string,
  targetElementKey: string,
  position: 'before' | 'after',
  content: any
): DragDropValidation {
  const section = content[sectionId];
  
  if (!section?.elements) {
    return {
      isValid: false,
      reason: 'Section not found or has no elements',
    };
  }

  if (draggedElementKey === targetElementKey) {
    return {
      isValid: false,
      reason: 'Cannot drop element on itself',
    };
  }

  const elementKeys = Object.keys(section.elements);
  
  if (!elementKeys.includes(draggedElementKey)) {
    return {
      isValid: false,
      reason: 'Dragged element not found in section',
    };
  }

  if (!elementKeys.includes(targetElementKey)) {
    return {
      isValid: false,
      reason: 'Target element not found in section',
    };
  }

  const draggedIndex = elementKeys.indexOf(draggedElementKey);
  const targetIndex = elementKeys.indexOf(targetElementKey);
  
  // Check if the drop would result in the same position
  if (
    (position === 'before' && draggedIndex === targetIndex - 1) ||
    (position === 'after' && draggedIndex === targetIndex + 1)
  ) {
    return {
      isValid: false,
      reason: 'Element is already in this position',
    };
  }

  return { isValid: true };
}

export function validateCrossSectionDrop(
  fromSectionId: string,
  toSectionId: string,
  elementKey: string,
  content: any
): DragDropValidation {
  if (fromSectionId === toSectionId) {
    return {
      isValid: false,
      reason: 'Cannot move element to same section',
    };
  }

  const fromSection = content[fromSectionId];
  const toSection = content[toSectionId];

  if (!fromSection?.elements?.[elementKey]) {
    return {
      isValid: false,
      reason: 'Element not found in source section',
    };
  }

  if (!toSection) {
    return {
      isValid: false,
      reason: 'Target section not found',
    };
  }

  // Check if target section already has this element type
  const elementType = fromSection.elements[elementKey].type;
  const targetElements = Object.values(toSection.elements || {});
  const hasTypeLimit = ['headline', 'subheadline', 'hero'].includes(elementType);
  
  if (hasTypeLimit && targetElements.some((el: any) => el.type === elementType)) {
    return {
      isValid: false,
      reason: `Target section already has a ${elementType} element`,
      suggestions: ['Consider duplicating the element instead', 'Choose a different target section'],
    };
  }

  return { isValid: true };
}

// Position calculation utilities
export function calculateDropPosition(
  dragPosition: { x: number; y: number },
  targetRect: DOMRect,
  type: 'section' | 'element'
): 'before' | 'after' {
  const threshold = type === 'section' ? 0.5 : 0.3;
  const relativeY = (dragPosition.y - targetRect.top) / targetRect.height;
  
  return relativeY < threshold ? 'before' : 'after';
}

export function calculateInsertIndex(
  draggedIndex: number,
  targetIndex: number,
  position: 'before' | 'after'
): number {
  if (position === 'before') {
    return draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
  } else {
    return draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
  }
}

export function getElementCenter(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function getClosestDropTarget(
  position: { x: number; y: number },
  type: 'section' | 'element',
  excludeId?: string
): { element: Element; distance: number } | null {
  const selector = type === 'section' 
    ? '[data-section-id]' 
    : '[data-element-key]';
  
  const elements = Array.from(document.querySelectorAll(selector));
  
  if (excludeId) {
    const excludeSelector = type === 'section' 
      ? `[data-section-id="${excludeId}"]`
      : `[data-element-key="${excludeId}"]`;
    
    const excludeElement = document.querySelector(excludeSelector);
    if (excludeElement) {
      const index = elements.indexOf(excludeElement);
      if (index > -1) {
        elements.splice(index, 1);
      }
    }
  }

  let closest: { element: Element; distance: number } | null = null;

  elements.forEach(element => {
    const center = getElementCenter(element);
    const distance = Math.sqrt(
      Math.pow(position.x - center.x, 2) + Math.pow(position.y - center.y, 2)
    );

    if (!closest || distance < closest.distance) {
      closest = { element, distance };
    }
  });

  return closest;
}

// Animation utilities
export function animateDropSuccess(
  element: Element,
  config: Partial<DragDropAnimationConfig> = {}
): Promise<void> {
  const finalConfig: DragDropAnimationConfig = {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    scale: 1.05,
    opacity: 0.8,
    ...config,
  };

  return new Promise(resolve => {
    const htmlElement = element as HTMLElement;
    const originalTransform = htmlElement.style.transform;
    const originalOpacity = htmlElement.style.opacity;

    // Apply success animation
    htmlElement.style.transition = `all ${finalConfig.duration}ms ${finalConfig.easing}`;
    htmlElement.style.transform = `scale(${finalConfig.scale})`;
    htmlElement.style.opacity = finalConfig.opacity.toString();

    setTimeout(() => {
      // Reset to original state
      htmlElement.style.transform = originalTransform;
      htmlElement.style.opacity = originalOpacity;
      
      setTimeout(() => {
        htmlElement.style.transition = '';
        resolve();
      }, finalConfig.duration);
    }, finalConfig.duration / 2);
  });
}

export function animateDropError(
  element: Element,
  config: Partial<DragDropAnimationConfig> = {}
): Promise<void> {
  const finalConfig: DragDropAnimationConfig = {
    duration: 400,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    scale: 1.1,
    opacity: 0.6,
    ...config,
  };

  return new Promise(resolve => {
    const htmlElement = element as HTMLElement;
    const originalTransform = htmlElement.style.transform;
    const originalOpacity = htmlElement.style.opacity;

    // Apply error animation (shake effect)
    htmlElement.style.transition = `all ${finalConfig.duration}ms ${finalConfig.easing}`;
    htmlElement.style.transform = `scale(${finalConfig.scale}) translateX(-10px)`;
    htmlElement.style.opacity = finalConfig.opacity.toString();

    setTimeout(() => {
      htmlElement.style.transform = `scale(${finalConfig.scale}) translateX(10px)`;
    }, finalConfig.duration / 4);

    setTimeout(() => {
      htmlElement.style.transform = `scale(${finalConfig.scale}) translateX(-5px)`;
    }, finalConfig.duration / 2);

    setTimeout(() => {
      htmlElement.style.transform = `scale(${finalConfig.scale}) translateX(5px)`;
    }, (finalConfig.duration / 4) * 3);

    setTimeout(() => {
      // Reset to original state
      htmlElement.style.transform = originalTransform;
      htmlElement.style.opacity = originalOpacity;
      
      setTimeout(() => {
        htmlElement.style.transition = '';
        resolve();
      }, 50);
    }, finalConfig.duration);
  });
}

// State management utilities
export function createDragDropState(): DragDropState {
  return {
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
  };
}

export function updateDragDropState(
  currentState: DragDropState,
  updates: Partial<DragDropState>
): DragDropState {
  return {
    ...currentState,
    ...updates,
  };
}

export function resetDragDropState(): DragDropState {
  return createDragDropState();
}

// Accessibility utilities
export function announceDropAction(
  action: string,
  itemType: 'section' | 'element',
  itemId: string,
  position?: 'before' | 'after',
  targetId?: string
): void {
  const messages = {
    'drag-start': `Started dragging ${itemType} ${itemId}`,
    'drag-over': `Dragging ${itemType} ${itemId} over ${targetId}`,
    'drop-success': `Successfully moved ${itemType} ${itemId} ${position} ${targetId}`,
    'drop-error': `Failed to move ${itemType} ${itemId}`,
    'drop-cancel': `Cancelled dragging ${itemType} ${itemId}`,
  };

  const message = messages[action as keyof typeof messages] || action;
  
  // Create or update ARIA live region
  let liveRegion = document.getElementById('drag-drop-announcements');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'drag-drop-announcements';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-9999px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }

  liveRegion.textContent = message;
}

// Touch utilities
export function getTouchPosition(event: TouchEvent): { x: number; y: number } {
  const touch = event.touches[0] || event.changedTouches[0];
  return {
    x: touch.clientX,
    y: touch.clientY,
  };
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Performance utilities
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

// Cleanup utilities
export function cleanupDragDropState(): void {
  // Remove any ghost elements
  const ghostElements = document.querySelectorAll('[data-drag-ghost]');
  ghostElements.forEach(el => el.remove());

  // Remove active drop zones
  const activeZones = document.querySelectorAll('.drag-drop-zone-active');
  activeZones.forEach(zone => zone.classList.remove('drag-drop-zone-active'));

  // Reset body styles
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  // Clear any drag-related classes
  const draggingElements = document.querySelectorAll('.dragging');
  draggingElements.forEach(el => el.classList.remove('dragging'));
}

// Debug utilities
export function logDragDropState(state: DragDropState, action: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🎯 Drag-Drop: ${action}`);
    console.log('State:', state);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
}

export function validateDragDropIntegrity(
  sections: string[],
  content: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if all sections exist in content
  sections.forEach(sectionId => {
    if (!content[sectionId]) {
      errors.push(`Section ${sectionId} exists in layout but not in content`);
    }
  });

  // Check for orphaned content
  Object.keys(content).forEach(sectionId => {
    if (!sections.includes(sectionId)) {
      errors.push(`Section ${sectionId} exists in content but not in layout`);
    }
  });

  // Check element integrity within sections
  Object.entries(content).forEach(([sectionId, section]: [string, any]) => {
    if (section.elements) {
      const elementKeys = Object.keys(section.elements);
      const positions = elementKeys.map(key => section.elements[key].metadata?.position || 0);
      const uniquePositions = [...new Set(positions)];
      
      if (positions.length !== uniquePositions.length) {
        errors.push(`Section ${sectionId} has duplicate element positions`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}