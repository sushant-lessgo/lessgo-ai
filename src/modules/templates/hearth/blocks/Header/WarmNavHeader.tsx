'use client';

// src/modules/service/blocks/Header/WarmNavHeader.tsx
// Hearth header: brand-mark + nav links + CTA pill. Edit mode.
// Reference: Hearth - Warm Service.html lines 1376-1387, .nav (274-298), .btn (301-323).

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { HearthEditable } from '../../components/HearthEditable';
import { LinkPicker } from '@/components/editor/LinkPicker';
import type { Link } from '@/types/destination';

interface NavItem {
  id: string;
  label: string;
  href: string | Link;
}

interface WarmNavHeaderContent {
  logo_text: string;
  cta_text: string;
  logo_image: string;
  nav_items: NavItem[];
}

interface WarmNavHeaderProps {
  sectionId: string;
}

export default function WarmNavHeader({ sectionId }: WarmNavHeaderProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useServiceBlock<WarmNavHeaderContent>({ sectionId });
  const edit = mode === 'edit';

  const sections = useEditStore((s) => s.sections);
  const pages = useEditStore((s) => s.pages);
  const socialMediaConfig = useEditStore((s) => s.socialMediaConfig);
  const legalPages = useEditStore((s) => s.legalPages);
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
      <nav className="hearth-nav" data-section-id={sectionId}>
        <div className="hearth-nav__left">
          <div className="hearth-nav__brand">
            <div className="hearth-nav__brand-mark">
              {(blockContent.logo_text || 'h').charAt(0).toLowerCase()}
            </div>
            <HearthEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="logo_text"
              value={blockContent.logo_text}
              onSave={(v) => handleContentUpdate('logo_text', v)}
              enterBehavior="save"
              placeholder="studio name"
            />
          </div>
          <div className="hearth-nav__links">
            {navItems.map((item, idx) => (
              <span key={item.id} className="hearth-nav__link-wrap">
                <HearthEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`nav_items_label_${item.id}`}
                  value={item.label}
                  onSave={(v) => updateNavLabel(item.id, v)}
                  enterBehavior="save"
                  className={idx === 0 ? 'hearth-nav__link is-active' : 'hearth-nav__link'}
                  placeholder="Link"
                />
                {edit && (
                  <LinkPicker
                    value={item.href ?? '#'}
                    sectionOptions={sectionOptions}
                    pageOptions={pageOptions}
                    legalOptions={legalOptions}
                    socialOptions={socialOptions}
                    onChange={(link) => patchItem(item.id, { href: link })}
                    triggerClassName="hearth-nav__link-cfg"
                  />
                )}
              </span>
            ))}
          </div>
        </div>
        <div className="hearth-nav__right">
          <HearthEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="cta_text"
            value={blockContent.cta_text}
            onSave={(v) => handleContentUpdate('cta_text', v)}
            enterBehavior="save"
            isButton
            className="hearth-btn hearth-btn--primary hearth-btn--sm"
            placeholder="Book a call"
          />
        </div>
      </nav>
    </>
  );
}

const STYLES = `
.hearth-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px var(--sec-pad-x);
  max-width: var(--max-w); margin: 0 auto;
  font-family: var(--font-body);
}
.hearth-nav__left { display: flex; align-items: center; gap: 40px; }
.hearth-nav__brand {
  display: flex; align-items: center; gap: 12px;
  font-family: var(--font-display); font-weight: 500; font-size: 22px; letter-spacing: -0.01em;
  color: var(--ink);
}
.hearth-nav__brand-mark {
  width: 32px; height: 32px; border-radius: 999px;
  display: grid; place-items: center;
  background: var(--accent-wash); color: var(--accent-deep);
  font-family: var(--font-display); font-style: italic; font-size: 16px;
}
.hearth-nav__links { display: flex; gap: 32px; font-size: 15px; color: var(--ink-2); }
.hearth-nav__link-wrap { display: inline-flex; align-items: center; gap: 4px; }
.hearth-nav__link-cfg { display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--ink-3); cursor: pointer; padding: 0; }
.hearth-nav__link-cfg:hover { color: var(--accent-deep); }
.hearth-nav__link { position: relative; padding: 4px 0; cursor: pointer; }
.hearth-nav__link.is-active { color: var(--ink); }
.hearth-nav__link.is-active::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -2px;
  height: 6px;
  background: radial-gradient(circle at 50% 0, var(--accent) 1.5px, transparent 2px) 0 0/8px 6px repeat-x;
  opacity: 0.6;
}
.hearth-nav__right { display: flex; align-items: center; gap: 12px; }
.hearth-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-body); font-weight: 500;
  border-radius: var(--r-md); transition: all 0.2s;
  cursor: pointer; text-decoration: none;
  border: 1px solid transparent;
}
.hearth-btn--primary {
  background: var(--ink); color: var(--cream);
  padding: 12px 20px;
}
.hearth-btn--primary:hover { background: var(--accent-deep); transform: translateY(-1px); }
.hearth-btn--sm { padding: 10px 16px; font-size: 13.5px; border-radius: var(--r-sm); }
`;
