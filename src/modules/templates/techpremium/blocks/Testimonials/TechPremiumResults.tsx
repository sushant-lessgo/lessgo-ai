'use client';

// src/modules/templates/techpremium/blocks/Testimonials/TechPremiumResults.tsx
// TechPremium results / proof: eyebrow + head, testimonial cards (pill + quote +
// who), and a logo rail. Edit mode. Consumes the product `testimonials` + `logos`
// collections. Reference: TechPremium.html .results / .t-grid (lines 303-316,
// 998-1037) + logo rail (.trust-logos).
// Avatars are decorative gradient circles (static, no image slot).

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';

interface Testimonial {
  id: string;
  quote: string;
  author_name: string;
  author_role: string;
}

interface ResultStat {
  id: string;
  value: string;
  label: string;
}

interface Logo {
  id: string;
  name: string;
}

interface TechPremiumResultsContent {
  eyebrow: string;
  headline: string;
  stats: ResultStat[];
  testimonials: Testimonial[];
  logos: Logo[];
}

interface TechPremiumResultsProps {
  sectionId: string;
}

export default function TechPremiumResults({ sectionId }: TechPremiumResultsProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumResultsContent>({ sectionId });

  const stats = blockContent.stats || [];
  const testimonials = blockContent.testimonials || [];
  const logos = blockContent.logos || [];

  const updateStat = (id: string, key: keyof ResultStat, value: string) => {
    handleCollectionUpdate('stats', stats.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };
  const addStat = () => {
    if (stats.length >= 3) return;
    handleCollectionUpdate('stats', [...stats, { id: `rs${Date.now()}`, value: '00%', label: 'metric' }]);
  };
  const removeStat = (id: string) => {
    handleCollectionUpdate('stats', stats.filter((s) => s.id !== id));
  };

  const updateTesti = (id: string, key: keyof Testimonial, value: string) => {
    handleCollectionUpdate('testimonials', testimonials.map((t) => (t.id === id ? { ...t, [key]: value } : t)));
  };
  const addTesti = () => {
    if (testimonials.length >= 3) return;
    handleCollectionUpdate('testimonials', [
      ...testimonials,
      { id: `t${Date.now()}`, quote: 'A short, specific quote.', author_name: 'Name', author_role: 'Role · Company' },
    ]);
  };
  const removeTesti = (id: string) => {
    if (testimonials.length <= 1) return;
    handleCollectionUpdate('testimonials', testimonials.filter((t) => t.id !== id));
  };

  const updateLogo = (id: string, name: string) => {
    handleCollectionUpdate('logos', logos.map((l) => (l.id === id ? { ...l, name } : l)));
  };
  const addLogo = () => {
    if (logos.length >= 6) return;
    handleCollectionUpdate('logos', [...logos, { id: `lg${Date.now()}`, name: 'Brand' }]);
  };
  const removeLogo = (id: string) => {
    handleCollectionUpdate('logos', logos.filter((l) => l.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec" data-section-id={sectionId}>
        <div className="tp-sec__inner">
          <div className="tp-sec-head">
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
                placeholder="Results in the field"
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
              className="tp-sec-head__h2"
              placeholder="The numbers customers came back with."
            />
          </div>

          {(stats.length > 0 || mode === 'edit') && (
            <div className="tp-results-stats">
              {stats.map((s) => (
                <div key={s.id} className="tp-rstat">
                  <TechPremiumEditable
                    as="div"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`stats_value_${s.id}`}
                    value={s.value}
                    onSave={(v) => updateStat(s.id, 'value', v)}
                    enterBehavior="save"
                    className="tp-rstat__v"
                    placeholder="00%"
                  />
                  <TechPremiumEditable
                    as="div"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`stats_label_${s.id}`}
                    value={s.label}
                    onSave={(v) => updateStat(s.id, 'label', v)}
                    enterBehavior="save"
                    className="tp-rstat__l"
                    placeholder="metric label"
                  />
                  {mode === 'edit' && (
                    <button type="button" className="tp-rstat__remove" onClick={() => removeStat(s.id)} aria-label="Remove stat">×</button>
                  )}
                </div>
              ))}
              {mode === 'edit' && stats.length < 3 && (
                <button type="button" className="tp-rstat tp-rstat--add" onClick={addStat}>+ stat</button>
              )}
            </div>
          )}

          <div className="tp-t-grid">
            {testimonials.map((t) => (
              <article key={t.id} className="tp-tcard">
                <span className="tp-pill"><span className="tp-pill__dot" />Verified</span>
                <TechPremiumEditable
                  as="p"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`testimonials_quote_${t.id}`}
                  value={t.quote}
                  onSave={(v) => updateTesti(t.id, 'quote', v)}
                  multiline
                  className="tp-tcard__quote"
                  placeholder="A short, specific quote in the customer's voice."
                />
                <div className="tp-tcard__who">
                  <span className="tp-tcard__av" aria-hidden="true" />
                  <div>
                    <TechPremiumEditable
                      as="div"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey={`testimonials_name_${t.id}`}
                      value={t.author_name}
                      onSave={(v) => updateTesti(t.id, 'author_name', v)}
                      enterBehavior="save"
                      className="tp-tcard__name"
                      placeholder="Author name"
                    />
                    <TechPremiumEditable
                      as="div"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey={`testimonials_role_${t.id}`}
                      value={t.author_role}
                      onSave={(v) => updateTesti(t.id, 'author_role', v)}
                      enterBehavior="save"
                      className="tp-tcard__role"
                      placeholder="Role · Company"
                    />
                  </div>
                </div>
                {mode === 'edit' && testimonials.length > 1 && (
                  <button type="button" className="tp-tcard__remove" onClick={() => removeTesti(t.id)} aria-label="Remove testimonial">×</button>
                )}
              </article>
            ))}
            {mode === 'edit' && testimonials.length < 3 && (
              <button type="button" className="tp-tcard tp-tcard--add" onClick={addTesti}>+ Add quote</button>
            )}
          </div>

          {(logos.length > 0 || mode === 'edit') && (
            <div className="tp-logos">
              {logos.map((l) => (
                <span key={l.id} className="tp-logo">
                  <TechPremiumEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`logos_name_${l.id}`}
                    value={l.name}
                    onSave={(v) => updateLogo(l.id, v)}
                    enterBehavior="save"
                    placeholder="Brand"
                  />
                  {mode === 'edit' && (
                    <button type="button" className="tp-logo__remove" onClick={() => removeLogo(l.id)} aria-label="Remove logo">×</button>
                  )}
                </span>
              ))}
              {mode === 'edit' && logos.length < 6 && (
                <button type="button" className="tp-logo tp-logo--add" onClick={addLogo}>+ logo</button>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.tp-sec { padding: var(--pad-y) var(--pad-x); }
.tp-sec__inner { max-width: var(--max-w); margin: 0 auto; }
.tp-sec-head { max-width: 64ch; display: flex; flex-direction: column; gap: 16px; margin-bottom: 48px; }
.tp-eyebrow { font-family:var(--font-mono); font-weight:500; font-size:11.5px; letter-spacing:0.20em; text-transform:uppercase; color:var(--lime-d); display:inline-flex; align-items:center; gap:10px; align-self:flex-start; }
.tp-eyebrow::before { content:""; width:22px; height:1px; background:var(--line-2); }
.tp-sec-head__h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
.tp-pill { display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:10.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; padding:4px 9px 4px 7px; border-radius:999px; color:var(--ok); background:var(--ok-bg); border:1px solid oklch(0.66 0.15 150 / 0.30); align-self:flex-start; }
.tp-pill__dot { width:6px; height:6px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 3px var(--ok-bg); }
.tp-results-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-bottom:40px; }
.tp-rstat { position:relative; border:1px solid var(--line); border-radius:var(--r-lg); padding:28px 26px; background:var(--paper); }
.tp-rstat__v { font-family:var(--font-display); font-weight:700; font-size:clamp(34px,4vw,46px); letter-spacing:-0.03em; color:var(--forest); line-height:1; }
.tp-rstat__l { font-family:var(--font-mono); font-size:11px; letter-spacing:0.10em; text-transform:uppercase; color:var(--ink-3); margin-top:12px; }
.tp-rstat__remove { position:absolute; top:12px; right:12px; width:22px; height:22px; background:transparent; border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; }
.tp-rstat--add { border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-body); font-size:14px; cursor:pointer; display:grid; place-items:center; min-height:120px; }
.tp-rstat--add:hover { color:var(--forest); border-color:var(--forest); }
.tp-t-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
@media (max-width:760px){ .tp-results-stats { grid-template-columns:1fr; } }
.tp-tcard { border:1px solid var(--line); border-radius:var(--r-lg); padding:28px 26px; background:var(--paper); display:flex; flex-direction:column; gap:18px; position:relative; }
.tp-tcard__quote { font-family:var(--font-display); font-weight:500; font-size:18.5px; line-height:1.45; color:var(--ink); letter-spacing:-0.01em; margin:0; flex:1; }
.tp-tcard__who { display:flex; align-items:center; gap:13px; margin-top:auto; }
.tp-tcard__av { width:42px; height:42px; border-radius:50%; flex:none; background:linear-gradient(135deg, var(--paper-3), var(--line-2)); border:1px solid var(--line-2); }
.tp-tcard__name { font-family:var(--font-display); font-weight:600; font-size:15px; color:var(--ink); }
.tp-tcard__role { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); margin-top:2px; }
.tp-tcard__remove { position:absolute; top:12px; right:12px; width:22px; height:22px; background:transparent; border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; }
.tp-tcard--add { border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-body); font-size:14px; cursor:pointer; align-items:center; justify-content:center; min-height:180px; }
.tp-tcard--add:hover { color:var(--forest); border-color:var(--forest); }
.tp-logos { display:flex; flex-wrap:wrap; align-items:center; gap:14px 18px; margin-top:40px; }
.tp-logo { position:relative; height:34px; min-width:96px; padding:0 16px; border:1px dashed var(--line-2); border-radius:var(--r); display:grid; place-items:center; font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.06em; color:var(--ink-3); background:var(--paper); }
.tp-logo__remove { position:absolute; top:-7px; right:-7px; width:18px; height:18px; background:var(--paper); border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:11px; line-height:1; cursor:pointer; }
.tp-logo--add { cursor:pointer; color:var(--ink-3); }
.tp-logo--add:hover { color:var(--forest); border-color:var(--forest); }
@media (max-width:760px){ .tp-t-grid { grid-template-columns:1fr; } }
`;
