'use client';

// src/modules/templates/techpremium/blocks/Features/TechPremiumCapabilities.tsx
// TechPremium capabilities: eyebrow + section head, hairline grid of capability
// cells (icon, title, body, link). Edit mode. Consumes the product `features`
// collection. Reference: TechPremium.html .cap-grid (lines 270-277, 834-873).

import React from 'react';
import * as Icons from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  link_text: string;
}

interface TechPremiumCapabilitiesContent {
  eyebrow: string;
  headline: string;
  lede: string;
  features: Feature[];
}

interface TechPremiumCapabilitiesProps {
  sectionId: string;
}

function CapIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Activity;
  return <Component size={21} strokeWidth={1.6} />;
}

export default function TechPremiumCapabilities({ sectionId }: TechPremiumCapabilitiesProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumCapabilitiesContent>({ sectionId });

  const features = blockContent.features || [];

  const updateField = (id: string, key: keyof Feature, value: string) => {
    handleCollectionUpdate('features', features.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };
  const addFeature = () => {
    if (features.length >= 6) return;
    handleCollectionUpdate('features', [
      ...features,
      { id: `f${Date.now()}`, title: 'New capability', description: 'Describe this capability.', icon: 'Activity', link_text: '' },
    ]);
  };
  const removeFeature = (id: string) => {
    if (features.length <= 3) return;
    handleCollectionUpdate('features', features.filter((f) => f.id !== id));
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
                placeholder="Capabilities"
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
              placeholder="Everything the job needs, in one platform."
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
                placeholder="One or two sentences framing the capabilities."
              />
            )}
          </div>

          <div className="tp-cap-grid">
            {features.map((f) => (
              <article key={f.id} className="tp-cap">
                <span className="tp-cap__ico"><CapIcon name={f.icon || 'Activity'} /></span>
                <TechPremiumEditable
                  as="h3"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`features_title_${f.id}`}
                  value={f.title}
                  onSave={(v) => updateField(f.id, 'title', v)}
                  enterBehavior="save"
                  className="tp-cap__h3"
                  placeholder="Capability"
                />
                <TechPremiumEditable
                  as="p"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`features_description_${f.id}`}
                  value={f.description}
                  onSave={(v) => updateField(f.id, 'description', v)}
                  multiline
                  className="tp-cap__p"
                  placeholder="Describe this capability in a sentence or two."
                />
                {(f.link_text || mode === 'edit') && (
                  <TechPremiumEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`features_link_${f.id}`}
                    value={f.link_text}
                    onSave={(v) => updateField(f.id, 'link_text', v)}
                    enterBehavior="save"
                    className="tp-cap__link"
                    placeholder="learn more →"
                  />
                )}
                {mode === 'edit' && features.length > 3 && (
                  <button type="button" className="tp-cap__remove" onClick={() => removeFeature(f.id)} aria-label="Remove capability">×</button>
                )}
              </article>
            ))}
            {mode === 'edit' && features.length < 6 && (
              <button type="button" className="tp-cap tp-cap--add" onClick={addFeature}>+ Add capability</button>
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
.tp-cap-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; }
.tp-cap { background:var(--paper); padding:30px 28px; display:flex; flex-direction:column; gap:14px; transition:background .16s ease; position:relative; }
.tp-cap:hover { background:var(--paper-2); }
.tp-cap__ico { width:42px; height:42px; border-radius:10px; background:var(--lime-dim); border:1px solid transparent; display:grid; place-items:center; color:var(--forest); transition:background .16s ease, color .16s ease, transform .16s ease; }
.tp-cap:hover .tp-cap__ico { background:var(--lime); color:var(--forest-d); transform:translateY(-1px); }
.tp-cap__h3 { font-family:var(--font-display); font-weight:600; font-size:18px; letter-spacing:-0.018em; line-height:1.2; color:var(--ink); margin:0; }
.tp-cap__p { margin:0; color:var(--ink-2); font-size:14.5px; line-height:1.6; }
.tp-cap__link { font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.04em; color:var(--lime-d); cursor:pointer; }
.tp-cap__link:hover { color:var(--forest); }
.tp-cap__remove { position:absolute; top:12px; right:12px; width:22px; height:22px; background:transparent; border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; }
.tp-cap--add { border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-body); font-size:14px; cursor:pointer; align-items:center; justify-content:center; min-height:180px; }
.tp-cap--add:hover { color:var(--forest); border-color:var(--forest); background:var(--paper); }
@media (max-width:760px){ .tp-cap-grid { grid-template-columns:1fr 1fr; } }
@media (max-width:520px){ .tp-cap-grid { grid-template-columns:1fr; } }
`;
