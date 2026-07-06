// src/modules/templates/vestria/blocks/Hero/VestriaFullBleedHero.core.tsx
// SINGLE-SOURCE full-bleed hero layout (second vestria hero variant). PLAIN
// server-safe module (no client directive, no hooks/stores) — renders only
// through injected primitives (E). Ported from the v2 mock (.hero-full):
// dark full-bleed section · stretched background media (video or poster image)
// · veil gradient · centered tag / h1 (white, italic accent em) / lede / CTA
// pair · bottom 3-stat row.
//
// Media contract: `hero_video_desktop` / `hero_video_mobile` clips are uploaded
// (never AI-generated). A <video> is rendered ONLY when a clip URL resolves;
// with no clip the hero is poster-only (background image). Poster resolves
// `hero_video_poster` → `hero_image` → hatched placeholder. Two <video>
// elements toggled by a CSS @media display rule (NOT <source media>); if only
// one clip is uploaded it renders for all viewports.
//
// Stats contract: REUSES the tailored hero's keys — first stat is
// `stamp_value`/`stamp_label`, then each `values[]` item maps title → stat
// value (big) and kicker → stat label (mono). No new copy keys.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { HERO_STYLES } from './styles';
import type { VestriaHeroContent, VestriaValue } from './VestriaTailoredHero.core';

export interface VestriaFullBleedHeroContent extends VestriaHeroContent {
  hero_video_desktop?: string;
  hero_video_mobile?: string;
  hero_video_poster?: string;
}

const MEDIA_PH = (
  <span className="vs-ph" aria-hidden="true"><span>Hero image / video</span></span>
);

export function VestriaFullBleedHeroCore({ content, E }: { content: VestriaFullBleedHeroContent; E: VestriaPrimitives }) {
  const values = content.values || [];
  const desktopClip = content.hero_video_desktop || '';
  const mobileClip = content.hero_video_mobile || '';
  // Poster fallback chain: hero_video_poster → hero_image → placeholder.
  const posterKey = content.hero_video_poster ? 'hero_video_poster' : 'hero_image';
  const poster = content.hero_video_poster || content.hero_image || '';
  const hasStamp = !!(content.stamp_value || content.stamp_label);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <section className="vs-heroFull">
        <div className="vs-heroFull__media" aria-hidden="true">
          <E.Img elementKey={posterKey} src={poster} alt=""
            className="vs-heroFull__bg" imgClassName="vs-heroFull__img" placeholder={MEDIA_PH} />
          {desktopClip && (
            <video
              className={`vs-heroFull__video${mobileClip ? ' vs-heroFull__video--desktop' : ''}`}
              src={desktopClip} poster={poster || undefined}
              autoPlay loop muted playsInline preload="metadata"
            />
          )}
          {mobileClip && (
            <video
              className={`vs-heroFull__video${desktopClip ? ' vs-heroFull__video--mobile' : ''}`}
              src={mobileClip} poster={poster || undefined}
              autoPlay loop muted playsInline preload="metadata"
            />
          )}
        </div>
        <div className="vs-heroFull__veil" />
        <div className="vs-wrap vs-heroFull__inner">
          <E.Txt elementKey="tag_text" value={content.tag_text} as="span"
            className="vs-tag vs-center vs-on-dark" placeholder="What you make · Where" />
          <E.Txt elementKey="headline" value={content.headline} as="h1"
            className="vs-display vs-heroFull__h1" multiline
            placeholder="Made for teams that <em>mean business.</em>" />
          <E.Txt elementKey="lede" value={content.lede} as="p"
            className="vs-heroFull__lede" multiline placeholder="One paragraph — who you serve, what you deliver, at what scale." />
          <div className="vs-heroFull__cta">
            <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="vs-btn vs-accent">
              <E.Txt elementKey="cta_text" value={content.cta_text} isButton placeholder="Request a Quote" />
              <span className="vs-arw">→</span>
            </E.Link>
            {(content.secondary_cta_text !== undefined) && (
              <E.Link hrefKey="secondary_cta_href" href={content.secondary_cta_href || '#catalog'} className="vs-btn vs-heroFull__ghost">
                <E.Txt elementKey="secondary_cta_text" value={content.secondary_cta_text} isButton placeholder="View Catalogue" />
              </E.Link>
            )}
          </div>
        </div>
        {(hasStamp || values.length > 0) && (
          <div className="vs-wrap vs-heroFull__stats">
            {hasStamp && (
              <div className="vs-hfStat">
                <E.Txt elementKey="stamp_value" value={content.stamp_value} as="b"
                  className="vs-hfStat__n" placeholder="40k+" />
                <E.Txt elementKey="stamp_label" value={content.stamp_label} as="span"
                  className="vs-hfStat__l" placeholder="Delivered / year" />
              </div>
            )}
            {values.length > 0 && (
              <E.List collectionKey="values" items={values} className="vs-heroFull__statsList" itemClassName="vs-hfStat"
                makeItem={() => ({ kicker: '', title: '', description: '' })} min={0} max={3} addLabel="+ Stat"
                render={(item: VestriaValue) => (
                  <>
                    <E.Txt elementKey={`values.${item.id}.title`} value={item.title} as="b"
                      className="vs-hfStat__n" placeholder="300+" />
                    <E.Txt elementKey={`values.${item.id}.kicker`} value={item.kicker} as="span"
                      className="vs-hfStat__l" placeholder="Organisations outfitted" />
                  </>
                )}
              />
            )}
          </div>
        )}
      </section>
    </>
  );
}

export default VestriaFullBleedHeroCore;
