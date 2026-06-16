'use client';

// src/modules/service/blocks/Packages/TieredPackages.tsx
// Hearth tiered packages: 1-3 pricing cards, middle tier featured. Edit mode.
// Reference: Hearth - Warm Service.html lines 1540-1581, .price-card (575-641).

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { HearthEditable } from '../../components/HearthEditable';

interface PackageTier {
  id: string;
  name: string;
  price_display: string;
  timeline: string;
  features: string[];
  cta_text: string;
  is_featured: boolean;
}

interface TieredPackagesContent {
  eyebrow: string;
  headline: string;
  lede: string;
  packages: PackageTier[];
}

interface TieredPackagesProps {
  sectionId: string;
}

export default function TieredPackages({ sectionId }: TieredPackagesProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useServiceBlock<TieredPackagesContent>({ sectionId });

  const packages = blockContent.packages || [];

  const updateField = <K extends keyof PackageTier>(id: string, key: K, value: PackageTier[K]) => {
    handleCollectionUpdate(
      'packages',
      packages.map((p) => (p.id === id ? { ...p, [key]: value } : p))
    );
  };

  const addPackage = () => {
    if (packages.length >= 3) return;
    handleCollectionUpdate('packages', [
      ...packages,
      {
        id: `p${Date.now()}`,
        name: 'New tier',
        price_display: '$0',
        timeline: '—',
        features: ['Feature one', 'Feature two', 'Feature three', 'Feature four'],
        cta_text: 'Book a call',
        is_featured: false,
      },
    ]);
  };

  const removePackage = (id: string) => {
    if (packages.length <= 1) return;
    handleCollectionUpdate(
      'packages',
      packages.filter((p) => p.id !== id)
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-pkg" data-section-id={sectionId}>
        <div className="hearth-pkg__head">
          {(blockContent.eyebrow || mode === 'edit') && (
            <HearthEditable
              as="div"
              mode={mode}
              sectionId={sectionId}
              elementKey="eyebrow"
              value={blockContent.eyebrow}
              onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save"
              className="hearth-eyebrow"
              placeholder="Engagements"
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
            className="hearth-section-title"
            placeholder="Ways to work together"
          />
          {(blockContent.lede || mode === 'edit') && (
            <HearthEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="lede"
              value={blockContent.lede}
              onSave={(v) => handleContentUpdate('lede', v)}
              multiline
              className="hearth-section-lede"
              placeholder="One-liner about pricing transparency."
            />
          )}
        </div>

        <div className="hearth-pkg__grid">
          {packages.map((p) => {
            const featuresList = Array.isArray(p.features) ? p.features : [];
            return (
              <article
                key={p.id}
                className={`hearth-pkg__card${p.is_featured ? ' is-featured' : ''}`}
              >
                <HearthEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`packages_name_${p.id}`}
                  value={p.name}
                  onSave={(v) => updateField(p.id, 'name', v)}
                  enterBehavior="save"
                  className="hearth-pkg__name"
                  placeholder="Tier name"
                />
                <HearthEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`packages_price_${p.id}`}
                  value={p.price_display}
                  onSave={(v) => updateField(p.id, 'price_display', v)}
                  enterBehavior="save"
                  className="hearth-pkg__amount"
                  placeholder="$5,000"
                />
                <HearthEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`packages_timeline_${p.id}`}
                  value={p.timeline}
                  onSave={(v) => updateField(p.id, 'timeline', v)}
                  enterBehavior="save"
                  className="hearth-pkg__per"
                  placeholder="4–6 weeks"
                />
                <ul className="hearth-pkg__features">
                  {featuresList.map((feat, idx) => (
                    <li key={`${p.id}-f-${idx}`}>
                      <HearthEditable
                        as="span"
                        mode={mode}
                        sectionId={sectionId}
                        elementKey={`packages_feature_${p.id}_${idx}`}
                        value={feat}
                        onSave={(v) => {
                          const next = [...featuresList];
                          next[idx] = v;
                          updateField(p.id, 'features', next);
                        }}
                        enterBehavior="save"
                        placeholder="Feature line"
                      />
                    </li>
                  ))}
                </ul>
                <HearthEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`packages_cta_${p.id}`}
                  value={p.cta_text}
                  onSave={(v) => updateField(p.id, 'cta_text', v)}
                  enterBehavior="save"
                  isButton
                  className={`hearth-btn ${p.is_featured ? 'hearth-btn--primary-inverse' : 'hearth-btn--ghost'} hearth-pkg__cta`}
                  placeholder="Book a call"
                />
                {mode === 'edit' && (
                  <div className="hearth-pkg__edit-actions">
                    <button
                      type="button"
                      onClick={() => updateField(p.id, 'is_featured', !p.is_featured)}
                      className="hearth-pkg__feature-toggle"
                    >
                      {p.is_featured ? '★ featured' : '☆ feature'}
                    </button>
                    {packages.length > 1 && (
                      <button
                        type="button"
                        className="hearth-pkg__remove"
                        onClick={() => removePackage(p.id)}
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
          {mode === 'edit' && packages.length < 3 && (
            <button type="button" className="hearth-pkg__card hearth-pkg__add" onClick={addPackage}>
              + Add tier
            </button>
          )}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.hearth-pkg {
  max-width: var(--max-w); margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
}
.hearth-pkg__head { text-align: center; margin-bottom: 64px; }
.hearth-pkg__grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  align-items: stretch;
}
@media (max-width: 900px) { .hearth-pkg__grid { grid-template-columns: 1fr; } }
.hearth-pkg__card {
  position: relative;
  background: var(--cream-1); border: 1px solid var(--sand);
  border-radius: var(--r-xl); padding: 44px 40px 36px;
  display: flex; flex-direction: column; gap: 16px;
}
.hearth-pkg__card.is-featured {
  background: var(--ink); color: var(--cream);
  transform: translateY(-12px); box-shadow: var(--shadow-lift);
  border-color: transparent;
}
.hearth-pkg__name {
  font-family: var(--font-display); font-weight: 500; font-size: 24px;
  color: var(--accent-deep);
}
.hearth-pkg__card.is-featured .hearth-pkg__name { color: var(--clay); }
.hearth-pkg__amount {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(40px, 5vw, 64px); line-height: 1;
  color: var(--ink); letter-spacing: -0.015em;
}
.hearth-pkg__card.is-featured .hearth-pkg__amount { color: var(--cream); }
.hearth-pkg__per {
  font-family: var(--font-display); font-style: italic;
  font-size: 14px; color: var(--ink-2);
}
.hearth-pkg__card.is-featured .hearth-pkg__per { color: oklch(0.72 0.01 60); }
.hearth-pkg__features {
  list-style: none; padding: 0; margin: 16px 0 24px;
  display: flex; flex-direction: column;
}
.hearth-pkg__features li {
  font-family: var(--font-body); font-size: 14.5px; color: var(--ink-2);
  padding: 12px 0; border-top: 1px solid var(--line); position: relative;
  padding-left: 22px;
}
.hearth-pkg__card.is-featured .hearth-pkg__features li {
  color: oklch(0.88 0.01 60); border-top-color: oklch(1 0 0 / 0.08);
}
.hearth-pkg__features li:first-child { border-top: 0; }
.hearth-pkg__features li::before {
  content: "✓"; position: absolute; left: 0; top: 12px;
  color: var(--sage); font-weight: 600;
}
.hearth-pkg__cta {
  width: 100%; justify-content: center; margin-top: auto;
  padding: 14px 18px; text-align: center;
}
.hearth-btn--primary-inverse {
  background: var(--cream); color: var(--ink);
  padding: 14px 18px; border-radius: var(--r-sm);
  font-family: var(--font-body); font-weight: 500;
  cursor: pointer; display: inline-block; text-align: center;
}
.hearth-pkg__edit-actions {
  position: absolute; top: 12px; right: 12px;
  display: flex; gap: 8px;
}
.hearth-pkg__feature-toggle, .hearth-pkg__remove {
  background: var(--cream-2); border: 1px solid var(--sand);
  color: var(--ink-2); font-size: 11px; padding: 4px 10px;
  border-radius: 999px; cursor: pointer;
}
.hearth-pkg__remove { padding: 0 8px; font-size: 16px; line-height: 1; }
.hearth-pkg__add {
  background: transparent; border: 1px dashed var(--sand);
  color: var(--ink-2); font-family: var(--font-body); font-size: 15px;
  cursor: pointer; min-height: 280px; align-items: center; justify-content: center;
}
.hearth-pkg__add:hover { border-color: var(--accent); color: var(--accent-deep); }
`;
