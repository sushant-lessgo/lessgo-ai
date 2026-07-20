// src/modules/cms/render/primitives.ts
// TYPES ONLY (plain module, zero runtime). The CMS block's LAYOUT lives ONCE in
// `CollectionSection.core.tsx` and renders through these injected primitives `E`;
// the edit wrapper injects edit primitives, the published wrapper injects static
// ones. Parity is by construction — the same core emits both trees.
//
// Deliberately NOT importing `src/modules/skeletons/work/blocks/primitives.ts`:
// the SHAPE is copied (WorkPrimitives is the proven model), the dependency is
// not — the CMS core must stay self-contained and free of skeleton coupling.
//
// Difference from WorkPrimitives: CMS items are authored in the CMS UI, never
// inline-contentEditable, so there is no `elementKey` write-path — primitives are
// pure emitters. That is what makes editor↔published parity trivially true here.

import type React from 'react';

export type CmsTag =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'p' | 'span' | 'div' | 'small' | 'time' | 'li';

/** Static text. Renders nothing when `value` is empty (empty values are already
 *  dropped upstream by toRenderModel — this is belt-and-braces). */
export interface CmsTxtProps {
  value?: string;
  as?: CmsTag;
  className?: string;
  /** Render `value` as multi-line prose (text_long): preserves newlines. */
  multiline?: boolean;
}

/** Image slot. `src` is ALREADY narrow-predicate sanitized by toRenderModel. */
export interface CmsImgProps {
  src?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  /** Above-the-fold hint → loading="eager". Default (omitted) = lazy. */
  eager?: boolean;
}

/** Anchor. `href` is ALREADY wide-predicate sanitized by toRenderModel.
 *  Edit renders it inert; published renders the real destination. */
export interface CmsLinkProps {
  href?: string;
  className?: string;
  /** Marks the collection's `primaryCta` role → published CTA beacon attrs. */
  isPrimaryCta?: boolean;
  ariaLabel?: string;
  children?: React.ReactNode;
}

/** Repeatable region (groups, items, gallery frames, tags). Read-only in both
 *  modes — items are added/removed in the CMS panel, never in the canvas. */
export interface CmsListProps {
  items: ReadonlyArray<unknown>;
  render: (item: any, index: number) => React.ReactNode;
  /** Key extractor; falls back to the index. */
  keyOf?: (item: any, index: number) => string;
  className?: string;
  itemClassName?: string;
  /** Wrapper/item tag pair (e.g. 'ul'/'li' for tags). Defaults to div/div. */
  as?: 'div' | 'ul' | 'ol';
  itemAs?: 'div' | 'li';
}

export interface CmsPrimitives {
  Txt: React.FC<CmsTxtProps>;
  Img: React.FC<CmsImgProps>;
  Link: React.FC<CmsLinkProps>;
  List: React.FC<CmsListProps>;
}
