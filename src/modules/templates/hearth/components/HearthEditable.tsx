'use client';

// src/modules/service/components/HearthEditable.tsx
// Minimal contenteditable wrapper for Hearth blocks. Wraps InlineTextEditorV2
// in `edit` mode (preserves <em> via preserveHtml=true); renders raw HTML in
// preview/published. No color tokens — caller controls styling via className/style.

import React from 'react';
import { InlineTextEditorV2 } from '@/app/edit/[token]/components/editor/InlineTextEditorV2';

type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';

interface HearthEditableProps {
  value: string;
  mode: 'edit' | 'preview' | 'published';
  sectionId: string;
  elementKey: string;
  as?: Tag;
  onSave?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  /** Save on Enter (headlines) vs newline (body). Default 'newline'. */
  enterBehavior?: 'save' | 'newline';
  /** Allow multi-line content (descriptions, ledes). Default false. */
  multiline?: boolean;
  /**
   * Treat this element as a button: in edit mode a single click SELECTS it (so
   * the element toolbar — with "Button Settings" / form connection — appears),
   * and a double click enters text editing. Without this, a single click would
   * focus the contenteditable and only ever show the text toolbar, so the form
   * connection flow is unreachable. Scope narrowly to actual button/CTA elements
   * — every other Hearth text element must keep single-click-to-edit.
   */
  isButton?: boolean;
}

export function HearthEditable({
  value,
  mode,
  sectionId,
  elementKey,
  as = 'span',
  onSave,
  className = '',
  style,
  placeholder = '',
  enterBehavior = 'newline',
  multiline = false,
  isButton = false,
}: HearthEditableProps) {
  const Tag = as;
  const isHtml = /<[^>]*>/.test(value || '');
  // Button mode: render a selectable (non-editing) element until double-clicked.
  const [editing, setEditing] = React.useState(false);

  if (mode === 'edit' && isButton && !editing) {
    // Selectable static button. Single click → global editor selection picks it
    // up as an 'element' (elementKey contains 'cta'/'button') → element toolbar
    // with "Button Settings". Double click → enter text editing.
    const buttonProps = {
      className: `${className} cursor-pointer`,
      style,
      'data-section-id': sectionId,
      'data-element-key': elementKey,
      role: 'button' as const,
      tabIndex: 0,
      title: 'Click for button settings · double-click to edit text',
      onDoubleClick: () => setEditing(true),
    };
    return isHtml ? (
      <Tag {...buttonProps} dangerouslySetInnerHTML={{ __html: value || placeholder }} />
    ) : (
      <Tag {...buttonProps}>{value || placeholder}</Tag>
    );
  }

  if (mode !== 'edit') {
    // Static render — preserve <em> via dangerouslySetInnerHTML when present.
    if (isHtml) {
      return (
        <Tag
          className={className}
          style={style}
          data-section-id={sectionId}
          data-element-key={elementKey}
          dangerouslySetInnerHTML={{ __html: value || placeholder }}
        />
      );
    }
    return (
      <Tag
        className={className}
        style={style}
        data-section-id={sectionId}
        data-element-key={elementKey}
      >
        {value || placeholder}
      </Tag>
    );
  }

  return (
    <InlineTextEditorV2
      content={value || ''}
      onContentChange={(next) => onSave?.(next)}
      element={as as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'}
      elementKey={elementKey}
      sectionId={sectionId}
      enterBehavior={enterBehavior}
      multiline={multiline}
      preserveHtml={true}
      className={className}
      style={style}
      placeholder={placeholder}
      // Button mode: this editor was mounted by a double-click, so focus
      // immediately, and on blur fall back to the selectable button view.
      autoFocus={isButton}
      onEditingChange={isButton ? (e) => { if (!e) setEditing(false); } : undefined}
    />
  );
}

export default HearthEditable;
