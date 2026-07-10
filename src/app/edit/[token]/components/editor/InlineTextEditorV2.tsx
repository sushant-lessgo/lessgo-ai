// InlineTextEditorV2.tsx - Simplified Text Editor (Uncontrolled Pattern)
// Eliminates cursor jumping by using DOM as source of truth during editing

import React, { useRef, useState, useEffect } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

// Place the caret at the end of a contenteditable element.
function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export interface InlineTextEditorV2Props {
  content: string;
  onContentChange: (content: string) => void;
  element: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  elementKey: string;
  sectionId: string;
  enterBehavior?: 'save' | 'newline';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  backgroundType?: string;
  colorTokens?: any;
  sectionBackground?: string;
  multiline?: boolean;
  /**
   * When true, always persist `innerHTML` so inline tags (e.g. `<em>`) survive
   * a save round-trip. Default false preserves existing product-block behavior
   * (textContent fallback unless span[style] formatting is present).
   */
  preserveHtml?: boolean;
  /**
   * Focus + enter editing on mount. Used by callers that gate editing behind a
   * separate gesture (e.g. Hearth button elements that select on single-click
   * and edit on double-click). Default false — zero change for existing callers.
   */
  autoFocus?: boolean;
  /** Notified when editing starts/ends (focus/blur). Optional. */
  onEditingChange?: (editing: boolean) => void;
}

export function InlineTextEditorV2({
  content,
  onContentChange,
  element: Element,
  elementKey,
  sectionId,
  enterBehavior = 'newline',
  className = '',
  style = {},
  placeholder = 'Click to edit',
  backgroundType,
  colorTokens,
  sectionBackground,
  multiline = false,
  preserveHtml = false,
  autoFocus = false,
  onEditingChange
}: InlineTextEditorV2Props) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLElement>(null);
  const originalContentRef = useRef<string>(content);

  const setTextEditingMode = useEditStore((s) => s.setTextEditingMode);
  const showToolbar = useEditStore((s) => s.showToolbar);
  const hideToolbar = useEditStore((s) => s.hideToolbar);

  // Auto-enter editing on mount when requested (double-click → edit gesture).
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync content from props to DOM when NOT editing.
  // The DOM is the single source of truth: the element renders NO React children
  // (see JSX below) — content is only ever written imperatively here. Rendering
  // `{content}` as a text child let React re-render mid-edit (e.g. after a
  // toolbar formatting write to the store) and replace the formatted DOM with
  // the raw HTML string as literal text — the `<span style=…>` corruption bug.
  useEffect(() => {
    if (!isEditing && editorRef.current) {
      const isHtml = /<[^>]*>/g.test(content);
      if (isHtml) {
        editorRef.current.innerHTML = content;
      } else {
        editorRef.current.textContent = content;
      }
      originalContentRef.current = content;
    }
  }, [content, isEditing]);

  // Normalize HTML for multiline content
  const normalizeMultilineHTML = (html: string) => {
    return html
      .replace(/<br\s*\/?>/gi, '<br>')           // normalize <br/>
      .replace(/<(div|p)><br><\/\1>/gi, '<br>') // empty lines
      .replace(/<(div|p)>/gi, '<br>')           // convert blocks to <br>
      .replace(/<\/(div|p)>/gi, '')             // remove closing tags
      .replace(/^<br>/, '');                    // remove leading break
  };

  // Save content to store
  const saveContent = () => {
    if (!editorRef.current) return;

    try {
      const html = editorRef.current.innerHTML;
      const hasFormatting = !!editorRef.current.querySelector('span[style]');
      const shouldPreserveStructure = multiline;

      let finalContent: string;

      if (preserveHtml) {
        finalContent = html;
      } else if (hasFormatting) {
        finalContent = html;
      } else if (shouldPreserveStructure &&
                 (html.includes('<br') || html.includes('<div') || html.includes('<p'))) {
        finalContent = normalizeMultilineHTML(html);
      } else {
        finalContent = editorRef.current.textContent || '';
      }

      // Only save if content changed
      if (finalContent !== originalContentRef.current) {
        onContentChange(finalContent);
        originalContentRef.current = finalContent;
      }
    } catch (error) {
      console.error('Error saving content:', error);
      // Keep content in DOM even if save fails
    }
  };

  // Enter editing mode
  const handleFocus = () => {
    setIsEditing(true);
    setTextEditingMode(true, { sectionId, elementKey });
    onEditingChange?.(true);

    // When editing was entered programmatically (autoFocus), the element wasn't
    // contenteditable at focus time, so the browser places no caret. Drop one at
    // the end. Only for autoFocus — normal clicks should keep the clicked caret.
    if (autoFocus && editorRef.current) {
      requestAnimationFrame(() => {
        if (editorRef.current) placeCaretAtEnd(editorRef.current);
      });
    }

    // Show toolbar
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 60
      };
      showToolbar('text', `${sectionId}.${elementKey}`, position);
    }
  };

  // Exit editing mode
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    // Don't exit if clicking on toolbar
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('[data-toolbar-type="text"]')) {
      return;
    }

    saveContent();
    setIsEditing(false);
    setTextEditingMode(false);
    onEditingChange?.(false);
    hideToolbar();
  };

  // Handle paste - strip formatting to plain text
  const handlePaste = (e: React.ClipboardEvent<HTMLElement>) => {
    e.preventDefault();

    // Get plain text from clipboard
    const text = e.clipboardData.getData('text/plain');

    // Insert at cursor position
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    selection.deleteFromDocument();
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    // Move cursor to end of inserted text
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    // Enter key behavior (save for headlines, newline for text)
    if (e.key === 'Enter' && enterBehavior === 'save') {
      e.preventDefault();
      saveContent();
      editorRef.current?.blur();
      return;
    }

    // ESC key - cancel and restore original
    if (e.key === 'Escape') {
      e.preventDefault();
      if (editorRef.current) {
        const isHtml = /<[^>]*>/g.test(originalContentRef.current);
        if (isHtml) {
          editorRef.current.innerHTML = originalContentRef.current;
        } else {
          editorRef.current.textContent = originalContentRef.current;
        }
      }
      editorRef.current?.blur();
      return;
    }
  };

  // Dynamic styles for editing indicator
  const editingStyles: React.CSSProperties = isEditing
    ? {
        outline: '2px solid rgb(59 130 246)',
        outlineOffset: '2px',
        borderRadius: '4px',
        ...style
      }
    : style;

  return (
    <Element
      ref={editorRef as any}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onClick={() => {
        // Make element editable on click if not already editing
        if (!isEditing && editorRef.current) {
          editorRef.current.focus();
        }
      }}
      className={`inline-text-editor-v2 ${className} ${
        isEditing ? 'editing' : 'cursor-pointer hover:bg-opacity-10'
      }`}
      style={editingStyles}
      data-section-id={sectionId}
      data-element-key={elementKey}
      data-editing={isEditing}
      role="textbox"
      aria-label={`Edit ${elementKey}`}
      aria-multiline={Element !== 'span'}
      tabIndex={0}
    />
  );
}

// Export for backward compatibility
export default InlineTextEditorV2;
