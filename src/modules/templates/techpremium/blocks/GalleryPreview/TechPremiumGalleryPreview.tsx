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
const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export default function TechPremiumGalleryPreview({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const images = blockContent.images || [];

  const updateImage = (id: string, key: keyof Image, value: string) =>
    handleCollectionUpdate('images', images.map((im) => (im.id === id ? { ...im, [key]: value } : im)));
  const addImage = () => {
    if (images.length >= 12) return;
    handleCollectionUpdate('images', [...images, { id: rid('im'), src: '', tag: '', category: '' }]);
  };
  const removeImage = (id: string) => {
    if (images.length <= 1) return;
    handleCollectionUpdate('images', images.filter((im) => im.id !== id));
  };

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
                {edit && (
                  <div className="tp-gedit">
                    <input
                      className="tp-ginput" placeholder="Image URL"
                      defaultValue={im.src} onBlur={(e) => updateImage(im.id, 'src', e.target.value)}
                    />
                    <input
                      className="tp-ginput" placeholder="Caption"
                      defaultValue={im.tag} onBlur={(e) => updateImage(im.id, 'tag', e.target.value)}
                    />
                    {images.length > 1 && (
                      <button type="button" className="tp-gx" onClick={() => removeImage(im.id)} aria-label="Remove image">×</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {edit && images.length < 12 && (
            <button type="button" className="tp-gadd" onClick={addImage}>+ Add image</button>
          )}
        </div>
      </section>
    </>
  );
}

