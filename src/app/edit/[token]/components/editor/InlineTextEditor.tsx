// app/edit/[token]/components/editor/InlineTextEditor.tsx - Core Inline Text Editor
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { useTextToolbarIntegration } from '@/hooks/useTextToolbarIntegration';
import { useInlineEditorAutoSave } from '@/hooks/useInlineEditorAutoSave';
import { useTextSelection } from '@/hooks/useTextSelection';

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
  placeholder = 'Click to edit'
}: InlineTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const [formatHistory, setFormatHistory] = useState<TextFormatState[]>([]);
  
  const editorRef = useRef<HTMLElement>(null);
  const selectionRef = useRef<TextSelection | null>(null);
  
  const { registerEditor, unregisterEditor, executeFormat } = useTextToolbarIntegration();
  const { trackContentChange } = useInlineEditorAutoSave(autoSave);
  const { 
    getSelection, 
    setSelection, 
    getFormatAtSelection, 
    applyFormatToSelection,
    handleSelectionChange 
  } = useTextSelection(editorRef);

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

  // Content change handling
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    
    const newContent = editorRef.current.textContent || '';
    
    if (newContent !== currentContent) {
      // Store cursor position before any state updates
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const cursorPosition = range?.startOffset || 0;
      
      setCurrentContent(newContent);
      
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

  const handleBlur = useCallback(() => {
    console.log('📝 InlineTextEditor handleBlur called');
    setIsEditing(false);
    
    // Clear actively typing flag and save any pending content
    if (editorRef.current) {
      editorRef.current.dataset.activelyTyping = 'false';
      
      // Clear safety timeout
      const timeoutId = editorRef.current.dataset.safetyClearTimeout;
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId));
        delete editorRef.current.dataset.safetyClearTimeout;
      }
      
      // Get the current content directly from the element
      const currentElementContent = editorRef.current.textContent || '';
      console.log('📝 Current element content on blur:', currentElementContent);
      console.log('📝 Stored current content:', currentContent);
      
      // Save any pending content that was deferred during typing
      if (editorRef.current.dataset.pendingContent) {
        const pendingContent = editorRef.current.dataset.pendingContent;
        console.log('📝 Saving pending content:', pendingContent);
        editorRef.current.dataset.lastSaveTime = Date.now().toString();
        onContentChange(pendingContent);
        delete editorRef.current.dataset.pendingContent;
      } else if (currentElementContent !== currentContent) {
        // If no pending content but element content differs, save the current element content
        console.log('📝 Saving current element content (no pending):', currentElementContent);
        editorRef.current.dataset.lastSaveTime = Date.now().toString();
        onContentChange(currentElementContent);
      }
    }
    
    onBlur();
    
    // Final save on blur
    if (autoSave.enabled) {
      debouncedSave.flush();
    }
  }, [onBlur, autoSave.enabled, debouncedSave, onContentChange, currentContent]);

  const handleInternalSelectionChange = useCallback(() => {
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
          // Save any pending content before blur
          if (editorRef.current?.dataset.pendingContent) {
            const pendingContent = editorRef.current.dataset.pendingContent;
            editorRef.current.dataset.lastSaveTime = Date.now().toString();
            onContentChange(pendingContent);
            delete editorRef.current.dataset.pendingContent;
          }
          editorRef.current?.blur();
        } else if (config.enterKeyBehavior === 'ignore') {
          e.preventDefault();
        }
        break;
        
      case 'Escape':
        if (config.escapeKeyBehavior === 'cancel') {
          e.preventDefault();
          setCurrentContent(content);
          if (editorRef.current) {
            editorRef.current.textContent = content;
            // Clear any pending content since we're canceling
            delete editorRef.current.dataset.pendingContent;
          }
          editorRef.current?.blur();
        } else if (config.escapeKeyBehavior === 'save') {
          e.preventDefault();
          // Save any pending content before blur
          if (editorRef.current?.dataset.pendingContent) {
            const pendingContent = editorRef.current.dataset.pendingContent;
            editorRef.current.dataset.lastSaveTime = Date.now().toString();
            onContentChange(pendingContent);
            delete editorRef.current.dataset.pendingContent;
          }
          editorRef.current?.blur();
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
  }, [config, content, formatState, applyFormat]);

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
        editorRef.current.textContent = content;
      } else {
        console.log('📝 Skipping content sync - likely user content echo or user is editing');
        // Just update our internal state to match the current DOM content
        if (currentElementContent !== currentContent) {
          setCurrentContent(currentElementContent);
        }
      }
    }
  }, [content, currentContent, isEditing]);

  // Apply initial format state
  useEffect(() => {
    if (editorRef.current) {
      applyFormat(formatState);
    }
  }, [formatState, applyFormat]);

  // Expose format application function for toolbar integration
  useEffect(() => {
    if (executeFormat) {
      executeFormat.current = applyFormat;
    }
  }, [executeFormat, applyFormat]);

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
      onClick={(e) => {
        console.log('📝 InlineTextEditor clicked');
        // Don't prevent default - we want normal click behavior
      }}
      className={`
        inline-text-editor outline-none transition-all duration-200
        ${isEditing ? 'ring-2 ring-blue-500 ring-opacity-50' : 'hover:bg-gray-50'}
        ${!isValid ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
        ${className}
      `}
      style={style}
      data-section-id={sectionId}
      data-element-key={elementKey}
      data-editing={isEditing}
      data-valid={isValid}
      role="textbox"
      aria-label={`Edit ${elementKey}`}
      aria-multiline={Element !== 'span'}
      aria-invalid={!isValid}
      tabIndex={0}
    >
      {currentContent || placeholder}
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