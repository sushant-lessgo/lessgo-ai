'use client';

// src/modules/templates/techpremium/blocks/Process/TechPremiumProcess.tsx
// TechPremium "How it works" — centered head + hairline grid of numbered steps,
// each with a lucide icon, flow connector, and copy. Edit mode. Surface paper.
// Ported from naayom Home .how-steps / .step CSS.

import React from 'react';
import * as Icons from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { SEC_HEAD_STYLES } from '../shared/sharedStyles';

interface Step { id: string; icon: string; title: string; body: string }

interface TechPremiumProcessContent {
  eyebrow: string;
  headline: string;
  lede: string;
  steps: Step[];
}

interface TechPremiumProcessProps {
  sectionId: string;
}

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;
const n2 = (i: number) => String(i + 1).padStart(2, '0');
const DEFAULT_ICONS = ['Radar', 'SlidersHorizontal', 'TrendingUp'];

function StepIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Activity;
  return <Component size={24} strokeWidth={1.6} />;
}

export default function TechPremiumProcess({ sectionId }: TechPremiumProcessProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumProcessContent>({ sectionId });

  const edit = mode === 'edit';
  const steps = blockContent.steps || [];

  const updateField = (id: string, key: keyof Step, value: string) => {
    handleCollectionUpdate('steps', steps.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };
  const addStep = () => {
    if (steps.length >= 4) return;
    const icon = DEFAULT_ICONS[steps.length] || 'Activity';
    handleCollectionUpdate('steps', [...steps, { id: rid('step'), icon, title: 'New step', body: 'Describe this step.' }]);
  };
  const removeStep = (id: string) => {
    if (steps.length <= 3) return;
    handleCollectionUpdate('steps', steps.filter((s) => s.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROCESS_STYLES }} />
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
                placeholder="How it works"
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
              placeholder="How it works"
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
                className="tp-lede"
                placeholder="One or two sentences framing the process."
              />
            )}
          </div>

          <div className="tp-how-steps" data-count={steps.length}>
            {steps.map((s, i) => (
              <div key={s.id} className="tp-step">
                <span className="tp-flow" aria-hidden>→</span>
                <span className="tp-ico"><StepIcon name={s.icon || DEFAULT_ICONS[i] || 'Activity'} /></span>
                <span className="tp-sn">Step {n2(i)}</span>
                <TechPremiumEditable
                  as="h3"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`steps_title_${s.id}`}
                  value={s.title}
                  onSave={(v) => updateField(s.id, 'title', v)}
                  enterBehavior="save"
                  className="tp-step__h3"
                  placeholder="Step title"
                />
                <TechPremiumEditable
                  as="p"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`steps_body_${s.id}`}
                  value={s.body}
                  onSave={(v) => updateField(s.id, 'body', v)}
                  multiline
                  className="tp-step__p"
                  placeholder="Describe this step in a sentence or two."
                />
                {edit && steps.length > 3 && (
                  <button type="button" className="tp-step__remove" onClick={() => removeStep(s.id)} aria-label="Remove step">×</button>
                )}
              </div>
            ))}
          </div>
          {edit && steps.length < 4 && (
            <button type="button" className="tp-step-add" onClick={addStep}>+ Add step</button>
          )}
        </div>
      </section>
    </>
  );
}

export const PROCESS_STYLES = SEC_HEAD_STYLES + `
.tp-how-steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:0; border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; background:var(--paper); }
.tp-how-steps[data-count="4"]{ grid-template-columns:repeat(4,1fr); }
.tp-step{ padding:34px 30px; border-right:1px solid var(--line); position:relative; display:flex; flex-direction:column; }
.tp-step:last-child{ border-right:0; }
.tp-flow{ position:absolute; top:46px; right:-9px; z-index:2; width:18px; height:18px; border-radius:50%; background:var(--paper); border:1px solid var(--line-2); display:grid; place-items:center; color:var(--lime-d); font-size:11px; }
.tp-step:last-child .tp-flow{ display:none; }
.tp-ico{ width:46px; height:46px; border-radius:10px; background:var(--lime-dim); display:grid; place-items:center; margin-bottom:20px; }
.tp-ico svg{ width:24px; height:24px; stroke:var(--forest); }
.tp-sn{ font-family:var(--font-mono); font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:var(--lime-d); }
.tp-step__h3{ font-family:var(--font-display); font-weight:600; font-size:23px; margin:8px 0 10px; color:var(--ink); }
.tp-step__p{ margin:0; color:var(--ink-2); font-size:15px; line-height:1.62; }
.tp-step__remove{ position:absolute; top:12px; right:12px; width:22px; height:22px; background:transparent; border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; z-index:3; }
.tp-step-add{ margin-top:24px; background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-body); font-size:14px; padding:10px 16px; border-radius:var(--r); cursor:pointer; }
.tp-step-add:hover{ color:var(--forest); border-color:var(--forest); }
@media (max-width:760px){ .tp-how-steps, .tp-how-steps[data-count="4"]{ grid-template-columns:1fr; } .tp-step{ border-right:0; border-bottom:1px solid var(--line); } .tp-step:last-child{ border-bottom:0; } .tp-flow{ display:none; } }
`;
