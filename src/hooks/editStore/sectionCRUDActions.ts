// hooks/editStore/sectionCRUDActions.ts - Store actions for section CRUD operations
import type { EditStore } from '@/types/store';
import type { SectionType } from '@/types/store/state';

/**
 * Generate unique section ID
 */
const generateSectionId = (sectionType: SectionType): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  return `${sectionType}-${timestamp}-${random}`;
};

/**
 * Create default section data
 */
const createDefaultSectionData = (sectionId: string, sectionType: SectionType) => ({
  id: sectionId,
  type: sectionType,
  layout: getDefaultLayout(sectionType),
  elements: {},
  isVisible: true,
  backgroundType: 'neutral' as const,
  aiMetadata: {
    aiGenerated: false,
    lastGenerated: Date.now(),
    isCustomized: false,
    aiGeneratedElements: [],
  },
  editMetadata: {
    isSelected: false,
    isEditing: false,
    isDeletable: true,
    isMovable: true,
    isDuplicable: true,
    validationStatus: {
      isValid: true,
      errors: [],
      warnings: [],
      missingRequired: [],
      lastValidated: Date.now(),
    },
    completionPercentage: 0,
  },
});

/**
 * Get default layout for section type
 */
const getDefaultLayout = (sectionType: SectionType): string => {
  const layoutMap = {
    hero: 'hero-centered',
    features: 'features-grid',
    cta: 'cta-banner',
    testimonials: 'testimonials-slider',
    faq: 'faq-accordion',
    custom: 'custom-default',
  };
  return layoutMap[sectionType] || 'default';
};

/**
 * Validate section order bounds
 */
const validateSectionPosition = (sections: string[], position: number): number => {
  return Math.max(0, Math.min(position, sections.length));
};

/**
 * Create section CRUD actions
 */
export function createSectionCRUDActions(set: any, get: any) {
  return {
    /**
     * Add a new section
     */
    addSection: (sectionId?: string, position?: number, sectionType: SectionType = 'custom') =>
      set((state: EditStore) => {
        const newSectionId = sectionId || generateSectionId(sectionType);
        const targetPosition = position !== undefined ? validateSectionPosition(state.sections, position) : state.sections.length;
        
        // Add to sections array at specified position
        const newSections = [...state.sections];
        newSections.splice(targetPosition, 0, newSectionId);
        state.sections = newSections;
        
        // Set default layout
        state.sectionLayouts[newSectionId] = getDefaultLayout(sectionType);
        
        // Create default content
        if (!state.content[newSectionId]) {
          state.content[newSectionId] = createDefaultSectionData(newSectionId, sectionType);
        }
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'add',
          sectionId: newSectionId,
          oldValue: null,
          newValue: { sectionId: newSectionId, position: targetPosition, sectionType },
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        // Add to history
        state.history.undoStack.push({
          type: 'section',
          description: `Added ${sectionType} section`,
          timestamp: Date.now(),
          beforeState: { sections: [...state.sections].slice(0, -1) },
          afterState: { sections: [...state.sections] },
          sectionId: newSectionId,
        });
        
        state.history.redoStack = [];
        
        return newSectionId;
      }),

    /**
     * Remove a section
     */
    removeSection: (sectionId: string) =>
      set((state: EditStore) => {
        const sectionIndex = state.sections.indexOf(sectionId);
        if (sectionIndex === -1) return;
        
        const oldSectionData = state.content[sectionId];
        const oldPosition = sectionIndex;
        
        // Remove from sections array
        state.sections = state.sections.filter(id => id !== sectionId);
        
        // Remove layout
        if (state.sectionLayouts[sectionId]) {
          delete state.sectionLayouts[sectionId];
        }
        
        // Remove content
        if (state.content[sectionId]) {
          delete state.content[sectionId];
        }
        
        // Clear selection if this section was selected
        if (state.selectedSection === sectionId) {
          state.selectedSection = undefined;
        }
        
        // Remove from multi-selection
        state.multiSelection = state.multiSelection.filter(id => id !== sectionId);
        
        // Clear any errors for this section
        if (state.errors[sectionId]) {
          delete state.errors[sectionId];
        }
        
        // Clear loading states
        if (state.loadingStates[sectionId]) {
          delete state.loadingStates[sectionId];
        }
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'remove',
          sectionId,
          oldValue: { sectionData: oldSectionData, position: oldPosition },
          newValue: null,
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        // Add to history
        state.history.undoStack.push({
          type: 'section',
          description: `Removed section ${sectionId}`,
          timestamp: Date.now(),
          beforeState: { 
            sections: [...state.sections, sectionId],
            content: { ...state.content, [sectionId]: oldSectionData }
          },
          afterState: { 
            sections: [...state.sections],
            content: { ...state.content }
          },
          sectionId,
        });
        
        state.history.redoStack = [];
      }),

    /**
     * Duplicate a section
     */
    duplicateSection: (sectionId: string, newSectionId?: string, targetPosition?: number) =>
      set((state: EditStore) => {
        const sourceSection = state.content[sectionId];
        if (!sourceSection) return null;
        
        const duplicatedSectionId = newSectionId || generateSectionId(sourceSection.type || 'custom');
        const sourceIndex = state.sections.indexOf(sectionId);
        const insertPosition = targetPosition !== undefined ? 
          validateSectionPosition(state.sections, targetPosition) : 
          sourceIndex + 1;
        
        // Create duplicated section data
        const duplicatedData = {
          ...JSON.parse(JSON.stringify(sourceSection)),
          id: duplicatedSectionId,
          aiMetadata: {
            ...sourceSection.aiMetadata,
            isCustomized: true,
            lastGenerated: Date.now(),
          },
          editMetadata: {
            ...sourceSection.editMetadata,
            isSelected: false,
            isEditing: false,
          },
        };
        
        // Add to sections array
        const newSections = [...state.sections];
        newSections.splice(insertPosition, 0, duplicatedSectionId);
        state.sections = newSections;
        
        // Duplicate layout
        state.sectionLayouts[duplicatedSectionId] = state.sectionLayouts[sectionId] || getDefaultLayout(sourceSection.type || 'custom');
        
        // Set duplicated content
        state.content[duplicatedSectionId] = duplicatedData;
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'duplicate',
          sectionId: duplicatedSectionId,
          oldValue: null,
          newValue: { 
            originalSectionId: sectionId,
            duplicatedSectionId,
            position: insertPosition 
          },
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        // Add to history
        state.history.undoStack.push({
          type: 'section',
          description: `Duplicated section ${sectionId}`,
          timestamp: Date.now(),
          beforeState: { sections: [...state.sections].slice(0, -1) },
          afterState: { sections: [...state.sections] },
          sectionId: duplicatedSectionId,
        });
        
        state.history.redoStack = [];
        
        return duplicatedSectionId;
      }),

    /**
     * Reorder sections
     */
    reorderSections: (newOrder: string[]) =>
      set((state: EditStore) => {
        // Validate that all sections exist
        const validSections = newOrder.filter(sectionId => state.content[sectionId]);
        if (validSections.length !== state.sections.length) return;
        
        const oldOrder = [...state.sections];
        state.sections = validSections;
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'reorder',
          oldValue: { order: oldOrder },
          newValue: { order: validSections },
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        // Add to history
        state.history.undoStack.push({
          type: 'section',
          description: 'Reordered sections',
          timestamp: Date.now(),
          beforeState: { sections: oldOrder },
          afterState: { sections: validSections },
        });
        
        state.history.redoStack = [];
      }),

    /**
     * Move section up
     */
    moveSectionUp: (sectionId: string) =>
      set((state: EditStore) => {
        const currentIndex = state.sections.indexOf(sectionId);
        if (currentIndex <= 0) return false;
        
        const newSections = [...state.sections];
        [newSections[currentIndex - 1], newSections[currentIndex]] = 
        [newSections[currentIndex], newSections[currentIndex - 1]];
        
        state.sections = newSections;
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'move',
          sectionId,
          oldValue: { position: currentIndex },
          newValue: { position: currentIndex - 1 },
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        return true;
      }),

    /**
     * Move section down
     */
    moveSectionDown: (sectionId: string) =>
      set((state: EditStore) => {
        const currentIndex = state.sections.indexOf(sectionId);
        if (currentIndex === -1 || currentIndex >= state.sections.length - 1) return false;
        
        const newSections = [...state.sections];
        [newSections[currentIndex], newSections[currentIndex + 1]] = 
        [newSections[currentIndex + 1], newSections[currentIndex]];
        
        state.sections = newSections;
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'move',
          sectionId,
          oldValue: { position: currentIndex },
          newValue: { position: currentIndex + 1 },
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        return true;
      }),

    /**
     * Move section to specific position
     */
    moveSectionToPosition: (sectionId: string, targetPosition: number) =>
      set((state: EditStore) => {
        const currentIndex = state.sections.indexOf(sectionId);
        if (currentIndex === -1) return false;
        
        const validPosition = validateSectionPosition(state.sections, targetPosition);
        if (currentIndex === validPosition) return false;
        
        const newSections = [...state.sections];
        const [movedSection] = newSections.splice(currentIndex, 1);
        newSections.splice(validPosition, 0, movedSection);
        
        state.sections = newSections;
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'move',
          sectionId,
          oldValue: { position: currentIndex },
          newValue: { position: validPosition },
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        return true;
      }),

    /**
     * Toggle section visibility
     */
    toggleSectionVisibility: (sectionId: string) =>
      set((state: EditStore) => {
        const section = state.content[sectionId];
        if (!section) return false;
        
        const oldVisibility = section.isVisible !== false; // Default to true if undefined
        const newVisibility = !oldVisibility;
        
        section.isVisible = newVisibility;
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'visibility',
          sectionId,
          oldValue: { isVisible: oldVisibility },
          newValue: { isVisible: newVisibility },
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        return true;
      }),

    /**
     * Batch hide sections
     */
    hideSections: (sectionIds: string[]) =>
      set((state: EditStore) => {
        const updates: any[] = [];
        
        sectionIds.forEach(sectionId => {
          const section = state.content[sectionId];
          if (section && section.isVisible !== false) {
            section.isVisible = false;
            updates.push({
              sectionId,
              oldValue: { isVisible: true },
              newValue: { isVisible: false },
            });
          }
        });
        
        if (updates.length > 0) {
          // Track batch change
          state.queuedChanges.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'section',
            action: 'batch-hide',
            oldValue: updates.map(u => ({ sectionId: u.sectionId, ...u.oldValue })),
            newValue: updates.map(u => ({ sectionId: u.sectionId, ...u.newValue })),
            timestamp: Date.now(),
          });
          
          // Update state flags
          state.autoSave.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    /**
     * Batch show sections
     */
    showSections: (sectionIds: string[]) =>
      set((state: EditStore) => {
        const updates: any[] = [];
        
        sectionIds.forEach(sectionId => {
          const section = state.content[sectionId];
          if (section && section.isVisible === false) {
            section.isVisible = true;
            updates.push({
              sectionId,
              oldValue: { isVisible: false },
              newValue: { isVisible: true },
            });
          }
        });
        
        if (updates.length > 0) {
          // Track batch change
          state.queuedChanges.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'section',
            action: 'batch-show',
            oldValue: updates.map(u => ({ sectionId: u.sectionId, ...u.oldValue })),
            newValue: updates.map(u => ({ sectionId: u.sectionId, ...u.newValue })),
            timestamp: Date.now(),
          });
          
          // Update state flags
          state.autoSave.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    /**
     * Batch update sections
     */
    batchUpdateSections: (updates: Array<{ sectionId: string; field: string; value: any; metadata?: any }>) =>
      set((state: EditStore) => {
        const changes: any[] = [];
        
        updates.forEach(({ sectionId, field, value, metadata }) => {
          const section = state.content[sectionId];
          if (section) {
            const oldValue = (section as any)[field];
            (section as any)[field] = value;
            
            changes.push({
              sectionId,
              field,
              oldValue,
              newValue: value,
              metadata,
            });
          }
        });
        
        if (changes.length > 0) {
          // Track batch change
          state.queuedChanges.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'section',
            action: 'batch-update',
            oldValue: changes,
            newValue: changes,
            timestamp: Date.now(),
          });
          
          // Update state flags
          state.autoSave.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    /**
     * Archive section (soft delete)
     */
    archiveSection: (sectionId: string) =>
      set((state: EditStore) => {
        const section = state.content[sectionId];
        if (!section) return false;
        
        // Mark as archived instead of deleting
        section.isArchived = true;
        section.archivedAt = Date.now();
        
        // Remove from active sections but keep content
        state.sections = state.sections.filter(id => id !== sectionId);
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'archive',
          sectionId,
          oldValue: { isArchived: false },
          newValue: { isArchived: true },
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        return true;
      }),

    /**
     * Restore archived section
     */
    restoreSection: (sectionId: string, position?: number) =>
      set((state: EditStore) => {
        const section = state.content[sectionId];
        if (!section || !section.isArchived) return false;
        
        // Restore section
        section.isArchived = false;
        delete section.archivedAt;
        
        // Add back to sections array
        const targetPosition = position !== undefined ? 
          validateSectionPosition(state.sections, position) : 
          state.sections.length;
        
        const newSections = [...state.sections];
        newSections.splice(targetPosition, 0, sectionId);
        state.sections = newSections;
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'section',
          action: 'restore',
          sectionId,
          oldValue: { isArchived: true },
          newValue: { isArchived: false, position: targetPosition },
          timestamp: Date.now(),
        });
        
        // Update state flags
        state.autoSave.isDirty = true;
        state.lastUpdated = Date.now();
        
        return true;
      }),

    /**
     * Get archived sections
     */
    getArchivedSections: () => {
      const state = get();
      return Object.entries(state.content)
        .filter(([_, section]) => (section as any).isArchived)
        .map(([sectionId, section]) => ({
          sectionId,
          section,
          archivedAt: (section as any).archivedAt,
        }))
        .sort((a, b) => b.archivedAt - a.archivedAt);
    },

    /**
     * Permanently delete archived sections
     */
    permanentlyDeleteArchivedSections: () =>
      set((state: EditStore) => {
        const archivedSectionIds = Object.keys(state.content).filter(
          sectionId => (state.content[sectionId] as any).isArchived
        );
        
        // Remove from content
        archivedSectionIds.forEach(sectionId => {
          delete state.content[sectionId];
          if (state.sectionLayouts[sectionId]) {
            delete state.sectionLayouts[sectionId];
          }
        });
        
        // Track change
        if (archivedSectionIds.length > 0) {
          state.queuedChanges.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'section',
            action: 'permanent-delete',
            oldValue: { deletedSections: archivedSectionIds },
            newValue: null,
            timestamp: Date.now(),
          });
          
          // Update state flags
          state.autoSave.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),
  };
}