// utils/toolbarPositioning.ts - Core positioning utilities and collision detection
import type { ToolbarPosition, ToolbarType, PositionBounds } from '@/types/core/ui';

export interface ToolbarConfig {
  type: ToolbarType;
  position: ToolbarPosition;
  bounds?: DOMRect;
}

export interface PositionConstraints extends PositionBounds {
  margin: number;
}

// Default toolbar dimensions (will be measured from actual DOM elements when available)
const TOOLBAR_DIMENSIONS = {
  section: { width: 280, height: 48 },
  element: { width: 320, height: 48 },
  text: { width: 360, height: 48 },
  form: { width: 300, height: 48 },
  image: { width: 280, height: 48 },
  ai: { width: 250, height: 48 },
  context: { width: 200, height: 48 },
  floating: { width: 300, height: 48 },
  inline: { width: 250, height: 36 },
} as const;

const VIEWPORT_MARGIN = 8; // Minimum distance from viewport edges
const TOOLBAR_SPACING = 12; // Minimum space between toolbars
const POSITION_OFFSET = 10; // Default offset from target element

/**
 * Calculate optimal position with collision detection and fallback
 */
export function calculateOptimalPosition(
  targetBounds: DOMRect,
  toolbarType: ToolbarType,
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' = 'top'
): ToolbarPosition {
  const dimensions = TOOLBAR_DIMENSIONS[toolbarType];
  const constraints = getViewportConstraints();
  
  // Try preferred position first
  let position = calculatePositionForSide(targetBounds, dimensions, preferredPosition);
  
  if (isPositionValid(position, dimensions, constraints)) {
    return {
      x: position.x,
      y: position.y,
      strategy: 'fixed',
      anchor: preferredPosition,
      offset: { x: 0, y: 0 },
      bounds: constraints,
    };
  }
  
  // Try fallback positions in order: Bottom → Right → Left → Offset
  const fallbackOrder: Array<'top' | 'bottom' | 'left' | 'right'> = 
    preferredPosition === 'top' ? ['bottom', 'right', 'left'] :
    preferredPosition === 'bottom' ? ['top', 'right', 'left'] :
    preferredPosition === 'left' ? ['right', 'top', 'bottom'] :
    ['left', 'top', 'bottom'];
  
  for (const side of fallbackOrder) {
    position = calculatePositionForSide(targetBounds, dimensions, side);
    
    if (isPositionValid(position, dimensions, constraints)) {
      return {
        x: position.x,
        y: position.y,
        strategy: 'fixed',
        anchor: side,
        offset: { x: 0, y: 0 },
        bounds: constraints,
      };
    }
  }
  
  // Last resort: offset position with arrow
  position = calculateOffsetPosition(targetBounds, dimensions, constraints);
  
  return {
    x: position.x,
    y: position.y,
    strategy: 'fixed',
    anchor: 'center',
    offset: { x: position.x - targetBounds.left, y: position.y - targetBounds.top },
    bounds: constraints,
  };
}

/**
 * Calculate position for a specific side of the target
 */
function calculatePositionForSide(
  targetBounds: DOMRect,
  dimensions: { width: number; height: number },
  side: 'top' | 'bottom' | 'left' | 'right'
): { x: number; y: number } {
  const centerX = targetBounds.left + targetBounds.width / 2;
  const centerY = targetBounds.top + targetBounds.height / 2;
  
  switch (side) {
    case 'top':
      return {
        x: centerX - dimensions.width / 2,
        y: targetBounds.top - dimensions.height - POSITION_OFFSET,
      };
    
    case 'bottom':
      return {
        x: centerX - dimensions.width / 2,
        y: targetBounds.bottom + POSITION_OFFSET,
      };
    
    case 'left':
      return {
        x: targetBounds.left - dimensions.width - POSITION_OFFSET,
        y: centerY - dimensions.height / 2,
      };
    
    case 'right':
      return {
        x: targetBounds.right + POSITION_OFFSET,
        y: centerY - dimensions.height / 2,
      };
  }
}

/**
 * Calculate offset position when no side works
 */
function calculateOffsetPosition(
  targetBounds: DOMRect,
  dimensions: { width: number; height: number },
  constraints: PositionConstraints
): { x: number; y: number } {
  const centerX = targetBounds.left + targetBounds.width / 2;
  const centerY = targetBounds.top + targetBounds.height / 2;
  
  // Try to position at center, then adjust to viewport
  let x = centerX - dimensions.width / 2;
  let y = centerY - dimensions.height / 2;
  
  // Clamp to viewport bounds
  x = Math.max(constraints.minX, Math.min(x, constraints.maxX - dimensions.width));
  y = Math.max(constraints.minY, Math.min(y, constraints.maxY - dimensions.height));
  
  return { x, y };
}

/**
 * Adjust position to fit within viewport boundaries
 */
export function adjustForViewport(
  position: ToolbarPosition,
  toolbarType: ToolbarType
): ToolbarPosition {
  const dimensions = TOOLBAR_DIMENSIONS[toolbarType];
  const constraints = getViewportConstraints();
  
  const adjustedPosition = { ...position };
  
  // Clamp X coordinate
  if (position.x < constraints.minX) {
    adjustedPosition.x = constraints.minX;
  } else if (position.x + dimensions.width > constraints.maxX) {
    adjustedPosition.x = constraints.maxX - dimensions.width;
  }
  
  // Clamp Y coordinate
  if (position.y < constraints.minY) {
    adjustedPosition.y = constraints.minY;
  } else if (position.y + dimensions.height > constraints.maxY) {
    adjustedPosition.y = constraints.maxY - dimensions.height;
  }
  
  return adjustedPosition;
}

/**
 * Resolve collisions with other visible toolbars
 */
export function resolveCollisions(
  newToolbar: ToolbarConfig,
  existingToolbars: ToolbarConfig[]
): ToolbarPosition {
  const newDimensions = TOOLBAR_DIMENSIONS[newToolbar.type];
  let position = { ...newToolbar.position };
  
  for (const existing of existingToolbars) {
    if (existing.type === newToolbar.type) continue; // Skip same type
    
    const existingDimensions = TOOLBAR_DIMENSIONS[existing.type];
    
    // Check for collision
    if (isColliding(position, newDimensions, existing.position, existingDimensions)) {
      // Resolve collision by offsetting
      const newPos = resolveCollision(position, newDimensions, existing.position, existingDimensions);
      position = { ...position, x: newPos.x, y: newPos.y };
    }
  }
  
  // Ensure final position is still within viewport
  return adjustForViewport(
    {
      ...newToolbar.position,
      x: position.x,
      y: position.y,
    },
    newToolbar.type
  );
}

/**
 * Check if two rectangles are colliding
 */
function isColliding(
  pos1: { x: number; y: number },
  dim1: { width: number; height: number },
  pos2: { x: number; y: number },
  dim2: { width: number; height: number }
): boolean {
  return !(
    pos1.x + dim1.width + TOOLBAR_SPACING < pos2.x ||
    pos2.x + dim2.width + TOOLBAR_SPACING < pos1.x ||
    pos1.y + dim1.height + TOOLBAR_SPACING < pos2.y ||
    pos2.y + dim2.height + TOOLBAR_SPACING < pos1.y
  );
}

/**
 * Resolve collision between two toolbars
 */
function resolveCollision(
  newPos: { x: number; y: number },
  newDim: { width: number; height: number },
  existingPos: { x: number; y: number },
  existingDim: { width: number; height: number }
): { x: number; y: number } {
  const constraints = getViewportConstraints();
  
  // Try moving right
  let rightPos = {
    x: existingPos.x + existingDim.width + TOOLBAR_SPACING,
    y: newPos.y,
  };
  
  if (rightPos.x + newDim.width <= constraints.maxX) {
    return rightPos;
  }
  
  // Try moving left
  let leftPos = {
    x: existingPos.x - newDim.width - TOOLBAR_SPACING,
    y: newPos.y,
  };
  
  if (leftPos.x >= constraints.minX) {
    return leftPos;
  }
  
  // Try moving down
  let downPos = {
    x: newPos.x,
    y: existingPos.y + existingDim.height + TOOLBAR_SPACING,
  };
  
  if (downPos.y + newDim.height <= constraints.maxY) {
    return downPos;
  }
  
  // Try moving up
  let upPos = {
    x: newPos.x,
    y: existingPos.y - newDim.height - TOOLBAR_SPACING,
  };
  
  if (upPos.y >= constraints.minY) {
    return upPos;
  }
  
  // Last resort: offset to available space
  return findAvailableSpace(newDim, constraints);
}

/**
 * Find available space in viewport
 */
function findAvailableSpace(
  dimensions: { width: number; height: number },
  constraints: PositionConstraints
): { x: number; y: number } {
  // Simple strategy: try top-left area first
  const gridSize = 50;
  
  for (let y = constraints.minY; y <= constraints.maxY - dimensions.height; y += gridSize) {
    for (let x = constraints.minX; x <= constraints.maxX - dimensions.width; x += gridSize) {
      return { x, y };
    }
  }
  
  // Fallback to top-left corner
  return { x: constraints.minX, y: constraints.minY };
}

/**
 * Update toolbar position when target element scrolls
 */
export function updatePositionOnScroll(
  toolbarId: string,
  targetElement: HTMLElement,
  toolbarType: ToolbarType
): ToolbarPosition | null {
  if (!targetElement || !document.contains(targetElement)) {
    return null;
  }
  
  const targetBounds = targetElement.getBoundingClientRect();
  
  // If target is not visible, hide toolbar
  if (targetBounds.width === 0 || targetBounds.height === 0) {
    return null;
  }
  
  // Recalculate position
  return calculateOptimalPosition(targetBounds, toolbarType);
}

/**
 * Get visible toolbars from store state
 */
export function getVisibleToolbars(floatingToolbars: any): ToolbarConfig[] {
  return Object.entries(floatingToolbars)
    .filter(([_, toolbar]: [string, any]) => toolbar.visible)
    .map(([type, toolbar]: [string, any]) => ({
      type: type as ToolbarType,
      position: {
        x: toolbar.position.x,
        y: toolbar.position.y,
        strategy: 'fixed' as const,
        anchor: 'top' as const,
        offset: { x: 0, y: 0 },
        bounds: getViewportConstraints(),
      },
    }));
}

/**
 * Check if position is valid within constraints
 */
function isPositionValid(
  position: { x: number; y: number },
  dimensions: { width: number; height: number },
  constraints: PositionConstraints
): boolean {
  return (
    position.x >= constraints.minX &&
    position.x + dimensions.width <= constraints.maxX &&
    position.y >= constraints.minY &&
    position.y + dimensions.height <= constraints.maxY
  );
}

/**
 * Get current viewport constraints
 */
function getViewportConstraints(): PositionConstraints {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  
  return {
    minX: VIEWPORT_MARGIN,
    maxX: viewport.width - VIEWPORT_MARGIN,
    minY: VIEWPORT_MARGIN,
    maxY: viewport.height - VIEWPORT_MARGIN,
    margin: VIEWPORT_MARGIN,
  };
}

/**
 * Measure actual toolbar dimensions from DOM element
 */
export function measureToolbarDimensions(toolbarElement: HTMLElement): { width: number; height: number } {
  const rect = toolbarElement.getBoundingClientRect();
  return {
    width: rect.width || TOOLBAR_DIMENSIONS.floating.width,
    height: rect.height || TOOLBAR_DIMENSIONS.floating.height,
  };
}

/**
 * Calculate arrow position for offset toolbars
 */
export function calculateArrowPosition(
  toolbarPosition: { x: number; y: number },
  targetBounds: DOMRect,
  toolbarDimensions: { width: number; height: number }
): { x: number; y: number; direction: 'up' | 'down' | 'left' | 'right' } {
  const toolbarCenter = {
    x: toolbarPosition.x + toolbarDimensions.width / 2,
    y: toolbarPosition.y + toolbarDimensions.height / 2,
  };
  
  const targetCenter = {
    x: targetBounds.left + targetBounds.width / 2,
    y: targetBounds.top + targetBounds.height / 2,
  };
  
  const deltaX = targetCenter.x - toolbarCenter.x;
  const deltaY = targetCenter.y - toolbarCenter.y;
  
  // Determine arrow direction based on relative position
  let direction: 'up' | 'down' | 'left' | 'right';
  let arrowX: number;
  let arrowY: number;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal arrow
    direction = deltaX > 0 ? 'right' : 'left';
    arrowX = direction === 'right' ? toolbarDimensions.width : 0;
    arrowY = Math.max(8, Math.min(toolbarDimensions.height - 8, toolbarCenter.y - toolbarPosition.y));
  } else {
    // Vertical arrow
    direction = deltaY > 0 ? 'down' : 'up';
    arrowX = Math.max(8, Math.min(toolbarDimensions.width - 8, toolbarCenter.x - toolbarPosition.x));
    arrowY = direction === 'down' ? toolbarDimensions.height : 0;
  }
  
  return { x: arrowX, y: arrowY, direction };
}

/**
 * Debounced position update for performance
 */
export function createDebouncedPositionUpdate(
  updateFn: () => void,
  delay: number = 16
): () => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(updateFn, delay);
  };
}