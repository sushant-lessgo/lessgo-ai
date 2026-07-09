'use client';

// src/modules/templates/meridian/blocks/Features/LedgerFeatureList.tsx
// Meridian features VARIANT (scale-09 phase 6) — "Ledger List". Full-width
// hairline rows (schematic docs / changelog feel) instead of HairlineFeatureGrid's
// card grid. SAME content slots as HairlineFeatureGrid (eyebrow/headline/lede +
// features title/description/icon/link_text). Declared capacity 3–9. Edit mode.
// Reference: design_handoff_meridian/"Meridian Variant - Features (Ledger List).html".
// CSS-only (shared LEDGER_FEATURE_LIST_STYLES; only :hover motion) — editor/published parity.

import React from 'react';
import * as Icons from 'lucide-react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';
import { LEDGER_FEATURE_LIST_STYLES } from './LedgerFeatureList.styles';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  link_text: string;
}

interface LedgerFeatureListContent {
  eyebrow: string;
  headline: string;
  lede: string;
  features: Feature[];
}

interface LedgerFeatureListProps {
  sectionId: string;
}

function FeatureIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Layers;
  return <Component size={18} strokeWidth={1.25} />;
}

export default function LedgerFeatureList({ sectionId }: LedgerFeatureListProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useMeridianBlock<LedgerFeatureListContent>({ sectionId });

  const features = blockContent.features || [];

  const updateField = (id: string, key: keyof Feature, value: string) => {
    handleCollectionUpdate('features', features.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };
  const addFeature = () => {
    if (features.length >= 9) return;
    handleCollectionUpdate('features', [
      ...features,
      { id: `f${Date.now()}`, title: 'New capability', description: 'Describe this capability.', icon: 'Layers', link_text: 'read ↗' },
    ]);
  };
  const removeFeature = (id: string) => {
    if (features.length <= 3) return;
    handleCollectionUpdate('features', features.filter((f) => f.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LEDGER_FEATURE_LIST_STYLES }} />
      <section className="mrd-ledger-sec" data-section-id={sectionId}>
        {(blockContent.eyebrow || mode === 'edit') && (
          <div className="mrd-ledger__eyebrow">
            <MeridianEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="eyebrow"
              value={blockContent.eyebrow}
              onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save"
              placeholder="capabilities"
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
          className="mrd-ledger__title"
          placeholder="A title for the section."
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
            className="mrd-ledger__lede"
            placeholder="One or two sentences framing the capabilities."
          />
        )}

        <div className="mrd-ledger">
          {features.map((f, idx) => (
            <article key={f.id} className="mrd-ledger__row">
              <div className="mrd-ledger__n">F-{String(idx + 1).padStart(2, '0')}</div>
              <div className="mrd-ledger__glyph"><FeatureIcon name={f.icon || 'Layers'} /></div>
              <MeridianEditable
                as="h3"
                mode={mode}
                sectionId={sectionId}
                elementKey={`features_title_${f.id}`}
                value={f.title}
                onSave={(v) => updateField(f.id, 'title', v)}
                enterBehavior="save"
                className="mrd-ledger__row-title"
                placeholder="Capability"
              />
              <MeridianEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey={`features_description_${f.id}`}
                value={f.description}
                onSave={(v) => updateField(f.id, 'description', v)}
                multiline
                className="mrd-ledger__desc"
                placeholder="Describe this capability in a sentence or two."
              />
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey={`features_link_${f.id}`}
                value={f.link_text}
                onSave={(v) => updateField(f.id, 'link_text', v)}
                enterBehavior="save"
                className="mrd-ledger__link"
                placeholder="read ↗"
              />
              {mode === 'edit' && features.length > 3 && (
                <button
                  type="button"
                  className="mrd-ledger__remove"
                  onClick={() => removeFeature(f.id)}
                  aria-label="Remove feature"
                >
                  ×
                </button>
              )}
            </article>
          ))}
        </div>
        {mode === 'edit' && features.length < 9 && (
          <button type="button" className="mrd-ledger__add" onClick={addFeature}>
            + Add capability
          </button>
        )}
      </section>
    </>
  );
}
