'use client';

// src/modules/templates/techpremium/blocks/Process/TechPremiumProcess.tsx
// TechPremium "How it works" — centered head + hairline grid of numbered steps,
// each with a lucide icon, flow connector, and copy. Edit mode. Surface paper.
// Ported from naayom Home .how-steps / .step CSS.

import React from 'react';
import * as Icons from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { PROCESS_STYLES } from './styles';

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

