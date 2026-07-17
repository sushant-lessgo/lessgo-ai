'use client';

// Surge header (edit): brand-mark (↗) + nav links + primary CTA. Grid auto/1fr/auto.
// Consumes the shared service header contract.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions, deriveNavLinks } from '@/utils/pageLinks';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { LinkPicker } from '@/components/editor/LinkPicker';
import type { Link } from '@/types/destination';
import { HEADER_STYLES } from './styles';

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

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
  const patchItem = (id: string, p: Partial<NavItem>) => setItems(navItems.map((n) => (n.id === id ? { ...n, ...p } : n)));
  const addItem = () => navItems.length < 5 && setItems([...navItems, { id: rid('nav'), label: 'Link', href: '#' }]);
  const removeItem = (id: string) => navItems.length > 2 && setItems(navItems.filter((n) => n.id !== id));

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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEADER_STYLES }} />
      <nav className="sg-nav" data-section-id={sectionId}>
        <div className="sg-nav-in">
        <div className="sg-brand">
          {blockContent.logo_image ? (
            <img className="sg-brand__img" src={blockContent.logo_image} alt={blockContent.logo_text || 'Logo'} loading="eager" decoding="async" />
          ) : (
            <>
              <span className="sg-brand__mark" />
              <SurgeEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="logo_text"
                value={blockContent.logo_text}
                onSave={(v) => handleContentUpdate('logo_text', v)}
                enterBehavior="save"
                placeholder="Studio name"
              />
            </>
          )}
          {edit && (
            <span className="sg-logo-edit">
              <label className="sg-logo-edit__btn">
                {logoUploading ? 'Uploading…' : (blockContent.logo_image ? 'Change logo' : '↥ Logo')}
                <input type="file" accept="image/*" onChange={onLogoFile} hidden disabled={logoUploading} />
              </label>
              {blockContent.logo_image && (
                <button type="button" className="sg-logo-edit__x" onClick={() => handleContentUpdate('logo_image', '')}>remove</button>
              )}
            </span>
          )}
        </div>
        <div className="sg-nav-mid">
          {navItems.map((item) => (
            <span key={item.id} className="sg-nav-link-wrap">
              <SurgeEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey={`nav_items_label_${item.id}`}
                value={item.label}
                onSave={(v) => patchItem(item.id, { label: v })}
                enterBehavior="save"
                placeholder="Link"
              />
              {edit && (
                <>
                  <LinkPicker
                    value={item.href ?? '#'}
                    sectionOptions={sectionOptions}
                    pageOptions={pageOptions}
                    legalOptions={legalOptions}
                    socialOptions={socialOptions}
                    onChange={(link) => patchItem(item.id, { href: link })}
                    triggerClassName="sg-nav-link-cfg"
                  />
                  {navItems.length > 2 && (
                    <button type="button" className="sg-nav-edit-x" onClick={() => removeItem(item.id)} aria-label="Remove link">×</button>
                  )}
                </>
              )}
            </span>
          ))}
          {edit && navItems.length < 5 && (
            <button type="button" className="sg-nav-edit-add" onClick={addItem}>+ link</button>
          )}
        </div>
        <div className="sg-nav-right">
          <SurgeEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="cta_text"
            value={blockContent.cta_text}
            onSave={(v) => handleContentUpdate('cta_text', v)}
            enterBehavior="save"
            isButton
            className="sg-btn sg-btn--primary sg-btn--sm"
            placeholder="Book a growth audit"
          />
        </div>
        </div>
      </nav>
    </>
  );
}
