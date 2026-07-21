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
  // Wave 2 About lane — all optional, graceful-empty (empty → today's markup).
  //   portrait_image — 4:5 maker portrait (manual media lane, picker-wired).
  //   badge          — short accent chip over the portrait, DISTINCT from eyebrow.
  //   signature      — the maker's name, serif sign-off under the bio.
  badge?: string;
  signature?: string;
  portrait_image?: string;
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
            {/* Portrait (4:5) + overlaid accent badge (Wave 2, designer .atl-split-art).
                GRACEFUL-EMPTY: no placeholder on the portrait → published-empty is a
                bare :empty div (display:none, no space); badge is E.Txt → null when
                empty. So with all three empty the head column collapses to EXACTLY
                today's eyebrow + heading (Kundius byte-identical, no reflow). The edit
                render keeps the picker/edit affordance so a portrait can be added. */}
            <div className="wk-about__art">
              <E.Img elementKey="portrait_image" src={content.portrait_image} alt={content.heading}
                className="wk-about__portrait" imgClassName="wk-about__portrait-img" />
              <E.Txt elementKey="badge" value={content.badge} as="span"
                className="wk-about__badge" />
            </div>
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-about__eyebrow" placeholder="About" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-about__heading" placeholder="The person behind the work" />
          </div>

          <div className="wk-about__body">
            <E.Txt elementKey="bio" value={content.bio} as="p"
              className="wk-about__bio" multiline
              placeholder="A few honest paragraphs about who you are, how you work, and why it matters." />

            {/* Serif sign-off = the maker's name (Wave 2, designer .atl-sign). No
                placeholder → published-empty → null (no leak, no reflow). Defaults to
                the seller's name at first-gen (stampAboutSignature). */}
            <E.Txt elementKey="signature" value={content.signature} as="div"
              className="wk-about__sign" />

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
