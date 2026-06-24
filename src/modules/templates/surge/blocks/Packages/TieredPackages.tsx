'use client';

// Surge tiered packages (edit): 1-3 pricing cards, featured tier accent-emphasized.
// Consumes the shared service packages contract.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { PKG_STYLES } from './styles';

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
        price_display: 'from $X',
        timeline: 'monthly',
        features: ['Feature one', 'Feature two', 'Feature three', 'Feature four'],
        cta_text: 'Book a call',
        is_featured: false,
      },
    ]);
  };

  const removePackage = (id: string) => {
    if (packages.length <= 1) return;
    handleCollectionUpdate('packages', packages.filter((p) => p.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PKG_STYLES }} />
      <section className="sg-pkg" data-section-id={sectionId}>
        <div className="sg-pkg__head">
          {(blockContent.eyebrow || mode === 'edit') && (
            <SurgeEditable
              as="div"
              mode={mode}
              sectionId={sectionId}
              elementKey="eyebrow"
              value={blockContent.eyebrow}
              onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save"
              className="sg-sec-eyebrow"
              placeholder="Engagements"
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
            className="sg-sec-title"
            placeholder="Pricing built around <em>the work</em>"
          />
          {(blockContent.lede || mode === 'edit') && (
            <SurgeEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="lede"
              value={blockContent.lede}
              onSave={(v) => handleContentUpdate('lede', v)}
              multiline
              className="sg-sec-dek"
              placeholder="One line on how engagements are scoped and priced."
            />
          )}
        </div>

        <div className="sg-pkg__grid">
          {packages.map((p) => {
            const featuresList = Array.isArray(p.features) ? p.features : [];
            return (
              <article key={p.id} className={`sg-pkg__card${p.is_featured ? ' is-featured' : ''}`}>
                <SurgeEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`packages_name_${p.id}`}
                  value={p.name}
                  onSave={(v) => updateField(p.id, 'name', v)}
                  enterBehavior="save"
                  className="sg-pkg__name"
                  placeholder="Tier name"
                />
                <SurgeEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`packages_price_${p.id}`}
                  value={p.price_display}
                  onSave={(v) => updateField(p.id, 'price_display', v)}
                  enterBehavior="save"
                  className="sg-pkg__amount"
                  placeholder="from $5k"
                />
                <SurgeEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`packages_timeline_${p.id}`}
                  value={p.timeline}
                  onSave={(v) => updateField(p.id, 'timeline', v)}
                  enterBehavior="save"
                  className="sg-pkg__per"
                  placeholder="monthly retainer"
                />
                <ul className="sg-pkg__features">
                  {featuresList.map((feat, idx) => (
                    <li key={`${p.id}-f-${idx}`}>
                      <SurgeEditable
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
                <SurgeEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`packages_cta_${p.id}`}
                  value={p.cta_text}
                  onSave={(v) => updateField(p.id, 'cta_text', v)}
                  enterBehavior="save"
                  isButton
                  className={`sg-btn ${p.is_featured ? 'sg-btn--primary' : 'sg-btn--soft'} sg-pkg__cta`}
                  placeholder="Book a call"
                />
                {mode === 'edit' && (
                  <div className="sg-pkg__edit-actions">
                    <button
                      type="button"
                      onClick={() => updateField(p.id, 'is_featured', !p.is_featured)}
                      className="sg-pkg__feature-toggle"
                    >
                      {p.is_featured ? '★ featured' : '☆ feature'}
                    </button>
                    {packages.length > 1 && (
                      <button
                        type="button"
                        className="sg-pkg__remove"
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
            <button type="button" className="sg-pkg__add" onClick={addPackage}>
              + Add tier
            </button>
          )}
        </div>
      </section>
    </>
  );
}
