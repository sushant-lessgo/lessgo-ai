'use client';

// src/modules/templates/meridian/blocks/CTA/ArcCTA.tsx
// Meridian closing CTA: bordered card with the once-per-page arc motif + faint
// grid. Eyebrow, headline (may <em>), body, 2 actions. Edit mode.
// Reference: Meridian - Modern Tech.html lines 1409-1421.
// Decorative static (NOT schema fields): .mrd-cta__arc, .mrd-cta__grid.

import React from 'react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';

interface ArcCTAContent {
  eyebrow: string;
  headline: string;
  body: string;
  cta_text: string;
  secondary_cta_text: string;
}

interface ArcCTAProps {
  sectionId: string;
}

export default function ArcCTA({ sectionId }: ArcCTAProps) {
  const { mode, blockContent, handleContentUpdate } = useMeridianBlock<ArcCTAContent>({ sectionId });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="mrd-cta-wrap" data-section-id={sectionId}>
        <div className="mrd-cta">
          <div className="mrd-cta__grid" aria-hidden="true" />
          <div className="mrd-cta__arc" aria-hidden="true" />
          <div className="mrd-cta__inner">
            {(blockContent.eyebrow || mode === 'edit') && (
              <div className="mrd-cta__eyebrow">
                <MeridianEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="eyebrow"
                  value={blockContent.eyebrow}
                  onSave={(v) => handleContentUpdate('eyebrow', v)}
                  enterBehavior="save"
                  placeholder="start"
                />
              </div>
            )}
            <MeridianEditable
              as="h2"
              mode={mode}
              sectionId={sectionId}
              elementKey="headline"
              value={blockContent.headline}
              onSave={(v) => handleContentUpdate('headline', v)}
              enterBehavior="save"
              className="mrd-cta__headline"
              placeholder="A closing headline with an <em>accent</em>."
            />
            <MeridianEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="body"
              value={blockContent.body}
              onSave={(v) => handleContentUpdate('body', v)}
              multiline
              className="mrd-cta__body"
              placeholder="A short, confident closing paragraph."
            />
            <div className="mrd-cta__actions">
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="cta_text"
                value={blockContent.cta_text}
                onSave={(v) => handleContentUpdate('cta_text', v)}
                enterBehavior="save"
                isButton
                className="mrd-btn mrd-btn--primary mrd-btn--lg mrd-btn--arrow"
                placeholder="Start free"
              />
              {(blockContent.secondary_cta_text || mode === 'edit') && (
                <MeridianEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="secondary_cta_text"
                  value={blockContent.secondary_cta_text}
                  onSave={(v) => handleContentUpdate('secondary_cta_text', v)}
                  enterBehavior="save"
                  isButton
                  className="mrd-btn mrd-btn--ghost mrd-btn--lg"
                  placeholder="Talk to us"
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
.mrd-cta-wrap { max-width: 1340px; margin: 0 auto; padding: 120px var(--sec-pad-x); }
.mrd-cta {
  position: relative; border: 1px solid var(--line); border-radius: var(--r-xl);
  padding: 96px 72px; overflow: hidden; background: var(--ink);
}
@media (max-width: 760px) { .mrd-cta { padding: 56px 28px; } }
.mrd-cta__arc {
  position: absolute; right: -160px; bottom: -220px; width: 640px; height: 640px;
  border-radius: 50%; border: 1px solid var(--accent); opacity: 0.6; pointer-events: none;
}
.mrd-cta__arc::before {
  content: ""; position: absolute; inset: 40px; border-radius: 50%; border: 1px solid var(--accent-dim);
}
.mrd-cta__arc::after {
  content: ""; position: absolute; inset: 100px; border-radius: 50%; border: 1px solid var(--accent-dim);
}
.mrd-cta__grid {
  position: absolute; inset: 0; pointer-events: none;
  background:
    linear-gradient(var(--line-soft) 1px, transparent 1px) 0 0 / 100% 48px,
    linear-gradient(90deg, var(--line-soft) 1px, transparent 1px) 0 0 / 48px 100%;
  -webkit-mask-image: linear-gradient(90deg, black 40%, transparent 85%);
  mask-image: linear-gradient(90deg, black 40%, transparent 85%);
}
.mrd-cta__inner { position: relative; z-index: 1; max-width: 640px; }
.mrd-cta__eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--accent);
}
.mrd-cta__headline {
  font-family: var(--font-display); font-weight: 600; font-size: 72px;
  line-height: 0.95; letter-spacing: -0.03em; margin: 16px 0 0; color: var(--bone);
}
@media (max-width: 760px) { .mrd-cta__headline { font-size: 48px; } }
.mrd-cta__headline em { color: var(--accent); }
.mrd-cta__body {
  font-family: var(--font-display); font-size: 19px; color: var(--bone-2);
  margin: 24px 0 40px; max-width: 44ch;
}
.mrd-cta__actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.mrd-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-weight: 500; font-size: 13.5px;
  letter-spacing: -0.005em; border-radius: var(--r-md); padding: 10px 14px;
  transition: all 140ms ease; border: 1px solid transparent; cursor: pointer; text-decoration: none;
}
.mrd-btn--lg { padding: 14px 20px; font-size: 15px; }
.mrd-btn--primary { background: var(--accent); color: var(--accent-ink); }
.mrd-btn--primary:hover { filter: brightness(1.06); }
.mrd-btn--ghost { color: var(--bone); border-color: var(--line); background: transparent; }
.mrd-btn--ghost:hover { border-color: var(--line-strong); background: var(--ink-1); }
.mrd-btn--arrow::after { content: "→"; font-family: var(--font-mono); font-size: 13px; }
[data-variant="marketing"] .mrd-cta__eyebrow { font-family: var(--font-body); letter-spacing: 0; text-transform: none; font-size: 13px; }
[data-variant="marketing"] .mrd-btn { border-radius: 12px; font-family: var(--font-body); font-weight: 500; }
[data-variant="marketing"] .mrd-btn--arrow::after { font-family: var(--font-body); }
`;
