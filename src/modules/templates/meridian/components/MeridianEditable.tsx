'use client';

// src/modules/templates/meridian/components/MeridianEditable.tsx
// Minimal contenteditable wrapper for Meridian blocks. Near-copy of
// HearthEditable — intentionally NOT cross-imported from hearth/* so Meridian's
// async chunk stays self-contained. Wraps InlineTextEditorV2 in `edit` mode
// (preserves <em> via preserveHtml=true); renders raw HTML in preview/published.
// No color tokens — caller controls styling via className/style. The Meridian
// accent-<em> convention (upright + accent color) is handled by the
// [data-palette] em rule injected by MeridianThemeInjector/SSRTokens.

import React from 'react';
import { InlineTextEditorV2 } from '@/app/edit/[token]/components/editor/InlineTextEditorV2';
import { useIsElementExcluded } from '../../shared/elementExclusion';

type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';

interface MeridianEditableProps {
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
   * connection flow is unreachable. Scope narrowly to actual button/CTA elements.
   */
  isButton?: boolean;
}

export function MeridianEditable({
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
}: MeridianEditableProps) {
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
      autoFocus={isButton}
      onEditingChange={isButton ? (e) => { if (!e) setEditing(false); } : undefined}
    />
  );
}

export default MeridianEditable;
