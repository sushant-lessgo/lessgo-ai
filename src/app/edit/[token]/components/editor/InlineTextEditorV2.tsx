// InlineTextEditorV2.tsx - Simplified Text Editor (Uncontrolled Pattern)
// Eliminates cursor jumping by using DOM as source of truth during editing

import React, { useRef, useState, useEffect } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

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
  multiline = false
}: InlineTextEditorV2Props) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLElement>(null);
  const originalContentRef = useRef<string>(content);

  const { setTextEditingMode, showToolbar, hideToolbar } = useEditStore();

  // Sync content from props to DOM when NOT editing
  // This prevents cursor jumping by avoiding updates during typing
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

      if (hasFormatting) {
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
    >
      {content || placeholder}
    </Element>
  );
}

// Export for backward compatibility
export default InlineTextEditorV2;
