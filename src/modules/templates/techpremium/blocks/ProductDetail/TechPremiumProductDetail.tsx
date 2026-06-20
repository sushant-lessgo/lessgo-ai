'use client';

// src/modules/templates/techpremium/blocks/ProductDetail/TechPremiumProductDetail.tsx
// TechPremium product detail (the Product entry record rendered in full). Edit mode.
// Breadcrumb → gallery (stage + thumbs, React-state nav) → info (model/name/lede/
// badges/actions/note) → features → specs → related strip. Ported from
// design_handoff_naayom Naayom - Product Detail.html. No pricing anywhere.

import React from 'react';
import { ChevronLeft, ChevronRight, Expand, Check, Upload } from 'lucide-react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { PD_STYLES } from './styles';

interface Img { id: string; src: string; tag: string }
interface Badge { id: string; label: string; tone: string }
interface Feature { id: string; text: string }
interface Spec { id: string; key: string; value: string }
interface RelatedCard { id: string; model: string; name: string; oneLiner: string; image: string; cardSpec: string; href: string }
interface Record_ {
  model: string; name: string; category: string; oneLiner: string; lede: string; cardSpec: string;
  enquireText: string; whatsappText: string; note: string;
  images: Img[]; badges: Badge[]; features: Feature[]; specs: Spec[]; related: RelatedCard[];
}

interface Props { sectionId: string }

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;

export default function TechPremiumProductDetail({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<Record_>({ sectionId });
  const uploadImage = (useEditStore() as any).uploadImage as
    | ((file: File, target?: { sectionId: string; elementKey: string }) => Promise<void>)
    | undefined;
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);

  const images = blockContent.images?.length ? blockContent.images : [{ id: 'i0', src: '', tag: '' }];
  const badges = blockContent.badges || [];
  const features = blockContent.features || [];
  const specs = blockContent.specs || [];
  const related = blockContent.related || [];

  const [active, setActive] = React.useState(0);
  const idx = Math.min(active, images.length - 1);
  const setImg = (key: keyof Img, id: string, v: string) =>
    handleCollectionUpdate('images', images.map((im) => (im.id === id ? { ...im, [key]: v } : im)));
  const addImg = () => handleCollectionUpdate('images', [...images, { id: rid('img'), src: '', tag: '' }]);
  const removeImg = (id: string) => images.length > 1 && handleCollectionUpdate('images', images.filter((im) => im.id !== id));
  // Real upload via the shared pipeline (Sharp→WebP→Blob). Bypass the ImageToolbar
  // target parser (it only handles 2 dot-parts); uploadImage→updateElementContent
  // handles the nested collection path `images.{id}.src` directly.
  const onUpload = async (id: string, file?: File | null) => {
    if (!file || typeof uploadImage !== 'function') return;
    setUploadingId(id);
    try {
      await uploadImage(file, { sectionId, elementKey: `images.${id}.src` });
    } finally {
      setUploadingId(null);
    }
  };

  const setFeat = (id: string, v: string) => handleCollectionUpdate('features', features.map((f) => (f.id === id ? { ...f, text: v } : f)));
  const addFeat = () => features.length < 8 && handleCollectionUpdate('features', [...features, { id: rid('f'), text: 'New capability' }]);
  const removeFeat = (id: string) => handleCollectionUpdate('features', features.filter((f) => f.id !== id));

  const setSpec = (id: string, k: keyof Spec, v: string) => handleCollectionUpdate('specs', specs.map((s) => (s.id === id ? { ...s, [k]: v } : s)));
  const addSpec = () => specs.length < 16 && handleCollectionUpdate('specs', [...specs, { id: rid('s'), key: 'Key', value: 'Value' }]);
  const removeSpec = (id: string) => handleCollectionUpdate('specs', specs.filter((s) => s.id !== id));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PD_STYLES }} />
      <section className="tp-pd" data-section-id={sectionId}>
        <div className="tp-pd__inner">
          <div className="tp-crumb">
            <span>Home</span> <span className="tp-sep">/</span> <span>Products</span> <span className="tp-sep">/</span> {blockContent.model || blockContent.name || 'Product'}
          </div>

          <div className="tp-pd-top">
            {/* gallery */}
            <div className="tp-pd-gallery">
              <div className="tp-pd-stage">
                {images.map((im, i) => (
                  <div key={im.id} className={`tp-pd-slide${i === idx ? ' is-active' : ''}`}>
                    {im.src ? <img src={im.src} alt={im.tag} /> : <span className="tp-pd-ph">{im.tag || `Image ${i + 1}`}</span>}
                  </div>
                ))}
                {images.length > 1 && (
                  <>
                    <button type="button" className="tp-pd-nav prev" onClick={() => setActive((idx - 1 + images.length) % images.length)} aria-label="Previous"><ChevronLeft size={18} /></button>
                    <button type="button" className="tp-pd-nav next" onClick={() => setActive((idx + 1) % images.length)} aria-label="Next"><ChevronRight size={18} /></button>
                  </>
                )}
                <span className="tp-pd-zoom" aria-hidden><Expand size={16} /></span>
                <span className="tp-pd-count"><span className="cur">{idx + 1}</span> / {images.length}</span>
              </div>
              {images.length > 1 && (
                <div className="tp-pd-thumbs">
                  {images.map((im, i) => (
                    <button key={im.id} type="button" className={`tp-pd-thumb${i === idx ? ' is-active' : ''}`} onClick={() => setActive(i)}>
                      {im.src ? <img src={im.src} alt="" /> : <span className="tp-pd-ph sm">{i + 1}</span>}
                    </button>
                  ))}
                </div>
              )}
              {mode === 'edit' && images[idx] && (
                <div className="tp-pd-imgedit">
                  <label className="tp-pd-upload">
                    <Upload size={14} />
                    <span>{uploadingId === images[idx].id ? 'Uploading…' : (images[idx].src ? 'Replace photo' : 'Upload photo')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => { onUpload(images[idx].id, e.target.files?.[0]); e.currentTarget.value = ''; }}
                    />
                  </label>
                  <input className="tp-pd-srcin" placeholder="Caption" value={images[idx]?.tag || ''} onChange={(e) => setImg('tag', images[idx].id, e.target.value)} />
                  <button type="button" onClick={addImg}>+ img</button>
                  {images.length > 1 && <button type="button" onClick={() => removeImg(images[idx].id)}>− img</button>}
                </div>
              )}
            </div>

            {/* info */}
            <div className="tp-pd-info">
              <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey="model" value={blockContent.model} onSave={(v) => handleContentUpdate('model', v)} enterBehavior="save" className="tp-pd-model" placeholder="NWC 2000" />
              <TechPremiumEditable as="h1" mode={mode} sectionId={sectionId} elementKey="name" value={blockContent.name} onSave={(v) => handleContentUpdate('name', v)} enterBehavior="save" className="tp-pd-h1" placeholder="Product name" />
              {(blockContent.lede || mode === 'edit') && (
                <TechPremiumEditable as="p" mode={mode} sectionId={sectionId} elementKey="lede" value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)} multiline className="lede tp-pd-lede" placeholder="A sentence or two introducing this product." />
              )}
              {badges.length > 0 && (
                <div className="tp-pd-meta">
                  {badges.map((b) => (
                    <span key={b.id} className={`tp-pill${b.tone === 'teal' ? ' teal' : ''}`}><span className="tp-dot" />{b.label}</span>
                  ))}
                </div>
              )}
              <div className="tp-pd-actions">
                <span className="tp-pd-btn lime">{blockContent.enquireText || 'Enquire'}</span>
                <span className="tp-pd-btn wa">{blockContent.whatsappText || 'Ask on WhatsApp'}</span>
              </div>
              {(blockContent.note || mode === 'edit') && (
                <TechPremiumEditable as="p" mode={mode} sectionId={sectionId} elementKey="note" value={blockContent.note} onSave={(v) => handleContentUpdate('note', v)} className="tp-pd-note" placeholder="Sales-led — no online pricing." />
              )}

              {/* features */}
              {(features.length > 0 || mode === 'edit') && (
                <div className="tp-pd-specs">
                  <h2>What it does</h2>
                  <ul className="tp-feat-list">
                    {features.map((f) => (
                      <li key={f.id}>
                        <Check size={20} />
                        <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`features_text_${f.id}`} value={f.text} onSave={(v) => setFeat(f.id, v)} multiline placeholder="Describe a capability" />
                        {mode === 'edit' && <button type="button" className="tp-mini-x" onClick={() => removeFeat(f.id)} aria-label="Remove">×</button>}
                      </li>
                    ))}
                  </ul>
                  {mode === 'edit' && features.length < 8 && <button type="button" className="tp-pd-add" onClick={addFeat}>+ Add feature</button>}
                </div>
              )}

              {/* specs */}
              {(specs.length > 0 || mode === 'edit') && (
                <div className="tp-pd-specs">
                  <h2>Specifications</h2>
                  <div className="tp-spec-list">
                    {specs.map((s) => (
                      <div key={s.id} className="tp-spec-row">
                        <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`specs_key_${s.id}`} value={s.key} onSave={(v) => setSpec(s.id, 'key', v)} enterBehavior="save" className="tp-spec-k" placeholder="Key" />
                        <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`specs_value_${s.id}`} value={s.value} onSave={(v) => setSpec(s.id, 'value', v)} enterBehavior="save" className="tp-spec-v" placeholder="Value" />
                        {mode === 'edit' && <button type="button" className="tp-mini-x" onClick={() => removeSpec(s.id)} aria-label="Remove">×</button>}
                      </div>
                    ))}
                  </div>
                  {mode === 'edit' && specs.length < 16 && <button type="button" className="tp-pd-add" onClick={addSpec}>+ Add spec</button>}
                </div>
              )}
            </div>
          </div>

          {/* related strip */}
          {related.length > 0 && (
            <div className="tp-pd-related">
              <div className="tp-related-head">
                <h2>Related <em>products</em></h2>
              </div>
              <div className="tp-pcards">
                {related.map((r) => {
                  const Wrapper: any = mode === 'edit' ? 'div' : 'a';
                  const wprops = mode === 'edit' ? {} : { href: r.href };
                  return (
                    <Wrapper key={r.id} className="tp-pcard" {...wprops}>
                      <div className="tp-pshot">{r.image ? <img src={r.image} alt={r.name} /> : <span className="tp-pshot__ph">{r.model || 'Product'}</span>}</div>
                      <div className="tp-pbody">
                        {r.model && <span className="tp-pmodel">{r.model}</span>}
                        <h4 className="tp-ph4">{r.name}</h4>
                        {r.oneLiner && <p className="tp-pp">{r.oneLiner}</p>}
                        <div className="tp-pfoot">{r.cardSpec ? <span className="tp-pspecs">{r.cardSpec}</span> : <span />}<span className="tp-penq">View details →</span></div>
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
