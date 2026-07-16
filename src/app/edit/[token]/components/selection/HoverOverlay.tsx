// app/edit/[token]/components/selection/HoverOverlay.tsx
//
// Single JS-driven hover affordance for the edit canvas (plan phase 3, D5).
// Hovering any editable target draws ONE stable, fixed-position outline + a label
// chip naming the toolbar a click will open. The label is derived from the SAME
// `resolveTarget` the click path uses (`useEditor.determineClickTarget`), so the
// hover-label ↔ resulting-toolbar mapping is 1:1 by construction (D4).
//
// Follows the proven `VerifyMarkerControls` pattern: nothing is written into the
// content DOM (no class thrash, no contentEditable serialization pollution) — the
// overlay is a `position: fixed`, `pointer-events: none` box computed from
// `getBoundingClientRect()`, recomputed on scroll/resize.
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore } from '@/hooks/useEditStore';
import { isSectionVisuallySelected } from '@/utils/selectionPriority';
import { resolveTarget, getTargetLabel } from '@/utils/hoverTarget';

interface OverlayState {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
}

// Approx chip footprint for viewport flipping (chip is auto-width; this is only
// used to decide when to clamp/flip so it never renders off-screen).
const CHIP_H = 20;
const CHIP_APPROX_W = 90;

export function HoverOverlay() {
  const { mode, isTextEditing, selectedSection, selectedElement } = useEditStore(
    useShallow((s) => ({
      mode: s.mode,
      isTextEditing: s.isTextEditing,
      selectedSection: s.selectedSection,
      selectedElement: s.selectedElement,
    })),
  );

  const [overlay, setOverlay] = useState<OverlayState | null>(null);

  // The currently-tracked node + its label (refs so scroll/resize recompute
  // without re-subscribing the pointer handlers).
  const nodeRef = useRef<HTMLElement | null>(null);
  const labelRef = useRef<string>('');
  const rafRef = useRef<number | null>(null);

  const clear = () => {
    nodeRef.current = null;
    labelRef.current = '';
    setOverlay(null);
  };

  useEffect(() => {
    if (mode !== 'edit') {
      clear();
      return;
    }

    // While text-editing, suppress the overlay entirely (plan Q4 → hidden).
    if (isTextEditing) {
      clear();
      return;
    }

    const compute = () => {
      const node = nodeRef.current;
      if (!node || !document.contains(node)) {
        setOverlay(null);
        return;
      }
      const rect = node.getBoundingClientRect();
      setOverlay({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        label: labelRef.current,
      });
    };

    const isSuppressedChrome = (el: HTMLElement): boolean =>
      !!(
        el.closest('[data-toolbar-type]') ||
        el.closest('header') ||
        el.closest('[role="dialog"]') ||
        el.closest('[data-radix-portal]')
      );

    const handlePointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') {
        clear();
        return;
      }

      if (isSuppressedChrome(target)) {
        clear();
        return;
      }

      const resolved = resolveTarget(target);
      if (resolved.kind === null || !resolved.node) {
        clear();
        return;
      }

      // Suppress when the hovered target IS the current selection — the selected
      // outline (SelectionSystem) already owns it.
      if (
        resolved.kind === 'element' &&
        selectedElement &&
        selectedElement.sectionId === resolved.sectionId &&
        selectedElement.elementKey === resolved.elementKey
      ) {
        clear();
        return;
      }
      if (
        resolved.kind === 'section' &&
        resolved.sectionId &&
        isSectionVisuallySelected(selectedSection, resolved.sectionId, selectedElement)
      ) {
        clear();
        return;
      }

      nodeRef.current = resolved.node;
      labelRef.current = getTargetLabel(resolved);
      compute();
    };

    // rAF-throttle the high-frequency pointermove.
    const onPointerMove = (event: PointerEvent) => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        handlePointer(event);
      });
    };

    const onPointerLeave = () => clear();
    const onReflow = () => requestAnimationFrame(compute);

    document.addEventListener('pointerover', handlePointer);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);

    return () => {
      document.removeEventListener('pointerover', handlePointer);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mode, isTextEditing, selectedSection, selectedElement]);

  if (mode !== 'edit' || isTextEditing || !overlay) return null;

  // Chip: top-left of the target, flipping to stay inside the viewport.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  let chipTop = overlay.top - CHIP_H - 2;
  if (chipTop < 4) chipTop = overlay.top + 2; // flip inside if clipped at top
  let chipLeft = overlay.left;
  if (chipLeft < 4) chipLeft = 4;
  if (vw && chipLeft + CHIP_APPROX_W > vw - 4) chipLeft = Math.max(4, vw - 4 - CHIP_APPROX_W);

  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: overlay.top,
          left: overlay.left,
          width: overlay.width,
          height: overlay.height,
          border: '1px solid #475569',
          borderRadius: 4,
          boxShadow: '0 0 0 1px rgba(71, 85, 105, 0.15)',
          pointerEvents: 'none',
          zIndex: 40,
        }}
      />
      {overlay.label && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            top: chipTop,
            left: chipLeft,
            background: '#475569',
            color: '#ffffff',
            fontSize: 10,
            lineHeight: '14px',
            padding: '2px 6px',
            borderRadius: 10,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 41,
          }}
        >
          {overlay.label}
        </div>
      )}
    </>
  );
}
