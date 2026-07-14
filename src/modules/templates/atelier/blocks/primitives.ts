// src/modules/templates/atelier/blocks/primitives.ts
// Single-source block contract (vestria/granth pattern). A block's LAYOUT lives
// once in a `.core.tsx` (plain module, no directive, flat props) that renders
// through these injected primitives. The edit wrapper injects editable primitives
// (editPrimitives); the published wrapper injects static primitives
// (publishedPrimitives). Parity is by construction.
//
// TYPES ONLY (plain module) — imported by the core AND both primitive
// implementations. The core imports nothing else from the edit/published side.

import type React from 'react';

export type AtelierTag =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'p' | 'span' | 'div' | 'small' | 'label' | 'blockquote' | 'cite' | 'b';

export interface AtelierTxtProps {
  elementKey: string;
  value?: string;
  as?: AtelierTag;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  isButton?: boolean;
}

export interface AtelierImgProps {
  elementKey: string;
  src?: string;
  alt?: string;
  className?: string;     // wrapper
  imgClassName?: string;  // the <img>
  placeholder?: React.ReactNode;
  /** Above-fold/LCP image: render loading="eager". Default (omitted) = lazy. */
  eager?: boolean;
}

export interface AtelierLinkProps {
  hrefKey: string;
  href?: string;
  className?: string;
  external?: boolean;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export interface AtelierListProps {
  collectionKey: string;
  items: any[];
  render: (item: any, index: number) => React.ReactNode;
  makeItem?: () => any;
  min?: number;
  max?: number;
  addLabel?: string;
  className?: string;     // wrapper (the grid/row)
  itemClassName?: string;
  /** Enable drag-reorder of items (delegates edit chrome to EditableImageCollection). */
  reorderable?: boolean;
  /** The item field bulk-upload writes the returned URL into (turns the List into
   *  an imageCollection editor). */
  imageField?: string;
  /** Optional per-item caption field. */
  captionField?: string;
}

export interface AtelierPrimitives {
  Txt: React.FC<AtelierTxtProps>;
  Img: React.FC<AtelierImgProps>;
  Link: React.FC<AtelierLinkProps>;
  List: React.FC<AtelierListProps>;
}
