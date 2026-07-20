'use client';

// src/modules/cms/render/CollectionDetail.tsx
//
// CMS item detail block — EDIT twin. Renders the SAME `CollectionDetail.core`
// through the SAME edit primitives the listing block uses, so the two twins are
// identical by construction.
//
// ⚠️ NOT REACHABLE FROM THE EDITOR IN v1 (plan Deviations #3): detail pages are
// authored nowhere in the canvas — the publish materializer fans them out into
// `content.subpages` and is their sole authority. There is therefore deliberately
// NO store adapter here (no `cmsData` lookup, no placement read): nothing places
// a `cmscollectionitem` section in editor state, so a store path would be dead
// code pretending to be a feature. The twin exists so the shared-block registries
// stay symmetrical and so the parity gate can render the edit side of a detail
// page from an injected model.
//
// When a later phase makes detail pages editor-previewable, wire the adapter here
// exactly like `CollectionSection.tsx` does.

import React from 'react';
import { makeCmsEditPrimitives } from './CollectionSection';
import { CollectionDetailCore } from './CollectionDetail.core';
import type { CmsDetailModel } from './toRenderModel';

function Skeleton({ sectionId }: { sectionId: string }) {
  return (
    <section className="lg-cmsd" data-surface="neutral" data-sid={sectionId} data-cms-skeleton="">
      <div className="lg-cmsd__in">
        <p style={{ fontSize: 14, opacity: 0.55 }}>Loading item…</p>
      </div>
    </section>
  );
}

export interface CollectionDetailProps {
  sectionId: string;
  /** The item's detail model. Absent → skeleton (never a crash). */
  model?: CmsDetailModel;
  [key: string]: any;
}

export default function CollectionDetail({ sectionId, model }: CollectionDetailProps) {
  if (!model) return <Skeleton sectionId={sectionId} />;
  const E = makeCmsEditPrimitives();
  return <CollectionDetailCore model={model} E={E} sectionId={sectionId} />;
}
