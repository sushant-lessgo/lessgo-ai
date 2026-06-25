'use client';

// src/modules/templates/lex/components/LexEditable.tsx
// COPY of HearthEditable (Phase 11a / A2 — copy-first, not extract-to-shared).
// LOGIC-IDENTICAL to the Hearth version: this component has no template-specific
// styling (the caller controls all styling via className/style), so the copy is
// byte-for-byte. That identity IS the genericity test — if it ever needs to
// diverge for Lex, log the divergence in phase11aArchitectureGaps.md. A shared
// template-kit extraction is tracked as a post-Phase-11 cleanup.

import React from 'react';
import { InlineTextEditorV2 } from '@/app/edit/[token]/components/editor/InlineTextEditorV2';
import { useIsElementExcluded } from '../../shared/elementExclusion';

type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';

interface LexEditableProps {
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
   * — every other Lex text element must keep single-click-to-edit.
   */
  isButton?: boolean;
}

export function LexEditable({
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
}: LexEditableProps) {
  const Tag = as;
  const isHtml = /<[^>]*>/.test(value || '');
  // Button mode: render a selectable (non-editing) element until double-clicked.
  const [editing, setEditing] = React.useState(false);
  const isElExcluded = useIsElementExcluded(sectionId, elementKey);
  if (mode === 'edit' && isElExcluded) return null;

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

export default LexEditable;
