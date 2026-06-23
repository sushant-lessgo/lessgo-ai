'use client';

// src/modules/templates/techpremium/blocks/CTA/TechPremiumCTA.tsx
// TechPremium closing CTA band — centered, on the dark forest surface (painted by
// the renderer's data-surface wrapper; this block only sets light text + the lime/
// ghost actions). Eyebrow, headline (may <em> → lime on dark), body, 2 actions.
// Edit mode. Reference: TechPremium.html .cta (lines 360-369, 1143-1159).

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';

interface TechPremiumCTAContent {
  eyebrow: string;
  headline: string;
  body: string;
  cta_text: string;
  phone_line: string;
}

interface TechPremiumCTAProps {
  sectionId: string;
}

export default function TechPremiumCTA({ sectionId }: TechPremiumCTAProps) {
  const { mode, blockContent, handleContentUpdate } = useTechPremiumBlock<TechPremiumCTAContent>({ sectionId });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-cta" data-section-id={sectionId}>
        <div className="tp-cta__inner">
          {(blockContent.eyebrow || mode === 'edit') && (
            <TechPremiumEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="eyebrow"
              value={blockContent.eyebrow}
              onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save"
              className="tp-eyebrow"
              placeholder="Talk to us"
            />
          )}
          <TechPremiumEditable
            as="h2"
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            value={blockContent.headline}
            onSave={(v) => handleContentUpdate('headline', v)}
            enterBehavior="save"
            className="tp-cta__h2"
            placeholder="A closing headline with an <em>accent</em>."
          />
          <TechPremiumEditable
            as="p"
            mode={mode}
            sectionId={sectionId}
            elementKey="body"
            value={blockContent.body}
            onSave={(v) => handleContentUpdate('body', v)}
            multiline
            className="tp-cta__body"
            placeholder="A short, confident closing paragraph."
          />
          <div className="tp-cta__actions">
            <TechPremiumEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="cta_text"
              value={blockContent.cta_text}
              onSave={(v) => handleContentUpdate('cta_text', v)}
              enterBehavior="save"
              isButton
              className="tp-btn tp-btn--lime tp-btn--lg"
              placeholder="Book a demo"
            />
          </div>
          {(blockContent.phone_line || mode === 'edit') && (
            <TechPremiumEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="phone_line"
              value={blockContent.phone_line}
              onSave={(v) => handleContentUpdate('phone_line', v)}
              enterBehavior="save"
              className="tp-cta__phone"
              placeholder="Or call +00 000 000 000 · Mon–Fri"
            />
          )}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.tp-cta { padding: var(--pad-y) var(--pad-x); }
.tp-cta__inner { max-width:720px; margin:0 auto; display:flex; flex-direction:column; align-items:center; text-align:center; gap:22px; }
.tp-cta .tp-eyebrow { font-family:var(--font-mono); font-weight:500; font-size:11.5px; letter-spacing:0.20em; text-transform:uppercase; color:var(--lime); display:inline-flex; align-items:center; gap:10px; }
.tp-cta .tp-eyebrow::before { content:""; width:22px; height:1px; background:var(--line-dk); }
.tp-cta__h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(34px,4.6vw,58px); letter-spacing:-0.018em; line-height:1.1; color:var(--paper); margin:0; }
.tp-cta__h2 em { font-style:normal; color:var(--lime); }
.tp-cta__body { font-family:var(--font-body); font-size:17px; line-height:1.7; color:oklch(0.86 0.025 140 / 0.82); max-width:46ch; margin:0; }
.tp-cta__actions { display:flex; flex-wrap:wrap; justify-content:center; gap:12px; margin-top:6px; }
.tp-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-display); font-weight:600; font-size:14.5px; letter-spacing:-0.005em; padding:13px 22px; border-radius:var(--r); white-space:nowrap; line-height:1; transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease; cursor:pointer; text-decoration:none; border:1px solid transparent; }
.tp-btn--lg { padding:16px 28px; font-size:15.5px; }
.tp-btn--lime { background:var(--lime); color:var(--forest-d); }
.tp-btn--lime:hover { background:oklch(0.815 0.185 128); transform:translateY(-1px); }
.tp-btn--ghost-d { border:1px solid var(--line-dk); color:var(--paper); background:transparent; }
.tp-btn--ghost-d:hover { border-color:var(--lime); color:var(--lime); }
.tp-btn--wa { background:var(--wa); color:#fff; }
.tp-btn--wa:hover { background:oklch(0.55 0.16 150); transform:translateY(-1px); }
.tp-cta__phone { font-family:var(--font-mono); font-size:12.5px; letter-spacing:0.04em; color:oklch(0.82 0.03 140 / 0.78); margin:14px 0 0; }
.tp-cta__phone b { color:var(--lime); font-weight:600; }
`;
