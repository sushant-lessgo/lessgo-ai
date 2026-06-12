'use client';

// src/modules/templates/meridian/blocks/Testimonials/ProofWithLogoRail.tsx
// Meridian testimonials: eyebrow + title, 1-3 quote cards (first = raised .lg),
// + logo rail. Edit mode.
// Reference: Meridian - Modern Tech.html lines 1298-1336.
// Avatars are decorative gradient circles (static, no image slot).

import React from 'react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';

interface Testimonial {
  id: string;
  quote: string;
  author_name: string;
  author_role: string;
}

interface Logo {
  id: string;
  name: string;
}

interface ProofWithLogoRailContent {
  eyebrow: string;
  headline: string;
  testimonials: Testimonial[];
  logos: Logo[];
}

interface ProofWithLogoRailProps {
  sectionId: string;
}

export default function ProofWithLogoRail({ sectionId }: ProofWithLogoRailProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useMeridianBlock<ProofWithLogoRailContent>({ sectionId });

  const testimonials = blockContent.testimonials || [];
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
          className="mrd-section-title"
          placeholder="What customers say."
        />

        <div className="mrd-testi">
          {testimonials.map((t, idx) => (
            <article key={t.id} className={`mrd-testi-card${idx === 0 ? ' mrd-testi-card--lg' : ''}`}>
              <div className="mrd-testi-card__mark" aria-hidden="true">&ldquo;</div>
              <MeridianEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey={`testimonials_quote_${t.id}`}
                value={t.quote}
                onSave={(v) => updateTesti(t.id, 'quote', v)}
                multiline
                className="mrd-testi-card__quote"
                placeholder="A short, specific quote in the customer's voice."
              />
              <div className="mrd-testi-card__who">
                <div className="mrd-testi-card__avatar" aria-hidden="true" />
                <div>
                  <MeridianEditable
                    as="div"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`testimonials_name_${t.id}`}
                    value={t.author_name}
                    onSave={(v) => updateTesti(t.id, 'author_name', v)}
                    enterBehavior="save"
                    className="mrd-testi-card__name"
                    placeholder="Author name"
                  />
                  <MeridianEditable
                    as="div"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`testimonials_role_${t.id}`}
                    value={t.author_role}
                    onSave={(v) => updateTesti(t.id, 'author_role', v)}
                    enterBehavior="save"
                    className="mrd-testi-card__role"
                    placeholder="Role · Company"
                  />
                </div>
              </div>
              {mode === 'edit' && testimonials.length > 1 && (
                <button
                  type="button"
                  className="mrd-testi-card__remove"
                  onClick={() => removeTesti(t.id)}
                  aria-label="Remove testimonial"
                >
                  ×
                </button>
              )}
            </article>
          ))}
          {mode === 'edit' && testimonials.length < 3 && (
            <button type="button" className="mrd-testi-card mrd-testi-card--add" onClick={addTesti}>
              + Add quote
            </button>
          )}
        </div>

        {(logos.length > 0 || mode === 'edit') && (
          <div className="mrd-logo-rail">
            {logos.map((l) => (
              <div key={l.id} className="mrd-logo-rail__cell">
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
                  <button
                    type="button"
                    className="mrd-logo-rail__remove"
                    onClick={() => removeLogo(l.id)}
                    aria-label="Remove logo"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {mode === 'edit' && logos.length < 6 && (
              <button type="button" className="mrd-logo-rail__cell mrd-logo-rail__add" onClick={addLogo}>
                + logo
              </button>
            )}
          </div>
        )}
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
.mrd-testi { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 12px; margin-top: 64px; }
@media (max-width: 900px) { .mrd-testi { grid-template-columns: 1fr; } }
.mrd-testi-card {
  border: 1px solid var(--line); border-radius: var(--r-lg);
  padding: 28px 28px 24px; background: var(--ink);
  display: flex; flex-direction: column; position: relative;
}
.mrd-testi-card--lg { background: linear-gradient(180deg, var(--ink-1), var(--ink)); padding: 36px 36px 28px; }
.mrd-testi-card__mark {
  font-family: var(--font-display); font-size: 42px; line-height: 0.8;
  color: var(--accent); margin-bottom: 14px; letter-spacing: -0.03em;
}
.mrd-testi-card__quote {
  margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 19px;
  line-height: 1.45; letter-spacing: -0.01em; color: var(--bone); flex: 1;
}
.mrd-testi-card--lg .mrd-testi-card__quote { font-size: 26px; }
.mrd-testi-card__who {
  display: flex; align-items: center; gap: 12px;
  padding-top: 22px; margin-top: 22px; border-top: 1px solid var(--line);
}
.mrd-testi-card__avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--ink-2), var(--bone-3));
  border: 1px solid var(--line-strong); flex-shrink: 0;
}
.mrd-testi-card__name { font-family: var(--font-display); font-size: 14px; color: var(--bone); font-weight: 500; }
.mrd-testi-card__role { font-family: var(--font-mono); font-size: 11px; color: var(--bone-3); margin-top: 2px; }
.mrd-testi-card__remove {
  position: absolute; top: 12px; right: 12px; width: 22px; height: 22px;
  background: transparent; border: 1px solid var(--line-strong); border-radius: 50%;
  color: var(--bone-3); font-size: 13px; line-height: 1; cursor: pointer;
}
.mrd-testi-card--add {
  border: 1px dashed var(--line-strong); background: transparent; color: var(--bone-3);
  font-family: var(--font-body); font-size: 14px; cursor: pointer; align-items: center; justify-content: center; min-height: 180px;
}
.mrd-testi-card--add:hover { color: var(--accent); border-color: var(--accent); }
.mrd-logo-rail {
  margin-top: 56px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 0;
  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
}
@media (max-width: 900px) { .mrd-logo-rail { grid-template-columns: repeat(3, 1fr); } }
.mrd-logo-rail__cell {
  position: relative; padding: 22px 0; text-align: center;
  font-family: var(--font-display); font-weight: 600; font-size: 15px;
  letter-spacing: -0.01em; color: var(--bone-2); border-right: 1px solid var(--line);
}
.mrd-logo-rail__cell:last-child { border-right: 0; }
.mrd-logo-rail__remove {
  position: absolute; top: 4px; right: 4px; background: transparent; border: none;
  color: var(--bone-3); font-size: 12px; cursor: pointer; line-height: 1;
}
.mrd-logo-rail__add {
  border: 1px dashed var(--line-strong); color: var(--bone-3);
  font-family: var(--font-mono); font-size: 11px; cursor: pointer; background: transparent;
}
[data-variant="marketing"] .mrd-eyebrow { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; text-transform: none; font-weight: 500; color: var(--bone-2); }
[data-variant="marketing"] .mrd-eyebrow::after { display: none; }
[data-variant="marketing"] .mrd-section-title { font-weight: 500; font-size: 56px; letter-spacing: -0.03em; }
[data-variant="marketing"] .mrd-testi-card { padding: 36px 36px 28px; }
[data-variant="marketing"] .mrd-testi-card--lg { padding: 44px 44px 36px; }
[data-variant="marketing"] .mrd-testi-card__role { font-family: var(--font-body); font-size: 12.5px; text-transform: none; letter-spacing: 0; }
[data-variant="light"] .mrd-testi-card__avatar { background: linear-gradient(135deg, var(--ink-2), var(--bone-3) 120%); }
[data-variant="light"] .mrd-testi-card--lg { background: linear-gradient(180deg, var(--ink-1), var(--ink)); }
`;
