// Single-source Footer (जुड़िए / GranthFollowFooter) layout. PLAIN module. Follow
// block: eyebrow · heading · note · social row (Facebook + YouTube first) · fine
// print. Ported from template-design/WRDirection1Granth.html (footer).

import React from 'react';
import type { GranthPrimitives } from '../primitives';
import { FOOTER_STYLES } from './styles';
import { socialIcon } from '../shared/socialIcons';

export interface GranthSocial { id: string; network: string; href: string }

export interface GranthFooterContent {
  eyebrow?: string;
  heading?: string;
  note?: string;
  socials?: GranthSocial[];
  copyright?: string;
}

export function GranthFooterCore({ content, E }: { content: GranthFooterContent; E: GranthPrimitives }) {
  const socials = content.socials || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer className="gr-footer">
        <div className="gr-wrap">
          <E.Txt elementKey="eyebrow" value={content.eyebrow} as="p"
            className="gr-caption" placeholder="जुड़िए" />
          <E.Txt elementKey="heading" value={content.heading} as="h2"
            className="gr-footer__heading" placeholder="नई रचनाओं की सूचना के लिए जुड़िए" />
          <E.Txt elementKey="note" value={content.note} as="p"
            className="gr-footer__note" placeholder="फ़ेसबुक और यूट्यूब पर नियमित रचनाएँ।" />

          <E.List collectionKey="socials" items={socials} className="gr-footer__socials" itemClassName="gr-social-item"
            makeItem={() => ({ network: 'facebook', href: '' })} min={0} max={6} addLabel="+ सोशल"
            render={(item: GranthSocial) => (
              <E.Link hrefKey={`socials.${item.id}.href`} href={item.href} ariaLabel={item.network}
                external className="gr-social-a">
                {socialIcon(item.network)}
              </E.Link>
            )}
          />

          <E.Txt elementKey="copyright" value={content.copyright} as="p"
            className="gr-footer__fine" placeholder="लेखक का नाम © २०२६" />
        </div>
      </footer>
    </>
  );
}

export default GranthFooterCore;
