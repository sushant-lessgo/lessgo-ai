'use client';

// src/modules/templates/techpremium/blocks/Lineup/TechPremiumLineup.tsx
// TechPremium product lineup: section head + a grid of product cards (model, name,
// one-liner, spec, view-details link). Edit mode. Surface paper-2. Consumes the
// product `items` collection (ProductLineup). Reuses CARD_STYLES. Ported from naayom
// Home-page lineup; cards model TechPremiumCatalog's .tp-pcard rendering.

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { STYLES } from './styles';

interface Item {
  id: string; model: string; name: string; oneLiner: string;
  image: string; cardSpec: string; href: string;
}
interface Content { eyebrow: string; headline: string; lede: string; items: Item[] }
interface Props { sectionId: string }

export default function TechPremiumLineup({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate } =
    useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  // READ-ONLY: `items` are MATERIALIZED from products flagged "⭐ Feature on home"
  // (or first-N fallback) — see collectionHelpers.materializeHomeLineup. Curate on
  // the Product pages, not here. Only the section head stays editable.
  const items = blockContent.items || [];

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
                  {it.model && <span className="tp-pmodel">{it.model}</span>}
                  <h4 className="tp-ph4">{it.name}</h4>
                  {it.oneLiner && <p className="tp-pp">{it.oneLiner}</p>}
                  <div className="tp-pfoot">
                    {it.cardSpec ? <span className="tp-pspecs">{it.cardSpec}</span> : <span />}
                    <span className="tp-penq">View details →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {edit && (
            <p className="tp-managed-hint">Managed from your Products pages — flag <strong>⭐ Feature on home</strong> on a product. Shows up to 4.</p>
          )}
        </div>
      </section>
    </>
  );
}

