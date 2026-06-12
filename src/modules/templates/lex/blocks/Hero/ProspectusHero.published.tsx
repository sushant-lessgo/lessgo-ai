// src/modules/templates/lex/blocks/Hero/ProspectusHero.published.tsx
// Server-safe published variant of ProspectusHero.

import React from 'react';

interface ProspectusHeroPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  secondary_cta_text?: string;
  hero_image?: string;
  meta?: string;
}

export default function ProspectusHeroPublished(props: ProspectusHeroPublishedProps) {
  const headline = props.headline || '';
  const lede = props.lede || '';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-hero">
        {props.eyebrow && (
          <div className="lex-hero__eyebrow">
            <span>{props.eyebrow}</span>
          </div>
        )}
        <div className="lex-hero__grid">
          <h1 className="lex-hero__display" dangerouslySetInnerHTML={{ __html: headline }} />
          <aside className="lex-hero__aside">
            <p className="lex-hero__lede" dangerouslySetInnerHTML={{ __html: lede }} />
            <div className="lex-hero__actions">
              {props.cta_text && (
                <a className="lex-btn lex-btn--primary lex-btn--lg" href="#cta">{props.cta_text}</a>
              )}
              {props.secondary_cta_text && (
                <a className="lex-btn lex-btn--quiet" href="#cta">{props.secondary_cta_text}</a>
              )}
            </div>
          </aside>
        </div>
        {props.meta && (
          <div className="lex-hero__ledger">
            <span className="lex-hero__ledger-note" dangerouslySetInnerHTML={{ __html: props.meta }} />
          </div>
        )}
      </section>
    </>
  );
}

const STYLES = `
.lex-hero {
  padding: 88px var(--sec-pad-x) 96px;
  background: var(--paper);
  border-bottom: 1px solid var(--rule);
  max-width: var(--max-w); margin: 0 auto;
}
.lex-hero__eyebrow {
  margin-bottom: 56px;
  font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--ink-2);
}
.lex-hero__grid {
  display: grid; grid-template-columns: 7fr 5fr; gap: 80px; align-items: end;
}
@media (max-width: 1100px) { .lex-hero__grid { grid-template-columns: 1fr; gap: 40px; } }
.lex-hero__display {
  font-family: var(--font-display); font-weight: 500;
  font-size: clamp(56px, 8.5vw, 128px);
  line-height: 0.96; letter-spacing: -0.025em;
  color: var(--ink); margin: 0; text-wrap: balance;
}
.lex-hero__display em { font-style: italic; font-weight: 400; color: var(--trust); }
.lex-hero__aside {
  border-left: 1px solid var(--rule); padding-left: 32px;
  display: flex; flex-direction: column; gap: 24px; padding-bottom: 8px;
}
@media (max-width: 1100px) {
  .lex-hero__aside { border-left: 0; padding-left: 0; border-top: 1px solid var(--rule); padding-top: 32px; }
}
.lex-hero__lede {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 21px; line-height: 1.5; color: var(--ink); max-width: 38ch; margin: 0;
}
.lex-hero__actions { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-top: 4px; }
.lex-hero__ledger {
  margin-top: 96px;
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--rule);
  padding: 28px 0 24px;
}
.lex-hero__ledger-note {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 16px; color: var(--ink-2);
}
.lex-btn {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--font-body); font-weight: 500; font-size: 14px;
  letter-spacing: 0.01em; border-radius: 2px; padding: 14px 22px;
  border: 1px solid transparent; text-decoration: none;
}
.lex-btn--lg { padding: 17px 28px; font-size: 15px; }
.lex-btn--primary { background: var(--trust); color: var(--trust-ink); border-color: var(--trust); }
.lex-btn--primary:hover { background: var(--trust-deep); border-color: var(--trust-deep); }
.lex-btn--quiet {
  border: 0; border-bottom: 1px solid var(--trust); border-radius: 0;
  padding: 14px 0 4px; color: var(--trust);
  font-style: italic; font-family: var(--font-display); font-weight: 400; font-size: 16px;
}
.lex-btn--quiet:hover { color: var(--trust-deep); }
`;
