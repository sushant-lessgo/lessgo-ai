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
}: HearthEditableProps) {
  const Tag = as;
  const isHtml = /<[^>]*>/.test(value || '');

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
    />
  );
}

export default HearthEditable;
