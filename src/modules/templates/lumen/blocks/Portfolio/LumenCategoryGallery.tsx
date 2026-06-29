'use client';

// Lumen portfolio (edit). Category covers grouped (Commercial / Personal), each
// opening a lightbox on the PUBLISHED page (lumen.v1.js). Edit mode: manage
// covers — editable name/index_label/fig, upload cover photo, bulk-upload gallery
// photos into images[], add/remove categories. Consumes LumenCategoryGallery.

import React from 'react';
import { useLumenBlock } from '../../hooks/useLumenBlock';
import { LumenEditable } from '../../components/LumenEditable';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { PORTFOLIO_STYLES } from './styles';

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

interface Img { id: string; src?: string; }
interface Category {
  id: string; group?: string; group_nl?: string; name?: string; name_nl?: string;
  index_label?: string; index_label_nl?: string; ratio?: string; fig?: string;
  cover_image?: string; images?: Img[];
}
interface Content { eyebrow: string; eyebrow_nl: string; headline: string; headline_nl: string; lede: string; lede_nl: string; categories: Category[]; }

export default function LumenCategoryGallery({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, editLang, handleContentUpdate, handleCollectionUpdate } =
    useLumenBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const cats = blockContent.categories || [];
  const store = useEditStore() as any;
  const uploadImage = store.uploadImage as ((f: File) => Promise<string | void>) | undefined;

  const patchCat = (id: string, p: Partial<Category>) =>
    handleCollectionUpdate('categories', cats.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const addCat = () => handleCollectionUpdate('categories', [...cats, { id: rid('cat'), group: 'Commercial', name: 'New category', ratio: 'land', fig: '', images: [] }]);
  const removeCat = (id: string) => handleCollectionUpdate('categories', cats.filter((c) => c.id !== id));

  const onCover = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !uploadImage) return;
    const url = await uploadImage(file);
    if (typeof url === 'string' && url) patchCat(id, { cover_image: url });
  };
  const onPhotos = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); e.target.value = '';
    if (!files.length || !uploadImage) return;
    const cat = cats.find((c) => c.id === id); if (!cat) return;
    const added: Img[] = [];
    for (const f of files.slice(0, 24)) {
      try { const url = await uploadImage(f); if (typeof url === 'string' && url) added.push({ id: rid('im'), src: url }); } catch { /* skip */ }
    }
    if (added.length) patchCat(id, { images: [...(cat.images || []), ...added] });
    try { await store.save?.(); } catch { /* autosave retries */ }
  };

  // Preserve first-seen group order.
  const groups: string[] = [];
  cats.forEach((c) => { const g = c.group || 'Work'; if (!groups.includes(g)) groups.push(g); });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PORTFOLIO_STYLES }} />
      <section className="lm-pf" data-section-id={sectionId} id="work">
        <div className="lm-pf-in">
          <div className="lm-sec-head">
            <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="eyebrow" onSave={handleContentUpdate}
              enterBehavior="save" className="lm-eyebrow" placeholder="Selected work" />
            <LumenEditable as="h2" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="headline" onSave={handleContentUpdate}
              placeholder="The portfolio, by category." />
            <LumenEditable as="p" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="lede" onSave={handleContentUpdate}
              multiline className="lm-lede" placeholder="Click any category to open the gallery." />
          </div>

          {groups.map((g) => {
            const groupCats = cats.filter((c) => (c.group || 'Work') === g);
            const first = groupCats[0];
            const ratioClass = first?.ratio === 'port' ? 'port' : 'land';
            return (
              <div className="lm-pf-group" key={g}>
                <div className="lm-sec-rule">
                  <h2>{g}</h2>
                  {first && (
                    <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                      content={first} elementKey="index_label" onSave={(k, v) => patchCat(first.id, { [k]: v })}
                      enterBehavior="save" className="idx" placeholder="01 — Landscape 3:2" />
                  )}
                </div>
                <div className={`lm-pf-cards ${ratioClass}`}>
                  {groupCats.map((c) => (
                    <div key={c.id} className="lm-pf-card-edit">
                      <div className={`lm-ph lm-shot ${c.ratio === 'port' ? 'port' : 'land'}`}>
                        {c.cover_image ? <img src={c.cover_image} alt={c.name || ''} /> : <span className="lm-ph__tag">{(c.name || 'Category')} — cover</span>}
                      </div>
                      <div className="lm-fig">
                        <span className="n">{`Fig. ${c.fig || '—'}`}</span>
                        <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                          content={c} elementKey="name" onSave={(k, v) => patchCat(c.id, { [k]: v })}
                          enterBehavior="save" placeholder="Category" />
                        <span className="ratio">{c.ratio === 'port' ? '4:5' : '3:2'} · {(c.images || []).length}</span>
                      </div>
                      {edit && (
                        <div className="lm-pf-edit">
                          <label className="lm-pf-edit__btn">{c.cover_image ? 'Change cover' : '↥ Cover'}
                            <input type="file" accept="image/*" hidden onChange={(e) => onCover(c.id, e)} /></label>
                          <label className="lm-pf-edit__btn">+ Photos
                            <input type="file" accept="image/*" multiple hidden onChange={(e) => onPhotos(c.id, e)} /></label>
                          <button type="button" className="lm-pf-edit__btn" onClick={() => removeCat(c.id)}>remove</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {edit && (
            <button type="button" className="lm-pf-add" onClick={addCat}>+ Add category</button>
          )}
        </div>
      </section>
    </>
  );
}
