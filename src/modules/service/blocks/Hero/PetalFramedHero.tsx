'use client';

// src/modules/service/blocks/Hero/PetalFramedHero.tsx
// Hearth hero: 2-col, large display headline w/ italic-em accent, asymmetric
// petal-framed image. Edit mode.
// Reference: Hearth - Warm Service.html lines 1389-1432, .hero (329-447).

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { HearthEditable } from '../../components/HearthEditable';
import { useImageToolbar } from '@/hooks/useImageToolbar';

interface PetalFramedHeroContent {
  eyebrow: string;
  headline: string;
  lede: string;
  cta_text: string;
  secondary_cta_text: string;
  hero_image: string;
  meta: string;
}

interface PetalFramedHeroProps {
  sectionId: string;
}

export default function PetalFramedHero({ sectionId }: PetalFramedHeroProps) {
  const { mode, blockContent, handleContentUpdate } = useServiceBlock<PetalFramedHeroContent>({
    sectionId,
  });
  const handleImageToolbar = useImageToolbar();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-hero" data-section-id={sectionId}>
        <div className="hearth-hero__copy">
          {(blockContent.eyebrow || mode === 'edit') && (
            <div className="hearth-hero__eyebrow">
              <span className="hearth-hero__pip" />
              <HearthEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="eyebrow"
                value={blockContent.eyebrow}
                onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save"
                placeholder="Eyebrow text"
              />
            </div>
          )}

          <HearthEditable
            as="h1"
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            value={blockContent.headline}
            onSave={(v) => handleContentUpdate('headline', v)}
            enterBehavior="save"
            className="hearth-hero__headline"
            placeholder="Your headline here"
          />

          <HearthEditable
            as="p"
            mode={mode}
            sectionId={sectionId}
            elementKey="lede"
            value={blockContent.lede}
            onSave={(v) => handleContentUpdate('lede', v)}
            multiline
            className="hearth-hero__lede"
            placeholder="Lede paragraph — one long sentence, then one short."
          />

          <div className="hearth-hero__actions">
            <HearthEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="cta_text"
              value={blockContent.cta_text}
              onSave={(v) => handleContentUpdate('cta_text', v)}
              enterBehavior="save"
              className="hearth-btn hearth-btn--primary hearth-btn--lg"
              placeholder="Book a call"
            />
            {(blockContent.secondary_cta_text || mode === 'edit') && (
              <HearthEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="secondary_cta_text"
                value={blockContent.secondary_cta_text}
                onSave={(v) => handleContentUpdate('secondary_cta_text', v)}
                enterBehavior="save"
                className="hearth-btn hearth-btn--ghost hearth-btn--lg"
                placeholder="See work"
              />
            )}
            {(blockContent.meta || mode === 'edit') && (
              <HearthEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="meta"
                value={blockContent.meta}
                onSave={(v) => handleContentUpdate('meta', v)}
                enterBehavior="save"
                className="hearth-hero__caption"
                placeholder="Free consult"
              />
            )}
          </div>
        </div>

        <div className="hearth-hero__art" aria-hidden="true">
          <div
            className="hearth-hero__photo hearth-hero__photo--main"
            data-image-id={`${sectionId}-hero-image`}
            data-element-key="hero_image"
            style={{
              backgroundImage: blockContent.hero_image
                ? `url(${blockContent.hero_image})`
                : 'linear-gradient(135deg, var(--clay), var(--accent))',
            }}
            onMouseUp={(e) => {
              if (mode === 'edit') {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                handleImageToolbar(`${sectionId}-hero-image`, {
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10,
                });
              }
            }}
          />
        </div>
      </section>
    </>
  );
}

const STYLES = `
.hearth-hero {
  display: grid; grid-template-columns: 1.05fr 1fr; gap: 64px;
  align-items: center;
  max-width: var(--max-w); margin: 0 auto;
  padding: 96px var(--sec-pad-x) var(--sec-pad-y);
}
@media (max-width: 900px) { .hearth-hero { grid-template-columns: 1fr; gap: 40px; padding-top: 48px; } }
.hearth-hero__eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--font-body); font-size: 12px; font-weight: 500;
  color: var(--ink-2); letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 28px;
}
.hearth-hero__pip { width: 8px; height: 8px; border-radius: 50%; background: var(--sage); }
.hearth-hero__headline {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(48px, 6.4vw, 84px); line-height: 0.98;
  letter-spacing: -0.015em;
  font-variation-settings: "opsz" 144;
  color: var(--ink);
  margin: 0;
}
.hearth-hero__lede {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 21px; line-height: 1.5; color: var(--ink-2);
  max-width: 48ch; margin-top: 28px;
}
.hearth-hero__actions {
  display: flex; gap: 14px; margin-top: 44px; align-items: center; flex-wrap: wrap;
}
.hearth-hero__caption {
  font-family: var(--font-display); font-style: italic;
  font-size: 14px; color: var(--ink-3);
}
.hearth-btn--lg { padding: 18px 28px; font-size: 16.5px; }
.hearth-btn--ghost {
  background: transparent; color: var(--ink); border-color: var(--sand);
  padding: 12px 20px;
}
.hearth-btn--ghost:hover { border-color: var(--ink-3); background: var(--cream-1); }

.hearth-hero__art {
  position: relative; aspect-ratio: 4/5; min-height: 420px;
}
.hearth-hero__photo {
  position: absolute; inset: 0;
  border-radius: var(--r-petal);
  background-size: cover; background-position: center;
  box-shadow: var(--shadow-lift);
}
.hearth-hero__photo--main { cursor: pointer; }
`;
