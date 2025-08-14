// Interaction source tracking with bulletproof reset
// Tracks where user interactions originate to prevent incorrect toolbar switching

export type InteractionSource = 'toolbar' | 'editor' | null;

// Global interaction source ref (not React state for immediate availability)
let interactionSource: InteractionSource = null;

// Track if we're in the middle of a composition (IME)
let isComposing = false;

/**
 * Set the current interaction source
 * @param source - Where the interaction originated from
 */
export function setInteractionSource(source: InteractionSource): void {
  interactionSource = source;
  // console.log('🎯 Interaction source set:', source, new Date().toISOString());
}

/**
 * Get the current interaction source
 * @returns The current interaction source
 */
export function getInteractionSource(): InteractionSource {
  return interactionSource;
}

/**
 * Clear interaction source with bulletproof cleanup
 * Uses both synchronous and microtask cleanup for safety
 */
export function clearInteractionSource(): void {
  interactionSource = null;
  
  // Extra safety: clear in next microtask to prevent masking legitimate interactions
  queueMicrotask(() => {
    if (interactionSource === null) return; // Already cleared
    interactionSource = null;
  });
}

/**
 * Execute a function with interaction source tracking
 * Automatically cleans up with try/finally
 * @param source - The interaction source
 * @param fn - Function to execute
 */
export function withInteractionSource<T>(
  source: InteractionSource,
  fn: () => T
): T {
  setInteractionSource(source);
  try {
    return fn();
  } finally {
    clearInteractionSource();
  }
}

/**
 * Set composition state (for IME protection)
 * @param composing - Whether composition is active
 */
export function setComposing(composing: boolean): void {
  isComposing = composing;
}

/**
 * Check if currently composing (IME active)
 * @returns Whether composition is active
 */
export function getIsComposing(): boolean {
  return isComposing;
}

/**
 * Check if we should ignore selection changes
 * @returns Whether to ignore selection changes
 */
export function shouldIgnoreSelectionChange(): boolean {
  // Ignore if interaction is from toolbar
  if (interactionSource === 'toolbar') {
    return true;
  }
  
  // Ignore if composing (IME)
  if (isComposing) {
    return true;
  }
  
  return false;
}

/**
 * Check if we should ignore focus changes
 * @returns Whether to ignore focus changes
 */
export function shouldIgnoreFocusChange(): boolean {
  // Ignore if interaction is from toolbar
  if (interactionSource === 'toolbar') {
    return true;
  }
  
  return false;
}

/**
 * Portal-safe check if a node is within editor context
 * @param node - The event target node
 * @param editorId - The unique editor ID
 * @returns Whether the node is within the editor context
 */
export function isInEditorContext(
  node: EventTarget | null,
  editorId: string
): boolean {
  if (!(node instanceof Node)) return false;
  
  const element = node as Element;
  const closest = element.closest?.(`[data-editor-id="${editorId}"]`);
  
  return !!closest;
}

/**
 * Debug helper to log interaction timeline
 * @param event - Event name
 * @param details - Additional details
 */
export function logInteractionTimeline(
  event: string,
  details?: Record<string, any>
): void {
  // if (process.env.NODE_ENV === 'development') {
  //   console.log(`📊 [${new Date().toISOString()}] ${event}`, {
  //     interactionSource,
  //     isComposing,
  //     ...details
  //   });
  // }
}