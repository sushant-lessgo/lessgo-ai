// src/modules/templates/atelier/blocks/Packages/AtelierPackages.core.tsx
// SINGLE-SOURCE tiered packages — the `packages` capability's evidence section.
// 2–4 cards (scope #5 capacity; enforced by the blockManifest minCards/maxCards).
// PLAIN server-safe module. Ported from the approved design (index.html /
// experiences.html EXPERIENCES cards; atl-* → lg-atelier-).
//
// Field mapping (service schema AtelierPackages.packages): summary → tier/category
// label, name → h3, price_display → serif price, features[] → dashed list,
// is_featured → "Most booked" flag + accent CTA. `image` is an optional per-item
// slot (not schema-generated; customer/manual fill via the image affordance).

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
  image?: string;
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
        <div className="lg-atelier-rule">
          {content.eyebrow !== undefined && (
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-rule__idx" placeholder="02" />
          )}
          <E.Txt elementKey="headline" value={content.headline} as="h2" className="lg-atelier-heading" placeholder="Experiences" />
          {content.lede !== undefined && (
            <E.Txt elementKey="lede" value={content.lede} as="span" className="lg-atelier-rule__meta" placeholder="Ways to work together" />
          )}
        </div>
        <E.List
          collectionKey="packages"
          items={packages}
          className="lg-atelier-packs"
          itemClassName="lg-atelier-pack"
          makeItem={() => ({ name: '', price_display: '', summary: '', features: [], cta_text: 'See details', is_featured: false, image: '' })}
          min={2}
          max={4}
          addLabel="+ Package"
          render={(pkg: AtelierPackageItem) => (
            <>
              <div className="lg-atelier-pack-img">
                {pkg.is_featured && <span className="lg-atelier-flag">Most booked</span>}
                <E.Img elementKey={`packages.${pkg.id}.image`} src={pkg.image} alt={pkg.name || 'package'}
                  className="lg-atelier-pack-img__img" imgClassName=""
                  placeholder={<div className="lg-atelier-ph"><span>Package image</span></div>} />
              </div>
              <div className="lg-atelier-pack-body">
                <E.Txt elementKey={`packages.${pkg.id}.summary`} value={pkg.summary} as="span" className="lg-atelier-pack-cat" placeholder="The Essential" />
                <E.Txt elementKey={`packages.${pkg.id}.name`} value={pkg.name} as="h3" placeholder="Single Session" />
                <E.Txt elementKey={`packages.${pkg.id}.price_display`} value={pkg.price_display} as="div" className="lg-atelier-price" placeholder="From €250" />
                {(pkg.features && pkg.features.length > 0) && (
                  <ul className="lg-atelier-pack-features">
                    {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
                <div className="lg-atelier-pack-foot">
                  <E.Link hrefKey={`packages.${pkg.id}.cta_href`} href="#contact"
                    className={`lg-atelier-btn ${pkg.is_featured ? 'lg-atelier-accent' : 'lg-atelier-line'}`}>
                    <E.Txt elementKey={`packages.${pkg.id}.cta_text`} value={pkg.cta_text} isButton placeholder="See details" />
                  </E.Link>
                </div>
              </div>
            </>
          )}
        />
      </div>
    </>
  );
}

export default AtelierPackagesCore;
