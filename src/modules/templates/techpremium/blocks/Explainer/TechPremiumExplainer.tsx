'use client';

// src/modules/templates/techpremium/blocks/Explainer/TechPremiumExplainer.tsx
// TechPremium explainer: repeatable image+text rows that alternate side when `flip`.
// Edit mode. Surface paper-2. Consumes the product `rows` collection (ExplainerRows).
// Ported from naayom Home-page .explain rows. Reuses PH_STYLES for the photo block.

import React from 'react';
import { Check } from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { SEC_HEAD_STYLES, PH_STYLES, BTN_STYLES } from '../shared/sharedStyles';

interface Bullet { id: string; text: string }
interface Row {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  flip: boolean;
  cta_text: string;
  cta_href: string;
  bullets: Bullet[];
}
interface Content { rows: Row[] }
interface Props { sectionId: string }
const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export default function TechPremiumExplainer({ sectionId }: Props) {
  const { mode, blockContent, handleCollectionUpdate } = useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const rows = blockContent.rows || [];

  const updateRow = (id: string, key: keyof Row, value: any) =>
    handleCollectionUpdate('rows', rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const addRow = () => {
    if (rows.length >= 4) return;
    handleCollectionUpdate('rows', [
      ...rows,
      { id: rid('row'), eyebrow: '', title: 'New section', body: 'Describe this part of the story.', image: '', flip: rows.length % 2 === 1, cta_text: '', cta_href: '#', bullets: [] },
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
          {rows.map((r) => {
            const bullets = r.bullets || [];
            return (
              <div key={r.id} className={`tp-explain${r.flip ? ' flip' : ''}`}>
                <div className="tp-explain-media">
                  <div className="tp-ph">
                    {r.image ? <img src={r.image} alt={r.title} /> : <span className="tp-tag">{r.eyebrow || 'Photo'}</span>}
                  </div>
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

export const EXPLAINER_STYLES = `
.tp-explain{ display:grid; grid-template-columns:1fr 1fr; gap:clamp(36px,5vw,72px); align-items:center; }
.tp-explain + .tp-explain{ margin-top:clamp(48px,6vw,88px); }
.tp-explain.flip .tp-explain-media{ order:2; }
.tp-explain-media{ position:relative; }
.tp-explain-media .tp-ph{ aspect-ratio:4/3; }
.tp-explain-copy h3.tp-explain-h3{ font-family:var(--font-display); font-weight:600; font-size:clamp(24px,3vw,34px); letter-spacing:-0.018em; line-height:1.15; color:var(--ink); margin:14px 0 14px; }
.tp-explain-copy p.tp-explain-p{ color:var(--ink-2); font-size:16px; line-height:1.65; margin:0 0 18px; max-width:46ch; }
.tp-explain-list{ list-style:none; padding:0; margin:0 0 22px; display:flex; flex-direction:column; gap:12px; }
.tp-explain-list li{ display:grid; grid-template-columns:auto 1fr auto; align-items:start; gap:12px; font-size:15px; color:var(--ink-2); }
.tp-explain-list li svg{ width:20px; height:20px; stroke:var(--lime-d); stroke-width:2; fill:none; margin-top:1px; }
.tp-explain-remove{ display:inline-flex; margin-top:8px; background:transparent; border:1px solid var(--line-2); border-radius:var(--r); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:6px 12px; cursor:pointer; }
.tp-explain-add{ display:block; width:100%; margin-top:clamp(48px,6vw,88px); border:1px dashed var(--line-2); border-radius:var(--r-lg); background:transparent; color:var(--ink-3); font-family:var(--font-body); font-size:14px; padding:18px; cursor:pointer; }
.tp-explain-add:hover{ border-color:var(--forest); color:var(--forest); }
.tp-x{ background:transparent; border:none; color:var(--ink-3); font-size:12px; cursor:pointer; }
.tp-add{ background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:4px 8px; border-radius:var(--r); cursor:pointer; }
@media (max-width:1040px){ .tp-explain, .tp-explain.flip{ grid-template-columns:1fr; gap:40px; } .tp-explain-media{ order:0 !important; } }
`;

const STYLES = SEC_HEAD_STYLES + PH_STYLES + BTN_STYLES + EXPLAINER_STYLES;
