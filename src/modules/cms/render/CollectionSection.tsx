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
// STORE ADAPTER (phase 3): with no injected `model` prop the block reads its
// placement (`elements.collectionId`, spread flat onto props by the edit
// renderer) and resolves it against the runtime `cmsData` cache through the SAME
// `toRenderModel()` the publish materializer uses — one shaping path, so the two
// feeds cannot diverge. Missing/stale cache → the loading skeleton, never a crash.
//
// The store read lives in a CHILD component so the injected-`model` path stays
// completely store-free (hooks may not be conditional; a conditionally-RENDERED
// child is fine). That keeps this block renderable outside an `EditProvider` —
// which the parity gate relies on.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import type {
  CmsPrimitives,
  CmsTxtProps,
  CmsImgProps,
  CmsLinkProps,
  CmsListProps,
} from './primitives';
import { CollectionSectionCore } from './CollectionSection.core';
import { toRenderModel, type CmsRenderModel } from './toRenderModel';

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

/** Render a resolved model with the edit primitives + edit-only chrome. */
function Rendered({ sectionId, model }: { sectionId: string; model: CmsRenderModel }) {
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

/**
 * Store-backed path. Rendered ONLY when no `model` was injected, so the hook
 * below never runs outside an EditProvider on the injected path.
 */
function StoreBacked({ sectionId, collectionId }: { sectionId: string; collectionId: string }) {
  const bundle = useEditStore((s) => s.cmsData?.bundles?.[collectionId]);
  if (!bundle) return <Skeleton sectionId={sectionId} />;
  return <Rendered sectionId={sectionId} model={toRenderModel(bundle)} />;
}

export interface CollectionSectionProps {
  sectionId: string;
  /** Injected model (tests / future callers) — wins over the store lookup. */
  model?: CmsRenderModel;
  /** Placement, spread flat off `content[sectionId].elements` by the renderer. */
  collectionId?: string;
  /** The raw section data the edit renderer also spreads (`{id, layout, elements}`). */
  elements?: Record<string, any>;
  [key: string]: any;
}

export default function CollectionSection({
  sectionId,
  model,
  collectionId,
  elements,
}: CollectionSectionProps) {
  if (model) return <Rendered sectionId={sectionId} model={model} />;
  // The edit renderer spreads the whole section object, so placement arrives as
  // `elements.collectionId`; a flat `collectionId` prop is honoured too.
  const placed = collectionId || (elements?.collectionId as string | undefined);
  if (!placed) return <Skeleton sectionId={sectionId} />;
  return <StoreBacked sectionId={sectionId} collectionId={placed} />;
}
