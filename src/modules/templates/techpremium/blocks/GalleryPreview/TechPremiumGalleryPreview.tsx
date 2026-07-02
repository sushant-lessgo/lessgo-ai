'use client';

// src/modules/templates/techpremium/blocks/GalleryPreview/TechPremiumGalleryPreview.tsx
// TechPremium gallery preview: centered head + a masonry grid of photos wired to the
// shared lightbox (naayom.v1.js targets [data-tp-lightbox-group] + .tp-gitem). Edit
// mode. Surface forest-d (dark). Consumes the product `images` collection
// (GalleryMasonry). No JS in the block — the published asset wires the clicks.

import React from 'react';
import { Search } from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { STYLES } from './styles';

interface Image { id: string; src: string; tag: string; category: string }
interface Content { eyebrow: string; headline: string; lede: string; images: Image[] }
interface Props { sectionId: string }

export default function TechPremiumGalleryPreview({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate } =
    useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  // READ-ONLY: `images` are MATERIALIZED from Gallery-page photos flagged "⭐ show on
  // home" (or first-N fallback) — see collectionHelpers.materializeHomeGallery. Curate
  // on the Gallery page, not here. Only the section head stays editable.
  const images = blockContent.images || [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec" data-section-id={sectionId}>
        <div className="tp-sec__inner">
          <div className="tp-sec-head center">
            {(blockContent.eyebrow || edit) && (
              <TechPremiumEditable
                as="span" mode={mode} sectionId={sectionId} elementKey="eyebrow"
                value={blockContent.eyebrow} onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save" className="tp-eyebrow" placeholder="Gallery"
              />
            )}
            <TechPremiumEditable
              as="h2" mode={mode} sectionId={sectionId} elementKey="headline"
              value={blockContent.headline} onSave={(v) => handleContentUpdate('headline', v)}
              enterBehavior="save" className="" placeholder="From the field"
            />
            {(blockContent.lede || edit) && (
              <TechPremiumEditable
                as="p" mode={mode} sectionId={sectionId} elementKey="lede"
                value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)}
                multiline className="tp-lede" placeholder="One or two sentences introducing the gallery."
              />
            )}
          </div>

          <div className="tp-masonry" data-tp-lightbox-group>
            {images.map((im) => (
              <div key={im.id} className="tp-gitem">
                <div className="tp-ph on-dark">
                  {im.src ? <img src={im.src} alt={im.tag} /> : <span className="tp-tag">{im.tag || 'Photo'}</span>}
                </div>
                <div className="tp-ghover"><Search /></div>
              </div>
            ))}
          </div>
          {edit && (
            <p className="tp-managed-hint">Managed from your <strong>Gallery page</strong> — flag <strong>⭐ show on home</strong> on a photo. Shows up to 6.</p>
          )}
        </div>
      </section>
    </>
  );
}

