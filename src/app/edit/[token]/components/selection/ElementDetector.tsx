// app/edit/[token]/components/selection/ElementDetector.tsx
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore } from '@/hooks/useEditStore';
import { isSectionVisuallySelected } from '@/utils/selectionPriority';

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

  // Handle selection visual feedback
  const { selectedElement, selectedSection } = useEditStore(
    useShallow((s) => ({ selectedElement: s.selectedElement, selectedSection: s.selectedSection })),
  );

  useEffect(() => {
    if (!sectionRef.current) return;

    // Update selection indicators
    const elements = sectionRef.current.querySelectorAll('[data-element-key]');

    elements.forEach((element) => {
      const elementKey = element.getAttribute('data-element-key');
      const isSelected = selectedElement?.sectionId === sectionId && selectedElement?.elementKey === elementKey;

      if (isSelected) {
        element.classList.add('element-selected');
      } else {
        element.classList.remove('element-selected');
      }
    });

    // Section selection indicator
    if (isSectionVisuallySelected(selectedSection, sectionId, selectedElement)) {
      sectionRef.current.classList.add('section-selected');
    } else {
      sectionRef.current.classList.remove('section-selected');
    }
  }, [selectedElement, selectedSection, sectionId]);

  // Handle nested element detection
  const handleNestedElementClick = useCallback((event: React.MouseEvent) => {

    if (mode !== 'edit') return;

    const target = event.target as HTMLElement;

    // Check if target is an image with data-image-id - let image click handlers work
    if (target.tagName === 'IMG' && target.getAttribute('data-image-id')) {
      event.stopPropagation();
      // Allow image click handlers to work by not intercepting
      return;
    }

    // Find the closest selectable element
    let current = target;
    let elementKey = null;
    let depth = 0;

    while (current && current !== sectionRef.current && depth < 10) {
      elementKey = current.getAttribute('data-element-key');
      if (elementKey) break;

      current = current.parentElement as HTMLElement;
      depth++;
    }

    if (elementKey && current) {
      // Add visual feedback for nested selection
      const allElementsInSection = sectionRef.current?.querySelectorAll('[data-element-key]');
      allElementsInSection?.forEach(el => el.classList.remove('element-hover'));

      current.classList.add('element-hover');

      // Store depth information for hierarchy display
      current.setAttribute('data-selection-depth', depth.toString());
    }
  }, [mode, sectionId]);

  // Cleanup on mode change
  useEffect(() => {
    if (mode !== 'edit') {
      if (sectionRef.current) {
        const elements = sectionRef.current.querySelectorAll('[data-element-key]');
        elements.forEach(element => {
          element.classList.remove('element-selected', 'element-hover');
          element.removeAttribute('data-selection-depth');
        });

        sectionRef.current.classList.remove('section-selected');
      }
    }
  }, [mode]);

  return (
    <div
      ref={sectionRef}
      data-section-id={sectionId}
      className={`element-detector-section ${mode !== 'preview' ? 'edit-mode' : ''}`}
      onClick={handleNestedElementClick}
    >
      {children}

      {mode !== 'preview' && <ElementDetectorStyles />}
    </div>
  );
}

// Styles for element detection and selection
// (cursor/hover/editing affordances live in globals.css on [data-element-key])
function ElementDetectorStyles() {
  return (
    <style jsx>{`
      .element-detector-section.edit-mode .element-selected {
        background-color: rgba(16, 185, 129, 0.1) !important;
        outline: 2px solid #10b981 !important;
        outline-offset: 1px;
      }

      .element-detector-section.edit-mode .element-hover {
        background-color: rgba(59, 130, 246, 0.08) !important;
        outline: 1px dashed rgba(59, 130, 246, 0.4) !important;
        outline-offset: 1px;
      }

      .element-detector-section.section-selected {
        background-color: rgba(59, 130, 246, 0.03);
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }

      /* Selection depth indicators */
      .element-detector-section.edit-mode [data-element-key][data-selection-depth="0"] {
        box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
      }

      .element-detector-section.edit-mode [data-element-key][data-selection-depth="1"] {
        box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.4);
      }

      .element-detector-section.edit-mode [data-element-key][data-selection-depth="2"] {
        box-shadow: inset 0 0 0 3px rgba(59, 130, 246, 0.5);
      }
    `}</style>
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
