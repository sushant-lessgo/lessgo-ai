'use client';

// Lumen "How a shoot works" process band (edit). Dark espresso band (surface
// wrapper paints the bg). Consumes: eyebrow/headline/lede (+_nl twins) + a
// steps[] collection ({ step_number, title(+_nl), description(+_nl) }).

import React from 'react';
import { useLumenBlock } from '../../hooks/useLumenBlock';
import { LumenEditable } from '../../components/LumenEditable';
import { PROCESS_STYLES } from './styles';

interface Step {
  id: string;
  step_number?: string;
  title?: string;
  title_nl?: string;
  description?: string;
  description_nl?: string;
}
interface LumenProcessContent {
  eyebrow: string; eyebrow_nl: string;
  headline: string; headline_nl: string;
  lede: string; lede_nl: string;
  steps: Step[];
}

export default function LumenShootProcess({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, editLang, handleContentUpdate, handleCollectionUpdate } =
    useLumenBlock<LumenProcessContent>({ sectionId });

  const steps = blockContent.steps || [];
  const edit = mode === 'edit';

  const updateStep = (id: string, key: string, value: string) =>
    handleCollectionUpdate('steps', steps.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  const addStep = () => {
    if (steps.length >= 5) return;
    const n = String(steps.length + 1).padStart(2, '0');
    handleCollectionUpdate('steps', [...steps, { id: `s${Date.now()}`, step_number: n, title: 'Step', title_nl: '', description: '', description_nl: '' }]);
  };
  const removeStep = (id: string) => {
    if (steps.length <= 2) return;
    handleCollectionUpdate('steps', steps.filter((s) => s.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROCESS_STYLES }} />
      <div className="lm-process" data-section-id={sectionId}>
        <div className="lm-sec-head">
          <LumenEditable
            as="span" mode={mode} sectionId={sectionId} editLang={editLang}
            content={blockContent} elementKey="eyebrow" onSave={handleContentUpdate}
            enterBehavior="save" className="lm-eyebrow" placeholder="How a shoot works"
          />
          <LumenEditable
            as="h2" mode={mode} sectionId={sectionId} editLang={editLang}
            content={blockContent} elementKey="headline" onSave={handleContentUpdate}
            enterBehavior="save" className="lm-sec-title" placeholder="Simple to book, easy on the day."
          />
          <LumenEditable
            as="p" mode={mode} sectionId={sectionId} editLang={editLang}
            content={blockContent} elementKey="lede" onSave={handleContentUpdate}
            multiline className="lm-lede" placeholder="A short reassuring line about the process."
          />
        </div>
        <div className="lm-steps">
          {steps.map((s) => (
            <div key={s.id} className="lm-step">
              {edit && steps.length > 2 && (
                <button type="button" className="lm-step__rm" onClick={() => removeStep(s.id)} aria-label="Remove step">×</button>
              )}
              <LumenEditable
                as="span" mode={mode} sectionId={sectionId} editLang="en"
                content={s} elementKey="step_number"
                onSave={(key, v) => updateStep(s.id, key, v)}
                enterBehavior="save" className="lm-sn" placeholder="01"
              />
              <LumenEditable
                as="h3" mode={mode} sectionId={sectionId} editLang={editLang}
                content={s} elementKey="title"
                onSave={(key, v) => updateStep(s.id, key, v)}
                enterBehavior="save" placeholder="Step title"
              />
              <LumenEditable
                as="p" mode={mode} sectionId={sectionId} editLang={editLang}
                content={s} elementKey="description"
                onSave={(key, v) => updateStep(s.id, key, v)}
                multiline placeholder="What happens at this step."
              />
            </div>
          ))}
        </div>
        {edit && steps.length < 5 && (
          <button type="button" className="lm-step-add" onClick={addStep}>+ Add step</button>
        )}
      </div>
    </>
  );
}
