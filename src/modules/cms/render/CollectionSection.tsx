'use client';

// src/modules/cms/render/CollectionSection.tsx
//
// CMS collection block — EDIT twin. Renders the SAME `CollectionSection.core`
// through edit primitives, so the canvas shows exactly what publish will emit.
//
// Items are NOT inline-contentEditable: CMS content is authored in the CMS panel
// (schema builder + item editor), never by typing into the canvas. That is a
// deliberate parity simplification — with no canvas write-path there is nothing
// for the two twins to disagree about beyond attributes.
//
// PHASE SCOPE: this phase renders from an injected `model` prop only. Phase 3
// adds the store adapter (read `elements.collectionId` → `cmsData` →
// `toRenderModel()`); until then a section with no model shows the loading
// skeleton below.

import React from 'react';
import type {
  CmsPrimitives,
  CmsTxtProps,
  CmsImgProps,
  CmsLinkProps,
  CmsListProps,
} from './primitives';
import { CollectionSectionCore } from './CollectionSection.core';
import type { CmsRenderModel } from './toRenderModel';

/** Edit-mode emitters. Identical tags/classes to the published twin; the only
 *  differences are non-markup (inert anchors, no CTA beacon attrs). */
export function makeCmsEditPrimitives(): CmsPrimitives {
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

  // Anchors are inert in the canvas (clicking a card must not navigate away from
  // the editor). The published twin carries the live destination + beacon attrs.
  const Link: React.FC<CmsLinkProps> = ({ href, className, ariaLabel, children }) => (
    <a
      href={href || '#'}
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </a>
  );

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

/**
 * "Manage items" affordance. GREYED PLACEHOLDER until phase 6 wires the CMS
 * panel — the capability is visible-but-disabled with a why-tooltip, never
 * silently omitted and never faked. Rendered outside `[data-cms-body]` so it is
 * edit-only chrome and cannot affect the parity comparison.
 */
function ManagePlaceholder() {
  return (
    <div className="lg-cms__manage" data-cms-manage="">
      <button
        type="button"
        disabled
        title="Item management arrives with the CMS panel — for now, collections are edited via the API."
        style={{
          fontSize: 12,
          padding: '4px 10px',
          borderRadius: 6,
          border: '1px solid rgba(0,0,0,.15)',
          color: 'rgba(0,0,0,.4)',
          background: 'transparent',
          cursor: 'not-allowed',
        }}
      >
        Manage items
      </button>
    </div>
  );
}

function Skeleton({ sectionId }: { sectionId: string }) {
  return (
    <section className="lg-cms" data-surface="neutral" data-sid={sectionId} data-cms-skeleton="">
      <div className="lg-cms__in">
        <p style={{ fontSize: 14, opacity: 0.55 }}>Loading collection…</p>
      </div>
    </section>
  );
}

export interface CollectionSectionProps {
  sectionId: string;
  /** Phase 3 supplies this from the store adapter. */
  model?: CmsRenderModel;
  [key: string]: any;
}

export default function CollectionSection({ sectionId, model }: CollectionSectionProps) {
  if (!model) return <Skeleton sectionId={sectionId} />;
  const E = makeCmsEditPrimitives();
  return (
    <CollectionSectionCore
      model={model}
      E={E}
      sectionId={sectionId}
      manageSlot={<ManagePlaceholder />}
    />
  );
}
