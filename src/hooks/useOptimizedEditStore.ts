// hooks/useOptimizedEditStore.ts - Memoized selectors and actions for better performance

import { useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore } from './useEditStore';
import type { EditStore } from '@/types/store';

/**
 * Narrow-selector wrapper hooks to prevent unnecessary re-renders.
 *
 * Each wrapper subscribes to EXACTLY the store field(s) it exposes via a narrow
 * `useEditStore(selector)` (object selectors wrapped in `useShallow`), instead of
 * a bare whole-store subscription. Public return shapes are preserved byte-for-byte
 * so downstream consumers need no changes and gain narrow subscriptions for free.
 * Action wrappers select the (stable-ref) store methods through `useShallow`, which
 * returns a stable object identity while those refs are unchanged.
 */

// Core state selectors
export function useEditMode() {
  return useEditStore((s) => s.mode);
}

export function useEditingMode() {
  return useEditStore((s) => s.editMode);
}

export function useSelectedSection() {
  return useEditStore((s) => s.selectedSection);
}

export function useSelectedElement() {
  return useEditStore((s) => s.selectedElement);
}

// Toolbar state
export function useToolbarState() {
  return useEditStore((s) => s.toolbar);
}

// Content selectors with memoization
export function useSections() {
  return useEditStore((s) => s.sections);
}

export function useSectionLayouts() {
  return useEditStore((s) => s.sectionLayouts);
}

export function useContent() {
  return useEditStore((s) => s.content);
}

// Optimized section-specific selectors
export function useSection(sectionId: string) {
  return useEditStore((s) => s.content[sectionId]);
}

export function useSectionLayout(sectionId: string) {
  return useEditStore((s) => s.sectionLayouts[sectionId]);
}

export function useSectionElements(sectionId: string) {
  const elements = useEditStore((s) => s.content[sectionId]?.elements);
  return elements || {};
}

// Element-specific selectors
export function useElement(sectionId: string, elementKey: string) {
  return useEditStore((s) => s.content[sectionId]?.elements?.[elementKey] || '');
}

// Theme and settings
export function useTheme() {
  return useEditStore((s) => s.theme);
}

export function useGlobalSettings() {
  return useEditStore((s) => s.globalSettings);
}

// UI state selectors
export function useLeftPanel() {
  return useEditStore((s) => s.leftPanel);
}

export function useAIGeneration() {
  return useEditStore((s) => s.aiGeneration);
}

// Persistence state
export function usePersistenceState() {
  return useEditStore((s) => s.persistence);
}

export function useIsSaving() {
  return useEditStore((s) => s.persistence.isSaving);
}

export function useIsDirty() {
  return useEditStore((s) => s.persistence.isDirty);
}

/**
 * Action hooks with stable references (selected via `useShallow` — the store's
 * action refs are stable, so the returned object identity is stable too).
 */

// Core actions
export function useEditActions() {
  return useEditStore(
    useShallow((s) => ({
      setMode: s.setMode,
      setEditMode: s.setEditMode,
      setActiveSection: s.setActiveSection,
      selectElement: s.selectElement,
    })),
  );
}

// Toolbar actions
export function useToolbarActions() {
  return useEditStore(
    useShallow((s) => ({
      showToolbar: s.showToolbar,
      hideToolbar: s.hideToolbar,
      showSectionToolbar: s.showSectionToolbar,
      showElementToolbar: s.showElementToolbar,
      hideElementToolbar: s.hideElementToolbar,
      hideSectionToolbar: s.hideSectionToolbar,
    })),
  );
}

// Content actions
export function useContentActions() {
  return useEditStore(
    useShallow((s) => ({
      addSection: s.addSection,
      removeSection: s.removeSection,
      moveSection: s.moveSection,
      updateSectionLayout: s.updateSectionLayout,
      setSection: s.setSection,
      updateElementContent: s.updateElementContent,
      duplicateSection: s.duplicateSection,
      markAsCustomized: s.markAsCustomized,
    })),
  );
}

// AI actions
export function useAIActions() {
  return useEditStore(
    useShallow((s) => ({
      regenerateSection: s.regenerateSection,
      regenerateElement: s.regenerateElement,
      generateVariations: s.generateVariations,
      showElementVariations: s.showElementVariations,
      hideElementVariations: s.hideElementVariations,
      applyVariation: s.applyVariation,
      setGenerationMode: (s as any).setGenerationMode,
    })),
  );
}

// Persistence actions
export function usePersistenceActions() {
  return useEditStore(
    useShallow((s) => ({
      save: s.save,
      loadFromDraft: s.loadFromDraft,
      export: s.export,
      triggerAutoSave: s.triggerAutoSave,
      forceSave: s.forceSave,
      clearAutoSaveError: s.clearAutoSaveError,
    })),
  );
}

/**
 * Computed/derived state with memoization
 */

// Check if any content exists
export function useHasContent() {
  const sections = useSections();
  const content = useContent();

  return useMemo(() => {
    return sections.length > 0 && Object.keys(content).length > 0;
  }, [sections.length, content]);
}

// Get section completion status
export function useSectionCompletion(sectionId: string) {
  const section = useSection(sectionId);

  return useMemo(() => {
    if (!section) return { percentage: 0, isComplete: false };

    const elementCount = Object.keys(section.elements || {}).length;
    const hasLayout = !!section.layout;

    const percentage = elementCount > 0 && hasLayout ? 100 : elementCount > 0 ? 50 : 0;
    const isComplete = percentage === 100;

    return { percentage, isComplete };
  }, [section]);
}

// Get overall page completion
export function usePageCompletion() {
  const sections = useSections();
  const content = useContent();

  return useMemo(() => {
    if (sections.length === 0) return { percentage: 0, completedSections: 0, totalSections: 0 };

    let completedSections = 0;
    sections.forEach((sectionId: string) => {
      const section = content[sectionId];
      if (section && Object.keys(section.elements || {}).length > 0) {
        completedSections++;
      }
    });

    const percentage = Math.round((completedSections / sections.length) * 100);

    return {
      percentage,
      completedSections,
      totalSections: sections.length,
    };
  }, [sections, content]);
}

// Check if element is selected
export function useIsElementSelected(sectionId: string, elementKey: string) {
  const selectedElement = useSelectedElement();

  return useMemo(() => {
    return selectedElement?.sectionId === sectionId && selectedElement?.elementKey === elementKey;
  }, [selectedElement, sectionId, elementKey]);
}

// Check if section is selected
export function useIsSectionSelected(sectionId: string) {
  const selectedSection = useSelectedSection();

  return useMemo(() => {
    return selectedSection === sectionId;
  }, [selectedSection, sectionId]);
}

/**
 * Performance monitoring hooks
 */

export function useStorePerformance() {
  return useEditStore(
    useShallow((s) => ({
      getPerformanceStats: s.getPerformanceStats,
      resetPerformanceStats: (s as any).resetPerformanceStats,
    })),
  );
}

/**
 * Batch update hook to minimize re-renders
 */
export function useBatchUpdates() {
  return useCallback((updates: () => void) => {
    // Zustand batches updates automatically when using set() within a single function
    // This is more for semantic clarity
    updates();
  }, []);
}

/**
 * Custom hook for element editing with optimizations
 */
export function useElementEditor(sectionId: string, elementKey: string) {
  const element = useElement(sectionId, elementKey);
  const isSelected = useIsElementSelected(sectionId, elementKey);
  const { updateElementContent } = useContentActions();
  const { selectElement } = useEditActions();

  const updateContent = useCallback((content: any) => {
    updateElementContent(sectionId, elementKey, content);
  }, [updateElementContent, sectionId, elementKey]);

  const selectThisElement = useCallback(() => {
    selectElement({ sectionId, elementKey, type: 'text', editMode: 'inline' });
  }, [selectElement, sectionId, elementKey]);

  return useMemo(() => ({
    element,
    isSelected,
    updateContent,
    selectThisElement,
  }), [element, isSelected, updateContent, selectThisElement]);
}
