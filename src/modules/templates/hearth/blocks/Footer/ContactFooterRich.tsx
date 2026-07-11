'use client';

// src/modules/service/blocks/Footer/ContactFooterRich.tsx
// Hearth footer: wordmark + contact info + social links. Edit mode.
// Reference: Hearth - Warm Service.html lines 1622-1658, .footer (681-748).

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { HearthEditable } from '../../components/HearthEditable';

interface SocialLink {
  id: string;
  platform: string;
  href: string;
}

interface ContactFooterRichContent {
  tagline: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  copyright: string;
  social_links: SocialLink[];
}

interface ContactFooterRichProps {
  sectionId: string;
}

export default function ContactFooterRich({ sectionId }: ContactFooterRichProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useServiceBlock<ContactFooterRichContent>({ sectionId });

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
      { id: `sl${Date.now()}`, platform: 'Instagram', href: '#' },
    ]);
  };

  const removeSocial = (id: string) => {
    handleCollectionUpdate(
      'social_links',
      socialLinks.filter((s) => s.id !== id)
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <footer className="hearth-footer" data-section-id={sectionId}>
        <div className="hearth-footer__top">
          <div className="hearth-footer__brand">
            <div className="hearth-footer__wordmark">studio</div>
            {(blockContent.tagline || mode === 'edit') && (
              <HearthEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey="tagline"
                value={blockContent.tagline}
                onSave={(v) => handleContentUpdate('tagline', v)}
                multiline
                className="hearth-footer__tagline"
                placeholder="A short studio tagline."
              />
            )}
          </div>

          <div className="hearth-footer__col">
            <h4>Contact</h4>
            <ul>
              <li>
                <HearthEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="contact_email"
                  value={blockContent.contact_email}
                  onSave={(v) => handleContentUpdate('contact_email', v)}
                  enterBehavior="save"
                  placeholder="hello@example.com"
                />
              </li>
              {(blockContent.contact_phone || mode === 'edit') && (
                <li>
                  <HearthEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="contact_phone"
                    value={blockContent.contact_phone}
                    onSave={(v) => handleContentUpdate('contact_phone', v)}
                    enterBehavior="save"
                    placeholder="(415) 555-0142"
                  />
                </li>
              )}
              {(blockContent.address || mode === 'edit') && (
                <li>
                  <HearthEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="address"
                    value={blockContent.address}
                    onSave={(v) => handleContentUpdate('address', v)}
                    multiline
                    placeholder="Brooklyn, NY"
                  />
                </li>
              )}
            </ul>
          </div>

          <div className="hearth-footer__col">
            <h4>Elsewhere</h4>
            <ul>
              {socialLinks.map((s) => (
                <li key={s.id}>
                  <HearthEditable
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
                    <>
                      <input
                        className="hearth-footer__social-url"
                        value={s.href || ''}
                        onChange={(e) => updateSocial(s.id, 'href', e.target.value)}
                        placeholder="https://…"
                      />
                      <button
                        type="button"
                        className="hearth-footer__social-remove"
                        onClick={() => removeSocial(s.id)}
                        aria-label="Remove link"
                      >
                        ×
                      </button>
                    </>
                  )}
                </li>
              ))}
              {mode === 'edit' && socialLinks.length < 6 && (
                <li>
                  <button type="button" className="hearth-footer__social-add" onClick={addSocial}>
                    + add link
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="hearth-footer__bottom">
          <HearthEditable
            as="div"
            mode={mode}
            sectionId={sectionId}
            elementKey="copyright"
            value={blockContent.copyright}
            onSave={(v) => handleContentUpdate('copyright', v)}
            enterBehavior="save"
            placeholder="© Studio"
          />
          <div className="hearth-footer__made">Made with care.</div>
        </div>
      </footer>
    </>
  );
}

const STYLES = `
.hearth-footer {
  max-width: var(--max-w); margin: 0 auto;
  padding: 96px var(--sec-pad-x) 40px;
  font-family: var(--font-body);
}
.hearth-footer__top {
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px;
  padding-bottom: 64px;
}
@media (max-width: 760px) { .hearth-footer__top { grid-template-columns: 1fr; gap: 32px; } }
.hearth-footer__wordmark {
  font-family: var(--font-display); font-weight: 500; font-size: 36px;
  color: var(--ink); letter-spacing: -0.01em;
}
.hearth-footer__tagline {
  font-family: var(--font-display); font-style: italic;
  font-size: 16px; color: var(--ink-2); line-height: 1.5;
  margin-top: 16px; max-width: 36ch;
}
.hearth-footer__col h4 {
  font-size: 12px; font-weight: 500; text-transform: uppercase;
  letter-spacing: 0.2em; color: var(--accent-deep);
  margin: 0 0 22px;
}
.hearth-footer__col ul { list-style: none; padding: 0; margin: 0; }
.hearth-footer__col ul li {
  font-size: 16px; color: var(--ink-2); padding: 6px 0;
  display: flex; align-items: center; gap: 8px;
}
.hearth-footer__col ul li:hover { color: var(--accent-deep); }
.hearth-footer__social-remove {
  background: transparent; border: none; color: var(--ink-3);
  font-size: 14px; cursor: pointer; line-height: 1;
}
.hearth-footer__social-url {
  width: 130px; padding: 3px 6px; border-radius: var(--r-sm);
  border: 1px solid var(--line); background: transparent;
  color: var(--ink-2); font-size: 12px; font-family: var(--font-body);
}
.hearth-footer__social-url::placeholder { color: var(--ink-3); }
.hearth-footer__social-add {
  background: transparent; border: 1px dashed var(--sand);
  color: var(--ink-2); padding: 4px 10px; border-radius: var(--r-sm);
  font-family: var(--font-body); font-size: 13px; cursor: pointer;
}
.hearth-footer__bottom {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 32px; border-top: 1px solid var(--line);
  font-size: 13.5px; color: var(--ink-3);
}
.hearth-footer__made { font-style: italic; font-family: var(--font-display); }
`;
