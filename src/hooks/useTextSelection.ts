// hooks/useTextSelection.ts - Text selection utilities for inline editor
import { useState, useCallback, useRef } from 'react';
import type { TextSelection, TextFormatState } from '@/app/edit/[token]/components/editor/InlineTextEditor';

export function useTextSelection(editorRef: React.RefObject<HTMLElement>) {
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const savedSelectionRef = useRef<TextSelection | null>(null);

  // Get current selection
  const getSelection = useCallback((): TextSelection | null => {
    if (!editorRef.current) return null;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const editor = editorRef.current;
    
    if (!editor.contains(range.commonAncestorContainer)) return null;
    
    return {
      start: getTextOffset(editor, range.startContainer, range.startOffset),
      end: getTextOffset(editor, range.endContainer, range.endOffset),
      text: range.toString(),
      isCollapsed: range.collapsed,
      containerElement: editor,
      range: range.cloneRange(),
    };
  }, [editorRef]);

  // Set selection by text offsets
  const setSelection = useCallback((start: number, end: number) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const range = document.createRange();
    
    const startPos = getNodeAndOffsetFromTextOffset(editor, start);
    const endPos = getNodeAndOffsetFromTextOffset(editor, end);
    
    if (startPos && endPos) {
      range.setStart(startPos.node, startPos.offset);
      range.setEnd(endPos.node, endPos.offset);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [editorRef]);

  // Get format at current selection
  const getFormatAtSelection = useCallback((): Partial<TextFormatState> => {
    const selection = getSelection();
    if (!selection || !editorRef.current) return {};
    
    const element = editorRef.current;
    const computedStyle = window.getComputedStyle(element);
    
    return {
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
  }, [getSelection, editorRef]);

  // Apply format to selection
  const applyFormatToSelection = useCallback((format: Partial<TextFormatState>) => {
    const selection = getSelection();
    if (!selection || !editorRef.current) return;
    
    const element = editorRef.current;
    
    // Apply format to entire element for now
    // In a more advanced implementation, this would wrap selected text in spans
    Object.entries(format).forEach(([key, value]) => {
      switch (key) {
        case 'bold':
          element.style.fontWeight = value ? 'bold' : 'normal';
          break;
        case 'italic':
          element.style.fontStyle = value ? 'italic' : 'normal';
          break;
        case 'underline':
          element.style.textDecoration = value ? 'underline' : 'none';
          break;
        case 'color':
          element.style.color = value as string;
          break;
        case 'fontSize':
          element.style.fontSize = value as string;
          break;
        case 'fontFamily':
          element.style.fontFamily = value as string;
          break;
        case 'textAlign':
          element.style.textAlign = value as string;
          break;
        case 'lineHeight':
          element.style.lineHeight = value as string;
          break;
        case 'letterSpacing':
          element.style.letterSpacing = value as string;
          break;
        case 'textTransform':
          element.style.textTransform = value as string;
          break;
      }
    });
  }, [getSelection, editorRef]);

  // Save and restore selection
  const saveSelection = useCallback(() => {
    const selection = getSelection();
    savedSelectionRef.current = selection;
    return selection;
  }, [getSelection]);

  const restoreSelection = useCallback((savedSelection?: TextSelection) => {
    const selectionToRestore = savedSelection || savedSelectionRef.current;
    if (selectionToRestore) {
      setSelection(selectionToRestore.start, selectionToRestore.end);
    }
  }, [setSelection]);

  // Event handlers
  const handleSelectionChange = useCallback(() => {
    const selection = getSelection();
    setCurrentSelection(selection);
  }, [getSelection]);

  // Select all text
  const selectAll = useCallback(() => {
    if (!editorRef.current) return;
    
    const textLength = editorRef.current.textContent?.length || 0;
    setSelection(0, textLength);
  }, [editorRef, setSelection]);

  // Select word at position
  const selectWordAtPosition = useCallback((position: number) => {
    if (!editorRef.current) return;
    
    const text = editorRef.current.textContent || '';
    const wordBoundary = /\b/g;
    const matches = [...text.matchAll(wordBoundary)];
    
    // Find word boundaries around position
    let start = 0;
    let end = text.length;
    
    for (let i = 0; i < matches.length - 1; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];
      
      if (currentMatch.index !== undefined && nextMatch.index !== undefined) {
        if (position >= currentMatch.index && position <= nextMatch.index) {
          start = currentMatch.index;
          end = nextMatch.index;
          break;
        }
      }
    }
    
    setSelection(start, end);
  }, [editorRef, setSelection]);

  // Collapse selection to start or end
  const collapseSelection = useCallback((toStart: boolean = true) => {
    const selection = getSelection();
    if (selection) {
      const position = toStart ? selection.start : selection.end;
      setSelection(position, position);
    }
  }, [getSelection, setSelection]);

  // Extend selection
  const extendSelection = useCallback((direction: 'forward' | 'backward', amount: number = 1) => {
    const selection = getSelection();
    if (!selection) return;
    
    if (direction === 'forward') {
      setSelection(selection.start, Math.min(selection.end + amount, editorRef.current?.textContent?.length || 0));
    } else {
      setSelection(Math.max(selection.start - amount, 0), selection.end);
    }
  }, [getSelection, setSelection, editorRef]);

  // Check if selection is at start or end
  const isSelectionAtStart = useCallback(() => {
    const selection = getSelection();
    return selection ? selection.start === 0 : false;
  }, [getSelection]);

  const isSelectionAtEnd = useCallback(() => {
    const selection = getSelection();
    const textLength = editorRef.current?.textContent?.length || 0;
    return selection ? selection.end === textLength : false;
  }, [getSelection, editorRef]);

  // Get selected text
  const getSelectedText = useCallback(() => {
    const selection = getSelection();
    return selection ? selection.text : '';
  }, [getSelection]);

  // Replace selected text
  const replaceSelectedText = useCallback((newText: string) => {
    const selection = getSelection();
    if (!selection || !editorRef.current) return;
    
    const element = editorRef.current;
    const currentText = element.textContent || '';
    
    const newContent = currentText.slice(0, selection.start) + newText + currentText.slice(selection.end);
    element.textContent = newContent;
    
    // Set cursor after inserted text
    const newCursorPosition = selection.start + newText.length;
    setSelection(newCursorPosition, newCursorPosition);
  }, [getSelection, setSelection, editorRef]);

  // Utility functions
  const getTextOffset = (container: Node, node: Node, offset: number): number => {
    let textOffset = 0;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentNode = walker.nextNode();
    while (currentNode && currentNode !== node) {
      textOffset += currentNode.textContent?.length || 0;
      currentNode = walker.nextNode();
    }
    
    return textOffset + offset;
  };

  const getNodeAndOffsetFromTextOffset = (container: Node, textOffset: number): { node: Node; offset: number } | null => {
    let currentOffset = 0;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentNode = walker.nextNode();
    while (currentNode) {
      const nodeLength = currentNode.textContent?.length || 0;
      if (currentOffset + nodeLength >= textOffset) {
        return {
          node: currentNode,
          offset: textOffset - currentOffset,
        };
      }
      currentOffset += nodeLength;
      currentNode = walker.nextNode();
    }
    
    return null;
  };

  return {
    // State
    currentSelection,
    
    // Core functions
    getSelection,
    setSelection,
    getFormatAtSelection,
    applyFormatToSelection,
    
    // Selection management
    saveSelection,
    restoreSelection,
    selectAll,
    selectWordAtPosition,
    collapseSelection,
    extendSelection,
    
    // Selection queries
    isSelectionAtStart,
    isSelectionAtEnd,
    getSelectedText,
    
    // Text manipulation
    replaceSelectedText,
    
    // Event handlers
    handleSelectionChange,
  };
}