// src/modules/skeletons/work/blocks/Hero/WorkHeroCenter.core.tsx
// SINGLE-SOURCE hero layout (granth .core pattern) — the AllCenter typographic
// arrangement: centered eyebrow/name/quote/CTA on paper, NO media. PLAIN
// server-safe module; renders through injected `E`.
//
// Binds the SAME frozen work-core hero contract as WorkHeroSlider — a lossless swap
// ALTERNATE (same copyShape). `portrait_image` is intentionally not rendered in
// this arrangement (the content is preserved on swap, just unshown). Tokens: SKIN
// `var(--wk-*)` + USER `var(--u-*)`. Root carries `data-sid` + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_HERO_CENTER_STYLES } from './styles';
import type { WorkHeroSliderContent, WorkHeroSocial } from './WorkHeroSlider.core';

export function WorkHeroCenterCore({
  content, E, sectionId,
}: { content: WorkHeroSliderContent; E: WorkPrimitives; sectionId: string }) {
  const socials = content.socials || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_HERO_CENTER_STYLES }} />
      <section className="wk-hero-center" data-sid={sectionId} data-section-id={sectionId} data-wk-hero-center="">
        <div className="wk-hero-center__in">
          <E.Txt elementKey="role_line" value={content.role_line} as="p"
            className="wk-hero-center__eyebrow" placeholder="Portfolio · Commissions" />

          <E.Txt elementKey="name" value={content.name} as="h1"
            className="wk-hero-center__name" placeholder="Studio Name" />

          <E.Txt elementKey="quote" value={content.quote} as="p"
            className="wk-hero-center__quote" multiline
            placeholder="A body of work that does the persuading for you." />

          <div className="wk-hero-center__actions">
            <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="wk-hero-center__cta">
              <E.Txt elementKey="cta_label" value={content.cta_label}
                className="wk-hero-center__cta-label" isButton placeholder="Start a project" />
            </E.Link>
          </div>

          {(socials.length > 0) && (
            <E.List collectionKey="socials" items={socials} className="wk-hero-center__socials"
              makeItem={() => ({ network: 'instagram', href: '', label: '' })} min={0} max={6} addLabel="+ Social"
              render={(item: WorkHeroSocial) => (
                <E.Link hrefKey={`socials.${item.id}.href`} href={item.href}
                  ariaLabel={item.network || item.label} external className="wk-hero-center__social">
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

export default WorkHeroCenterCore;
