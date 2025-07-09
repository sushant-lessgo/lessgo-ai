// hooks/useInlineEditorActions.ts - Enhanced editor actions for inline text editing
import { useCallback } from 'react';
import { useTextToolbarIntegration } from './useTextToolbarIntegration';
import { useEditStore } from './useEditStore';
import { applyFormatToElement, validateFormat, animateFormatChange } from '@/utils/textFormatting';
import type { TextFormatState } from '@/app/edit/[token]/components/editor/InlineTextEditor';
import type { ElementSelection } from '@/types/core/ui';

export function useInlineEditorActions() {
  const { 
    activeEditor, 
    formatState, 
    executeFormat, 
    isFormatActive, 
    getFormatValue,
    canApplyFormat,
    syncFormatStateFromDOM 
  } = useTextToolbarIntegration();
  
  const { 
    updateElementContent, 
    markAsCustomized, 
    announceLiveRegion,
    trackChange 
  } = useEditStore();

  // Enhanced text format handler
  const handleApplyTextFormat = useCallback(async (params: {
    elementSelection: ElementSelection;
    format: keyof TextFormatState;
    active: boolean;
    animate?: boolean;
  }) => {
    const { elementSelection, format, active, animate = true } = params;
    
    if (!activeEditor?.current || !canApplyFormat(format)) {
      return false;
    }
    
    const element = activeEditor.current;
    const currentValue = getFormatValue(format);
    
    // Prepare format object
    const formatUpdate: Partial<TextFormatState> = {
      [format]: active
    };
    
    // Validate format
    const validation = validateFormat(formatUpdate);
    if (!validation.valid) {
      console.warn('Invalid format:', validation.errors);
      announceLiveRegion(`Invalid format: ${validation.errors.join(', ')}`);
      return false;
    }
    
    // Apply format with animation if requested
    if (animate && typeof currentValue === 'string' && typeof active === 'string') {
      try {
        await animateFormatChange(element, format, currentValue, active as string);
      } catch (error) {
        console.warn('Animation failed, applying directly:', error);
        executeFormat({ type: format as any, value: active });
      }
    } else {
      executeFormat({ type: format as any, value: active });
    }
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: format,
      oldValue: currentValue,
      newValue: active,
      timestamp: Date.now(),
    });
    
    // Announce change
    const actionText = typeof active === 'boolean' ? 
      (active ? 'applied' : 'removed') : 
      'changed';
    announceLiveRegion(`${format} ${actionText}`);
    
    return true;
  }, [activeEditor, canApplyFormat, getFormatValue, executeFormat, markAsCustomized, trackChange, announceLiveRegion]);

  // Enhanced color change handler
  const handleChangeTextColor = useCallback(async (params: {
    elementSelection: ElementSelection;
    color: string;
    animate?: boolean;
  }) => {
    const { elementSelection, color, animate = true } = params;
    
    if (!activeEditor?.current) return false;
    
    const element = activeEditor.current;
    const currentColor = getFormatValue('color');
    
    // Validate color
    const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!colorRegex.test(color) && !color.startsWith('rgb') && !color.startsWith('hsl')) {
      announceLiveRegion('Invalid color format');
      return false;
    }
    
    // Apply color with animation
    if (animate && typeof currentColor === 'string') {
      try {
        await animateFormatChange(element, 'color', currentColor, color);
      } catch (error) {
        executeFormat({ type: 'color', value: color });
      }
    } else {
      executeFormat({ type: 'color', value: color });
    }
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: 'color',
      oldValue: currentColor,
      newValue: color,
      timestamp: Date.now(),
    });
    
    announceLiveRegion(`Text color changed to ${color}`);
    return true;
  }, [activeEditor, getFormatValue, executeFormat, markAsCustomized, trackChange, announceLiveRegion]);

  // Enhanced font size handler
  const handleChangeFontSize = useCallback(async (params: {
    elementSelection: ElementSelection;
    size: string;
    animate?: boolean;
  }) => {
    const { elementSelection, size, animate = true } = params;
    
    if (!activeEditor?.current) return false;
    
    const element = activeEditor.current;
    const currentSize = getFormatValue('fontSize');
    
    // Validate size
    const sizeRegex = /^\d+(\.\d+)?(px|em|rem|%)$/;
    if (!sizeRegex.test(size)) {
      announceLiveRegion('Invalid font size format');
      return false;
    }
    
    // Apply size with animation
    if (animate && typeof currentSize === 'string') {
      try {
        await animateFormatChange(element, 'fontSize', currentSize, size);
      } catch (error) {
        executeFormat({ type: 'size', value: size });
      }
    } else {
      executeFormat({ type: 'size', value: size });
    }
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: 'fontSize',
      oldValue: currentSize,
      newValue: size,
      timestamp: Date.now(),
    });
    
    announceLiveRegion(`Font size changed to ${size}`);
    return true;
  }, [activeEditor, getFormatValue, executeFormat, markAsCustomized, trackChange, announceLiveRegion]);

  // Enhanced alignment handler
  const handleChangeTextAlign = useCallback(async (params: {
    elementSelection: ElementSelection;
    align: 'left' | 'center' | 'right' | 'justify';
    animate?: boolean;
  }) => {
    const { elementSelection, align, animate = true } = params;
    
    if (!activeEditor?.current) return false;
    
    const element = activeEditor.current;
    const currentAlign = getFormatValue('textAlign');
    
    // Validate alignment
    const validAlignments = ['left', 'center', 'right', 'justify'];
    if (!validAlignments.includes(align)) {
      announceLiveRegion('Invalid text alignment');
      return false;
    }
    
    // Apply alignment
    executeFormat({ type: 'align', value: align });
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: 'textAlign',
      oldValue: currentAlign,
      newValue: align,
      timestamp: Date.now(),
    });
    
    announceLiveRegion(`Text aligned ${align}`);
    return true;
  }, [activeEditor, getFormatValue, executeFormat, markAsCustomized, trackChange, announceLiveRegion]);

  // Font family handler
  const handleChangeFontFamily = useCallback(async (params: {
    elementSelection: ElementSelection;
    fontFamily: string;
  }) => {
    const { elementSelection, fontFamily } = params;
    
    if (!activeEditor?.current) return false;
    
    const currentFontFamily = getFormatValue('fontFamily');
    
    executeFormat({ type: 'font', value: fontFamily });
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: 'fontFamily',
      oldValue: currentFontFamily,
      newValue: fontFamily,
      timestamp: Date.now(),
    });
    
    announceLiveRegion(`Font family changed to ${fontFamily}`);
    return true;
  }, [activeEditor, getFormatValue, executeFormat, markAsCustomized, trackChange, announceLiveRegion]);

  // Line height handler
  const handleChangeLineHeight = useCallback(async (params: {
    elementSelection: ElementSelection;
    lineHeight: string;
  }) => {
    const { elementSelection, lineHeight } = params;
    
    if (!activeEditor?.current) return false;
    
    const currentLineHeight = getFormatValue('lineHeight');
    
    // Validate line height
    const lineHeightRegex = /^\d+(\.\d+)?(px|em|rem|%)?$/;
    if (!lineHeightRegex.test(lineHeight)) {
      announceLiveRegion('Invalid line height format');
      return false;
    }
    
    executeFormat({ type: 'line-height', value: lineHeight });
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: 'lineHeight',
      oldValue: currentLineHeight,
      newValue: lineHeight,
      timestamp: Date.now(),
    });
    
    announceLiveRegion(`Line height changed to ${lineHeight}`);
    return true;
  }, [activeEditor, getFormatValue, executeFormat, markAsCustomized, trackChange, announceLiveRegion]);

  // Letter spacing handler
  const handleChangeLetterSpacing = useCallback(async (params: {
    elementSelection: ElementSelection;
    letterSpacing: string;
  }) => {
    const { elementSelection, letterSpacing } = params;
    
    if (!activeEditor?.current) return false;
    
    const currentLetterSpacing = getFormatValue('letterSpacing');
    
    // Validate letter spacing
    const spacingRegex = /^(-?\d+(\.\d+)?(px|em|rem))|normal$/;
    if (!spacingRegex.test(letterSpacing)) {
      announceLiveRegion('Invalid letter spacing format');
      return false;
    }
    
    executeFormat({ type: 'letter-spacing', value: letterSpacing });
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: 'letterSpacing',
      oldValue: currentLetterSpacing,
      newValue: letterSpacing,
      timestamp: Date.now(),
    });
    
    announceLiveRegion(`Letter spacing changed to ${letterSpacing}`);
    return true;
  }, [activeEditor, getFormatValue, executeFormat, markAsCustomized, trackChange, announceLiveRegion]);

  // Text transform handler
  const handleChangeTextTransform = useCallback(async (params: {
    elementSelection: ElementSelection;
    transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  }) => {
    const { elementSelection, transform } = params;
    
    if (!activeEditor?.current) return false;
    
    const currentTransform = getFormatValue('textTransform');
    
    // Validate transform
    const validTransforms = ['none', 'uppercase', 'lowercase', 'capitalize'];
    if (!validTransforms.includes(transform)) {
      announceLiveRegion('Invalid text transform');
      return false;
    }
    
    executeFormat({ type: 'transform', value: transform });
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: 'textTransform',
      oldValue: currentTransform,
      newValue: transform,
      timestamp: Date.now(),
    });
    
    const transformLabel = transform === 'none' ? 'normal' : transform;
    announceLiveRegion(`Text transform changed to ${transformLabel}`);
    return true;
  }, [activeEditor, getFormatValue, executeFormat, markAsCustomized, trackChange, announceLiveRegion]);

  // Clear formatting handler
  const handleClearFormatting = useCallback(async (params: {
    elementSelection: ElementSelection;
    animate?: boolean;
  }) => {
    const { elementSelection, animate = true } = params;
    
    if (!activeEditor?.current) return false;
    
    const element = activeEditor.current;
    const currentFormat = formatState;
    
    // Clear all formatting
    if (animate) {
      // Animate back to default values
      element.style.transition = 'all 0.3s ease';
      element.style.fontWeight = 'normal';
      element.style.fontStyle = 'normal';
      element.style.textDecoration = 'none';
      element.style.color = '#000000';
      element.style.fontSize = '1rem';
      element.style.textAlign = 'left';
      element.style.lineHeight = '1.5';
      element.style.letterSpacing = 'normal';
      element.style.textTransform = 'none';
      
      // Remove transition after animation
      setTimeout(() => {
        element.style.transition = '';
      }, 300);
    } else {
      element.style.cssText = '';
    }
    
    // Update format state
    const defaultFormat: TextFormatState = {
      bold: false,
      italic: false,
      underline: false,
      color: '#000000',
      fontSize: '1rem',
      fontFamily: 'inherit',
      textAlign: 'left',
      lineHeight: '1.5',
      letterSpacing: 'normal',
      textTransform: 'none',
    };
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: 'clear-all',
      oldValue: currentFormat,
      newValue: defaultFormat,
      timestamp: Date.now(),
    });
    
    announceLiveRegion('All formatting cleared');
    return true;
  }, [activeEditor, formatState, markAsCustomized, trackChange, announceLiveRegion]);

  // Batch format handler
  const handleApplyBatchFormat = useCallback(async (params: {
    elementSelection: ElementSelection;
    formats: Partial<TextFormatState>;
    animate?: boolean;
  }) => {
    const { elementSelection, formats, animate = true } = params;
    
    if (!activeEditor?.current) return false;
    
    // Validate all formats
    const validation = validateFormat(formats);
    if (!validation.valid) {
      announceLiveRegion(`Invalid formats: ${validation.errors.join(', ')}`);
      return false;
    }
    
    const element = activeEditor.current;
    const currentFormat = formatState;
    
    // Apply formats
    Object.entries(formats).forEach(([key, value]) => {
      executeFormat({ type: key as any, value });
    });
    
    // Mark section as customized
    markAsCustomized(elementSelection.sectionId);
    
    // Track change
    trackChange({
      type: 'format',
      sectionId: elementSelection.sectionId,
      elementKey: elementSelection.elementKey,
      property: 'batch-update',
      oldValue: currentFormat,
      newValue: { ...currentFormat, ...formats },
      timestamp: Date.now(),
    });
    
    const changedCount = Object.keys(formats).length;
    announceLiveRegion(`Applied ${changedCount} format changes`);
    return true;
  }, [activeEditor, formatState, executeFormat, markAsCustomized, trackChange, announceLiveRegion]);

  // Sync format state from DOM
  const handleSyncFormatState = useCallback(() => {
    if (!activeEditor?.current) return;
    
    syncFormatStateFromDOM();
    announceLiveRegion('Format state synchronized');
  }, [activeEditor, syncFormatStateFromDOM, announceLiveRegion]);

  // Get current format state
  const getCurrentFormatState = useCallback(() => {
    return formatState;
  }, [formatState]);

  // Check if format is active
  const isFormatActiveState = useCallback((format: keyof TextFormatState) => {
    return isFormatActive(format);
  }, [isFormatActive]);

  // Get format value
  const getFormatValueState = useCallback((format: keyof TextFormatState) => {
    return getFormatValue(format);
  }, [getFormatValue]);

  return {
    // Enhanced format handlers
    handleApplyTextFormat,
    handleChangeTextColor,
    handleChangeFontSize,
    handleChangeTextAlign,
    handleChangeFontFamily,
    handleChangeLineHeight,
    handleChangeLetterSpacing,
    handleChangeTextTransform,
    handleClearFormatting,
    handleApplyBatchFormat,
    
    // State management
    handleSyncFormatState,
    getCurrentFormatState,
    isFormatActiveState,
    getFormatValueState,
    
    // Utility functions
    canApplyFormat,
    hasActiveEditor: () => activeEditor !== null,
    getActiveEditor: () => activeEditor?.current || null,
  };
}