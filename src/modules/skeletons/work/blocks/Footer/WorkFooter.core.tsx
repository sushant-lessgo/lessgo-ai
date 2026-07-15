// src/modules/skeletons/work/blocks/Footer/WorkFooter.core.tsx
// SINGLE-SOURCE footer layout (granth .core pattern). PLAIN server-safe module —
// renders through injected `E`. Binds the FROZEN work-core `footer` contract
// (workElementContract.footer, GranthFollowFooter donor):
//   scalars — eyebrow · heading · note · copyright
//   collection — socials[] { id, network, href }
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries
// `data-sid` (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { normalizeCopyrightYear } from '@/modules/templates/shared/footerHygiene';
import { WORK_FOOTER_STYLES } from './styles';

export interface WorkFooterSocial { id: string; network?: string; href?: string }

export interface WorkFooterContent {
  eyebrow?: string;
  heading?: string;
  note?: string;
  copyright?: string;
  socials?: WorkFooterSocial[];
}

export function WorkFooterCore({
  content, E, sectionId,
}: { content: WorkFooterContent; E: WorkPrimitives; sectionId: string }) {
  const socials = content.socials || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_FOOTER_STYLES }} />
      <footer className="wk-footer" data-sid={sectionId} data-section-id={sectionId} data-wk-footer="">
        <div className="wk-footer__in">
          <div className="wk-footer__top">
            <div>
              <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
                className="wk-footer__eyebrow" placeholder="Get in touch" />
              <E.Txt elementKey="heading" value={content.heading} as="h2"
                className="wk-footer__heading" placeholder="Let’s make yours." />
            </div>
            <E.Txt elementKey="note" value={content.note} as="p"
              className="wk-footer__note" multiline placeholder="A short closing line about the studio." />
          </div>

          {(socials.length > 0) && (
            <E.List collectionKey="socials" items={socials} className="wk-footer__socials"
              makeItem={() => ({ network: 'instagram', href: '' })} min={0} max={6} addLabel="+ Social"
              render={(item: WorkFooterSocial) => (
                <E.Link hrefKey={`socials.${item.id}.href`} href={item.href}
                  ariaLabel={item.network} external className="wk-footer__social">
                  <E.Txt elementKey={`socials.${item.id}.network`} value={item.network}
                    as="span" placeholder="Instagram" />
                </E.Link>
              )}
            />
          )}

          <div className="wk-footer__bottom">
            <E.Txt elementKey="copyright"
              value={normalizeCopyrightYear(content.copyright) ?? content.copyright} as="span"
              placeholder="© Studio Name" />
          </div>
        </div>
      </footer>
    </>
  );
}

export default WorkFooterCore;
