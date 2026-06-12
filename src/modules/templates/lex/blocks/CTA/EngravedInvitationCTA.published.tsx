// src/modules/templates/lex/blocks/CTA/EngravedInvitationCTA.published.tsx
// Server-safe published variant of EngravedInvitationCTA.

import React from 'react';

interface EngravedInvitationCTAPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  secondary_cta_text?: string;
  meta?: string;
}

export default function EngravedInvitationCTAPublished(props: EngravedInvitationCTAPublishedProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-cta">
        <div className="lex-cta__inner">
          {props.eyebrow && (
            <div className="lex-cta__eyebrow"><span>{props.eyebrow}</span></div>
          )}
          <h2 className="lex-cta__headline" dangerouslySetInnerHTML={{ __html: props.headline || '' }} />
          {props.lede && (
            <p className="lex-cta__lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
          )}
          <div className="lex-cta__actions">
            {props.cta_text && (
              <a className="lex-btn lex-btn--accent lex-btn--lg" href="#cta">{props.cta_text}</a>
            )}
            {props.secondary_cta_text && (
              <a className="lex-btn lex-btn--ghost-light lex-btn--lg" href="#cta">{props.secondary_cta_text}</a>
            )}
          </div>
          {props.meta && (
            <div className="lex-cta__caption" dangerouslySetInnerHTML={{ __html: props.meta }} />
          )}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.lex-cta {
  padding: 144px var(--sec-pad-x);
  background: var(--trust); color: var(--trust-ink);
  border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink);
}
.lex-cta__inner { max-width: var(--max-w); margin: 0 auto; }
.lex-cta__eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.24em;
  text-transform: uppercase; color: var(--accent); font-weight: 500;
  display: inline-flex; align-items: center; gap: 14px;
  margin-bottom: 32px; padding-bottom: 18px;
  border-bottom: 1px solid oklch(1 0 0 / 0.18);
}
.lex-cta__eyebrow::before { content: ""; width: 32px; height: 1px; background: var(--accent); }
.lex-cta__headline {
  font-family: var(--font-display); font-weight: 500;
  font-size: clamp(48px, 6.4vw, 96px); line-height: 1.0; letter-spacing: -0.022em;
  margin: 0 0 36px; color: var(--trust-ink); text-wrap: balance; max-width: 18ch;
}
.lex-cta__headline em { font-style: italic; font-weight: 400; color: var(--accent); }
.lex-cta__lede {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 19px; line-height: 1.5; color: oklch(1 0 0 / 0.78);
  max-width: 50ch; margin: 0 0 36px;
}
.lex-cta__actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.lex-cta__caption {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 14px; color: oklch(1 0 0 / 0.6); margin-top: 28px;
}
.lex-btn {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--font-body); font-weight: 500; font-size: 14px;
  letter-spacing: 0.01em; border-radius: 2px; padding: 14px 22px;
  border: 1px solid transparent; text-decoration: none;
}
.lex-btn--lg { padding: 17px 28px; font-size: 15px; }
.lex-btn--accent { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.lex-btn--accent:hover { background: var(--accent-deep); border-color: var(--accent-deep); color: var(--trust-ink); }
.lex-btn--ghost-light {
  background: transparent; color: var(--trust-ink); border-color: oklch(1 0 0 / 0.32);
}
.lex-btn--ghost-light:hover { background: oklch(1 0 0 / 0.08); border-color: var(--trust-ink); }
`;
