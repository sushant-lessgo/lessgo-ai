'use client';

// Surge services (edit). Section head + 3-col card grid. Each card: mono number,
// accent-soft glyph icon, title, description, optional CTA. The `icon` field is a
// short glyph/letter (e.g. "Q", "X", "@") rendered as text in the chip.

import React from 'react';
import * as Icons from 'lucide-react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { SERVICES_STYLES } from './styles';

// `icon` is a Lucide icon NAME (shared service contract; same as Hearth). Not
// inline-editable — rendered as a Lucide glyph in the accent chip.
function ServiceIcon({ name }: { name?: string }) {
  const Component = (name && (Icons as any)[name]) || Icons.TrendingUp;
  return <Component size={20} strokeWidth={2} />;
}

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

export default function IconServiceCards({ sectionId }: IconServiceCardsProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate, isExcluded } =
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
      { id: `s${Date.now()}`, title: 'New service', description: 'Describe this service.', icon: 'TrendingUp', cta_text: '' },
    ]);
  };

  const removeService = (id: string) => {
    if (services.length <= 3) return;
    handleCollectionUpdate('services', services.filter((s) => s.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SERVICES_STYLES }} />
      <section className="sg-section" data-section-id={sectionId}>
        <div className="sg-sec-head">
          {(blockContent.eyebrow || (mode === 'edit' && !isExcluded('eyebrow'))) && (
            <SurgeEditable
              as="div"
              mode={mode}
              sectionId={sectionId}
              elementKey="eyebrow"
              value={blockContent.eyebrow}
              onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save"
              className="sg-sec-eyebrow"
              placeholder="Services"
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
            placeholder="Built around <em>one number per channel</em>"
          />
          {(blockContent.lede || (mode === 'edit' && !isExcluded('lede'))) && (
            <SurgeEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="lede"
              value={blockContent.lede}
              onSave={(v) => handleContentUpdate('lede', v)}
              multiline
              className="sg-sec-dek"
              placeholder="One sentence framing the section."
            />
          )}
        </div>

        <div className="sg-services-grid">
          {services.map((s, idx) => (
            <article key={s.id} className="sg-svc">
              <span className="sg-svc__n">{String(idx + 1).padStart(2, '0')}</span>
              <span className="sg-svc__ic"><ServiceIcon name={s.icon} /></span>
              <SurgeEditable
                as="h3"
                mode={mode}
                sectionId={sectionId}
                elementKey={`services_title_${s.id}`}
                value={s.title}
                onSave={(v) => updateField(s.id, 'title', v)}
                enterBehavior="save"
                className="sg-svc__title"
                placeholder="Service name"
              />
              <SurgeEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey={`services_description_${s.id}`}
                value={s.description}
                onSave={(v) => updateField(s.id, 'description', v)}
                multiline
                className="sg-svc__desc"
                placeholder="Describe this service."
              />
              {(s.cta_text || mode === 'edit') && (
                <SurgeEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`services_cta_${s.id}`}
                  value={s.cta_text}
                  onSave={(v) => updateField(s.id, 'cta_text', v)}
                  enterBehavior="save"
                  className="sg-svc__cta"
                  placeholder="Learn more →"
                />
              )}
              {mode === 'edit' && services.length > 3 && (
                <button type="button" className="sg-svc__remove" onClick={() => removeService(s.id)} aria-label="Remove service">×</button>
              )}
            </article>
          ))}
          {mode === 'edit' && services.length < 6 && (
            <button type="button" className="sg-svc sg-svc--add" onClick={addService}>+ Add service</button>
          )}
        </div>
      </section>
    </>
  );
}
