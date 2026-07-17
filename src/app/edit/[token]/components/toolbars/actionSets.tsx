// app/edit/[token]/components/toolbars/actionSets.tsx
//
// Phase-3 (step 2): the per-type toolbar registry. `ToolbarShell` consumes THIS
// config map instead of an inline switch. Each renderable toolbar type maps to a
// STABLE, module-level component reference plus a pure `resolveProps` that turns
// the current selection into the concrete props the toolbar needs (or null when
// the selection is absent → the shell renders nothing, preserving the phase-1
// empty-bubble guard).
//
// IMPORTANT — stable element identity: because `component` is a module-level
// constant, the shell can render `React.createElement(entry.component, props)`
// and React keeps the element TYPE stable across shell re-renders → no
// unmount/remount of the active toolbar (which would reset its local useState,
// the perf-04 class of silent state-loss). Do NOT map to a locally-defined
// component here.

import type React from 'react';
import type { EditorSelection, ToolbarType, getToolbarTarget } from '@/utils/selectionPriority';

import { SectionToolbar } from './SectionToolbar';
import { ElementToolbar } from './ElementToolbar';
import { TextToolbarMVP } from './TextToolbarMVP';
import { ImageToolbar } from './ImageToolbar';

/** The positioning target shape produced by the priority resolver. */
type ToolbarTarget = ReturnType<typeof getToolbarTarget>;

/** Rough width class hint (metadata for the shell; no functional gating today). */
export type ToolbarSize = 'sm' | 'md' | 'lg';

/**
 * Per-type control of the shell's trailing slot group (handoff t2 anatomy:
 * `[element actions] · [Design ▾] · [Ask AI] · [⋯/Delete]`).
 *
 * - `'disabled'` — the slot renders greyed with a "why" tooltip. Beta default:
 *   Design ▾ is skeleton-gated (plan D-3), and a greyed control reads as
 *   deliberate where a missing one reads as an unfinished toolbar.
 * - `'hidden'` — the slot is not rendered at all.
 */
export type TrailingSlotState = 'disabled' | 'hidden';

export interface ActionSetEntry {
  /** Module-level component reference — stable identity across re-renders. */
  component: React.ComponentType<any>;
  size: ToolbarSize;
  /**
   * Pure props resolver. Returns the concrete props for `component`, or `null`
   * when the current selection can't satisfy this toolbar (shell renders nothing).
   */
  resolveProps: (selection: EditorSelection, target: ToolbarTarget) => Record<string, unknown> | null;
  /**
   * Design ▾ trailing slot. `'disabled'` everywhere for Beta; the field exists
   * so the un-defer (skeleton phase-9 cutover) is a per-type flip here rather
   * than a shell edit.
   */
  designMenu: TrailingSlotState;
}

// Only the 4 RENDERABLE toolbar types. `form` / null intentionally absent → the
// shell's lookup misses and it renders nothing (matches prior behavior; no empty
// floating bubble).
export const actionSets: Partial<Record<NonNullable<ToolbarType>, ActionSetEntry>> = {
  section: {
    component: SectionToolbar,
    size: 'md',
    designMenu: 'disabled',
    resolveProps: (selection) =>
      selection.selectedSection ? { sectionId: selection.selectedSection } : null,
  },
  element: {
    component: ElementToolbar,
    size: 'md',
    designMenu: 'disabled',
    resolveProps: (selection) =>
      selection.selectedElement ? { elementSelection: selection.selectedElement } : null,
  },
  text: {
    component: TextToolbarMVP,
    size: 'lg',
    designMenu: 'disabled',
    resolveProps: (selection) => {
      const sel = selection.textEditingElement || selection.selectedElement;
      return sel ? { elementSelection: sel } : null;
    },
  },
  image: {
    component: ImageToolbar,
    size: 'md',
    designMenu: 'disabled',
    resolveProps: (_selection, target) =>
      target.targetId ? { targetId: target.targetId } : null,
  },
};
