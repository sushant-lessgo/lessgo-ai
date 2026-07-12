// src/modules/templates/atelier/blocks/Packages/AtelierPackages.core.tsx
// SINGLE-SOURCE tiered packages — the `packages` capability's evidence section.
// 2–4 cards (scope #5 capacity; enforced by the blockManifest). PLAIN server-safe
// module. `features` is a string[] rendered statically this phase (rich per-item
// editing lands in the phase-9/11 work); all other slots go through E.

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { PACKAGES_STYLES } from './styles';

export interface AtelierPackageItem {
  id: string;
  name?: string;
  price_display?: string;
  summary?: string;
  features?: string[];
  cta_text?: string;
  is_featured?: boolean;
}

export interface AtelierPackagesContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  packages?: AtelierPackageItem[];
}

export function AtelierPackagesCore({ content, E }: { content: AtelierPackagesContent; E: AtelierPrimitives }) {
  const packages = content.packages || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PACKAGES_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad">
        <div className="lg-atelier-eyebrow-block">
          {content.eyebrow !== undefined && (
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-tag" placeholder="Packages" />
          )}
          <E.Txt elementKey="headline" value={content.headline} as="h2" className="lg-atelier-heading lg-atelier-h2" placeholder="Ways to work together" />
          <E.Txt elementKey="lede" value={content.lede} as="p" className="lg-atelier-lede" placeholder="" multiline />
        </div>
        <E.List
          collectionKey="packages"
          items={packages}
          className="lg-atelier-pkg__grid"
          itemClassName=""
          makeItem={() => ({ name: '', price_display: '', summary: '', features: [], cta_text: 'Enquire', is_featured: false })}
          min={2}
          max={4}
          addLabel="+ Package"
          render={(pkg: AtelierPackageItem) => (
            <div className={`lg-atelier-pkg__card${pkg.is_featured ? ' lg-atelier-pkg__card--featured' : ''}`}>
              <E.Txt elementKey={`packages.${pkg.id}.name`} value={pkg.name} as="p" className="lg-atelier-pkg__name" placeholder="Package" />
              <E.Txt elementKey={`packages.${pkg.id}.price_display`} value={pkg.price_display} as="p" className="lg-atelier-pkg__price" placeholder="From …" />
              <E.Txt elementKey={`packages.${pkg.id}.summary`} value={pkg.summary} as="p" className="lg-atelier-pkg__summary" placeholder="What's included, briefly." multiline />
              {(pkg.features && pkg.features.length > 0) && (
                <ul className="lg-atelier-pkg__features">
                  {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
              <div className="lg-atelier-pkg__cta">
                <E.Link hrefKey={`packages.${pkg.id}.cta_href`} href="#contact" className="lg-atelier-btn lg-atelier-ghost">
                  <E.Txt elementKey={`packages.${pkg.id}.cta_text`} value={pkg.cta_text} isButton placeholder="Enquire" />
                </E.Link>
              </div>
            </div>
          )}
        />
      </div>
    </>
  );
}

export default AtelierPackagesCore;
