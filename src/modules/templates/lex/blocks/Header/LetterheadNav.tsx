'use client';

// src/modules/templates/lex/blocks/Header/LetterheadNav.tsx
// Lex header: letterhead-style nav — brand mark + nav links + trust-hue CTA.
// Edit mode. Reference: Lex - Trust Professional.html .nav (399-467), nav markup
// (1673-1690). Binds the shared service header schema keys (A3).

import React from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { useLexBlock } from '../../hooks/useLexBlock';
import { LexEditable } from '../../components/LexEditable';
import { LinkTargetPopover } from '@/components/editor/LinkTargetPopover';
import type { Link } from '@/types/destination';

interface NavItem {
  id: string;
  label: string;
  href: string | Link;
}

interface LetterheadNavContent {
  logo_text: string;
  cta_text: string;
  logo_image: string;
  nav_items: NavItem[];
}

interface LetterheadNavProps {
  sectionId: string;
}

export default function LetterheadNav({ sectionId }: LetterheadNavProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useLexBlock<LetterheadNavContent>({ sectionId });
  const edit = mode === 'edit';

  const { sections, pages, socialMediaConfig, legalPages } = useEditStore();
  const sectionOptions = React.useMemo(() => buildSectionLinkOptions(sections || []), [sections]);
  const pageOptions = React.useMemo(() => buildPageLinkOptions(pages), [pages]);
  const socialOptions = React.useMemo(
    () => (socialMediaConfig?.items || []).map((s) => ({ value: s.url, label: s.platform })),
    [socialMediaConfig]
  );
  const legalOptions = React.useMemo(
    () => (legalPages?.privacy ? [{ value: '/privacy', label: 'Privacy Policy' }] : []),
    [legalPages]
  );

  const navItems = blockContent.nav_items || [];

  const setItems = (next: NavItem[]) => handleCollectionUpdate('nav_items', next);
  const patchItem = (id: string, p: Partial<NavItem>) =>
    setItems(navItems.map((n) => (n.id === id ? { ...n, ...p } : n)));

  const updateNavLabel = (id: string, label: string) => patchItem(id, { label });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <nav className="lex-nav" data-section-id={sectionId}>
        <div className="lex-nav__brand">
          <span className="lex-nav__mark">
            {(blockContent.logo_text || 'L').charAt(0).toUpperCase()}
          </span>
          <LexEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="logo_text"
            value={blockContent.logo_text}
            onSave={(v) => handleContentUpdate('logo_text', v)}
            enterBehavior="save"
            placeholder="Firm name"
          />
        </div>
        <div className="lex-nav__mid">
          {navItems.map((item, idx) => (
            <span key={item.id} className="lex-nav__link-wrap">
              <LexEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey={`nav_items_label_${item.id}`}
                value={item.label}
                onSave={(v) => updateNavLabel(item.id, v)}
                enterBehavior="save"
                className={idx === 0 ? 'lex-nav__link is-active' : 'lex-nav__link'}
                placeholder="Link"
              />
              {edit && (
                <LinkTargetPopover
                  value={item.href ?? '#'}
                  sectionOptions={sectionOptions}
                  pageOptions={pageOptions}
                  legalOptions={legalOptions}
                  socialOptions={socialOptions}
                  onChange={(link) => patchItem(item.id, { href: link })}
                  triggerClassName="lex-nav__link-cfg"
                />
              )}
            </span>
          ))}
        </div>
        <div className="lex-nav__right">
          <LexEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="cta_text"
            value={blockContent.cta_text}
            onSave={(v) => handleContentUpdate('cta_text', v)}
            enterBehavior="save"
            isButton
            className="lex-nav__cta"
            placeholder="Schedule a consultation"
          />
        </div>
      </nav>
    </>
  );
}

const STYLES = `
.lex-nav {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: stretch;
  border-bottom: 1px solid var(--rule);
  background: var(--paper);
  font-family: var(--font-body);
}
.lex-nav__brand {
  display: flex; align-items: center; gap: 12px;
  padding: 24px var(--sec-pad-x);
  border-right: 1px solid var(--rule);
  font-family: var(--font-display); font-weight: 500; font-size: 24px;
  letter-spacing: -0.015em; color: var(--ink);
}
.lex-nav__brand em { font-style: italic; font-weight: 400; color: var(--trust); }
.lex-nav__mark {
  width: 32px; height: 32px;
  border: 1.5px solid var(--trust); border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-style: italic; font-weight: 500;
  font-size: 18px; color: var(--trust); flex-shrink: 0;
}
.lex-nav__mid { display: flex; align-items: center; gap: 0; padding: 0 8px; }
.lex-nav__link-wrap { display: inline-flex; align-items: center; gap: 4px; }
.lex-nav__link-cfg { display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--ink-3); cursor: pointer; padding: 0; }
.lex-nav__link-cfg:hover { color: var(--trust); }
.lex-nav__link {
  font-size: 13px; font-weight: 500; padding: 0 22px;
  display: inline-flex; align-items: center; color: var(--ink-2);
  letter-spacing: 0.04em; position: relative; cursor: pointer;
}
.lex-nav__link:hover { color: var(--ink); }
.lex-nav__link.is-active { color: var(--ink); }
.lex-nav__link.is-active::after {
  content: ""; position: absolute; bottom: 18px; left: 22px; right: 22px;
  height: 2px; background: var(--trust);
}
.lex-nav__right {
  display: flex; align-items: center; gap: 16px;
  padding: 0 var(--sec-pad-x);
  border-left: 1px solid var(--rule);
}
.lex-nav__cta {
  background: var(--trust); color: var(--trust-ink);
  font-family: var(--font-body); font-weight: 500; font-size: 13px;
  padding: 12px 22px; border-radius: 2px; letter-spacing: 0.02em;
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
}
.lex-nav__cta:hover { background: var(--trust-deep); }
@media (max-width: 1100px) {
  .lex-nav { grid-template-columns: auto 1fr auto; }
  .lex-nav__mid { display: none; }
}
`;
