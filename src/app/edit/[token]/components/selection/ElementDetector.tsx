// app/edit/[token]/components/selection/ElementDetector.tsx
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
// Removed useSelection - functionality now in unified useEditor system

interface ElementDetectorProps {
  sectionId: string;
  children: React.ReactNode;
}

export function ElementDetector({ sectionId, children }: ElementDetectorProps) {
  const { mode } = useEditStore();
  // Element detection is now handled by the unified editor system
  const sectionRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  // Element marking is now handled by the unified editor system
  const markSelectableElements = useCallback(() => {
    if (!sectionRef.current || mode !== 'edit') return;
    
    // Simple element marking for backward compatibility
    const elements = sectionRef.current.querySelectorAll('[data-element-key]');
    elements.forEach((element) => {
      (element as HTMLElement).setAttribute('data-selectable', 'true');
      (element as HTMLElement).setAttribute('role', 'button');
      (element as HTMLElement).setAttribute('tabindex', '0');
      (element as HTMLElement).classList.add('selectable-element');
    });
  }, [mode]);

  // Add visual hints for elements
  const addElementHints = useCallback(() => {
    if (!sectionRef.current || mode !== 'edit') return;

    const selectableElements = sectionRef.current.querySelectorAll('.selectable-element');
    
    selectableElements.forEach((element) => {
      // Remove existing hints
      const existingHint = element.querySelector('.element-hint');
      if (existingHint) {
        existingHint.remove();
      }

      const elementType = element.getAttribute('data-element-type');
      const elementKey = element.getAttribute('data-element-key');
      
      // Create hint element
      const hint = document.createElement('div');
      hint.className = 'element-hint';
      hint.innerHTML = `
        <span class="element-hint-label">${elementKey}</span>
        <span class="element-hint-type">${elementType}</span>
      `;
      
      // Position hint
      const rect = element.getBoundingClientRect();
      const sectionRect = sectionRef.current!.getBoundingClientRect();
      
      hint.style.cssText = `
        position: absolute;
        top: ${rect.top - sectionRect.top - 20}px;
        left: ${rect.left - sectionRect.left}px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        pointer-events: none;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.2s;
        font-family: monospace;
        white-space: nowrap;
      `;
      
      // Add to section (relative positioning context)
      if (sectionRef.current) {
        if (sectionRef.current.style.position !== 'relative' && sectionRef.current.style.position !== 'absolute') {
          sectionRef.current.style.position = 'relative';
        }
        
        sectionRef.current.appendChild(hint);
      }
      
      // Show hint on hover
      element.addEventListener('mouseenter', () => {
        hint.style.opacity = '1';
      });
      
      element.addEventListener('mouseleave', () => {
        hint.style.opacity = '0';
      });
    });
  }, [mode]);

  // Remove element hints
  const removeElementHints = useCallback(() => {
    if (!sectionRef.current) return;

    const hints = sectionRef.current.querySelectorAll('.element-hint');
    hints.forEach(hint => hint.remove());
  }, []);

  // Setup mutation observer to detect DOM changes
  useEffect(() => {
    if (!sectionRef.current || mode !== 'edit') return;

    // Initial marking
    markSelectableElements();
    addElementHints();

    // Setup observer for dynamic content
    observerRef.current = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          shouldUpdate = true;
        }
      });
      
      if (shouldUpdate) {
        // Debounce updates
        setTimeout(() => {
          markSelectableElements();
          removeElementHints();
          addElementHints();
        }, 100);
      }
    });

    observerRef.current.observe(sectionRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-element-key', 'class'],
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      removeElementHints();
    };
  }, [mode, markSelectableElements, addElementHints, removeElementHints]);

  // Handle selection visual feedback
  const { selectedElement, selectedSection } = useEditStore();
  
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
    if (selectedSection === sectionId) {
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
      removeElementHints();
      
      if (sectionRef.current) {
        const elements = sectionRef.current.querySelectorAll('.selectable-element');
        elements.forEach(element => {
          element.classList.remove('selectable-element', 'element-selected', 'element-hover');
          element.removeAttribute('data-selectable');
          element.removeAttribute('data-element-type');
          element.removeAttribute('data-selection-depth');
        });
        
        sectionRef.current.classList.remove('section-selected');
      }
    }
  }, [mode, removeElementHints]);

  return (
    <div
      ref={sectionRef}
      data-section-id={sectionId}
      className={`element-detector-section ${mode === 'edit' ? 'edit-mode' : ''}`}
      onClick={handleNestedElementClick}
    >
      {children}
      
      {mode === 'edit' && <ElementDetectorStyles />}
    </div>
  );
}

// Styles for element detection and selection
function ElementDetectorStyles() {
  return (
    <style jsx>{`
      .element-detector-section.edit-mode .selectable-element {
        cursor: pointer;
        transition: all 0.15s ease-in-out;
      }
      
      .element-detector-section.edit-mode .selectable-element:hover {
        background-color: rgba(59, 130, 246, 0.05);
        outline: 1px solid rgba(59, 130, 246, 0.2);
        outline-offset: 1px;
      }
      
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
      
      /* Type-specific styling */
      .element-type-text:hover {
        background-color: rgba(34, 197, 94, 0.05);
      }
      
      .element-type-button:hover {
        background-color: rgba(239, 68, 68, 0.05);
      }
      
      .element-type-image:hover {
        background-color: rgba(168, 85, 247, 0.05);
      }
      
      .element-type-form:hover {
        background-color: rgba(245, 158, 11, 0.05);
      }
      
      /* Element hints */
      .element-hint {
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      }
      
      .element-hint-label {
        font-weight: 600;
        color: #60a5fa;
      }
      
      .element-hint-type {
        margin-left: 4px;
        color: #a3a3a3;
        font-size: 9px;
      }
      
      /* Accessibility improvements */
      .selectable-element:focus-visible {
        outline: 2px solid #f59e0b !important;
        outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
      }
      
      /* Selection depth indicators */
      .selectable-element[data-selection-depth="0"] {
        box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
      }
      
      .selectable-element[data-selection-depth="1"] {
        box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.4);
      }
      
      .selectable-element[data-selection-depth="2"] {
        box-shadow: inset 0 0 0 3px rgba(59, 130, 246, 0.5);
      }
      
      /* Animation for selection changes */
      .selectable-element {
        transition: background-color 0.2s ease, outline 0.2s ease, box-shadow 0.2s ease;
      }
    `}</style>
  );
}

// Element boundary visualization (debug mode)
export function ElementBoundaryVisualizer({ sectionId }: { sectionId: string }) {
  const { mode } = useEditStore();
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