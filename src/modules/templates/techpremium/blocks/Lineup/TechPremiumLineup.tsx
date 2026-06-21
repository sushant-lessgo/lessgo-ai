'use client';

// src/modules/templates/techpremium/blocks/Lineup/TechPremiumLineup.tsx
// TechPremium product lineup: section head + a grid of product cards (model, name,
// one-liner, spec, view-details link). Edit mode. Surface paper-2. Consumes the
// product `items` collection (ProductLineup). Reuses CARD_STYLES. Ported from naayom
// Home-page lineup; cards model TechPremiumCatalog's .tp-pcard rendering.

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { SEC_HEAD_STYLES, CARD_STYLES } from '../shared/sharedStyles';

interface Item {
  id: string; model: string; name: string; oneLiner: string;
  image: string; cardSpec: string; href: string;
}
interface Content { eyebrow: string; headline: string; lede: string; items: Item[] }
interface Props { sectionId: string }
const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export default function TechPremiumLineup({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const items = blockContent.items || [];

  const updateItem = (id: string, key: keyof Item, value: string) =>
    handleCollectionUpdate('items', items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  const addItem = () => {
    if (items.length >= 6) return;
    handleCollectionUpdate('items', [
      ...items,
      { id: rid('it'), model: '', name: 'New product', oneLiner: 'One line about this product.', image: '', cardSpec: '', href: '/products' },
    ]);
  };
  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    handleCollectionUpdate('items', items.filter((it) => it.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec" data-section-id={sectionId}>
        <div className="tp-sec__inner">
          <div className="tp-sec-head">
            {(blockContent.eyebrow || edit) && (
              <TechPremiumEditable
                as="span" mode={mode} sectionId={sectionId} elementKey="eyebrow"
                value={blockContent.eyebrow} onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save" className="tp-eyebrow" placeholder="Lineup"
              />
            )}
            <TechPremiumEditable
              as="h2" mode={mode} sectionId={sectionId} elementKey="headline"
              value={blockContent.headline} onSave={(v) => handleContentUpdate('headline', v)}
              enterBehavior="save" className="" placeholder="The product lineup"
            />
            {(blockContent.lede || edit) && (
              <TechPremiumEditable
                as="p" mode={mode} sectionId={sectionId} elementKey="lede"
                value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)}
                multiline className="tp-lede" placeholder="One or two sentences framing the lineup."
              />
            )}
          </div>

          <div className="tp-pcards">
            {items.map((it) => (
              <div key={it.id} className="tp-pcard tp-lineup-card">
                <div className="tp-pshot">
                  {it.image ? <img src={it.image} alt={it.name} /> : <span className="tp-pshot__ph">{it.model || 'Product photo'}</span>}
                </div>
                <div className="tp-pbody">
                  {(it.model || edit) && (
                    <TechPremiumEditable
                      as="span" mode={mode} sectionId={sectionId} elementKey={`items_model_${it.id}`}
                      value={it.model} onSave={(v) => updateItem(it.id, 'model', v)}
                      enterBehavior="save" className="tp-pmodel" placeholder="MODEL-01"
                    />
                  )}
                  <TechPremiumEditable
                    as="h4" mode={mode} sectionId={sectionId} elementKey={`items_name_${it.id}`}
                    value={it.name} onSave={(v) => updateItem(it.id, 'name', v)}
                    enterBehavior="save" className="tp-ph4" placeholder="Product name"
                  />
                  {(it.oneLiner || edit) && (
                    <TechPremiumEditable
                      as="p" mode={mode} sectionId={sectionId} elementKey={`items_oneLiner_${it.id}`}
                      value={it.oneLiner} onSave={(v) => updateItem(it.id, 'oneLiner', v)}
                      multiline className="tp-pp" placeholder="One line about this product."
                    />
                  )}
                  <div className="tp-pfoot">
                    {(it.cardSpec || edit) ? (
                      <TechPremiumEditable
                        as="span" mode={mode} sectionId={sectionId} elementKey={`items_cardSpec_${it.id}`}
                        value={it.cardSpec} onSave={(v) => updateItem(it.id, 'cardSpec', v)}
                        enterBehavior="save" className="tp-pspecs" placeholder="spec"
                      />
                    ) : <span />}
                    <span className="tp-penq">View details →</span>
                  </div>
                </div>
                {edit && items.length > 1 && (
                  <button type="button" className="tp-lineup-x" onClick={() => removeItem(it.id)} aria-label="Remove product">×</button>
                )}
              </div>
            ))}
            {edit && items.length < 6 && (
              <button type="button" className="tp-pcard tp-lineup-add" onClick={addItem}>+ Add product</button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export const LINEUP_STYLES = `
.tp-sec-head h2, .tp-sec-head .tp-sec-head__h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
.tp-lineup-card { position:relative; }
.tp-lineup-x { position:absolute; top:12px; right:12px; width:22px; height:22px; background:var(--paper); border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; z-index:2; }
.tp-lineup-add { border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-body); font-size:14px; cursor:pointer; align-items:center; justify-content:center; min-height:220px; box-shadow:none; transform:none; }
.tp-lineup-add:hover { color:var(--forest); border-color:var(--forest); transform:none; box-shadow:none; }
`;

const STYLES = SEC_HEAD_STYLES + CARD_STYLES + LINEUP_STYLES;
export { STYLES };
