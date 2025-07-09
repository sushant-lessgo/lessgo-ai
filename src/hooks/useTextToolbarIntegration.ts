// hooks/useTextToolbarIntegration.ts - Toolbar integration system
import { useState, useCallback, useRef, useEffect } from 'react';
import { useEditStore } from './useEditStore';
import type { TextFormatState, TextSelection } from '@/app/edit/[token]/components/editor/InlineTextEditor';

export interface TextFormatAction {
  type: 'bold' | 'italic' | 'underline' | 'color' | 'size' | 'align' | 'font' | 'line-height' | 'letter-spacing' | 'transform';
  value?: any;
  selection?: TextSelection;
}

interface TextToolbarIntegrationState {
  activeEditor: React.RefObject<HTMLElement> | null;
  formatState: TextFormatState;
  currentSelection: TextSelection | null;
  isEditing: boolean;
}

export function useTextToolbarIntegration() {
  const [state, setState] = useState<TextToolbarIntegrationState>({
    activeEditor: null,
    formatState: {
      bold: false,
      italic: false,
      underline: false,
      color: '#000000',
      fontSize: '16px',
      fontFamily: 'inherit',
      textAlign: 'left',
      lineHeight: '1.5',
      letterSpacing: 'normal',
      textTransform: 'none',
    },
    currentSelection: null,
    isEditing: false,
  });

  const executeFormatRef = useRef<((format: Partial<TextFormatState>) => void) | null>(null);
  const { announceLiveRegion } = useEditStore();

  const executeFormat = useCallback((action: TextFormatAction) => {
    if (!state.activeEditor?.current || !executeFormatRef.current) return;
    
    const { type, value, selection } = action;
    
    switch (type) {
      case 'bold':
        executeFormatRef.current({ bold: value });
        break;
      case 'italic':
        executeFormatRef.current({ italic: value });
        break;
      case 'underline':
        executeFormatRef.current({ underline: value });
        break;
      case 'color':
        executeFormatRef.current({ color: value });
        break;
      case 'size':
        executeFormatRef.current({ fontSize: value });
        break;
      case 'align':
        executeFormatRef.current({ textAlign: value });
        break;
      case 'font':
        executeFormatRef.current({ fontFamily: value });
        break;
      case 'line-height':
        executeFormatRef.current({ lineHeight: value });
        break;
      case 'letter-spacing':
        executeFormatRef.current({ letterSpacing: value });
        break;
      case 'transform':
        executeFormatRef.current({ textTransform: value });
        break;
    }
    
    announceLiveRegion(`Applied ${type} formatting`);
  }, [state.activeEditor, announceLiveRegion]);

  const registerEditor = useCallback((editorRef: React.RefObject<HTMLElement>) => {
    setState(prev => ({
      ...prev,
      activeEditor: editorRef,
      isEditing: true,
    }));
  }, []);

  const unregisterEditor = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeEditor: null,
      isEditing: false,
    }));
  }, []);

  const setFormatState = useCallback((formatState: TextFormatState) => {
    setState(prev => ({
      ...prev,
      formatState,
    }));
  }, []);

  const setCurrentSelection = useCallback((selection: TextSelection | null) => {
    setState(prev => ({
      ...prev,
      currentSelection: selection,
    }));
  }, []);

  const getFormatState = useCallback(() => {
    return state.formatState;
  }, [state.formatState]);

  const getCurrentSelection = useCallback(() => {
    return state.currentSelection;
  }, [state.currentSelection]);

  const isFormatActive = useCallback((format: keyof TextFormatState) => {
    const formatState = state.formatState;
    
    switch (format) {
      case 'bold':
      case 'italic':
      case 'underline':
        return formatState[format];
      default:
        return false;
    }
  }, [state.formatState]);

  const getFormatValue = useCallback((format: keyof TextFormatState) => {
    return state.formatState[format];
  }, [state.formatState]);

  const canApplyFormat = useCallback((format: keyof TextFormatState) => {
    return state.activeEditor !== null && state.isEditing;
  }, [state.activeEditor, state.isEditing]);

  const applyBoldFormat = useCallback(() => {
    const isActive = isFormatActive('bold');
    executeFormat({ type: 'bold', value: !isActive });
  }, [isFormatActive, executeFormat]);

  const applyItalicFormat = useCallback(() => {
    const isActive = isFormatActive('italic');
    executeFormat({ type: 'italic', value: !isActive });
  }, [isFormatActive, executeFormat]);

  const applyUnderlineFormat = useCallback(() => {
    const isActive = isFormatActive('underline');
    executeFormat({ type: 'underline', value: !isActive });
  }, [isFormatActive, executeFormat]);

  const applyColorFormat = useCallback((color: string) => {
    executeFormat({ type: 'color', value: color });
  }, [executeFormat]);

  const applyFontSizeFormat = useCallback((size: string) => {
    executeFormat({ type: 'size', value: size });
  }, [executeFormat]);

  const applyTextAlignFormat = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
    executeFormat({ type: 'align', value: align });
  }, [executeFormat]);

  const applyFontFamilyFormat = useCallback((fontFamily: string) => {
    executeFormat({ type: 'font', value: fontFamily });
  }, [executeFormat]);

  const applyLineHeightFormat = useCallback((lineHeight: string) => {
    executeFormat({ type: 'line-height', value: lineHeight });
  }, [executeFormat]);

  const applyLetterSpacingFormat = useCallback((letterSpacing: string) => {
    executeFormat({ type: 'letter-spacing', value: letterSpacing });
  }, [executeFormat]);

  const applyTextTransformFormat = useCallback((transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => {
    executeFormat({ type: 'transform', value: transform });
  }, [executeFormat]);

  const clearFormatting = useCallback(() => {
    if (executeFormatRef.current) {
      executeFormatRef.current({
        bold: false,
        italic: false,
        underline: false,
        color: '#000000',
        fontSize: '16px',
        fontFamily: 'inherit',
        textAlign: 'left',
        lineHeight: '1.5',
        letterSpacing: 'normal',
        textTransform: 'none',
      });
    }
    announceLiveRegion('Cleared all formatting');
  }, [announceLiveRegion]);

  const hasActiveEditor = useCallback(() => {
    return state.activeEditor !== null;
  }, [state.activeEditor]);

  const getActiveEditorElement = useCallback(() => {
    return state.activeEditor?.current || null;
  }, [state.activeEditor]);

  const syncFormatStateFromDOM = useCallback(() => {
    if (!state.activeEditor?.current) return;
    
    const element = state.activeEditor.current;
    const computedStyle = window.getComputedStyle(element);
    
    const newFormatState: TextFormatState = {
      bold: computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600,
      italic: computedStyle.fontStyle === 'italic',
      underline: computedStyle.textDecoration.includes('underline'),
      color: computedStyle.color,
      fontSize: computedStyle.fontSize,
      fontFamily: computedStyle.fontFamily,
      textAlign: computedStyle.textAlign as any,
      lineHeight: computedStyle.lineHeight,
      letterSpacing: computedStyle.letterSpacing,
      textTransform: computedStyle.textTransform as any,
    };
    
    setFormatState(newFormatState);
  }, [state.activeEditor, setFormatState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.activeEditor?.current || !state.isEditing) return;
      
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      
      if (isCtrlOrMeta) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault();
            applyBoldFormat();
            break;
          case 'i':
            event.preventDefault();
            applyItalicFormat();
            break;
          case 'u':
            event.preventDefault();
            applyUnderlineFormat();
            break;
        }
      }
    };
    
    if (state.isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [state.activeEditor, state.isEditing, applyBoldFormat, applyItalicFormat, applyUnderlineFormat]);

  return {
    // State
    activeEditor: state.activeEditor,
    formatState: state.formatState,
    currentSelection: state.currentSelection,
    isEditing: state.isEditing,
    
    // Registration
    registerEditor,
    unregisterEditor,
    
    // State management
    setFormatState,
    setCurrentSelection,
    getFormatState,
    getCurrentSelection,
    
    // Format queries
    isFormatActive,
    getFormatValue,
    canApplyFormat,
    
    // Format actions
    executeFormat,
    applyBoldFormat,
    applyItalicFormat,
    applyUnderlineFormat,
    applyColorFormat,
    applyFontSizeFormat,
    applyTextAlignFormat,
    applyFontFamilyFormat,
    applyLineHeightFormat,
    applyLetterSpacingFormat,
    applyTextTransformFormat,
    clearFormatting,
    
    // Utilities
    hasActiveEditor,
    getActiveEditorElement,
    syncFormatStateFromDOM,
    
    // Internal reference for editor integration
    executeFormat: executeFormatRef,
  };
}