'use client';

// src/modules/templates/vestria/components/VestriaEditable.tsx
// Contenteditable wrapper for Vestria blocks. Given the block's content object +
// an element key, it reads/writes that key directly. Wraps InlineTextEditorV2 in
// `edit` (preserves inline HTML — <em> hero accents); static HTML otherwise.
// No colour tokens — caller controls styling via className/style.
// Direct clone of the Granth editable (single-source pattern).

import React from 'react';
import { InlineTextEditorV2 } from '@/app/edit/[token]/components/editor/InlineTextEditorV2';
import { useIsElementExcluded } from '../../shared/elementExclusion';

type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'small' | 'label' | 'blockquote' | 'cite' | 'b';

interface VestriaEditableProps {
  /** The block's resolved content object. */
  content: Record<string, any>;
  /** Element key to read/write (e.g. 'headline', 'lede'). */
  elementKey: string;
  mode: 'edit' | 'preview' | 'published';
  sectionId: string;
  /** Called with (key, value) — caller routes to the store. */
  onSave?: (key: string, value: string) => void;
  as?: Tag;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  enterBehavior?: 'save' | 'newline';
  multiline?: boolean;
  /**
   * Treat as a button: single click SELECTS (element toolbar / Button Settings),
   * double click edits text.
   */
  isButton?: boolean;
}

export function VestriaEditable({
  content,
  elementKey,
  mode,
  sectionId,
  onSave,
  as = 'span',
  className = '',
  style,
  placeholder = '',
  enterBehavior = 'newline',
  multiline = false,
  isButton = false,
}: VestriaEditableProps) {
  const Tag = as;
  const value = (content?.[elementKey] ?? '') as string;
  const isHtml = /<[^>]*>/.test(value || '');
  const [editing, setEditing] = React.useState(false);
  const isElExcluded = useIsElementExcluded(sectionId, elementKey);
  if (mode === 'edit' && isElExcluded) return null;

  // Button mode: selectable (non-editing) until double-clicked.
  if (mode === 'edit' && isButton && !editing) {
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
    // Static render. Preserve inline HTML (<em> accents etc.).
    const shown = value || placeholder;
    const common = {
      className,
      style,
      'data-section-id': sectionId,
      'data-element-key': elementKey,
    };
    return /<[^>]*>/.test(shown || '') ? (
      <Tag {...common} dangerouslySetInnerHTML={{ __html: shown }} />
    ) : (
      <Tag {...common}>{shown}</Tag>
    );
  }

  return (
    <InlineTextEditorV2
      content={value || ''}
      onContentChange={(next) => onSave?.(elementKey, next)}
      element={(as === 'small' || as === 'label' || as === 'blockquote' || as === 'cite' || as === 'b' ? (as === 'b' ? 'span' : 'p') : as) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'}
      elementKey={elementKey}
      sectionId={sectionId}
      enterBehavior={enterBehavior}
      multiline={multiline}
      preserveHtml={true}
      className={className}
      style={style}
      placeholder={placeholder}
      autoFocus={isButton}
      onEditingChange={isButton ? (e) => { if (!e) setEditing(false); } : undefined}
    />
  );
}

export default VestriaEditable;
