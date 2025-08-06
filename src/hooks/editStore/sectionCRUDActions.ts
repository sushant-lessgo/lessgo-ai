// hooks/editStore/sectionCRUDActions.ts - Store actions for section CRUD operations
import type { EditStore } from '@/types/store';
// import type { string } from '@/types/store/state'; // Commented out - type not available

/**
 * Generate unique section ID
 */
const generateSectionId = (sectionType: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  return `${sectionType}-${timestamp}-${random}`;
};

/**
 * Create default section data
 */
const createDefaultSectionData = (sectionId: string, sectionType: string) => ({
  id: sectionId,
  type: sectionType,
  layout: getDefaultLayout(sectionType),
  elements: {},
  isVisible: true,
  backgroundType: 'theme' as const,
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
const getDefaultLayout = (sectionType: string): string => {
  const layoutMap = {
    hero: 'hero-centered',
    features: 'features-grid',
    cta: 'cta-banner',
    testimonials: 'testimonials-slider',
    faq: 'faq-accordion',
    custom: 'custom-default',
  };
  return (layoutMap as any)[sectionType] || 'default';
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
    addSection: (sectionId?: string, position?: number, sectionType: string = 'custom') =>
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
          type: 'content',
          sectionId: newSectionId,
          oldValue: null,
          newValue: { sectionId: newSectionId, position: targetPosition, sectionType },
          timestamp: Date.now(),
          source: 'user',
        });
        
        // Update state flags
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
        
        // Add to history
        state.history.undoStack.push({
          type: 'content',
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
          type: 'content',
          sectionId,
          oldValue: { sectionData: oldSectionData, position: oldPosition },
          newValue: null,
          timestamp: Date.now(),
          source: 'user',
        });
        
        // Update state flags
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
        
        // Add to history
        state.history.undoStack.push({
          type: 'content',
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
        
        const duplicatedSectionId = newSectionId || generateSectionId('custom');
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
        state.sectionLayouts[duplicatedSectionId] = state.sectionLayouts[sectionId] || getDefaultLayout('custom');
        
        // Set duplicated content
        state.content[duplicatedSectionId] = duplicatedData;
        
        // Track change
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'content',
          sectionId: duplicatedSectionId,
          oldValue: null,
          newValue: { 
            originalSectionId: sectionId,
            duplicatedSectionId,
            position: insertPosition 
          },
          timestamp: Date.now(),
          source: 'user',
        });
        
        // Update state flags
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
        
        // Add to history
        state.history.undoStack.push({
          type: 'content',
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
          type: 'content',
          oldValue: { order: oldOrder },
          newValue: { order: validSections },
          timestamp: Date.now(),
          source: 'user',
        });
        
        // Update state flags
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
        
        // Add to history
        state.history.undoStack.push({
          type: 'content',
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
          type: 'content',
          sectionId,
          oldValue: { position: currentIndex },
          newValue: { position: currentIndex - 1 },
          timestamp: Date.now(),
          source: 'user',
        });
        
        // Update state flags
        state.persistence.isDirty = true;
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
          type: 'content',
          sectionId,
          oldValue: { position: currentIndex },
          newValue: { position: currentIndex + 1 },
          timestamp: Date.now(),
          source: 'user',
        });
        
        // Update state flags
        state.persistence.isDirty = true;
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
          type: 'content',
          sectionId,
          oldValue: { position: currentIndex },
          newValue: { position: validPosition },
          timestamp: Date.now(),
          source: 'user',
        });
        
        // Update state flags
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
        
        return true;
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
            type: 'content',
            oldValue: changes,
            newValue: changes,
            timestamp: Date.now(),
            source: 'user',
          });
          
          // Update state flags
          state.persistence.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    /**
     * Archive section (soft delete)
     */
    archiveSection: (sectionId: string) =>
      set((state: EditStore) => {
        // TODO: Archive functionality is not available in current SectionData structure
        // Implementation needed when isArchived property is added to SectionData type
        console.warn('archiveSection: Not implemented - SectionData type needs isArchived property');
        return false;
      }),

    /**
     * Restore archived section
     */
    restoreSection: (sectionId: string, position?: number) =>
      set((state: EditStore) => {
        // TODO: Archive functionality is not available in current SectionData structure
        // Implementation needed when isArchived property is added to SectionData type
        console.warn('restoreSection: Not implemented - SectionData type needs isArchived property');
        return false;
      }),

    /**
     * Get archived sections
     */
    getArchivedSections: () => {
      // TODO: Archive functionality is not available in current SectionData structure
      // Implementation needed when isArchived property is added to SectionData type
      console.warn('getArchivedSections: Not implemented - SectionData type needs isArchived property');
      return [];
    },

    /**
     * Permanently delete archived sections
     */
    permanentlyDeleteArchivedSections: () =>
      set((state: EditStore) => {
        // TODO: Archive functionality is not available in current SectionData structure
        // Implementation needed when isArchived property is added to SectionData type
        console.warn('permanentlyDeleteArchivedSections: Not implemented - SectionData type needs isArchived property');
      }),
  };
}