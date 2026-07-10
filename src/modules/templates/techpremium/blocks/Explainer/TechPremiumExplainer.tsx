'use client';

// src/modules/templates/techpremium/blocks/Explainer/TechPremiumExplainer.tsx
// TechPremium explainer: repeatable image+text rows that alternate side when `flip`.
// Edit mode. Surface paper-2. Consumes the product `rows` collection (ExplainerRows).
// Ported from naayom Home-page .explain rows. Reuses PH_STYLES for the photo block.

import React from 'react';
import { Check } from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { STYLES } from './styles';
import { ytEmbed } from './ytEmbed';

interface Bullet { id: string; text: string }
interface Row {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  video_url: string;
  flip: boolean;
  cta_text: string;
  cta_href: string;
  bullets: Bullet[];
}
interface Content { eyebrow: string; headline: string; lede: string; rows: Row[] }
interface Props { sectionId: string }
const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export default function TechPremiumExplainer({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } = useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const rows = blockContent.rows || [];

  const uploadImage = useEditStore((s) => (s as any).uploadImage) as
    | ((f: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>)
    | undefined;
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);
  const onRowImage = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadImage) return;
    setUploadingId(id);
    // Atomic store-target write into rows.<id>.image (+ auto-save); no stale closure.
    try { await uploadImage(file, { sectionId, elementKey: `rows.${id}.image` }); }
    catch (err) { /* surfaced by the store */ }
    finally { setUploadingId(null); }
  };

  const updateRow = (id: string, key: keyof Row, value: any) =>
    handleCollectionUpdate('rows', rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const addRow = () => {
    if (rows.length >= 4) return;
    handleCollectionUpdate('rows', [
      ...rows,
      { id: rid('row'), eyebrow: '', title: 'New section', body: 'Describe this part of the story.', image: '', video_url: '', flip: rows.length % 2 === 1, cta_text: '', cta_href: '#', bullets: [] },
    ]);
  };
  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    handleCollectionUpdate('rows', rows.filter((r) => r.id !== id));
  };

  const updateBullet = (rowId: string, bulletId: string, value: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    updateRow(rowId, 'bullets', (row.bullets || []).map((b) => (b.id === bulletId ? { ...b, text: value } : b)));
  };
  const addBullet = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const bullets = row.bullets || [];
    if (bullets.length >= 5) return;
    updateRow(rowId, 'bullets', [...bullets, { id: rid('b'), text: 'New point' }]);
  };
  const removeBullet = (rowId: string, bulletId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    updateRow(rowId, 'bullets', (row.bullets || []).filter((b) => b.id !== bulletId));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec" data-section-id={sectionId}>
        <div className="tp-sec__inner">
          {(blockContent.eyebrow || blockContent.headline || blockContent.lede || edit) && (
            <div className="tp-sec-head">
              {(blockContent.eyebrow || edit) && (
                <TechPremiumEditable as="span" className="tp-eyebrow" mode={mode} sectionId={sectionId} elementKey="eyebrow" value={blockContent.eyebrow} onSave={(v) => handleContentUpdate('eyebrow', v)} enterBehavior="save" placeholder="Eyebrow" />
              )}
              {(blockContent.headline || edit) && (
                <TechPremiumEditable as="h2" mode={mode} sectionId={sectionId} elementKey="headline" value={blockContent.headline} onSave={(v) => handleContentUpdate('headline', v)} enterBehavior="save" placeholder="Section headline" />
              )}
              {(blockContent.lede || edit) && (
                <TechPremiumEditable as="p" className="tp-lede" mode={mode} sectionId={sectionId} elementKey="lede" value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)} multiline placeholder="Optional one or two sentences." />
              )}
            </div>
          )}
          {rows.map((r) => {
            const bullets = r.bullets || [];
            const embed = ytEmbed(r.video_url);
            return (
              <div key={r.id} className={`tp-explain${r.flip ? ' flip' : ''}`}>
                <div className="tp-explain-media">
                  <div className="tp-ph">
                    {r.image
                      ? <img src={r.image} alt={r.title} />
                      : embed
                        ? <iframe className="tp-explain-video" src={embed} title={r.title || 'Video'} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        : <span className="tp-tag">{r.eyebrow || 'Photo / video'}</span>}
                  </div>
                  {edit && (
                    <div className="tp-explain-media-edit">
                      <label className="tp-explain-up">
                        {uploadingId === r.id ? 'Uploading…' : (r.image ? '⇄ Replace photo' : '↥ Upload photo')}
                        <input type="file" accept="image/*" hidden disabled={uploadingId === r.id} onChange={(e) => onRowImage(r.id, e)} />
                      </label>
                      <input value={r.image} onChange={(e) => updateRow(r.id, 'image', e.target.value)} placeholder="…or image URL (wins over video)" />
                      <input value={r.video_url} onChange={(e) => updateRow(r.id, 'video_url', e.target.value)} placeholder="YouTube URL" />
                    </div>
                  )}
                </div>
                <div className="tp-explain-copy">
                  {(r.eyebrow || edit) && (
                    <TechPremiumEditable
                      as="span" mode={mode} sectionId={sectionId} elementKey={`rows_eyebrow_${r.id}`}
                      value={r.eyebrow} onSave={(v) => updateRow(r.id, 'eyebrow', v)}
                      enterBehavior="save" className="tp-eyebrow" placeholder="Eyebrow"
                    />
                  )}
                  <TechPremiumEditable
                    as="h3" mode={mode} sectionId={sectionId} elementKey={`rows_title_${r.id}`}
                    value={r.title} onSave={(v) => updateRow(r.id, 'title', v)}
                    enterBehavior="save" className="tp-explain-h3" placeholder="Section title"
                  />
                  <TechPremiumEditable
                    as="p" mode={mode} sectionId={sectionId} elementKey={`rows_body_${r.id}`}
                    value={r.body} onSave={(v) => updateRow(r.id, 'body', v)}
                    multiline className="tp-explain-p" placeholder="Describe this part of the story."
                  />
                  {(bullets.length > 0 || edit) && (
                    <ul className="tp-explain-list">
                      {bullets.map((b) => (
                        <li key={b.id}>
                          <Check size={20} strokeWidth={2} />
                          <TechPremiumEditable
                            as="span" mode={mode} sectionId={sectionId} elementKey={`rows_${r.id}_bullets_text_${b.id}`}
                            value={b.text} onSave={(v) => updateBullet(r.id, b.id, v)}
                            enterBehavior="save" placeholder="Point"
                          />
                          {edit && <button type="button" className="tp-x" onClick={() => removeBullet(r.id, b.id)} aria-label="Remove point">×</button>}
                        </li>
                      ))}
                      {edit && bullets.length < 5 && (
                        <li><button type="button" className="tp-add" onClick={() => addBullet(r.id)}>+ point</button></li>
                      )}
                    </ul>
                  )}
                  {(r.cta_text || edit) && (
                    <a className="tp-btn2 line" href={edit ? undefined : (r.cta_href || '#')}>
                      <TechPremiumEditable
                        as="span" mode={mode} sectionId={sectionId} elementKey={`rows_cta_text_${r.id}`}
                        value={r.cta_text} onSave={(v) => updateRow(r.id, 'cta_text', v)}
                        enterBehavior="save" placeholder="Learn more"
                      />
                    </a>
                  )}
                  {edit && rows.length > 1 && (
                    <button type="button" className="tp-explain-remove" onClick={() => removeRow(r.id)} aria-label="Remove row">× Remove section</button>
                  )}
                </div>
              </div>
            );
          })}
          {edit && rows.length < 4 && (
            <button type="button" className="tp-explain-add" onClick={addRow}>+ Add section</button>
          )}
        </div>
      </section>
    </>
  );
}

