'use client';

// src/modules/templates/techpremium/blocks/Faq/TechPremiumFaq.tsx
// TechPremium FAQ — centered head + native <details> disclosure list (no JS).
// Edit mode renders the same details (first open) with inline-editable Q/A.
// Surface paper-2. Ported from naayom Home .faq-list / .faq-item CSS.

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { FAQ_STYLES } from './styles';

interface FaqItem { id: string; question: string; answer: string }

interface TechPremiumFaqContent {
  eyebrow: string;
  headline: string;
  items: FaqItem[];
}

interface TechPremiumFaqProps {
  sectionId: string;
}

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export default function TechPremiumFaq({ sectionId }: TechPremiumFaqProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumFaqContent>({ sectionId });

  const edit = mode === 'edit';
  const items = blockContent.items || [];

  const updateField = (id: string, key: keyof FaqItem, value: string) => {
    handleCollectionUpdate('items', items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  };
  const addItem = () => {
    if (items.length >= 10) return;
    handleCollectionUpdate('items', [...items, { id: rid('faq'), question: 'New question?', answer: 'Answer goes here.' }]);
  };
  const removeItem = (id: string) => {
    if (items.length <= 2) return;
    handleCollectionUpdate('items', items.filter((it) => it.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FAQ_STYLES }} />
      <section className="tp-sec" data-section-id={sectionId}>
        <div className="tp-sec__inner">
          <div className="tp-sec-head center">
            {(blockContent.eyebrow || edit) && (
              <TechPremiumEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="eyebrow"
                value={blockContent.eyebrow}
                onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save"
                className="tp-eyebrow"
                placeholder="FAQ"
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
              placeholder="Questions, answered"
            />
          </div>

          <div className="tp-faq-list">
            {items.map((it, i) => (
              <details key={it.id} className="tp-faq-item" open={i === 0}>
                <summary>
                  <TechPremiumEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`items_question_${it.id}`}
                    value={it.question}
                    onSave={(v) => updateField(it.id, 'question', v)}
                    enterBehavior="save"
                    className="tp-faq-item__q"
                    placeholder="Question?"
                  />
                  <span className="tp-pm" aria-hidden />
                </summary>
                <TechPremiumEditable
                  as="p"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`items_answer_${it.id}`}
                  value={it.answer}
                  onSave={(v) => updateField(it.id, 'answer', v)}
                  multiline
                  placeholder="Answer goes here."
                />
                {edit && items.length > 2 && (
                  <button type="button" className="tp-faq-item__remove" onClick={() => removeItem(it.id)} aria-label="Remove question">×</button>
                )}
              </details>
            ))}
          </div>
          {edit && items.length < 10 && (
            <button type="button" className="tp-faq-add" onClick={addItem}>+ Add question</button>
          )}
        </div>
      </section>
    </>
  );
}

