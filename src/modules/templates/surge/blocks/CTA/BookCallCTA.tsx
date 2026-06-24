'use client';

// Surge closing CTA (edit): "book a growth audit" band with accent-soft glow.
// Consumes the shared service cta contract.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { CTA_STYLES } from './styles';

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
  const { mode, blockContent, handleContentUpdate } = useServiceBlock<BookCallCTAContent>({ sectionId });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CTA_STYLES }} />
      <section className="sg-cta-wrap" data-section-id={sectionId}>
        <div className="sg-cta">
          <div className="sg-cta__inner">
            {(blockContent.eyebrow || mode === 'edit') && (
              <SurgeEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey="eyebrow"
                value={blockContent.eyebrow}
                onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save"
                className="sg-cta__eyebrow"
                placeholder="Contact us"
              />
            )}
            <SurgeEditable
              as="h2"
              mode={mode}
              sectionId={sectionId}
              elementKey="headline"
              value={blockContent.headline}
              onSave={(v) => handleContentUpdate('headline', v)}
              enterBehavior="save"
              className="sg-cta__headline"
              placeholder="Let's find your <em>fastest number to move</em>"
            />
            <SurgeEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="lede"
              value={blockContent.lede}
              onSave={(v) => handleContentUpdate('lede', v)}
              multiline
              className="sg-cta__lede"
              placeholder="Book a free 30-minute growth audit — we'll show you where the quick wins are."
            />
            <div className="sg-cta__actions">
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
                placeholder="Book a free audit ↗"
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
                  placeholder="See the work"
                />
              )}
            </div>
            {(blockContent.meta || mode === 'edit') && (
              <SurgeEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="meta"
                value={blockContent.meta}
                onSave={(v) => handleContentUpdate('meta', v)}
                enterBehavior="save"
                className="sg-cta__caption"
                placeholder="No retainer talk until we've proven a number."
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
