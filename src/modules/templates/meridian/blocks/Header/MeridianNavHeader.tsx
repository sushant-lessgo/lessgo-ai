'use client';

// src/modules/templates/meridian/blocks/Header/MeridianNavHeader.tsx
// Meridian header: geometric brand-mark + nav links + sign-in + primary CTA. Edit mode.
// Reference: Meridian - Modern Tech.html lines 1167-1178, .nav (CSS ~286-).

import React from 'react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';

interface NavItem {
  id: string;
  label: string;
  href: string;
}

interface MeridianNavHeaderContent {
  logo_text: string;
  cta_text: string;
  signin_text: string;
  logo_image: string;
  nav_items: NavItem[];
}

interface MeridianNavHeaderProps {
  sectionId: string;
}

export default function MeridianNavHeader({ sectionId }: MeridianNavHeaderProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useMeridianBlock<MeridianNavHeaderContent>({ sectionId });

  const navItems = blockContent.nav_items || [];

  const updateNavLabel = (id: string, label: string) => {
    handleCollectionUpdate(
      'nav_items',
      navItems.map((n) => (n.id === id ? { ...n, label } : n))
    );
  };

  const addNavItem = () => {
    if (navItems.length >= 5) return;
    handleCollectionUpdate('nav_items', [
      ...navItems,
      { id: `nav${Date.now()}`, label: 'Link', href: '#' },
    ]);
  };

  const removeNavItem = (id: string) => {
    if (navItems.length <= 2) return;
    handleCollectionUpdate('nav_items', navItems.filter((n) => n.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <nav className="mrd-nav" data-section-id={sectionId}>
        <div className="mrd-nav__left">
          <div className="mrd-brand">
            {blockContent.logo_image ? (
              <img className="mrd-brand-img" src={blockContent.logo_image} alt="" data-element-key="logo_image" />
            ) : (
              <div className="mrd-brand-mark" aria-hidden="true" />
            )}
            <MeridianEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="logo_text"
              value={blockContent.logo_text}
              onSave={(v) => handleContentUpdate('logo_text', v)}
              enterBehavior="save"
              placeholder="brand"
            />
          </div>
          <div className="mrd-nav-links">
            {navItems.map((item) => (
              <span key={item.id} className="mrd-nav-link-wrap">
                <MeridianEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey={`nav_items_label_${item.id}`}
                  value={item.label}
                  onSave={(v) => updateNavLabel(item.id, v)}
                  enterBehavior="save"
                  className="mrd-nav-link"
                  placeholder="Link"
                />
                {mode === 'edit' && navItems.length > 2 && (
                  <button
                    type="button"
                    className="mrd-nav-link-remove"
                    onClick={() => removeNavItem(item.id)}
                    aria-label="Remove link"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {mode === 'edit' && navItems.length < 5 && (
              <button type="button" className="mrd-nav-link-add" onClick={addNavItem}>
                + link
              </button>
            )}
          </div>
        </div>
        <div className="mrd-nav-right">
          <MeridianEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="signin_text"
            value={blockContent.signin_text}
            onSave={(v) => handleContentUpdate('signin_text', v)}
            enterBehavior="save"
            isButton
            className="mrd-btn mrd-btn--quiet mrd-btn--sm"
            placeholder="Sign in"
          />
          <MeridianEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="cta_text"
            value={blockContent.cta_text}
            onSave={(v) => handleContentUpdate('cta_text', v)}
            enterBehavior="save"
            isButton
            className="mrd-btn mrd-btn--primary mrd-btn--sm mrd-btn--arrow"
            placeholder="Start free"
          />
        </div>
      </nav>
    </>
  );
}

const STYLES = `
.mrd-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px var(--sec-pad-x);
  border-bottom: 1px solid var(--line);
  background: color-mix(in oklch, var(--ink) 80%, transparent);
  backdrop-filter: blur(8px);
  font-family: var(--font-body);
}
.mrd-nav__left { display: flex; align-items: center; gap: 28px; }
.mrd-brand {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--font-display); font-weight: 600; font-size: 15px;
  letter-spacing: -0.01em; color: var(--bone);
}
.mrd-brand-mark {
  width: 22px; height: 22px; border: 1px solid var(--bone);
  border-radius: 5px; position: relative; flex-shrink: 0;
}
.mrd-brand-mark::after {
  content: ""; position: absolute; inset: 4px;
  background: var(--accent); border-radius: 2px;
}
.mrd-brand-img { width: 22px; height: 22px; border-radius: 5px; object-fit: cover; }
.mrd-nav-links { display: flex; align-items: center; gap: 28px; font-size: 13.5px; }
.mrd-nav-link-wrap { display: inline-flex; align-items: center; gap: 4px; }
.mrd-nav-link { color: var(--bone-2); cursor: pointer; }
.mrd-nav-link:hover { color: var(--bone); }
.mrd-nav-link-remove {
  background: transparent; border: none; color: var(--bone-3);
  font-size: 13px; line-height: 1; cursor: pointer;
}
.mrd-nav-link-add {
  background: transparent; border: 1px dashed var(--line-strong);
  color: var(--bone-3); padding: 3px 8px; border-radius: var(--r-sm);
  font-family: var(--font-mono); font-size: 11px; cursor: pointer;
}
.mrd-nav-right { display: flex; align-items: center; gap: 10px; }
.mrd-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-weight: 500; font-size: 13.5px;
  letter-spacing: -0.005em; border-radius: var(--r-md); padding: 10px 14px;
  transition: all 140ms ease; border: 1px solid transparent;
  cursor: pointer; text-decoration: none;
}
.mrd-btn--sm { padding: 7px 11px; font-size: 12.5px; }
.mrd-btn--primary { background: var(--accent); color: var(--accent-ink); }
.mrd-btn--primary:hover { filter: brightness(1.06); }
.mrd-btn--quiet { color: var(--bone-2); }
.mrd-btn--quiet:hover { color: var(--bone); }
.mrd-btn--arrow::after { content: "→"; font-family: var(--font-mono); font-size: 13px; }
[data-variant="marketing"] .mrd-btn { border-radius: 12px; font-family: var(--font-body); font-weight: 500; }
[data-variant="marketing"] .mrd-btn--arrow::after { font-family: var(--font-body); }
`;
