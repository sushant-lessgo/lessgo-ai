'use client';

// Surge hero (edit). 2-col: left = copy (pill eyebrow, display headline w/ accent
// <em>, lede, CTA row, trust line); right = the live-dashboard centerpiece, OR the
// uploaded hero_image when present. Consumes the shared service hero contract.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { SurgeAddImageOverlay } from '../../components/SurgeAddImageOverlay';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { SurgeDashboard, SurgeFloatChips } from './SurgeDashboard';
import { HERO_STYLES } from './styles';

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
  const { mode, blockContent, handleContentUpdate } = useServiceBlock<PetalFramedHeroContent>({ sectionId });
  const handleImageToolbar = useImageToolbar();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <section className="sg-hero" data-section-id={sectionId}>
        <div className="sg-hero__grid">
          <div className="sg-hero__content">
            {(blockContent.eyebrow || mode === 'edit') && (
              <span className="sg-pill">
                <span className="sg-dot" />
                <SurgeEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="eyebrow"
                  value={blockContent.eyebrow}
                  onSave={(v) => handleContentUpdate('eyebrow', v)}
                  enterBehavior="save"
                  placeholder="Now booking · Q3 2026"
                />
              </span>
            )}

            <SurgeEditable
              as="h1"
              mode={mode}
              sectionId={sectionId}
              elementKey="headline"
              value={blockContent.headline}
              onSave={(v) => handleContentUpdate('headline', v)}
              enterBehavior="save"
              className="sg-hero__display"
              placeholder="We turn attention into <em>pipeline</em>"
            />

            <SurgeEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="lede"
              value={blockContent.lede}
              onSave={(v) => handleContentUpdate('lede', v)}
              multiline
              className="sg-hero__lede"
              placeholder="One long sentence on what you do and the number you move; then one short."
            />

            <div className="sg-hero__actions">
              <div className="sg-hero__cta-row">
                <SurgeEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="cta_text"
                  value={blockContent.cta_text}
                  onSave={(v) => handleContentUpdate('cta_text', v)}
                  enterBehavior="save"
                  isButton
                  className="sg-btn sg-btn--primary"
                  placeholder="Book a free audit"
                />
                {(blockContent.secondary_cta_text || mode === 'edit') && (
                  <SurgeEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="secondary_cta_text"
                    value={blockContent.secondary_cta_text}
                    onSave={(v) => handleContentUpdate('secondary_cta_text', v)}
                    enterBehavior="save"
                    isButton
                    className="sg-btn sg-btn--ghost"
                    placeholder="See the work →"
                  />
                )}
              </div>
              {(blockContent.meta || mode === 'edit') && (
                <div className="sg-hero__trust">
                  <SurgeEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="meta"
                    value={blockContent.meta}
                    onSave={(v) => handleContentUpdate('meta', v)}
                    enterBehavior="save"
                    placeholder="20+ founders & brands grown since 2024"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="sg-dash-wrap">
            {blockContent.hero_image ? (
              <div
                className="sg-dash__photo"
                data-image-id={`${sectionId}-hero-image`}
                data-element-key="hero_image"
                style={{ backgroundImage: `url(${blockContent.hero_image})` }}
                onMouseUp={(e) => {
                  if (mode === 'edit') {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    handleImageToolbar(`${sectionId}-hero-image`, { x: rect.left + rect.width / 2, y: rect.top - 10 });
                  }
                }}
              />
            ) : (
              <div
                style={{ position: 'relative', cursor: mode === 'edit' ? 'pointer' : 'default' }}
                data-image-id={`${sectionId}-hero-image`}
                data-element-key="hero_image"
                onMouseUp={(e) => {
                  if (mode === 'edit') {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    handleImageToolbar(`${sectionId}-hero-image`, { x: rect.left + rect.width / 2, y: rect.top - 10 });
                  }
                }}
              >
                <SurgeFloatChips />
                <SurgeDashboard />
                {mode === 'edit' && <SurgeAddImageOverlay />}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
