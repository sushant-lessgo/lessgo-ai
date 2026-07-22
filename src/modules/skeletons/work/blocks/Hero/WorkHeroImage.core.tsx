// src/modules/skeletons/work/blocks/Hero/WorkHeroImage.core.tsx
// SINGLE-SOURCE hero layout (granth .core pattern) — the IMAGE-BG arrangement:
// a full-bleed still-image cover with CENTERED overlay content (distinct from the
// bottom-aligned WorkHeroSlider). Video-bg is the reserved `WorkHeroVideo` SLOT.
//
// Binds the SAME frozen work-core hero contract as WorkHeroSlider
// (workElementContract.hero): role_line · name · quote · portrait_image ·
// cta_label · cta_href · socials[] — so it is a lossless swap ALTERNATE of the
// hero (same copyShape). PLAIN server-safe module; renders through injected `E`.
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries
// `data-sid` (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_HERO_IMAGE_STYLES } from './styles';
import type { WorkHeroSliderContent, WorkHeroSocial } from './WorkHeroSlider.core';

const MEDIA_PH = (
  <span className="wk-hero-img__ph" aria-hidden="true">Hero image — full-bleed work</span>
);

export function WorkHeroImageCore({
  content, E, sectionId, bgMode,
}: { content: WorkHeroSliderContent; E: WorkPrimitives; sectionId: string; bgMode?: string }) {
  const socials = content.socials || [];
  // COLOR MODE (section-background phase 3, D7 matrix): both the media and the
  // scrim are `position:absolute;inset:0` overlays covering the whole band, so
  // dropping those two layers is the entire change — the root's
  // `background:var(--u-bg, …)` then shows through. Absent/`'image'` → today's
  // exact markup, byte-identical. (Removing the element, not hiding it: a
  // `display:none` image is still downloaded.)
  const colorMode = bgMode === 'color';
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_HERO_IMAGE_STYLES }} />
      <section className="wk-hero-img" data-sid={sectionId} data-section-id={sectionId} data-wk-hero-image="">
        {!colorMode && (
          <div className="wk-hero-img__media">
            <E.Img elementKey="portrait_image" src={content.portrait_image} alt={content.name}
              className="wk-hero-img__media-in" placeholder={MEDIA_PH} eager />
          </div>
        )}
        {!colorMode && <div className="wk-hero-img__scrim" aria-hidden="true" />}

        <div className="wk-hero-img__in">
          <E.Txt elementKey="role_line" value={content.role_line} as="p"
            className="wk-hero-img__eyebrow" placeholder="Portfolio · Commissions" />

          <E.Txt elementKey="name" value={content.name} as="h1"
            className="wk-hero-img__name" placeholder="Studio Name" />

          <E.Txt elementKey="quote" value={content.quote} as="p"
            className="wk-hero-img__quote" multiline
            placeholder="A body of work that does the persuading for you." />

          <div className="wk-hero-img__actions">
            <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="wk-hero-img__cta">
              <E.Txt elementKey="cta_label" value={content.cta_label}
                className="wk-hero-img__cta-label" isButton placeholder="Start a project" />
            </E.Link>
          </div>

          {(socials.length > 0) && (
            <E.List collectionKey="socials" items={socials} className="wk-hero-img__socials"
              makeItem={() => ({ network: 'instagram', href: '', label: '' })} min={0} max={6} addLabel="+ Social"
              render={(item: WorkHeroSocial) => (
                <E.Link hrefKey={`socials.${item.id}.href`} href={item.href}
                  ariaLabel={item.network || item.label} external className="wk-hero-img__social">
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

export default WorkHeroImageCore;
