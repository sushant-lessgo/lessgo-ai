// hooks/useToolbarActions.ts - Enhanced toolbar action handlers with inline editor integration
import { useCallback } from 'react';
import { useEditStoreLegacy as useEditStore } from './useEditStoreLegacy';
import { useInlineEditorActions } from './useInlineEditorActions';
import { useTextToolbarIntegration } from './useTextToolbarIntegration';
import { getSectionTypeFromLayout } from '@/utils/layoutSectionTypeMapping';
// Removed useToolbarContext - now using unified editor system
import type { ElementSelection } from '@/types/store/state';
import type { ToolbarAction } from '@/types/core/ui';
import type { BackgroundType, ElementType } from '@/types/core/index';
import { useElementPicker } from './useElementPicker';
import { useElementCRUD } from './useElementCRUD';
import type { UniversalElementType } from '@/types/universalElements';
import { UNIVERSAL_ELEMENTS } from '@/types/universalElements';
import { 
  validateElementAddition, 
  getElementRestrictions,
  getRestrictionSummary 
} from '@/utils/elementRestrictions';
export function useToolbarActions() {
  const {
    // Content actions
    updateElementContent,
    regenerateElement,
    regenerateSection,
    duplicateSection,
    removeSection,
    setBackgroundType,
    markAsCustomized,
    setSection,
    
    // Layout actions
    updateSectionLayout,
    moveSection,
    reorderSections,
    
    // Form actions
    addFormField,
    removeFormField,
    updateFormField,
    toggleFormFieldRequired,
    
    // Image actions
    updateImageAsset,
    
    // UI actions
    showSectionToolbar,
    showElementToolbar,
    hideElementToolbar,
    hideSectionToolbar,
    setSelectedElement,
    setActiveSection,
    showElementVariations,
    hideElementVariations,
    
    // State
    content,
    sections,
    sectionLayouts,
    selectedElement,
    selectedSection,
    forms,
    images,
    
    // UI Modal actions
    showLayoutChangeModal,
    
    // Auto-save
    trackChange,
    triggerAutoSave,
  } = useEditStore();

  const { showElementPicker } = useElementPicker();
const { addElement } = useElementCRUD();

  // Enhanced inline editor actions (temporary stub implementation)  
  const {
    handleApplyTextFormat: handleInlineTextFormat,
    handleContentUpdate,
    handleContentSave,
    handleContentCancel,
    handleFormatChange,
  } = useInlineEditorActions();
  
  // Temporary stubs for missing methods until full implementation is restored
  const handleInlineTextColor = (...args: any[]) => true;
  const handleInlineFontSize = (...args: any[]) => true;
  const handleInlineTextAlign = (...args: any[]) => true;
  const handleInlineFontFamily = (...args: any[]) => true;
  const handleInlineLineHeight = (...args: any[]) => true;
  const handleInlineLetterSpacing = (...args: any[]) => true;
  const handleInlineTextTransform = (...args: any[]) => true;
  const handleInlineClearFormatting = (...args: any[]) => true;
  const handleApplyBatchFormat = (...args: any[]) => true;
  const getCurrentFormatState = (...args: any[]) => ({});
  const isFormatActiveState = (...args: any[]) => false;
  const hasActiveEditor = () => false;

  // Toolbar context functionality now integrated into unified editor system
  // Simple capability check - for now, all actions are available
  const hasCapability = useCallback((actionId: string) => true, []);
  const currentContext = null;

  // ===== CORE ACTION EXECUTION =====
  
  const executeAction = useCallback(async (actionId: string, params?: any) => {
    if (!hasCapability(actionId)) {
      console.warn(`Action ${actionId} is not available in current context`);
      return false;
    }

    try {
      const startTime = performance.now();
      let result = false;

      switch (actionId) {
        // ===== SECTION ACTIONS =====
        case 'change-layout':
          result = await handleChangeLayout(params);
          break;
        case 'add-element':
          result = await handleAddElement(params);
          break;
        case 'move-section':
          result = await handleMoveSection(params);
          break;
        case 'background-settings':
          result = await handleBackgroundSettings(params);
          break;
        case 'regenerate-section':
          result = await handleRegenerateSection(params);
          break;
        case 'duplicate-section':
          result = await handleDuplicateSection(params);
          break;
        case 'delete-section':
          result = await handleDeleteSection(params);
          break;

        // ===== ENHANCED TEXT ACTIONS (with inline editor support) =====
        case 'apply-text-format':
          result = await handleApplyTextFormat(params);
          break;
        case 'change-text-color':
          result = await handleChangeTextColor(params);
          break;
        case 'change-font-size':
          result = await handleChangeFontSize(params);
          break;
        case 'change-text-align':
          result = await handleChangeTextAlign(params);
          break;
        case 'change-font-family':
          result = await handleChangeFontFamily(params);
          break;
        case 'change-line-height':
          result = await handleChangeLineHeight(params);
          break;
        case 'change-letter-spacing':
          result = await handleChangeLetterSpacing(params);
          break;
        case 'change-text-transform':
          result = await handleChangeTextTransform(params);
          break;
        case 'clear-formatting':
          result = await handleClearFormatting(params);
          break;
        case 'apply-batch-format':
          result = await handleApplyBatchFormat(params);
          break;
        case 'text-regenerate':
          result = await handleTextRegenerate(params);
          break;

        // ===== ELEMENT ACTIONS =====
        case 'duplicate-element':
          result = await handleDuplicateElement(params);
          break;
        case 'delete-element':
          result = await handleDeleteElement(params);
          break;
        case 'element-style':
          result = await handleElementStyle(params);
          break;
        case 'change-element-type':
          result = await handleChangeElementType(params);
          break;
        case 'convert-cta-to-form':
          result = await handleConvertCTAToForm(params);
          break;
        case 'link-settings':
          result = await handleLinkSettings(params);
          break;
        case 'element-regenerate':
          result = await handleElementRegenerate(params);
          break;

        // ===== IMAGE ACTIONS =====
        case 'replace-image':
          result = await handleReplaceImage(params);
          break;
        case 'stock-photos':
          result = await handleStockPhotos(params);
          break;
        case 'edit-image':
          result = await handleEditImage(params);
          break;
        case 'alt-text':
          result = await handleUpdateAltText(params);
          break;
        case 'image-filters':
          result = await handleImageFilters(params);
          break;
        case 'optimize':
          result = await handleOptimizeImage(params);
          break;
        case 'delete-image':
          result = await handleDeleteImage(params);
          break;

        // ===== FORM ACTIONS =====
        case 'add-field':
          result = await handleAddFormField(params);
          break;
        case 'remove-field':
          result = await handleRemoveFormField(params);
          break;
        case 'field-required':
          result = await handleToggleFieldRequired(params);
          break;
        case 'form-settings':
          result = await handleFormSettings(params);
          break;
        case 'integrations':
          result = await handleFormIntegrations(params);
          break;
        case 'form-styling':
          result = await handleFormStyling(params);
          break;

        default:
          console.warn(`Unknown action: ${actionId}`);
          return false;
      }

      const duration = performance.now() - startTime;
      console.log(`Action ${actionId} executed in ${duration.toFixed(2)}ms`);
      
      // Track change for auto-save
      if (result) {
        trackChange({
          type: 'action',
          actionId,
          params,
          timestamp: Date.now(),
        });
        triggerAutoSave();
      }
      
      return result;
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
      return false;
    }
  }, [hasCapability, trackChange, triggerAutoSave]);

  // ===== SECTION ACTION HANDLERS =====
  
  const handleChangeLayout = useCallback(async (params: { sectionId: string }) => {
    const { sectionId } = params;
    
    // Get section data
    const section = content[sectionId];
    const currentLayout = sectionLayouts[sectionId];
    
    if (!section || !currentLayout) {
      console.error('Section or layout not found for:', sectionId, { section, currentLayout });
      return false;
    }
    
    // Get section type from the current layout name
    let sectionType = getSectionTypeFromLayout(currentLayout);
    
    // If we couldn't determine from layout, use the sectionId or aiMetadata
    if (sectionType === 'hero') {
      // First try using the sectionId itself as it might be the section type
      const sectionIdMapping: Record<string, string> = {
        'uniqueMechanism': 'uniqueMechanism',
        'unique-mechanism': 'uniqueMechanism',
        'unique_mechanism': 'uniqueMechanism',
        'cta': 'cta',
        'CTA': 'cta',
        'beforeAfter': 'beforeAfter',
        'features': 'features',
        'faq': 'faq',
        'pricing': 'pricing',
        'testimonials': 'testimonials',
        'howItWorks': 'howItWorks',
        'problem': 'problem',
        'results': 'results',
        'security': 'security',
        'socialProof': 'socialProof',
        'founderNote': 'founderNote',
        'integrations': 'integrations',
        'objectionHandling': 'objectionHandling',
        'useCases': 'useCases',
        'comparisonTable': 'comparisonTable',
        'closeSection': 'closeSection',
      };
      
      if (sectionIdMapping[sectionId]) {
        sectionType = sectionIdMapping[sectionId];
      } else if (section.aiMetadata?.sectionType) {
        // Try aiMetadata as last resort
        sectionType = section.aiMetadata.sectionType;
        
        // Handle any naming differences in aiMetadata
        const aiMetadataMapping: Record<string, string> = {
          'unique-mechanism': 'uniqueMechanism',
          'unique_mechanism': 'uniqueMechanism',
          'UniqueMechanism': 'uniqueMechanism',
          'CTA': 'cta',
          'Cta': 'cta',
        };
        
        if (aiMetadataMapping[sectionType]) {
          sectionType = aiMetadataMapping[sectionType];
        }
      }
    }
    
    console.log('Layout change debug:', { 
      sectionId, 
      currentLayout,
      determinedSectionType: sectionType,
      aiMetadata: section.aiMetadata,
      fallbackReason: sectionType === 'hero' ? 'Could not determine from layout' : 'Determined from layout'
    });
    
    // Show the layout change modal
    showLayoutChangeModal(sectionId, sectionType, currentLayout, section.elements);
    
    return true;
  }, [content, sectionLayouts, showLayoutChangeModal]);

  const handleAddElement = useCallback(async (params: { 
  sectionId: string; 
  elementType?: UniversalElementType;
  position?: { x: number; y: number };
}) => {
  console.log('🎯 handleAddElement called:', params);
  const { sectionId, elementType, position } = params;
  
  // Get section information for restriction checking
  const sectionData = content[sectionId];
  // Use the sectionId itself as the section type since that's where the type is stored
  const sectionType = sectionId || 'content';
  const layoutType = sectionData?.layout;
  
  console.log('🎯 Section data:', { 
    sectionType, 
    layoutType, 
    sectionData,
    sectionDataKeys: sectionData ? Object.keys(sectionData) : [],
    possibleSectionType: sectionData?.type || sectionData?.sectionType || sectionId
  });
  
  // If elementType is specified, validate and add element directly
  if (elementType) {
    // Validate element addition against restrictions
    const validation = validateElementAddition(elementType, sectionType, layoutType);
    
    if (!validation.allowed) {
      console.warn(`Element addition blocked: ${validation.reason}`);
      // Could show user-friendly notification here
      if (validation.suggestion) {
        console.info(`Suggestion: ${validation.suggestion}`);
      }
      return false;
    }
    
    try {
      const elementKey = await addElement(sectionId, elementType, {
        autoFocus: true,
        position: Object.keys(content[sectionId]?.elements || {}).length,
      });
      
      // Announce success
      const elementConfig = UNIVERSAL_ELEMENTS[elementType];
      console.log(`Added ${elementConfig.label} element`);
      
      return true;
    } catch (error) {
      console.error('Failed to add element:', error);
      return false;
    }
  }
  
  // Otherwise, show ElementPicker with restriction context
  const buttonElement = document.querySelector('[data-action="add-element"]');
  let pickerPosition = position;
  
  if (!pickerPosition && buttonElement) {
    const rect = buttonElement.getBoundingClientRect();
    pickerPosition = {
      x: rect.left,
      y: rect.bottom + 8,
    };
  }
  
  if (pickerPosition) {
    // Get restriction information to pass to ElementPicker
    const restrictions = getElementRestrictions(sectionType, layoutType);
    const restrictionSummary = getRestrictionSummary(sectionType, layoutType);
    
    console.log('🎯 About to call showElementPicker with restrictions:', {
      restrictions,
      restrictionSummary,
      pickerPosition
    });
    
    showElementPicker(sectionId, pickerPosition, {
      autoFocus: true,
      categories: ['text', 'interactive', 'media', 'layout'],
      restrictedTypes: restrictions.restrictedElements,
      restrictionReason: restrictions.restriction.reason,
      restrictionContext: {
        sectionType,
        layoutType,
        sectionId,
      },
    });
    return true;
  }
  
  // Fallback to original prompt-based selection
  const elements = [
    { id: 'text', name: 'Text Block', key: 'text' },
    { id: 'headline', name: 'Headline', key: 'headline' },
    { id: 'subheadline', name: 'Subheadline', key: 'subheadline' },
    { id: 'button', name: 'Button', key: 'cta' },
    { id: 'image', name: 'Image', key: 'image' },
    { id: 'video', name: 'Video', key: 'video' },
    { id: 'form', name: 'Form', key: 'form' },
    { id: 'list', name: 'List', key: 'list' },
  ];

  const selectedElement = prompt(`Add element:\n${elements.map((e, i) => `${i + 1}. ${e.name}`).join('\n')}`);
  const elementIndex = parseInt(selectedElement || '0') - 1;
  
  if (elementIndex >= 0 && elementIndex < elements.length) {
    const element = elements[elementIndex];
    
    const newElementKey = `${element.key}-${Date.now()}`;
    const currentSection = content[sectionId];
    
    if (currentSection) {
      const updatedElements = {
        ...currentSection.elements,
        [newElementKey]: {
          content: getDefaultContent(element.id),
          type: element.id as ElementType,
          isEditable: true,
          editMode: 'inline' as const,
        }
      };
      
      setSection(sectionId, { elements: updatedElements });
      return true;
    }
  }
  return false;
}, [content, setSection, showElementPicker, addElement]);


  const handleMoveSection = useCallback(async (params: { sectionId: string; direction: 'up' | 'down' }) => {
    const { sectionId, direction } = params;
    
    const currentIndex = sections.indexOf(sectionId);
    if (currentIndex === -1) return false;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < sections.length) {
      const newSections = [...sections];
      [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];
      
      reorderSections(newSections);
      return true;
    }
    return false;
  }, [sections, reorderSections]);

  const handleBackgroundSettings = useCallback(async (params: { sectionId: string }) => {
    const { sectionId } = params;
    
    // This will be handled by the SectionToolbar showing the modal
    // Return true to indicate the action was processed
    return true;
  }, []);

  const handleRegenerateSection = useCallback(async (params: { sectionId: string; userGuidance?: string }) => {
    const { sectionId, userGuidance } = params;
    
    try {
      await regenerateSection(sectionId, userGuidance);
      return true;
    } catch (error) {
      console.error('Section regeneration failed:', error);
      return false;
    }
  }, [regenerateSection]);

  const handleDuplicateSection = useCallback(async (params: { sectionId: string }) => {
    const { sectionId } = params;
    
    try {
      duplicateSection(sectionId);
      return true;
    } catch (error) {
      console.error('Section duplication failed:', error);
      return false;
    }
  }, [duplicateSection]);

  const handleDeleteSection = useCallback(async (params: { sectionId: string }) => {
    const { sectionId } = params;
    
    if (confirm('Are you sure you want to delete this section?')) {
      try {
        removeSection(sectionId);
        return true;
      } catch (error) {
        console.error('Section deletion failed:', error);
        return false;
      }
    }
    return false;
  }, [removeSection]);

  // ===== ENHANCED TEXT ACTION HANDLERS =====
  
  const handleApplyTextFormat = useCallback(async (params: { 
    elementSelection: ElementSelection; 
    format: string; 
    active: boolean 
  }) => {
    const { elementSelection, format, active } = params;
    
    // If inline editor is active, use the enhanced handler
    if (hasActiveEditor()) {
      return await handleInlineTextFormat({
        elementSelection,
        format: format as any,
        active,
      });
    }
    
    // Fallback to DOM manipulation
    const targetElement = document.querySelector(
      `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
    ) as HTMLElement;
    
    if (targetElement) {
      switch (format) {
        case 'bold':
          targetElement.style.fontWeight = active ? 'bold' : 'normal';
          break;
        case 'italic':
          targetElement.style.fontStyle = active ? 'italic' : 'normal';
          break;
        case 'underline':
          targetElement.style.textDecoration = active ? 'underline' : 'none';
          break;
      }
      
      markAsCustomized(elementSelection.sectionId);
      return true;
    }
    return false;
  }, [hasActiveEditor, handleInlineTextFormat, markAsCustomized]);

  const handleChangeTextColor = useCallback(async (params: { 
    elementSelection: ElementSelection; 
    color: string 
  }) => {
    const { elementSelection, color } = params;
    
    // If inline editor is active, use the enhanced handler
    if (hasActiveEditor()) {
      return await handleInlineTextColor({
        elementSelection,
        color,
      });
    }
    
    // Fallback to DOM manipulation
    const targetElement = document.querySelector(
      `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
    ) as HTMLElement;
    
    if (targetElement) {
      targetElement.style.color = color;
      markAsCustomized(elementSelection.sectionId);
      return true;
    }
    return false;
  }, [hasActiveEditor, handleInlineTextColor, markAsCustomized]);

  const handleChangeFontSize = useCallback(async (params: { 
    elementSelection: ElementSelection; 
    size: string 
  }) => {
    const { elementSelection, size } = params;
    
    // If inline editor is active, use the enhanced handler
    if (hasActiveEditor()) {
      return await handleInlineFontSize({
        elementSelection,
        size,
      });
    }
    
    // Fallback to DOM manipulation
    const targetElement = document.querySelector(
      `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
    ) as HTMLElement;
    
    if (targetElement) {
      targetElement.style.fontSize = size;
      markAsCustomized(elementSelection.sectionId);
      return true;
    }
    return false;
  }, [hasActiveEditor, handleInlineFontSize, markAsCustomized]);

  const handleChangeTextAlign = useCallback(async (params: { 
    elementSelection: ElementSelection; 
    align: string 
  }) => {
    const { elementSelection, align } = params;
    
    // If inline editor is active, use the enhanced handler
    if (hasActiveEditor()) {
      return await handleInlineTextAlign({
        elementSelection,
        align: align as any,
      });
    }
    
    // Fallback to DOM manipulation
    const targetElement = document.querySelector(
      `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
    ) as HTMLElement;
    
    if (targetElement) {
      targetElement.style.textAlign = align;
      markAsCustomized(elementSelection.sectionId);
      return true;
    }
    return false;
  }, [hasActiveEditor, handleInlineTextAlign, markAsCustomized]);

  const handleChangeFontFamily = useCallback(async (params: { 
    elementSelection: ElementSelection 
  }) => {
    const { elementSelection } = params;
    
    const fonts = [
      'Inter, sans-serif',
      'Georgia, serif',
      'Times New Roman, serif',
      'Arial, sans-serif',
      'Helvetica, sans-serif',
      'Courier New, monospace',
      'system-ui, sans-serif',
    ];
    
    const selected = prompt(`Select font family:\n${fonts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`);
    const index = parseInt(selected || '0') - 1;
    
    if (index >= 0 && index < fonts.length) {
      // If inline editor is active, use the enhanced handler
      if (hasActiveEditor()) {
        return await handleInlineFontFamily({
          elementSelection,
          fontFamily: fonts[index],
        });
      }
      
      // Fallback to DOM manipulation
      const targetElement = document.querySelector(
        `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
      ) as HTMLElement;
      
      if (targetElement) {
        targetElement.style.fontFamily = fonts[index];
        markAsCustomized(elementSelection.sectionId);
        return true;
      }
    }
    return false;
  }, [hasActiveEditor, handleInlineFontFamily, markAsCustomized]);

  const handleChangeLineHeight = useCallback(async (params: { 
    elementSelection: ElementSelection 
  }) => {
    const { elementSelection } = params;
    
    const lineHeights = ['1.2', '1.4', '1.5', '1.6', '1.8', '2.0'];
    const selected = prompt(`Select line height:\n${lineHeights.map((l, i) => `${i + 1}. ${l}`).join('\n')}`);
    const index = parseInt(selected || '0') - 1;
    
    if (index >= 0 && index < lineHeights.length) {
      // If inline editor is active, use the enhanced handler
      if (hasActiveEditor()) {
        return await handleInlineLineHeight({
          elementSelection,
          lineHeight: lineHeights[index],
        });
      }
      
      // Fallback to DOM manipulation
      const targetElement = document.querySelector(
        `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
      ) as HTMLElement;
      
      if (targetElement) {
        targetElement.style.lineHeight = lineHeights[index];
        markAsCustomized(elementSelection.sectionId);
        return true;
      }
    }
    return false;
  }, [hasActiveEditor, handleInlineLineHeight, markAsCustomized]);

  const handleChangeLetterSpacing = useCallback(async (params: { 
    elementSelection: ElementSelection 
  }) => {
    const { elementSelection } = params;
    
    const spacings = ['normal', '0.025em', '0.05em', '0.1em', '0.15em', '0.2em'];
    const selected = prompt(`Select letter spacing:\n${spacings.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
    const index = parseInt(selected || '0') - 1;
    
    if (index >= 0 && index < spacings.length) {
      // If inline editor is active, use the enhanced handler
      if (hasActiveEditor()) {
        return await handleInlineLetterSpacing({
          elementSelection,
          letterSpacing: spacings[index],
        });
      }
      
      // Fallback to DOM manipulation
      const targetElement = document.querySelector(
        `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
      ) as HTMLElement;
      
      if (targetElement) {
        targetElement.style.letterSpacing = spacings[index];
        markAsCustomized(elementSelection.sectionId);
        return true;
      }
    }
    return false;
  }, [hasActiveEditor, handleInlineLetterSpacing, markAsCustomized]);

  const handleChangeTextTransform = useCallback(async (params: { 
    elementSelection: ElementSelection 
  }) => {
    const { elementSelection } = params;
    
    const transforms = ['none', 'uppercase', 'lowercase', 'capitalize'];
    const selected = prompt(`Select text transform:\n${transforms.map((t, i) => `${i + 1}. ${t}`).join('\n')}`);
    const index = parseInt(selected || '0') - 1;
    
    if (index >= 0 && index < transforms.length) {
      // If inline editor is active, use the enhanced handler
      if (hasActiveEditor()) {
        return await handleInlineTextTransform({
          elementSelection,
          transform: transforms[index] as any,
        });
      }
      
      // Fallback to DOM manipulation
      const targetElement = document.querySelector(
        `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
      ) as HTMLElement;
      
      if (targetElement) {
        targetElement.style.textTransform = transforms[index];
        markAsCustomized(elementSelection.sectionId);
        return true;
      }
    }
    return false;
  }, [hasActiveEditor, handleInlineTextTransform, markAsCustomized]);

  const handleClearFormatting = useCallback(async (params: { 
    elementSelection: ElementSelection 
  }) => {
    const { elementSelection } = params;
    
    // If inline editor is active, use the enhanced handler
    if (hasActiveEditor()) {
      return await handleInlineClearFormatting({
        elementSelection,
      });
    }
    
    // Fallback to DOM manipulation
    const targetElement = document.querySelector(
      `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
    ) as HTMLElement;
    
    if (targetElement) {
      targetElement.style.cssText = '';
      markAsCustomized(elementSelection.sectionId);
      return true;
    }
    return false;
  }, [hasActiveEditor, handleInlineClearFormatting, markAsCustomized]);

  const handleTextRegenerate = useCallback(async (params: { 
    elementSelection: ElementSelection 
  }) => {
    const { elementSelection } = params;
    
    try {
      await regenerateElement(elementSelection.sectionId, elementSelection.elementKey);
      return true;
    } catch (error) {
      console.error('Text regeneration failed:', error);
      return false;
    }
  }, [regenerateElement]);


  // ===== ELEMENT ACTION HANDLERS =====
  
  const handleDuplicateElement = useCallback(async (params: { elementSelection: ElementSelection }) => {
    const { elementSelection } = params;
    
    const currentSection = content[elementSelection.sectionId];
    if (currentSection && currentSection.elements[elementSelection.elementKey]) {
      const originalElement = currentSection.elements[elementSelection.elementKey];
      const newElementKey = `${elementSelection.elementKey}-copy-${Date.now()}`;
      
      const updatedElements = {
        ...currentSection.elements,
        [newElementKey]: {
          ...originalElement,
          content: Array.isArray(originalElement.content) 
            ? [...originalElement.content] 
            : originalElement.content
        }
      };
      
      setSection(elementSelection.sectionId, { elements: updatedElements });
      return true;
    }
    return false;
  }, [content, setSection]);

  const handleDeleteElement = useCallback(async (params: { elementSelection: ElementSelection }) => {
    const { elementSelection } = params;
    
    if (confirm('Are you sure you want to delete this element?')) {
      const currentSection = content[elementSelection.sectionId];
      if (currentSection && currentSection.elements[elementSelection.elementKey]) {
        const { [elementSelection.elementKey]: removed, ...remainingElements } = currentSection.elements;
        
        setSection(elementSelection.sectionId, { elements: remainingElements });
        return true;
      }
    }
    return false;
  }, [content, setSection]);

  const handleElementStyle = useCallback(async (params: { elementSelection: ElementSelection }) => {
    console.log('Opening element styling options for:', params.elementSelection);
    return true;
  }, []);

  const handleChangeElementType = useCallback(async (params: { elementSelection: ElementSelection }) => {
    const { elementSelection } = params;
    
    const types = [
      { id: 'text', name: 'Text Block' },
      { id: 'headline', name: 'Headline' },
      { id: 'subheadline', name: 'Subheadline' },
      { id: 'button', name: 'Button' },
      { id: 'richtext', name: 'Rich Text' },
      { id: 'list', name: 'List' },
    ];
    
    const selected = prompt(`Change element type:\n${types.map((t, i) => `${i + 1}. ${t.name}`).join('\n')}`);
    const index = parseInt(selected || '0') - 1;
    
    if (index >= 0 && index < types.length) {
      const currentSection = content[elementSelection.sectionId];
      if (currentSection && currentSection.elements[elementSelection.elementKey]) {
        const updatedElement = {
          ...currentSection.elements[elementSelection.elementKey],
          type: types[index].id as ElementType,
        };
        
        const updatedElements = {
          ...currentSection.elements,
          [elementSelection.elementKey]: updatedElement
        };
        
        setSection(elementSelection.sectionId, { elements: updatedElements });
        return true;
      }
    }
    return false;
  }, [content, setSection]);

  const handleConvertCTAToForm = useCallback(async (params: { sectionId: string; elementKey: string }) => {
    const { sectionId, elementKey } = params;
    
    if (elementKey.includes('cta') || elementKey.includes('button')) {
      const formElement = {
        content: 'Contact Form',
        type: 'form' as const,
        isEditable: true,
        editMode: 'modal' as const,
      };
      
      const currentSection = content[sectionId];
      if (currentSection) {
        const updatedElements = {
          ...currentSection.elements,
          [elementKey]: formElement
        };
        
        setSection(sectionId, { elements: updatedElements });
        return true;
      }
    }
    return false;
  }, [content, setSection]);

  const handleLinkSettings = useCallback(async (params: { elementSelection: ElementSelection }) => {
    const { elementSelection } = params;
    
    const currentHref = prompt('Enter link URL:');
    const target = confirm('Open in new tab?') ? '_blank' : '_self';
    
    if (currentHref) {
      const targetElement = document.querySelector(
        `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
      ) as HTMLElement;
      
      if (targetElement) {
        if (targetElement.tagName.toLowerCase() === 'a') {
          (targetElement as HTMLAnchorElement).href = currentHref;
          (targetElement as HTMLAnchorElement).target = target;
        } else {
          const wrapper = document.createElement('a');
          wrapper.href = currentHref;
          wrapper.target = target;
          targetElement.parentNode?.insertBefore(wrapper, targetElement);
          wrapper.appendChild(targetElement);
        }
        
        markAsCustomized(elementSelection.sectionId);
        return true;
      }
    }
    return false;
  }, [markAsCustomized]);

  const handleElementRegenerate = useCallback(async (params: { elementSelection: ElementSelection }) => {
    const { elementSelection } = params;
    
    try {
      await regenerateElement(elementSelection.sectionId, elementSelection.elementKey);
      return true;
    } catch (error) {
      console.error('Element regeneration failed:', error);
      return false;
    }
  }, [regenerateElement]);


  // ===== IMAGE ACTION HANDLERS =====
  
  const handleReplaceImage = useCallback(async (params: { imageId: string }) => {
    const { imageId } = params;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    return new Promise<boolean>((resolve) => {
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            alert('Image file must be smaller than 5MB');
            resolve(false);
            return;
          }
          
          const previewUrl = URL.createObjectURL(file);
          updateImageAsset(imageId, {
            id: imageId,
            url: previewUrl,
            alt: file.name,
            metadata: {
              width: 0,
              height: 0,
              size: file.size,
              format: file.type.split('/')[1] as any,
              uploadedAt: Date.now(),
            },
          });
          
          resolve(true);
        } else {
          resolve(false);
        }
      };
      
      input.click();
    });
  }, [updateImageAsset]);

  const handleStockPhotos = useCallback(async (params: { imageId: string }) => {
    console.log('Opening stock photo search for:', params.imageId);
    return true;
  }, []);

  const handleEditImage = useCallback(async (params: { imageId: string }) => {
    console.log('Opening image editor for:', params.imageId);
    return true;
  }, []);

  const handleUpdateAltText = useCallback(async (params: { imageId: string; altText?: string }) => {
    const { imageId, altText } = params;
    
    const newAltText = altText || prompt('Enter alt text for image:');
    if (newAltText) {
      const targetElement = document.querySelector(`[data-image-id="${imageId}"]`) as HTMLImageElement;
      if (targetElement) {
        targetElement.alt = newAltText;
        
        const currentAsset = images?.assets?.[imageId];
        if (currentAsset) {
          updateImageAsset(imageId, { ...currentAsset, alt: newAltText });
        }
        
        return true;
      }
    }
    return false;
  }, [images?.assets, updateImageAsset]);

  const handleImageFilters = useCallback(async (params: { imageId: string }) => {
    const { imageId } = params;
    
    const filters = [
      { id: 'none', name: 'None' },
      { id: 'grayscale', name: 'Grayscale' },
      { id: 'sepia', name: 'Sepia' },
      { id: 'blur', name: 'Blur' },
      { id: 'brightness', name: 'Brightness' },
      { id: 'contrast', name: 'Contrast' },
      { id: 'saturate', name: 'Saturate' },
    ];
    
    const selected = prompt(`Select filter:\n${filters.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}`);
    const index = parseInt(selected || '0') - 1;
    
    if (index >= 0 && index < filters.length) {
      const targetElement = document.querySelector(`[data-image-id="${imageId}"]`) as HTMLImageElement;
      if (targetElement) {
        const filterValue = filters[index].id === 'none' ? 'none' : `${filters[index].id}(1)`;
        targetElement.style.filter = filterValue;
        return true;
      }
    }
    return false;
  }, []);

  const handleOptimizeImage = useCallback(async (params: { imageId: string }) => {
    const { imageId } = params;
    
    const targetElement = document.querySelector(`[data-image-id="${imageId}"]`) as HTMLImageElement;
    if (targetElement) {
      const currentAsset = images.assets?.[imageId];
      if (currentAsset) {
        updateImageAsset(imageId, { ...currentAsset });
      }
      return true;
    }
    return false;
  }, [images?.assets, updateImageAsset]);

  const handleDeleteImage = useCallback(async (params: { imageId: string }) => {
    const { imageId } = params;
    
    if (confirm('Are you sure you want to delete this image?')) {
      const targetElement = document.querySelector(`[data-image-id="${imageId}"]`) as HTMLImageElement;
      if (targetElement) {
        targetElement.remove();
        return true;
      }
    }
    return false;
  }, []);

  // ===== FORM ACTION HANDLERS =====
  
  const handleAddFormField = useCallback(async (params: { formId: string; fieldType?: string }) => {
    const { formId, fieldType } = params;
    
    const fieldTypes = fieldType ? [fieldType] : [
      'text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date', 'url'
    ];
    
    let selectedType = fieldType;
    if (!selectedType) {
      const fieldLabels = {
        'text': 'Text Input',
        'email': 'Email Address',
        'tel': 'Phone Number',
        'textarea': 'Message',
        'select': 'Select Option',
        'checkbox': 'Checkbox',
        'radio': 'Radio Button',
        'file': 'File Upload',
        'date': 'Date',
        'url': 'Website URL',
      };
      
      const selected = prompt(`Select field type:\n${fieldTypes.map((t, i) => `${i + 1}. ${fieldLabels[t as keyof typeof fieldLabels]}`).join('\n')}`);
      const index = parseInt(selected || '0') - 1;
      
      if (index >= 0 && index < fieldTypes.length) {
        selectedType = fieldTypes[index];
      } else {
        return false;
      }
    }
    
    const fieldId = `field-${Date.now()}`;
    const fieldLabels = {
      'text': 'Text Input',
      'email': 'Email Address',
      'tel': 'Phone Number',
      'textarea': 'Message',
      'select': 'Select Option',
      'checkbox': 'Checkbox',
      'radio': 'Radio Button',
      'file': 'File Upload',
      'date': 'Date',
      'url': 'Website URL',
    };
    
    const field = {
      id: fieldId,
      type: selectedType as any,
      label: fieldLabels[selectedType as keyof typeof fieldLabels] || 'Form Field',
      placeholder: `Enter ${fieldLabels[selectedType as keyof typeof fieldLabels]?.toLowerCase() || 'value'}...`,
      required: false,
      validation: {},
      options: selectedType === 'select' ? ['Option 1', 'Option 2'] : undefined,
    };
    
    addFormField(formId, field);
    return true;
  }, [addFormField]);

  const handleRemoveFormField = useCallback(async (params: { formId: string; fieldId: string }) => {
    const { formId, fieldId } = params;
    
    if (confirm('Are you sure you want to remove this field?')) {
      removeFormField(formId, fieldId);
      return true;
    }
    return false;
  }, [removeFormField]);

  const handleToggleFieldRequired = useCallback(async (params: { formId: string; fieldId: string }) => {
    const { formId, fieldId } = params;
    
    toggleFormFieldRequired(formId, fieldId);
    return true;
  }, [toggleFormFieldRequired]);

  const handleFormSettings = useCallback(async (params: { formId: string }) => {
    console.log('Opening form settings for:', params.formId);
    return true;
  }, []);

  const handleFormIntegrations = useCallback(async (params: { formId: string }) => {
    const { formId } = params;
    
    const integrations = [
      { id: 'hubspot', name: 'HubSpot' },
      { id: 'mailchimp', name: 'Mailchimp' },
      { id: 'zapier', name: 'Zapier' },
      { id: 'webhook', name: 'Custom Webhook' },
      { id: 'email', name: 'Email Notifications' },
      { id: 'slack', name: 'Slack' },
    ];
    
    const selected = prompt(`Select integration:\n${integrations.map((i, idx) => `${idx + 1}. ${i.name}`).join('\n')}`);
    const index = parseInt(selected || '0') - 1;
    
    if (index >= 0 && index < integrations.length) {
      console.log(`Setting up ${integrations[index].name} integration for form:`, formId);
      return true;
    }
    return false;
  }, []);

  const handleFormStyling = useCallback(async (params: { formId: string }) => {
    const { formId } = params;
    
    const styleOptions = [
      { id: 'theme', name: 'Theme Selection' },
      { id: 'colors', name: 'Color Customization' },
      { id: 'spacing', name: 'Spacing & Layout' },
      { id: 'typography', name: 'Typography' },
      { id: 'buttons', name: 'Button Styling' },
      { id: 'fields', name: 'Field Styling' },
    ];
    
    const selected = prompt(`Select styling option:\n${styleOptions.map((s, i) => `${i + 1}. ${s.name}`).join('\n')}`);
    const index = parseInt(selected || '0') - 1;
    
    if (index >= 0 && index < styleOptions.length) {
      console.log(`Opening ${styleOptions[index].name} for form:`, formId);
      return true;
    }
    return false;
  }, []);

  // ===== UTILITY FUNCTIONS =====
  
  const getDefaultContent = useCallback((elementType: string) => {
    const defaults = {
      text: 'Your text content here',
      headline: 'Your Headline',
      subheadline: 'Your subheadline text',
      button: 'Click Here',
      image: '',
      video: '',
      form: 'Contact Form',
      list: ['Item 1', 'Item 2', 'Item 3'],
    };
    
    return defaults[elementType as keyof typeof defaults] || 'Content';
  }, []);

  const getAvailableActions = useCallback(() => {
    if (!currentContext) return [];
    
    return (currentContext as any).capabilities?.filter((capability: any) => 
      capability.enabled && hasCapability(capability.id)
    ) || [];
  }, [currentContext, hasCapability]);

  const isActionAvailable = useCallback((actionId: string) => {
    return hasCapability(actionId);
  }, [hasCapability]);

  const getActionById = useCallback((actionId: string) => {
    if (!currentContext) return null;
    
    return (currentContext as any).capabilities?.find((capability: any) => 
      capability.id === actionId
    ) || null;
  }, [currentContext]);

  const getActionStatus = useCallback((actionId: string) => {
    const action = getActionById(actionId);
    if (!action) {
      return {
        available: false,
        enabled: false,
        reason: 'Action not found',
      };
    }
    
    return {
      available: true,
      enabled: action.enabled && hasCapability(actionId),
      reason: action.enabled ? (hasCapability(actionId) ? 'Ready' : 'Not available in current context') : 'Action disabled',
      action,
    };
  }, [getActionById, hasCapability]);

  const executeActions = useCallback(async (actions: { actionId: string; params?: any }[]) => {
    const results = [];
    
    for (const { actionId, params } of actions) {
      try {
        const success = await executeAction(actionId, params);
        results.push({ actionId, success });
      } catch (error) {
        results.push({ 
          actionId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return results;
  }, [executeAction]);

  const getActionsByCategory = useCallback(() => {
    const actions = getAvailableActions();
    
    const categories = {
      content: actions.filter((a: any) => ['regenerate', 'clear-formatting'].some(term => a.id?.includes(term))),
      layout: actions.filter((a: any) => ['change-layout', 'add-element', 'move-section'].some(term => a.id?.includes(term))),
      style: actions.filter((a: any) => ['element-style', 'background-settings', 'form-styling'].some(term => a.id?.includes(term))),
      interaction: actions.filter((a: any) => ['link-settings', 'animation-settings', 'form-logic'].some(term => a.id?.includes(term))),
      management: actions.filter((a: any) => ['duplicate', 'delete', 'export', 'analytics'].some(term => a.id?.includes(term))),
    };
    
    return categories;
  }, [getAvailableActions]);

  const getToolbarContext = useCallback(() => {
    if (!currentContext) return null;
    
    return {
      toolbarType: (currentContext as any).toolbarType,
      elementType: (currentContext as any).elementType,
      priority: (currentContext as any).priority,
      capabilities: (currentContext as any).capabilities,
      availableActions: getAvailableActions(),
    };
  }, [currentContext, getAvailableActions]);

  const executeActionWithTracking = useCallback(async (actionId: string, params?: any) => {
    const startTime = performance.now();
    
    try {
      const success = await executeAction(actionId, params);
      const duration = performance.now() - startTime;
      
      return { success, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return { 
        success: false, 
        duration, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, [executeAction]);

  // ===== ENHANCED INLINE EDITOR UTILITIES =====
  
  const getInlineEditorState = useCallback(() => {
    return {
      hasActiveEditor: hasActiveEditor(),
      formatState: getCurrentFormatState(),
      isFormatActive: isFormatActiveState,
    };
  }, [hasActiveEditor, getCurrentFormatState, isFormatActiveState]);

  const applyFormatPreset = useCallback(async (params: {
    elementSelection: ElementSelection;
    presetName: string;
  }) => {
    const { elementSelection, presetName } = params;
    
    const presets = {
      'heading-1': {
        fontSize: '2rem',
        bold: true,
        lineHeight: '1.2',
      },
      'heading-2': {
        fontSize: '1.5rem',
        bold: true,
        lineHeight: '1.3',
      },
      'body-text': {
        fontSize: '1rem',
        bold: false,
        lineHeight: '1.6',
      },
      'caption': {
        fontSize: '0.875rem',
        color: '#6B7280',
        lineHeight: '1.4',
      },
    };
    
    const preset = presets[presetName as keyof typeof presets];
    if (!preset) return false;
    
    if (hasActiveEditor()) {
      return await handleApplyBatchFormat({
        elementSelection,
        formats: preset as any,
      });
    }
    
    return false;
  }, [hasActiveEditor, handleApplyBatchFormat]);

  // ===== RETURN INTERFACE =====
  
  return {
    // Core action execution
    executeAction,
    executeActions,
    executeActionWithTracking,
    
    // Action queries
    getAvailableActions,
    isActionAvailable,
    getActionById,
    getActionStatus,
    getActionsByCategory,
    
    // Context information
    currentContext,
    getToolbarContext,
    
    // Section action handlers
    handleChangeLayout,
    handleAddElement,
    handleMoveSection,
    handleBackgroundSettings,
    handleRegenerateSection,
    handleDuplicateSection,
    handleDeleteSection,
    
    // Enhanced text action handlers (with inline editor support)
    handleApplyTextFormat,
    handleChangeTextColor,
    handleChangeFontSize,
    handleChangeTextAlign,
    handleChangeFontFamily,
    handleChangeLineHeight,
    handleChangeLetterSpacing,
    handleChangeTextTransform,
    handleClearFormatting,
    handleTextRegenerate,
    
    // Element action handlers
    handleDuplicateElement,
    handleDeleteElement,
    handleElementStyle,
    handleChangeElementType,
    handleConvertCTAToForm,
    handleLinkSettings,
    handleElementRegenerate,
    
    // Image action handlers
    handleReplaceImage,
    handleStockPhotos,
    handleEditImage,
    handleUpdateAltText,
    handleImageFilters,
    handleOptimizeImage,
    handleDeleteImage,
    
    // Form action handlers
    handleAddFormField,
    handleRemoveFormField,
    handleToggleFieldRequired,
    handleFormSettings,
    handleFormIntegrations,
    handleFormStyling,
    
    // Inline editor integration
    getInlineEditorState,
    applyFormatPreset,
    handleApplyBatchFormat,
    
    // Utility functions
    getDefaultContent,
  };
}