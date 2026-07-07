'use client';

// src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx
// TechPremium footer (Phase 4) on the dark forest-d surface: brand blurb +
// click-to-action contact + socials, nested link columns, legal row, newsletter,
// and the floating WhatsApp FAB (shared chrome → appears on every page). Edit mode.

import React from 'react';
import { Facebook, Linkedin, Youtube, MessageCircle } from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { LinkTargetPopover } from '../../components/LinkTargetPopover';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { FOOTER_STYLES } from './footerStyles';

interface FooterLink { id: string; label: string; href: string }
interface FooterColumn { id: string; heading: string; links: FooterLink[] }
interface Social { id: string; icon: string; url: string }
interface TechPremiumFooterContent {
  wordmark: string; logo_image: string; tag: string; blurb: string;
  contact_address: string; contact_tel: string; contact_email: string;
  newsletter_placeholder: string; newsletter_cta: string;
  copyright: string; location: string;
  whatsapp_number: string; whatsapp_prefill: string; whatsapp_label: string;
  footer_columns: FooterColumn[]; socials: Social[]; legal_links: FooterLink[];
}
interface Props { sectionId: string }

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;
const SOCIAL_ICON: Record<string, React.ComponentType<any>> = { Facebook, Linkedin, Youtube, MessageCircle };

export default function TechPremiumFooter({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumFooterContent>({ sectionId });
  const edit = mode === 'edit';

  const { content, addForm, deleteForm, getFormById, setSection, sections, pages } = useEditStore();
  const uploadImage = (useEditStore() as any).uploadImage as
    | ((file: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>)
    | undefined;
  const sectionOptions = React.useMemo(() => buildSectionLinkOptions(sections || []), [sections]);
  const pageOptions = React.useMemo(() => buildPageLinkOptions(pages), [pages]);

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
  const newsletterFormId: string | undefined = content?.[sectionId]?.elementMetadata?.newsletter_cta?.buttonConfig?.formId;
  const isNewsletterConnected = !!(newsletterFormId && getFormById?.(newsletterFormId));

  const setupNewsletter = () => {
    const formId = addForm({
      name: 'Newsletter',
      fields: [{ id: 'email', type: 'email', label: 'Email', placeholder: blockContent.newsletter_placeholder || 'you@company.com', required: true }],
      submitButtonText: blockContent.newsletter_cta || 'Subscribe',
      successMessage: 'Thanks for subscribing!',
      integrations: [{ id: `int-${Date.now()}`, type: 'dashboard', name: 'Dashboard', enabled: true }],
    } as any);
    const prevMeta = content?.[sectionId]?.elementMetadata || {};
    setSection(sectionId, { elementMetadata: { ...prevMeta, newsletter_cta: { buttonConfig: { type: 'form', formId } } } });
  };
  const removeNewsletter = () => { if (newsletterFormId) deleteForm(newsletterFormId); };

  const columns = blockContent.footer_columns || [];
  const setColumns = (next: FooterColumn[]) => handleCollectionUpdate('footer_columns', next);
  const patchCol = (id: string, p: Partial<FooterColumn>) => setColumns(columns.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const addColumn = () => columns.length < 5 && setColumns([...columns, { id: rid('col'), heading: 'Column', links: [{ id: rid('ln'), label: 'Link', href: '#' }] }]);
  const removeColumn = (id: string) => columns.length > 1 && setColumns(columns.filter((c) => c.id !== id));
  const patchLink = (colId: string, i: number, p: Partial<FooterLink>) => patchCol(colId, { links: (columns.find((c) => c.id === colId)?.links || []).map((l, k) => (k === i ? { ...l, ...p } : l)) });
  const addLink = (colId: string) => { const c = columns.find((x) => x.id === colId); if (c && (c.links || []).length < 6) patchCol(colId, { links: [...(c.links || []), { id: rid('ln'), label: 'Link', href: '#' }] }); };
  const removeLink = (colId: string, i: number) => patchCol(colId, { links: (columns.find((c) => c.id === colId)?.links || []).filter((_, k) => k !== i) });

  const socials = blockContent.socials || [];
  const setSocials = (next: Social[]) => handleCollectionUpdate('socials', next);
  const legal = blockContent.legal_links || [];
  const setLegal = (next: FooterLink[]) => handleCollectionUpdate('legal_links', next);

  const wa = (blockContent.whatsapp_number || '').replace(/[^0-9]/g, '');
  const waHref = wa ? `https://wa.me/${wa}${blockContent.whatsapp_prefill ? `?text=${encodeURIComponent(blockContent.whatsapp_prefill)}` : ''}` : '';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES + EDIT_EXTRA }} />
      <footer className="tp-footer" data-section-id={sectionId}>
        <div className="tp-footer__top">
          <div className="tp-footer__brand">
            <span className="tp-footer__brand-wm">
              {blockContent.logo_image ? <img className="tp-footer__img" src={blockContent.logo_image} alt={blockContent.wordmark || 'Logo'} /> : <span className="tp-footer__mk" aria-hidden="true" />}
              {!blockContent.logo_image && (
                <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey="wordmark" value={blockContent.wordmark} onSave={(v) => handleContentUpdate('wordmark', v)} enterBehavior="save" placeholder="Brand" />
              )}
              {edit && (
                <span className="tp-flogo-edit">
                  <label className="tp-flogo-edit__btn">
                    {logoUploading ? 'Uploading…' : (blockContent.logo_image ? 'Change' : '↥ Logo')}
                    <input type="file" accept="image/*" onChange={onLogoFile} hidden disabled={logoUploading} />
                  </label>
                  {blockContent.logo_image && <button type="button" className="tp-flogo-edit__x" onClick={() => handleContentUpdate('logo_image', '')}>remove</button>}
                </span>
              )}
            </span>
            {(blockContent.blurb || blockContent.tag || edit) && (
              <TechPremiumEditable as="p" mode={mode} sectionId={sectionId} elementKey="blurb" value={blockContent.blurb || blockContent.tag} onSave={(v) => handleContentUpdate('blurb', v)} multiline className="tp-footer__blurb" placeholder="A short line about what you do." />
            )}
            {(blockContent.contact_tel || blockContent.contact_email || blockContent.contact_address || edit) && (
              <div className="tp-footer__contact">
                <TechPremiumEditable as="div" mode={mode} sectionId={sectionId} elementKey="contact_address" value={blockContent.contact_address} onSave={(v) => handleContentUpdate('contact_address', v)} enterBehavior="save" placeholder="Address" />
                <TechPremiumEditable as="div" mode={mode} sectionId={sectionId} elementKey="contact_tel" value={blockContent.contact_tel} onSave={(v) => handleContentUpdate('contact_tel', v)} enterBehavior="save" placeholder="+91 …" />
                <TechPremiumEditable as="div" mode={mode} sectionId={sectionId} elementKey="contact_email" value={blockContent.contact_email} onSave={(v) => handleContentUpdate('contact_email', v)} enterBehavior="save" placeholder="hello@company.com" />
              </div>
            )}
            {(socials.length > 0 || edit) && (
              <div className="tp-footer__social">
                {socials.map((s) => {
                  const Icon = SOCIAL_ICON[s.icon] || MessageCircle;
                  return (
                    <span key={s.id} className="tp-soc-edit">
                      <a href={edit ? undefined : s.url}><Icon size={16} /></a>
                      {edit && (
                        <span className="tp-soc-pop">
                          <select value={s.icon} onChange={(e) => setSocials(socials.map((x) => (x.id === s.id ? { ...x, icon: e.target.value } : x)))}>
                            {['MessageCircle', 'Facebook', 'Linkedin', 'Youtube'].map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                          <input value={s.url} onChange={(e) => setSocials(socials.map((x) => (x.id === s.id ? { ...x, url: e.target.value } : x)))} placeholder="https://" />
                          <button type="button" onClick={() => setSocials(socials.filter((x) => x.id !== s.id))}>×</button>
                        </span>
                      )}
                    </span>
                  );
                })}
                {edit && socials.length < 6 && <button type="button" className="tp-foot-add" onClick={() => setSocials([...socials, { id: rid('soc'), icon: 'MessageCircle', url: '#' }])}>+ social</button>}
              </div>
            )}
            {isNewsletterConnected ? (
              <>
                <div className="tp-news">
                  <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey="newsletter_placeholder" value={blockContent.newsletter_placeholder} onSave={(v) => handleContentUpdate('newsletter_placeholder', v)} enterBehavior="save" className="tp-news__field" placeholder="you@company.com" />
                  <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey="newsletter_cta" value={blockContent.newsletter_cta} onSave={(v) => handleContentUpdate('newsletter_cta', v)} enterBehavior="save" className="tp-news__btn" placeholder="Subscribe" />
                </div>
                {edit && <div className="tp-news-status"><span>✓ Saving signups to dashboard</span><button type="button" className="tp-news-status__remove" onClick={removeNewsletter}>Remove</button></div>}
              </>
            ) : (edit && <button type="button" className="tp-news-setup" onClick={setupNewsletter}>⊕ Set up newsletter signup</button>)}
          </div>

          {columns.map((col) => (
            <div key={col.id} className="tp-footer__col">
              <div className="tp-footer__col-head">
                <TechPremiumEditable as="h4" mode={mode} sectionId={sectionId} elementKey={`footer_columns_heading_${col.id}`} value={col.heading} onSave={(v) => patchCol(col.id, { heading: v })} enterBehavior="save" placeholder="Heading" />
                {edit && columns.length > 1 && <button type="button" className="tp-footer__col-remove" onClick={() => removeColumn(col.id)} aria-label="Remove column">×</button>}
              </div>
              <ul>
                {(col.links || []).map((link, i) => edit ? (
                  <li key={link.id || i}>
                    <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`footer_columns_link_${col.id}_${i}`} value={link.label} onSave={(v) => patchLink(col.id, i, { label: v })} enterBehavior="save" placeholder="Link" />
                    <LinkTargetPopover href={link.href} sectionOptions={sectionOptions} pageOptions={pageOptions} onChange={(href) => patchLink(col.id, i, { href })} triggerClassName="tp-footer__link-cfg" />
                    {(col.links || []).length > 1 && <button type="button" className="tp-footer__link-remove" onClick={() => removeLink(col.id, i)} aria-label="Remove link">×</button>}
                  </li>
                ) : (
                  <li key={link.id || i}><a className="tp-footer__link" href={link.href || '#'}>{link.label}</a></li>
                ))}
                {edit && (col.links || []).length < 6 && <li><button type="button" className="tp-foot-add" onClick={() => addLink(col.id)}>+ link</button></li>}
              </ul>
            </div>
          ))}
          {edit && columns.length < 5 && <div className="tp-footer__col"><button type="button" className="tp-foot-add" onClick={addColumn}>+ column</button></div>}
        </div>

        <div className="tp-footer__bottom">
          <TechPremiumEditable as="div" mode={mode} sectionId={sectionId} elementKey="copyright" value={blockContent.copyright} onSave={(v) => handleContentUpdate('copyright', v)} enterBehavior="save" placeholder="© Your Company" />
          {(legal.length > 0 || edit) && (
            <div className="tp-footer__legal">
              {legal.map((l, i) => edit ? (
                <span key={l.id} className="tp-legal-edit">
                  <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`legal_links_label_${l.id}`} value={l.label} onSave={(v) => setLegal(legal.map((x) => (x.id === l.id ? { ...x, label: v } : x)))} enterBehavior="save" placeholder="Privacy" />
                  <button type="button" onClick={() => setLegal(legal.filter((x) => x.id !== l.id))}>×</button>
                </span>
              ) : <a key={l.id || i} href={l.href || '#'}>{l.label}</a>)}
              {edit && <button type="button" className="tp-foot-add" onClick={() => setLegal([...legal, { id: rid('lg'), label: 'Privacy', href: '#' }])}>+ legal</button>}
            </div>
          )}
        </div>

        {edit && (
          <div className="tp-wa-edit">
            <strong>WhatsApp widget</strong>
            <input value={blockContent.whatsapp_number || ''} onChange={(e) => handleContentUpdate('whatsapp_number', e.target.value)} placeholder="Number e.g. 919999999999" />
            <input value={blockContent.whatsapp_label || ''} onChange={(e) => handleContentUpdate('whatsapp_label', e.target.value)} placeholder="Label" />
            <input value={blockContent.whatsapp_prefill || ''} onChange={(e) => handleContentUpdate('whatsapp_prefill', e.target.value)} placeholder="Prefilled message (optional)" />
          </div>
        )}
      </footer>

      {waHref && (
        // Edit/preview only (published pair renders its own FAB): lift above the
        // app's floating action bar — at the default bottom offset the FAB sat on
        // top of the preview Publish button (QA: misclicks opened WhatsApp).
        <a
          className="tp-wa-fab"
          style={{ bottom: 'clamp(88px, 12vh, 110px)' }}
          href={waHref}
          target="_blank"
          rel="noopener"
          aria-label="WhatsApp"
        >
          <MessageCircle size={24} />
          {blockContent.whatsapp_label && <span className="tp-wa-label">{blockContent.whatsapp_label}</span>}
        </a>
      )}
    </>
  );
}

// Edit-only affordances (not needed on published).
const EDIT_EXTRA = `
.tp-footer__col-head { display:flex; align-items:center; gap:6px; }
.tp-footer__col-remove, .tp-footer__link-remove { background:transparent; border:none; color:oklch(0.84 0.022 140 / 0.6); font-size:12px; line-height:1; cursor:pointer; }
.tp-footer__link-cfg { display:inline-flex; align-items:center; background:transparent; border:none; color:oklch(0.84 0.022 140 / 0.7); cursor:pointer; padding:0; }
.tp-footer__link-cfg:hover { color:var(--lime); }
.tp-footer__col li { display:flex; align-items:center; gap:6px; }
.tp-foot-add { background:transparent; border:1px dashed var(--line-dk); color:oklch(0.84 0.022 140 / 0.7); font-family:var(--font-mono); font-size:11px; padding:3px 8px; border-radius:var(--r); cursor:pointer; }
.tp-news__field { flex:1; padding:10px 12px; font-size:13px; color:oklch(0.84 0.022 140 / 0.7); cursor:text; }
.tp-news__btn { background:var(--lime); color:var(--forest-d); padding:10px 14px; font-family:var(--font-mono); font-size:12px; font-weight:600; cursor:pointer; }
.tp-news-setup { display:inline-flex; align-items:center; gap:8px; background:transparent; border:1px dashed var(--line-dk); color:oklch(0.84 0.022 140 / 0.82); font-family:var(--font-mono); font-size:12px; padding:9px 14px; border-radius:var(--r); cursor:pointer; margin-top:8px; }
.tp-news-status { display:flex; align-items:center; gap:10px; margin-top:8px; font-family:var(--font-mono); font-size:11px; color:oklch(0.84 0.022 140 / 0.7); }
.tp-news-status__remove { background:transparent; border:none; color:var(--lime); font:inherit; cursor:pointer; padding:0; }
.tp-soc-edit { position:relative; display:inline-flex; }
.tp-soc-pop { position:absolute; top:40px; left:0; z-index:5; display:flex; gap:4px; background:var(--paper); border:1px solid var(--line-2); border-radius:var(--r); padding:5px; }
.tp-soc-pop select, .tp-soc-pop input { font-size:11px; padding:3px 5px; border:1px solid var(--line-2); border-radius:3px; }
.tp-soc-pop input { width:120px; }
.tp-soc-pop button { background:transparent; border:none; color:var(--ink-3); cursor:pointer; }
.tp-legal-edit { display:inline-flex; align-items:center; gap:3px; }
.tp-legal-edit button { background:transparent; border:none; color:oklch(0.84 0.022 140 / 0.6); cursor:pointer; }
.tp-wa-edit { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:14px var(--pad-x); border-top:1px dashed var(--line-dk); font-family:var(--font-mono); font-size:11px; color:oklch(0.84 0.022 140 / 0.7); }
.tp-wa-edit strong { color:var(--lime); }
.tp-wa-edit input { font-size:11px; padding:6px 8px; border:1px solid var(--line-dk); border-radius:var(--r); background:transparent; color:var(--paper); min-width:150px; }
.tp-flogo-edit { display:inline-flex; align-items:center; gap:6px; margin-left:4px; }
.tp-flogo-edit__btn { display:inline-flex; align-items:center; gap:4px; font-family:var(--font-mono); font-size:10px; letter-spacing:0.04em; color:oklch(0.84 0.022 140 / 0.7); border:1px dashed var(--line-dk); border-radius:var(--r); padding:2px 7px; cursor:pointer; white-space:nowrap; }
.tp-flogo-edit__btn:hover { color:var(--lime); border-color:var(--lime); }
.tp-flogo-edit__x { background:transparent; border:none; color:oklch(0.84 0.022 140 / 0.6); font-family:var(--font-mono); font-size:10px; cursor:pointer; }
.tp-flogo-edit__x:hover { color:var(--lime); }
`;
