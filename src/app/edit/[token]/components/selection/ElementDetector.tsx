// app/edit/[token]/components/selection/ElementDetector.tsx
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useEditStore } from '@/hooks/useEditStore';

interface ElementDetectorProps {
  sectionId: string;
  children: React.ReactNode;
}

// Selection affordances (cursor, hover, editing outlines) are pure CSS on the
// [data-element-key] attribute (globals.css) — blocks render the attribute, so no
// runtime DOM sweep is needed. The former MutationObserver + setTimeout(100) sweep
// here was a self-triggering loop (its own class/hint mutations re-fired the
// observer) that saturated the main thread on slow machines — see
// reports/perf-editor-throttled6x-2026-07-11.md and docs/task/perf-04-elementdetector-loop.spec.md.
export function ElementDetector({ sectionId, children }: ElementDetectorProps) {
  const mode = useEditStore((s) => s.mode);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Selected/hover visuals are owned by a single writer (SelectionSystem sweep for
  // selected classes; CSS hover interim → HoverOverlay in phase 3). This wrapper is
  // retained only as a stable closest('[data-section-id]') anchor for other code.
  return (
    <div
      ref={sectionRef}
      data-section-id={sectionId}
      className={`element-detector-section ${mode !== 'preview' ? 'edit-mode' : ''}`}
    >
      {children}
    </div>
  );
}

// Element boundary visualization (debug mode)
export function ElementBoundaryVisualizer({ sectionId }: { sectionId: string }) {
  const mode = useEditStore((s) => s.mode);
  const [showBoundaries, setShowBoundaries] = useState(false);
  const [boundaries, setBoundaries] = useState<any[]>([]);

  // Local implementation of detectElementBoundaries
  const detectElementBoundaries = useCallback((container: HTMLElement) => {
    const elements = container.querySelectorAll('[data-element-key]');
    const detectedBoundaries: any[] = [];

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elementKey = element.getAttribute('data-element-key');
      const elementType = element.getAttribute('data-element-type') || 'unknown';

      detectedBoundaries.push({
        id: elementKey,
        type: elementType,
        bounds: {
          left: rect.left + window.scrollX,
          top: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
      });
    });

    return detectedBoundaries;
  }, []);

  useEffect(() => {
    if (!showBoundaries || mode !== 'edit') return;

    const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
    if (sectionElement) {
      const detected = detectElementBoundaries(sectionElement);
      setBoundaries(detected);
    }
  }, [showBoundaries, mode, sectionId, detectElementBoundaries]);

  // Toggle with keyboard shortcut (Ctrl+Shift+B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        setShowBoundaries(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!showBoundaries || mode !== 'edit') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {boundaries.map((boundary, index) => (
        <div
          key={index}
          className="absolute border-2 border-red-500 bg-red-500 bg-opacity-10"
          style={{
            left: boundary.bounds.left,
            top: boundary.bounds.top,
            width: boundary.bounds.width,
            height: boundary.bounds.height,
          }}
        >
          <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-1 rounded">
            {boundary.id} ({boundary.type})
          </div>
        </div>
      ))}

      <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-sm">
        Element Boundaries: {boundaries.length} detected
        <br />
        <span className="text-xs opacity-75">Ctrl+Shift+B to toggle</span>
      </div>
    </div>
  );
}
