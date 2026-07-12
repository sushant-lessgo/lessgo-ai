// src/modules/templates/atelier/blocks/Hero/AtelierHero.core.tsx
// SINGLE-SOURCE hero layout — Atelier×Kontur "Tile A" full-bleed slider (home) +
// page-head band (inner pages). PLAIN server-safe module — renders only through
// injected primitives (E). Ported from the approved design (styles.css COVER +
// MARQUEE + page-head; index.html L16-70).
//
// ▶ SLIDER DOM CONTRACT (phase-10 asset + phase-12 parity depend on it — the
//   class prefix is renamed atl-→lg-atelier- but the data-atl-* HOOKS are EXACT):
//     .lg-atelier-cover                              (JS: slider.closest target)
//       .lg-atelier-slides[data-atl-slider][data-interval="5000"]
//         .lg-atelier-slide (first .is-active)  × N  (no-JS: first slide visible)
//       .lg-atelier-arrows > button.lg-atelier-arrow[data-atl-prev] / [data-atl-next]
//       .lg-atelier-dots[data-atl-dots]              (EMPTY — JS injects .lg-atelier-dot)
//   With JS disabled the first .is-active slide shows; arrows + empty dots are inert.
//
// TWO MODES: default = home cover slider + marquee; content.mode === 'pageHead' =
// dark inner-page header band (label + accent-em h1 + lede). No new section type —
// page-head is a Hero MODE (per orchestrator ruling).

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { HERO_STYLES } from './styles';

export interface AtelierHeroSlide { id: string; image?: string; caption?: string }

export interface AtelierHeroContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  cta_href?: string;
  secondary_cta_text?: string;
  secondary_cta_href?: string;
  meta?: string;
  slides?: AtelierHeroSlide[];
  marquee_items?: string[];
  /** 'pageHead' = dark inner-page header band; default (undefined) = home cover. */
  mode?: 'pageHead';
}

const DEFAULT_MARQUEE = ['Editorial', 'Portraits', 'Product', 'Interiors', 'Commissions'];

export function AtelierHeroCore({ content, E }: { content: AtelierHeroContent; E: AtelierPrimitives }) {
  // ── PAGE-HEAD MODE (inner pages) ──────────────────────────────────────────
  if (content.mode === 'pageHead') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
        <div className="lg-atelier-page-head">
          <div className="lg-atelier-wrap">
            {content.eyebrow !== undefined && (
              <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-label lg-atelier-on-dark" placeholder="Portfolio" />
            )}
            <E.Txt elementKey="headline" value={content.headline} as="h1" className="lg-atelier-display lg-atelier-page-head__h1" placeholder="The <em>work.</em>" />
            {content.lede !== undefined && (
              <E.Txt elementKey="lede" value={content.lede} as="p" className="lg-atelier-lede lg-atelier-page-head__lede" placeholder="A short line about this page." multiline />
            )}
          </div>
        </div>
      </>
    );
  }

  // ── HOME MODE (Tile A cover slider + marquee) ─────────────────────────────
  const slides = content.slides && content.slides.length ? content.slides : null;
  const marquee = content.marquee_items && content.marquee_items.length ? content.marquee_items : DEFAULT_MARQUEE;
  const marqueeLoop = [...marquee, ...marquee]; // duplicated ×2 for a seamless loop

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <div className="lg-atelier-cover">
        <div className="lg-atelier-slides" data-atl-slider="" data-interval="5000">
          {slides ? (
            slides.map((s, i) => (
              <div key={s.id} className={i === 0 ? 'lg-atelier-slide is-active' : 'lg-atelier-slide'}>
                <E.Img
                  elementKey={`slides.${s.id}.image`}
                  src={s.image}
                  alt={s.caption || content.headline || 'hero'}
                  className="lg-atelier-slide-ph"
                  imgClassName="lg-atelier-slide-img"
                  eager={i === 0}
                  placeholder={
                    <div className="lg-atelier-ph dark">
                      <span className="lg-atelier-ph-num">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                  }
                />
              </div>
            ))
          ) : (
            // No-JS + no-content fallback: one visible dark slide.
            <div className="lg-atelier-slide is-active">
              <div className="lg-atelier-slide-ph">
                <div className="lg-atelier-ph dark"><span className="lg-atelier-ph-num">01</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="lg-atelier-cover-in">
          {content.eyebrow !== undefined && (
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-label" placeholder="Portfolio · Commissions" />
          )}
          <E.Txt elementKey="headline" value={content.headline} as="h1" className="lg-atelier-display lg-atelier-cover__h1" placeholder="Seen. Chosen. <em>Remembered.</em>" />
          <E.Txt elementKey="lede" value={content.lede} as="p" className="lg-atelier-tagline" placeholder="A body of work that does the persuading for you." multiline />
          <div className="lg-atelier-cover-actions">
            <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="lg-atelier-btn lg-atelier-accent lg-atelier-lg">
              <E.Txt elementKey="cta_text" value={content.cta_text} isButton placeholder="Start a project" />
            </E.Link>
            {content.secondary_cta_text !== undefined && (
              <E.Link hrefKey="secondary_cta_href" href={content.secondary_cta_href || '#work'} className="lg-atelier-btn lg-atelier-ghost-d lg-atelier-lg">
                <E.Txt elementKey="secondary_cta_text" value={content.secondary_cta_text} isButton placeholder="See the work" />
              </E.Link>
            )}
          </div>
        </div>

        {/* arrows — pointer hooks kept EXACT (data-atl-prev / data-atl-next) */}
        <div className="lg-atelier-arrows">
          <button className="lg-atelier-arrow lg-atelier-arrow-prev" type="button" data-atl-prev="" aria-label="Previous slide">
            <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button className="lg-atelier-arrow lg-atelier-arrow-next" type="button" data-atl-next="" aria-label="Next slide">
            <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        {/* dots — EMPTY container; phase-10 JS injects button.lg-atelier-dot */}
        <div className="lg-atelier-dots" data-atl-dots="" role="group" aria-label="Slides" />
        <div className="lg-atelier-scroll"><span>Scroll</span><span className="lg-atelier-scroll-line" /></div>
      </div>

      {/* marquee — hero region, home only. Pure CSS (lg-atelier-scrollx keyframe). */}
      <div className="lg-atelier-marquee" data-surface="dark" aria-hidden="true">
        <div className="lg-atelier-marquee-track">
          {marqueeLoop.map((word, i) => (
            <span key={i}>{word}</span>
          ))}
        </div>
      </div>
    </>
  );
}

export default AtelierHeroCore;
