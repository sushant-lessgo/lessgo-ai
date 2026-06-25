'use client';

// src/modules/templates/techpremium/blocks/Problem/TechPremiumProblem.tsx
// TechPremium problem section — sticky lead (eyebrow/h2/lede) + numbered pain rows.
// Edit mode. Surface forest/dark. Ported from naayom Home .problem* CSS.

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { PROBLEM_STYLES } from './styles';

interface Pain { id: string; title: string; body: string }

interface TechPremiumProblemContent {
  eyebrow: string;
  headline: string;
  lede: string;
  pains: Pain[];
}

interface TechPremiumProblemProps {
  sectionId: string;
}

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;
const n2 = (i: number) => String(i + 1).padStart(2, '0');

export default function TechPremiumProblem({ sectionId }: TechPremiumProblemProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumProblemContent>({ sectionId });

  const edit = mode === 'edit';
  const pains = blockContent.pains || [];

  const updateField = (id: string, key: keyof Pain, value: string) => {
    handleCollectionUpdate('pains', pains.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  };
  const addPain = () => {
    if (pains.length >= 5) return;
    handleCollectionUpdate('pains', [...pains, { id: rid('pain'), title: 'New problem', body: 'Describe this problem.' }]);
  };
  const removePain = (id: string) => {
    if (pains.length <= 2) return;
    handleCollectionUpdate('pains', pains.filter((p) => p.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROBLEM_STYLES }} />
      <section className="tp-sec" data-section-id={sectionId}>
        <div className="tp-sec__inner">
          <div className="tp-problem-in">
            <div className="tp-problem-lead">
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
                  placeholder="The problem"
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
                className="tp-problem-lead__h2"
                placeholder="The problem with the status quo"
              />
              {(blockContent.lede || edit) && (
                <TechPremiumEditable
                  as="p"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="lede"
                  value={blockContent.lede}
                  onSave={(v) => handleContentUpdate('lede', v)}
                  multiline
                  className="tp-lede tp-problem-lead__lede"
                  placeholder="One or two sentences framing the problem."
                />
              )}
            </div>

            <div className="tp-pain">
              {pains.map((p, i) => (
                <div key={p.id} className="tp-pain-row">
                  <span className="tp-n">{n2(i)}</span>
                  <div className="tp-pain-row__body">
                    <TechPremiumEditable
                      as="h3"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey={`pains_title_${p.id}`}
                      value={p.title}
                      onSave={(v) => updateField(p.id, 'title', v)}
                      enterBehavior="save"
                      className="tp-pain-row__h3"
                      placeholder="Problem title"
                    />
                    <TechPremiumEditable
                      as="p"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey={`pains_body_${p.id}`}
                      value={p.body}
                      onSave={(v) => updateField(p.id, 'body', v)}
                      multiline
                      className="tp-pain-row__p"
                      placeholder="Describe this problem in a sentence or two."
                    />
                  </div>
                  {edit && pains.length > 2 && (
                    <button type="button" className="tp-pain-row__remove" onClick={() => removePain(p.id)} aria-label="Remove problem">×</button>
                  )}
                </div>
              ))}
              {edit && pains.length < 5 && (
                <button type="button" className="tp-pain-add" onClick={addPain}>+ Add problem</button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

