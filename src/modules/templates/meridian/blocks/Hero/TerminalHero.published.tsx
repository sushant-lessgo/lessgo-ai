// src/modules/templates/meridian/blocks/Hero/TerminalHero.published.tsx
// Server-safe published variant of TerminalHero. Decorative terminal vis (always;
// no image slot — PO ruling); copy neutralized (abstract mono key/value), aria-hidden.

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';

// CTA destinations resolved via buttonConfig on each element's metadata (shared
// resolveCtaHref util). Form connection → "#form-section".
interface HeroStat {
  id?: string;
  value?: string;
  label?: string;
}

interface TerminalHeroPublishedProps {
  sectionId: string;
  status_text?: string;
  audience_tag?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  secondary_cta_text?: string;
  caption?: string;
  stats?: HeroStat[];
  // Standard published-renderer props for form-builder integration.
  content?: any;
  elementMetadata?: any;
}

export default function TerminalHeroPublished(props: TerminalHeroPublishedProps) {
  const headline = props.headline || '';
  const lede = props.lede || '';
  const stats = Array.isArray(props.stats) ? props.stats : [];

  const md = props.content?.[props.sectionId]?.elementMetadata || props.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#cta');
  const secondaryHref = resolveCtaHref(md?.secondary_cta_text?.buttonConfig, forms, '#cta');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="mrd-hero">
        <div className="mrd-hero__grid" aria-hidden="true" />
        <div className="mrd-hero__inner">
          {(props.status_text || props.audience_tag) && (
            <div className="mrd-hero__top">
              <span className="mrd-hero__dot" />
              {props.status_text && <span>{props.status_text}</span>}
              <span className="mrd-hero__rule" />
              {props.audience_tag && <span>{props.audience_tag}</span>}
            </div>
          )}

          <h1 className="mrd-hero__headline" dangerouslySetInnerHTML={{ __html: headline }} />
          <p className="mrd-hero__lede" dangerouslySetInnerHTML={{ __html: lede }} />

          <div className="mrd-hero__actions">
            {props.cta_text && (
              <a className="mrd-btn mrd-btn--primary mrd-btn--lg mrd-btn--arrow" href={ctaHref}>{props.cta_text}</a>
            )}
            {props.secondary_cta_text && (
              <a className="mrd-btn mrd-btn--ghost mrd-btn--lg" href={secondaryHref}>{props.secondary_cta_text}</a>
            )}
            {props.caption && <span className="mrd-hero__caption">{props.caption}</span>}
          </div>

          {stats.length > 0 && (
            <div className="mrd-hero__meta">
              {stats.map((s, idx) => (
                <div key={s.id || idx} className="mrd-hero__meta-cell">
                  <div className="mrd-hero__meta-k">{s.value || ''}</div>
                  <div className="mrd-hero__meta-l">{s.label || ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="mrd-hero__vis" aria-hidden="true">
          <div className="mrd-hero__vis-head">
            <div className="mrd-hero__vis-dots"><span /><span /><span /></div>
            <span>workspace</span>
          </div>
          <div className="mrd-hero__vis-body">
            <span className="ln"><span className="c">#</span> <span className="k">overview</span> <span className="v">summary</span></span>
            <span className="ln"><span className="a">✓</span> item one</span>
            <span className="ln"><span className="a">✓</span> item two</span>
            <span className="ln"><span className="a">✓</span> item three</span>
            <span className="ln"><span className="c">→</span> <span className="a">ready</span></span>
            <span className="ln" style={{ marginTop: 10 }}><span className="k">metric</span> <span className="v">a · b · c</span></span>
            <span className="ln"><span className="k">status</span>  <span className="v">ok</span></span>
          </div>
        </aside>
      </section>
    </>
  );
}

const STYLES = `
.mrd-hero {
  position: relative;
  padding: 140px var(--sec-pad-x) 120px;
  max-width: 1340px; margin: 0 auto; overflow: hidden;
}
.mrd-hero__grid {
  position: absolute; inset: 0;
  background:
    linear-gradient(var(--line-soft) 1px, transparent 1px) 0 0 / 100% 96px,
    linear-gradient(90deg, var(--line-soft) 1px, transparent 1px) 0 0 / 96px 100%;
  -webkit-mask-image: radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%);
  mask-image: radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%);
  pointer-events: none;
}
.mrd-hero__inner { position: relative; z-index: 1; padding-right: 480px; }
.mrd-hero__top {
  display: flex; align-items: center; gap: 14px;
  font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--bone-3); margin-bottom: 36px;
}
.mrd-hero__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
.mrd-hero__rule { flex: 1; height: 1px; background: var(--line); max-width: 180px; }
.mrd-hero__headline {
  font-family: var(--font-display); font-weight: 600;
  font-size: clamp(56px, 8.5vw, 108px); line-height: 0.94;
  letter-spacing: -0.035em; margin: 0; max-width: 14ch; color: var(--bone);
}
.mrd-hero__headline em { color: var(--accent); position: relative; }
.mrd-hero__headline em::after {
  content: "_"; color: var(--accent); margin-left: 2px;
  animation: mrd-blink 1.1s steps(2, end) infinite;
}
@keyframes mrd-blink { 50% { opacity: 0; } }
.mrd-hero__lede {
  font-family: var(--font-display); font-weight: 400; font-size: 21px;
  line-height: 1.5; color: var(--bone-2); max-width: 52ch; margin: 32px 0 0;
}
.mrd-hero__actions { display: flex; gap: 10px; margin-top: 40px; align-items: center; flex-wrap: wrap; }
.mrd-hero__caption { font-family: var(--font-mono); font-size: 11.5px; color: var(--bone-3); margin-left: 10px; }
.mrd-hero__meta {
  margin-top: 72px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
  background: var(--line); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  max-width: 720px;
}
.mrd-hero__meta-cell { background: var(--ink); padding: 24px 0 18px; }
.mrd-hero__meta-k { font-family: var(--font-display); font-weight: 500; font-size: 28px; letter-spacing: -0.01em; color: var(--bone); }
.mrd-hero__meta-l { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--bone-3); margin-top: 6px; }
.mrd-hero__vis {
  position: absolute; right: var(--sec-pad-x); top: 180px; width: 440px;
  border: 1px solid var(--line); border-radius: var(--r-lg);
  background: linear-gradient(180deg, var(--ink-2), var(--ink-1));
  overflow: hidden; box-shadow: var(--shadow-menu); z-index: 1;
}
.mrd-hero__vis-head {
  display: flex; align-items: center; gap: 8px; padding: 12px 14px;
  border-bottom: 1px solid var(--line); font-family: var(--font-mono);
  font-size: 11px; color: var(--bone-3);
}
.mrd-hero__vis-dots { display: flex; gap: 5px; }
.mrd-hero__vis-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--ink-2); border: 1px solid var(--line-strong); }
.mrd-hero__vis-body { padding: 18px 16px; font-family: var(--font-mono); font-size: 12px; line-height: 1.7; color: var(--bone-2); }
.mrd-hero__vis-body .ln { display: block; }
.mrd-hero__vis-body .k { color: var(--bone-3); }
.mrd-hero__vis-body .v { color: var(--bone); }
.mrd-hero__vis-body .a { color: var(--accent); }
.mrd-hero__vis-body .c { color: var(--bone-3); }
.mrd-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-weight: 500; font-size: 13.5px;
  letter-spacing: -0.005em; border-radius: var(--r-md); padding: 10px 14px;
  transition: all 140ms ease; border: 1px solid transparent; text-decoration: none;
}
.mrd-btn--lg { padding: 14px 20px; font-size: 15px; border-radius: var(--r-md); }
.mrd-btn--primary { background: var(--accent); color: var(--accent-ink); }
.mrd-btn--primary:hover { filter: brightness(1.06); }
.mrd-btn--ghost { color: var(--bone); border-color: var(--line); background: transparent; }
.mrd-btn--ghost:hover { border-color: var(--line-strong); background: var(--ink-1); }
.mrd-btn--arrow::after { content: "→"; font-family: var(--font-mono); font-size: 13px; }
@media (max-width: 1100px) {
  .mrd-hero { padding-top: 96px; }
  .mrd-hero__inner { padding-right: 0; }
  .mrd-hero__vis { position: static; width: 100%; margin-top: 48px; }
}
[data-variant="marketing"] .mrd-hero { padding-top: 112px; padding-bottom: 128px; }
[data-variant="marketing"] .mrd-hero__grid { opacity: 0.35; }
[data-variant="marketing"] .mrd-hero__top { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; text-transform: none; color: var(--bone-2); }
[data-variant="marketing"] .mrd-hero__rule { max-width: 80px; }
[data-variant="marketing"] .mrd-hero__headline { letter-spacing: -0.025em; font-weight: 500; }
[data-variant="marketing"] .mrd-btn { border-radius: 12px; font-family: var(--font-body); font-weight: 500; }
[data-variant="marketing"] .mrd-btn--arrow::after { font-family: var(--font-body); }
`;
