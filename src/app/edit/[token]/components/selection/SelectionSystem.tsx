// app/edit/[token]/components/selection/SelectionSystem.tsx
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import { useReviewState } from '@/hooks/useReviewState';
import { isTestimonialsEnabledPublic } from '@/lib/testimonials/flag';
import { isSectionVisuallySelected } from '@/utils/selectionPriority';
// Removed useSelection - functionality now in unified useEditor system

// Proof-element predicate (co-located with the marker UI). A needs-review marker sits on a
// "proof element" when it's in a testimonials section (id `testimonials-<uuid>`) OR on one of the
// trust engine's flat quote keys. elementKey may be dotted (collName.itemId.fieldName) → match the leaf.
const TRUST_QUOTE_KEYS = new Set(['quote', 'author_name', 'author_role', 'author_company']);
function isProofElement(sectionId: string, elementKey: string): boolean {
  if (sectionId.startsWith('testimonials')) return true;
  const leaf = elementKey.includes('.') ? elementKey.split('.').pop()! : elementKey;
  return TRUST_QUOTE_KEYS.has(leaf);
}

interface SelectionSystemProps {
  children: React.ReactNode;
}

/**
 * Phase 6 — persist the current "leave as-is" dismisses.
 *
 * Why a bespoke minimal POST (not the store's routine autosave): the routine edit-page autosave
 * ships `finalContent: state.export()`, and `export()` does NOT carry `dismissedReviewFlags`
 * (that's Feature-2 review state, not page content). So marking the store dirty alone would fire a
 * save that drops the dismiss. Instead we send ONLY `finalContent: { dismissedReviewFlags }`, which
 * rides the saveDraft shallow merge (`updatedContent.finalContent = { ...existing, ...incoming }`)
 * and touches a single disjoint key — safe on multi-page projects (never overwrites page content /
 * pages / chrome), and equivalent to how routine autosaves already treat the onboarding fields
 * (bare payload → defaults merged over existing).
 */
async function persistDismissedFlags(tokenId: string): Promise<void> {
  if (!tokenId) return;
  try {
    await fetch('/api/saveDraft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId,
        finalContent: {
          dismissedReviewFlags: useReviewState.getState().dismissedReviewFlags,
        },
      }),
    });
  } catch {
    // Best-effort: a later serialize/forceSave re-persists the same array.
  }
}

export function SelectionSystem({ children }: SelectionSystemProps) {
  // Selection state now comes from unified editor system
  const { mode, selectedSection, selectedElement, multiSelection } = useEditStore(
    useShallow((s) => ({
      mode: s.mode,
      selectedSection: s.selectedSection,
      selectedElement: s.selectedElement,
      multiSelection: s.multiSelection,
    })),
  );

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
      
      if (isSectionVisuallySelected(selectedSection, sectionId, selectedElement)) {
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

  // Apply inline "verify AI-written" markers — Feature 2, edit canvas ONLY.
  // Only the `ai_generated_needs_review` category gets a marker now. The former stock-image /
  // manual-preferred / unconfigured inline badges are gone — those categories are surfaced by
  // Feature 1's "Getting started" guide instead.
  //
  // Render source is `activeMarkers`, NOT the raw `needsReviewItems`: a marker stays active only
  // while its value still equals the baseline AI original. Editing an element diverges it from
  // baseline → the Phase-2 store.subscribe refresh recomputes → the item drops out of
  // `activeMarkers` → the marker disappears (permanently, since baseline is never mutated).
  const { activeMarkers } = useReviewState();

  useEffect(() => {
    const allElements = document.querySelectorAll('[data-element-key]');

    if (mode === 'preview') {
      allElements.forEach((el) => el.classList.remove('element-ai-verify'));
      return;
    }

    // Flagged composite keys (`sectionId::elementKey`). elementKey may be plain OR dotted
    // (`collName.itemId.fieldName`); collection-field DOM nodes carry the same dotted
    // `data-element-key`, so attribute matching resolves them with no special-casing. An
    // item whose DOM node isn't present simply matches nothing and no-ops (no crash).
    const flagged = new Set(
      activeMarkers.map((i) => `${i.sectionId}::${i.elementKey}`)
    );

    allElements.forEach((el) => {
      const sectionId = el.closest('[data-section-id]')?.getAttribute('data-section-id');
      const elementKey = el.getAttribute('data-element-key');
      if (sectionId && elementKey && flagged.has(`${sectionId}::${elementKey}`)) {
        el.classList.add('element-ai-verify');
      } else {
        el.classList.remove('element-ai-verify');
      }
    });
  }, [mode, selectedSection, selectedElement, multiSelection, activeMarkers]);

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
    <div className="selection-system flex-1 min-h-0 min-w-0 flex flex-col">
      {children}
      
      {/* Selection Indicators */}
      {mode !== 'preview' && (
        <>
          <SelectionStyles />
          <SelectionIndicators />
          <VerifyMarkerControls mode={mode} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature 2 — "leave as-is" dismiss controls (EDIT-ONLY overlay)
// ---------------------------------------------------------------------------
// One tiny control per active AI-verify marker. Rendered as a positioned overlay (NOT injected
// into the flagged element) so it never pollutes contentEditable serialization. Clicking it
// dismisses the marker (drops it from activeMarkers immediately) and persists the dismiss.
// Stripped in preview mode (only mounted when mode !== 'preview').
function VerifyMarkerControls({ mode }: { mode: string }) {
  const activeMarkers = useReviewState((s) => s.activeMarkers);
  const dismiss = useReviewState((s) => s.dismiss);
  // Non-reactive store instance — tokenId/trackChange are read in the click handler only.
  const storeApi = useEditStoreApi();

  const [positions, setPositions] = React.useState<
    Array<{ key: string; sectionId: string; elementKey: string; top: number; left: number }>
  >([]);

  useEffect(() => {
    if (mode === 'preview') {
      setPositions([]);
      return;
    }

    const compute = () => {
      const next: Array<{ key: string; sectionId: string; elementKey: string; top: number; left: number }> = [];
      for (const m of activeMarkers) {
        // elementKey may be dotted (collName.itemId.fieldName); inside a quoted attribute selector
        // dots are literal, so no escaping is needed. A missing node simply contributes nothing.
        const el = document.querySelector(
          `[data-section-id="${m.sectionId}"] [data-element-key="${m.elementKey}"]`
        );
        if (el instanceof HTMLElement) {
          const rect = el.getBoundingClientRect();
          next.push({
            key: `${m.sectionId}::${m.elementKey}`,
            sectionId: m.sectionId,
            elementKey: m.elementKey,
            top: rect.top, // viewport coords → position: fixed (recomputed on scroll)
            left: rect.right,
          });
        }
      }
      setPositions(next);
    };

    compute();
    const handle = () => requestAnimationFrame(compute);
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [mode, activeMarkers]);

  if (mode === 'preview' || positions.length === 0) return null;

  // Phase 7 (proof-truth): the fix-path CTA rides the testimonial system's dark-launch gate. When
  // the flag is OFF this is `false`, no link JSX is rendered at all, and the marker UI below is
  // byte-for-byte identical to today (true no-op — the system stays fully dark).
  const testimonialsEnabled = isTestimonialsEnabledPublic();

  return (
    <>
      {positions.map((p) => (
        <React.Fragment key={p.key}>
          <button
            type="button"
            className="ai-verify-dismiss"
            title="Leave this value as-is (hide the verify marker)"
            style={{ position: 'fixed', top: p.top - 10, left: p.left - 66, zIndex: 1000 }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              dismiss(p.sectionId, p.elementKey);
              const { tokenId, trackChange } = storeApi.getState();
              // Mark dirty (status indicators) + persist the dismiss immediately. trackChange only
              // flips persistence.isDirty / lastUpdated — the concrete fields are otherwise unused.
              try {
                trackChange?.({
                  type: 'content',
                  sectionId: p.sectionId,
                  elementKey: p.elementKey,
                  oldValue: null,
                  newValue: null,
                  source: 'user',
                });
              } catch { /* noop */ }
              void persistDismissedFlags(tokenId);
            }}
          >
            leave as-is
          </button>
          {testimonialsEnabled && isProofElement(p.sectionId, p.elementKey) && (
            <Link
              href="/dashboard/testimonials"
              className="ai-verify-replace-proof"
              title="Replace this drafted proof with a real testimonial from your library"
              style={{ position: 'fixed', top: p.top + 12, left: p.left - 66, zIndex: 1000 }}
              onMouseDown={(e) => e.preventDefault()}
            >
              Replace with a real testimonial
            </Link>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

// CSS styles for selection indicators
function SelectionStyles() {
  return (
    <style jsx global>{`
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

      /* Review indicator CSS moved to globals.css for proper global scope */
    `}</style>
  );
}

// Visual indicators for selections
function SelectionIndicators() {
  const { selectedSection, selectedElement, multiSelection } = useEditStore(
    useShallow((s) => ({
      selectedSection: s.selectedSection,
      selectedElement: s.selectedElement,
      multiSelection: s.multiSelection,
    })),
  );

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
  const mode = useEditStore((s) => s.mode);
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