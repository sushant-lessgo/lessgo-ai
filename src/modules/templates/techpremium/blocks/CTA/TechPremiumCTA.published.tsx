// src/modules/templates/techpremium/blocks/CTA/TechPremiumCTA.published.tsx
// Server-safe published variant of TechPremiumCTA (dark forest band).

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';

interface TechPremiumCTAPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  body?: string;
  cta_text?: string;
  phone_line?: string;
  content?: any;
  elementMetadata?: any;
}

export default function TechPremiumCTAPublished(props: TechPremiumCTAPublishedProps) {
  const headline = props.headline || '';

  const md = props.content?.[props.sectionId]?.elementMetadata || props.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#cta');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-cta">
        <div className="tp-cta__inner">
          {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
          <h2 className="tp-cta__h2" dangerouslySetInnerHTML={{ __html: headline }} />
          {props.body && <p className="tp-cta__body">{props.body}</p>}
          <div className="tp-cta__actions">
            {props.cta_text && (
              <a className="tp-btn tp-btn--lime tp-btn--lg" href={ctaHref}>{props.cta_text}</a>
            )}
          </div>
          {props.phone_line && <p className="tp-cta__phone" dangerouslySetInnerHTML={{ __html: props.phone_line }} />}
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
