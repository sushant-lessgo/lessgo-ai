// src/modules/skeletons/work/blocks/Header/WorkHeader.core.tsx
// SINGLE-SOURCE header layout (granth .core pattern). PLAIN server-safe module —
// the layout lives here once and renders through injected primitives `E`. Parity
// is by construction (edit + published inject different `E`, same markup/CSS).
//
// Binds the FROZEN work-core header contract (workElementContract.header):
//   scalars — logo_text · cta_label · cta_href
//   collection — nav_links[] { id, label, href }
// Uses the SHARED `Logo` + `Nav` primitives (toolbarPlan open-Q#1) — zero renegade
// UI: Logo/Nav emit data-element-key/-section-id so the shell Text/Image/Link/
// Section toolbars auto-consume. A text-only logo is used (logo image slot is not
// in the frozen contract → `src` stays undefined → the wordmark always renders).
//
// INTERNAL DISPATCH (phase 6). ONE parametric component renders ALL FIVE header
// arrangements. The stored layout name (read in BOTH modes — vestria-hero
// precedent) is emitted as `data-wk-header-layout` on the root; the arrangement is
// a pure CSS re-flow of the SAME 3-child DOM (logo · nav · right) keyed off that
// attribute (see styles.ts). Because the DOM is identical across arrangements,
// edit == published for every one of them by construction. The 4 NON-default
// arrangements are declared `internalDispatch: true` in the manifest (they share
// this one dispatcher → the conformance distinctness guard asserts they resolve to
// the SAME component as the default).
//
// STICKY (phase 6). `headerMode` (design state, from styleTokens[sectionId].
// headerMode with the skin selection as default) is emitted as `data-wk-header-mode`.
// `"fixed"` opts the header into `position:fixed` (styles.ts) in BOTH renderers and
// binds the published `work.v1.js` fixed-header scroll refinement; `"static"`
// (the default) is an inert no-op. It is design state, NOT a content-contract key.
//
// Tokens: SKIN vars `var(--wk-*)` + USER style-token vars `var(--u-*, <default>)`
// (see styles.ts). Root carries `data-sid` (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_HEADER_STYLES } from './styles';

export interface WorkNavLink { id: string; label?: string; href?: string }

export interface WorkHeaderContent {
  logo_text?: string;
  logo_image?: string;
  cta_label?: string;
  cta_href?: string;
  nav_links?: WorkNavLink[];
}

/** The five canonical header arrangements (CSS re-flow of the same DOM). */
export type WorkHeaderLayout =
  | 'WorkHeader'          // logo-left · nav-center · cta-right (default)
  | 'WorkHeaderStart'     // logo-left · nav grouped left · cta-right
  | 'WorkHeaderCentered'  // centered logo · nav-left · cta-right (Atelier)
  | 'WorkHeaderSplit'     // logo-left · nav+cta grouped right (Kontur/Pulse nav-right)
  | 'WorkHeaderMinimal';  // logo-left · cta-right only (nav hidden)

const HEADER_LAYOUTS: readonly string[] = [
  'WorkHeader', 'WorkHeaderStart', 'WorkHeaderCentered', 'WorkHeaderSplit', 'WorkHeaderMinimal',
];

/** Normalize an unknown/foreign stored layout name to the default arrangement. */
function normalizeLayout(name?: string): string {
  return name && HEADER_LAYOUTS.includes(name) ? name : 'WorkHeader';
}

export function WorkHeaderCore({
  content, E, sectionId, layoutName, headerMode = 'static',
}: {
  content: WorkHeaderContent; E: WorkPrimitives; sectionId: string;
  /** Stored layout name → CSS arrangement (both modes read the same value). */
  layoutName?: string;
  /** Sticky lever: 'fixed' | 'static' (design state). */
  headerMode?: string;
}) {
  const navLinks = content.nav_links || [];
  const arrangement = normalizeLayout(layoutName);
  const mode = headerMode === 'fixed' ? 'fixed' : 'static';
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_HEADER_STYLES }} />
      <header
        className="wk-header"
        data-sid={sectionId}
        data-section-id={sectionId}
        data-wk-header=""
        data-wk-header-layout={arrangement}
        data-wk-header-mode={mode}
      >
        <div className="wk-header__in">
          <E.Logo
            imageKey="logo_image" textKey="logo_text"
            src={content.logo_image} text={content.logo_text}
            hrefKey="logo_href" href="/"
            className="wk-header__logo" />

          <E.Nav
            collectionKey="nav_links" items={navLinks}
            className="wk-header__nav"
            makeItem={() => ({ label: '', href: '#' })} min={0} max={6} addLabel="+ Link" />

          <div className="wk-header__right">
            <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="wk-header__cta">
              <E.Txt elementKey="cta_label" value={content.cta_label} isButton placeholder="Start a project" />
            </E.Link>
          </div>
        </div>
      </header>
    </>
  );
}

export default WorkHeaderCore;
