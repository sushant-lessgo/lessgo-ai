// src/modules/templates/vestria/blocks/primitives.ts
// Single-source block contract (granth pattern). A block's LAYOUT lives once in a
// `.core.tsx` (plain module, no directive, flat props) that renders through these
// injected primitives. The edit wrapper injects editable primitives (editPrimitives)
// backed by VestriaEditable / the store; the published wrapper injects static
// primitives (publishedPrimitives) that emit plain tags. Parity is by construction.
//
// This file is TYPES ONLY (plain module) — imported by the core AND both primitive
// implementations. The core imports nothing else from the edit/published side.

import type React from 'react';

export type VestriaTag =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'p' | 'span' | 'div' | 'small' | 'label' | 'blockquote' | 'cite' | 'b';

/** Editable/static text field. `elementKey` may be a scalar key ('headline') or a
 *  collection-item path ('items.<id>.title'). */
export interface VestriaTxtProps {
  elementKey: string;
  value?: string;
  as?: VestriaTag;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  /** CTA / button semantics (edit: single-click selects, double-click edits). */
  isButton?: boolean;
}

/** Image slot. Edit renders an upload affordance; published renders <img> (or the
 *  `placeholder` node when empty — e.g. the hatched CSS placeholder). */
export interface VestriaImgProps {
  elementKey: string;
  src?: string;
  alt?: string;
  className?: string;     // wrapper
  imgClassName?: string;  // the <img>
  placeholder?: React.ReactNode;
  /** Above-fold/LCP image: render loading="eager". Default (omitted) = lazy. */
  eager?: boolean;
}

/** Outbound/anchor link. `hrefKey` is where the href STRING is stored (scalar key
 *  or collection path); `href` is its current value. Edit shows a LinkTargetPopover
 *  next to the children; published emits <a href> (+ target=_blank for http[s]). */
export interface VestriaLinkProps {
  hrefKey: string;
  href?: string;
  className?: string;
  external?: boolean;
  ariaLabel?: string;
  children?: React.ReactNode;
}

/** Repeatable collection. `render(item, index)` returns the item markup (built from
 *  the other primitives with item-scoped paths). Edit adds add/remove chrome. */
export interface VestriaListProps {
  collectionKey: string;
  items: any[];
  render: (item: any, index: number) => React.ReactNode;
  /** Factory for a new blank item (edit "add"); omit to disable adding. */
  makeItem?: () => any;
  min?: number;
  max?: number;
  addLabel?: string;
  className?: string;     // wrapper (the grid/row)
  itemClassName?: string;
  // editor phase-3 (phase 6) — imageCollection declarations. The slot DECLARES the
  // capability; the primitive IMPLEMENTS it (templates declare, never implement).
  /** Enable drag-reorder of items (delegates the edit chrome to
   *  EditableImageCollection). Order is the array order in both renderers. */
  reorderable?: boolean;
  /** The item field bulk-upload writes the returned URL into (e.g. 'image').
   *  Declaring it turns the edit List into an imageCollection editor. */
  imageField?: string;
  /** Optional per-item caption field (item-stored, whole-array write). When set,
   *  the edit chrome shows a caption input per item. */
  captionField?: string;
}

export interface VestriaPrimitives {
  Txt: React.FC<VestriaTxtProps>;
  Img: React.FC<VestriaImgProps>;
  Link: React.FC<VestriaLinkProps>;
  List: React.FC<VestriaListProps>;
}
