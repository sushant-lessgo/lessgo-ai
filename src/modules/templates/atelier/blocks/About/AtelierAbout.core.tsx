// src/modules/templates/atelier/blocks/About/AtelierAbout.core.tsx
// SINGLE-SOURCE about section. PLAIN server-safe module. Provisional; refined in
// the phase-9 visual port.

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { ABOUT_STYLES } from './styles';

export interface AtelierAboutContent {
  eyebrow?: string;
  headline?: string;
  body?: string;
  body2?: string;
  about_image?: string;
  signature?: string;
}

export function AtelierAboutCore({ content, E }: { content: AtelierAboutContent; E: AtelierPrimitives }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ABOUT_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad lg-atelier-about">
        <div className="lg-atelier-about__media">
          <E.Img elementKey="about_image" src={content.about_image} alt={content.headline || 'about'}
            className="lg-atelier-about__mediaWrap" imgClassName=""
            placeholder={<div className="lg-atelier-ph"><span>Portrait</span></div>} />
        </div>
        <div className="lg-atelier-about__text">
          {content.eyebrow !== undefined && (
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-tag" placeholder="About" />
          )}
          <E.Txt elementKey="headline" value={content.headline} as="h2" className="lg-atelier-heading lg-atelier-h2" placeholder="About the studio" />
          <div className="lg-atelier-about__body">
            <E.Txt elementKey="body" value={content.body} as="p" placeholder="A few sentences about who you are and how you work." multiline />
            <E.Txt elementKey="body2" value={content.body2} as="p" placeholder="" multiline />
          </div>
          <E.Txt elementKey="signature" value={content.signature} as="p" className="lg-atelier-about__sig" placeholder="" />
        </div>
      </div>
    </>
  );
}

export default AtelierAboutCore;
