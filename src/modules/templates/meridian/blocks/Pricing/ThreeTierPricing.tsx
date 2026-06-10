'use client';

// src/modules/templates/meridian/blocks/Pricing/ThreeTierPricing.tsx
// Meridian pricing: eyebrow + title + lede, 2-3 tier cards, featured tier = .mid
// ("Most chosen" badge). Edit mode. Nested features:string[] + featured flag —
// storage shape mirrors Hearth TieredPackages.
// Reference: Meridian - Modern Tech.html lines 1349-1396.

import React from 'react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';

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

interface ThreeTierPricingContent {
  eyebrow: string;
  headline: string;
  lede: string;
  tiers: Tier[];
}

interface ThreeTierPricingProps {
  sectionId: string;
}

export default function ThreeTierPricing({ sectionId }: ThreeTierPricingProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useMeridianBlock<ThreeTierPricingContent>({ sectionId });

  const tiers = blockContent.tiers || [];

  const updateField = <K extends keyof Tier>(id: string, key: K, value: Tier[K]) => {
    handleCollectionUpdate('tiers', tiers.map((t) => (t.id === id ? { ...t, [key]: value } : t)));
  };
  const addTier = () => {
    if (tiers.length >= 3) return;
    handleCollectionUpdate('tiers', [
      ...tiers,
      { id: `tr${Date.now()}`, plan: 'New plan', amount: '$0', per: 'per month', pitch: 'Short pitch.', features: ['Feature one', 'Feature two', 'Feature three'], cta_text: 'Start free', featured: false },
    ]);
  };
  const removeTier = (id: string) => {
    if (tiers.length <= 2) return;
    handleCollectionUpdate('tiers', tiers.filter((t) => t.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="mrd-section" data-section-id={sectionId}>
        {(blockContent.eyebrow || mode === 'edit') && (
          <div className="mrd-eyebrow">
            <MeridianEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="eyebrow"
              value={blockContent.eyebrow}
              onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save"
              placeholder="pricing"
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
          className="mrd-section-title"
          placeholder="Simple, transparent pricing."
        />
        {(blockContent.lede || mode === 'edit') && (
          <MeridianEditable
            as="p"
            mode={mode}
            sectionId={sectionId}
            elementKey="lede"
            value={blockContent.lede}
            onSave={(v) => handleContentUpdate('lede', v)}
            multiline
            className="mrd-section-lede"
            placeholder="A one-liner about how pricing works."
          />
        )}

        <div className="mrd-price-grid">
          {tiers.map((t) => {
            const featuresList = Array.isArray(t.features) ? t.features : [];
            return (
              <article key={t.id} className={`mrd-price-card${t.featured ? ' mrd-price-card--mid' : ''}`}>
                <MeridianEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`tiers_plan_${t.id}`}
                  value={t.plan}
                  onSave={(v) => updateField(t.id, 'plan', v)}
                  enterBehavior="save"
                  className="mrd-price-card__plan"
                  placeholder="Plan"
                />
                <MeridianEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`tiers_amount_${t.id}`}
                  value={t.amount}
                  onSave={(v) => updateField(t.id, 'amount', v)}
                  enterBehavior="save"
                  className="mrd-price-card__amount"
                  placeholder="$0"
                />
                <MeridianEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`tiers_per_${t.id}`}
                  value={t.per}
                  onSave={(v) => updateField(t.id, 'per', v)}
                  enterBehavior="save"
                  className="mrd-price-card__per"
                  placeholder="per month"
                />
                <MeridianEditable
                  as="p"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`tiers_pitch_${t.id}`}
                  value={t.pitch}
                  onSave={(v) => updateField(t.id, 'pitch', v)}
                  multiline
                  className="mrd-price-card__pitch"
                  placeholder="One line on who this plan is for."
                />
                <ul className="mrd-price-card__features">
                  {featuresList.map((feat, idx) => (
                    <li key={`${t.id}-f-${idx}`}>
                      <MeridianEditable
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
                          className="mrd-price-card__feat-remove"
                          onClick={() => updateField(t.id, 'features', featuresList.filter((_, i) => i !== idx))}
                          aria-label="Remove feature"
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ))}
                  {mode === 'edit' && featuresList.length < 6 && (
                    <li>
                      <button
                        type="button"
                        className="mrd-price-card__feat-add"
                        onClick={() => updateField(t.id, 'features', [...featuresList, 'New feature'])}
                      >
                        + feature
                      </button>
                    </li>
                  )}
                </ul>
                <div className="mrd-price-card__cta-row">
                  <MeridianEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`tiers_cta_${t.id}`}
                    value={t.cta_text}
                    onSave={(v) => updateField(t.id, 'cta_text', v)}
                    enterBehavior="save"
                    isButton
                    className={`mrd-btn ${t.featured ? 'mrd-btn--primary' : 'mrd-btn--ghost'} mrd-btn--arrow mrd-price-card__cta`}
                    placeholder="Start free"
                  />
                </div>
                {mode === 'edit' && (
                  <div className="mrd-price-card__edit-actions">
                    <button
                      type="button"
                      className="mrd-price-card__feature-toggle"
                      onClick={() => updateField(t.id, 'featured', !t.featured)}
                    >
                      {t.featured ? '★ featured' : '☆ feature'}
                    </button>
                    {tiers.length > 2 && (
                      <button
                        type="button"
                        className="mrd-price-card__remove"
                        onClick={() => removeTier(t.id)}
                        aria-label="Remove tier"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
          {mode === 'edit' && tiers.length < 3 && (
            <button type="button" className="mrd-price-card mrd-price-card--add" onClick={addTier}>
              + Add tier
            </button>
          )}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.mrd-section { padding: var(--sec-pad-y) var(--sec-pad-x); max-width: 1340px; margin: 0 auto; position: relative; }
.mrd-eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--bone-3);
  display: inline-flex; align-items: center; gap: 10px;
}
.mrd-eyebrow::after { content: ""; width: 32px; height: 1px; background: var(--line-strong); display: inline-block; }
.mrd-section-title {
  font-family: var(--font-display); font-weight: 500; font-size: 52px;
  line-height: 1.05; letter-spacing: -0.025em; color: var(--bone);
  max-width: 22ch; margin: 22px 0 0;
}
.mrd-section-lede {
  font-family: var(--font-display); font-size: 19px; line-height: 1.5;
  color: var(--bone-2); max-width: 58ch; margin: 16px 0 0;
}
.mrd-price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 64px; }
@media (max-width: 900px) { .mrd-price-grid { grid-template-columns: 1fr; } }
.mrd-price-card {
  border: 1px solid var(--line); border-radius: var(--r-lg);
  padding: 32px 28px 28px; background: var(--ink); position: relative;
  display: flex; flex-direction: column;
}
.mrd-price-card--mid { background: linear-gradient(180deg, var(--ink-1), var(--ink)); border-color: var(--line-strong); }
.mrd-price-card--mid::before {
  content: "Most chosen"; position: absolute; top: -1px; right: 24px;
  transform: translateY(-50%); font-family: var(--font-mono); font-size: 10.5px;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-ink);
  background: var(--accent); padding: 4px 10px; border-radius: var(--r-pill);
}
.mrd-price-card__plan { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; color: var(--bone-3); text-transform: uppercase; }
.mrd-price-card__amount {
  font-family: var(--font-display); font-weight: 500; font-size: 56px;
  letter-spacing: -0.03em; line-height: 1; margin: 20px 0 4px; color: var(--bone);
}
.mrd-price-card__per { font-family: var(--font-mono); font-size: 11.5px; color: var(--bone-3); }
.mrd-price-card__pitch { font-family: var(--font-display); font-size: 15px; color: var(--bone-2); margin: 18px 0 24px; max-width: 28ch; }
.mrd-price-card__features { list-style: none; padding: 0; margin: 0 0 28px; flex: 1; }
.mrd-price-card__features li {
  display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;
  color: var(--bone-2); padding: 8px 0; border-top: 1px solid var(--line-soft);
}
.mrd-price-card__features li:first-child { border-top: 0; }
.mrd-price-card__features li::before {
  content: ""; width: 12px; height: 12px; border: 1px solid var(--accent);
  border-radius: 50%; display: inline-block; flex-shrink: 0; margin-top: 3px;
}
.mrd-price-card__feat-remove {
  margin-left: auto; background: transparent; border: none; color: var(--bone-3);
  font-size: 13px; line-height: 1; cursor: pointer;
}
.mrd-price-card__feat-add {
  background: transparent; border: 1px dashed var(--line-strong); color: var(--bone-3);
  font-family: var(--font-mono); font-size: 11px; padding: 3px 8px; border-radius: var(--r-sm); cursor: pointer;
}
.mrd-price-card__features li:has(.mrd-price-card__feat-add)::before { display: none; }
.mrd-price-card__cta-row { margin-top: auto; }
.mrd-price-card__cta { width: 100%; justify-content: space-between; }
.mrd-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-weight: 500; font-size: 13.5px;
  letter-spacing: -0.005em; border-radius: var(--r-md); padding: 12px 16px;
  transition: all 140ms ease; border: 1px solid transparent; cursor: pointer; text-decoration: none;
}
.mrd-btn--primary { background: var(--accent); color: var(--accent-ink); }
.mrd-btn--primary:hover { filter: brightness(1.06); }
.mrd-btn--ghost { color: var(--bone); border-color: var(--line); background: transparent; }
.mrd-btn--ghost:hover { border-color: var(--line-strong); background: var(--ink-1); }
.mrd-btn--arrow::after { content: "→"; font-family: var(--font-mono); font-size: 13px; }
.mrd-price-card__edit-actions { position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; }
.mrd-price-card__feature-toggle, .mrd-price-card__remove {
  background: var(--ink-2); border: 1px solid var(--line-strong); color: var(--bone-2);
  font-size: 11px; padding: 3px 8px; border-radius: var(--r-pill); cursor: pointer;
}
.mrd-price-card__remove { padding: 0 7px; font-size: 14px; line-height: 1.4; }
.mrd-price-card--add {
  border: 1px dashed var(--line-strong); background: transparent; color: var(--bone-3);
  font-family: var(--font-body); font-size: 14px; cursor: pointer; align-items: center; justify-content: center; min-height: 320px;
}
.mrd-price-card--add:hover { color: var(--accent); border-color: var(--accent); }
[data-variant="marketing"] .mrd-eyebrow { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; text-transform: none; font-weight: 500; color: var(--bone-2); }
[data-variant="marketing"] .mrd-eyebrow::after { display: none; }
[data-variant="marketing"] .mrd-section-title { font-weight: 500; font-size: 56px; letter-spacing: -0.03em; }
[data-variant="marketing"] .mrd-btn { border-radius: 12px; font-family: var(--font-body); font-weight: 500; }
[data-variant="marketing"] .mrd-btn--arrow::after { font-family: var(--font-body); }
`;
