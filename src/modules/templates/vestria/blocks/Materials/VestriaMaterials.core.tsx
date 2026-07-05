// src/modules/templates/vestria/blocks/Materials/VestriaMaterials.core.tsx
// SINGLE-SOURCE materials layout. PLAIN server-safe module (no client directive,
// no hooks/stores) — renders only through injected primitives (E). Ported from
// the Vestria mock (.fabric): 2-col — swatch grid (coloured squares with
// name + accent code labels) · tag + h2 + lede + dashed material/use rows.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { MATERIALS_STYLES } from './styles';

export interface VestriaSwatch { id: string; name: string; code: string; color: string }
export interface VestriaMaterialRow { id: string; name: string; use: string }

export interface VestriaMaterialsContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  swatches?: VestriaSwatch[];
  rows?: VestriaMaterialRow[];
}

export function VestriaMaterialsCore({ content, E }: { content: VestriaMaterialsContent; E: VestriaPrimitives }) {
  const swatches = content.swatches || [];
  const rows = content.rows || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MATERIALS_STYLES }} />
      <section className="vs-pad-sm">
        <div className="vs-wrap">
          <div className="vs-fab-grid">
            <div>
              <E.List collectionKey="swatches" items={swatches} className="vs-swatches" itemClassName=""
                makeItem={() => ({ name: '', code: '', color: '#8a8f98' })} min={0} max={9} addLabel="+ Swatch"
                render={(item: VestriaSwatch) => (
                  <div className="vs-sw" style={{ background: item.color || 'var(--paper-2)' }}>
                    <span className="vs-sw__lab">
                      <E.Txt elementKey={`swatches.${item.id}.name`} value={item.name} as="span" placeholder="Material" />
                      {' '}
                      <span className="vs-sw__code">
                        <E.Txt elementKey={`swatches.${item.id}.code`} value={item.code} as="span" placeholder="/ 01" />
                      </span>
                    </span>
                  </div>
                )}
              />
            </div>
            <div>
              <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
                className="vs-tag" placeholder="Materials & Colourways" />
              <E.Txt elementKey="headline" value={content.headline} as="h2"
                className="vs-heading vs-fab__h2" placeholder="Material chosen for the work, not the catalogue." />
              <E.Txt elementKey="lede" value={content.lede} as="p"
                className="vs-fab__lede" multiline placeholder="One line — how materials are selected and proven." />
              <E.List collectionKey="rows" items={rows} className="vs-fab-list" itemClassName="vs-fab-row"
                makeItem={() => ({ name: '', use: '' })} min={3} max={6} addLabel="+ Material"
                render={(item: VestriaMaterialRow) => (
                  <>
                    <E.Txt elementKey={`rows.${item.id}.name`} value={item.name} as="span"
                      className="vs-fab-row__name" placeholder="Material name" />
                    <E.Txt elementKey={`rows.${item.id}.use`} value={item.use} as="span"
                      className="vs-fab-row__use" placeholder="Where it's used — why it holds up" />
                  </>
                )}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default VestriaMaterialsCore;
