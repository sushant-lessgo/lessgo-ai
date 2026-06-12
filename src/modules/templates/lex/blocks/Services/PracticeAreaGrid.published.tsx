// src/modules/templates/lex/blocks/Services/PracticeAreaGrid.published.tsx
// Server-safe published variant of PracticeAreaGrid.

import React from 'react';

interface ServiceCard {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  cta_text?: string;
}

interface PracticeAreaGridPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  services?: ServiceCard[];
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export default function PracticeAreaGridPublished(props: PracticeAreaGridPublishedProps) {
  const services = Array.isArray(props.services) ? props.services : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-practice-sec">
        <header className="lex-sec-head">
          <div>
            {props.eyebrow && <div className="lex-sec-eyebrow">{props.eyebrow}</div>}
            <h2 className="lex-sec-title" dangerouslySetInnerHTML={{ __html: props.headline || '' }} />
          </div>
          {props.lede && (
            <p className="lex-sec-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
          )}
        </header>
        <div className="lex-practice">
          {services.map((s, idx) => (
            <div key={s.id || idx} className="lex-practice__item">
              <span className="lex-practice__ix">§ {ROMAN[idx] || idx + 1}</span>
              <h3 className="lex-practice__title" dangerouslySetInnerHTML={{ __html: s.title || '' }} />
              <p className="lex-practice__desc" dangerouslySetInnerHTML={{ __html: s.description || '' }} />
              {s.cta_text && <span className="lex-practice__more">{s.cta_text}</span>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.lex-practice-sec {
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
.lex-practice {
  display: grid; grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--rule); border-left: 1px solid var(--rule);
}
@media (max-width: 900px) { .lex-practice { grid-template-columns: 1fr; } }
.lex-practice__item {
  border-right: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
  padding: 36px 32px 32px; background: var(--paper);
  display: flex; flex-direction: column; min-height: 320px;
}
.lex-practice__ix {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500;
  margin-bottom: 28px; display: flex; align-items: center; gap: 10px;
}
.lex-practice__ix::before { content: ""; width: 6px; height: 6px; background: var(--trust); border-radius: 50%; }
.lex-practice__title {
  font-family: var(--font-display); font-weight: 500; font-size: 28px;
  line-height: 1.05; letter-spacing: -0.015em; margin: 0 0 14px; color: var(--ink);
}
.lex-practice__title em { font-style: italic; font-weight: 400; color: var(--trust); }
.lex-practice__desc {
  font-family: var(--font-body); font-size: 15px; line-height: 1.55;
  color: var(--ink-2); margin: 0 0 24px; flex: 1;
}
.lex-practice__more {
  font-family: var(--font-display); font-style: italic; font-weight: 400; font-size: 15px;
  color: var(--trust); border-bottom: 1px solid var(--trust); padding-bottom: 4px;
  align-self: flex-start;
}
`;
