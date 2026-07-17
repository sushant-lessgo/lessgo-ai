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
 * `[element actions] · [Design ▾] · [⋯/Delete]`).
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

// The 4 RENDERABLE toolbar types. `null` stays absent by construction; a resolver
// returning `null` still yields the empty-bubble guard rather than a bare floating
// arrow.
//
// `form` is DELIBERATELY ABSENT (founder ruling 8, phase 3). Phase 2 landed a
// `form` entry + `FormToolbar`; both were provably UNREACHABLE and are now deleted.
// Form dispatch is over-determined dead: (1) `determineElementType`
// (useEditor.ts:182-189) hits the tagName branch first — `form_heading`/`form_note`/
// `form_foot` all render as h2/p — and returns 'text' before :197's
// `elementKey.includes('form')` is ever evaluated; (2) independently,
// `isTextEditing` outranks `form` (selectionPriority.ts:45-47); (3) the real
// <input>s carry no element key, so the selection affordance doesn't exist in the
// DOM. This is a DESIGN question (what selects a form?), not a wiring bug — a form
// heading IS prose and clicking it SHOULD inline-edit. Deferred to Final; re-add
// cost ~15 lines. Do NOT re-add a `form` entry without landing the DOM affordance
// first — shipping unreachable code is what killed the dead nav editors (ruling 3).
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
