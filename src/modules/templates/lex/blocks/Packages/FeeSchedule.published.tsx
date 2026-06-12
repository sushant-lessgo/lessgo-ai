// src/modules/templates/lex/blocks/Packages/FeeSchedule.published.tsx
// Server-safe published variant of FeeSchedule.

import React from 'react';

interface PackageTier {
  id?: string;
  name?: string;
  price_display?: string;
  timeline?: string;
  features?: string[];
  cta_text?: string;
  is_featured?: boolean;
}

interface FeeSchedulePublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  packages?: PackageTier[];
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export default function FeeSchedulePublished(props: FeeSchedulePublishedProps) {
  const packages = Array.isArray(props.packages) ? props.packages : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-fees">
        <header className="lex-sec-head">
          <div>
            {props.eyebrow && <div className="lex-sec-eyebrow">{props.eyebrow}</div>}
            <h2 className="lex-sec-title" dangerouslySetInnerHTML={{ __html: props.headline || '' }} />
          </div>
          {props.lede && <p className="lex-sec-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />}
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
              <div key={p.id || idx} className={`lex-fees__row${p.is_featured ? ' is-featured' : ''}`}>
                <span className="lex-fees__ix">{ROMAN[idx] || idx + 1}</span>
                <div className="lex-fees__name">
                  <span>{p.name || ''}</span>
                  <span className="lex-fees__sub">{p.is_featured ? 'Most chosen' : 'Engagement'}</span>
                </div>
                <div className="lex-fees__scope">
                  <ul>
                    {featuresList.map((feat, fIdx) => (
                      <li key={`${p.id || idx}-f-${fIdx}`}>{feat}</li>
                    ))}
                  </ul>
                </div>
                <div className="lex-fees__price">
                  <span className="lex-fees__amt">{p.price_display || ''}</span>
                  {p.timeline && <span className="lex-fees__per">{p.timeline}</span>}
                </div>
              </div>
            );
          })}
        </div>
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
  text-align: right; display: flex; flex-direction: column; gap: 2px;
  align-items: flex-end; padding-right: 12px;
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
@media (max-width: 900px) {
  .lex-fees__row { grid-template-columns: 40px 1fr 110px; gap: 16px; }
  .lex-fees__scope { display: none; }
}
`;
