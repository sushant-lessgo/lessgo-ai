'use client';

// src/modules/templates/lex/blocks/CTA/EngravedInvitationCTA.tsx
// Lex closing CTA: an engraved invitation on the trust hue. Edit mode.
// Reference: Lex HTML .cta (932-1005), markup (1925-1944).
//
// A3 — the reference's contact-detail aside (addresses, phones) is contact data
// that belongs to the footer, with no CTA schema field, so it is NOT rendered
// here. The optional `meta` field renders as the closing caption. The block
// paints its own trust-hue ground (covers the wrapper surface).

import React from 'react';
import { useLexBlock } from '../../hooks/useLexBlock';
import { LexEditable } from '../../components/LexEditable';

interface EngravedInvitationCTAContent {
  eyebrow: string;
  headline: string;
  lede: string;
  cta_text: string;
  secondary_cta_text: string;
  meta: string;
}

interface EngravedInvitationCTAProps {
  sectionId: string;
}

export default function EngravedInvitationCTA({ sectionId }: EngravedInvitationCTAProps) {
  const { mode, blockContent, handleContentUpdate } = useLexBlock<EngravedInvitationCTAContent>({
    sectionId,
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-cta" data-section-id={sectionId}>
        <div className="lex-cta__inner">
          {(blockContent.eyebrow || mode === 'edit') && (
            <div className="lex-cta__eyebrow">
              <LexEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="eyebrow"
                value={blockContent.eyebrow}
                onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save"
                placeholder="An invitation to correspond"
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
            className="lex-cta__headline"
            placeholder="We accept new relationships <em>by introduction</em>."
          />
          <LexEditable
            as="p"
            mode={mode}
            sectionId={sectionId}
            elementKey="lede"
            value={blockContent.lede}
            onSave={(v) => handleContentUpdate('lede', v)}
            multiline
            className="lex-cta__lede"
            placeholder="A short, composed closing paragraph — the simplest first step."
          />
          <div className="lex-cta__actions">
            <LexEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="cta_text"
              value={blockContent.cta_text}
              onSave={(v) => handleContentUpdate('cta_text', v)}
              enterBehavior="save"
              isButton
              className="lex-btn lex-btn--accent lex-btn--lg"
              placeholder="Begin a correspondence"
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
                className="lex-btn lex-btn--ghost-light lex-btn--lg"
                placeholder="Speak with the desk"
              />
            )}
          </div>
          {(blockContent.meta || mode === 'edit') && (
            <LexEditable
              as="div"
              mode={mode}
              sectionId={sectionId}
              elementKey="meta"
              value={blockContent.meta}
              onSave={(v) => handleContentUpdate('meta', v)}
              enterBehavior="save"
              className="lex-cta__caption"
              placeholder="By post or telephone, at your convenience."
            />
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
  border: 1px solid transparent; cursor: pointer; text-decoration: none;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}
.lex-btn--lg { padding: 17px 28px; font-size: 15px; }
.lex-btn--accent { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.lex-btn--accent:hover { background: var(--accent-deep); border-color: var(--accent-deep); color: var(--trust-ink); }
.lex-btn--ghost-light {
  background: transparent; color: var(--trust-ink); border-color: oklch(1 0 0 / 0.32);
}
.lex-btn--ghost-light:hover { background: oklch(1 0 0 / 0.08); border-color: var(--trust-ink); }
`;
