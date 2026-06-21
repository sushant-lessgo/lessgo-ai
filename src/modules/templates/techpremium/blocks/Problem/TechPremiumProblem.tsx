'use client';

// src/modules/templates/techpremium/blocks/Problem/TechPremiumProblem.tsx
// TechPremium problem section — sticky lead (eyebrow/h2/lede) + numbered pain rows.
// Edit mode. Surface forest/dark. Ported from naayom Home .problem* CSS.

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { SEC_HEAD_STYLES } from '../shared/sharedStyles';

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

export const PROBLEM_STYLES = SEC_HEAD_STYLES + `
.tp-problem-in{ display:grid; grid-template-columns:0.85fr 1.15fr; gap:clamp(40px,6vw,80px); align-items:start; }
.tp-problem-lead{ position:sticky; top:96px; display:flex; flex-direction:column; }
.tp-problem-lead__h2{ font-family:var(--font-display); font-weight:600; letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin-top:16px; font-size:clamp(28px,3.6vw,42px); }
.tp-problem-lead__lede{ margin-top:18px; max-width:42ch; }
.tp-pain{ display:flex; flex-direction:column; }
.tp-pain-row{ display:grid; grid-template-columns:auto 1fr; gap:22px; padding:26px 0; border-bottom:1px solid var(--line-dk); position:relative; }
.tp-pain-row:first-child{ padding-top:0; }
.tp-pain-row:last-child{ border-bottom:0; padding-bottom:0; }
.tp-pain-row .tp-n{ font-family:var(--font-mono); font-size:12px; font-weight:600; letter-spacing:0.1em; color:var(--lime); padding-top:5px; }
.tp-pain-row__h3{ font-family:var(--font-display); font-weight:600; font-size:21px; margin-bottom:7px; color:var(--paper); }
.tp-pain-row__p{ margin:0; color:oklch(0.84 0.025 140 / 0.78); font-size:15.5px; line-height:1.65; max-width:52ch; }
.tp-pain-row__remove{ position:absolute; top:0; right:0; width:22px; height:22px; background:transparent; border:1px solid var(--line-dk); border-radius:50%; color:var(--paper); font-size:13px; line-height:1; cursor:pointer; }
.tp-pain-add{ margin-top:24px; align-self:flex-start; background:transparent; border:1px dashed var(--line-dk); color:var(--paper); font-family:var(--font-body); font-size:14px; padding:10px 16px; border-radius:var(--r); cursor:pointer; }
.tp-pain-add:hover{ border-color:var(--lime); color:var(--lime); }
@media (max-width:1040px){ .tp-problem-in{ grid-template-columns:1fr; gap:40px; } .tp-problem-lead{ position:static; } }
`;
