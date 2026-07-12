'use client';

// Lumen nav (edit): wordmark + sub + nav links (LinkTargetPopover) + EN·NL
// language toggle + CTA. The toggle drives the Lumen-scoped editLang so the
// founder authors both languages inline (bilingual is Lumen-contained).

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions, deriveNavLinks } from '@/utils/pageLinks';
import { useLumenBlock } from '../../hooks/useLumenBlock';
import { useLumenEditLang } from '../../editLang';
import { LumenEditable } from '../../components/LumenEditable';
import { LinkTargetPopover } from '@/components/editor/LinkTargetPopover';
import type { Link } from '@/types/destination';
import { HEADER_STYLES } from './styles';

const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

interface NavItem { id: string; label?: string; label_nl?: string; href?: string | Link; }
interface LumenNavContent {
  logo_text: string; logo_text_nl: string;
  brand_sub: string; brand_sub_nl: string;
  logo_image: string; cta_text: string; cta_text_nl: string;
  nav_items: NavItem[];
}

export default function LumenNav({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, editLang, handleContentUpdate, handleCollectionUpdate } =
    useLumenBlock<LumenNavContent>({ sectionId });
  const { setEditLang } = useLumenEditLang();
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
    catch { /* surfaced by the store */ }
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
  const addItem = () => navItems.length < 6 && setItems([...navItems, { id: rid('nav'), label: 'Link', label_nl: '', href: '#' }]);
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
      <nav className="lm-nav" data-section-id={sectionId}>
        <div className="lm-nav-in">
          <span className="lm-brand">
            {blockContent.logo_image ? (
              <img className="lm-brand__img" src={blockContent.logo_image} alt={blockContent.logo_text || 'Logo'} loading="eager" decoding="async" />
            ) : (
              <>
                <LumenEditable
                  as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                  content={blockContent} elementKey="logo_text" onSave={handleContentUpdate}
                  enterBehavior="save" className="lm-brand__wm" placeholder="Studio."
                />
                <LumenEditable
                  as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                  content={blockContent} elementKey="brand_sub" onSave={handleContentUpdate}
                  enterBehavior="save" className="lm-brand__sub" placeholder="Photography"
                />
              </>
            )}
            {edit && (
              <span className="lm-logo-edit">
                <label className="lm-logo-edit__btn">
                  {logoUploading ? 'Uploading…' : (blockContent.logo_image ? 'Change logo' : '↥ Logo')}
                  <input type="file" accept="image/*" onChange={onLogoFile} hidden disabled={logoUploading} />
                </label>
                {blockContent.logo_image && (
                  <button type="button" className="lm-logo-edit__x" onClick={() => handleContentUpdate('logo_image', '')}>remove</button>
                )}
              </span>
            )}
          </span>

          <div className="lm-nav-links">
            {navItems.map((item) => (
              <span key={item.id} className="lm-nav-link-wrap">
                <LumenEditable
                  as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                  content={item} elementKey="label"
                  onSave={(key, v) => patchItem(item.id, { [key]: v })}
                  enterBehavior="save" placeholder="Link"
                />
                {edit && (
                  <>
                    <LinkTargetPopover
                      value={item.href || '#'}
                      sectionOptions={sectionOptions}
                      pageOptions={pageOptions}
                      legalOptions={legalOptions}
                      socialOptions={socialOptions}
                      onChange={(link) => patchItem(item.id, { href: link })}
                      triggerClassName="lm-nav-link-cfg"
                    />
                    {navItems.length > 2 && (
                      <button type="button" className="lm-nav-edit-x" onClick={() => removeItem(item.id)} aria-label="Remove link">×</button>
                    )}
                  </>
                )}
              </span>
            ))}
            {edit && navItems.length < 6 && (
              <button type="button" className="lm-nav-edit-add" onClick={addItem}>+ link</button>
            )}
          </div>

          <div className="lm-nav-cta">
            <div className="lm-lang" role="group" aria-label="Language (edit)">
              <button type="button" aria-pressed={editLang === 'en'} onClick={() => setEditLang('en')}>EN</button>
              <button type="button" aria-pressed={editLang === 'nl'} onClick={() => setEditLang('nl')}>NL</button>
            </div>
            <LumenEditable
              as="span" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="cta_text" onSave={handleContentUpdate}
              enterBehavior="save" isButton={editLang === 'en'}
              className="lm-btn lm-btn--fill lm-btn--sm" placeholder="Request a quote"
            />
          </div>
        </div>
      </nav>
    </>
  );
}
