// hooks/useOptimizedEditStore.ts - Memoized selectors and actions for better performance

import { useMemo, useCallback } from 'react';
import { useEditStore } from './useEditStore';
import type { EditStore } from '@/types/store';

/**
 * Memoized selector hooks to prevent unnecessary re-renders
 */

// Core state selectors
export function useEditMode() {
  return useEditStore(useCallback((state: EditStore) => state.mode, []));
}

export function useEditingMode() {
  return useEditStore(useCallback((state: EditStore) => state.editMode, []));
}

export function useSelectedSection() {
  return useEditStore(useCallback((state: EditStore) => state.selectedSection, []));
}

export function useSelectedElement() {
  return useEditStore(useCallback((state: EditStore) => state.selectedElement, []));
}

// Toolbar state
export function useToolbarState() {
  return useEditStore(useCallback((state: EditStore) => state.toolbar, []));
}

// Content selectors with memoization
export function useSections() {
  return useEditStore(useCallback((state: EditStore) => state.sections, []));
}

export function useSectionLayouts() {
  return useEditStore(useCallback((state: EditStore) => state.sectionLayouts, []));
}

export function useContent() {
  return useEditStore(useCallback((state: EditStore) => state.content, []));
}

// Optimized section-specific selectors
export function useSection(sectionId: string) {
  return useEditStore(
    useCallback((state: EditStore) => state.content[sectionId], [sectionId])
  );
}

export function useSectionLayout(sectionId: string) {
  return useEditStore(
    useCallback((state: EditStore) => state.sectionLayouts[sectionId], [sectionId])
  );
}

export function useSectionElements(sectionId: string) {
  return useEditStore(
    useCallback((state: EditStore) => {
      const section = state.content[sectionId];
      return section?.elements || {};
    }, [sectionId])
  );
}

// Element-specific selectors
export function useElement(sectionId: string, elementKey: string) {
  return useEditStore(
    useCallback((state: EditStore) => {
      const section = state.content[sectionId];
      return section?.elements[elementKey];
    }, [sectionId, elementKey])
  );
}

// Theme and settings
export function useTheme() {
  return useEditStore(useCallback((state: EditStore) => state.theme, []));
}

export function useGlobalSettings() {
  return useEditStore(useCallback((state: EditStore) => state.globalSettings, []));
}

// UI state selectors
export function useLeftPanel() {
  return useEditStore(useCallback((state: EditStore) => state.leftPanel, []));
}

export function useAIGeneration() {
  return useEditStore(useCallback((state: EditStore) => state.aiGeneration, []));
}

// Persistence state
export function usePersistenceState() {
  return useEditStore(useCallback((state: EditStore) => state.persistence, []));
}

export function useIsSaving() {
  return useEditStore(useCallback((state: EditStore) => state.persistence.isSaving, []));
}

export function useIsDirty() {
  return useEditStore(useCallback((state: EditStore) => state.persistence.isDirty, []));
}

/**
 * Memoized action hooks with stable references
 */

// Core actions
export function useEditActions() {
  const store = useEditStore();
  
  return useMemo(() => ({
    setMode: store.setMode,
    setEditMode: store.setEditMode,
    setActiveSection: store.setActiveSection,
    selectElement: store.selectElement,
  }), [store.setMode, store.setEditMode, store.setActiveSection, store.selectElement]);
}

// Toolbar actions
export function useToolbarActions() {
  const store = useEditStore();
  
  return useMemo(() => ({
    showToolbar: store.showToolbar,
    hideToolbar: store.hideToolbar,
    showSectionToolbar: store.showSectionToolbar,
    showElementToolbar: store.showElementToolbar,
    hideElementToolbar: store.hideElementToolbar,
    hideSectionToolbar: store.hideSectionToolbar,
  }), [
    store.showToolbar,
    store.hideToolbar,
    store.showSectionToolbar,
    store.showElementToolbar,
    store.hideElementToolbar,
    store.hideSectionToolbar,
  ]);
}

// Content actions
export function useContentActions() {
  const store = useEditStore();
  
  return useMemo(() => ({
    addSection: store.addSection,
    removeSection: store.removeSection,
    moveSection: store.moveSection,
    updateSectionLayout: store.updateSectionLayout,
    setSection: store.setSection,
    updateElementContent: store.updateElementContent,
    duplicateSection: store.duplicateSection,
    markAsCustomized: store.markAsCustomized,
  }), [
    store.addSection,
    store.removeSection,
    store.moveSection,
    store.updateSectionLayout,
    store.setSection,
    store.updateElementContent,
    store.duplicateSection,
    store.markAsCustomized,
  ]);
}

// AI actions
export function useAIActions() {
  const store = useEditStore();
  
  return useMemo(() => ({
    regenerateSection: store.regenerateSection,
    regenerateElement: store.regenerateElement,
    generateVariations: store.generateVariations,
    showElementVariations: store.showElementVariations,
    hideElementVariations: store.hideElementVariations,
    applyVariation: store.applyVariation,
    setGenerationMode: store.setGenerationMode,
  }), [
    store.regenerateSection,
    store.regenerateElement,
    store.generateVariations,
    store.showElementVariations,
    store.hideElementVariations,
    store.applyVariation,
    store.setGenerationMode,
  ]);
}

// Persistence actions
export function usePersistenceActions() {
  const store = useEditStore();
  
  return useMemo(() => ({
    save: store.save,
    loadFromDraft: store.loadFromDraft,
    export: store.export,
    triggerAutoSave: store.triggerAutoSave,
    forceSave: store.forceSave,
    clearAutoSaveError: store.clearAutoSaveError,
  }), [
    store.save,
    store.loadFromDraft,
    store.export,
    store.triggerAutoSave,
    store.forceSave,
    store.clearAutoSaveError,
  ]);
}

/**
 * Computed/derived state with memoization
 */

// Check if toolbar should be visible
export function useToolbarVisibility() {
  const mode = useEditMode();
  const toolbar = useToolbarState();
  
  return useMemo(() => {
    return mode === 'edit' && toolbar.visible && toolbar.type && toolbar.targetId;
  }, [mode, toolbar.visible, toolbar.type, toolbar.targetId]);
}

// Get available actions for current toolbar
export function useToolbarAvailableActions() {
  const toolbar = useToolbarState();
  
  return useMemo(() => {
    return toolbar.actions || [];
  }, [toolbar.actions]);
}

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
    sections.forEach(sectionId => {
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
  const store = useEditStore();
  
  return useMemo(() => ({
    getPerformanceStats: store.getPerformanceStats,
    resetPerformanceStats: store.resetPerformanceStats,
  }), [store.getPerformanceStats, store.resetPerformanceStats]);
}

/**
 * Batch update hook to minimize re-renders
 */
export function useBatchUpdates() {
  const store = useEditStore();
  
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
    selectElement({ sectionId, elementKey });
  }, [selectElement, sectionId, elementKey]);
  
  return useMemo(() => ({
    element,
    isSelected,
    updateContent,
    selectThisElement,
  }), [element, isSelected, updateContent, selectThisElement]);
}