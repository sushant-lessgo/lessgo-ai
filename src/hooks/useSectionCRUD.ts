// hooks/useSectionCRUD.ts - Section CRUD operations hook
import { useCallback } from 'react';
import { useEditStore } from './useEditStore';
import { useModalManager } from './useModalManager';
import type { ValidationResult } from '@/types/store';
import type { SectionType } from '@/types/store/state';

export interface AddSectionOptions {
  sectionType: SectionType;
  position?: number;
  layoutType?: string;
  initialElements?: Record<string, any>;
  copyFromSection?: string;
  templateId?: string;
  backgroundType?: 'primary' | 'secondary' | 'neutral' | 'divider';
}

export interface RemoveSectionOptions {
  confirmRequired?: boolean;
  archiveInstead?: boolean;
  removeElements?: boolean;
  saveBackup?: boolean;
}

export interface DuplicateSectionOptions {
  targetPosition?: number;
  includeElements?: boolean;
  newSectionId?: string;
  preserveLayouts?: boolean;
}

export interface SectionUpdate {
  sectionId: string;
  field: string;
  value: any;
  metadata?: Record<string, any>;
}

export interface SectionValidationResult extends ValidationResult {
  sectionId: string;
  isValid: boolean;
  completionPercentage: number;
  missingElements: string[];
  hasRequiredContent: boolean;
}

export interface SectionTemplate {
  id: string;
  name: string;
  sectionType: SectionType;
  layout: string;
  elements: Record<string, any>;
  backgroundType?: string;
  metadata: {
    createdAt: number;
    description?: string;
    tags?: string[];
  };
}

export function useSectionCRUD() {
  const {
    sections,
    content,
    sectionLayouts,
    addSection: storeAddSection,
    removeSection: storeRemoveSection,
    duplicateSection: storeDuplicateSection,
    reorderSections,
    moveSectionUp,
    moveSectionDown,
    setSection,
    validateSection,
    trackChange,
    triggerAutoSave,
    announceLiveRegion,
  } = useEditStore();

  const { openModal, closeModal } = useModalManager();

  // Generate unique section ID
  const generateSectionId = useCallback((sectionType: SectionType): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${sectionType}-${timestamp}-${random}`;
  }, []);

  // Create default section data
  const createDefaultSection = useCallback((sectionId: string, options: AddSectionOptions) => {
    const { sectionType, layoutType, initialElements, backgroundType } = options;
    
    return {
      id: sectionId,
      layout: layoutType || getDefaultLayout(sectionType),
      elements: initialElements || getDefaultElements(sectionType),
      backgroundType: backgroundType || 'neutral',
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
        completionPercentage: initialElements ? 100 : 0,
      },
    };
  }, []);

  // Get default layout for section type
  const getDefaultLayout = useCallback((sectionType: SectionType): string => {
    const layoutMap = {
      hero: 'hero-centered',
      features: 'features-grid',
      cta: 'cta-banner',
      testimonials: 'testimonials-slider',
      faq: 'faq-accordion',
      custom: 'custom-default',
    };
    return layoutMap[sectionType] || 'default';
  }, []);

  // Get default elements for section type
  const getDefaultElements = useCallback((sectionType: SectionType): Record<string, any> => {
    const elementMap = {
      hero: {
        headline: { content: 'Your Headline Here', type: 'headline', isEditable: true, editMode: 'inline' },
        subheadline: { content: 'Your subheadline text', type: 'text', isEditable: true, editMode: 'inline' },
        cta: { content: 'Get Started', type: 'button', isEditable: true, editMode: 'inline' },
      },
      features: {
        headline: { content: 'Key Features', type: 'headline', isEditable: true, editMode: 'inline' },
        features: { content: ['Feature 1', 'Feature 2', 'Feature 3'], type: 'list', isEditable: true, editMode: 'inline' },
      },
      cta: {
        headline: { content: 'Ready to Get Started?', type: 'headline', isEditable: true, editMode: 'inline' },
        cta: { content: 'Start Now', type: 'button', isEditable: true, editMode: 'inline' },
      },
      testimonials: {
        headline: { content: 'What Our Customers Say', type: 'headline', isEditable: true, editMode: 'inline' },
        testimonials: { content: ['Great product!', 'Highly recommended'], type: 'list', isEditable: true, editMode: 'inline' },
      },
      faq: {
        headline: { content: 'Frequently Asked Questions', type: 'headline', isEditable: true, editMode: 'inline' },
        questions: { content: ['Question 1?', 'Question 2?'], type: 'list', isEditable: true, editMode: 'inline' },
      },
      custom: {},
    };
    return elementMap[sectionType] || {};
  }, []);

  // Add section
  const addSection = useCallback(async (options: AddSectionOptions): Promise<string> => {
    const { position, copyFromSection, templateId } = options;
    
    let sectionData;
    let newSectionId = generateSectionId(options.sectionType);

    if (copyFromSection && content[copyFromSection]) {
      // Copy from existing section
      const sourceSection = content[copyFromSection];
      sectionData = {
        ...createDefaultSection(newSectionId, options),
        layout: sourceSection.layout,
        elements: JSON.parse(JSON.stringify(sourceSection.elements)),
        backgroundType: sourceSection.backgroundType,
      };
    } else if (templateId) {
      // Load from template
      const template = await loadSectionTemplate(templateId);
      if (template) {
        sectionData = {
          ...createDefaultSection(newSectionId, options),
          layout: template.layout,
          elements: template.elements,
          backgroundType: template.backgroundType,
        };
      } else {
        sectionData = createDefaultSection(newSectionId, options);
      }
    } else {
      // Create new section
      sectionData = createDefaultSection(newSectionId, options);
    }

    // Add to store
    storeAddSection(newSectionId, position);
    setSection(newSectionId, sectionData);

    // Track change
    trackChange({
      type: 'section',
      action: 'add',
      sectionId: newSectionId,
      oldValue: null,
      newValue: sectionData,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Added ${options.sectionType} section`);

    return newSectionId;
  }, [
    generateSectionId, content, createDefaultSection, storeAddSection, 
    setSection, trackChange, triggerAutoSave, announceLiveRegion
  ]);

  // Remove section
  const removeSection = useCallback(async (
    sectionId: string, 
    options: RemoveSectionOptions = {}
  ): Promise<boolean> => {
    const { confirmRequired = true, archiveInstead = false, saveBackup = true } = options;

    if (confirmRequired) {
      return new Promise((resolve) => {
        openModal('confirmation', {
          title: 'Delete Section',
          message: `Are you sure you want to delete this section? This action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'danger',
          onConfirm: async () => {
            closeModal();
            const result = await performRemoveSection(sectionId, { ...options, confirmRequired: false });
            resolve(result);
          },
          onCancel: () => {
            closeModal();
            resolve(false);
          },
        });
      });
    }

    return performRemoveSection(sectionId, options);
  }, [openModal, closeModal]);

  // Perform actual section removal
  const performRemoveSection = useCallback(async (
    sectionId: string,
    options: RemoveSectionOptions
  ): Promise<boolean> => {
    const { saveBackup = true } = options;
    
    const sectionData = content[sectionId];
    if (!sectionData) return false;

    // Save backup if requested
    if (saveBackup) {
      await saveSectionBackup(sectionId, sectionData);
    }

    // Remove from store
    storeRemoveSection(sectionId);

    // Track change
    trackChange({
      type: 'section',
      action: 'remove',
      sectionId,
      oldValue: sectionData,
      newValue: null,
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Removed section ${sectionId}`);

    return true;
  }, [content, storeRemoveSection, trackChange, triggerAutoSave, announceLiveRegion]);

  // Duplicate section
  const duplicateSection = useCallback(async (
    sectionId: string,
    options: DuplicateSectionOptions = {}
  ): Promise<string> => {
    const { targetPosition, includeElements = true, preserveLayouts = true } = options;
    
    const sourceSection = content[sectionId];
    if (!sourceSection) throw new Error(`Section ${sectionId} not found`);

    const newSectionId = options.newSectionId || generateSectionId(sourceSection.type || 'custom');
    
    const duplicatedData = {
      ...sourceSection,
      id: newSectionId,
      elements: includeElements ? JSON.parse(JSON.stringify(sourceSection.elements)) : {},
      layout: preserveLayouts ? sourceSection.layout : getDefaultLayout(sourceSection.type || 'custom'),
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

    // Add to store
    storeDuplicateSection(sectionId, newSectionId, targetPosition);
    setSection(newSectionId, duplicatedData);

    // Track change
    trackChange({
      type: 'section',
      action: 'duplicate',
      sectionId: newSectionId,
      oldValue: null,
      newValue: duplicatedData,
      metadata: { originalSectionId: sectionId },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Duplicated section as ${newSectionId}`);

    return newSectionId;
  }, [
    content, generateSectionId, getDefaultLayout, storeDuplicateSection,
    setSection, trackChange, triggerAutoSave, announceLiveRegion
  ]);

  // Move section to position
  const moveSectionToPosition = useCallback((sectionId: string, targetPosition: number): boolean => {
    const currentIndex = sections.indexOf(sectionId);
    if (currentIndex === -1) return false;

    const newSections = [...sections];
    newSections.splice(currentIndex, 1);
    newSections.splice(targetPosition, 0, sectionId);

    reorderSections(newSections);

    trackChange({
      type: 'section',
      action: 'reorder',
      sectionId,
      oldValue: { position: currentIndex },
      newValue: { position: targetPosition },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    return true;
  }, [sections, reorderSections, trackChange, triggerAutoSave]);

  // Toggle section visibility
  const toggleSectionVisibility = useCallback((sectionId: string): boolean => {
    const sectionData = content[sectionId];
    if (!sectionData) return false;

    const newVisibility = !sectionData.isVisible;
    
    setSection(sectionId, { isVisible: newVisibility });

    trackChange({
      type: 'section',
      action: 'visibility',
      sectionId,
      oldValue: { isVisible: sectionData.isVisible },
      newValue: { isVisible: newVisibility },
      timestamp: Date.now(),
    });

    triggerAutoSave();
    announceLiveRegion(`Section ${newVisibility ? 'shown' : 'hidden'}`);

    return true;
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  // Batch update sections
  const batchUpdateSections = useCallback((updates: SectionUpdate[]): void => {
    updates.forEach(({ sectionId, field, value, metadata }) => {
      if (content[sectionId]) {
        setSection(sectionId, { [field]: value });
        
        trackChange({
          type: 'section',
          action: 'batch-update',
          sectionId,
          field,
          oldValue: content[sectionId][field as keyof typeof content[typeof sectionId]],
          newValue: value,
          metadata,
          timestamp: Date.now(),
        });
      }
    });

    triggerAutoSave();
    announceLiveRegion(`Updated ${updates.length} sections`);
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  // Batch delete sections
  const batchDeleteSections = useCallback(async (sectionIds: string[]): Promise<boolean> => {
    return new Promise((resolve) => {
      openModal('confirmation', {
        title: 'Delete Multiple Sections',
        message: `Are you sure you want to delete ${sectionIds.length} sections? This action cannot be undone.`,
        confirmText: 'Delete All',
        cancelText: 'Cancel',
        variant: 'danger',
        onConfirm: async () => {
          closeModal();
          
          for (const sectionId of sectionIds) {
            await performRemoveSection(sectionId, { confirmRequired: false });
          }
          
          announceLiveRegion(`Deleted ${sectionIds.length} sections`);
          resolve(true);
        },
        onCancel: () => {
          closeModal();
          resolve(false);
        },
      });
    });
  }, [openModal, closeModal, performRemoveSection, announceLiveRegion]);

  // Validate section
  const validateSectionEnhanced = useCallback((sectionId: string): SectionValidationResult => {
    const sectionData = content[sectionId];
    if (!sectionData) {
      return {
        sectionId,
        valid: false,
        isValid: false,
        errors: [`Section ${sectionId} not found`],
        completionPercentage: 0,
        missingElements: [],
        hasRequiredContent: false,
      };
    }

    const baseValidation = validateSection(sectionId);
    const elements = sectionData.elements || {};
    const elementKeys = Object.keys(elements);
    
    // Calculate completion percentage
    const requiredElements = getRequiredElements(sectionData.type || 'custom');
    const completedElements = requiredElements.filter(key => {
      const element = elements[key];
      return element && element.content && (
        typeof element.content === 'string' ? element.content.trim().length > 0 :
        Array.isArray(element.content) && element.content.length > 0
      );
    });
    
    const completionPercentage = requiredElements.length > 0 
      ? Math.round((completedElements.length / requiredElements.length) * 100)
      : 100;

    const missingElements = requiredElements.filter(key => !elements[key]?.content);
    const hasRequiredContent = missingElements.length === 0;

    return {
      sectionId,
      valid: baseValidation,
      isValid: baseValidation && hasRequiredContent,
      errors: hasRequiredContent ? [] : [`Missing required elements: ${missingElements.join(', ')}`],
      warnings: completionPercentage < 100 ? [`Section is ${completionPercentage}% complete`] : [],
      completionPercentage,
      missingElements,
      hasRequiredContent,
    };
  }, [content, validateSection]);

  // Get required elements for section type
  const getRequiredElements = useCallback((sectionType: SectionType): string[] => {
    const requiredMap = {
      hero: ['headline'],
      features: ['headline'],
      cta: ['headline', 'cta'],
      testimonials: ['headline'],
      faq: ['headline'],
      custom: [],
    };
    return requiredMap[sectionType] || [];
  }, []);

  // Validate all sections
  const validateAllSections = useCallback((): SectionValidationResult[] => {
    return sections.map(sectionId => validateSectionEnhanced(sectionId));
  }, [sections, validateSectionEnhanced]);

  // Save section as template
  const saveAsTemplate = useCallback(async (sectionId: string, templateName: string): Promise<SectionTemplate> => {
    const sectionData = content[sectionId];
    if (!sectionData) throw new Error(`Section ${sectionId} not found`);

    const template: SectionTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: templateName,
      sectionType: sectionData.type || 'custom',
      layout: sectionData.layout,
      elements: JSON.parse(JSON.stringify(sectionData.elements)),
      backgroundType: sectionData.backgroundType,
      metadata: {
        createdAt: Date.now(),
        description: `Template created from ${sectionId}`,
      },
    };

    // Save template (implementation would save to localStorage or API)
    await saveSectionTemplate(template);
    
    announceLiveRegion(`Saved section as template: ${templateName}`);
    return template;
  }, [content, announceLiveRegion]);

  // Load from template
  const loadFromTemplate = useCallback(async (template: SectionTemplate, position?: number): Promise<string> => {
    const options: AddSectionOptions = {
      sectionType: template.sectionType,
      layoutType: template.layout,
      initialElements: template.elements,
      backgroundType: template.backgroundType as any,
      position,
    };

    return addSection(options);
  }, [addSection]);

  // Utility functions for template management
  const saveSectionTemplate = useCallback(async (template: SectionTemplate): Promise<void> => {
    // Implementation would save to localStorage or API
    const templates = JSON.parse(localStorage.getItem('sectionTemplates') || '[]');
    templates.push(template);
    localStorage.setItem('sectionTemplates', JSON.stringify(templates));
  }, []);

  const loadSectionTemplate = useCallback(async (templateId: string): Promise<SectionTemplate | null> => {
    // Implementation would load from localStorage or API
    const templates = JSON.parse(localStorage.getItem('sectionTemplates') || '[]');
    return templates.find((t: SectionTemplate) => t.id === templateId) || null;
  }, []);

  const saveSectionBackup = useCallback(async (sectionId: string, sectionData: any): Promise<void> => {
    // Implementation would save backup
    const backups = JSON.parse(localStorage.getItem('sectionBackups') || '[]');
    backups.push({
      id: `backup-${Date.now()}`,
      sectionId,
      data: sectionData,
      timestamp: Date.now(),
    });
    localStorage.setItem('sectionBackups', JSON.stringify(backups));
  }, []);

  return {
    // Section creation
    addSection,
    addSectionFromTemplate: loadFromTemplate,
    createEmptySection: (sectionType: SectionType, position?: number) => 
      addSection({ sectionType, position }),
    
    // Section removal
    removeSection,
    removeSections: batchDeleteSections,
    
    // Section duplication
    duplicateSection,
    duplicateSections: async (sectionIds: string[]) => {
      const results = [];
      for (const sectionId of sectionIds) {
        results.push(await duplicateSection(sectionId));
      }
      return results;
    },
    
    // Section reordering
    reorderSections,
    moveSectionUp,
    moveSectionDown,
    moveSectionToPosition,
    
    // Section visibility
    toggleSectionVisibility,
    hideSections: (sectionIds: string[]) => {
      sectionIds.forEach(id => toggleSectionVisibility(id));
    },
    showSections: (sectionIds: string[]) => {
      sectionIds.forEach(id => toggleSectionVisibility(id));
    },
    
    // Batch operations
    batchUpdateSections,
    batchDeleteSections,
    
    // Section validation
    validateSection: validateSectionEnhanced,
    validateAllSections,
    
    // Section templates
    saveAsTemplate,
    loadFromTemplate,
    
    // Utilities
    getSectionSummary: (sectionId: string) => {
      const validation = validateSectionEnhanced(sectionId);
      return {
        isValid: validation.isValid,
        completionPercentage: validation.completionPercentage,
        missingElements: validation.missingElements,
        hasRequiredContent: validation.hasRequiredContent,
      };
    },
    
    getSectionsByType: (sectionType: SectionType) => {
      return sections.filter(sectionId => content[sectionId]?.type === sectionType);
    },
    
    getIncompleteSections: () => {
      return validateAllSections().filter(result => !result.isValid);
    },
  };
}