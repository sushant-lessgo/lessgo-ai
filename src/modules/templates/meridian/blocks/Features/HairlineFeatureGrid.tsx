'use client';

// src/modules/templates/meridian/blocks/Features/HairlineFeatureGrid.tsx
// Meridian features: eyebrow + title + lede, hairline 3-col grid of feature cells
// (index, glyph icon, title, body, link). Edit mode.
// Reference: Meridian - Modern Tech.html lines 1237-1286.

import React from 'react';
import * as Icons from 'lucide-react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  link_text: string;
}

interface HairlineFeatureGridContent {
  eyebrow: string;
  headline: string;
  lede: string;
  features: Feature[];
}

interface HairlineFeatureGridProps {
  sectionId: string;
}

function FeatureIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Layers;
  return <Component size={16} strokeWidth={1.25} />;
}

export default function HairlineFeatureGrid({ sectionId }: HairlineFeatureGridProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useMeridianBlock<HairlineFeatureGridContent>({ sectionId });

  const features = blockContent.features || [];

  const updateField = (id: string, key: keyof Feature, value: string) => {
    handleCollectionUpdate('features', features.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };
  const addFeature = () => {
    if (features.length >= 6) return;
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
          className="mrd-section-title"
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
            className="mrd-section-lede"
            placeholder="One or two sentences framing the capabilities."
          />
        )}

        <div className="mrd-features-grid">
          {features.map((f, idx) => (
            <article key={f.id} className="mrd-feature">
              <div className="mrd-feature__n">F-{String(idx + 1).padStart(2, '0')}</div>
              <div className="mrd-feature__glyph"><FeatureIcon name={f.icon || 'Layers'} /></div>
              <MeridianEditable
                as="h3"
                mode={mode}
                sectionId={sectionId}
                elementKey={`features_title_${f.id}`}
                value={f.title}
                onSave={(v) => updateField(f.id, 'title', v)}
                enterBehavior="save"
                className="mrd-feature__title"
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
                className="mrd-feature__body"
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
                className="mrd-feature__link"
                placeholder="read ↗"
              />
              {mode === 'edit' && features.length > 3 && (
                <button
                  type="button"
                  className="mrd-feature__remove"
                  onClick={() => removeFeature(f.id)}
                  aria-label="Remove feature"
                >
                  ×
                </button>
              )}
            </article>
          ))}
          {mode === 'edit' && features.length < 6 && (
            <button type="button" className="mrd-feature mrd-feature--add" onClick={addFeature}>
              + Add capability
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
.mrd-features-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
  background: var(--line); border: 1px solid var(--line);
  border-radius: var(--r-lg); margin-top: 64px; overflow: hidden;
}
@media (max-width: 900px) { .mrd-features-grid { grid-template-columns: 1fr; } }
.mrd-feature { background: var(--ink); padding: 32px 28px 56px; position: relative; min-height: 260px; }
.mrd-feature__n { font-family: var(--font-mono); font-size: 11px; color: var(--bone-3); letter-spacing: 0.1em; }
.mrd-feature__glyph {
  width: 28px; height: 28px; border: 1px solid var(--line-strong); border-radius: var(--r-sm);
  display: grid; place-items: center; margin: 24px 0 20px; color: var(--accent);
}
.mrd-feature__title {
  font-family: var(--font-display); font-weight: 500; font-size: 21px;
  letter-spacing: -0.015em; line-height: 1.2; margin: 0 0 8px; color: var(--bone);
}
.mrd-feature__body { font-size: 14px; color: var(--bone-2); line-height: 1.55; margin: 0; }
.mrd-feature__link {
  position: absolute; left: 28px; bottom: 28px;
  font-family: var(--font-mono); font-size: 11.5px; color: var(--bone-3);
  letter-spacing: 0.02em; cursor: pointer;
}
.mrd-feature__link:hover { color: var(--accent); }
.mrd-feature__remove {
  position: absolute; top: 12px; right: 12px; width: 22px; height: 22px;
  background: transparent; border: 1px solid var(--line-strong); border-radius: 50%;
  color: var(--bone-3); font-size: 13px; line-height: 1; cursor: pointer;
}
.mrd-feature--add {
  background: transparent; border: 1px dashed var(--line-strong); color: var(--bone-3);
  font-family: var(--font-body); font-size: 14px; cursor: pointer; min-height: 260px;
}
.mrd-feature--add:hover { color: var(--accent); border-color: var(--accent); }
[data-variant="marketing"] .mrd-eyebrow { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; text-transform: none; font-weight: 500; color: var(--bone-2); }
[data-variant="marketing"] .mrd-eyebrow::after { display: none; }
[data-variant="marketing"] .mrd-section-title { font-weight: 500; font-size: 56px; letter-spacing: -0.03em; }
[data-variant="marketing"] .mrd-section-lede { font-size: 21px; color: var(--bone-2); max-width: 62ch; }
[data-variant="marketing"] .mrd-feature { padding: 36px 36px 56px; }
[data-variant="marketing"] .mrd-feature__link { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; left: 36px; bottom: 28px; }
`;
