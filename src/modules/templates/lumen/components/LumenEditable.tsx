'use client';

// src/modules/templates/lumen/components/LumenEditable.tsx
// Contenteditable wrapper for Lumen blocks — LANGUAGE-AWARE. Given the block's
// content object + a BASE element key + the active edit-language, it reads/writes
// the right twin key (`key` in EN, `key_nl` in NL) and, in non-edit (preview),
// emits both data-en / data-nl so the live toggle works. Wraps InlineTextEditorV2
// in `edit` (preserves <em> via preserveHtml); static HTML otherwise.
// No color tokens — caller controls styling via className/style.

import React from 'react';
import { InlineTextEditorV2 } from '@/app/edit/[token]/components/editor/InlineTextEditorV2';
import { useIsElementExcluded } from '../../shared/elementExclusion';
import { langKey, bilingualAttrs, type LumenLang } from '../i18nKeys';

type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'small' | 'label';

interface LumenEditableProps {
  /** The block's resolved content object (holds both `key` and `key_nl`). */
  content: Record<string, any>;
  /** BASE element key (e.g. 'headline'); the NL twin is `${elementKey}_nl`. */
  elementKey: string;
  mode: 'edit' | 'preview' | 'published';
  sectionId: string;
  editLang: LumenLang;
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
   * double click edits text. Button config attaches to the BASE key, so callers
   * should pass `isButton={editLang === 'en'}` for CTAs (settings edited in EN).
   */
  isButton?: boolean;
}

export function LumenEditable({
  content,
  elementKey,
  mode,
  sectionId,
  editLang,
  onSave,
  as = 'span',
  className = '',
  style,
  placeholder = '',
  enterBehavior = 'newline',
  multiline = false,
  isButton = false,
}: LumenEditableProps) {
  const Tag = as;
  const enValue = (content?.[elementKey] ?? '') as string;
  const nlValue = (content?.[`${elementKey}_nl`] ?? '') as string;
  const activeKey = langKey(elementKey, editLang);
  const value = (content?.[activeKey] ?? '') as string;

  const isHtml = /<[^>]*>/.test(value || '');
  const [editing, setEditing] = React.useState(false);
  const isElExcluded = useIsElementExcluded(sectionId, elementKey);
  if (mode === 'edit' && isElExcluded) return null;

  // Button mode: selectable (non-editing) until double-clicked. data-element-key
  // is the BASE key so Button Settings targets the language-agnostic config.
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
    // Static render — emit BOTH languages (data-en/data-nl) for the live toggle;
    // visible content = the active language (EN in published). Preserve <em>.
    const attrs = bilingualAttrs(enValue, nlValue);
    const shown = value || enValue || placeholder;
    const common = {
      className,
      style,
      'data-section-id': sectionId,
      'data-element-key': elementKey,
      ...attrs,
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
      onContentChange={(next) => onSave?.(activeKey, next)}
      element={(as === 'small' || as === 'label' ? 'span' : as) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'}
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

export default LumenEditable;
