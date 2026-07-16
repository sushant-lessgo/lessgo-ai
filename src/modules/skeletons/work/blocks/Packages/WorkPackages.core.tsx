// src/modules/skeletons/work/blocks/Packages/WorkPackages.core.tsx
// SINGLE-SOURCE packages layout (granth .core pattern). PLAIN server-safe module —
// renders through injected `E`. Binds the FROZEN work-core `packages` contract
// (workElementContract.packages):
//   scalars — eyebrow · heading · lead
//   collection — packages[] { id, name, price_mode, price_line, description, cta_label }
//
// price_mode drives the price DISPLAY (exact | from | on-request): `from` prefixes
// a small "From" affix; `exact`/`on-request` show the price_line verbatim ("On
// request" is a legal price line). The affix is derived CHROME (not a contract
// field) so it renders identically in both renderers.
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries `data-sid`
// (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_PACKAGES_STYLES } from './styles';

export interface WorkPackage {
  id: string;
  name?: string;
  price_mode?: string; // exact | from | on-request
  price_line?: string;
  description?: string;
  cta_label?: string;
}

export interface WorkPackagesContent {
  eyebrow?: string;
  heading?: string;
  lead?: string;
  packages?: WorkPackage[];
}

export function WorkPackagesCore({
  content, E, sectionId,
}: { content: WorkPackagesContent; E: WorkPrimitives; sectionId: string }) {
  const packages = content.packages || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_PACKAGES_STYLES }} />
      <section className="wk-packages" data-sid={sectionId} data-section-id={sectionId} data-wk-packages="">
        <div className="wk-packages__in">
          <div className="wk-packages__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-packages__eyebrow" placeholder="Packages" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-packages__heading" placeholder="Ways to work together" />
            <E.Txt elementKey="lead" value={content.lead} as="p"
              className="wk-packages__lead" multiline
              placeholder="Clear, honest pricing — pick the scope that fits." />
          </div>

          <E.List collectionKey="packages" items={packages} className="wk-packages__grid"
            itemClassName="wk-packages__card"
            makeItem={() => ({ name: '', price_mode: 'on-request', price_line: 'On request', description: '', cta_label: '' })}
            min={1} max={6} addLabel="+ Package"
            render={(item: WorkPackage) => (
              <>
                <E.Txt elementKey={`packages.${item.id}.name`} value={item.name} as="span"
                  className="wk-packages__name" placeholder="Package name" />
                <span className="wk-packages__price" data-price-mode={item.price_mode || 'on-request'}>
                  {(item.price_mode === 'from') && (
                    <span className="wk-packages__from" aria-hidden="true">From</span>
                  )}
                  <E.Txt elementKey={`packages.${item.id}.price_line`} value={item.price_line} as="span"
                    placeholder="On request" />
                </span>
                <E.Txt elementKey={`packages.${item.id}.description`} value={item.description} as="p"
                  className="wk-packages__desc" multiline placeholder="What this package includes." />
                <E.Txt elementKey={`packages.${item.id}.cta_label`} value={item.cta_label} as="span"
                  className="wk-packages__cta" isButton placeholder="Enquire →" />
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default WorkPackagesCore;
