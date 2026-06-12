'use client';

// src/modules/templates/lex/blocks/Hero/ProspectusHero.tsx
// Lex hero: annual-report cover — eyebrow, outsized serif display, editorial
// italic lede + actions in a ruled aside. Edit mode.
// Reference: Lex HTML .hero (512-610), hero markup (1693-1736).
//
// A3 — ornament discipline: the reference's 4-stat ledger has NO backing schema
// field, so we do NOT fabricate numbers. Instead the single optional `meta`
// field renders in the ledger's ruled-strip styling (truthful, user-editable).
// Lex's cover is text-led, so `hero_image` is intentionally not surfaced here.

import React from 'react';
import { useLexBlock } from '../../hooks/useLexBlock';
import { LexEditable } from '../../components/LexEditable';

interface ProspectusHeroContent {
  eyebrow: string;
  headline: string;
  lede: string;
  cta_text: string;
  secondary_cta_text: string;
  hero_image: string;
  meta: string;
}

interface ProspectusHeroProps {
  sectionId: string;
}

export default function ProspectusHero({ sectionId }: ProspectusHeroProps) {
  const { mode, blockContent, handleContentUpdate } = useLexBlock<ProspectusHeroContent>({
    sectionId,
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-hero" data-section-id={sectionId}>
        {(blockContent.eyebrow || mode === 'edit') && (
          <div className="lex-hero__eyebrow">
            <LexEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="eyebrow"
              value={blockContent.eyebrow}
              onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save"
              placeholder="Quarterly letter · Q1 MMXXVI"
            />
          </div>
        )}

        <div className="lex-hero__grid">
          <LexEditable
            as="h1"
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            value={blockContent.headline}
            onSave={(v) => handleContentUpdate('headline', v)}
            enterBehavior="save"
            className="lex-hero__display"
            placeholder="A century of <em>discretion</em>."
          />
          <aside className="lex-hero__aside">
            <LexEditable
              as="p"
              mode={mode}
              sectionId={sectionId}
              elementKey="lede"
              value={blockContent.lede}
              onSave={(v) => handleContentUpdate('lede', v)}
              multiline
              className="lex-hero__lede"
              placeholder="One editorial sentence introducing the firm on its own terms."
            />
            <div className="lex-hero__actions">
              <LexEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="cta_text"
                value={blockContent.cta_text}
                onSave={(v) => handleContentUpdate('cta_text', v)}
                enterBehavior="save"
                isButton
                className="lex-btn lex-btn--primary lex-btn--lg"
                placeholder="Request an introduction"
              />
              {(blockContent.secondary_cta_text || mode === 'edit') && (
                <LexEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="secondary_cta_text"
                  value={blockContent.secondary_cta_text}
                  onSave={(v) => handleContentUpdate('secondary_cta_text', v)}
                  enterBehavior="save"
                  isButton
                  className="lex-btn lex-btn--quiet"
                  placeholder="Read the letter"
                />
              )}
            </div>
          </aside>
        </div>

        {(blockContent.meta || mode === 'edit') && (
          <div className="lex-hero__ledger">
            <LexEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="meta"
              value={blockContent.meta}
              onSave={(v) => handleContentUpdate('meta', v)}
              enterBehavior="save"
              className="lex-hero__ledger-note"
              placeholder="In practice since 1914 · by introduction"
            />
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
  border: 1px solid transparent; cursor: pointer; text-decoration: none;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
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
