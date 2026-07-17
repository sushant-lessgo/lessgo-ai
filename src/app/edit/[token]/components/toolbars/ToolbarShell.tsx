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
//
// toolbar-standard-beta phase 1: the shell now also owns the t2 CHROME (the dark
// #191922 pill: bg/radius/padding/shadow) and the trailing slot group, so the
// four toolbar bodies no longer each hand-roll `bg-white border border-gray-200
// rounded-lg shadow-lg`. Trailing slots per the handoff anatomy
// `[element actions] · [Design ▾] · [Ask AI] · [⋯/Delete]`:
//   - Design ▾  — rendered DISABLED/greyed (skeleton-gated, plan D-3).
//   - Ask AI    — HIDDEN until phase 5 (LLM + credits, behind a human gate).
//   - ⋯/Delete  — NOT hoisted this phase; each toolbar still renders its own
//                 Delete last (see the audit's Deviations).

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { ToolbarButton, ToolbarChromeContext, ToolbarDivider } from './ToolbarButton';

const ARROW_HEIGHT = 8;
const GAP = 8;

/** t2 "Design ▾" slot glyphs. */
function TuneIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

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
    return (
      document.querySelector<HTMLElement>(`[data-section-root="${target.sectionId}"]`) ??
      document.querySelector<HTMLElement>(`[data-section-id="${target.sectionId}"]`)
    );
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

  // Chrome-visibility channel (see ToolbarButton.tsx). A toolbar body can drop
  // the chrome box while it is rendering something that is not a toolbar —
  // today only SectionToolbar's regenerating / just-completed states.
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeContextValue = useMemo(() => ({ setChromeVisible }), []);

  // Resolve the anchor node fresh only when the active toolbar / target changes.
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) {
      setAnchorEl(null);
      return;
    }
    setAnchorEl(resolveAnchor(activeToolbar, toolbarTarget));
    // A new target gets chrome back; the incoming body re-hides it (pre-paint,
    // useLayoutEffect) if it needs to.
    setChromeVisible(true);
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
      <ToolbarChromeContext.Provider value={chromeContextValue}>
        {chromeVisible ? (
          // t2 chrome. TWO load-bearing constraints, both verified against the
          // toolbars' variations/upload panels, which are `absolute top-full
          // left-0` SIBLINGS of each toolbar's inner div — i.e. they now live
          // INSIDE this box:
          //   1. NO `overflow-hidden` — it would clip every panel out of sight.
          //   2. `relative` — the panels need a positioned ancestor for
          //      `top-full` to anchor to the bottom of the toolbar. (The
          //      floating container is `position: fixed` and would also serve,
          //      but pinning it here keeps the anchor box === the visible pill.)
          <div
            className="relative inline-flex items-center gap-0.5 rounded-[11px] bg-[#191922] p-[5px] font-app-sans shadow-[0_10px_24px_-10px_rgba(20,20,40,0.5)]"
            data-toolbar-chrome
            data-toolbar-type={activeToolbar}
          >
            {toolbarBody}

            {/* Design ▾ — present but disabled. Skeleton-gated (plan D-3): the
                `--u-*` token surface exists, but the only template that consumes
                it (atelier2) is never served, so an enabled Design menu would do
                nothing for every real user. */}
            {entry.designMenu !== 'hidden' && (
              <>
                <ToolbarDivider />
                <ToolbarButton
                  data-action="design-menu"
                  icon={<TuneIcon />}
                  label="Design"
                  trailing={<LockIcon />}
                  disabled
                  disabledTitle="Design controls arrive with the design system"
                />
              </>
            )}

            {/* Ask AI slot — intentionally NOT rendered. Lands in phase 5
                (LLM + credits) behind a human gate. */}
          </div>
        ) : (
          // Chrome dropped by the body (SectionToolbar mid-regeneration): render
          // it bare so its fixed progress card still shows, with no empty pill.
          toolbarBody
        )}

        {chromeVisible && (
          <FloatingArrow
            ref={arrowRef}
            context={context}
            width={12}
            height={6}
            className="fill-[#191922]"
          />
        )}
      </ToolbarChromeContext.Provider>
    </div>
  );
}
