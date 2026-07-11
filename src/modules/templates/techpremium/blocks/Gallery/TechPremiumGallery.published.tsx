// src/modules/templates/techpremium/blocks/Gallery/TechPremiumGallery.published.tsx
// Server-safe published variant of TechPremiumGallery. The shared lightbox + filter
// behaviors are wired by naayom.v1.js via .tp-gfilter button[data-cat] +
// .tp-ggrid[data-tp-lightbox-group] + .tp-gitem[data-cat] markup — no JS here.

import React from 'react';
import { Search } from 'lucide-react';
import { GALLERY_STYLES } from './styles';

interface Filter { id?: string; label?: string; cat?: string }
interface Image { id?: string; src?: string; tag?: string; category?: string }
interface Props {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  filters?: Filter[];
  images?: Image[];
}

export default function TechPremiumGalleryPublished(props: Props) {
  const filters = Array.isArray(props.filters) ? props.filters : [];
  const images = Array.isArray(props.images) ? props.images : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GALLERY_STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          <div className="tp-sec-head center">
            {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
            {props.headline && <h2 dangerouslySetInnerHTML={{ __html: props.headline }} />}
            {props.lede && <p className="tp-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />}
          </div>

          <div className="tp-gfilter">
            <button type="button" data-cat="all" className="is-active">All</button>
            {filters.map((f, idx) => (
              <button key={f.id || idx} type="button" data-cat={f.cat}>{f.label || 'Category'}</button>
            ))}
          </div>

          {images.length > 0 && (
            <div className="tp-ggrid" data-tp-lightbox-group>
              {images.map((im, idx) => (
                <div key={im.id || idx} className="tp-gitem" data-cat={im.category}>
                  <div className="tp-ph on-dark">
                    {im.src ? <img src={im.src} alt={im.tag || ''} loading="lazy" decoding="async" /> : <span className="tp-tag">{im.tag || 'Photo'}</span>}
                  </div>
                  <span className="tp-ghover"><Search /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
