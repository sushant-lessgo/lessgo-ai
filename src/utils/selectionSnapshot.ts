// Selection snapshot system for robust selection preservation during formatting
// More reliable than simple Range cloning

import { logger } from '@/lib/logger';

export interface SelectionSnapshot {
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
  isValid: boolean;
  isCollapsed: boolean;
  // Selection hash for detecting mid-transaction changes
  hash: string;
  // Container element for validation
  editorElement: HTMLElement | null;
  createdAt: number;
}

/**
 * Capture detailed selection snapshot
 * @param editorElement - The editor container to validate selection within
 * @returns SelectionSnapshot with validation
 */
export function captureSelectionSnapshot(editorElement?: HTMLElement | null): SelectionSnapshot {
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0) {
    return {
      startContainer: document.body,
      startOffset: 0,
      endContainer: document.body,
      endOffset: 0,
      isValid: false,
      isCollapsed: true,
      hash: 'empty',
      editorElement: editorElement || null,
      createdAt: Date.now(),
    };
  }

  const range = selection.getRangeAt(0);
  const isValid = editorElement ? editorElement.contains(range.commonAncestorContainer) : true;
  
  // Create selection hash for detecting changes
  const hash = `${range.startOffset}-${range.endOffset}-${range.startContainer.nodeType}`;
  
  return {
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: range.endContainer,
    endOffset: range.endOffset,
    isValid,
    isCollapsed: range.collapsed,
    hash,
    editorElement: editorElement || null,
    createdAt: Date.now(),
  };
}

/**
 * Restore selection from snapshot with validation
 * @param snapshot - SelectionSnapshot to restore
 * @returns Success boolean
 */
export function restoreFromSnapshot(snapshot: SelectionSnapshot): boolean {
  if (!snapshot.isValid) {
    logger.warn('🚫 Cannot restore invalid selection snapshot');
    return false;
  }

  // Validate nodes are still in DOM
  if (!document.contains(snapshot.startContainer) || !document.contains(snapshot.endContainer)) {
    logger.warn('🚫 Cannot restore selection - nodes no longer in DOM');
    return false;
  }

  // Validate selection is still within editor
  if (snapshot.editorElement && 
      (!snapshot.editorElement.contains(snapshot.startContainer) || 
       !snapshot.editorElement.contains(snapshot.endContainer))) {
    logger.warn('🚫 Cannot restore selection - outside editor boundary');
    return false;
  }

  try {
    const selection = window.getSelection();
    if (!selection) return false;

    const range = document.createRange();
    range.setStart(snapshot.startContainer, snapshot.startOffset);
    range.setEnd(snapshot.endContainer, snapshot.endOffset);

    selection.removeAllRanges();
    selection.addRange(range);

    logger.debug('✅ Selection restored from snapshot:', { hash: snapshot.hash });
    return true;
  } catch (error) {
    logger.error('❌ Failed to restore selection snapshot:', error);
    return false;
  }
}

/**
 * Validate that snapshot is still current (detects mid-transaction changes)
 * @param snapshot - Original snapshot
 * @returns Boolean indicating if selection has changed
 */
export function validateSnapshot(snapshot: SelectionSnapshot): boolean {
  const current = captureSelectionSnapshot(snapshot.editorElement);
  return current.hash === snapshot.hash;
}

/**
 * Get selection range safely with validation
 * @param editorElement - Container to validate selection within
 * @returns Range or null if invalid
 */
export function getValidSelection(editorElement?: HTMLElement | null): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  
  // Validate within editor boundary if provided
  if (editorElement && !editorElement.contains(range.commonAncestorContainer)) {
    return null;
  }

  return range;
}