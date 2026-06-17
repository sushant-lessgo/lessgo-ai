'use client';

// src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx
// TechPremium header: forest brand-mark + wordmark, nav links, "Platform login"
// (lock) + primary "Book a demo" CTA. Edit mode.
// Reference: TechPremium.html .nav (lines 162-179, 679-701).

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { LinkTargetPopover } from '../../components/LinkTargetPopover';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';

interface NavItem {
  id: string;
  label: string;
  href: string;
}

interface TechPremiumNavContent {
  logo_text: string;
  cta_text: string;
  signin_text: string;
  logo_image: string;
  nav_items: NavItem[];
}

interface TechPremiumNavProps {
  sectionId: string;
}

const LockIcon = () => (
  <svg className="tp-nav-login__lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export default function TechPremiumNav({ sectionId }: TechPremiumNavProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumNavContent>({ sectionId });

  const navItems = blockContent.nav_items || [];

  const { sections } = useEditStore();
  const sectionOptions = React.useMemo(
    () => buildSectionLinkOptions(sections || []),
    [sections]
  );

  const updateNavLabel = (id: string, label: string) => {
    handleCollectionUpdate('nav_items', navItems.map((n) => (n.id === id ? { ...n, label } : n)));
  };
  const updateNavHref = (id: string, href: string) => {
    handleCollectionUpdate('nav_items', navItems.map((n) => (n.id === id ? { ...n, href } : n)));
  };
  const addNavItem = () => {
    if (navItems.length >= 5) return;
    handleCollectionUpdate('nav_items', [...navItems, { id: `nav${Date.now()}`, label: 'Link', href: '#' }]);
  };
  const removeNavItem = (id: string) => {
    if (navItems.length <= 2) return;
    handleCollectionUpdate('nav_items', navItems.filter((n) => n.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <nav className="tp-nav" data-section-id={sectionId}>
        <div className="tp-nav__left">
          <div className="tp-brand">
            {blockContent.logo_image ? (
              <img className="tp-brand__img" src={blockContent.logo_image} alt="" data-element-key="logo_image" />
            ) : (
              <span className="tp-brand__mk" aria-hidden="true" />
            )}
            <TechPremiumEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="logo_text"
              value={blockContent.logo_text}
              onSave={(v) => handleContentUpdate('logo_text', v)}
              enterBehavior="save"
              className="tp-brand__wm"
              placeholder="Brand"
            />
          </div>
          <div className="tp-nav-links">
            {navItems.map((item) =>
              mode === 'edit' ? (
                <span key={item.id} className="tp-nav-link-wrap">
                  <TechPremiumEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`nav_items_label_${item.id}`}
                    value={item.label}
                    onSave={(v) => updateNavLabel(item.id, v)}
                    enterBehavior="save"
                    className="tp-nav-link"
                    placeholder="Link"
                  />
                  <LinkTargetPopover
                    href={item.href}
                    sectionOptions={sectionOptions}
                    onChange={(href) => updateNavHref(item.id, href)}
                    triggerClassName="tp-nav-link-cfg"
                  />
                  {navItems.length > 2 && (
                    <button type="button" className="tp-nav-link-remove" onClick={() => removeNavItem(item.id)} aria-label="Remove link">×</button>
                  )}
                </span>
              ) : (
                <a key={item.id} className="tp-nav-link" href={item.href || '#'}>{item.label}</a>
              )
            )}
            {mode === 'edit' && navItems.length < 5 && (
              <button type="button" className="tp-nav-link-add" onClick={addNavItem}>+ link</button>
            )}
          </div>
        </div>
        <div className="tp-nav-right">
          <span className="tp-nav-login">
            <LockIcon />
            <TechPremiumEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="signin_text"
              value={blockContent.signin_text}
              onSave={(v) => handleContentUpdate('signin_text', v)}
              enterBehavior="save"
              isButton
              placeholder="Platform login"
            />
          </span>
          <TechPremiumEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="cta_text"
            value={blockContent.cta_text}
            onSave={(v) => handleContentUpdate('cta_text', v)}
            enterBehavior="save"
            isButton
            className="tp-btn tp-btn--fill tp-btn--sm"
            placeholder="Book a demo"
          />
        </div>
      </nav>
    </>
  );
}

const STYLES = `
.tp-nav { display:flex; align-items:center; justify-content:space-between; gap:28px; padding:14px var(--pad-x); border-bottom:1px solid var(--line); font-family:var(--font-body); }
.tp-nav__left { display:flex; align-items:center; gap:28px; min-width:0; }
.tp-brand { display:inline-flex; align-items:center; gap:11px; }
.tp-brand__mk { width:34px; height:34px; border-radius:7px; background:var(--forest); display:grid; place-items:center; position:relative; flex-shrink:0; }
.tp-brand__mk::before { content:""; width:14px; height:14px; border-radius:50%; border:2px solid var(--lime); }
.tp-brand__mk::after { content:""; position:absolute; width:5px; height:5px; border-radius:50%; background:var(--lime); }
.tp-brand__img { width:34px; height:34px; border-radius:7px; object-fit:cover; flex-shrink:0; }
.tp-brand__wm { font-family:var(--font-display); font-weight:700; font-size:21px; letter-spacing:-0.02em; color:var(--ink); }
.tp-nav-links { display:flex; align-items:center; gap:28px; }
.tp-nav-link-wrap { display:inline-flex; align-items:center; gap:4px; }
.tp-nav-link { font-size:14px; font-weight:500; color:var(--ink-2); cursor:pointer; text-decoration:none; }
.tp-nav-link:hover { color:var(--forest); }
.tp-nav-link-cfg { display:inline-flex; align-items:center; justify-content:center; background:transparent; border:none; color:var(--ink-3); cursor:pointer; padding:0; line-height:1; }
.tp-nav-link-cfg:hover { color:var(--forest); }
.tp-nav-link-remove { background:transparent; border:none; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; }
.tp-nav-link-add { background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); padding:3px 8px; border-radius:var(--r); font-family:var(--font-mono); font-size:11px; cursor:pointer; }
.tp-nav-right { display:flex; align-items:center; gap:12px; }
.tp-nav-login { display:inline-flex; align-items:center; gap:7px; font-family:var(--font-display); font-weight:600; font-size:14px; color:var(--ink-2); cursor:pointer; text-decoration:none; }
.tp-nav-login:hover { color:var(--forest); }
.tp-nav-login__lock { width:13px; height:13px; flex:none; }
.tp-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-display); font-weight:600; font-size:14.5px; letter-spacing:-0.005em; padding:13px 22px; border-radius:var(--r); white-space:nowrap; line-height:1; transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease; cursor:pointer; text-decoration:none; border:1px solid transparent; }
.tp-btn--sm { padding:10px 18px; font-size:14px; }
.tp-btn--fill { background:var(--forest); color:var(--paper); }
.tp-btn--fill:hover { background:var(--forest-d); transform:translateY(-1px); }
@media (max-width:1040px){ .tp-nav-links { display:none; } }
@media (max-width:520px){ .tp-nav-login span { display:none; } }
`;
