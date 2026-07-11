// src/modules/templates/granth/blocks/Hero/GranthHero.core.tsx
// SINGLE-SOURCE hero layout. PLAIN server-safe module (no client directive, no
// hooks/stores) — the layout lives here once and renders through injected
// primitives (E). Edit + published
// wrappers pass edit/static primitives respectively. Ported from template-design/WRDirection1Granth.html
// hero: centred role line · display name · gold ❖ ornament · arched portrait ·
// evocative quote · one CTA · social row (Facebook + YouTube first).

import React from 'react';
import type { GranthPrimitives } from '../primitives';
import { HERO_STYLES } from './styles';
import { socialIcon } from '../shared/socialIcons';

export interface GranthSocial { id: string; network: string; href: string }

export interface GranthHeroContent {
  role_line?: string;
  name?: string;
  quote?: string;
  portrait_image?: string;
  cta_label?: string;
  cta_href?: string;
  socials?: GranthSocial[];
}

const PORTRAIT_PH = (
  <span className="gr-portrait-ph" aria-label="लेखक का चित्र">
    <svg viewBox="0 0 100 110" fill="currentColor" aria-hidden="true">
      <circle cx="50" cy="38" r="22" opacity=".55" />
      <path d="M14 110c0-24 16-40 36-40s36 16 36 40z" opacity=".55" />
    </svg>
  </span>
);

export function GranthHeroCore({ content, E }: { content: GranthHeroContent; E: GranthPrimitives }) {
  const socials = content.socials || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <header className="gr-hero gr-wrap">
        <E.Txt elementKey="role_line" value={content.role_line} as="p"
          className="gr-role gr-caption-hi" placeholder="कवि · निबंधकार · सम्मानित" />

        <E.Txt elementKey="name" value={content.name} as="h1"
          className="gr-hero__name gr-display" placeholder="लेखक का नाम" />

        <div className="gr-orn"><span>❖</span></div>

        <E.Img elementKey="portrait_image" src={content.portrait_image} alt={content.name}
          className="gr-frame" placeholder={PORTRAIT_PH} eager />

        <E.Txt elementKey="quote" value={content.quote} as="blockquote"
          className="gr-quote" multiline placeholder="एक पंक्ति — लेखक के अपने शब्द।" />

        <div className="gr-cta-row">
          <E.Link hrefKey="cta_href" href={content.cta_href || '#books'} className="gr-btn">
            <E.Txt elementKey="cta_label" value={content.cta_label}
              className="gr-cta-label" placeholder="पुस्तकें देखें" />
          </E.Link>
        </div>

        <E.List collectionKey="socials" items={socials} className="gr-socials" itemClassName="gr-social-item"
          makeItem={() => ({ network: 'facebook', href: '' })} min={0} max={6} addLabel="+ सोशल"
          render={(item: GranthSocial) => (
            <E.Link hrefKey={`socials.${item.id}.href`} href={item.href} ariaLabel={item.network}
              external className="gr-social-a">
              {socialIcon(item.network)}
            </E.Link>
          )}
        />
      </header>
    </>
  );
}

export default GranthHeroCore;
