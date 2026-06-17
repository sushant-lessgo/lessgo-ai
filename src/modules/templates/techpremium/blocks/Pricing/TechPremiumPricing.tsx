'use client';

// src/modules/templates/techpremium/blocks/Pricing/TechPremiumPricing.tsx
// TechPremium pricing: eyebrow + head, 2-3 hairline tier cards, featured tier =
// forest border + "Most chosen" lime badge. Edit mode. Nested features:string[] +
// featured flag; per-tier CTA key `tiers_cta_${id}`. Storage shape mirrors Meridian
// ThreeTierPricing. Reference: TechPremium.html .pcard / .rstat aesthetic.

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';

interface Tier {
  id: string;
  plan: string;
  amount: string;
  per: string;
  pitch: string;
  features: string[];
  cta_text: string;
  featured: boolean;
}

interface TechPremiumPricingContent {
  eyebrow: string;
  headline: string;
  lede: string;
  tiers: Tier[];
}

interface TechPremiumPricingProps {
  sectionId: string;
}

export default function TechPremiumPricing({ sectionId }: TechPremiumPricingProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumPricingContent>({ sectionId });

  const tiers = blockContent.tiers || [];

  const updateField = <K extends keyof Tier>(id: string, key: K, value: Tier[K]) => {
    handleCollectionUpdate('tiers', tiers.map((t) => (t.id === id ? { ...t, [key]: value } : t)));
  };
  const addTier = () => {
    if (tiers.length >= 3) return;
    handleCollectionUpdate('tiers', [
      ...tiers,
      { id: `tr${Date.now()}`, plan: 'New plan', amount: 'Contact', per: '', pitch: 'Short pitch.', features: ['Feature one', 'Feature two', 'Feature three'], cta_text: 'Enquire', featured: false },
    ]);
  };
  const removeTier = (id: string) => {
    if (tiers.length <= 2) return;
    handleCollectionUpdate('tiers', tiers.filter((t) => t.id !== id));
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
                placeholder="Plans"
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
              placeholder="Pick the system that fits."
            />
            {(blockContent.lede || mode === 'edit') && (
              <TechPremiumEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey="lede"
                value={blockContent.lede}
                onSave={(v) => handleContentUpdate('lede', v)}
                multiline
                className="tp-sec-head__lede"
                placeholder="A one-liner about how the lineup / pricing works."
              />
            )}
          </div>

          <div className="tp-price-grid">
            {tiers.map((t) => {
              const featuresList = Array.isArray(t.features) ? t.features : [];
              return (
                <article key={t.id} className={`tp-pcard${t.featured ? ' tp-pcard--mid' : ''}`}>
                  <TechPremiumEditable
                    as="div"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`tiers_plan_${t.id}`}
                    value={t.plan}
                    onSave={(v) => updateField(t.id, 'plan', v)}
                    enterBehavior="save"
                    className="tp-pcard__plan"
                    placeholder="Plan"
                  />
                  <TechPremiumEditable
                    as="div"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`tiers_amount_${t.id}`}
                    value={t.amount}
                    onSave={(v) => updateField(t.id, 'amount', v)}
                    enterBehavior="save"
                    className="tp-pcard__amount"
                    placeholder="Contact"
                  />
                  {(t.per || mode === 'edit') && (
                    <TechPremiumEditable
                      as="div"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey={`tiers_per_${t.id}`}
                      value={t.per}
                      onSave={(v) => updateField(t.id, 'per', v)}
                      enterBehavior="save"
                      className="tp-pcard__per"
                      placeholder="per unit"
                    />
                  )}
                  <TechPremiumEditable
                    as="p"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`tiers_pitch_${t.id}`}
                    value={t.pitch}
                    onSave={(v) => updateField(t.id, 'pitch', v)}
                    multiline
                    className="tp-pcard__pitch"
                    placeholder="One line on who this is for."
                  />
                  <ul className="tp-pcard__features">
                    {featuresList.map((feat, idx) => (
                      <li key={`${t.id}-f-${idx}`}>
                        <TechPremiumEditable
                          as="span"
                          mode={mode}
                          sectionId={sectionId}
                          elementKey={`tiers_feature_${t.id}_${idx}`}
                          value={feat}
                          onSave={(v) => {
                            const next = [...featuresList];
                            next[idx] = v;
                            updateField(t.id, 'features', next);
                          }}
                          enterBehavior="save"
                          placeholder="Feature line"
                        />
                        {mode === 'edit' && featuresList.length > 1 && (
                          <button
                            type="button"
                            className="tp-pcard__feat-remove"
                            onClick={() => updateField(t.id, 'features', featuresList.filter((_, i) => i !== idx))}
                            aria-label="Remove feature"
                          >×</button>
                        )}
                      </li>
                    ))}
                    {mode === 'edit' && featuresList.length < 6 && (
                      <li>
                        <button
                          type="button"
                          className="tp-pcard__feat-add"
                          onClick={() => updateField(t.id, 'features', [...featuresList, 'New feature'])}
                        >+ feature</button>
                      </li>
                    )}
                  </ul>
                  <div className="tp-pcard__cta-row">
                    <TechPremiumEditable
                      as="span"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey={`tiers_cta_${t.id}`}
                      value={t.cta_text}
                      onSave={(v) => updateField(t.id, 'cta_text', v)}
                      enterBehavior="save"
                      isButton
                      className={`tp-btn ${t.featured ? 'tp-btn--fill' : 'tp-btn--line'} tp-pcard__cta`}
                      placeholder="Enquire"
                    />
                  </div>
                  {mode === 'edit' && (
                    <div className="tp-pcard__edit-actions">
                      <button
                        type="button"
                        className="tp-pcard__feature-toggle"
                        onClick={() => updateField(t.id, 'featured', !t.featured)}
                      >{t.featured ? '★ featured' : '☆ feature'}</button>
                      {tiers.length > 2 && (
                        <button type="button" className="tp-pcard__remove" onClick={() => removeTier(t.id)} aria-label="Remove tier">×</button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
            {mode === 'edit' && tiers.length < 3 && (
              <button type="button" className="tp-pcard tp-pcard--add" onClick={addTier}>+ Add tier</button>
            )}
          </div>
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
.tp-sec-head__lede { font-family:var(--font-body); font-size:18px; line-height:1.7; color:var(--ink-2); margin:0; max-width:60ch; }
.tp-price-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.tp-pcard { border:1px solid var(--line); border-radius:var(--r-lg); padding:32px 28px 28px; background:var(--paper); position:relative; display:flex; flex-direction:column; }
.tp-pcard--mid { border-color:var(--forest); box-shadow:0 16px 40px -28px oklch(0.30 0.04 158 / 0.5); }
.tp-pcard--mid::before { content:"Most chosen"; position:absolute; top:-1px; right:24px; transform:translateY(-50%); font-family:var(--font-mono); font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--forest-d); background:var(--lime); padding:4px 10px; border-radius:999px; }
.tp-pcard__plan { font-family:var(--font-mono); font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--lime-d); }
.tp-pcard__amount { font-family:var(--font-display); font-weight:700; font-size:clamp(34px,4vw,46px); letter-spacing:-0.03em; line-height:1; margin:18px 0 4px; color:var(--ink); }
.tp-pcard__per { font-family:var(--font-mono); font-size:11.5px; color:var(--ink-3); }
.tp-pcard__pitch { font-size:14.5px; color:var(--ink-2); margin:16px 0 22px; line-height:1.55; }
.tp-pcard__features { list-style:none; padding:0; margin:0 0 28px; flex:1; }
.tp-pcard__features li { display:flex; align-items:flex-start; gap:10px; font-size:14px; color:var(--ink-2); padding:8px 0; border-top:1px solid var(--line); }
.tp-pcard__features li:first-child { border-top:0; }
.tp-pcard__features li::before { content:""; width:12px; height:12px; border:1px solid var(--lime-d); border-radius:50%; display:inline-block; flex-shrink:0; margin-top:3px; }
.tp-pcard__feat-remove { margin-left:auto; background:transparent; border:none; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; }
.tp-pcard__feat-add { background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:3px 8px; border-radius:var(--r); cursor:pointer; }
.tp-pcard__features li:has(.tp-pcard__feat-add)::before { display:none; }
.tp-pcard__cta-row { margin-top:auto; }
.tp-pcard__cta { width:100%; }
.tp-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-display); font-weight:600; font-size:14.5px; letter-spacing:-0.005em; padding:13px 22px; border-radius:var(--r); white-space:nowrap; line-height:1; transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease; cursor:pointer; text-decoration:none; border:1px solid transparent; }
.tp-btn--fill { background:var(--forest); color:var(--paper); }
.tp-btn--fill:hover { background:var(--forest-d); transform:translateY(-1px); }
.tp-btn--line { border:1px solid var(--line-2); color:var(--ink); background:var(--paper); }
.tp-btn--line:hover { border-color:var(--forest); color:var(--forest); }
.tp-pcard__edit-actions { position:absolute; top:10px; left:10px; display:flex; gap:6px; }
.tp-pcard__feature-toggle, .tp-pcard__remove { background:var(--paper-2); border:1px solid var(--line-2); color:var(--ink-2); font-size:11px; padding:3px 8px; border-radius:999px; cursor:pointer; }
.tp-pcard__remove { padding:0 7px; font-size:14px; line-height:1.4; }
.tp-pcard--add { border:1px dashed var(--line-2); background:transparent; color:var(--ink-3); font-family:var(--font-body); font-size:14px; cursor:pointer; align-items:center; justify-content:center; min-height:320px; }
.tp-pcard--add:hover { color:var(--forest); border-color:var(--forest); }
@media (max-width:760px){ .tp-price-grid { grid-template-columns:1fr; } }
`;
