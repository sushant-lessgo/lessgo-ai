/**
 * TextPublished - Pure server-safe text rendering components
 *
 * @remarks
 * - NO HOOKS - Pure React components only
 * - NO imports from editor components
 * - Server-safe for renderToString
 * - Supports rich text with dangerouslySetInnerHTML
 *
 * Usage: Replace EditableAdaptiveHeadline/Text in *Published functions
 */

import React from 'react';

interface HeadlinePublishedProps {
  value: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * HeadlinePublished - Pure headline renderer
 * Replaces EditableAdaptiveHeadline in published mode
 */
export function HeadlinePublished({
  value,
  level = 'h1',
  className = '',
  style
}: HeadlinePublishedProps) {
  const Element = level;
  const containsHTML = typeof value === 'string' && /<[^>]+>/.test(value);

  // If headline contains block HTML (unusual but possible), wrap in div to prevent invalid nesting
  if (containsHTML) {
    return (
      <div className={className} style={style}>
        <div dangerouslySetInnerHTML={{ __html: value }} suppressHydrationWarning={true} />
      </div>
    );
  }

  return <Element className={className} style={style}>{value}</Element>;
}

interface TextPublishedProps {
  value: string;
  element?: 'p' | 'span' | 'div';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * TextPublished - Pure text renderer
 * Replaces EditableAdaptiveText in published mode
 */
export function TextPublished({
  value,
  element = 'p',
  className = '',
  style
}: TextPublishedProps) {
  // Detect if content contains HTML tags
  const containsHTML = typeof value === 'string' && /<[^>]+>/.test(value);

  // Auto-correct: if content has HTML, use div wrapper (not p) to prevent invalid nesting
  const Element = containsHTML ? 'div' : element;

  // Handle HTML content (from rich text editor)
  if (containsHTML) {
    return (
      <Element
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: value }}
        suppressHydrationWarning={true}
      />
    );
  }

  return <Element className={className} style={style}>{value}</Element>;
}
