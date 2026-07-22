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
// FORK (Wave 2): with ≥2 `slides` the core emits the multi-slide slider markup +
// the EXACT hooks the shipped `work.v1.js` (workBehaviors.js L42-72) queries —
// `.wk-hero__slide`/`.is-active`, `[data-wk-prev]`/`[data-wk-next]`,
// `[data-wk-dots]` (empty → JS injects `.wk-hero__dot`), `[data-wk-interval]` on
// the root. With 0/1 slide (incl. Kundius) it emits TODAY'S single
// `wk-hero__media`/`wk-hero__media-in` DOM byte-identically, so the JS bails
// (<2 slides) and existing drafts are unchanged. No hook is renamed/invented — a
// new hook would force a `work.v2.js` (forbidden this wave).
//
// BG MODE (section-background phase 3): optional `bgMode` prop, resolved from
// `styleTokens[sectionId].bgMode` by BOTH wrappers (edit reads the store with a
// scalar selector; published receives the per-section styleTokens prop). `'color'`
// drops the media + scrim layers; absent/`'image'` is today's exact markup.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_HERO_STYLES } from './styles';

export interface WorkHeroSocial { id: string; network?: string; href?: string; label?: string }
export interface WorkHeroSlide { id: string; image?: string }

export interface WorkHeroSliderContent {
  role_line?: string;
  name?: string;
  quote?: string;
  portrait_image?: string;
  cta_label?: string;
  cta_href?: string;
  cta2_label?: string;
  cta2_href?: string;
  socials?: WorkHeroSocial[];
  slides?: WorkHeroSlide[];
}

// Autoplay dwell (ms) — read by both the published `work.v1.js` and the editor
// slider effect off `[data-wk-interval]`; without it autoplay never runs.
const SLIDER_INTERVAL_MS = 5000;

const MEDIA_PH = (
  <span className="wk-hero__ph" aria-hidden="true">Hero image — full-bleed work</span>
);

export function WorkHeroSliderCore({
  content, E, sectionId, bgMode,
}: { content: WorkHeroSliderContent; E: WorkPrimitives; sectionId: string; bgMode?: string }) {
  const socials = content.socials || [];
  const slides = (content.slides || []).filter(Boolean);
  // COLOR MODE (section-background phase 3, D7 matrix): the user chose a surface
  // COLOUR for this hero, so the media must not merely be hidden — it must not be
  // in the markup at all (a `display:none` image is still DOWNLOADED). Here the
  // media (`__slides`/`__media`) and the `__scrim` are `position:absolute;inset:0`
  // overlays covering the whole band, so dropping those layers is the entire
  // change: `background:var(--u-bg, …)` on the root then shows through. Absent or
  // `'image'` bgMode → TODAY'S EXACT markup, byte-identical.
  const colorMode = bgMode === 'color';
  // FORK: ≥2 slides → the multi-slide slider; else TODAY'S single-media DOM
  // (byte-identical — do NOT rewrap the single portrait in `.wk-hero__slide`).
  const isSlider = !colorMode && slides.length >= 2;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_HERO_STYLES }} />
      <section
        className="wk-hero"
        data-sid={sectionId}
        data-section-id={sectionId}
        data-wk-hero-slider=""
        {...(isSlider ? { 'data-wk-interval': String(SLIDER_INTERVAL_MS) } : {})}
      >
        {colorMode ? null : isSlider ? (
          <>
            {/* Slide set — the FIRST slide carries `is-active` so it shows with no
                JS; the JS/editor effect then toggles `is-active` across the set. */}
            <div className="wk-hero__slides">
              {slides.map((slide, i) => (
                <div key={slide.id ?? i} className={`wk-hero__slide${i === 0 ? ' is-active' : ''}`}>
                  <E.Img elementKey={`slides.${slide.id}.image`} src={slide.image} alt={content.name}
                    className="wk-hero__slide-media" placeholder={MEDIA_PH} eager={i === 0} />
                </div>
              ))}
            </div>
            {/* Prev/next arrows + the EMPTY dots container the JS populates. */}
            <button type="button" className="wk-hero__arrow wk-hero__arrow--prev" data-wk-prev="" aria-label="Previous slide">‹</button>
            <button type="button" className="wk-hero__arrow wk-hero__arrow--next" data-wk-next="" aria-label="Next slide">›</button>
            <div className="wk-hero__dots" data-wk-dots="" aria-hidden="true" />
          </>
        ) : (
          <div className="wk-hero__media">
            <E.Img elementKey="portrait_image" src={content.portrait_image} alt={content.name}
              className="wk-hero__media-in" placeholder={MEDIA_PH} eager />
          </div>
        )}
        {!colorMode && <div className="wk-hero__scrim" aria-hidden="true" />}
        {/* Giant background slide numeral (Atelier "cover" signature). Rendered in
            BOTH renderers identically; CSS-gated OFF by default via
            --wk-hero-num-display (skin.heroNumeral). D1 = static first slide → "01". */}
        <span className="wk-hero__num" aria-hidden="true">01</span>

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
            {/* Second CTA renders ONLY when its href is set (a button needs a
                destination; `cta2_label` is AI-drafted / `cta2_href` manual — gating
                on label alone would ship a dead hrefless button on fresh gen). Empty
                label falls back to a sensible default. */}
            {content.cta2_href && (
              <E.Link hrefKey="cta2_href" href={content.cta2_href} className="wk-hero__cta wk-hero__cta--ghost">
                <E.Txt elementKey="cta2_label" value={content.cta2_label}
                  className="wk-hero__cta-label" isButton placeholder="Learn more" />
              </E.Link>
            )}
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
