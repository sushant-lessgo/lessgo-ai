// src/modules/skeletons/work/blocks/Hero/WorkHeroSplit.core.tsx
// SINGLE-SOURCE hero layout (granth .core pattern) — the LeftTextRightImage
// editorial-poster arrangement (Kontur/Pulse `.hero-grid`): copy column on paper,
// portrait column on the right. PLAIN server-safe module; renders through `E`.
//
// Binds the SAME frozen work-core hero contract as WorkHeroSlider — a lossless swap
// ALTERNATE (same copyShape). Tokens: SKIN `var(--wk-*)` + USER `var(--u-*)`.
// Root carries `data-sid` + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_HERO_SPLIT_STYLES } from './styles';
import type { WorkHeroSliderContent, WorkHeroSocial } from './WorkHeroSlider.core';

const MEDIA_PH = (
  <div className="wk-hero-split__ph" aria-hidden="true">Portrait</div>
);

export function WorkHeroSplitCore({
  content, E, sectionId, bgMode,
}: { content: WorkHeroSliderContent; E: WorkPrimitives; sectionId: string; bgMode?: string }) {
  const socials = content.socials || [];
  // COLOR MODE (section-background phase 3, D7 matrix). Unlike slider/image, this
  // variant's media is a GRID COLUMN (`.wk-hero-split__media`, aspect-ratio 4/5),
  // not an absolute overlay — dropping it ALONE would leave a `1.05fr 0.95fr` grid
  // with one empty column and the copy squeezed into the left 52%. So the modifier
  // class collapses the grid to a single column (the ONE new selector in
  // `styles.ts`). Absent/`'image'` → today's exact markup, byte-identical.
  const colorMode = bgMode === 'color';
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_HERO_SPLIT_STYLES }} />
      <section
        className={`wk-hero-split${colorMode ? ' wk-hero-split--no-media' : ''}`}
        data-sid={sectionId} data-section-id={sectionId} data-wk-hero-split=""
      >
        <div className="wk-hero-split__in">
          <div className="wk-hero-split__copy">
            <E.Txt elementKey="role_line" value={content.role_line} as="p"
              className="wk-hero-split__eyebrow" placeholder="Portfolio · Commissions" />

            <E.Txt elementKey="name" value={content.name} as="h1"
              className="wk-hero-split__name" placeholder="Studio Name" />

            <E.Txt elementKey="quote" value={content.quote} as="p"
              className="wk-hero-split__quote" multiline
              placeholder="A body of work that does the persuading for you." />

            <div className="wk-hero-split__actions">
              <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="wk-hero-split__cta">
                <E.Txt elementKey="cta_label" value={content.cta_label}
                  className="wk-hero-split__cta-label" isButton placeholder="Start a project" />
              </E.Link>
            </div>

            {(socials.length > 0) && (
              <E.List collectionKey="socials" items={socials} className="wk-hero-split__socials"
                makeItem={() => ({ network: 'instagram', href: '', label: '' })} min={0} max={6} addLabel="+ Social"
                render={(item: WorkHeroSocial) => (
                  <E.Link hrefKey={`socials.${item.id}.href`} href={item.href}
                    ariaLabel={item.network || item.label} external className="wk-hero-split__social">
                    <E.Txt elementKey={`socials.${item.id}.label`} value={item.label || item.network}
                      as="span" placeholder="Instagram" />
                  </E.Link>
                )}
              />
            )}
          </div>

          {!colorMode && (
            <E.Img elementKey="portrait_image" src={content.portrait_image} alt={content.name}
              className="wk-hero-split__media" placeholder={MEDIA_PH} eager />
          )}
        </div>
      </section>
    </>
  );
}

export default WorkHeroSplitCore;
