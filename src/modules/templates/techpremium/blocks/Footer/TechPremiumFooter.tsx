'use client';

// src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx
// TechPremium footer — on the dark forest-d surface (painted by the renderer's
// data-surface wrapper; this block only sets light text + lime headings). Brand
// wordmark + tag + newsletter, nested link columns, copyright + location. Edit mode
// with full nested add/remove (columns + links) and one-click newsletter provision.
// Reference: TechPremium.html .footer (lines 373-389, 1161-1210).

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { LinkTargetPopover } from '../../components/LinkTargetPopover';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';

interface FooterLink {
  id: string;
  label: string;
  href: string;
}

interface FooterColumn {
  id: string;
  heading: string;
  links: FooterLink[];
}

interface TechPremiumFooterContent {
  wordmark: string;
  tag: string;
  newsletter_placeholder: string;
  newsletter_cta: string;
  copyright: string;
  location: string;
  footer_columns: FooterColumn[];
}

interface TechPremiumFooterProps {
  sectionId: string;
}

export default function TechPremiumFooter({ sectionId }: TechPremiumFooterProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumFooterContent>({ sectionId });

  const { content, addForm, deleteForm, getFormById, setSection, sections, pages } = useEditStore();
  const sectionOptions = React.useMemo(
    () => buildSectionLinkOptions(sections || []),
    [sections]
  );
  const pageOptions = React.useMemo(() => buildPageLinkOptions(pages), [pages]);
  const newsletterFormId: string | undefined =
    content?.[sectionId]?.elementMetadata?.newsletter_cta?.buttonConfig?.formId;
  const isNewsletterConnected = !!(newsletterFormId && getFormById?.(newsletterFormId));

  const setupNewsletter = () => {
    const formId = addForm({
      name: 'Newsletter',
      fields: [{
        id: 'email',
        type: 'email',
        label: 'Email',
        placeholder: blockContent.newsletter_placeholder || 'you@company.com',
        required: true,
      }],
      submitButtonText: blockContent.newsletter_cta || 'Subscribe',
      successMessage: 'Thanks for subscribing!',
      integrations: [{ id: `int-${Date.now()}`, type: 'dashboard', name: 'Dashboard', enabled: true }],
    } as any);
    const prevMeta = content?.[sectionId]?.elementMetadata || {};
    setSection(sectionId, {
      elementMetadata: { ...prevMeta, newsletter_cta: { buttonConfig: { type: 'form', formId } } },
    });
  };

  const removeNewsletter = () => {
    if (newsletterFormId) deleteForm(newsletterFormId);
  };

  const columns = blockContent.footer_columns || [];
  const setColumns = (next: FooterColumn[]) => handleCollectionUpdate('footer_columns', next);

  const updateHeading = (colId: string, heading: string) => {
    setColumns(columns.map((c) => (c.id === colId ? { ...c, heading } : c)));
  };
  const updateLinkLabel = (colId: string, linkIdx: number, label: string) => {
    setColumns(columns.map((c) => {
      if (c.id !== colId) return c;
      const links = [...(c.links || [])];
      links[linkIdx] = { ...links[linkIdx], label };
      return { ...c, links };
    }));
  };
  const updateLinkHref = (colId: string, linkIdx: number, href: string) => {
    setColumns(columns.map((c) => {
      if (c.id !== colId) return c;
      const links = [...(c.links || [])];
      links[linkIdx] = { ...links[linkIdx], href };
      return { ...c, links };
    }));
  };
  const addColumn = () => {
    if (columns.length >= 5) return;
    setColumns([...columns, { id: `col${Date.now()}`, heading: 'Column', links: [{ id: `ln${Date.now()}`, label: 'Link', href: '#' }] }]);
  };
  const removeColumn = (colId: string) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((c) => c.id !== colId));
  };
  const addLink = (colId: string) => {
    setColumns(columns.map((c) => {
      if (c.id !== colId) return c;
      if ((c.links || []).length >= 6) return c;
      return { ...c, links: [...(c.links || []), { id: `ln${Date.now()}`, label: 'Link', href: '#' }] };
    }));
  };
  const removeLink = (colId: string, linkIdx: number) => {
    setColumns(columns.map((c) => {
      if (c.id !== colId) return c;
      const links = (c.links || []).filter((_, i) => i !== linkIdx);
      return { ...c, links };
    }));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <footer className="tp-footer" data-section-id={sectionId}>
        <div className="tp-footer__inner">
          <div className="tp-footer__top">
            <div className="tp-footer__brand">
              <span className="tp-footer__brand-wm">
                <span className="tp-footer__mk" aria-hidden="true" />
                <TechPremiumEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="wordmark"
                  value={blockContent.wordmark}
                  onSave={(v) => handleContentUpdate('wordmark', v)}
                  enterBehavior="save"
                  placeholder="Brand"
                />
              </span>
              {(blockContent.tag || mode === 'edit') && (
                <TechPremiumEditable
                  as="p"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="tag"
                  value={blockContent.tag}
                  onSave={(v) => handleContentUpdate('tag', v)}
                  multiline
                  className="tp-footer__tag"
                  placeholder="A short line about what you do."
                />
              )}
              {isNewsletterConnected ? (
                <>
                  <div className="tp-news">
                    <TechPremiumEditable
                      as="span"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey="newsletter_placeholder"
                      value={blockContent.newsletter_placeholder}
                      onSave={(v) => handleContentUpdate('newsletter_placeholder', v)}
                      enterBehavior="save"
                      className="tp-news__field"
                      placeholder="you@company.com"
                    />
                    <TechPremiumEditable
                      as="span"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey="newsletter_cta"
                      value={blockContent.newsletter_cta}
                      onSave={(v) => handleContentUpdate('newsletter_cta', v)}
                      enterBehavior="save"
                      className="tp-news__btn"
                      placeholder="Subscribe"
                    />
                  </div>
                  {mode === 'edit' && (
                    <div className="tp-news-status">
                      <span>✓ Saving signups to dashboard</span>
                      <button type="button" className="tp-news-status__remove" onClick={removeNewsletter}>Remove</button>
                    </div>
                  )}
                </>
              ) : (
                mode === 'edit' && (
                  <button type="button" className="tp-news-setup" onClick={setupNewsletter}>⊕ Set up newsletter signup</button>
                )
              )}
            </div>

            {columns.map((col) => (
              <div key={col.id} className="tp-footer__col">
                <div className="tp-footer__col-head">
                  <TechPremiumEditable
                    as="h4"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`footer_columns_heading_${col.id}`}
                    value={col.heading}
                    onSave={(v) => updateHeading(col.id, v)}
                    enterBehavior="save"
                    placeholder="Heading"
                  />
                  {mode === 'edit' && columns.length > 1 && (
                    <button type="button" className="tp-footer__col-remove" onClick={() => removeColumn(col.id)} aria-label="Remove column">×</button>
                  )}
                </div>
                <ul>
                  {(col.links || []).map((link, linkIdx) =>
                    mode === 'edit' ? (
                      <li key={link.id || linkIdx}>
                        <TechPremiumEditable
                          as="span"
                          mode={mode}
                          sectionId={sectionId}
                          elementKey={`footer_columns_link_${col.id}_${linkIdx}`}
                          value={link.label}
                          onSave={(v) => updateLinkLabel(col.id, linkIdx, v)}
                          enterBehavior="save"
                          placeholder="Link"
                        />
                        <LinkTargetPopover
                          href={link.href}
                          sectionOptions={sectionOptions}
                          pageOptions={pageOptions}
                          onChange={(href) => updateLinkHref(col.id, linkIdx, href)}
                          triggerClassName="tp-footer__link-cfg"
                        />
                        {(col.links || []).length > 1 && (
                          <button type="button" className="tp-footer__link-remove" onClick={() => removeLink(col.id, linkIdx)} aria-label="Remove link">×</button>
                        )}
                      </li>
                    ) : (
                      <li key={link.id || linkIdx}>
                        <a className="tp-footer__link" href={link.href || '#'}>{link.label}</a>
                      </li>
                    )
                  )}
                  {mode === 'edit' && (col.links || []).length < 6 && (
                    <li>
                      <button type="button" className="tp-footer__link-add" onClick={() => addLink(col.id)}>+ link</button>
                    </li>
                  )}
                </ul>
              </div>
            ))}

            {mode === 'edit' && columns.length < 5 && (
              <div className="tp-footer__col">
                <button type="button" className="tp-footer__col-add" onClick={addColumn}>+ column</button>
              </div>
            )}
          </div>

          <div className="tp-footer__bottom">
            <TechPremiumEditable
              as="div"
              mode={mode}
              sectionId={sectionId}
              elementKey="copyright"
              value={blockContent.copyright}
              onSave={(v) => handleContentUpdate('copyright', v)}
              enterBehavior="save"
              placeholder="© Your Company"
            />
            {(blockContent.location || mode === 'edit') && (
              <TechPremiumEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey="location"
                value={blockContent.location}
                onSave={(v) => handleContentUpdate('location', v)}
                enterBehavior="save"
                placeholder="City, Country"
              />
            )}
          </div>
        </div>
      </footer>
    </>
  );
}

const STYLES = `
.tp-footer { padding: var(--pad-y) var(--pad-x) 0; font-family:var(--font-body); color:oklch(0.84 0.022 140 / 0.82); }
.tp-footer__inner { max-width:var(--max-w); margin:0 auto; }
.tp-footer__top { display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr; gap:36px; padding-bottom:44px; }
.tp-footer__brand-wm { display:inline-flex; align-items:center; gap:11px; font-family:var(--font-display); font-weight:700; font-size:21px; letter-spacing:-0.02em; color:var(--paper); }
.tp-footer__mk { width:34px; height:34px; border-radius:7px; background:oklch(0.34 0.045 158); display:grid; place-items:center; position:relative; flex-shrink:0; }
.tp-footer__mk::before { content:""; width:14px; height:14px; border-radius:50%; border:2px solid var(--lime); }
.tp-footer__mk::after { content:""; position:absolute; width:5px; height:5px; border-radius:50%; background:var(--lime); }
.tp-footer__tag { font-size:14px; line-height:1.7; max-width:34ch; margin:18px 0; }
.tp-news { display:flex; border:1px solid var(--line-dk); border-radius:var(--r); overflow:hidden; max-width:320px; margin:18px 0; }
.tp-news__field { flex:1; padding:10px 12px; font-size:13px; color:oklch(0.84 0.022 140 / 0.7); cursor:text; }
.tp-news__btn { background:var(--lime); color:var(--forest-d); padding:10px 14px; font-family:var(--font-mono); font-size:12px; font-weight:600; cursor:pointer; }
.tp-news-setup { display:inline-flex; align-items:center; gap:8px; background:transparent; border:1px dashed var(--line-dk); color:oklch(0.84 0.022 140 / 0.82); font-family:var(--font-mono); font-size:12px; padding:9px 14px; border-radius:var(--r); cursor:pointer; margin-top:8px; }
.tp-news-setup:hover { color:var(--paper); border-color:var(--lime); }
.tp-news-status { display:flex; align-items:center; gap:10px; margin-top:8px; font-family:var(--font-mono); font-size:11px; color:oklch(0.84 0.022 140 / 0.7); }
.tp-news-status__remove { background:transparent; border:none; color:var(--lime); font:inherit; cursor:pointer; padding:0; }
.tp-news-status__remove:hover { text-decoration:underline; }
.tp-footer__col-head { display:flex; align-items:center; gap:6px; margin-bottom:16px; }
.tp-footer__col h4 { font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:var(--lime); margin:0; }
.tp-footer__col-remove, .tp-footer__link-remove { background:transparent; border:none; color:oklch(0.84 0.022 140 / 0.6); font-size:12px; line-height:1; cursor:pointer; }
.tp-footer__link-cfg { display:inline-flex; align-items:center; justify-content:center; background:transparent; border:none; color:oklch(0.84 0.022 140 / 0.7); cursor:pointer; padding:0; line-height:1; }
.tp-footer__link-cfg:hover { color:var(--lime); }
.tp-footer__col ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:11px; }
.tp-footer__col li { font-size:14px; display:flex; align-items:center; gap:6px; }
.tp-footer__col li:hover { color:var(--paper); }
.tp-footer__link { color:inherit; text-decoration:none; }
.tp-footer__link:hover { color:var(--paper); }
.tp-footer__link-add, .tp-footer__col-add { background:transparent; border:1px dashed var(--line-dk); color:oklch(0.84 0.022 140 / 0.7); font-family:var(--font-mono); font-size:11px; padding:3px 8px; border-radius:var(--r); cursor:pointer; }
.tp-footer__bottom { border-top:1px solid var(--line-dk); padding:20px 0; margin-top:8px; display:flex; flex-wrap:wrap; gap:12px 26px; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.04em; }
@media (max-width:1040px){ .tp-footer__top { grid-template-columns:1fr 1fr; gap:32px 24px; } }
@media (max-width:520px){ .tp-footer__top { grid-template-columns:1fr; } }
`;
