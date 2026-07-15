// src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.core.tsx
// SINGLE-SOURCE hero layout (granth .core pattern). PLAIN server-safe module (no
// 'use client', no hooks/stores) — the layout lives here once and renders through
// injected primitives `E`. The edit wrapper injects `editPrimitives`; the
// published wrapper injects `makePublishedPrimitives()`. Parity is by construction.
//
// Element keys bind to the FROZEN work-core hero contract
// (src/modules/engines/workSections.ts → workElementContract.hero, a
// GranthArchedHero-lineage shape): role_line · name · quote · portrait_image ·
// cta_label · cta_href · socials[]. Track C fills that shape; the skeleton only
// renders it (copy firewall — no engine/audience import here).
//
// Tokens: SKIN vars `var(--wk-*)` + USER style-token vars `var(--u-*, <default>)`
// (see styles.ts). The root carries `data-sid` (the [data-sid] style-token hook)
// + `data-section-id` (editor Section-toolbar selection).
//
// D1 renders the STATIC first-slide state (single portrait_image). The multi-slide
// slider behavior lands in phase 5 (work.v1.js) and degrades to exactly this.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_HERO_STYLES } from './styles';

export interface WorkHeroSocial { id: string; network?: string; href?: string; label?: string }

export interface WorkHeroSliderContent {
  role_line?: string;
  name?: string;
  quote?: string;
  portrait_image?: string;
  cta_label?: string;
  cta_href?: string;
  socials?: WorkHeroSocial[];
}

const MEDIA_PH = (
  <span className="wk-hero__ph" aria-hidden="true">Hero image — full-bleed work</span>
);

export function WorkHeroSliderCore({
  content, E, sectionId,
}: { content: WorkHeroSliderContent; E: WorkPrimitives; sectionId: string }) {
  const socials = content.socials || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_HERO_STYLES }} />
      <section className="wk-hero" data-sid={sectionId} data-section-id={sectionId} data-wk-hero-slider="">
        <div className="wk-hero__media">
          <E.Img elementKey="portrait_image" src={content.portrait_image} alt={content.name}
            className="wk-hero__media-in" placeholder={MEDIA_PH} eager />
        </div>
        <div className="wk-hero__scrim" aria-hidden="true" />

        <div className="wk-hero__in">
          <E.Txt elementKey="role_line" value={content.role_line} as="p"
            className="wk-hero__eyebrow" placeholder="Portfolio · Commissions" />

          <E.Txt elementKey="name" value={content.name} as="h1"
            className="wk-hero__name" placeholder="Studio Name" />

          <E.Txt elementKey="quote" value={content.quote} as="p"
            className="wk-hero__quote" multiline
            placeholder="A body of work that does the persuading for you." />

          <div className="wk-hero__actions">
            <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="wk-hero__cta">
              <E.Txt elementKey="cta_label" value={content.cta_label}
                className="wk-hero__cta-label" isButton placeholder="Start a project" />
            </E.Link>
          </div>

          {(socials.length > 0) && (
            <E.List collectionKey="socials" items={socials} className="wk-hero__socials"
              makeItem={() => ({ network: 'instagram', href: '', label: '' })} min={0} max={6} addLabel="+ Social"
              render={(item: WorkHeroSocial) => (
                <E.Link hrefKey={`socials.${item.id}.href`} href={item.href}
                  ariaLabel={item.network || item.label} external className="wk-hero__social">
                  <E.Txt elementKey={`socials.${item.id}.label`} value={item.label || item.network}
                    as="span" placeholder="Instagram" />
                </E.Link>
              )}
            />
          )}
        </div>
      </section>
    </>
  );
}

export default WorkHeroSliderCore;
