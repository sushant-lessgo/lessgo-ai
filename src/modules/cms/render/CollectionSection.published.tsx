// src/modules/cms/render/CollectionSection.published.tsx
//
// CMS collection block — PUBLISHED twin. Server-safe: no 'use client', no hooks,
// no store, flat props. Imports ONLY the shared core + plain modules (the
// published/client boundary law — importing anything 'use client' here yields the
// classic "F is not a function" 500 at static-export time).
//
// Props arrive FLAT: LandingPagePublishedRenderer's `extractContentFields` spreads
// `content[sectionId].elements` straight onto props, so the materialized model
// lands on `props[CMS_MODEL_ELEMENT_KEY]`. There is deliberately NO nested `data`
// prop.
//
// The model is produced by the publish materializer (phase 3) from the SAME
// `toRenderModel()` the editor uses — already URL-sanitized, already
// coercion-proof. This file only emits static tags.

import React from 'react';
import { externalLinkProps } from '@/utils/resolveCtaHref';
import type {
  CmsPrimitives,
  CmsTxtProps,
  CmsImgProps,
  CmsLinkProps,
  CmsListProps,
} from './primitives';
import { CollectionSectionCore } from './CollectionSection.core';
import { CMS_MODEL_ELEMENT_KEY, type CmsRenderModel } from './toRenderModel';

/** Static emitters. Same tags/classes as the edit twin — the core guarantees the
 *  tree, these guarantee the leaves. */
export function makeCmsPublishedPrimitives(): CmsPrimitives {
  const Txt: React.FC<CmsTxtProps> = ({ value, as = 'span', className, multiline }) => {
    if (!value) return null;
    const Tag = as as any;
    return (
      <Tag className={className} style={multiline ? { whiteSpace: 'pre-wrap' } : undefined}>
        {value}
      </Tag>
    );
  };

  const Img: React.FC<CmsImgProps> = ({ src, alt, className, imgClassName, eager }) => (
    <span className={className}>
      {src ? (
        <img
          src={src}
          alt={alt || ''}
          className={imgClassName}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : null}
    </span>
  );

  const Link: React.FC<CmsLinkProps> = ({ href, className, isPrimaryCta, ariaLabel, children }) => {
    const target = href || '#';
    // CTA beacon attrs on the primaryCta role only (StoreBadges/FollowStrip
    // convention); ordinary content links are not conversion events.
    const ctaAttrs = isPrimaryCta
      ? { 'data-lessgo-cta': '', 'data-lessgo-cta-role': 'primary' }
      : {};
    return (
      <a
        href={target}
        className={className}
        aria-label={ariaLabel}
        {...externalLinkProps(target)}
        {...ctaAttrs}
      >
        {children}
      </a>
    );
  };

  const List: React.FC<CmsListProps> = ({
    items,
    render,
    keyOf,
    className,
    itemClassName,
    as = 'div',
    itemAs = 'div',
  }) => {
    const Wrap = as as any;
    const Item = itemAs as any;
    return (
      <Wrap className={className}>
        {items.map((item, i) => (
          <Item key={keyOf ? keyOf(item, i) : String(i)} className={itemClassName}>
            {render(item, i)}
          </Item>
        ))}
      </Wrap>
    );
  };

  return { Txt, Img, Link, List };
}

/** An empty-but-valid model: an unknown/deleted collectionId renders an empty
 *  block rather than failing the publish. */
export const EMPTY_CMS_MODEL: CmsRenderModel = {
  collectionId: '',
  collectionName: '',
  collectionRef: '',
  detailPages: false,
  layoutHint: null,
  roles: { title: null, cover: null, primaryCta: null },
  groups: [],
};

interface Props {
  sectionId: string;
  /** The materialized render model. Key MUST equal CMS_MODEL_ELEMENT_KEY —
   *  spelled literally here because an interface computed key can't carry a
   *  doc-comment cleanly; the runtime read below uses the constant. */
  cmsModel?: CmsRenderModel;
  collectionId?: string;
  [key: string]: any;
}

export default function CollectionSectionPublished(props: Props) {
  const E = makeCmsPublishedPrimitives();
  const model = (props[CMS_MODEL_ELEMENT_KEY] as CmsRenderModel) || EMPTY_CMS_MODEL;
  return <CollectionSectionCore model={model} E={E} sectionId={props.sectionId} />;
}
