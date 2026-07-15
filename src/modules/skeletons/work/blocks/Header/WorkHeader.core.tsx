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
// PARAMETRIC SHELL, DEFAULT ARRANGEMENT ONLY this phase (logo-left · nav-center ·
// cta-right). The other 4 arrangements + sticky/fixed land in phase 6.
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

export function WorkHeaderCore({
  content, E, sectionId,
}: { content: WorkHeaderContent; E: WorkPrimitives; sectionId: string }) {
  const navLinks = content.nav_links || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_HEADER_STYLES }} />
      <header className="wk-header" data-sid={sectionId} data-section-id={sectionId} data-wk-header="">
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
