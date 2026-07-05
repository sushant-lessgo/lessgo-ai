// src/modules/templates/vestria/blocks/Features/VestriaServicesGrid.core.tsx
// SINGLE-SOURCE services layout. PLAIN server-safe module (no client directive,
// no hooks/stores) — renders only through injected primitives (E). Ported from
// the Vestria mock (.svc-grid): eyebrow block · bordered 3-col grid of service
// cells (mono kicker · title · description), hover paper-2.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { FEATURES_STYLES } from './styles';

export interface VestriaService { id: string; kicker: string; title: string; description: string }

export interface VestriaServicesContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  features?: VestriaService[];
}

export function VestriaServicesGridCore({ content, E }: { content: VestriaServicesContent; E: VestriaPrimitives }) {
  const features = content.features || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FEATURES_STYLES }} />
      <section className="vs-pad">
        <div className="vs-wrap">
          <div className="vs-eyebrow-block">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="vs-tag" placeholder="Our Services" />
            <E.Txt elementKey="headline" value={content.headline} as="h2"
              className="vs-heading vs-h2" placeholder="Value-added services that separate us." />
            <E.Txt elementKey="lede" value={content.lede} as="p"
              className="vs-lede" multiline placeholder="One line — what backs every engagement, start to finish." />
          </div>
          <E.List collectionKey="features" items={features} className="vs-svc-grid" itemClassName="vs-svc"
            makeItem={() => ({ kicker: '', title: '', description: '' })} min={3} max={6} addLabel="+ Service"
            render={(item: VestriaService) => (
              <>
                <E.Txt elementKey={`features.${item.id}.kicker`} value={item.kicker} as="span"
                  className="vs-svc__no" placeholder="SVC / 01" />
                <E.Txt elementKey={`features.${item.id}.title`} value={item.title} as="h3"
                  className="vs-heading vs-svc__h3" placeholder="Service name" />
                <E.Txt elementKey={`features.${item.id}.description`} value={item.description} as="p"
                  className="vs-svc__p" multiline placeholder="One concrete sentence — what it delivers." />
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default VestriaServicesGridCore;
