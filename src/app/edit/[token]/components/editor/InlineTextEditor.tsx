// app/edit/[token]/components/editor/InlineTextEditor.tsx - Core Inline Text Editor
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { useTextToolbarIntegration } from '@/hooks/useTextToolbarIntegration';
import { useInlineEditorAutoSave } from '@/hooks/useInlineEditorAutoSave';
import { useTextSelection } from '@/hooks/useTextSelection';
import { getEditingIndicatorColors } from '@/utils/textContrastUtils';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
// Removed problematic sanitizeHTML import that was causing infinite loops
// import { sanitizeHTML, isValidFormattingHTML } from '@/utils/htmlSanitization';
import { 
  getInteractionSource, 
  isInEditorContext, 
  shouldIgnoreSelectionChange,
  shouldIgnoreFocusChange,
  setComposing,
  logInteractionTimeline 
} from '@/utils/interactionTracking';
import { restoreSelectionEvents } from '@/utils/selectionGuard';
import { useGlobalSelectionHandler } from '@/hooks/useGlobalSelectionHandler';

export interface TextFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  fontSize: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: string;
  letterSpacing: string;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface TextSelection {
  start: number;
  end: number;
  text: string;
  isCollapsed: boolean;
  containerElement: HTMLElement;
  range: Range;
}

export interface InlineEditorConfig {
  enterKeyBehavior: 'new-line' | 'save' | 'ignore';
  escapeKeyBehavior: 'cancel' | 'save' | 'ignore';
  allowedFormats: (keyof TextFormatState)[];
  restrictedFormats: (keyof TextFormatState)[];
  autoFormatting: {
    enabled: boolean;
    rules: AutoFormatRule[];
  };
  validation: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (content: string) => boolean;
  };
  accessibility: {
    announceChanges: boolean;
    keyboardNavigation: boolean;
    screenReaderSupport: boolean;
  };
}

export interface AutoFormatRule {
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  formatApplied?: Partial<TextFormatState>;
}

export interface AutoSaveConfig {
  enabled: boolean;
  debounceMs: number;
  onSave: (content: string) => void;
}

interface InlineTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  element: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  elementKey: string;
  sectionId: string;
  formatState: TextFormatState;
  onFormatChange: (format: TextFormatState) => void;
  autoSave: AutoSaveConfig;
  config: InlineEditorConfig;
  onFocus: () => void;
  onBlur: () => void;
  onSelectionChange: (selection: TextSelection | null) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  backgroundType?: string;
  colorTokens?: any;
  sectionBackground?: string;
}

const defaultFormatState: TextFormatState = {
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
};

export function InlineTextEditor({
  content,
  onContentChange,
  element: Element,
  elementKey,
  sectionId,
  formatState,
  onFormatChange,
  autoSave,
  config,
  onFocus,
  onBlur,
  onSelectionChange,
  className = '',
  style = {},
  placeholder = 'Click to edit',
  backgroundType = 'primary',
  colorTokens = {},
  sectionBackground
}: InlineTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const [formatHistory, setFormatHistory] = useState<TextFormatState[]>([]);
  
  const editorRef = useRef<HTMLElement>(null);
  const selectionRef = useRef<TextSelection | null>(null);
  
  const { registerEditor, unregisterEditor, executeFormatRef } = useTextToolbarIntegration();
  const { trackContentChange } = useInlineEditorAutoSave(autoSave);
  const { 
    getSelection, 
    setSelection, 
    getFormatAtSelection, 
    applyFormatToSelection,
    handleSelectionChange 
  } = useTextSelection(editorRef);
  
  // Get store actions for text editing mode management
  const { setTextEditingMode, formattingInProgress, isTextEditing } = useEditStore();

  // Get dynamic editing indicator colors based on background type and actual background
  const editingColors = getEditingIndicatorColors(backgroundType, colorTokens, sectionBackground);

  // Auto-save with debouncing
  const debouncedSave = useMemo(
    () => debounce((content: string) => {
      if (autoSave.enabled && content !== placeholder) {
        autoSave.onSave(content);
      }
    }, autoSave.debounceMs),
    [autoSave]
  );

  // Apply format to editor element
  const applyFormat = useCallback((format: Partial<TextFormatState>) => {
    if (!editorRef.current) return;
    
    const newFormatState = { ...formatState, ...format };
    const element = editorRef.current;
    
    if (format.bold !== undefined) {
      element.style.fontWeight = format.bold ? 'bold' : 'normal';
    }
    if (format.italic !== undefined) {
      element.style.fontStyle = format.italic ? 'italic' : 'normal';
    }
    if (format.underline !== undefined) {
      element.style.textDecoration = format.underline ? 'underline' : 'none';
    }
    if (format.color) {
      element.style.color = format.color;
    }
    if (format.fontSize) {
      element.style.fontSize = format.fontSize;
    }
    if (format.fontFamily) {
      element.style.fontFamily = format.fontFamily;
    }
    if (format.textAlign) {
      element.style.textAlign = format.textAlign;
    }
    if (format.lineHeight) {
      element.style.lineHeight = format.lineHeight;
    }
    if (format.letterSpacing) {
      element.style.letterSpacing = format.letterSpacing;
    }
    if (format.textTransform) {
      element.style.textTransform = format.textTransform;
    }
    
    onFormatChange(newFormatState);
    setFormatHistory(prev => [...prev, newFormatState].slice(-10));
  }, [formatState, onFormatChange]);

  // Content change handling - Enhanced to support HTML storage
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    
    // Check if element contains formatted spans - if so, use HTML
    const hasFormattedContent = editorRef.current.querySelector('span[style]');
    const newContent = hasFormattedContent 
      ? editorRef.current.innerHTML 
      : editorRef.current.textContent || '';
    
    if (newContent !== currentContent) {
      // Store cursor position before any state updates
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const cursorPosition = range?.startOffset || 0;
      
      setCurrentContent(newContent);
      
      console.log('📝 Content changed:', {
        hasFormattedContent,
        contentType: hasFormattedContent ? 'HTML' : 'TEXT',
        content: newContent.substring(0, 100),
      });
      
      // Only call onContentChange if not actively typing to prevent re-renders
      // Store the content locally and defer the store update
      if (!editorRef.current.dataset.activelyTyping) {
        onContentChange(newContent);
      } else {
        // Store pending content to save later
        editorRef.current.dataset.pendingContent = newContent;
      }
      
      // Track for auto-save but don't trigger immediate save during typing
      if (autoSave.enabled) {
        trackContentChange({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sectionId,
          elementKey,
          oldContent: currentContent,
          newContent,
          timestamp: Date.now(),
          formatChanges: formatState,
        });
        
        // Only trigger debounced save, not immediate save
        debouncedSave(newContent);
      }
      
      // Restore cursor position after any potential re-render
      requestAnimationFrame(() => {
        if (editorRef.current && selection && range) {
          try {
            const textNode = editorRef.current.firstChild || editorRef.current;
            if (textNode.nodeType === Node.TEXT_NODE) {
              const newRange = document.createRange();
              const safePosition = Math.min(cursorPosition, textNode.textContent?.length || 0);
              newRange.setStart(textNode, safePosition);
              newRange.setEnd(textNode, safePosition);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } catch (error) {
            console.warn('Failed to restore cursor position:', error);
          }
        }
      });
    }
  }, [currentContent, onContentChange, autoSave.enabled, debouncedSave, trackContentChange, sectionId, elementKey, formatState]);

  // Text editing exit handler - consolidates all exit logic
  const exitTextEditingMode = useCallback(() => {
    const exitTime = Date.now();
    console.log(`📝 [${exitTime}] exitTextEditingMode CALLED:`, {
      isEditing,
      isTextEditing,
      formattingInProgress,
      elementKey,
      sectionId,
      callStack: new Error().stack?.split('\n').slice(1, 3).join(' -> ')
    });
    
    // Prevent recursive calls
    if (editorRef.current?.dataset.exiting === 'true') {
      console.log(`📝 [${exitTime}] BLOCKED: Already exiting, preventing recursion`);
      return;
    }
    
    // Don't exit if formatting is in progress (Fix #2: Split User Intent)
    if (formattingInProgress) {
      console.log(`📝 [${exitTime}] Skipping exit - formatting in progress`);
      return;
    }
    
    // Don't exit if interaction is from toolbar
    if (shouldIgnoreFocusChange()) {
      console.log(`📝 [${exitTime}] Skipping exit - toolbar interaction`);
      return;
    }
    
    console.log(`📝 [${exitTime}] Exiting text editing mode with hard cleanup`);
    
    try {
      // Set flag to prevent recursive calls
      if (editorRef.current) {
        editorRef.current.dataset.exiting = 'true';
      }
      
      setIsEditing(false);
      setTextEditingMode(false); // Exit text editing mode in store
      console.log(`📝 [${exitTime}] State updates triggered`);
    
    // Hard cleanup on mode switch (Fix #4)
    // Clear selection events and force restore if needed
    try {
      restoreSelectionEvents();
    } catch (error) {
      console.warn('📝 Selection guard cleanup failed:', error);
    }
    
    // Clear any active selections
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    
    // Clear actively typing flag and save any pending content
    if (editorRef.current) {
      editorRef.current.dataset.activelyTyping = 'false';
      
      // Clear safety timeout
      const timeoutId = editorRef.current.dataset.safetyClearTimeout;
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId));
        delete editorRef.current.dataset.safetyClearTimeout;
      }
      
      // Save any pending content
      const pendingContent = editorRef.current.dataset.pendingContent;
      if (pendingContent) {
        console.log('📝 Saving pending content on exit:', pendingContent);
        editorRef.current.dataset.lastSaveTime = Date.now().toString();
        onContentChange(pendingContent);
        delete editorRef.current.dataset.pendingContent;
      }
      
      // Remove editing attributes
      editorRef.current.removeAttribute('data-editing');
      
      // Blur the element to ensure it loses focus
      editorRef.current.blur();
    }
    
    // Trigger auto-save flush if enabled
    if (autoSave.enabled) {
      debouncedSave.flush();
    }
    
    // Reset local selection state
    setCurrentSelection(null);
    selectionRef.current = null;
    
    console.log(`📝 [${exitTime}] Hard cleanup completed on text editing mode exit`);
    } catch (error) {
      console.error(`📝 [${exitTime}] ERROR in exitTextEditingMode:`, error);
      // Don't throw error to prevent cascading failures
      console.error(`📝 [${exitTime}] Continuing with cleanup despite error`);
    } finally {
      // Always clear the exiting flag to prevent permanent lock
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.dataset.exiting = 'false';
        }
      }, 100); // Small delay to prevent immediate re-entry
    }
  }, [formattingInProgress, setTextEditingMode, onContentChange, autoSave.enabled, debouncedSave]);

  // Event handlers
  const handleFocus = useCallback(() => {
    console.log('📝 InlineTextEditor handleFocus called');
    setIsEditing(true);
    // Mark as actively typing to prevent store updates during typing
    if (editorRef.current) {
      editorRef.current.dataset.activelyTyping = 'true';
      
      // Safety timeout to clear activelyTyping flag if blur doesn't fire
      const safetyClearTimeout = setTimeout(() => {
        if (editorRef.current) {
          console.log('📝 Safety timeout: clearing activelyTyping flag');
          editorRef.current.dataset.activelyTyping = 'false';
        }
      }, 10000); // 10 second safety timeout
      
      editorRef.current.dataset.safetyClearTimeout = safetyClearTimeout.toString();
    }
    onFocus();
  }, [onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    console.log('📝 InlineTextEditor handleBlur called');
    logInteractionTimeline('focusout', { 
      relatedTarget: e.relatedTarget?.nodeName,
      interactionSource: getInteractionSource()
    });
    
    // Check if focus moved to toolbar (portal-safe)
    const editorId = `editor-${sectionId}-${elementKey}`;
    if (e.relatedTarget && isInEditorContext(e.relatedTarget, editorId)) {
      console.log('📝 Focus moved to toolbar - not exiting');
      return;
    }
    
    // Enhanced blur: Exit text editing mode and save content
    exitTextEditingMode();
    onBlur();
  }, [exitTextEditingMode, onBlur, sectionId, elementKey]);

  const handleInternalSelectionChange = useCallback(() => {
    // Check if we should ignore this selection change
    if (shouldIgnoreSelectionChange()) {
      console.log('📝 Ignoring selection change per interaction tracking');
      return;
    }
    
    // Check if element is in text editing mode or actively typing - if so, don't interfere
    if (editorRef.current?.hasAttribute('data-editing') || 
        editorRef.current?.dataset.activelyTyping === 'true') {
      console.log('📝 InlineTextEditor: Skipping selection change - element in text editing mode or actively typing');
      return;
    }
    
    const selection = getSelection();
    console.log('📝 InlineTextEditor selection changed:', { selection, isCollapsed: selection?.isCollapsed });
    
    setCurrentSelection(selection);
    selectionRef.current = selection;
    onSelectionChange(selection);
    
    // Update format state based on current selection
    if (selection && !selection.isCollapsed) {
      const formatAtSelection = getFormatAtSelection();
      if (Object.keys(formatAtSelection).length > 0) {
        const updatedFormat = { ...formatState, ...formatAtSelection };
        onFormatChange(updatedFormat);
      }
    }
  }, [getSelection, onSelectionChange, getFormatAtSelection, formatState, onFormatChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        if (config.enterKeyBehavior === 'save') {
          e.preventDefault();
          exitTextEditingMode();
        } else if (config.enterKeyBehavior === 'ignore') {
          e.preventDefault();
        }
        break;
        
      case 'Escape':
        // Enhanced ESC key handling with comprehensive debugging
        const escTime = Date.now();
        console.log(`🔑 [${escTime}] ESC KEY PRESSED in handleKeyDown:`, {
          escapeKeyBehavior: config.escapeKeyBehavior,
          currentContent: currentContent?.substring(0, 50),
          originalContent: content?.substring(0, 50),
          hasEditorRef: !!editorRef.current,
          isTextEditing: isTextEditing
        });
        
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        try {
          if (config.escapeKeyBehavior === 'cancel') {
            console.log(`🔑 [${escTime}] Canceling changes - restoring original content`);
            // Cancel changes - restore original content
            setCurrentContent(content);
            if (editorRef.current) {
              editorRef.current.textContent = content;
              // Clear any pending content since we're canceling
              delete editorRef.current.dataset.pendingContent;
            }
          }
          
          console.log(`🔑 [${escTime}] Calling exitTextEditingMode from ESC handler`);
          
          // Add timeout safety net
          const timeoutId = setTimeout(() => {
            console.error(`🔑 [${escTime}] TIMEOUT: Local ESC handler taking too long, forcing cleanup`);
            if (editorRef.current) {
              editorRef.current.dataset.exiting = 'false';
            }
          }, 2000); // 2 second timeout
          
          // Always exit text editing mode on ESC
          exitTextEditingMode();
          
          clearTimeout(timeoutId);
          console.log(`🔑 [${escTime}] ESC handler completed successfully`);
        } catch (error) {
          console.error(`🔑 [${escTime}] ERROR in ESC handler:`, error);
          // Force clear exiting flag on error
          if (editorRef.current) {
            editorRef.current.dataset.exiting = 'false';
          }
        }
        break;
        
      // Format shortcuts
      case 'b':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          applyFormat({ bold: !formatState.bold });
        }
        break;
        
      case 'i':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          applyFormat({ italic: !formatState.italic });
        }
        break;
        
      case 'u':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          applyFormat({ underline: !formatState.underline });
        }
        break;
    }
  }, [config, content, formatState, applyFormat, exitTextEditingMode]);

  // Auto-formatting
  useEffect(() => {
    if (!config.autoFormatting.enabled || !editorRef.current) return;
    
    const applyAutoFormatting = () => {
      const content = editorRef.current?.textContent || '';
      
      config.autoFormatting.rules.forEach(rule => {
        if (rule.pattern.test(content)) {
          const newContent = content.replace(rule.pattern, rule.replacement as string);
          if (newContent !== content && editorRef.current) {
            editorRef.current.textContent = newContent;
            if (rule.formatApplied) {
              applyFormat(rule.formatApplied);
            }
          }
        }
      });
    };
    
    const timeoutId = setTimeout(applyAutoFormatting, 300);
    return () => clearTimeout(timeoutId);
  }, [currentContent, config.autoFormatting, applyFormat]);

  // Validation
  const isValid = useMemo(() => {
    if (!config.validation) return true;
    
    const { minLength, maxLength, pattern, customValidator } = config.validation;
    
    if (minLength && currentContent.length < minLength) return false;
    if (maxLength && currentContent.length > maxLength) return false;
    if (pattern && !pattern.test(currentContent)) return false;
    if (customValidator && !customValidator(currentContent)) return false;
    
    return true;
  }, [currentContent, config.validation]);

  // Accessibility
  useEffect(() => {
    if (config.accessibility.announceChanges && isEditing) {
      const announcement = `Editing ${elementKey}. Content: ${currentContent}`;
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;
      document.body.appendChild(liveRegion);
      
      setTimeout(() => document.body.removeChild(liveRegion), 1000);
    }
  }, [currentContent, isEditing, elementKey, config.accessibility.announceChanges]);

  // Click outside detection - exit text editing mode when clicking outside
  useEffect(() => {
    if (!isEditing) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        console.log('📝 Click outside detected - exiting text editing mode');
        exitTextEditingMode();
      }
    };
    
    // Add listener with slight delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, exitTextEditingMode]);

  // ESC key global handler - exit text editing mode from anywhere
  useEffect(() => {
    if (!isEditing) return;
    
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const globalEscTime = Date.now();
        console.log(`📝 [${globalEscTime}] GLOBAL ESC key detected - exiting text editing mode:`, {
          isEditing,
          target: event.target,
          currentTarget: event.currentTarget,
          bubbles: event.bubbles,
          defaultPrevented: event.defaultPrevented
        });
        event.preventDefault();
        event.stopPropagation();
        
        try {
          console.log(`📝 [${globalEscTime}] Calling exitTextEditingMode from global handler`);
          
          // Add timeout safety net
          const timeoutId = setTimeout(() => {
            console.error(`📝 [${globalEscTime}] TIMEOUT: ESC handler taking too long, forcing cleanup`);
            if (editorRef.current) {
              editorRef.current.dataset.exiting = 'false';
            }
          }, 2000); // 2 second timeout
          
          exitTextEditingMode();
          
          clearTimeout(timeoutId);
          console.log(`📝 [${globalEscTime}] Global ESC handler completed`);
        } catch (error) {
          console.error(`📝 [${globalEscTime}] ERROR in global ESC handler:`, error);
          // Force clear exiting flag on error
          if (editorRef.current) {
            editorRef.current.dataset.exiting = 'false';
          }
        }
      }
    };
    
    // Add global ESC handler
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isEditing, exitTextEditingMode]);

  // Register editor on mount
  useEffect(() => {
    if (editorRef.current) {
      registerEditor(editorRef);
      return () => unregisterEditor();
    }
  }, [registerEditor, unregisterEditor]);

  // Sync content when prop changes (only from external sources, not user input)
  useEffect(() => {
    if (content !== currentContent && !isEditing && editorRef.current) {
      // Check if this content change came from the user's own input
      const currentElementContent = editorRef.current.textContent || '';
      const isPendingUserContent = editorRef.current.dataset.pendingContent;
      const isActivelyTyping = editorRef.current.dataset.activelyTyping === 'true';
      
      console.log('📝 Content sync useEffect triggered:', {
        content,
        currentContent,
        currentElementContent,
        isEditing,
        isPendingUserContent,
        isActivelyTyping
      });
      
      // Only sync if the content prop is genuinely different from user's current input
      // AND it's not a result of the user's own changes being saved and returned from store
      const isUserCurrentlyEditing = isActivelyTyping || isPendingUserContent;
      const shouldSync = !isUserCurrentlyEditing && content !== currentElementContent;
      
      // IMPORTANT: Don't sync if the user just finished editing and we're getting the saved content back
      // Check if this might be the user's own content being returned from the store
      const mightBeUserContentEcho = Math.abs(Date.now() - (parseInt(editorRef.current.dataset.lastSaveTime || '0', 10))) < 1000;
      
      console.log('📝 Content sync decision:', {
        shouldSync,
        isUserCurrentlyEditing,
        mightBeUserContentEcho,
        timeSinceLastSave: Date.now() - (parseInt(editorRef.current.dataset.lastSaveTime || '0', 10))
      });
      
      if (shouldSync && !mightBeUserContentEcho) {
        console.log('📝 Syncing external content change:', content);
        setCurrentContent(content);
        
        // Check if incoming content is HTML (contains tags) or plain text
        const isHtmlContent = /<[^>]*>/g.test(content);
        
        if (isHtmlContent) {
          // Apply HTML content directly - will be sanitized on save
          editorRef.current.innerHTML = content;
          console.log('📝 Applied HTML content directly:', content.substring(0, 100));
        } else {
          // Set as plain text
          editorRef.current.textContent = content;
          console.log('📝 Applied plain text content:', content.substring(0, 100));
        }
      } else {
        console.log('📝 Skipping content sync - likely user content echo or user is editing');
        // Just update our internal state to match the current DOM content
        const hasFormattedContent = editorRef.current.querySelector('span[style]');
        const actualContent = hasFormattedContent 
          ? editorRef.current.innerHTML 
          : editorRef.current.textContent || '';
          
        if (actualContent !== currentContent) {
          setCurrentContent(actualContent);
        }
      }
    }
  }, [content, currentContent, isEditing]);

  // Apply initial format state
  useEffect(() => {
    if (editorRef.current) {
      const element = editorRef.current;
      
      // Apply format directly to DOM without triggering onFormatChange
      if (formatState.bold !== undefined) {
        element.style.fontWeight = formatState.bold ? 'bold' : 'normal';
      }
      if (formatState.italic !== undefined) {
        element.style.fontStyle = formatState.italic ? 'italic' : 'normal';
      }
      if (formatState.underline !== undefined) {
        element.style.textDecoration = formatState.underline ? 'underline' : 'none';
      }
      if (formatState.color) {
        element.style.color = formatState.color;
      }
      if (formatState.fontSize) {
        element.style.fontSize = formatState.fontSize;
      }
      if (formatState.fontFamily) {
        element.style.fontFamily = formatState.fontFamily;
      }
      if (formatState.textAlign) {
        element.style.textAlign = formatState.textAlign;
      }
      if (formatState.lineHeight) {
        element.style.lineHeight = formatState.lineHeight;
      }
      if (formatState.letterSpacing) {
        element.style.letterSpacing = formatState.letterSpacing;
      }
      if (formatState.textTransform) {
        element.style.textTransform = formatState.textTransform;
      }
    }
  }, [formatState]);

  // Expose format application function for toolbar integration
  useEffect(() => {
    if (executeFormatRef) {
      executeFormatRef.current = applyFormat;
    }
  }, [executeFormatRef, applyFormat]);
  
  // Global selection and focus handlers with AbortController
  const editorId = `editor-${sectionId}-${elementKey}`;
  useGlobalSelectionHandler({
    editorId,
    enabled: isEditing,
    onFocusOut: (e) => {
      // Additional focus out handling if needed
      if (!isInEditorContext(e.target, editorId)) {
        console.log('📝 Focus left editor context completely');
        exitTextEditingMode();
      }
    }
  });

  // Dynamic styles based on background type - use CSS custom properties
  const dynamicStyles = {
    '--editing-outline': editingColors.outline,
    '--editing-glow': editingColors.glow,
    '--editing-background': editingColors.background,
    outline: isEditing ? `2px solid ${editingColors.outline}` : 'none',
    outlineOffset: isEditing ? '2px' : '0',
    borderRadius: isEditing ? '4px' : '0',
    backgroundColor: isEditing ? editingColors.background : 'transparent',
    boxShadow: isEditing ? `0 0 0 4px ${editingColors.glow}` : 'none',
    transition: 'all 0.2s ease-in-out',
    ...style
  } as React.CSSProperties;


  return (
    <Element
      ref={editorRef as any}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={handleContentChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseUp={handleInternalSelectionChange}
      onKeyUp={handleInternalSelectionChange}
      onCompositionStart={() => {
        setComposing(true);
        logInteractionTimeline('compositionstart');
      }}
      onCompositionEnd={() => {
        setComposing(false);
        logInteractionTimeline('compositionend');
      }}
      onClick={(e) => {
        console.log('📝 InlineTextEditor clicked');
        // Don't prevent default - we want normal click behavior
      }}
      className={`
        inline-text-editor cursor-text
        ${isEditing ? '' : 'hover:bg-opacity-10'}
        ${!isValid ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
        ${className}
      `}
      style={dynamicStyles}
      data-section-id={sectionId}
      data-element-key={elementKey}
      data-editor-id={`editor-${sectionId}-${elementKey}`}
      data-editing={isEditing}
      data-valid={isValid}
      data-background-type={backgroundType}
      role="textbox"
      aria-label={`Edit ${elementKey}`}
      aria-multiline={Element !== 'span'}
      aria-invalid={!isValid}
      tabIndex={0}
    >
      {/* Render HTML content if it contains formatting, otherwise plain text */}
      {(() => {
        const isHtmlContent = /<[^>]*>/g.test(currentContent);
        if (isHtmlContent) {
          // Directly render HTML content - already sanitized on save
          console.log('📝 Rendering HTML content:', currentContent.substring(0, 100));
          return <span dangerouslySetInnerHTML={{ __html: currentContent }} />;
        } else {
          return currentContent || placeholder;
        }
      })()}
    </Element>
  );
}

// Default configurations
export const defaultEditorConfig: InlineEditorConfig = {
  enterKeyBehavior: 'new-line',
  escapeKeyBehavior: 'save',
  allowedFormats: ['bold', 'italic', 'underline', 'color', 'fontSize', 'textAlign'],
  restrictedFormats: [],
  autoFormatting: {
    enabled: true,
    rules: [
      {
        pattern: /\*\*(.*?)\*\*/g,
        replacement: '$1',
        formatApplied: { bold: true },
      },
      {
        pattern: /\*(.*?)\*/g,
        replacement: '$1',
        formatApplied: { italic: true },
      },
    ],
  },
  validation: {
    maxLength: 1000,
  },
  accessibility: {
    announceChanges: true,
    keyboardNavigation: true,
    screenReaderSupport: true,
  },
};