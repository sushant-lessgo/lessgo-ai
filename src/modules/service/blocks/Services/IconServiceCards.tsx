'use client';

// src/modules/service/blocks/Services/IconServiceCards.tsx
// Hearth services grid: 3-col cards w/ Lucide icon, title, description, optional CTA. Edit mode.
// Reference: Hearth - Warm Service.html lines 1444-1469, .features (461-487).

import React from 'react';
import * as Icons from 'lucide-react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { HearthEditable } from '../../components/HearthEditable';

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  cta_text: string;
}

interface IconServiceCardsContent {
  eyebrow: string;
  headline: string;
  lede: string;
  services: ServiceCard[];
}

interface IconServiceCardsProps {
  sectionId: string;
}

function ServiceIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Sparkles;
  return <Component size={28} strokeWidth={1.5} />;
}

export default function IconServiceCards({ sectionId }: IconServiceCardsProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useServiceBlock<IconServiceCardsContent>({ sectionId });

  const services = blockContent.services || [];

  const updateField = (id: string, key: keyof ServiceCard, value: string) => {
    handleCollectionUpdate(
      'services',
      services.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  };

  const addService = () => {
    if (services.length >= 6) return;
    handleCollectionUpdate('services', [
      ...services,
      {
        id: `s${Date.now()}`,
        title: 'New service',
        description: 'Describe this service.',
        icon: 'Sparkles',
        cta_text: '',
      },
    ]);
  };

  const removeService = (id: string) => {
    if (services.length <= 3) return;
    handleCollectionUpdate(
      'services',
      services.filter((s) => s.id !== id)
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-services" data-section-id={sectionId}>
        <div className="hearth-services__head">
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
              placeholder="Our approach"
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
            placeholder="What we do"
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
              placeholder="One sentence framing the section."
            />
          )}
        </div>

        <div className="hearth-services__grid">
          {services.map((s, idx) => (
            <article key={s.id} className="hearth-service-card">
              <div className="hearth-service-card__icon">
                <ServiceIcon name={s.icon || 'Sparkles'} />
              </div>
              <div className="hearth-service-card__num">
                {String(idx + 1).padStart(2, '0')}.
              </div>
              <HearthEditable
                as="h3"
                mode={mode}
                sectionId={sectionId}
                elementKey={`services_title_${s.id}`}
                value={s.title}
                onSave={(v) => updateField(s.id, 'title', v)}
                enterBehavior="save"
                className="hearth-service-card__title"
                placeholder="Service name"
              />
              <HearthEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey={`services_description_${s.id}`}
                value={s.description}
                onSave={(v) => updateField(s.id, 'description', v)}
                multiline
                className="hearth-service-card__desc"
                placeholder="Describe this service."
              />
              {(s.cta_text || mode === 'edit') && (
                <HearthEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`services_cta_${s.id}`}
                  value={s.cta_text}
                  onSave={(v) => updateField(s.id, 'cta_text', v)}
                  enterBehavior="save"
                  className="hearth-service-card__cta"
                  placeholder="Learn more →"
                />
              )}
              {mode === 'edit' && services.length > 3 && (
                <button
                  type="button"
                  className="hearth-service-card__remove"
                  onClick={() => removeService(s.id)}
                  aria-label="Remove service"
                >
                  ×
                </button>
              )}
            </article>
          ))}
          {mode === 'edit' && services.length < 6 && (
            <button type="button" className="hearth-service-card hearth-service-card--add" onClick={addService}>
              + Add service
            </button>
          )}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.hearth-services {
  max-width: var(--max-w); margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
}
.hearth-services__head { text-align: center; margin-bottom: 64px; }
.hearth-eyebrow {
  display: inline-flex; align-items: center; gap: 12px;
  font-family: var(--font-body); font-size: 12px; font-weight: 500;
  color: var(--accent-deep); letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 18px;
}
.hearth-eyebrow::before, .hearth-eyebrow::after {
  content: ""; width: 28px; height: 1px; background: var(--accent);
}
.hearth-section-title {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(36px, 4.5vw, 56px); line-height: 1.05;
  letter-spacing: -0.012em; color: var(--ink); margin: 0 auto;
  max-width: 22ch;
  font-variation-settings: "opsz" 96;
}
.hearth-section-lede {
  font-family: var(--font-display); font-style: italic;
  font-size: 18px; color: var(--ink-2); line-height: 1.5;
  margin: 20px auto 0; max-width: 56ch;
}
.hearth-services__grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
}
@media (max-width: 900px) { .hearth-services__grid { grid-template-columns: 1fr; } }
.hearth-service-card {
  position: relative;
  background: var(--cream-1); border: 1px solid var(--sand);
  border-radius: var(--r-lg); padding: 36px 32px 32px;
  display: flex; flex-direction: column; gap: 16px;
}
.hearth-service-card__icon {
  width: 48px; height: 48px; border-radius: 999px;
  background: var(--accent-wash); color: var(--accent-deep);
  display: grid; place-items: center;
}
.hearth-service-card__num {
  font-family: var(--font-display); font-style: italic; font-weight: 500;
  color: var(--accent-deep); font-size: 14px; letter-spacing: 0.05em;
}
.hearth-service-card__title {
  font-family: var(--font-display); font-weight: 500; font-size: 26px;
  line-height: 1.25; letter-spacing: -0.008em; color: var(--ink); margin: 0;
}
.hearth-service-card__desc {
  font-family: var(--font-body); font-size: 15px; color: var(--ink-2);
  line-height: 1.6; margin: 0;
}
.hearth-service-card__cta {
  font-family: var(--font-body); font-weight: 500; font-size: 14px;
  color: var(--accent-deep); margin-top: auto; cursor: pointer;
}
.hearth-service-card__remove {
  position: absolute; top: 12px; right: 12px;
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--cream-2); border: 1px solid var(--sand);
  color: var(--ink-2); font-size: 16px; line-height: 1; cursor: pointer;
  display: grid; place-items: center;
}
.hearth-service-card--add {
  background: transparent; border: 1px dashed var(--sand);
  color: var(--ink-2); font-family: var(--font-body); font-size: 15px;
  cursor: pointer; min-height: 200px;
}
.hearth-service-card--add:hover { border-color: var(--accent); color: var(--accent-deep); }
`;
