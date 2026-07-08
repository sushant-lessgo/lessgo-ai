'use client';

// Lumen footer (edit): dark 3-col footer (brand+blurb+contact | columns) + bottom
// bar (copyright + legal links) + a fixed floating WhatsApp/call CTA. Consumes the
// LumenFooter layout. Bilingual twins routed by the active edit-language.

import React from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { useLumenBlock } from '../../hooks/useLumenBlock';
import { LumenEditable } from '../../components/LumenEditable';
import { LinkTargetPopover } from '@/components/editor/LinkTargetPopover';
import { resolveDestination } from '@/utils/resolveCtaHref';
import { FOOTER_STYLES } from './styles';
import {
  DEFAULT_FOOTER_COLUMNS, DEFAULT_LEGAL_LINKS,
  type FooterColumn, type FooterColumnLink, type LegalLink,
} from './footerDefaults';

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

interface LumenFooterContent {
  brand_text: string; brand_text_nl: string;
  brand_sub: string; brand_sub_nl: string;
  tagline: string; tagline_nl: string;
  contact_line: string; contact_line_nl: string;
  contact_phone: string; contact_email: string;
  copyright: string; copyright_nl: string;
  whatsapp_number: string; whatsapp_label: string; whatsapp_label_nl: string; whatsapp_prefill: string;
  book_call_url: string;
  footer_columns: FooterColumn[];
  legal_links: LegalLink[];
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4zm-2.6 4c-.2 0-.5 0-.7.3-.3.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.9 4.4 3.9 2.2.8 2.6.7 3.1.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-.6-.2-1.5-.6-2.3-1.4-.6-.6-1-1.3-1.2-1.5-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5 0-.2 0-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.5z" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);

function buildWaHref(number?: string, prefill?: string): string {
  const wa = (number || '').replace(/[^0-9]/g, '');
  if (!wa) return '';
  return `https://wa.me/${wa}${prefill ? `?text=${encodeURIComponent(prefill)}` : ''}`;
}

export default function LumenFooter({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, editLang, handleContentUpdate, handleCollectionUpdate } =
    useLumenBlock<LumenFooterContent>({ sectionId });
  const edit = mode === 'edit';

  const { sections, pages } = useEditStore();
  const sectionOptions = React.useMemo(() => buildSectionLinkOptions(sections || []), [sections]);
  const pageOptions = React.useMemo(() => buildPageLinkOptions(pages), [pages]);

  const columns: FooterColumn[] = (blockContent.footer_columns || []).length
    ? blockContent.footer_columns : DEFAULT_FOOTER_COLUMNS;
  const legal: LegalLink[] = (blockContent.legal_links || []).length
    ? blockContent.legal_links : DEFAULT_LEGAL_LINKS;

  const waHref = buildWaHref(blockContent.whatsapp_number, blockContent.whatsapp_prefill);
  const callHref = blockContent.book_call_url || '#contact';

  const setColumns = (next: FooterColumn[]) => handleCollectionUpdate('footer_columns', next);
  const patchCol = (id: string, p: Partial<FooterColumn>) => setColumns(columns.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const patchColLink = (cid: string, lid: string, p: Partial<FooterColumnLink>) =>
    setColumns(columns.map((c) => c.id === cid ? { ...c, links: c.links.map((l) => (l.id === lid ? { ...l, ...p } : l)) } : c));
  const addColLink = (cid: string) =>
    setColumns(columns.map((c) => c.id === cid && c.links.length < 8 ? { ...c, links: [...c.links, { id: rid('fl'), label: 'Link', href: '#' }] } : c));
  const removeColLink = (cid: string, lid: string) =>
    setColumns(columns.map((c) => c.id === cid ? { ...c, links: c.links.filter((l) => l.id !== lid) } : c));

  const setLegal = (next: LegalLink[]) => handleCollectionUpdate('legal_links', next);
  const patchLegal = (id: string, p: Partial<LegalLink>) => setLegal(legal.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const addLegal = () => legal.length < 4 && setLegal([...legal, { id: rid('lg'), label: 'Legal', href: '#' }]);
  const removeLegal = (id: string) => setLegal(legal.filter((l) => l.id !== id));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer className="lm-footer" data-section-id={sectionId}>
        <div className="lm-footer-top">
          <div className="lm-footer-brand">
            <span className="lm-footer-brandrow">
              <span className="lm-footer-wm">
                <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                  content={blockContent} elementKey="brand_text" onSave={handleContentUpdate}
                  enterBehavior="save" placeholder="Studio" />
                <em>.</em>
              </span>
              <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                content={blockContent} elementKey="brand_sub" onSave={handleContentUpdate}
                enterBehavior="save" className="lm-footer-sub" placeholder="Photography" />
            </span>
            <LumenEditable as="p" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="tagline" onSave={handleContentUpdate}
              multiline placeholder="A short line on what you photograph and where." />
            <div className="lm-footer-contact">
              <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                content={blockContent} elementKey="contact_line" onSave={handleContentUpdate}
                enterBehavior="save" placeholder="City, Region" />
              <br />
              <b>
                <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                  content={blockContent} elementKey="contact_phone" onSave={handleContentUpdate}
                  enterBehavior="save" placeholder="+31 6 0000 0000" />
              </b>{' · '}
              <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                content={blockContent} elementKey="contact_email" onSave={handleContentUpdate}
                enterBehavior="save" placeholder="hello@example.com" />
            </div>
          </div>

          {columns.map((col) => (
            <div className="lm-footer-col" key={col.id}>
              <LumenEditable as="h4" mode={mode} sectionId={sectionId} editLang={editLang}
                content={col} elementKey="heading" onSave={(k, v) => patchCol(col.id, { [k]: v } as any)}
                enterBehavior="save" placeholder="Column" />
              <ul>
                {col.links.map((l) => (
                  <li key={l.id}>
                    <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                      content={l} elementKey="label" onSave={(k, v) => patchColLink(col.id, l.id, { [k]: v } as any)}
                      enterBehavior="save" placeholder="Link" />
                    {edit && (
                      <>
                        <LinkTargetPopover value={l.href} sectionOptions={sectionOptions} pageOptions={pageOptions}
                          onChange={(link) => patchColLink(col.id, l.id, { href: resolveDestination(link.dest) })} triggerClassName="lm-footer-linkcfg" />
                        <button type="button" className="lm-footer-rm" onClick={() => removeColLink(col.id, l.id)} aria-label="Remove">×</button>
                      </>
                    )}
                  </li>
                ))}
                {edit && col.links.length < 8 && (
                  <li><button type="button" className="lm-footer-add" onClick={() => addColLink(col.id)}>+ link</button></li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="lm-footer-bottom">
          <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
            content={blockContent} elementKey="copyright" onSave={handleContentUpdate}
            enterBehavior="save" placeholder="© 2026 Studio" />
          <span className="lm-footer-legal">
            {legal.map((l, i) => (
              <React.Fragment key={l.id}>
                {i > 0 && <span aria-hidden="true">·</span>}
                <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                  content={l} elementKey="label" onSave={(k, v) => patchLegal(l.id, { [k]: v } as any)}
                  enterBehavior="save" placeholder="Legal" />
                {edit && (
                  <>
                    <LinkTargetPopover value={l.href} sectionOptions={sectionOptions} pageOptions={pageOptions}
                      onChange={(link) => patchLegal(l.id, { href: resolveDestination(link.dest) })} triggerClassName="lm-footer-linkcfg" />
                    <button type="button" className="lm-footer-rm" onClick={() => removeLegal(l.id)} aria-label="Remove">×</button>
                  </>
                )}
              </React.Fragment>
            ))}
            {edit && legal.length < 4 && (
              <button type="button" className="lm-footer-add" onClick={addLegal}>+ legal</button>
            )}
          </span>
        </div>

        {edit && (
          <div className="lm-wa-edit">
            <strong>WhatsApp + booking</strong>
            <input value={blockContent.whatsapp_number || ''} onChange={(e) => handleContentUpdate('whatsapp_number', e.target.value)} placeholder="WhatsApp number e.g. 31612345678" />
            <input value={blockContent.whatsapp_label || ''} onChange={(e) => handleContentUpdate('whatsapp_label', e.target.value)} placeholder="WhatsApp label (optional)" />
            <input value={blockContent.whatsapp_prefill || ''} onChange={(e) => handleContentUpdate('whatsapp_prefill', e.target.value)} placeholder="Prefilled message (optional)" />
            <input value={blockContent.book_call_url || ''} onChange={(e) => handleContentUpdate('book_call_url', e.target.value)} placeholder="Book-a-call URL (optional)" />
          </div>
        )}
      </footer>

      <div className="lm-float-cta" aria-label="Quick contact">
        {waHref && (
          <a className="lm-fab lm-fab-wa" href={waHref} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            <span className="lm-fab-lbl">{blockContent.whatsapp_label || 'WhatsApp'}</span>
          </a>
        )}
        <a className="lm-fab lm-fab-call" href={callHref}>
          <PhoneIcon />
          <span className="lm-fab-lbl">Book a call</span>
        </a>
      </div>
    </>
  );
}
