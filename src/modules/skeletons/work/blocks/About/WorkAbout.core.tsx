// src/modules/skeletons/work/blocks/About/WorkAbout.core.tsx
// SINGLE-SOURCE about layout (granth .core pattern). PLAIN server-safe module —
// renders through injected `E`. Binds the FROZEN work-core `about` contract
// (workElementContract.about, GranthParichay donor):
//   scalars — eyebrow · heading · bio
//   collection — facts[] { id, value, label }
//
// Two-column editorial: eyebrow/heading left, bio + optional facts strip right.
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries `data-sid`
// (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_ABOUT_STYLES } from './styles';

export interface WorkAboutFact { id: string; value?: string; label?: string }

export interface WorkAboutContent {
  eyebrow?: string;
  heading?: string;
  bio?: string;
  facts?: WorkAboutFact[];
}

export function WorkAboutCore({
  content, E, sectionId,
}: { content: WorkAboutContent; E: WorkPrimitives; sectionId: string }) {
  const facts = content.facts || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_ABOUT_STYLES }} />
      <section className="wk-about" data-sid={sectionId} data-section-id={sectionId} data-wk-about="">
        <div className="wk-about__in">
          <div className="wk-about__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-about__eyebrow" placeholder="About" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-about__heading" placeholder="The person behind the work" />
          </div>

          <div className="wk-about__body">
            <E.Txt elementKey="bio" value={content.bio} as="p"
              className="wk-about__bio" multiline
              placeholder="A few honest paragraphs about who you are, how you work, and why it matters." />

            {(facts.length > 0) && (
              <E.List collectionKey="facts" items={facts} className="wk-about__facts"
                itemClassName="wk-about__fact"
                makeItem={() => ({ value: '', label: '' })} min={0} max={4} addLabel="+ Fact"
                render={(item: WorkAboutFact) => (
                  <>
                    <E.Txt elementKey={`facts.${item.id}.value`} value={item.value} as="span"
                      className="wk-about__fact-value" placeholder="10+ yrs" />
                    <E.Txt elementKey={`facts.${item.id}.label`} value={item.label} as="span"
                      className="wk-about__fact-label" placeholder="Experience" />
                  </>
                )}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default WorkAboutCore;
