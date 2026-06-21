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
import { SEC_HEAD_STYLES, PH_STYLES, LIGHTBOX_STYLES } from '../shared/sharedStyles';

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

export const GALLERY_STYLES = `
.tp-sec-head h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
[data-surface="forest-d"] .tp-sec-head h2, [data-surface="forest"] .tp-sec-head h2 { color:var(--paper); }
.tp-masonry{ column-count:4; column-gap:16px; }
.tp-masonry .tp-gitem{ break-inside:avoid; margin-bottom:16px; display:block; width:100%; }
.tp-gitem{ cursor:zoom-in; position:relative; }
.tp-gitem .tp-ghover{ position:absolute; inset:0; display:grid; place-items:center; opacity:0; transition:opacity .16s ease; }
.tp-gitem .tp-ghover svg{ width:26px; height:26px; stroke:#fff; stroke-width:2; fill:none; }
.tp-gitem:hover .tp-ghover{ opacity:1; background:oklch(0.255 0.038 159 / 0.4); border-radius:var(--r-lg); }
.tp-gedit{ position:relative; z-index:3; display:flex; flex-direction:column; gap:6px; margin-top:8px; }
.tp-ginput{ width:100%; font-family:var(--font-mono); font-size:11px; padding:6px 8px; border:1px solid var(--line-dk); border-radius:var(--r); background:var(--forest-d); color:var(--paper); }
.tp-gx{ align-self:flex-start; background:transparent; border:1px solid var(--line-dk); color:oklch(0.78 0.03 140); font-size:12px; padding:2px 8px; border-radius:var(--r); cursor:pointer; }
.tp-gadd{ display:block; margin:24px auto 0; border:1px dashed var(--line-dk); border-radius:var(--r-lg); background:transparent; color:oklch(0.78 0.03 140); font-family:var(--font-body); font-size:14px; padding:12px 24px; cursor:pointer; }
.tp-gadd:hover{ border-color:var(--lime); color:var(--lime); }
@media (max-width:1040px){ .tp-masonry{ column-count:3; } }
@media (max-width:760px){ .tp-masonry{ column-count:2; } }
@media (max-width:520px){ .tp-masonry{ column-count:1; } }
`;

const STYLES = SEC_HEAD_STYLES + PH_STYLES + LIGHTBOX_STYLES + GALLERY_STYLES;
export { STYLES };
