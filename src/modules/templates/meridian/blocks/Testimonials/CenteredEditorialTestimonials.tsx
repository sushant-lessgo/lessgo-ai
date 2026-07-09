'use client';

// src/modules/templates/meridian/blocks/Testimonials/CenteredEditorialTestimonials.tsx
// Meridian testimonials VARIANT (scale-09 phase 6) — "Centered Editorial". One
// dominant featured pull-quote (#1), a supporting pair (#2-3), an optional stats
// band, and an optional logo rail — vs ProofWithLogoRail's left-aligned card grid.
// SAME content slots as ProofWithLogoRail (eyebrow/headline + testimonials
// quote/author_name/author_role; optional stats value/label; optional logos name).
// Optional bands + supporting grid render conditionally on collection length.
// Edit mode. Reference: design_handoff_meridian/"Meridian Variant - Testimonials
// (Centered Editorial).html". CSS-only — editor/published parity.

import React from 'react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';
import { CENTERED_EDITORIAL_TESTIMONIALS_STYLES } from './CenteredEditorialTestimonials.styles';

interface Testimonial {
  id: string;
  quote: string;
  author_name: string;
  author_role: string;
}
interface Stat {
  id: string;
  value: string;
  label: string;
}
interface Logo {
  id: string;
  name: string;
}

interface CenteredEditorialTestimonialsContent {
  eyebrow: string;
  headline: string;
  testimonials: Testimonial[];
  stats: Stat[];
  logos: Logo[];
}

interface CenteredEditorialTestimonialsProps {
  sectionId: string;
}

function WhoRow({
  t, mode, sectionId, onUpdate,
}: {
  t: Testimonial;
  mode: 'edit' | 'preview' | 'published';
  sectionId: string;
  onUpdate: (id: string, key: keyof Testimonial, value: string) => void;
}) {
  return (
    <div className="mrd-te__who">
      <div className="mrd-te__avatar" aria-hidden="true" />
      <div className="mrd-te__who-meta">
        <MeridianEditable
          as="div"
          mode={mode}
          sectionId={sectionId}
          elementKey={`testimonials_name_${t.id}`}
          value={t.author_name}
          onSave={(v) => onUpdate(t.id, 'author_name', v)}
          enterBehavior="save"
          className="mrd-te__name"
          placeholder="Author name"
        />
        <MeridianEditable
          as="div"
          mode={mode}
          sectionId={sectionId}
          elementKey={`testimonials_role_${t.id}`}
          value={t.author_role}
          onSave={(v) => onUpdate(t.id, 'author_role', v)}
          enterBehavior="save"
          className="mrd-te__role"
          placeholder="Role · Company"
        />
      </div>
    </div>
  );
}

export default function CenteredEditorialTestimonials({ sectionId }: CenteredEditorialTestimonialsProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useMeridianBlock<CenteredEditorialTestimonialsContent>({ sectionId });

  const testimonials = blockContent.testimonials || [];
  const stats = blockContent.stats || [];
  const logos = blockContent.logos || [];

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

  const updateStat = (id: string, key: keyof Stat, value: string) => {
    handleCollectionUpdate('stats', stats.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };
  const addStat = () => {
    if (stats.length >= 3) return;
    handleCollectionUpdate('stats', [...stats, { id: `s${Date.now()}`, value: '00', label: 'metric' }]);
  };
  const removeStat = (id: string) => {
    handleCollectionUpdate('stats', stats.filter((s) => s.id !== id));
  };

  const updateLogo = (id: string, name: string) => {
    handleCollectionUpdate('logos', logos.map((l) => (l.id === id ? { ...l, name } : l)));
  };
  const addLogo = () => {
    if (logos.length >= 6) return;
    handleCollectionUpdate('logos', [...logos, { id: `lg${Date.now()}`, name: 'brand' }]);
  };
  const removeLogo = (id: string) => {
    handleCollectionUpdate('logos', logos.filter((l) => l.id !== id));
  };

  const featured = testimonials[0];
  const supporting = testimonials.slice(1);
  const showSupport = supporting.length > 0 || (mode === 'edit' && testimonials.length >= 1 && testimonials.length < 3);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CENTERED_EDITORIAL_TESTIMONIALS_STYLES }} />
      <section className="mrd-te-sec" data-section-id={sectionId}>
        <div className="mrd-te__head">
          {(blockContent.eyebrow || mode === 'edit') && (
            <div className="mrd-te__eyebrow">
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="eyebrow"
                value={blockContent.eyebrow}
                onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save"
                placeholder="proof"
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
            className="mrd-te__title"
            placeholder="What customers say."
          />
        </div>

        {featured ? (
          <div className="mrd-te__featured">
            <span className="mrd-te__mark" aria-hidden="true">&ldquo;</span>
            <MeridianEditable
              as="div"
              mode={mode}
              sectionId={sectionId}
              elementKey={`testimonials_quote_${featured.id}`}
              value={featured.quote}
              onSave={(v) => updateTesti(featured.id, 'quote', v)}
              multiline
              className="mrd-te__quote"
              placeholder="A short, specific quote in the customer's voice."
            />
            <WhoRow t={featured} mode={mode} sectionId={sectionId} onUpdate={updateTesti} />
            {mode === 'edit' && testimonials.length > 1 && (
              <button type="button" className="mrd-te__remove" onClick={() => removeTesti(featured.id)} aria-label="Remove testimonial">×</button>
            )}
          </div>
        ) : (
          mode === 'edit' && (
            <div className="mrd-te__featured">
              <button type="button" className="mrd-te__add" onClick={addTesti}>+ Add quote</button>
            </div>
          )
        )}

        {showSupport && (
          <div className="mrd-te__support">
            {supporting.map((t) => (
              <article key={t.id} className="mrd-te__card">
                <MeridianEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`testimonials_quote_${t.id}`}
                  value={t.quote}
                  onSave={(v) => updateTesti(t.id, 'quote', v)}
                  multiline
                  className="mrd-te__quote"
                  placeholder="A short supporting quote."
                />
                <WhoRow t={t} mode={mode} sectionId={sectionId} onUpdate={updateTesti} />
                {mode === 'edit' && testimonials.length > 1 && (
                  <button type="button" className="mrd-te__remove" onClick={() => removeTesti(t.id)} aria-label="Remove testimonial">×</button>
                )}
              </article>
            ))}
            {mode === 'edit' && testimonials.length >= 1 && testimonials.length < 3 && (
              <button type="button" className="mrd-te__add" onClick={addTesti}>+ Add quote</button>
            )}
          </div>
        )}

        {(stats.length > 0 || mode === 'edit') && (
          <div className="mrd-te__stats">
            {stats.map((s) => (
              <div key={s.id} className="mrd-te__stat">
                <MeridianEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`stats_value_${s.id}`}
                  value={s.value}
                  onSave={(v) => updateStat(s.id, 'value', v)}
                  enterBehavior="save"
                  className="mrd-te__stat-k"
                  placeholder="00"
                />
                <MeridianEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`stats_label_${s.id}`}
                  value={s.label}
                  onSave={(v) => updateStat(s.id, 'label', v)}
                  enterBehavior="save"
                  className="mrd-te__stat-l"
                  placeholder="metric"
                />
                {mode === 'edit' && (
                  <button type="button" className="mrd-te__remove" onClick={() => removeStat(s.id)} aria-label="Remove stat">×</button>
                )}
              </div>
            ))}
            {mode === 'edit' && stats.length < 3 && (
              <button type="button" className="mrd-te__stat mrd-te__add mrd-te__add--sm" onClick={addStat}>+ stat</button>
            )}
          </div>
        )}

        {(logos.length > 0 || mode === 'edit') && (
          <div className="mrd-te__logos">
            {logos.map((l) => (
              <div key={l.id} className="mrd-te__logo">
                <MeridianEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`logos_name_${l.id}`}
                  value={l.name}
                  onSave={(v) => updateLogo(l.id, v)}
                  enterBehavior="save"
                  placeholder="brand"
                />
                {mode === 'edit' && (
                  <button type="button" className="mrd-te__remove" onClick={() => removeLogo(l.id)} aria-label="Remove logo">×</button>
                )}
              </div>
            ))}
            {mode === 'edit' && logos.length < 6 && (
              <button type="button" className="mrd-te__logo mrd-te__add mrd-te__add--sm" onClick={addLogo}>+ logo</button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
