// src/modules/templates/vestria/blocks/Industries/VestriaIndustriesGrid.core.tsx
// SINGLE-SOURCE industries layout (image-led sector cards). PLAIN server-safe
// module — no client directive, no hooks/stores; renders only through injected
// primitives (E). Ported from the Vestria mock (#industries): eyebrow block
// (tag · h2 · lede) · 3-col dark cards with photo + gradient caption overlay
// (mono kicker · title · one-liner).

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { INDUSTRIES_STYLES } from './styles';

export interface VestriaIndustry {
  id: string;
  kicker: string;
  title: string;
  description: string;
  image: string;
}

export interface VestriaIndustriesContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  industries?: VestriaIndustry[];
}

const MEDIA_PH = (
  <span className="vs-ph" aria-hidden="true"><span>Sector image</span></span>
);

export function VestriaIndustriesGridCore({ content, E }: { content: VestriaIndustriesContent; E: VestriaPrimitives }) {
  const industries = content.industries || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: INDUSTRIES_STYLES }} />
      <section className="vs-industries vs-pad">
        <div className="vs-wrap">
          <div className="vs-eyebrow-block">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="vs-tag" placeholder="Who we serve" />
            <E.Txt elementKey="headline" value={content.headline} as="h2"
              className="vs-heading vs-h2" multiline placeholder="Serving excellence across every sector you run." />
            <E.Txt elementKey="lede" value={content.lede} as="p"
              className="vs-lede" multiline placeholder="One line on sector-specific programmes and standards." />
          </div>
          <E.List collectionKey="industries" items={industries} className="vs-ind-grid" itemClassName="vs-ind"
            makeItem={() => ({ kicker: '', title: '', description: '', image: '' })} min={3} max={6} addLabel="+ Sector"
            render={(item: VestriaIndustry) => (
              <>
                <E.Img elementKey={`industries.${item.id}.image`} src={item.image} alt={item.title}
                  className="vs-ind__media" placeholder={MEDIA_PH} />
                <div className="vs-ind__cap">
                  <E.Txt elementKey={`industries.${item.id}.kicker`} value={item.kicker} as="span"
                    className="vs-ind__n" placeholder="Sector 01" />
                  <E.Txt elementKey={`industries.${item.id}.title`} value={item.title} as="h3"
                    className="vs-heading" placeholder="Sector name" />
                  <E.Txt elementKey={`industries.${item.id}.description`} value={item.description} as="p"
                    className="vs-ind__p" multiline placeholder="What you deliver for this sector." />
                </div>
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default VestriaIndustriesGridCore;
