'use client';

// Surge footer (edit): dark panel footer — wordmark (↗) + tagline + booking badge,
// contact column, social links column, bottom bar. Consumes the shared service
// footer contract.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { FOOTER_STYLES } from './styles';

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
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate, isExcluded } =
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
      { id: `sl${Date.now()}`, platform: 'LinkedIn', href: '#' },
    ]);
  };

  const removeSocial = (id: string) => {
    handleCollectionUpdate('social_links', socialLinks.filter((s) => s.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer className="sg-footer" data-section-id={sectionId}>
        <div className="sg-footer__top">
          <div className="sg-footer__brand">
            <div className="sg-footer__brand-row">
              <span className="sg-footer__mark" />
              <span>Studio</span>
            </div>
            {(blockContent.tagline || (mode === 'edit' && !isExcluded('tagline'))) && (
              <SurgeEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey="tagline"
                value={blockContent.tagline}
                onSave={(v) => handleContentUpdate('tagline', v)}
                multiline
                className="sg-footer__tagline"
                placeholder="A short line on what you do and the number you move."
              />
            )}
            <div className="sg-footer__badge"><span className="lv" />Booking now</div>
          </div>

          <div className="sg-footer__col">
            <h4>Contact</h4>
            <ul>
              <li>
                <SurgeEditable
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
              {(blockContent.contact_phone || (mode === 'edit' && !isExcluded('contact_phone'))) && (
                <li>
                  <SurgeEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="contact_phone"
                    value={blockContent.contact_phone}
                    onSave={(v) => handleContentUpdate('contact_phone', v)}
                    enterBehavior="save"
                    placeholder="+91 98220 41100"
                  />
                </li>
              )}
              {(blockContent.address || (mode === 'edit' && !isExcluded('address'))) && (
                <li>
                  <SurgeEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="address"
                    value={blockContent.address}
                    onSave={(v) => handleContentUpdate('address', v)}
                    multiline
                    placeholder="Baner, Pune"
                  />
                </li>
              )}
            </ul>
          </div>

          <div className="sg-footer__col">
            <h4>Elsewhere</h4>
            <ul>
              {socialLinks.map((s) => (
                <li key={s.id}>
                  <SurgeEditable
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
                      className="sg-footer__social-remove"
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
                  <button type="button" className="sg-footer__social-add" onClick={addSocial}>
                    + add link
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="sg-footer__col">
            <h4>Studio</h4>
            <ul>
              <li>About</li>
              <li>Work</li>
              <li>Clients</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>

        <div className="sg-footer__bottom">
          <SurgeEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="copyright"
            value={blockContent.copyright}
            onSave={(v) => handleContentUpdate('copyright', v)}
            enterBehavior="save"
            placeholder="© 2026 Studio"
          />
          <span>Built with Lessgo</span>
        </div>
      </footer>
    </>
  );
}
