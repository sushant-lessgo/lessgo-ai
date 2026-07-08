'use client';

// src/modules/templates/meridian/blocks/Footer/HairlineFooter.tsx
// Meridian footer: wordmark + tag + newsletter, nested link columns, copyright +
// location. Edit mode. Full nested add/remove (columns + links) — same
// collection-update mechanism as other blocks (map-replace the whole array);
// nested-array shape modeled on SegmentedFAQTabs.
// Reference: Meridian - Modern Tech.html lines 1433-1463.
// Newsletter is static markup with editable placeholder/cta (no forms wiring in P2).

import React from 'react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';
import { LinkTargetPopover } from '@/components/editor/LinkTargetPopover';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import type { Link } from '@/types/destination';
import { isLink } from '@/types/destination';
import { resolveDestination } from '@/utils/resolveCtaHref';

// Dual-read a footer link's target: legacy raw string href passes through verbatim
// (old pages byte-identical); a new Link object resolves via the dumb resolver.
function resolveLinkHref(value: string | Link | undefined): string {
  if (typeof value === 'string') return value || '#';
  if (isLink(value)) return resolveDestination(value.dest) || '#';
  return '#';
}

interface FooterLink {
  id: string;
  label: string;
  href: string | Link;
}

interface FooterColumn {
  id: string;
  heading: string;
  links: FooterLink[];
}

interface HairlineFooterContent {
  wordmark: string;
  tag: string;
  newsletter_placeholder: string;
  newsletter_cta: string;
  copyright: string;
  location: string;
  footer_columns: FooterColumn[];
}

interface HairlineFooterProps {
  sectionId: string;
}

export default function HairlineFooter({ sectionId }: HairlineFooterProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useMeridianBlock<HairlineFooterContent>({ sectionId });

  // Newsletter capture: one-click auto-provisions a dashboard-backed form and
  // connects it to newsletter_cta (buttonConfig.formId). Once connected, the
  // published footer renders a live email-capture widget.
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
    if (newsletterFormId) deleteForm(newsletterFormId); // also clears the buttonConfig link
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
  const updateLinkHref = (colId: string, linkIdx: number, href: string | Link) => {
    setColumns(columns.map((c) => {
      if (c.id !== colId) return c;
      const links = [...(c.links || [])];
      links[linkIdx] = { ...links[linkIdx], href };
      return { ...c, links };
    }));
  };
  const addColumn = () => {
    if (columns.length >= 5) return;
    setColumns([
      ...columns,
      { id: `col${Date.now()}`, heading: 'Column', links: [{ id: `ln${Date.now()}`, label: 'Link', href: '#' }] },
    ]);
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
      <footer className="mrd-footer" data-section-id={sectionId}>
        <div className="mrd-footer__top">
          <div className="mrd-footer__brand">
            <div className="mrd-footer__wordmark">
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="wordmark"
                value={blockContent.wordmark}
                onSave={(v) => handleContentUpdate('wordmark', v)}
                enterBehavior="save"
                placeholder="meridian"
              />
              <span className="mrd-footer__dot" aria-hidden="true">.</span>
            </div>
            {(blockContent.tag || mode === 'edit') && (
              <MeridianEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey="tag"
                value={blockContent.tag}
                onSave={(v) => handleContentUpdate('tag', v)}
                multiline
                className="mrd-footer__tag"
                placeholder="A short line about what you do."
              />
            )}
            {isNewsletterConnected ? (
              <>
                <div className="mrd-news">
                  <MeridianEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="newsletter_placeholder"
                    value={blockContent.newsletter_placeholder}
                    onSave={(v) => handleContentUpdate('newsletter_placeholder', v)}
                    enterBehavior="save"
                    className="mrd-news__field"
                    placeholder="you@company.com"
                  />
                  <MeridianEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="newsletter_cta"
                    value={blockContent.newsletter_cta}
                    onSave={(v) => handleContentUpdate('newsletter_cta', v)}
                    enterBehavior="save"
                    className="mrd-news__btn"
                    placeholder="subscribe"
                  />
                </div>
                {mode === 'edit' && (
                  <div className="mrd-news-status">
                    <span>✓ Saving signups to dashboard</span>
                    <button type="button" className="mrd-news-status__remove" onClick={removeNewsletter}>
                      Remove
                    </button>
                  </div>
                )}
              </>
            ) : (
              mode === 'edit' && (
                <button type="button" className="mrd-news-setup" onClick={setupNewsletter}>
                  ⊕ Set up newsletter signup
                </button>
              )
            )}
          </div>

          {columns.map((col) => (
            <div key={col.id} className="mrd-footer__col">
              <div className="mrd-footer__col-head">
                <MeridianEditable
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
                  <button
                    type="button"
                    className="mrd-footer__col-remove"
                    onClick={() => removeColumn(col.id)}
                    aria-label="Remove column"
                  >
                    ×
                  </button>
                )}
              </div>
              <ul>
                {(col.links || []).map((link, linkIdx) =>
                  mode === 'edit' ? (
                    <li key={link.id || linkIdx}>
                      <MeridianEditable
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
                        value={link.href ?? '#'}
                        sectionOptions={sectionOptions}
                        pageOptions={pageOptions}
                        onChange={(link2) => updateLinkHref(col.id, linkIdx, link2)}
                        triggerClassName="mrd-footer__link-cfg"
                      />
                      {(col.links || []).length > 1 && (
                        <button
                          type="button"
                          className="mrd-footer__link-remove"
                          onClick={() => removeLink(col.id, linkIdx)}
                          aria-label="Remove link"
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ) : (
                    <li key={link.id || linkIdx}>
                      <a className="mrd-footer__link" href={resolveLinkHref(link.href)}>
                        {link.label}
                      </a>
                    </li>
                  )
                )}
                {mode === 'edit' && (col.links || []).length < 6 && (
                  <li>
                    <button type="button" className="mrd-footer__link-add" onClick={() => addLink(col.id)}>
                      + link
                    </button>
                  </li>
                )}
              </ul>
            </div>
          ))}

          {mode === 'edit' && columns.length < 5 && (
            <div className="mrd-footer__col">
              <button type="button" className="mrd-footer__col-add" onClick={addColumn}>
                + column
              </button>
            </div>
          )}
        </div>

        <div className="mrd-footer__bottom">
          <MeridianEditable
            as="div"
            mode={mode}
            sectionId={sectionId}
            elementKey="copyright"
            value={blockContent.copyright}
            onSave={(v) => handleContentUpdate('copyright', v)}
            enterBehavior="save"
            placeholder="© Meridian"
          />
          {(blockContent.location || mode === 'edit') && (
            <MeridianEditable
              as="div"
              mode={mode}
              sectionId={sectionId}
              elementKey="location"
              value={blockContent.location}
              onSave={(v) => handleContentUpdate('location', v)}
              enterBehavior="save"
              placeholder="City · coordinates"
            />
          )}
        </div>
      </footer>
    </>
  );
}

const STYLES = `
.mrd-footer { border-top: 1px solid var(--line); padding: 72px var(--sec-pad-x) 32px; max-width: 1340px; margin: 0 auto; font-family: var(--font-body); }
.mrd-footer__top { display: flex; flex-wrap: wrap; gap: 40px; padding-bottom: 56px; border-bottom: 1px solid var(--line); }
.mrd-footer__brand { flex: 2 1 280px; }
.mrd-footer__col { flex: 1 1 140px; }
.mrd-footer__wordmark { font-family: var(--font-display); font-weight: 600; font-size: 26px; letter-spacing: -0.03em; color: var(--bone); }
.mrd-footer__dot { color: var(--accent); }
.mrd-footer__tag { font-family: var(--font-display); font-size: 14px; color: var(--bone-2); margin: 12px 0 22px; max-width: 34ch; }
.mrd-news { display: flex; border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; max-width: 320px; }
.mrd-news__field { flex: 1; padding: 10px 12px; font-size: 13px; color: var(--bone-3); cursor: text; }
.mrd-news__btn { background: var(--ink-1); color: var(--bone); padding: 10px 14px; border-left: 1px solid var(--line); font-family: var(--font-mono); font-size: 12px; cursor: pointer; }
.mrd-news__btn:hover { background: var(--ink-2); }
.mrd-news-setup {
  display: inline-flex; align-items: center; gap: 8px;
  background: transparent; border: 1px dashed var(--line-strong); color: var(--bone-2);
  font-family: var(--font-mono); font-size: 12px; padding: 9px 14px; border-radius: var(--r-md); cursor: pointer;
}
.mrd-news-setup:hover { color: var(--bone); border-color: var(--bone-3); }
.mrd-news-status {
  display: flex; align-items: center; gap: 10px; margin-top: 8px;
  font-family: var(--font-mono); font-size: 11px; color: var(--bone-3);
}
.mrd-news-status__remove { background: transparent; border: none; color: var(--accent); font: inherit; cursor: pointer; padding: 0; }
.mrd-news-status__remove:hover { text-decoration: underline; }
.mrd-footer__col-head { display: flex; align-items: center; gap: 6px; margin-bottom: 18px; }
.mrd-footer__col h4 { font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--bone-3); margin: 0; font-weight: 400; }
.mrd-footer__col-remove, .mrd-footer__link-remove {
  background: transparent; border: none; color: var(--bone-3); font-size: 12px; line-height: 1; cursor: pointer;
}
.mrd-footer__link-cfg {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: var(--bone-2);
  cursor: pointer; padding: 0; line-height: 1; opacity: 1;
}
.mrd-footer__link-cfg:hover { color: var(--accent); }
.mrd-footer__col ul { list-style: none; padding: 0; margin: 0; }
.mrd-footer__col ul li { font-size: 13.5px; color: var(--bone-2); padding: 4px 0; display: flex; align-items: center; gap: 6px; }
.mrd-footer__col ul li:hover { color: var(--bone); }
.mrd-footer__link { color: inherit; text-decoration: none; }
.mrd-footer__link-add, .mrd-footer__col-add {
  background: transparent; border: 1px dashed var(--line-strong); color: var(--bone-3);
  font-family: var(--font-mono); font-size: 11px; padding: 3px 8px; border-radius: var(--r-sm); cursor: pointer;
}
.mrd-footer__bottom {
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap;
  padding-top: 28px; font-family: var(--font-mono); font-size: 11px; color: var(--bone-3); letter-spacing: 0.04em;
}
[data-variant="marketing"] .mrd-footer__col h4 { font-family: var(--font-body); letter-spacing: 0; text-transform: none; font-size: 12px; }
`;
