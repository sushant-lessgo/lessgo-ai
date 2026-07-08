'use client';

// src/modules/templates/meridian/blocks/Hero/TerminalHero.tsx
// Meridian hero: status eyebrow, display headline w/ accent <em> + blinking caret,
// lede, 2 actions, caption, 4 stat-meta cells, terminal product-vis card. Edit mode.
// Reference: Meridian - Modern Tech.html lines 1181-1225, .hero (CSS ~).
//
// Decorative static (NOT schema fields): .mrd-hero__grid, the blinking caret, and
// the terminal .mrd-hero__vis (aria-hidden). Per PO: the vis is non-editable and
// its copy is NEUTRALIZED — abstract mono key/value lines, no deploy/PR/region
// semantics (Meridian renders on non-devtool SaaS too). The terminal vis is the
// hero's product visual in BOTH modes (no image slot — PO ruling).

import React from 'react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';

interface HeroStat {
  id: string;
  value: string;
  label: string;
}

interface TerminalHeroContent {
  status_text: string;
  audience_tag: string;
  headline: string;
  lede: string;
  cta_text: string;
  cta_subtext: string;
  secondary_cta_text: string;
  caption: string;
  stats: HeroStat[];
}

interface TerminalHeroProps {
  sectionId: string;
}

function TerminalVis() {
  // Decorative, non-editable, copy neutralized (abstract key/value mono lines).
  return (
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
  );
}

export default function TerminalHero({ sectionId }: TerminalHeroProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useMeridianBlock<TerminalHeroContent>({ sectionId });

  const stats = blockContent.stats || [];

  const updateStat = (id: string, key: keyof HeroStat, value: string) => {
    handleCollectionUpdate('stats', stats.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };
  const addStat = () => {
    if (stats.length >= 4) return;
    handleCollectionUpdate('stats', [...stats, { id: `st${Date.now()}`, value: '00', label: 'metric' }]);
  };
  const removeStat = (id: string) => {
    handleCollectionUpdate('stats', stats.filter((s) => s.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="mrd-hero" data-section-id={sectionId}>
        <div className="mrd-hero__grid" aria-hidden="true" />
        <div className="mrd-hero__inner">
          {(blockContent.status_text || blockContent.audience_tag || mode === 'edit') && (
            <div className="mrd-hero__top">
              <span className="mrd-hero__dot" />
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="status_text"
                value={blockContent.status_text}
                onSave={(v) => handleContentUpdate('status_text', v)}
                enterBehavior="save"
                placeholder="status · live now"
              />
              <span className="mrd-hero__rule" />
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="audience_tag"
                value={blockContent.audience_tag}
                onSave={(v) => handleContentUpdate('audience_tag', v)}
                enterBehavior="save"
                placeholder="for your audience"
              />
            </div>
          )}

          <MeridianEditable
            as="h1"
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            value={blockContent.headline}
            onSave={(v) => handleContentUpdate('headline', v)}
            enterBehavior="save"
            className="mrd-hero__headline"
            placeholder="Your headline with an <em>accent</em>"
          />

          <MeridianEditable
            as="p"
            mode={mode}
            sectionId={sectionId}
            elementKey="lede"
            value={blockContent.lede}
            onSave={(v) => handleContentUpdate('lede', v)}
            multiline
            className="mrd-hero__lede"
            placeholder="One long sentence framing the value, then one short."
          />

          <div className="mrd-hero__actions">
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
              placeholder="Start building"
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
                placeholder="Read the docs"
              />
            )}
            {(blockContent.caption || mode === 'edit') && (
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="caption"
                value={blockContent.caption}
                onSave={(v) => handleContentUpdate('caption', v)}
                enterBehavior="save"
                className="mrd-hero__caption"
                placeholder="no credit card · free trial"
              />
            )}
          </div>

          {(blockContent.cta_subtext || mode === 'edit') && (
            <MeridianEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="cta_subtext"
              value={blockContent.cta_subtext}
              onSave={(v) => handleContentUpdate('cta_subtext', v)}
              enterBehavior="save"
              className="mrd-hero__cta-subtext"
              placeholder="7 days free · no credit card"
            />
          )}

          {(stats.length > 0 || mode === 'edit') && (
            <div className="mrd-hero__meta">
              {stats.map((s) => (
                <div key={s.id} className="mrd-hero__meta-cell">
                  <MeridianEditable
                    as="div"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`stats_value_${s.id}`}
                    value={s.value}
                    onSave={(v) => updateStat(s.id, 'value', v)}
                    enterBehavior="save"
                    className="mrd-hero__meta-k"
                    placeholder="00"
                  />
                  <MeridianEditable
                    as="div"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`stats_label_${s.id}`}
                    value={s.label}
                    onSave={(v) => updateStat(s.id, 'label', v)}
                    enterBehavior="save"
                    className="mrd-hero__meta-l"
                    placeholder="metric"
                  />
                  {mode === 'edit' && (
                    <button
                      type="button"
                      className="mrd-hero__meta-remove"
                      onClick={() => removeStat(s.id)}
                      aria-label="Remove stat"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {mode === 'edit' && stats.length < 4 && (
                <button type="button" className="mrd-hero__meta-cell mrd-hero__meta-add" onClick={addStat}>
                  + stat
                </button>
              )}
            </div>
          )}
        </div>

        <TerminalVis />
      </section>
    </>
  );
}

const STYLES = `
.mrd-hero {
  position: relative;
  padding: 140px var(--sec-pad-x) 120px;
  max-width: 1340px; margin: 0 auto;
  overflow: hidden;
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
.mrd-hero__cta-subtext { font-family: var(--font-mono); font-size: 12px; color: var(--bone-3); margin: 14px 0 0; }
.mrd-hero__meta {
  margin-top: 72px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
  background: var(--line); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  max-width: 720px;
}
.mrd-hero__meta-cell { position: relative; background: var(--ink); padding: 24px 0 18px; }
.mrd-hero__meta-k { font-family: var(--font-display); font-weight: 500; font-size: 28px; letter-spacing: -0.01em; color: var(--bone); }
.mrd-hero__meta-l { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--bone-3); margin-top: 6px; }
.mrd-hero__meta-remove {
  position: absolute; top: 6px; right: 6px; width: 18px; height: 18px;
  background: transparent; border: none; color: var(--bone-3); font-size: 13px; cursor: pointer; line-height: 1;
}
.mrd-hero__meta-add {
  border: 1px dashed var(--line-strong); background: transparent; color: var(--bone-3);
  font-family: var(--font-mono); font-size: 11px; cursor: pointer; display: grid; place-items: center;
}
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
  transition: all 140ms ease; border: 1px solid transparent; cursor: pointer; text-decoration: none;
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
