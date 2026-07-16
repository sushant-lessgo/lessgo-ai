// WorkHeader — PUBLISHED wrapper (~10 lines, server-safe). Flat props → static
// primitives → shared core. All layout/markup lives in WorkHeader.core.tsx.
//
// INTERNAL DISPATCH: reads the stored layout name off the full content map the
// published renderer passes (`content[sectionId].layout` — the authoritative field,
// vestria-hero precedent) so the SAME arrangement renders as in the editor. The
// parity stage passes flat props only, so `layout` is also accepted as a direct
// prop fallback. `headerMode` (design state) drives `data-wk-header-mode`; today it
// resolves to 'static' everywhere (no Design ▾ panel + the renderer does not yet
// thread styleTokens to blocks — a documented follow-up), so edit == published.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkHeaderCore, type WorkHeaderContent } from './WorkHeader.core';

interface Props extends WorkHeaderContent {
  sectionId: string;
  content?: any;
  /** Direct layout-name fallback (parity stage passes flat props, no content map). */
  layout?: string;
  headerMode?: string;
}

export default function WorkHeaderPublished(props: Props) {
  const E = makePublishedPrimitives();
  const layoutName =
    props.content?.[props.sectionId]?.layout ?? props.layout ?? 'WorkHeader';
  const headerMode =
    props.content?.[props.sectionId]?.styleTokens?.headerMode ?? props.headerMode ?? 'static';
  return (
    <WorkHeaderCore
      content={props}
      E={E}
      sectionId={props.sectionId}
      layoutName={layoutName}
      headerMode={headerMode}
    />
  );
}
