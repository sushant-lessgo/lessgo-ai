// utils/simpleToolbarPositioning.ts - Simplified toolbar positioning without store updates

export interface Position {
  x: number;
  y: number;
}

export interface PositionOptions {
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
  padding?: number;
}

/**
 * Calculate optimal toolbar position relative to target element
 * Uses simple heuristics instead of complex collision detection
 */
export function calculateToolbarPosition(
  targetElement: HTMLElement,
  toolbarElement: HTMLElement,
  options: PositionOptions = {}
): Position {
  const {
    preferredPosition = 'top',
    offset = { x: 0, y: 0 },
    padding = 12
  } = options;

  const targetRect = targetElement.getBoundingClientRect();
  const toolbarRect = toolbarElement.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    top: 0,
    left: 0
  };

  let position: Position = { x: 0, y: 0 };

  // Calculate base position based on preference
  switch (preferredPosition) {
    case 'top':
      position = {
        x: targetRect.left + targetRect.width / 2 - toolbarRect.width / 2,
        y: targetRect.top - toolbarRect.height - padding
      };
      break;
      
    case 'bottom':
      position = {
        x: targetRect.left + targetRect.width / 2 - toolbarRect.width / 2,
        y: targetRect.bottom + padding
      };
      break;
      
    case 'left':
      position = {
        x: targetRect.left - toolbarRect.width - padding,
        y: targetRect.top + targetRect.height / 2 - toolbarRect.height / 2
      };
      break;
      
    case 'right':
      position = {
        x: targetRect.right + padding,
        y: targetRect.top + targetRect.height / 2 - toolbarRect.height / 2
      };
      break;
  }

  // Apply offset
  position.x += offset.x;
  position.y += offset.y;

  // Simple boundary checks - keep toolbar in viewport
  if (position.x < 10) {
    position.x = 10;
  } else if (position.x + toolbarRect.width > viewport.width - 10) {
    position.x = viewport.width - toolbarRect.width - 10;
  }

  if (position.y < 10) {
    // If top position doesn't fit, try bottom
    position.y = targetRect.bottom + padding;
  } else if (position.y + toolbarRect.height > viewport.height - 10) {
    // If bottom position doesn't fit, try top
    position.y = targetRect.top - toolbarRect.height - padding;
  }

  return position;
}

/**
 * Update toolbar position directly via DOM manipulation
 * This avoids triggering store updates and re-renders
 */
export function updateToolbarPosition(
  toolbarElement: HTMLElement,
  position: Position
): void {
  toolbarElement.style.left = `${position.x}px`;
  toolbarElement.style.top = `${position.y}px`;
  toolbarElement.style.position = 'fixed';
  toolbarElement.style.zIndex = '1000';
}

/**
 * Auto-update toolbar position when target moves
 */
export function createPositionTracker(
  targetElement: HTMLElement,
  toolbarElement: HTMLElement,
  options: PositionOptions = {}
): () => void {
  let rafId: number | null = null;
  let isDestroyed = false;

  const updatePosition = () => {
    if (isDestroyed) return;
    
    if (targetElement.isConnected && toolbarElement.isConnected) {
      const position = calculateToolbarPosition(targetElement, toolbarElement, options);
      updateToolbarPosition(toolbarElement, position);
    }
    
    rafId = requestAnimationFrame(updatePosition);
  };

  // Start tracking
  rafId = requestAnimationFrame(updatePosition);

  // Return cleanup function
  return () => {
    isDestroyed = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

/**
 * Simple collision detection for multiple toolbars
 */
export function avoidToolbarCollision(
  toolbarElement: HTMLElement,
  position: Position,
  existingToolbars: HTMLElement[] = []
): Position {
  const adjustedPosition = { ...position };
  const toolbarRect = toolbarElement.getBoundingClientRect();
  
  for (const existingToolbar of existingToolbars) {
    if (existingToolbar === toolbarElement) continue;
    
    const existingRect = existingToolbar.getBoundingClientRect();
    
    // Check for overlap
    const hasOverlap = !(
      adjustedPosition.x + toolbarRect.width < existingRect.left ||
      adjustedPosition.x > existingRect.right ||
      adjustedPosition.y + toolbarRect.height < existingRect.top ||
      adjustedPosition.y > existingRect.bottom
    );
    
    if (hasOverlap) {
      // Simple collision resolution: move down
      adjustedPosition.y = existingRect.bottom + 8;
    }
  }
  
  return adjustedPosition;
}