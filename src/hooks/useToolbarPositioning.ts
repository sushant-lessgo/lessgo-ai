// hooks/useToolbarPositioning.ts - Smart positioning system for floating toolbars
import { useCallback, useEffect, useRef } from 'react';
import { useEditStore } from './useEditStore';
import type { ToolbarPosition, ToolbarType } from '@/types/core/ui';
import { 
  calculateOptimalPosition, 
  adjustForViewport, 
  resolveCollisions,
  updatePositionOnScroll,
  getVisibleToolbars
} from '@/utils/toolbarPositioning';

export interface PositioningOptions {
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
  autoHide?: boolean;
  followTarget?: boolean;
  avoidCollisions?: boolean;
}

export function useToolbarPositioning() {
  const {
    floatingToolbars,
    showSectionToolbar,
    showElementToolbar,
    showFormToolbar,
    showImageToolbar,
    hideSectionToolbar,
    hideElementToolbar,
    hideFormToolbar,
    hideImageToolbar,
  } = useEditStore();

  const positionCacheRef = useRef<Map<string, ToolbarPosition>>(new Map());
  const scrollListenerRef = useRef<(() => void) | null>(null);
  const resizeListenerRef = useRef<(() => void) | null>(null);

  // Calculate optimal position for toolbar
  const calculatePosition = useCallback((
    targetElement: HTMLElement,
    toolbarType: ToolbarType,
    options: PositioningOptions = {}
  ): ToolbarPosition => {
    const {
      preferredPosition = 'top',
      offset = { x: 0, y: 0 },
      avoidCollisions = true,
    } = options;

    // Get target element bounds
    const targetBounds = targetElement.getBoundingClientRect();
    
    // Calculate base position
    let basePosition = calculateOptimalPosition(
      targetBounds,
      toolbarType,
      preferredPosition
    );

    // Apply custom offset
    basePosition.x += offset.x;
    basePosition.y += offset.y;

    // Adjust for viewport boundaries
    basePosition = adjustForViewport(basePosition, toolbarType);

    // Resolve collisions with other toolbars
    if (avoidCollisions) {
      const visibleToolbars = getVisibleToolbars(floatingToolbars);
      basePosition = resolveCollisions(
        { type: toolbarType, position: basePosition },
        visibleToolbars
      );
    }

    // Cache the position
    const cacheKey = `${toolbarType}-${targetElement.id || targetElement.dataset.sectionId}`;
    positionCacheRef.current.set(cacheKey, basePosition);

    return basePosition;
  }, [floatingToolbars]);

  // Show toolbar with smart positioning
  const showSmartToolbar = useCallback((
    toolbarType: ToolbarType,
    targetId: string,
    options: PositioningOptions = {}
  ) => {
    const targetElement = document.querySelector(
      toolbarType === 'section' 
        ? `[data-section-id="${targetId}"]`
        : toolbarType === 'element'
        ? `[data-section-id="${targetId.split('.')[0]}"] [data-element-key="${targetId.split('.')[1]}"]`
        : `[data-${toolbarType}-id="${targetId}"]`
    ) as HTMLElement;

    if (!targetElement) {
      console.warn(`Target element not found for ${toolbarType}: ${targetId}`);
      return;
    }

    const position = calculatePosition(targetElement, toolbarType, options);

    // Show appropriate toolbar
    switch (toolbarType) {
      case 'section':
        showSectionToolbar(targetId, { x: position.x, y: position.y });
        break;
      case 'element':
        showElementToolbar(targetId, { x: position.x, y: position.y });
        break;
      case 'form':
        showFormToolbar(targetId, { x: position.x, y: position.y });
        break;
      case 'image':
        showImageToolbar(targetId, { x: position.x, y: position.y });
        break;
    }

    // Setup follow target behavior
    if (options.followTarget) {
      setupTargetFollowing(targetElement, toolbarType, targetId, options);
    }
  }, [
    calculatePosition,
    showSectionToolbar,
    showElementToolbar,
    showFormToolbar,
    showImageToolbar
  ]);

  // Setup target following (position updates on scroll/resize)
  const setupTargetFollowing = useCallback((
    targetElement: HTMLElement,
    toolbarType: ToolbarType,
    targetId: string,
    options: PositioningOptions
  ) => {
    // Clean up existing listeners
    if (scrollListenerRef.current) {
      window.removeEventListener('scroll', scrollListenerRef.current, true);
    }
    if (resizeListenerRef.current) {
      window.removeEventListener('resize', resizeListenerRef.current);
    }

    // Throttled update function
    let updateTimeout: NodeJS.Timeout;
    const throttledUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        const newPosition = calculatePosition(targetElement, toolbarType, options);
        
        // Update store with new position
        switch (toolbarType) {
          case 'section':
            if (floatingToolbars.section.visible) {
              showSectionToolbar(targetId, { x: newPosition.x, y: newPosition.y });
            }
            break;
          case 'element':
            if (floatingToolbars.element.visible) {
              showElementToolbar(targetId, { x: newPosition.x, y: newPosition.y });
            }
            break;
          case 'form':
            if (floatingToolbars.form.visible) {
              showFormToolbar(targetId, { x: newPosition.x, y: newPosition.y });
            }
            break;
          case 'image':
            if (floatingToolbars.image.visible) {
              showImageToolbar(targetId, { x: newPosition.x, y: newPosition.y });
            }
            break;
        }
      }, 16); // 60fps throttling
    };

    // Setup new listeners
    scrollListenerRef.current = throttledUpdate;
    resizeListenerRef.current = throttledUpdate;

    window.addEventListener('scroll', scrollListenerRef.current, true);
    window.addEventListener('resize', resizeListenerRef.current);
  }, [
    calculatePosition,
    floatingToolbars,
    showSectionToolbar,
    showElementToolbar,
    showFormToolbar,
    showImageToolbar
  ]);

  // Hide toolbar with cleanup
  const hideSmartToolbar = useCallback((toolbarType: ToolbarType) => {
    // Hide appropriate toolbar
    switch (toolbarType) {
      case 'section':
        hideSectionToolbar();
        break;
      case 'element':
        hideElementToolbar();
        break;
      case 'form':
        hideFormToolbar();
        break;
      case 'image':
        hideImageToolbar();
        break;
    }

    // Clean up position cache
    const keysToRemove = Array.from(positionCacheRef.current.keys())
      .filter(key => key.startsWith(`${toolbarType}-`));
    keysToRemove.forEach(key => positionCacheRef.current.delete(key));

    // Clean up listeners if no toolbars are visible
    const anyVisible = Object.values(floatingToolbars).some(toolbar => toolbar.visible);
    if (!anyVisible) {
      if (scrollListenerRef.current) {
        window.removeEventListener('scroll', scrollListenerRef.current, true);
        scrollListenerRef.current = null;
      }
      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current);
        resizeListenerRef.current = null;
      }
    }
  }, [
    hideSectionToolbar,
    hideElementToolbar,
    hideFormToolbar,
    hideImageToolbar,
    floatingToolbars
  ]);

  // Update all visible toolbar positions
  const updateAllPositions = useCallback(() => {
    Object.entries(floatingToolbars).forEach(([type, toolbar]) => {
      if (toolbar.visible && toolbar.targetId) {
        const targetElement = document.querySelector(
          type === 'section' 
            ? `[data-section-id="${toolbar.targetId}"]`
            : type === 'element'
            ? `[data-section-id="${toolbar.targetId.split('.')[0]}"] [data-element-key="${toolbar.targetId.split('.')[1]}"]`
            : `[data-${type}-id="${toolbar.targetId}"]`
        ) as HTMLElement;

        if (targetElement) {
          const newPosition = calculatePosition(
            targetElement, 
            type as ToolbarType,
            { followTarget: true }
          );

          // Update position in store
          switch (type) {
            case 'section':
              showSectionToolbar(toolbar.targetId, { x: newPosition.x, y: newPosition.y });
              break;
            case 'element':
              showElementToolbar(toolbar.targetId, { x: newPosition.x, y: newPosition.y });
              break;
            case 'form':
              showFormToolbar(toolbar.targetId, { x: newPosition.x, y: newPosition.y });
              break;
            case 'image':
              showImageToolbar(toolbar.targetId, { x: newPosition.x, y: newPosition.y });
              break;
          }
        }
      }
    });
  }, [
    floatingToolbars,
    calculatePosition,
    showSectionToolbar,
    showElementToolbar,
    showFormToolbar,
    showImageToolbar
  ]);

  // Check if point is inside any visible toolbar
  const isPointInToolbar = useCallback((x: number, y: number): boolean => {
    return Object.values(floatingToolbars).some(toolbar => {
      if (!toolbar.visible) return false;
      
      // Approximate toolbar bounds (will be refined with actual DOM measurement)
      const toolbarWidth = 300; // Estimated toolbar width
      const toolbarHeight = 48; // Estimated toolbar height
      
      return x >= toolbar.position.x && 
             x <= toolbar.position.x + toolbarWidth &&
             y >= toolbar.position.y && 
             y <= toolbar.position.y + toolbarHeight;
    });
  }, [floatingToolbars]);

  // Get cached position for a target
  const getCachedPosition = useCallback((toolbarType: ToolbarType, targetId: string): ToolbarPosition | null => {
    const cacheKey = `${toolbarType}-${targetId}`;
    return positionCacheRef.current.get(cacheKey) || null;
  }, []);

  // Clear position cache
  const clearPositionCache = useCallback(() => {
    positionCacheRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollListenerRef.current) {
        window.removeEventListener('scroll', scrollListenerRef.current, true);
      }
      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current);
      }
    };
  }, []);

  return {
    // Core positioning
    calculatePosition,
    showSmartToolbar,
    hideSmartToolbar,
    updateAllPositions,
    
    // Utility functions
    isPointInToolbar,
    getCachedPosition,
    clearPositionCache,
    
    // State
    visibleToolbars: Object.entries(floatingToolbars)
      .filter(([_, toolbar]) => toolbar.visible)
      .map(([type, toolbar]) => ({ type: type as ToolbarType, ...toolbar })),
  };
}