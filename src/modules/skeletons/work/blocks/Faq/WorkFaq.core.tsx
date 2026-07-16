// src/modules/skeletons/work/blocks/Faq/WorkFaq.core.tsx
// SINGLE-SOURCE faq layout (granth .core pattern). PLAIN server-safe module —
// renders through injected `E`. Binds the FROZEN work-core `faq` contract
// (workElementContract.faq):
//   scalars — eyebrow · heading
//   collection — items[] { id, question, answer }
//
// A static question/answer list (no disclosure JS → edit == published trivially).
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries `data-sid`
// (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_FAQ_STYLES } from './styles';

export interface WorkFaqItem { id: string; question?: string; answer?: string }

export interface WorkFaqContent {
  eyebrow?: string;
  heading?: string;
  items?: WorkFaqItem[];
}

export function WorkFaqCore({
  content, E, sectionId,
}: { content: WorkFaqContent; E: WorkPrimitives; sectionId: string }) {
  const items = content.items || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_FAQ_STYLES }} />
      <section className="wk-faq" data-sid={sectionId} data-section-id={sectionId} data-wk-faq="">
        <div className="wk-faq__in">
          <div className="wk-faq__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-faq__eyebrow" placeholder="FAQ" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-faq__heading" placeholder="Questions, answered" />
          </div>

          <E.List collectionKey="items" items={items} className="wk-faq__list"
            itemClassName="wk-faq__item"
            makeItem={() => ({ question: '', answer: '' })} min={1} max={12} addLabel="+ Question"
            render={(item: WorkFaqItem) => (
              <>
                <E.Txt elementKey={`items.${item.id}.question`} value={item.question} as="h3"
                  className="wk-faq__q" placeholder="What should I ask?" />
                <E.Txt elementKey={`items.${item.id}.answer`} value={item.answer} as="p"
                  className="wk-faq__a" multiline placeholder="A clear, direct answer." />
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default WorkFaqCore;
