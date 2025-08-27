import { logger } from '@/lib/logger';

// Fix 3: Selection handler architecture - attach once per DOM node using WeakMap
// Prevents attach/detach thrashing by keying handlers to DOM nodes, not selection state

interface NodeSelectionHandler {
  editorId: string;
  componentOwner: string;
  attachedAt: number;
  controller: AbortController;
  listeners: {
    selectionchange: () => void;
    pointerdown: (e: PointerEvent) => void;
    pointerup: (e: PointerEvent) => void;
    focusout: (e: FocusEvent) => void;
  };
}

// WeakMap keyed by DOM node - handlers survive as long as the node exists
const nodeHandlers = new WeakMap<Element, NodeSelectionHandler>();
const handlerCounts = new Map<string, number>(); // Track handlers per editor for debugging

export interface SelectionHandlerOptions {
  editorId: string;
  componentOwner?: string;
  onSelectionChange?: () => void;
  onPointerDown?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onFocusOut?: (e: FocusEvent) => void;
}

/**
 * Attach selection handler to a DOM node (once per node)
 * Uses WeakMap to prevent thrashing - handler stays until node is garbage collected
 */
export function attachSelectionHandlerToNode(
  node: Element,
  options: SelectionHandlerOptions
): () => void {
  const { editorId, componentOwner = 'unknown', ...callbacks } = options;
  
  // Check if handler already exists for this node
  const existingHandler = nodeHandlers.get(node);
  if (existingHandler) {
    logger.debug('🔄 [DOM-HANDLER] Handler already exists for node, reusing:', {
      editorId,
      existingEditorId: existingHandler.editorId,
      componentOwner,
      existingOwner: existingHandler.componentOwner,
      nodeType: node.tagName,
      reusingHandler: true
    });
    
    // Return cleanup function for the existing handler
    return () => {
      cleanupNodeHandler(node);
    };
  }
  
  // Create new handler
  const controller = new AbortController();
  const { signal } = controller;
  
  // Create throttled handlers (same logic as before but DOM-node scoped)
  const pendingUpdates = {
    selectionChanges: 0,
    pointerEvents: [] as PointerEvent[],
    focusEvents: [] as FocusEvent[]
  };
  
  let rafId: number | null = null;
  
  const flushUpdates = () => {
    if (pendingUpdates.selectionChanges > 0) {
      callbacks.onSelectionChange?.();
      pendingUpdates.selectionChanges = 0;
    }
    
    if (pendingUpdates.pointerEvents.length > 0) {
      const lastEvent = pendingUpdates.pointerEvents[pendingUpdates.pointerEvents.length - 1];
      if (lastEvent.type === 'pointerdown') {
        callbacks.onPointerDown?.(lastEvent);
      } else if (lastEvent.type === 'pointerup') {
        callbacks.onPointerUp?.(lastEvent);
      }
      pendingUpdates.pointerEvents = [];
    }
    
    if (pendingUpdates.focusEvents.length > 0) {
      const lastEvent = pendingUpdates.focusEvents[pendingUpdates.focusEvents.length - 1];
      callbacks.onFocusOut?.(lastEvent);
      pendingUpdates.focusEvents = [];
    }
    
    rafId = null;
  };
  
  const scheduleUpdate = () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(flushUpdates);
    }
  };
  
  // Create listener functions
  const listeners = {
    selectionchange: () => {
      pendingUpdates.selectionChanges++;
      scheduleUpdate();
    },
    
    pointerdown: (e: PointerEvent) => {
      pendingUpdates.pointerEvents.push(e);
      scheduleUpdate();
    },
    
    pointerup: (e: PointerEvent) => {
      pendingUpdates.pointerEvents.push(e);
      scheduleUpdate();
    },
    
    focusout: (e: FocusEvent) => {
      pendingUpdates.focusEvents.push(e);
      scheduleUpdate();
    }
  };
  
  // Attach listeners with capture phase and AbortController
  document.addEventListener('selectionchange', listeners.selectionchange, { capture: true, signal });
  document.addEventListener('pointerdown', listeners.pointerdown, { capture: true, signal });
  document.addEventListener('pointerup', listeners.pointerup, { capture: true, signal });
  document.addEventListener('focusout', listeners.focusout, { capture: true, signal });
  
  // Store handler in WeakMap
  const handler: NodeSelectionHandler = {
    editorId,
    componentOwner,
    attachedAt: Date.now(),
    controller,
    listeners
  };
  
  nodeHandlers.set(node, handler);
  
  // Update handler count for debugging
  const currentCount = handlerCounts.get(editorId) || 0;
  handlerCounts.set(editorId, currentCount + 1);
  
  logger.debug('✅ [DOM-HANDLER] Attached selection handler to DOM node:', {
    editorId,
    componentOwner,
    nodeType: node.tagName,
    handlerCount: handlerCounts.get(editorId),
    nodeId: node.id || 'no-id',
    className: node.className || 'no-class'
  });
  
  // Return cleanup function
  return () => {
    cleanupNodeHandler(node);
  };
}

/**
 * Clean up handler for a specific DOM node
 */
function cleanupNodeHandler(node: Element): void {
  const handler = nodeHandlers.get(node);
  if (!handler) {
    logger.warn('⚠️ [DOM-HANDLER] Attempted to cleanup non-existent handler for node:', {
      nodeType: node.tagName,
      nodeId: node.id || 'no-id'
    });
    return;
  }
  
  // Abort all listeners
  handler.controller.abort();
  
  // Remove from WeakMap
  nodeHandlers.delete(node);
  
  // Update handler count
  const currentCount = handlerCounts.get(handler.editorId) || 0;
  const newCount = Math.max(0, currentCount - 1);
  if (newCount === 0) {
    handlerCounts.delete(handler.editorId);
  } else {
    handlerCounts.set(handler.editorId, newCount);
  }
  
  logger.debug('🧹 [DOM-HANDLER] Cleaned up selection handler from DOM node:', {
    editorId: handler.editorId,
    componentOwner: handler.componentOwner,
    nodeType: node.tagName,
    handlerCount: handlerCounts.get(handler.editorId) || 0,
    wasAttachedFor: Date.now() - handler.attachedAt + 'ms'
  });
}

/**
 * Get debugging information about active handlers
 */
export function getHandlerDebugInfo(): Record<string, any> {
  const info: Record<string, any> = {};
  
  for (const [editorId, count] of handlerCounts.entries()) {
    info[editorId] = {
      handlerCount: count,
      editorId
    };
  }
  
  return {
    handlersPerEditor: info,
    totalHandlers: Array.from(handlerCounts.values()).reduce((sum, count) => sum + count, 0)
  };
}

// Development utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).__domSelectionHandlers = {
    getDebugInfo: getHandlerDebugInfo,
    handlerCounts,
    // Note: nodeHandlers WeakMap is not directly inspectable
  };
  
  logger.debug('🔧 DOM Selection Handler debug utilities available at window.__domSelectionHandlers');
}