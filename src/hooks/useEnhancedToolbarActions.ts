// hooks/useEnhancedToolbarActions.ts - Enhanced toolbar actions with universal element support

import { useCallback } from 'react';
import { useEditStore } from './useEditStore';
import { useUniversalElements } from './useUniversalElements';
import { useToolbarActions as useBaseToolbarActions } from './useToolbarActions';
import type { UniversalElementType } from '@/types/universalElements';
import type { ElementSelection } from '@/types/core/ui';

export function useEnhancedToolbarActions() {
  const baseActions = useBaseToolbarActions();
  
  const {
    // Universal element actions
    addElement,
    removeElement,
    duplicateElement,
    moveElementUp,
    moveElementDown,
    convertElementType,
    elementConfigs,
    elementConfigsByCategory,
  } = useUniversalElements();

  const {
    // Store actions
    setSelectedElement,
    showElementVariations,
    hideElementVariations,
    announceLiveRegion,
    
    // UI state
    selectedElement,
    elementVariations,
  } = useEditStore();

  // Enhanced add element action with element picker
  const handleAddElementWithPicker = useCallback(async (params: { 
    sectionId: string; 
    elementType?: UniversalElementType;
    position?: number;
    showPicker?: boolean;
  }) => {
    const { sectionId, elementType, position, showPicker = true } = params;

    if (elementType) {
      // Direct element addition
      const elementKey = addElement(sectionId, elementType, { position });
      
      if (elementKey) {
        // Select the new element
        const newSelection: ElementSelection = {
          sectionId,
          elementKey,
          type: elementType,
          editMode: elementConfigs[elementType].toolbarType === 'text' ? 'inline' : 'toolbar',
        };
        
        setSelectedElement(newSelection);
        announceLiveRegion(`Added ${elementConfigs[elementType].label} element`);
        
        // Auto-focus if it's a text element
        if (elementConfigs[elementType].toolbarType === 'text') {
          setTimeout(() => {
            const element = document.querySelector(
              `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"]`
            ) as HTMLElement;
            if (element) {
              element.focus();
            }
          }, 100);
        }
        
        return true;
      }
    } else if (showPicker) {
      // Show element picker
      // This would trigger the ElementPicker component to show
      // Implementation depends on your UI state management
      console.log('Show element picker for section:', sectionId);
      return true;
    }

    return false;
  }, [addElement, elementConfigs, setSelectedElement, announceLiveRegion]);

  // Enhanced duplicate element action
  const handleDuplicateElementEnhanced = useCallback(async (params: { 
    elementSelection: ElementSelection;
    targetPosition?: number;
  }) => {
    const { elementSelection, targetPosition } = params;
    
    const newElementKey = duplicateElement(
      elementSelection.sectionId,
      elementSelection.elementKey,
      { targetPosition }
    );
    
    if (newElementKey) {
      // Select the duplicated element
      const newSelection: ElementSelection = {
        sectionId: elementSelection.sectionId,
        elementKey: newElementKey,
        type: elementSelection.type,
        editMode: elementSelection.editMode,
      };
      
      setSelectedElement(newSelection);
      announceLiveRegion(`Duplicated ${elementConfigs[elementSelection.type].label} element`);
      
      return true;
    }
    
    return false;
  }, [duplicateElement, elementConfigs, setSelectedElement, announceLiveRegion]);

  // Enhanced delete element action
  const handleDeleteElementEnhanced = useCallback(async (params: { 
    elementSelection: ElementSelection;
    confirmRequired?: boolean;
  }) => {
    const { elementSelection, confirmRequired = true } = params;
    
    const success = await removeElement(
      elementSelection.sectionId,
      elementSelection.elementKey,
      { confirmRequired }
    );
    
    if (success) {
      // Clear selection
      setSelectedElement(null);
      announceLiveRegion(`Deleted ${elementConfigs[elementSelection.type].label} element`);
      return true;
    }
    
    return false;
  }, [removeElement, elementConfigs, setSelectedElement, announceLiveRegion]);

  // Enhanced move element actions
  const handleMoveElementUpEnhanced = useCallback(async (params: { 
    elementSelection: ElementSelection;
  }) => {
    const { elementSelection } = params;
    
    const success = moveElementUp(elementSelection.sectionId, elementSelection.elementKey);
    
    if (success) {
      announceLiveRegion(`Moved ${elementConfigs[elementSelection.type].label} element up`);
      return true;
    } else {
      announceLiveRegion(`Cannot move element up - already at top`);
      return false;
    }
  }, [moveElementUp, elementConfigs, announceLiveRegion]);

  const handleMoveElementDownEnhanced = useCallback(async (params: { 
    elementSelection: ElementSelection;
  }) => {
    const { elementSelection } = params;
    
    const success = moveElementDown(elementSelection.sectionId, elementSelection.elementKey);
    
    if (success) {
      announceLiveRegion(`Moved ${elementConfigs[elementSelection.type].label} element down`);
      return true;
    } else {
      announceLiveRegion(`Cannot move element down - already at bottom`);
      return false;
    }
  }, [moveElementDown, elementConfigs, announceLiveRegion]);

  // Enhanced convert element type action
  const handleConvertElementTypeEnhanced = useCallback(async (params: { 
    elementSelection: ElementSelection;
    newType?: UniversalElementType;
  }) => {
    const { elementSelection, newType } = params;
    
    let targetType = newType;
    
    if (!targetType) {
      // Show conversion options based on current type
      const currentType = elementSelection.type as UniversalElementType;
      const currentConfig = elementConfigs[currentType];
      
      // Get compatible types for conversion
      const compatibleTypes = getCompatibleElementTypes(currentType);
      
      if (compatibleTypes.length === 0) {
        announceLiveRegion(`Cannot convert ${currentConfig.label} to other types`);
        return false;
      }
      
      // For demo purposes, convert to the first compatible type
      // In a real implementation, you'd show a selection UI
      targetType = compatibleTypes[0];
    }
    
    const success = convertElementType(
      elementSelection.sectionId,
      elementSelection.elementKey,
      targetType
    );
    
    if (success) {
      // Update selection with new type
      const newSelection: ElementSelection = {
        ...elementSelection,
        type: targetType,
        editMode: elementConfigs[targetType].toolbarType === 'text' ? 'inline' : 'toolbar',
      };
      
      setSelectedElement(newSelection);
      announceLiveRegion(`Converted to ${elementConfigs[targetType].label}`);
      return true;
    }
    
    return false;
  }, [convertElementType, elementConfigs, setSelectedElement, announceLiveRegion]);

  // Get compatible element types for conversion
  const getCompatibleElementTypes = useCallback((currentType: UniversalElementType): UniversalElementType[] => {
    const currentConfig = elementConfigs[currentType];
    const compatible: UniversalElementType[] = [];
    
    // Define conversion rules
    const conversionRules: Record<UniversalElementType, UniversalElementType[]> = {
      'text': ['headline', 'list'],
      'headline': ['text'],
      'list': ['text'],
      'button': ['link'],
      'link': ['button', 'text'],
      'image': ['icon'],
      'icon': ['image'],
      'spacer': ['container'],
      'container': ['spacer'],
    };
    
    return conversionRules[currentType] || [];
  }, [elementConfigs]);

  // Enhanced element variations action
  const handleElementVariationsEnhanced = useCallback(async (params: { 
    elementSelection: ElementSelection;
    variationCount?: number;
  }) => {
    const { elementSelection, variationCount = 5 } = params;
    
    try {
      // Generate variations (this would typically call an AI service)
      const variations = await generateElementVariations(elementSelection, variationCount);
      
      showElementVariations(`${elementSelection.sectionId}.${elementSelection.elementKey}`, variations);
      announceLiveRegion(`Generated ${variations.length} variations`);
      
      return true;
    } catch (error) {
      console.error('Failed to generate variations:', error);
      announceLiveRegion('Failed to generate variations');
      return false;
    }
  }, [showElementVariations, announceLiveRegion]);

  // Mock variation generator (replace with actual AI service)
  const generateElementVariations = useCallback(async (
    elementSelection: ElementSelection,
    count: number
  ): Promise<string[]> => {
    const config = elementConfigs[elementSelection.type as UniversalElementType];
    
    // Mock variations based on element type
    const variationTemplates: Record<UniversalElementType, string[]> = {
      'text': [
        'Enhanced version with more details',
        'Concise and to-the-point version',
        'Professional tone variation',
        'Casual and friendly tone',
        'Technical and precise version'
      ],
      'headline': [
        'Bold and Attention-Grabbing Version',
        'Question-Based Headline',
        'Benefit-Focused Headline',
        'Curiosity-Driven Version',
        'Direct and Clear Statement'
      ],
      'button': [
        'Get Started Now',
        'Learn More',
        'Try It Free',
        'Sign Up Today',
        'Discover More'
      ],
      'list': [
        ['First enhanced point', 'Second enhanced point', 'Third enhanced point'],
        ['Benefit one', 'Benefit two', 'Benefit three'],
        ['Step 1: Start here', 'Step 2: Continue', 'Step 3: Complete'],
        ['Feature A', 'Feature B', 'Feature C'],
        ['Point one explained', 'Point two detailed', 'Point three clarified']
      ],
      'link': [
        'Read the full article',
        'View detailed information',
        'Explore our resources',
        'Check out the guide',
        'Access premium content'
      ],
      'headline': [], // Will use text variations
      'image': [], // Images would need different handling
      'icon': [], // Icons would need different handling
      'spacer': [], // Spacers don't have content variations
      'container': [], // Containers don't have content variations
    };
    
    const templates = variationTemplates[elementSelection.type as UniversalElementType] || 
                     variationTemplates.text;
    
    return templates.slice(0, count);
  }, [elementConfigs]);

  // Enhanced element style action
  const handleElementStyleEnhanced = useCallback(async (params: { 
    elementSelection: ElementSelection;
    styleType?: 'color' | 'size' | 'alignment' | 'spacing';
  }) => {
    const { elementSelection, styleType } = params;
    
    // This would open a style panel or modal
    // For now, we'll just announce the action
    const config = elementConfigs[elementSelection.type as UniversalElementType];
    
    if (styleType) {
      announceLiveRegion(`Opening ${styleType} settings for ${config.label}`);
    } else {
      announceLiveRegion(`Opening style settings for ${config.label}`);
    }
    
    // In a real implementation, this would trigger UI to show style options
    console.log('Open style settings for:', elementSelection, 'styleType:', styleType);
    
    return true;
  }, [elementConfigs, announceLiveRegion]);

  // Get element actions based on selection
  const getElementActions = useCallback((elementSelection: ElementSelection) => {
    const elementType = elementSelection.type as UniversalElementType;
    const config = elementConfigs[elementType];
    
    if (!config) return [];
    
    const baseActions = [
      {
        id: 'duplicate-element',
        label: 'Duplicate',
        icon: 'copy',
        handler: () => handleDuplicateElementEnhanced({ elementSelection }),
      },
      {
        id: 'move-up',
        label: 'Move Up',
        icon: 'arrow-up',
        handler: () => handleMoveElementUpEnhanced({ elementSelection }),
      },
      {
        id: 'move-down',
        label: 'Move Down', 
        icon: 'arrow-down',
        handler: () => handleMoveElementDownEnhanced({ elementSelection }),
      },
      {
        id: 'element-style',
        label: 'Style',
        icon: 'palette',
        handler: () => handleElementStyleEnhanced({ elementSelection }),
      },
      {
        id: 'delete-element',
        label: 'Delete',
        icon: 'trash',
        handler: () => handleDeleteElementEnhanced({ elementSelection }),
      },
    ];
    
    // Add type-specific actions
    const typeSpecificActions = [];
    
    if (config.toolbarType === 'text') {
      typeSpecificActions.push({
        id: 'text-variations',
        label: 'Variations',
        icon: 'variations',
        handler: () => handleElementVariationsEnhanced({ elementSelection }),
      });
    }
    
    // Add conversion options if available
    const compatibleTypes = getCompatibleElementTypes(elementType);
    if (compatibleTypes.length > 0) {
      typeSpecificActions.push({
        id: 'convert-element',
        label: 'Convert',
        icon: 'transform',
        handler: () => handleConvertElementTypeEnhanced({ elementSelection }),
      });
    }
    
    return [...typeSpecificActions, ...baseActions];
  }, [
    elementConfigs,
    handleDuplicateElementEnhanced,
    handleMoveElementUpEnhanced,
    handleMoveElementDownEnhanced,
    handleElementStyleEnhanced,
    handleDeleteElementEnhanced,
    handleElementVariationsEnhanced,
    handleConvertElementTypeEnhanced,
    getCompatibleElementTypes,
  ]);

  // Get section actions with enhanced element support
  const getSectionActions = useCallback((sectionId: string) => {
    return [
      {
        id: 'add-element',
        label: 'Add Element',
        icon: 'plus',
        handler: () => handleAddElementWithPicker({ sectionId }),
      },
      {
        id: 'add-text',
        label: 'Add Text',
        icon: 'type',
        handler: () => handleAddElementWithPicker({ sectionId, elementType: 'text', showPicker: false }),
      },
      {
        id: 'add-button',
        label: 'Add Button',
        icon: 'mouse-pointer',
        handler: () => handleAddElementWithPicker({ sectionId, elementType: 'button', showPicker: false }),
      },
      {
        id: 'add-image',
        label: 'Add Image',
        icon: 'image',
        handler: () => handleAddElementWithPicker({ sectionId, elementType: 'image', showPicker: false }),
      },
      ...baseActions.getSectionActions?.(sectionId) || [],
    ];
  }, [handleAddElementWithPicker, baseActions]);

  // Enhanced execute action that handles universal elements
  const executeEnhancedAction = useCallback(async (actionId: string, params?: any) => {
    // Try enhanced actions first
    switch (actionId) {
      case 'add-element':
        return await handleAddElementWithPicker(params);
      case 'duplicate-element':
        return await handleDuplicateElementEnhanced(params);
      case 'delete-element':
        return await handleDeleteElementEnhanced(params);
      case 'move-element-up':
        return await handleMoveElementUpEnhanced(params);
      case 'move-element-down':
        return await handleMoveElementDownEnhanced(params);
      case 'convert-element-type':
        return await handleConvertElementTypeEnhanced(params);
      case 'element-variations':
        return await handleElementVariationsEnhanced(params);
      case 'element-style':
        return await handleElementStyleEnhanced(params);
      default:
        // Fallback to base actions
        return await baseActions.executeAction(actionId, params);
    }
  }, [
    handleAddElementWithPicker,
    handleDuplicateElementEnhanced,
    handleDeleteElementEnhanced,
    handleMoveElementUpEnhanced,
    handleMoveElementDownEnhanced,
    handleConvertElementTypeEnhanced,
    handleElementVariationsEnhanced,
    handleElementStyleEnhanced,
    baseActions,
  ]);

  // Get available element types for a section
  const getAvailableElementTypes = useCallback((sectionId: string) => {
    // This could be enhanced to filter based on section type or layout
    return Object.values(elementConfigs);
  }, [elementConfigs]);

  // Get element categories for organization
  const getElementCategories = useCallback(() => {
    return elementConfigsByCategory;
  }, [elementConfigsByCategory]);

  // Check if action is available for current selection
  const isActionAvailable = useCallback((actionId: string, elementSelection?: ElementSelection) => {
    if (!elementSelection) {
      return ['add-element', 'add-text', 'add-button', 'add-image'].includes(actionId);
    }
    
    const elementType = elementSelection.type as UniversalElementType;
    const config = elementConfigs[elementType];
    
    if (!config) return false;
    
    switch (actionId) {
      case 'convert-element-type':
        return getCompatibleElementTypes(elementType).length > 0;
      case 'text-variations':
        return config.toolbarType === 'text';
      case 'element-style':
        return config.allowedProps.length > 0;
      default:
        return true;
    }
  }, [elementConfigs, getCompatibleElementTypes]);

  return {
    // Enhanced actions
    executeEnhancedAction,
    handleAddElementWithPicker,
    handleDuplicateElementEnhanced,
    handleDeleteElementEnhanced,
    handleMoveElementUpEnhanced,
    handleMoveElementDownEnhanced,
    handleConvertElementTypeEnhanced,
    handleElementVariationsEnhanced,
    handleElementStyleEnhanced,
    
    // Action utilities
    getElementActions,
    getSectionActions,
    isActionAvailable,
    getCompatibleElementTypes,
    
    // Element information
    getAvailableElementTypes,
    getElementCategories,
    elementConfigs,
    
    // Base actions (passthrough)
    ...baseActions,
  };
}