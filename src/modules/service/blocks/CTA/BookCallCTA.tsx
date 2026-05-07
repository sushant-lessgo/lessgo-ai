'use client';

// src/modules/service/blocks/CTA/BookCallCTA.tsx
// Hearth closing CTA: warm radial-glow card. Edit mode.
// Reference: Hearth - Warm Service.html lines 1594-1610, .cta (647-675).

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { HearthEditable } from '../../components/HearthEditable';

interface BookCallCTAContent {
  eyebrow: string;
  headline: string;
  lede: string;
  cta_text: string;
  secondary_cta_text: string;
  meta: string;
}

interface BookCallCTAProps {
  sectionId: string;
}

export default function BookCallCTA({ sectionId }: BookCallCTAProps) {
  const { mode, blockContent, handleContentUpdate } = useServiceBlock<BookCallCTAContent>({
    sectionId,
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-cta-wrap" data-section-id={sectionId}>
        <div className="hearth-cta">
          <div className="hearth-cta__inner">
            {(blockContent.eyebrow || mode === 'edit') && (
              <HearthEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey="eyebrow"
                value={blockContent.eyebrow}
                onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save"
                className="hearth-eyebrow hearth-cta__eyebrow"
                placeholder="Let's begin"
              />
            )}
            <HearthEditable
              as="h2"
              mode={mode}
              sectionId={sectionId}
              elementKey="headline"
              value={blockContent.headline}
              onSave={(v) => handleContentUpdate('headline', v)}
              enterBehavior="save"
              className="hearth-cta__headline"
              placeholder="Let's talk."
            />
            <HearthEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="lede"
              value={blockContent.lede}
              onSave={(v) => handleContentUpdate('lede', v)}
              multiline
              className="hearth-cta__lede"
              placeholder="A short, warm closing paragraph."
            />
            <div className="hearth-cta__actions">
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
                  className="hearth-cta__caption"
                  placeholder="We answer within a day."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const STYLES = `
.hearth-cta-wrap {
  max-width: var(--max-w); margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
}
.hearth-cta {
  position: relative;
  border-radius: var(--r-xl);
  padding: 120px 80px;
  background:
    radial-gradient(circle at 30% 20%, var(--accent-wash), transparent 60%),
    linear-gradient(160deg, var(--cream-2), var(--cream-1));
  border: 1px solid var(--sand);
  text-align: center;
  overflow: hidden;
}
@media (max-width: 760px) { .hearth-cta { padding: 64px 28px; } }
.hearth-cta__inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
.hearth-cta__eyebrow { color: var(--accent-deep); }
.hearth-cta__headline {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(44px, 5.5vw, 76px); line-height: 1.05;
  letter-spacing: -0.012em; color: var(--ink); margin: 18px 0 16px;
  font-variation-settings: "opsz" 144;
}
.hearth-cta__lede {
  font-family: var(--font-display); font-style: italic;
  font-size: 21px; color: var(--ink-2); line-height: 1.5; margin: 0 auto 36px;
  max-width: 48ch;
}
.hearth-cta__actions {
  display: flex; gap: 14px; justify-content: center; align-items: center; flex-wrap: wrap;
}
.hearth-cta__caption {
  font-family: var(--font-display); font-style: italic;
  font-size: 14px; color: var(--ink-3);
}
`;
