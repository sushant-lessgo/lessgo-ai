// src/modules/templates/techpremium/blocks/GalleryPreview/TechPremiumGalleryPreview.published.tsx
// Server-safe published variant of TechPremiumGalleryPreview. The shared lightbox is
// wired by naayom.v1.js via [data-tp-lightbox-group] + .tp-gitem markup — no JS here.

import React from 'react';
import { Search } from 'lucide-react';
import { STYLES } from './styles';

interface Image { id?: string; src?: string; tag?: string; category?: string }
interface Props {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  images?: Image[];
}

export default function TechPremiumGalleryPreviewPublished(props: Props) {
  const images = Array.isArray(props.images) ? props.images : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          <div className="tp-sec-head center">
            {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
            {props.headline && <h2 dangerouslySetInnerHTML={{ __html: props.headline }} />}
            {props.lede && <p className="tp-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />}
          </div>

          {images.length > 0 && (
            <div className="tp-masonry" data-tp-lightbox-group>
              {images.map((im, idx) => (
                <div key={im.id || idx} className="tp-gitem">
                  <div className="tp-ph on-dark">
                    {im.src ? <img src={im.src} alt={im.tag || ''} /> : <span className="tp-tag">{im.tag || 'Photo'}</span>}
                  </div>
                  <div className="tp-ghover"><Search /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
