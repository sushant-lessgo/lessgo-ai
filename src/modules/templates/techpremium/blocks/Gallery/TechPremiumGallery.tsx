'use client';

// src/modules/templates/techpremium/blocks/Gallery/TechPremiumGallery.tsx
// TechPremium full-page filterable Gallery (Phase 4c) — centered head + a filter bar
// + a square-tile grid wired to the shared lightbox AND filter behaviors via
// naayom.v1.js (targets .tp-gfilter button[data-cat], .tp-ggrid[data-tp-lightbox-group],
// .tp-gitem[data-cat]). Edit mode. Consumes the product `filters`/`images` collections
// (GalleryFullPage). No JS in the block — the published asset wires filter + clicks.

import React from 'react';
import { Search } from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { SEC_HEAD_STYLES, PH_STYLES } from '../shared/sharedStyles';

interface Filter { id: string; label: string; cat: string }
interface Image { id: string; src: string; tag: string; category: string }
interface Content { eyebrow: string; headline: string; lede: string; filters: Filter[]; images: Image[] }
interface Props { sectionId: string }
const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export default function TechPremiumGallery({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const filters = blockContent.filters || [];
  const images = blockContent.images || [];

  const updateFilter = (id: string, key: keyof Filter, value: string) =>
    handleCollectionUpdate('filters', filters.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  const addFilter = () => {
    if (filters.length >= 6) return;
    handleCollectionUpdate('filters', [...filters, { id: rid('f'), label: 'Category', cat: '' }]);
  };
  const removeFilter = (id: string) =>
    handleCollectionUpdate('filters', filters.filter((f) => f.id !== id));

  const updateImage = (id: string, key: keyof Image, value: string) =>
    handleCollectionUpdate('images', images.map((im) => (im.id === id ? { ...im, [key]: value } : im)));
  const addImage = () => {
    if (images.length >= 24) return;
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
              enterBehavior="save" className="" placeholder="In the field"
            />
            {(blockContent.lede || edit) && (
              <TechPremiumEditable
                as="p" mode={mode} sectionId={sectionId} elementKey="lede"
                value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)}
                multiline className="tp-lede" placeholder="One or two sentences introducing the gallery."
              />
            )}
          </div>

          <div className="tp-gfilter">
            <button type="button" data-cat="all" className="is-active">All</button>
            {filters.map((f) => (
              <button key={f.id} type="button" data-cat={f.cat}>{f.label || 'Category'}</button>
            ))}
          </div>

          {edit && (
            <div className="tp-gctl">
              {filters.map((f) => (
                <span key={f.id} className="tp-gctl__f">
                  <input className="tp-ginput" placeholder="Label" defaultValue={f.label} onBlur={(e) => updateFilter(f.id, 'label', e.target.value)} />
                  <input className="tp-ginput" placeholder="cat" defaultValue={f.cat} onBlur={(e) => updateFilter(f.id, 'cat', e.target.value)} />
                  <button type="button" className="tp-x" onClick={() => removeFilter(f.id)} aria-label="Remove filter">×</button>
                </span>
              ))}
              {filters.length < 6 && <button type="button" className="tp-add" onClick={addFilter}>+ filter</button>}
            </div>
          )}

          <div className="tp-ggrid" data-tp-lightbox-group>
            {images.map((im) => (
              <div key={im.id} className="tp-gitem" data-cat={im.category}>
                <div className="tp-ph on-dark">
                  {im.src ? <img src={im.src} alt={im.tag} /> : null}
                  <span className="tp-tag">{im.tag || 'Photo'}</span>
                </div>
                <span className="tp-ghover"><Search /></span>
                {edit && (
                  <div className="tp-gedit">
                    <input className="tp-ginput" placeholder="Image URL" defaultValue={im.src} onBlur={(e) => updateImage(im.id, 'src', e.target.value)} />
                    <input className="tp-ginput" placeholder="Caption" defaultValue={im.tag} onBlur={(e) => updateImage(im.id, 'tag', e.target.value)} />
                    <select className="tp-gsel" defaultValue={im.category} onChange={(e) => updateImage(im.id, 'category', e.target.value)}>
                      <option value="">— category —</option>
                      {filters.map((f) => <option key={f.id} value={f.cat}>{f.label || f.cat || 'Category'}</option>)}
                    </select>
                    {images.length > 1 && (
                      <button type="button" className="tp-gx" onClick={() => removeImage(im.id)} aria-label="Remove image">×</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {edit && images.length < 24 && (
            <button type="button" className="tp-gadd" onClick={addImage}>+ Add image</button>
          )}
        </div>
      </section>
    </>
  );
}

const GALLERY_OWN = `
.tp-sec-head h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
[data-surface="forest-d"] .tp-sec-head h2, [data-surface="forest"] .tp-sec-head h2 { color:var(--paper); }
.tp-gfilter{ display:flex; flex-wrap:wrap; gap:10px; margin-bottom:32px; justify-content:center; }
.tp-gfilter button{ font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-2); border:1px solid var(--line-2); border-radius:999px; padding:8px 15px; background:transparent; cursor:pointer; transition:all .15s ease; }
.tp-gfilter button.is-active{ background:var(--forest); border-color:var(--forest); color:var(--paper); }
.tp-ggrid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.tp-ggrid .tp-gitem .tp-ph{ aspect-ratio:1/1; border-radius:var(--r-lg); }
.tp-gitem{ cursor:zoom-in; position:relative; }
.tp-ghover{ position:absolute; inset:0; display:grid; place-items:center; opacity:0; transition:opacity .16s ease; }
.tp-ghover svg{ width:26px; height:26px; stroke:#fff; stroke-width:2; fill:none; }
.tp-gitem:hover .tp-ghover{ opacity:1; background:oklch(0.255 0.038 159 / 0.4); border-radius:var(--r-lg); }
@media (max-width:1040px){ .tp-ggrid{ grid-template-columns:repeat(3,1fr); } }
@media (max-width:760px){ .tp-ggrid{ grid-template-columns:repeat(2,1fr); } }
.tp-gctl{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin:-16px 0 28px; justify-content:center; }
.tp-gctl__f{ display:inline-flex; align-items:center; gap:4px; border:1px dashed var(--line-2); border-radius:var(--r); padding:4px 6px; }
.tp-gedit{ position:relative; z-index:3; display:flex; flex-direction:column; gap:6px; margin-top:8px; }
.tp-ginput{ width:100%; font-family:var(--font-mono); font-size:11px; padding:6px 8px; border:1px solid var(--line-2); border-radius:var(--r); background:var(--paper); color:var(--ink); }
.tp-gsel{ width:100%; font-family:var(--font-mono); font-size:11px; padding:6px 8px; border:1px solid var(--line-2); border-radius:var(--r); background:var(--paper); color:var(--ink); }
.tp-gx{ align-self:flex-start; background:transparent; border:1px solid var(--line-2); color:var(--ink-3); font-size:12px; padding:2px 8px; border-radius:var(--r); cursor:pointer; }
.tp-x { background:transparent; border:none; color:var(--ink-3); font-size:12px; cursor:pointer; }
.tp-add { background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:4px 8px; border-radius:var(--r); cursor:pointer; }
.tp-gadd{ display:block; margin:24px auto 0; border:1px dashed var(--line-2); border-radius:var(--r-lg); background:transparent; color:var(--ink-3); font-family:var(--font-body); font-size:14px; padding:12px 24px; cursor:pointer; }
.tp-gadd:hover{ border-color:var(--forest); color:var(--forest); }
`;

export const GALLERY_STYLES = SEC_HEAD_STYLES + PH_STYLES + GALLERY_OWN;

const STYLES = GALLERY_STYLES;
export { STYLES };
