'use client';

// src/modules/templates/lex/blocks/Packages/FeeSchedule.tsx
// Lex packages: a ledger-style fee schedule table with a featured row. Edit mode.
// Reference: Lex HTML .fees-table (843-927), markup (1870-1918).
//
// A3 — renders the REAL `price_display` (ai_generated_needs_review). Column
// headers are static labels; the §-index is derived from row position; the
// "Most chosen" tag derives from is_featured. No fabricated figures.

import React from 'react';
import { useLexBlock } from '../../hooks/useLexBlock';
import { LexEditable } from '../../components/LexEditable';

interface PackageTier {
  id: string;
  name: string;
  price_display: string;
  timeline: string;
  features: string[];
  cta_text: string;
  is_featured: boolean;
}

interface FeeScheduleContent {
  eyebrow: string;
  headline: string;
  lede: string;
  packages: PackageTier[];
}

interface FeeScheduleProps {
  sectionId: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export default function FeeSchedule({ sectionId }: FeeScheduleProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useLexBlock<FeeScheduleContent>({ sectionId });

  const packages = blockContent.packages || [];

  const updateField = <K extends keyof PackageTier>(id: string, key: K, value: PackageTier[K]) => {
    handleCollectionUpdate(
      'packages',
      packages.map((p) => (p.id === id ? { ...p, [key]: value } : p))
    );
  };

  const addPackage = () => {
    if (packages.length >= 3) return;
    handleCollectionUpdate('packages', [
      ...packages,
      {
        id: `p${Date.now()}`,
        name: 'New engagement',
        price_display: '$0',
        timeline: 'per yr',
        features: ['Inclusion one', 'Inclusion two', 'Inclusion three', 'Inclusion four'],
        cta_text: 'Request the schedule',
        is_featured: false,
      },
    ]);
  };

  const removePackage = (id: string) => {
    if (packages.length <= 1) return;
    handleCollectionUpdate('packages', packages.filter((p) => p.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-fees" data-section-id={sectionId}>
        <header className="lex-sec-head">
          <div>
            {(blockContent.eyebrow || mode === 'edit') && (
              <div className="lex-sec-eyebrow">
                <LexEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="eyebrow"
                  value={blockContent.eyebrow}
                  onSave={(v) => handleContentUpdate('eyebrow', v)}
                  enterBehavior="save"
                  placeholder="Schedule of fees"
                />
              </div>
            )}
            <LexEditable
              as="h2"
              mode={mode}
              sectionId={sectionId}
              elementKey="headline"
              value={blockContent.headline}
              onSave={(v) => handleContentUpdate('headline', v)}
              enterBehavior="save"
              className="lex-sec-title"
              placeholder="Terms <em>of engagement</em>."
            />
          </div>
          {(blockContent.lede || mode === 'edit') && (
            <LexEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="lede"
              value={blockContent.lede}
              onSave={(v) => handleContentUpdate('lede', v)}
              multiline
              className="lex-sec-lede"
              placeholder="One sentence on how fees are quoted and reviewed."
            />
          )}
        </header>

        <div className="lex-fees__table">
          <div className="lex-fees__row lex-fees__row--head">
            <div className="lex-fees__ix">§</div>
            <div className="lex-fees__name">Engagement</div>
            <div className="lex-fees__scope">Scope</div>
            <div className="lex-fees__price">Annual fee</div>
          </div>

          {packages.map((p, idx) => {
            const featuresList = Array.isArray(p.features) ? p.features : [];
            return (
              <div key={p.id} className={`lex-fees__row${p.is_featured ? ' is-featured' : ''}`}>
                <span className="lex-fees__ix">{ROMAN[idx] || idx + 1}</span>
                <div className="lex-fees__name">
                  <LexEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`packages_name_${p.id}`}
                    value={p.name}
                    onSave={(v) => updateField(p.id, 'name', v)}
                    enterBehavior="save"
                    placeholder="Engagement name"
                  />
                  <span className="lex-fees__sub">{p.is_featured ? 'Most chosen' : 'Engagement'}</span>
                </div>
                <div className="lex-fees__scope">
                  <ul>
                    {featuresList.map((feat, fIdx) => (
                      <li key={`${p.id}-f-${fIdx}`}>
                        <LexEditable
                          as="span"
                          mode={mode}
                          sectionId={sectionId}
                          elementKey={`packages_feature_${p.id}_${fIdx}`}
                          value={feat}
                          onSave={(v) => {
                            const next = [...featuresList];
                            next[fIdx] = v;
                            updateField(p.id, 'features', next);
                          }}
                          enterBehavior="save"
                          placeholder="Inclusion"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lex-fees__price">
                  <LexEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`packages_price_${p.id}`}
                    value={p.price_display}
                    onSave={(v) => updateField(p.id, 'price_display', v)}
                    enterBehavior="save"
                    className="lex-fees__amt"
                    placeholder="$32,000"
                  />
                  <LexEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`packages_timeline_${p.id}`}
                    value={p.timeline}
                    onSave={(v) => updateField(p.id, 'timeline', v)}
                    enterBehavior="save"
                    className="lex-fees__per"
                    placeholder="per yr"
                  />
                  {mode === 'edit' && (
                    <div className="lex-fees__edit-actions">
                      <button
                        type="button"
                        onClick={() => updateField(p.id, 'is_featured', !p.is_featured)}
                        className="lex-fees__toggle"
                      >
                        {p.is_featured ? '★' : '☆'}
                      </button>
                      {packages.length > 1 && (
                        <button
                          type="button"
                          className="lex-fees__remove"
                          onClick={() => removePackage(p.id)}
                          aria-label="Remove engagement"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {mode === 'edit' && packages.length < 3 && (
          <button type="button" className="lex-fees__add" onClick={addPackage}>
            + Add engagement
          </button>
        )}
      </section>
    </>
  );
}

const STYLES = `
.lex-fees {
  padding: var(--sec-pad-y) var(--sec-pad-x);
  max-width: var(--max-w); margin: 0 auto;
}
.lex-sec-head {
  display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: end;
  margin-bottom: 64px; padding-bottom: 24px; border-bottom: 1px solid var(--ink);
}
@media (max-width: 900px) { .lex-sec-head { grid-template-columns: 1fr; gap: 32px; } }
.lex-sec-eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500; margin-bottom: 22px;
}
.lex-sec-title {
  font-family: var(--font-display); font-weight: 500;
  font-size: clamp(40px, 5.6vw, 72px); line-height: 1.0; letter-spacing: -0.022em;
  color: var(--ink); margin: 0; max-width: 16ch;
}
.lex-sec-title em { font-style: italic; font-weight: 400; color: var(--trust); }
.lex-sec-lede {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 19px; line-height: 1.5; color: var(--ink-2); max-width: 48ch; margin: 0;
}
.lex-fees__table {
  border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); background: var(--paper);
}
.lex-fees__row {
  display: grid; grid-template-columns: 60px 1.6fr 2.4fr 150px; gap: 32px;
  padding: 28px 0; border-bottom: 1px solid var(--rule); align-items: start;
}
.lex-fees__row:last-child { border-bottom: 0; }
.lex-fees__row--head {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500;
  padding: 12px 0; border-bottom: 1px solid var(--ink); align-items: baseline;
}
.lex-fees__row.is-featured { background: var(--paper-1); }
.lex-fees__row.is-featured .lex-fees__amt { color: var(--trust); }
.lex-fees__ix {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  color: var(--trust); font-size: 22px; line-height: 1; padding-left: 12px;
}
.lex-fees__row--head .lex-fees__ix { font-family: var(--font-mono); font-style: normal; color: var(--ink-3); font-size: 10px; }
.lex-fees__name {
  font-family: var(--font-display); font-weight: 500; font-size: 22px;
  letter-spacing: -0.01em; color: var(--ink);
}
.lex-fees__row--head .lex-fees__name { font-family: var(--font-mono); font-weight: 500; font-size: 10px; }
.lex-fees__sub {
  display: block; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-3); margin-top: 6px; font-weight: 500;
}
.lex-fees__scope ul { list-style: none; margin: 0; padding: 0; }
.lex-fees__scope li {
  font-family: var(--font-body); font-size: 14px; line-height: 1.55; color: var(--ink-2);
  padding: 3px 0 3px 16px; position: relative;
}
.lex-fees__scope li::before { content: "·"; position: absolute; left: 4px; color: var(--trust); }
.lex-fees__row--head .lex-fees__scope { font-family: var(--font-mono); font-size: 10px; color: var(--ink-3); }
.lex-fees__price {
  position: relative; text-align: right;
  display: flex; flex-direction: column; gap: 2px; align-items: flex-end; padding-right: 12px;
}
.lex-fees__row--head .lex-fees__price { font-family: var(--font-mono); font-size: 10px; color: var(--ink-3); }
.lex-fees__amt {
  font-family: var(--font-display); font-weight: 500; font-size: 28px; line-height: 1;
  letter-spacing: -0.015em; color: var(--ink); font-feature-settings: "lnum";
}
.lex-fees__per {
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500;
}
.lex-fees__edit-actions { display: flex; gap: 6px; margin-top: 8px; }
.lex-fees__toggle, .lex-fees__remove {
  background: var(--paper-2); border: 1px solid var(--rule); color: var(--ink-2);
  font-size: 11px; padding: 2px 8px; cursor: pointer; border-radius: 2px;
}
.lex-fees__add {
  margin-top: 24px; background: transparent; border: 1px dashed var(--rule-strong);
  color: var(--ink-2); font-family: var(--font-body); font-size: 14px;
  padding: 12px 18px; cursor: pointer; border-radius: 2px;
}
.lex-fees__add:hover { color: var(--trust); border-color: var(--trust); }
@media (max-width: 900px) {
  .lex-fees__row { grid-template-columns: 40px 1fr 110px; gap: 16px; }
  .lex-fees__scope { display: none; }
}
`;
