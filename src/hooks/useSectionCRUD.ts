// hooks/useSectionCRUD.ts - Section CRUD operations hook
import { useCallback } from 'react';
import { useEditStoreLegacy as useEditStore } from './useEditStoreLegacy';
import type { ValidationResult } from '@/types/store';
import type { BackgroundType } from '@/types/sectionBackground';
// import type { SectionType } from '@/types/store/state';
type SectionType = string; // Temporary fix

export interface AddSectionOptions {
  sectionType: SectionType;
  position?: number;
  layoutType?: string;
  initialElements?: Record<string, any>;
  copyFromSection?: string;
  templateId?: string;
  backgroundType?: BackgroundType;
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
  const store = useEditStore();
  const {
    sections,
    content,
    sectionLayouts,
    addSection: storeAddSection,
    removeSection: storeRemoveSection,
    duplicateSection: storeDuplicateSection,
    reorderSections,
    setSection,
    trackChange,
    triggerAutoSave,
    announceLiveRegion,
  } = store;
  
  const moveSectionUp = (store as any).moveSectionUp;
  const moveSectionDown = (store as any).moveSectionDown;
  const validateSection = (store as any).validateSection;


  // Generate unique section ID
  const generateSectionId = useCallback((sectionType: SectionType): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${sectionType}-${timestamp}-${random}`;
  }, []);

  // Create default section data
  const createDefaultSection = useCallback((sectionId: string, options: AddSectionOptions): Partial<import('@/types/store').SectionData> => {
    const { sectionType, layoutType, initialElements, backgroundType } = options;
    
    return {
      id: sectionId,
      layout: layoutType || getDefaultLayout(sectionType),
      elements: initialElements || getDefaultElements(sectionType),
      backgroundType: (backgroundType || 'theme') as BackgroundType,
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
    return (layoutMap as any)[sectionType] || 'default';
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
    return (elementMap as any)[sectionType] || {};
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
        backgroundType: (sourceSection.backgroundType === 'theme' || sourceSection.backgroundType === 'custom') ? sourceSection.backgroundType : 'theme' as BackgroundType,
      };
    } else if (templateId) {
      // Load from template
      const template = await loadSectionTemplate(templateId);
      if (template) {
        sectionData = {
          ...createDefaultSection(newSectionId, options),
          layout: template.layout,
          elements: template.elements,
          backgroundType: (template.backgroundType === 'theme' || template.backgroundType === 'custom') ? template.backgroundType : 'theme' as BackgroundType,
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
      type: 'layout',
      sectionId: newSectionId,
      oldValue: null,
      newValue: sectionData,
      source: 'user',
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
      const confirmed = window.confirm('Are you sure you want to delete this section? This action cannot be undone.');
      if (!confirmed) {
        return false;
      }
    }

    return performRemoveSection(sectionId, options);
  }, []);

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
      type: 'layout',
      sectionId,
      oldValue: sectionData,
      newValue: null,
      source: 'user',
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

    const newSectionId = options.newSectionId || generateSectionId((sourceSection as any).type || 'custom');
    
    const duplicatedData = {
      ...sourceSection,
      id: newSectionId,
      elements: includeElements ? JSON.parse(JSON.stringify(sourceSection.elements)) : {},
      layout: preserveLayouts ? sourceSection.layout : getDefaultLayout((sourceSection as any).type || 'custom'),
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
    storeDuplicateSection(sectionId);
    setSection(newSectionId, duplicatedData);

    // Track change
    trackChange({
      type: 'layout',
      sectionId: newSectionId,
      oldValue: null,
      newValue: duplicatedData,
      source: 'user',
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
      type: 'layout',
      sectionId,
      oldValue: { position: currentIndex },
      newValue: { position: targetPosition },
      source: 'user',
    });

    triggerAutoSave();
    return true;
  }, [sections, reorderSections, trackChange, triggerAutoSave]);


  // Batch update sections
  const batchUpdateSections = useCallback((updates: SectionUpdate[]): void => {
    updates.forEach(({ sectionId, field, value, metadata }) => {
      if (content[sectionId]) {
        setSection(sectionId, { [field]: value });
        
        trackChange({
          type: 'content',
          sectionId,
          field,
          oldValue: content[sectionId][field as keyof typeof content[typeof sectionId]],
          newValue: value,
          source: 'user',
        });
      }
    });

    triggerAutoSave();
    announceLiveRegion(`Updated ${updates.length} sections`);
  }, [content, setSection, trackChange, triggerAutoSave, announceLiveRegion]);

  // Batch delete sections
  const batchDeleteSections = useCallback(async (sectionIds: string[]): Promise<boolean> => {
    const confirmed = window.confirm(`Are you sure you want to delete ${sectionIds.length} sections? This action cannot be undone.`);
    if (!confirmed) {
      return false;
    }
    
    for (const sectionId of sectionIds) {
      await performRemoveSection(sectionId, { confirmRequired: false });
    }
    
    announceLiveRegion(`Deleted ${sectionIds.length} sections`);
    return true;
  }, [performRemoveSection, announceLiveRegion]);

  // Validate section
  const validateSectionEnhanced = useCallback((sectionId: string): SectionValidationResult => {
    const sectionData = content[sectionId];
    if (!sectionData) {
      return {
        sectionId,
        isValid: false,
        errors: [{ 
          message: `Section ${sectionId} not found`, 
          elementKey: 'section',
          code: 'SECTION_NOT_FOUND',
          severity: 'error' as const
        }],
        warnings: [],
        completionPercentage: 0,
        missingElements: [],
        hasRequiredContent: false,
        lastValidated: Date.now(),
      };
    }

    const baseValidation = validateSection(sectionId);
    const elements = sectionData.elements || {};
    const elementKeys = Object.keys(elements);
    
    // Calculate completion percentage
    const requiredElements = getRequiredElements((sectionData as any).type || 'custom');
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
      lastValidated: Date.now(),
      isValid: baseValidation && hasRequiredContent,
      errors: hasRequiredContent ? [] : [{
        message: `Missing required elements: ${missingElements.join(', ')}`,
        elementKey: 'section',
        code: 'MISSING_REQUIRED',
        severity: 'error' as const
      }],
      warnings: completionPercentage < 100 ? [{
        message: `Section is ${completionPercentage}% complete`,
        elementKey: 'section', 
        code: 'INCOMPLETE',
        autoFixable: false
      }] : [],
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
    return (requiredMap as any)[sectionType] || [];
  }, []);

  // Validate all sections
  const validateAllSections = useCallback((): SectionValidationResult[] => {
    return sections.map((sectionId: string) => validateSectionEnhanced(sectionId));
  }, [sections, validateSectionEnhanced]);

  // Save section as template
  const saveAsTemplate = useCallback(async (sectionId: string, templateName: string): Promise<SectionTemplate> => {
    const sectionData = content[sectionId];
    if (!sectionData) throw new Error(`Section ${sectionId} not found`);

    const template: SectionTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: templateName,
      sectionType: (sectionData as any).type || 'custom',
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
      return sections.filter((sectionId: string) => (content[sectionId] as any)?.type === sectionType);
    },
    
    getIncompleteSections: () => {
      return validateAllSections().filter(result => !result.isValid);
    },
  };
}