// src/modules/templates/lex/blocks/Testimonials/LetterOfReference.published.tsx
// Server-safe published variant of LetterOfReference (single letter).

import React from 'react';

interface LetterOfReferencePublishedProps {
  sectionId: string;
  eyebrow?: string;
  quote?: string;
  author_name?: string;
  author_role?: string;
  author_company?: string;
  author_photo?: string;
  meta?: string;
}

function initialsOf(name: string): string {
  const parts = (name || '').trim().split(/[\s.-]+/).filter(Boolean);
  if (!parts.length) return '';
  return parts.map((p) => p.charAt(0).toUpperCase()).join('.') + '.';
}

export default function LetterOfReferencePublished(props: LetterOfReferencePublishedProps) {
  const roleLine = [props.author_role, props.author_company].filter(Boolean).join(' · ');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-testi">
        {props.eyebrow && <div className="lex-testi__eyebrow">{props.eyebrow}</div>}
        <article className="lex-letter">
          <span className="lex-letter__ix">§</span>
          <div>
            <div className="lex-letter__quote" dangerouslySetInnerHTML={{ __html: props.quote || '' }} />
            <div className="lex-letter__signed">
              <div className="lex-letter__who">
                {props.author_photo && (
                  <div
                    className="lex-letter__avatar"
                    style={{ backgroundImage: `url(${props.author_photo})` }}
                  />
                )}
                <div className="lex-letter__who-text">
                  <b className="lex-letter__name">{props.author_name || ''}</b>
                  {roleLine && <span className="lex-letter__role">{roleLine}</span>}
                </div>
              </div>
              {props.author_name && (
                <span className="lex-letter__auth" aria-hidden="true">{initialsOf(props.author_name)}</span>
              )}
            </div>
          </div>
        </article>
        {props.meta && (
          <div className="lex-testi__meta" dangerouslySetInnerHTML={{ __html: props.meta }} />
        )}
      </section>
    </>
  );
}

const STYLES = `
.lex-testi {
  max-width: var(--max-w); margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
}
.lex-testi__eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500;
  border-top: 1px solid var(--ink); padding-top: 28px; margin-bottom: 36px;
}
.lex-letter {
  border-top: 1px solid var(--ink); border-bottom: 1px solid var(--rule);
  padding: 40px 0; display: grid; grid-template-columns: 80px 1fr; gap: 28px;
}
@media (max-width: 720px) { .lex-letter { grid-template-columns: 1fr; gap: 16px; } }
.lex-letter__ix {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 24px; color: var(--trust); line-height: 1; padding-top: 4px;
}
.lex-letter__quote {
  margin: 0; font-family: var(--font-display); font-weight: 400;
  font-size: 26px; line-height: 1.4; letter-spacing: -0.005em; color: var(--ink);
  text-wrap: pretty;
}
.lex-letter__quote em { font-style: italic; color: var(--trust); }
.lex-letter__signed {
  margin-top: 24px; display: grid; grid-template-columns: 1fr auto; gap: 24px;
  align-items: end; border-top: 1px solid var(--rule); padding-top: 18px;
}
.lex-letter__who { display: flex; align-items: center; gap: 14px; }
.lex-letter__avatar {
  width: 44px; height: 44px; border-radius: 2px; flex-shrink: 0;
  background-size: cover; background-position: center; border: 1px solid var(--rule-strong);
}
.lex-letter__who-text { display: flex; flex-direction: column; gap: 4px; }
.lex-letter__name { font-family: var(--font-display); font-weight: 500; font-size: 16px; color: var(--ink); }
.lex-letter__role {
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ink-3);
}
.lex-letter__auth {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 32px; color: var(--ink-2); line-height: 1;
}
.lex-testi__meta {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 13px; color: var(--ink-3); margin-top: 24px;
}
`;
