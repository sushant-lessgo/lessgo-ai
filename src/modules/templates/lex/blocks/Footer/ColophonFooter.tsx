'use client';

// src/modules/templates/lex/blocks/Footer/ColophonFooter.tsx
// Lex footer: masthead-style colophon — tagline + contact block + links row.
// Edit mode. Reference: Lex HTML .footer (1010-1096), markup (1946-1980).
//
// A3 — the reference's giant wordmark colophon needs a brand-name field the
// footer schema does not have, so it is not rendered (no fabricated wordmark).
// The "Set in …" line is a truthful static note about the template's type.

import React from 'react';
import { useLexBlock } from '../../hooks/useLexBlock';
import { LexEditable } from '../../components/LexEditable';

interface SocialLink {
  id: string;
  platform: string;
  href: string;
}

interface ColophonFooterContent {
  tagline: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  copyright: string;
  social_links: SocialLink[];
}

interface ColophonFooterProps {
  sectionId: string;
}

export default function ColophonFooter({ sectionId }: ColophonFooterProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useLexBlock<ColophonFooterContent>({ sectionId });

  const socialLinks = blockContent.social_links || [];

  const updateSocial = (id: string, key: keyof SocialLink, value: string) => {
    handleCollectionUpdate(
      'social_links',
      socialLinks.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  };

  const addSocial = () => {
    if (socialLinks.length >= 6) return;
    handleCollectionUpdate('social_links', [
      ...socialLinks,
      { id: `sl${Date.now()}`, platform: 'LinkedIn', href: '#' },
    ]);
  };

  const removeSocial = (id: string) => {
    handleCollectionUpdate('social_links', socialLinks.filter((s) => s.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <footer className="lex-footer" data-section-id={sectionId}>
        <div className="lex-footer__top">
          <div className="lex-footer__brand">
            {(blockContent.tagline || mode === 'edit') && (
              <LexEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey="tagline"
                value={blockContent.tagline}
                onSave={(v) => handleContentUpdate('tagline', v)}
                multiline
                className="lex-footer__tagline"
                placeholder="A fiduciary, trust, and advisory office. By introduction."
              />
            )}
            <div className="lex-footer__addr">
              <LexEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey="contact_email"
                value={blockContent.contact_email}
                onSave={(v) => handleContentUpdate('contact_email', v)}
                enterBehavior="save"
                placeholder="hello@example.com"
              />
              {(blockContent.contact_phone || mode === 'edit') && (
                <LexEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="contact_phone"
                  value={blockContent.contact_phone}
                  onSave={(v) => handleContentUpdate('contact_phone', v)}
                  enterBehavior="save"
                  placeholder="+44 20 7930 0900"
                />
              )}
              {(blockContent.address || mode === 'edit') && (
                <LexEditable
                  as="div"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="address"
                  value={blockContent.address}
                  onSave={(v) => handleContentUpdate('address', v)}
                  multiline
                  placeholder="1 Whitehall Mews · London SW1A 1AA"
                />
              )}
            </div>
          </div>

          <div className="lex-footer__col">
            <h4>Elsewhere</h4>
            <ul>
              {socialLinks.map((s) => (
                <li key={s.id}>
                  <LexEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`social_platform_${s.id}`}
                    value={s.platform}
                    onSave={(v) => updateSocial(s.id, 'platform', v)}
                    enterBehavior="save"
                    placeholder="Platform"
                  />
                  {mode === 'edit' && (
                    <button
                      type="button"
                      className="lex-footer__social-remove"
                      onClick={() => removeSocial(s.id)}
                      aria-label="Remove link"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
              {mode === 'edit' && socialLinks.length < 6 && (
                <li>
                  <button type="button" className="lex-footer__social-add" onClick={addSocial}>
                    + add link
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="lex-footer__bottom">
          <LexEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="copyright"
            value={blockContent.copyright}
            onSave={(v) => handleContentUpdate('copyright', v)}
            enterBehavior="save"
            placeholder="© Firm"
          />
          <span className="lex-footer__set">Set in Source Serif 4 &amp; Inter Tight</span>
        </div>
      </footer>
    </>
  );
}

const STYLES = `
.lex-footer {
  background: var(--paper); border-top: 1px solid var(--ink);
  font-family: var(--font-body);
}
.lex-footer__top {
  padding: 64px var(--sec-pad-x) 56px;
  display: grid; grid-template-columns: 1.6fr 1fr; gap: 48px;
  border-bottom: 1px solid var(--rule);
}
@media (max-width: 760px) { .lex-footer__top { grid-template-columns: 1fr; gap: 32px; } }
.lex-footer__brand { display: flex; flex-direction: column; gap: 16px; }
.lex-footer__tagline {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 20px; line-height: 1.5; color: var(--ink-2); max-width: 36ch; margin: 0;
}
.lex-footer__addr {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em;
  color: var(--ink-3); line-height: 1.9; margin-top: 8px;
}
.lex-footer__col h4 {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500;
  margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--rule);
}
.lex-footer__col ul { list-style: none; margin: 0; padding: 0; }
.lex-footer__col ul li {
  font-family: var(--font-display); font-weight: 400; font-size: 16px;
  padding: 6px 0; color: var(--ink-2); display: flex; align-items: center; gap: 8px;
}
.lex-footer__col ul li:hover { color: var(--trust); }
.lex-footer__social-remove {
  background: transparent; border: none; color: var(--ink-3);
  font-size: 14px; cursor: pointer; line-height: 1;
}
.lex-footer__social-add {
  background: transparent; border: 1px dashed var(--rule-strong);
  color: var(--ink-2); padding: 4px 10px; border-radius: 2px;
  font-family: var(--font-body); font-size: 13px; cursor: pointer;
}
.lex-footer__bottom {
  padding: 24px var(--sec-pad-x);
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-3); flex-wrap: wrap;
}
.lex-footer__set {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 13px; letter-spacing: 0; text-transform: none; color: var(--ink-2);
}
`;
