'use client';

// src/modules/templates/lex/blocks/Services/PracticeAreaGrid.tsx
// Lex services: ruled 3-col "practice areas" grid. Edit mode.
// Reference: Lex HTML .practice (710-767), markup (1750-1798).
//
// A3 — the §-index ornament ("§ I", "§ II", …) is DERIVED from card position
// (a structural label, not a fabricated fact). Lex uses no per-card icon, so the
// schema `icon` field is intentionally not surfaced.

import React from 'react';
import { useLexBlock } from '../../hooks/useLexBlock';
import { LexEditable } from '../../components/LexEditable';

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  cta_text: string;
}

interface PracticeAreaGridContent {
  eyebrow: string;
  headline: string;
  lede: string;
  services: ServiceCard[];
}

interface PracticeAreaGridProps {
  sectionId: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export default function PracticeAreaGrid({ sectionId }: PracticeAreaGridProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useLexBlock<PracticeAreaGridContent>({ sectionId });

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
      { id: `s${Date.now()}`, title: 'New practice', description: 'Describe this practice.', icon: '', cta_text: '' },
    ]);
  };

  const removeService = (id: string) => {
    if (services.length <= 3) return;
    handleCollectionUpdate('services', services.filter((s) => s.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-practice-sec" data-section-id={sectionId}>
        <header className="lex-sec-head">
          <div>
            {(blockContent.eyebrow || mode === 'edit') && (
              <div className="lex-sec-eyebrow">
                <LexEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="eyebrow"
                  value={blockContent.eyebrow}
                  onSave={(v) => handleContentUpdate('eyebrow', v)}
                  enterBehavior="save"
                  placeholder="The practice"
                />
              </div>
            )}
            <LexEditable
              as="h2"
              mode={mode}
              sectionId={sectionId}
              elementKey="headline"
              value={blockContent.headline}
              onSave={(v) => handleContentUpdate('headline', v)}
              enterBehavior="save"
              className="lex-sec-title"
              placeholder="Lines of <em>counsel</em>, one office."
            />
          </div>
          {(blockContent.lede || mode === 'edit') && (
            <LexEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="lede"
              value={blockContent.lede}
              onSave={(v) => handleContentUpdate('lede', v)}
              multiline
              className="lex-sec-lede"
              placeholder="One sentence framing how the practice is staffed and led."
            />
          )}
        </header>

        <div className="lex-practice">
          {services.map((s, idx) => (
            <div key={s.id} className="lex-practice__item">
              <span className="lex-practice__ix">§ {ROMAN[idx] || idx + 1}</span>
              <LexEditable
                as="h3"
                mode={mode}
                sectionId={sectionId}
                elementKey={`services_title_${s.id}`}
                value={s.title}
                onSave={(v) => updateField(s.id, 'title', v)}
                enterBehavior="save"
                className="lex-practice__title"
                placeholder="Practice name"
              />
              <LexEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey={`services_description_${s.id}`}
                value={s.description}
                onSave={(v) => updateField(s.id, 'description', v)}
                multiline
                className="lex-practice__desc"
                placeholder="Describe this practice area."
              />
              {(s.cta_text || mode === 'edit') && (
                <LexEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`services_cta_${s.id}`}
                  value={s.cta_text}
                  onSave={(v) => updateField(s.id, 'cta_text', v)}
                  enterBehavior="save"
                  className="lex-practice__more"
                  placeholder="Read the memorandum →"
                />
              )}
              {mode === 'edit' && services.length > 3 && (
                <button
                  type="button"
                  className="lex-practice__remove"
                  onClick={() => removeService(s.id)}
                  aria-label="Remove practice"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {mode === 'edit' && services.length < 6 && (
            <button type="button" className="lex-practice__item lex-practice__add" onClick={addService}>
              + Add practice
            </button>
          )}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.lex-practice-sec {
  padding: var(--sec-pad-y) var(--sec-pad-x);
  max-width: var(--max-w); margin: 0 auto;
}
.lex-sec-head {
  display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: end;
  margin-bottom: 64px; padding-bottom: 24px; border-bottom: 1px solid var(--ink);
}
@media (max-width: 900px) { .lex-sec-head { grid-template-columns: 1fr; gap: 32px; } }
.lex-sec-eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500; margin-bottom: 22px;
}
.lex-sec-title {
  font-family: var(--font-display); font-weight: 500;
  font-size: clamp(40px, 5.6vw, 72px); line-height: 1.0; letter-spacing: -0.022em;
  color: var(--ink); margin: 0; max-width: 16ch;
}
.lex-sec-title em { font-style: italic; font-weight: 400; color: var(--trust); }
.lex-sec-lede {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 19px; line-height: 1.5; color: var(--ink-2); max-width: 48ch; margin: 0;
}
.lex-practice {
  display: grid; grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--rule); border-left: 1px solid var(--rule);
}
@media (max-width: 900px) { .lex-practice { grid-template-columns: 1fr; } }
.lex-practice__item {
  border-right: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
  padding: 36px 32px 32px; background: var(--paper);
  position: relative; display: flex; flex-direction: column; min-height: 320px;
}
.lex-practice__ix {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500;
  margin-bottom: 28px; display: flex; align-items: center; gap: 10px;
}
.lex-practice__ix::before { content: ""; width: 6px; height: 6px; background: var(--trust); border-radius: 50%; }
.lex-practice__title {
  font-family: var(--font-display); font-weight: 500; font-size: 28px;
  line-height: 1.05; letter-spacing: -0.015em; margin: 0 0 14px; color: var(--ink);
}
.lex-practice__title em { font-style: italic; font-weight: 400; color: var(--trust); }
.lex-practice__desc {
  font-family: var(--font-body); font-size: 15px; line-height: 1.55;
  color: var(--ink-2); margin: 0 0 24px; flex: 1;
}
.lex-practice__more {
  font-family: var(--font-display); font-style: italic; font-weight: 400; font-size: 15px;
  color: var(--trust); border-bottom: 1px solid var(--trust); padding-bottom: 4px;
  align-self: flex-start; cursor: pointer;
}
.lex-practice__remove {
  position: absolute; top: 12px; right: 12px; width: 24px; height: 24px;
  background: var(--paper-1); border: 1px solid var(--rule); color: var(--ink-2);
  font-size: 16px; line-height: 1; cursor: pointer;
}
.lex-practice__add {
  background: transparent; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
  border-right: 1px solid var(--rule); border-left: 0;
  color: var(--ink-2); font-family: var(--font-body); font-size: 15px; cursor: pointer;
  align-items: center; justify-content: center;
}
.lex-practice__add:hover { color: var(--trust); }
`;
