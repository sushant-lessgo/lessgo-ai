'use client';

// src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx
// TechPremium header (Phase 4): brand, nav links with optional Products dropdown,
// Platform-login, Book-a-demo CTA, mobile burger + panel. Edit mode. Dropdown +
// mobile behaviors are wired on published by naayom.v1.js; here the dropdown menu
// renders static-open (data-edit) so children are editable.

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { LinkTargetPopover } from '@/components/editor/LinkTargetPopover';
import { useEditStore } from '@/hooks/useEditStore';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions, deriveNavLinks } from '@/utils/pageLinks';
import type { Link } from '@/types/destination';
import { resolveLogo } from '@/modules/editing/resolveLogo';
import { EditableLogo } from '@/app/edit/[token]/components/primitives/EditableLogo';
import { NAV_STYLES } from './navStyles';

interface NavChild { id: string; label: string; desc: string; href: string }
interface NavItem { id: string; label: string; href: string | Link; children?: NavChild[] }
interface TechPremiumNavContent {
  logo_text: string; cta_text: string; cta_href: string;
  signin_text: string; signin_url: string; logo_image: string;
  nav_items: NavItem[];
}
interface Props { sectionId: string }

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;
const Lock = () => (<svg className="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
const Chev = () => (<svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>);
const Burger = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>);

// Edit-only logo upload affordance (not rendered on published).
const LOGO_EDIT_CSS = `
.tp-logo-edit { display:inline-flex; align-items:center; gap:6px; margin-left:8px; }
.tp-logo-edit__btn { display:inline-flex; align-items:center; gap:4px; font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.04em; color:var(--ink-3); border:1px dashed var(--line-2); border-radius:var(--r); padding:3px 8px; cursor:pointer; white-space:nowrap; }
.tp-logo-edit__btn:hover { color:var(--forest); border-color:var(--forest); }
.tp-logo-edit__x { background:transparent; border:none; color:var(--ink-3); font-family:var(--font-mono); font-size:10.5px; cursor:pointer; }
.tp-logo-edit__x:hover { color:var(--forest); }
`;

export default function TechPremiumNav({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumNavContent>({ sectionId });
  const edit = mode === 'edit';
  const navItems = blockContent.nav_items || [];

  const sections = useEditStore((s) => s.sections);
  const pages = useEditStore((s) => s.pages);
  const socialMediaConfig = useEditStore((s) => s.socialMediaConfig);
  const legalPages = useEditStore((s) => s.legalPages);
  const globalSettings = useEditStore((s) => s.globalSettings);
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

  // scale-04 (phase 6): seed the nav from the sitemap ONCE when it has no items
  // yet (fresh multi-page project). Seed-only — hand-edited navs are untouched.
  const seededNavRef = React.useRef(false);
  React.useEffect(() => {
    if (!edit || seededNavRef.current || navItems.length > 0) return;
    const derived = deriveNavLinks(pages);
    if (derived.length > 1) {
      seededNavRef.current = true;
      handleCollectionUpdate('nav_items', derived);
    }
  }, [edit, navItems.length, pages, handleCollectionUpdate]);

  const [openDrop, setOpenDrop] = React.useState<string | null>(null);
  // Site-scoped logo (editor phase-3): resolved identically on edit + published.
  const logo = resolveLogo(
    globalSettings,
    { logo_image: blockContent.logo_image, wordmark: blockContent.logo_text },
    'light',
  );

  const setItems = (next: NavItem[]) => handleCollectionUpdate('nav_items', next);
  const patchItem = (id: string, p: Partial<NavItem>) => setItems(navItems.map((n) => (n.id === id ? { ...n, ...p } : n)));
  const addItem = () => navItems.length < 5 && setItems([...navItems, { id: rid('nav'), label: 'Link', href: '#' }]);
  const removeItem = (id: string) => navItems.length > 2 && setItems(navItems.filter((n) => n.id !== id));
  const addChild = (id: string) => {
    const item = navItems.find((n) => n.id === id); if (!item) return;
    patchItem(id, { children: [...(item.children || []), { id: rid('c'), label: 'Item', desc: '', href: '#' }] });
  };
  const patchChild = (id: string, cid: string, p: Partial<NavChild>) => {
    const item = navItems.find((n) => n.id === id); if (!item) return;
    patchItem(id, { children: (item.children || []).map((c) => (c.id === cid ? { ...c, ...p } : c)) });
  };
  const removeChild = (id: string, cid: string) => {
    const item = navItems.find((n) => n.id === id); if (!item) return;
    patchItem(id, { children: (item.children || []).filter((c) => c.id !== cid) });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NAV_STYLES + LOGO_EDIT_CSS }} />
      <nav className="tp-nav" data-section-id={sectionId} data-edit={edit ? '1' : undefined}>
        <div className="tp-nav-in">
          <span className="tp-brand">
            {logo.kind === 'image' ? <img className="tp-brand__img" src={logo.url} alt={blockContent.logo_text || 'Logo'} loading="eager" decoding="async" /> : <span className="tp-brand__mk" aria-hidden="true" />}
            {logo.kind === 'wordmark' && (
              <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey="logo_text" value={blockContent.logo_text} onSave={(v) => handleContentUpdate('logo_text', v)} enterBehavior="save" className="tp-brand__wm" placeholder="Brand" />
            )}
            {edit && (
              <EditableLogo surface="light" classNames={{ wrap: 'tp-logo-edit', btn: 'tp-logo-edit__btn', remove: 'tp-logo-edit__x' }} />
            )}
          </span>

          <div className="tp-nav-links">
            {navItems.map((item) => {
              const hasChildren = (item.children || []).length > 0;
              if (!hasChildren) {
                return (
                  <span key={item.id} className="tp-nav-link-wrap">
                    <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`nav_items_label_${item.id}`} value={item.label} onSave={(v) => patchItem(item.id, { label: v })} enterBehavior="save" placeholder="Link" />
                    {edit && (
                      <>
                        <LinkTargetPopover value={item.href ?? '#'} sectionOptions={sectionOptions} pageOptions={pageOptions} legalOptions={legalOptions} socialOptions={socialOptions} onChange={(link) => patchItem(item.id, { href: link })} triggerClassName="tp-nav-edit-x" />
                        <button type="button" className="tp-nav-edit-add" onClick={() => { addChild(item.id); setOpenDrop(item.id); }} title="Make dropdown">▾</button>
                        {navItems.length > 2 && <button type="button" className="tp-nav-edit-x" onClick={() => removeItem(item.id)} aria-label="Remove">×</button>}
                      </>
                    )}
                  </span>
                );
              }
              return (
                <div key={item.id} className={`tp-nav-drop${edit && openDrop === item.id ? ' is-open' : ''}`}>
                  <div className="tp-nav-drop-t">
                    <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`nav_items_label_${item.id}`} value={item.label} onSave={(v) => patchItem(item.id, { label: v })} enterBehavior="save" placeholder="Menu" />
                    {edit
                      ? <button type="button" className="tp-nav-drop-caret" onClick={() => setOpenDrop(openDrop === item.id ? null : item.id)} aria-label="Edit menu items"><Chev /></button>
                      : <Chev />}
                    {edit && navItems.length > 2 && <button type="button" className="tp-nav-edit-x" onClick={() => removeItem(item.id)} aria-label="Remove">×</button>}
                  </div>
                  <div className="tp-nav-drop-menu">
                    {(item.children || []).map((c) => (
                      <a key={c.id} href={edit ? undefined : c.href}>
                        <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`nav_items_${item.id}_child_${c.id}_label`} value={c.label} onSave={(v) => patchChild(item.id, c.id, { label: v })} enterBehavior="save" className="tp-nav-child-b" placeholder="Label" />
                        <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`nav_items_${item.id}_child_${c.id}_desc`} value={c.desc} onSave={(v) => patchChild(item.id, c.id, { desc: v })} enterBehavior="save" placeholder="One-line description" />
                        {edit && (
                          <span style={{ display: 'inline-flex', gap: 6, marginTop: 4 }}>
                            <input className="tp-nav-edit-href" value={c.href} onChange={(e) => patchChild(item.id, c.id, { href: e.target.value })} placeholder="/products" />
                            <button type="button" className="tp-nav-edit-x" onClick={() => removeChild(item.id, c.id)}>remove</button>
                          </span>
                        )}
                      </a>
                    ))}
                    {edit && <button type="button" className="tp-nav-edit-add" onClick={() => addChild(item.id)}>+ item</button>}
                  </div>
                </div>
              );
            })}
            {edit && navItems.length < 5 && <button type="button" className="tp-nav-edit-add" onClick={addItem}>+ link</button>}
          </div>

          <div className="tp-nav-cta">
            <span className="tp-nav-login">
              <Lock />
              <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey="signin_text" value={blockContent.signin_text} onSave={(v) => handleContentUpdate('signin_text', v)} enterBehavior="save" isButton placeholder="Platform login" />
            </span>
            <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey="cta_text" value={blockContent.cta_text} onSave={(v) => handleContentUpdate('cta_text', v)} enterBehavior="save" isButton className="tp-btn tp-btn--fill" placeholder="Book a demo" />
            <button type="button" className="tp-nav-burger" aria-label="Menu"><Burger /></button>
          </div>
        </div>
      </nav>
    </>
  );
}
