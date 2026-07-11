// app/edit/[token]/components/toolbars/ToolbarShell.tsx
//
// Phase-3 rebuild: the ONE floating shell that owns toolbar positioning, the
// arrow, and dismissal for the whole editor. A SINGLE `useSelectionPriority()`
// instance decides which toolbar renders (single-visibility-authority law);
// the toolbar components below are dumb static children — they no longer
// self-position or re-resolve visibility.
//
// Anchoring: the selected element's DOM node is resolved FRESH (one
// querySelector) whenever the active toolbar / target changes — never per
// render. floating-ui's `autoUpdate` is attached ONLY while a toolbar is open
// and torn down on close (the open-toolbar effect below), so nothing in this
// system runs while the editor is idle.

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  FloatingArrow,
  useDismiss,
  useInteractions,
} from '@floating-ui/react';
import { useSelectionPriority } from '@/hooks/useSelectionPriority';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import type { ToolbarType } from '@/utils/selectionPriority';

import { SectionToolbar } from './SectionToolbar';
import { ElementToolbar } from './ElementToolbar';
import { TextToolbarMVP } from './TextToolbarMVP';
import { ImageToolbar } from './ImageToolbar';

const ARROW_HEIGHT = 8;
const GAP = 8;

/**
 * Resolve the anchor DOM node for the active selection. One lookup per call;
 * the caller only invokes it when the active toolbar / target changes.
 */
function resolveAnchor(
  activeToolbar: ToolbarType,
  target: { sectionId: string | null; elementKey: string | null; targetId: string | null },
): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  if (activeToolbar === 'section') {
    if (!target.sectionId) return null;
    return document.querySelector<HTMLElement>(`[data-section-id="${target.sectionId}"]`);
  }

  if (activeToolbar === 'image') {
    // Image blocks tag the editable node with data-image-id (sectionId.elementKey).
    if (target.targetId) {
      const byImageId = document.querySelector<HTMLElement>(`[data-image-id="${target.targetId}"]`);
      if (byImageId) return byImageId;
    }
  }

  // element / text / image fallback → section + element-key node
  if (target.sectionId && target.elementKey) {
    return document.querySelector<HTMLElement>(
      `[data-section-id="${target.sectionId}"] [data-element-key="${target.elementKey}"]`,
    );
  }

  return null;
}

export function ToolbarShell() {
  const {
    activeToolbar,
    toolbarTarget,
    editorSelection,
    hasActiveToolbar,
  } = useSelectionPriority();

  // Narrow selector: pull ONLY the dismissal/selection actions the shell needs
  // for Esc/outside-click. Actions are stable references, so this never
  // re-renders the shell on store mutation (unlike a bare full-store sub).
  const {
    setActiveSection,
    selectElement,
    hideSectionToolbar,
    hideElementToolbar,
    hideFormToolbar,
    hideImageToolbar,
  } = useEditStore(
    useShallow((s) => ({
      setActiveSection: s.setActiveSection,
      selectElement: s.selectElement,
      hideSectionToolbar: s.hideSectionToolbar,
      hideElementToolbar: s.hideElementToolbar,
      hideFormToolbar: s.hideFormToolbar,
      hideImageToolbar: s.hideImageToolbar,
    })),
  );

  const open = editorSelection.mode === 'edit' && hasActiveToolbar;
  const arrowRef = useRef<SVGSVGElement>(null);

  // Resolve the anchor node fresh only when the active toolbar / target changes.
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) {
      setAnchorEl(null);
      return;
    }
    setAnchorEl(resolveAnchor(activeToolbar, toolbarTarget));
  }, [open, activeToolbar, toolbarTarget.sectionId, toolbarTarget.elementKey, toolbarTarget.targetId]);

  const clearSelection = () => {
    // Text editing owns its own exit (InlineTextEditorV2 blur + pending-content
    // flush) — do not clobber it from here.
    if (activeToolbar === 'text') return;
    setActiveSection(undefined);
    selectElement(null);
    hideSectionToolbar();
    hideElementToolbar();
    hideFormToolbar();
    hideImageToolbar();
  };

  const { refs, floatingStyles, context } = useFloating({
    open: open && !!anchorEl,
    onOpenChange: (next) => {
      if (!next) clearSelection();
    },
    placement: 'top',
    strategy: 'fixed',
    // Reference is bound synchronously (not via an effect) so the container is
    // positioned on its first paint — no {x:0,y:0} flash.
    elements: { reference: anchorEl ?? undefined },
    middleware: [
      offset(GAP + ARROW_HEIGHT),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  });

  const dismiss = useDismiss(context, {
    escapeKey: true,
    outsidePress: true,
  });
  const { getFloatingProps } = useInteractions([dismiss]);

  // autoUpdate ONLY while a toolbar is open — attached here, torn down on close.
  useEffect(() => {
    if (!open || !anchorEl) return;
    const floating = refs.floating.current;
    if (!floating) return;
    const cleanup = autoUpdate(anchorEl, floating, () => {
      // floating-ui recomputes position on scroll/resize while open.
      context.update();
    });
    return cleanup;
  }, [open, anchorEl, refs, context]);

  if (!open || !anchorEl) {
    return null;
  }

  // Resolve the toolbar body inline so its element type stays STABLE across
  // re-renders — a locally-defined component rendered as JSX (`<ToolbarBody/>`)
  // gets a fresh function reference each render, forcing React to unmount +
  // remount the whole toolbar subtree and reset its local useState (perf-04
  // class of silent state-loss). Rendering the concrete <SectionToolbar/> etc.
  // directly keeps element identity stable.
  let toolbarBody: React.ReactNode = null;
  switch (activeToolbar) {
    case 'section':
      toolbarBody = editorSelection.selectedSection ? (
        <SectionToolbar sectionId={editorSelection.selectedSection} />
      ) : null;
      break;
    case 'element':
      toolbarBody = editorSelection.selectedElement ? (
        <ElementToolbar elementSelection={editorSelection.selectedElement} />
      ) : null;
      break;
    case 'text': {
      const sel = editorSelection.textEditingElement || editorSelection.selectedElement;
      toolbarBody = sel ? <TextToolbarMVP elementSelection={sel} /> : null;
      break;
    }
    case 'image':
      toolbarBody = toolbarTarget.targetId ? (
        <ImageToolbar targetId={toolbarTarget.targetId} />
      ) : null;
      break;
    default:
      toolbarBody = null;
  }

  // No matching toolbar body (e.g. `form`, or a case whose selection is absent):
  // do NOT open an empty floating container — that would render a bare arrow
  // bubble. Match prior behavior (nothing rendered).
  if (!toolbarBody) {
    return null;
  }

  return (
    <div
      ref={refs.setFloating}
      style={{ ...floatingStyles, zIndex: 10000 }}
      {...getFloatingProps()}
    >
      {toolbarBody}
      <FloatingArrow
        ref={arrowRef}
        context={context}
        width={12}
        height={6}
        className="fill-white [&>path:first-of-type]:stroke-gray-200 [&>path:last-of-type]:stroke-white"
      />
    </div>
  );
}
