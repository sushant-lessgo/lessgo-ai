// src/modules/skeletons/work/blocks/primitives.ts
// Single-source block contract (granth pattern, verbatim). A block's LAYOUT lives
// ONCE in a `.core.tsx` (plain module, no directive, flat props) that renders
// through these injected primitives `E`. The edit wrapper injects `editPrimitives`
// (contentEditable + attribute-driven, store-backed); the published wrapper
// injects `makePublishedPrimitives()` (static tags). Parity is by construction.
//
// This file is TYPES ONLY (plain module) — imported by the core AND both primitive
// implementations. It imports NOTHING from the edit/published side, so the core
// never crosses the client/server boundary.
//
// Work-skeleton ADDS two primitives to the granth set: `Logo` and `Nav` — the
// shared logo/menu primitives (toolbarPlan open-Q#1), built once, attribute-driven,
// zero renegade UI.

import type React from 'react';

export type WorkTag =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'p' | 'span' | 'div' | 'small' | 'label' | 'blockquote' | 'cite' | 'b';

/** Editable/static text field. `elementKey` may be a scalar key ('headline') or a
 *  collection-item path ('items.<id>.title'). */
export interface WorkTxtProps {
  elementKey: string;
  value?: string;
  as?: WorkTag;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  /** CTA / button semantics (edit: single-click selects, double-click edits). */
  isButton?: boolean;
}

/** Image slot. Edit renders an upload affordance; published renders <img> (or the
 *  `placeholder` node when empty). */
export interface WorkImgProps {
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
 *  or collection path); `href` is its current value. */
export interface WorkLinkProps {
  hrefKey: string;
  href?: string;
  className?: string;
  external?: boolean;
  ariaLabel?: string;
  children?: React.ReactNode;
}

/** Repeatable collection. `render(item, index)` returns the item markup (built from
 *  the other primitives with item-scoped paths). Edit adds add/remove chrome. */
export interface WorkListProps {
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
}

/** Site logo (image-or-text), wrapped in a home link. Attribute-driven: renders the
 *  editable image OR editable text through the shared Img/Txt primitives + a Link
 *  to the home href — NO bespoke upload button or popover. `imageKey`/`textKey`
 *  are the stored element keys; `hrefKey`/`href` the home link target. */
export interface WorkLogoProps {
  /** Element key holding the logo image src. */
  imageKey: string;
  /** Element key holding the wordmark text (shown when no image). */
  textKey: string;
  src?: string;
  text?: string;
  /** Home link. Defaults to '/' when omitted. */
  hrefKey?: string;
  href?: string;
  className?: string;      // wrapper anchor
  imgClassName?: string;
  textClassName?: string;
  alt?: string;
}

/** Navigation menu — renders a `nav_links` collection as a row of Links. Pure
 *  attribute emitter over the shared List/Link/Txt primitives; NO NavigationEditor.
 *  `labelField`/`hrefField` name the item fields (default 'label' / 'href'). */
export interface WorkNavProps {
  collectionKey: string;
  items: any[];
  labelField?: string;
  hrefField?: string;
  className?: string;      // the <nav>/<ul> wrapper
  itemClassName?: string;  // each link wrapper
  linkClassName?: string;  // the anchor
  makeItem?: () => any;
  min?: number;
  max?: number;
  addLabel?: string;
}

/** Boolean flag affordance for a content key (e.g. a package's "most booked"
 *  chip). The core renders the VISIBLE output (the chip) from `value`; `Toggle`
 *  only supplies the edit-mode click-to-flip control and renders no visible
 *  output of its own. Edit adds a zero-layout floating control (absolute,
 *  opacity:0 until hover — same `EDIT_AFFORDANCE_STYLES` idiom as the image/list
 *  chrome) so the edit render adds NO in-flow node the published Toggle lacks;
 *  published renders only `children` (usually nothing). The stored flag is the
 *  string `'true'` when on, `''` when off. */
export interface WorkToggleProps {
  /** Content key holding the flag (scalar key or collection-item path). */
  elementKey: string;
  /** Current on/off state (the core derives it from the stored `'true'`/`''`). */
  value?: boolean;
  /** Label shown on the edit affordance. */
  label?: string;
  /** Extra className merged onto the edit affordance control. */
  className?: string;
  /** Visible content the toggle annotates; rendered identically in both modes. */
  children?: React.ReactNode;
}

export interface WorkPrimitives {
  Txt: React.FC<WorkTxtProps>;
  Img: React.FC<WorkImgProps>;
  Link: React.FC<WorkLinkProps>;
  List: React.FC<WorkListProps>;
  Logo: React.FC<WorkLogoProps>;
  Nav: React.FC<WorkNavProps>;
  Toggle: React.FC<WorkToggleProps>;
}
