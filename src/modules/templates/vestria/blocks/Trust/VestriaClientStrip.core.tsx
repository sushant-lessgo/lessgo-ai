// src/modules/templates/vestria/blocks/Trust/VestriaClientStrip.core.tsx
// SINGLE-SOURCE trust layout (client logo strip). PLAIN server-safe module — no
// client directive, no hooks/stores; renders only through injected primitives (E).
// Ported from the Vestria mock (.clients): centred mono label · wordmark row
// (display-face name + small mono qualifier). Logos are typographic wordmarks —
// real client NAMES are manual_preferred, never fabricated.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { TRUST_STYLES } from './styles';

export interface VestriaClientLogo { id: string; name: string; sub: string }

export interface VestriaTrustContent {
  label_text?: string;
  logos?: VestriaClientLogo[];
}

export function VestriaClientStripCore({ content, E }: { content: VestriaTrustContent; E: VestriaPrimitives }) {
  const logos = content.logos || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TRUST_STYLES }} />
      <section className="vs-clients">
        <div className="vs-wrap">
          <E.Txt elementKey="label_text" value={content.label_text} as="span"
            className="vs-clients__lab" placeholder="Trusted by teams across the region" />
          {logos.length > 0 && (
            <E.List collectionKey="logos" items={logos} className="vs-clients__row" itemClassName="vs-logo"
              makeItem={() => ({ name: '', sub: '' })} min={0} max={8} addLabel="+ Client"
              render={(item: VestriaClientLogo) => (
                <>
                  <E.Txt elementKey={`logos.${item.id}.name`} value={item.name} as="b" placeholder="Client name" />
                  <E.Txt elementKey={`logos.${item.id}.sub`} value={item.sub} as="span"
                    className="vs-logo__sub" placeholder="Sector" />
                </>
              )}
            />
          )}
        </div>
      </section>
    </>
  );
}

export default VestriaClientStripCore;
