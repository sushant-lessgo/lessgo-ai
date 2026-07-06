// hooks/editStore/historyHelpers.ts — plain module (NO 'use client').
// Push helper for the edit-history stack (undo/redo).
//
// New 'content' entries capture the RAW stored value per storage path
// (V2 stores raw strings/arrays/collection arrays — never wrapped
// {content,type,isEditable,editMode} objects):
//   beforeState/afterState = { storageKey, value }
// where storageKey = the elements-map key the value lives under
// (collectionName for dotted collection edits, elementKey otherwise),
// and value = deep copy of the raw stored value.

import type { EditHistoryEntry } from '@/types/store';

/** Raw-value snapshot for a single element/collection under its storage key. */
export interface ContentHistorySnapshot {
  storageKey: string;
  value: any;
}

/** A 'content' history entry carrying raw-value snapshots. `elementKey` is the
 * ORIGINAL (full dotted, for collection edits) key — the coalesce identity. */
export interface ContentHistoryEntry extends EditHistoryEntry {
  type: 'content';
  sectionId: string;
  elementKey: string;
  beforeState: ContentHistorySnapshot;
  afterState: ContentHistorySnapshot;
}

/** Coalesce window: rapid successive commits to the SAME element within this
 * window mutate the top entry instead of pushing a new one. */
const COALESCE_WINDOW_MS = 3000;

/** JSON deep clone (matches persistenceActions' existing pattern). */
export const deepCopy = <T>(v: T): T =>
  v === undefined ? v : JSON.parse(JSON.stringify(v));

/**
 * Push a content history entry onto the undo stack (Immer draft `state`).
 * - Coalesces with top-of-stack when same sectionId + same original elementKey
 *   within 3s (mutates top entry's afterState + timestamp).
 * - Enforces maxHistorySize (shifts oldest).
 * - Clears redoStack (new edit invalidates the redo branch).
 */
export function pushContentHistoryEntry(state: any, entry: ContentHistoryEntry): void {
  if (!state.history) return;

  const { undoStack } = state.history;
  const top = undoStack[undoStack.length - 1] as (EditHistoryEntry & { elementKey?: string }) | undefined;

  if (
    top &&
    top.type === 'content' &&
    top.sectionId === entry.sectionId &&
    top.elementKey === entry.elementKey &&
    entry.timestamp - top.timestamp <= COALESCE_WINDOW_MS
  ) {
    // Coalesce: keep original beforeState, advance afterState + timestamp.
    top.afterState = entry.afterState;
    top.timestamp = entry.timestamp;
    state.history.redoStack = [];
    return;
  }

  undoStack.push(entry);
  const max = state.history.maxHistorySize ?? 50;
  while (undoStack.length > max) {
    undoStack.shift();
  }
  state.history.redoStack = [];
}
