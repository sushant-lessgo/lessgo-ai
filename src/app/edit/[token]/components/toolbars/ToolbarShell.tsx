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
import { useEditStore } from '@/hooks/useEditStore';
import type { ToolbarType } from '@/utils/selectionPriority';

import { actionSets } from './actionSets';

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
      // crossAxis: a viewport-spanning section (tall hero mid-scroll) overflows
      // BOTH top and bottom placements — flip gives up and the toolbar lands
      // off-screen above the section. Cross-axis shift pulls it back into the
      // viewport instead of leaving it unreachable.
      shift({ padding: 8, crossAxis: true }),
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

  // Resolve the toolbar body from the config map (phase-3 step 2). `entry.component`
  // is a module-level constant reference, so `React.createElement(component, props)`
  // keeps the element TYPE stable across shell re-renders — no unmount/remount of
  // the active toolbar (which would reset its local useState, the perf-04 class of
  // silent state-loss). A locally-defined component rendered as JSX would get a
  // fresh reference each render and force a remount; the registry avoids that.
  const entry = activeToolbar ? actionSets[activeToolbar] : undefined;
  const toolbarProps = entry ? entry.resolveProps(editorSelection, toolbarTarget) : null;

  // No matching entry (e.g. `form`, or a selection the resolver can't satisfy):
  // do NOT open an empty floating container — that would render a bare arrow
  // bubble. Match prior behavior (nothing rendered).
  if (!entry || !toolbarProps) {
    return null;
  }

  const ToolbarComponent = entry.component;
  const toolbarBody = React.createElement(ToolbarComponent, toolbarProps);

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
