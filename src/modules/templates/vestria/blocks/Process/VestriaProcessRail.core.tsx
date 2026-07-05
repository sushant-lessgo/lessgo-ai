// src/modules/templates/vestria/blocks/Process/VestriaProcessRail.core.tsx
// SINGLE-SOURCE process layout. PLAIN server-safe module — renders only through
// injected primitives (E). Ported from the Vestria mock (.proc-grid): eyebrow
// block (tag + h2) over a dashed step rail (accent dot · mono kicker · h3 · p).

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { PROCESS_STYLES } from './styles';

export interface VestriaStep { id: string; kicker: string; title: string; description: string }

export interface VestriaProcessContent {
  eyebrow?: string;
  headline?: string;
  steps?: VestriaStep[];
}

export function VestriaProcessRailCore({ content, E }: { content: VestriaProcessContent; E: VestriaPrimitives }) {
  const steps = content.steps || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROCESS_STYLES }} />
      <section className="vs-proc vs-pad">
        <div className="vs-wrap">
          <div className="vs-eyebrow-block">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="vs-tag" placeholder="How We Work" />
            <E.Txt elementKey="headline" value={content.headline} as="h2"
              className="vs-heading vs-h2" placeholder="From brief to hand-out, one accountable team." />
          </div>
          <E.List collectionKey="steps" items={steps} className="vs-proc__grid" itemClassName="vs-step"
            makeItem={() => ({ kicker: '', title: '', description: '' })} min={3} max={6} addLabel="+ Step"
            render={(item: VestriaStep) => (
              <>
                <div className="vs-step__dot" aria-hidden="true" />
                <E.Txt elementKey={`steps.${item.id}.kicker`} value={item.kicker} as="span"
                  className="vs-step__k" placeholder="Step 01" />
                <E.Txt elementKey={`steps.${item.id}.title`} value={item.title} as="h3"
                  className="vs-heading vs-step__h3" placeholder="Consult" />
                <E.Txt elementKey={`steps.${item.id}.description`} value={item.description} as="p"
                  className="vs-step__p" multiline placeholder="One line — what happens in this step." />
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default VestriaProcessRailCore;
