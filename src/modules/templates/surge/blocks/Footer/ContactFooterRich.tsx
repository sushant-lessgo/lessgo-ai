'use client';

// Surge footer (edit): dark panel footer — wordmark (↗) + tagline + booking badge,
// contact column, social links column, bottom bar. Consumes the shared service
// footer contract.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { LinkTargetPopover } from '@/components/editor/LinkTargetPopover';
import { resolveDestination } from '@/utils/resolveCtaHref';
import { FOOTER_STYLES } from './styles';
import { DEFAULT_FOOTER_LINKS, type FooterLink } from './footerDefaults';
import { normalizeCopyrightYear } from '../../../shared/footerHygiene';

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

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
  whatsapp_number: string;
  whatsapp_label: string;
  whatsapp_prefill: string;
  links_heading: string;
  footer_links: FooterLink[];
  logo_image: string;
}

// Inline MessageCircle glyph (server-safe; matches Surge's inline-SVG style).
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

// Boundary note: kept local (NOT exported) — never import from a 'use client'
// file into the published renderer. The published variant inlines the same logic.
function buildWaHref(number?: string, prefill?: string): string {
  const wa = (number || '').replace(/[^0-9]/g, '');
  if (!wa) return '';
  return `https://wa.me/${wa}${prefill ? `?text=${encodeURIComponent(prefill)}` : ''}`;
}

interface ContactFooterRichProps {
  sectionId: string;
}

export default function ContactFooterRich({ sectionId }: ContactFooterRichProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate, isExcluded } =
    useServiceBlock<ContactFooterRichContent>({ sectionId });
  const edit = mode === 'edit';

  const sections = useEditStore((s) => s.sections);
  const pages = useEditStore((s) => s.pages);
  const sectionOptions = React.useMemo(() => buildSectionLinkOptions(sections || []), [sections]);
  const pageOptions = React.useMemo(() => buildPageLinkOptions(pages), [pages]);

  const uploadImage = useEditStore((s) => (s as any).uploadImage) as
    | ((file: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>)
    | undefined;
  const [logoUploading, setLogoUploading] = React.useState(false);
  const onLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadImage) return;
    setLogoUploading(true);
    try { await uploadImage(file, { sectionId, elementKey: 'logo_image' }); }
    catch (err) { /* surfaced by the store */ }
    finally { setLogoUploading(false); }
  };

  const socialLinks = blockContent.social_links || [];
  const waHref = buildWaHref(blockContent.whatsapp_number, blockContent.whatsapp_prefill);

  // Studio column: fall back to defaults when unconfigured so the footer stays 4-up.
  const storedLinks = blockContent.footer_links || [];
  const footerLinks: FooterLink[] = storedLinks.length ? storedLinks : DEFAULT_FOOTER_LINKS;

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

  // Footer nav links — edits write the working set back (materializing defaults on first edit).
  const setLinks = (next: FooterLink[]) => handleCollectionUpdate('footer_links', next);
  const patchLink = (id: string, p: Partial<FooterLink>) => setLinks(footerLinks.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const addLink = () => footerLinks.length < 6 && setLinks([...footerLinks, { id: rid('fl'), label: 'Link', href: '#' }]);
  const removeLink = (id: string) => setLinks(footerLinks.filter((l) => l.id !== id));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer className="sg-footer" data-section-id={sectionId}>
        <div className="sg-footer__top">
          <div className="sg-footer__brand">
            <div className="sg-footer__brand-row">
              {blockContent.logo_image ? (
                <img className="sg-footer__img" src={blockContent.logo_image} alt="Logo" loading="lazy" decoding="async" />
              ) : (
                <>
                  <span className="sg-footer__mark" />
                  <span>Studio</span>
                </>
              )}
              {edit && (
                <span className="sg-footer__logo-edit">
                  <label className="sg-footer__logo-edit-btn">
                    {logoUploading ? 'Uploading…' : (blockContent.logo_image ? 'Change logo' : '↥ Logo')}
                    <input type="file" accept="image/*" onChange={onLogoFile} hidden disabled={logoUploading} />
                  </label>
                  {blockContent.logo_image && (
                    <button type="button" className="sg-footer__logo-edit-x" onClick={() => handleContentUpdate('logo_image', '')}>remove</button>
                  )}
                </span>
              )}
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
                  {edit && (
                    <>
                      <input
                        className="sg-footer__link-url"
                        value={s.href || ''}
                        onChange={(e) => updateSocial(s.id, 'href', e.target.value)}
                        placeholder="https://…"
                      />
                      <button
                        type="button"
                        className="sg-footer__link-remove"
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
                  <button type="button" className="sg-footer__social-add" onClick={addSocial}>
                    + add link
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="sg-footer__col">
            <SurgeEditable
              as="h4"
              mode={mode}
              sectionId={sectionId}
              elementKey="links_heading"
              value={blockContent.links_heading}
              onSave={(v) => handleContentUpdate('links_heading', v)}
              enterBehavior="save"
              placeholder="Studio"
            />
            <ul>
              {footerLinks.map((l) => (
                <li key={l.id}>
                  <SurgeEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`footer_links_label_${l.id}`}
                    value={l.label}
                    onSave={(v) => patchLink(l.id, { label: v })}
                    enterBehavior="save"
                    placeholder="Link"
                  />
                  {edit && (
                    <>
                      <LinkTargetPopover
                        value={l.href}
                        sectionOptions={sectionOptions}
                        pageOptions={pageOptions}
                        onChange={(link) => patchLink(l.id, { href: resolveDestination(link.dest) })}
                        triggerClassName="sg-footer__link-cfg"
                      />
                      {footerLinks.length > 1 && (
                        <button type="button" className="sg-footer__link-remove" onClick={() => removeLink(l.id)} aria-label="Remove link">×</button>
                      )}
                    </>
                  )}
                </li>
              ))}
              {edit && footerLinks.length < 6 && (
                <li>
                  <button type="button" className="sg-footer__link-add" onClick={addLink}>+ link</button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="sg-footer__bottom">
          <SurgeEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="copyright"
            value={normalizeCopyrightYear(blockContent.copyright) ?? blockContent.copyright}
            onSave={(v) => handleContentUpdate('copyright', v)}
            enterBehavior="save"
            placeholder="© 2026 Studio"
          />
        </div>

        {mode === 'edit' && (
          <div className="sg-wa-edit">
            <strong>WhatsApp widget</strong>
            <input
              value={blockContent.whatsapp_number || ''}
              onChange={(e) => handleContentUpdate('whatsapp_number', e.target.value)}
              placeholder="Number e.g. 919999999999"
            />
            <input
              value={blockContent.whatsapp_label || ''}
              onChange={(e) => handleContentUpdate('whatsapp_label', e.target.value)}
              placeholder="Label (optional) e.g. Chat with us"
            />
            <input
              value={blockContent.whatsapp_prefill || ''}
              onChange={(e) => handleContentUpdate('whatsapp_prefill', e.target.value)}
              placeholder="Prefilled message (optional)"
            />
          </div>
        )}
      </footer>

      {waHref && (
        <a className="sg-wa-fab" href={waHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <WhatsAppIcon />
          {blockContent.whatsapp_label && <span className="sg-wa-label">{blockContent.whatsapp_label}</span>}
        </a>
      )}
    </>
  );
}
