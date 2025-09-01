// app/edit/[token]/components/selection/SelectionSystem.tsx
import React, { useEffect } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
// Removed useSelection - functionality now in unified useEditor system

interface SelectionSystemProps {
  children: React.ReactNode;
}

export function SelectionSystem({ children }: SelectionSystemProps) {
  const { mode } = useEditStore();
  // Selection state now comes from unified editor system
  const { selectedSection, selectedElement, multiSelection } = useEditStore();

  // Setup accessibility attributes
  useEffect(() => {
    if (mode !== 'edit') return;

    // Add role and aria attributes to sections
    const sections = document.querySelectorAll('[data-section-id]');
    sections.forEach((section) => {
      const sectionId = section.getAttribute('data-section-id');
      if (!sectionId) return;

      section.setAttribute('role', 'button');
      section.setAttribute('tabindex', '0');
      section.setAttribute('aria-label', `Section ${sectionId}`);
      
      if (selectedSection === sectionId) {
        section.setAttribute('aria-selected', 'true');
        section.classList.add('selected-section');
      } else {
        section.setAttribute('aria-selected', 'false');
        section.classList.remove('selected-section');
      }
      
      if (multiSelection.includes(sectionId)) {
        section.classList.add('multi-selected');
      } else {
        section.classList.remove('multi-selected');
      }
    });

    // Add attributes to elements
    const elements = document.querySelectorAll('[data-element-key]');
    elements.forEach((element) => {
      const elementKey = element.getAttribute('data-element-key');
      const sectionElement = element.closest('[data-section-id]');
      const sectionId = sectionElement?.getAttribute('data-section-id');
      
      if (!elementKey || !sectionId) return;

      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-label', `Element ${elementKey} in section ${sectionId}`);
      
      const isSelected = selectedElement?.sectionId === sectionId && selectedElement?.elementKey === elementKey;
      element.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      
      if (isSelected) {
        element.classList.add('selected-element');
      } else {
        element.classList.remove('selected-element');
      }
    });
  }, [mode, selectedSection, selectedElement, multiSelection]);

  // Handle focus management
  useEffect(() => {
    const focusSelectedElement = () => {
      if (selectedElement) {
        const element = document.querySelector(
          `[data-section-id="${selectedElement.sectionId}"] [data-element-key="${selectedElement.elementKey}"]`
        );
        if (element instanceof HTMLElement) {
          element.focus();
        }
      } else if (selectedSection) {
        const section = document.querySelector(`[data-section-id="${selectedSection}"]`);
        if (section instanceof HTMLElement) {
          section.focus();
        }
      }
    };

    if (mode !== 'preview' && (selectedSection || selectedElement)) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(focusSelectedElement, 50);
      return () => clearTimeout(timer);
    }
  }, [mode, selectedSection, selectedElement]);

  return (
    <div className="selection-system">
      {children}
      
      {/* Selection Indicators */}
      {mode !== 'preview' && (
        <>
          <SelectionStyles />
          <SelectionIndicators />
        </>
      )}
    </div>
  );
}

// CSS styles for selection indicators
function SelectionStyles() {
  return (
    <style jsx>{`
      /* Section Selection Styles */
      .selected-section {
        position: relative;
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px;
        border-radius: 4px;
      }
      
      .selected-section::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 6px;
        pointer-events: none;
        z-index: 1;
      }
      
      /* Multi-Selection Styles */
      .multi-selected {
        outline: 2px dashed #8b5cf6 !important;
        outline-offset: 2px;
        background: rgba(139, 92, 246, 0.05) !important;
      }
      
      /* Element Selection Styles */
      .selected-element {
        position: relative;
        outline: 2px solid #10b981 !important;
        outline-offset: 1px;
        border-radius: 2px;
        background: rgba(16, 185, 129, 0.05) !important;
      }
      
      /* Hover Effects */
      [data-section-id]:hover:not(.selected-section):not(.multi-selected) {
        outline: 1px solid #d1d5db;
        outline-offset: 2px;
        transition: outline 0.15s ease-in-out;
      }
      
      [data-element-key]:hover:not(.selected-element) {
        outline: 1px solid #e5e7eb;
        outline-offset: 1px;
        background: rgba(0, 0, 0, 0.02);
        transition: all 0.15s ease-in-out;
      }
      
      /* Focus Styles */
      [data-section-id]:focus-visible {
        outline: 2px solid #f59e0b !important;
        outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
      }
      
      [data-element-key]:focus-visible {
        outline: 2px solid #f59e0b !important;
        outline-offset: 1px;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
      }
      
      /* Animation for selection changes */
      [data-section-id], [data-element-key] {
        transition: outline 0.2s ease-in-out, background 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      }
      
      /* Selection badges */
      .selection-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #3b82f6;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10;
        pointer-events: none;
      }
      
      .multi-selection-badge {
        background: #8b5cf6;
      }
      
      .element-selection-badge {
        background: #10b981;
      }
    `}</style>
  );
}

// Visual indicators for selections
function SelectionIndicators() {
  const { selectedSection, selectedElement, multiSelection } = useEditStore();

  return (
    <>
      {/* Section Selection Badge - DISABLED to avoid overlapping with toolbar */}
      {/* {selectedSection && (
        <SelectionBadge
          targetSelector={`[data-section-id="${selectedSection}"]`}
          type="section"
          label="Selected"
        />
      )} */}
      
      {/* Element Selection Badge - DISABLED to avoid overlapping with toolbar */}
      {/* {selectedElement && (
        <SelectionBadge
          targetSelector={`[data-section-id="${selectedElement.sectionId}"] [data-element-key="${selectedElement.elementKey}"]`}
          type="element"
          label="Editing"
        />
      )} */}
      
      {/* Multi-Selection Badges - DISABLED for MVP */}
    </>
  );
}

// Individual selection badge component
interface SelectionBadgeProps {
  targetSelector: string;
  type: 'section' | 'element' | 'multi';
  label: string;
}

function SelectionBadge({ targetSelector, type, label }: SelectionBadgeProps) {
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX,
        });
      }
    };

    updatePosition();
    
    // Update position on scroll and resize
    const handleUpdate = () => requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    
    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [targetSelector]);

  if (!position) return null;

  const badgeClass = `selection-badge ${
    type === 'multi' ? 'multi-selection-badge' :
    type === 'element' ? 'element-selection-badge' : ''
  }`;

  return (
    <div
      className={badgeClass}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000,
      }}
    >
      {label}
    </div>
  );
}

// Keyboard navigation helper
export function KeyboardNavigationHelper() {
  const { mode } = useEditStore();
  const [showHelp, setShowHelp] = React.useState(false);

  useEffect(() => {
    if (mode !== 'edit') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setShowHelp(prev => !prev);
      }
      
      if (event.key === 'Escape') {
        setShowHelp(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  if (!showHelp || mode !== 'edit') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Navigation</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tab / Shift+Tab</span>
                  <span className="text-gray-900">Navigate sections</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">↑ / ↓</span>
                  <span className="text-gray-900">Previous/Next section</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Enter</span>
                  <span className="text-gray-900">Edit first element</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Escape</span>
                  <span className="text-gray-900">Clear selection</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Selection</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ctrl+Click</span>
                  <span className="text-gray-900">Multi-select</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shift+Click</span>
                  <span className="text-gray-900">Range select</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ctrl+A</span>
                  <span className="text-gray-900">Select all</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">?</span>
                  <span className="text-gray-900">Show this help</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">?</kbd> anytime to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
}