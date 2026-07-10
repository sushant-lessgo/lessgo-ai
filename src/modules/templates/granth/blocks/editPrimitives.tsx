'use client';

// src/modules/templates/granth/blocks/editPrimitives.tsx
// SHARED edit-mode primitives for every Granth block core (one place, not per
// block). Backed by GranthEditable (text), the store (image upload + collection
// writes), and LinkTargetPopover (href editing). Provided to a core via
// <GranthEditProvider> + the module-level `editPrimitives` object; the core stays
// a pure plain module that only references the GranthPrimitives contract.

import React from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { GranthEditable } from '../components/GranthEditable';
import { LinkTargetPopover } from '@/components/editor/LinkTargetPopover';
import { resolveDestination } from '@/utils/resolveCtaHref';
import type {
  GranthPrimitives, GranthTxtProps, GranthImgProps, GranthLinkProps, GranthListProps,
} from './primitives';

export interface GranthEditCtx {
  sectionId: string;
  update: (elementKey: string, value: any) => void;
  updateCollection: (collectionKey: string, value: any[]) => void;
  getCollection: (collectionKey: string) => any[];
  uploadImage?: (file: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>;
  sectionOptions: { value: string; label: string }[];
  pageOptions: { value: string; label: string }[];
}

const Ctx = React.createContext<GranthEditCtx | null>(null);

export function GranthEditProvider({ ctx, children }: { ctx: GranthEditCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

function useCtx(): GranthEditCtx {
  const c = React.useContext(Ctx);
  if (!c) throw new Error('Granth edit primitive used outside <GranthEditProvider>');
  return c;
}

/** Parse a collection-item path 'coll.<id>.field' → parts, or null for a scalar key. */
function parsePath(key: string): { coll: string; id: string; field: string } | null {
  const i = key.indexOf('.');
  if (i < 0) return null;
  const j = key.indexOf('.', i + 1);
  if (j < 0) return null;
  return { coll: key.slice(0, i), id: key.slice(i + 1, j), field: key.slice(j + 1) };
}

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function saveField(ctx: GranthEditCtx, elementKey: string, value: any) {
  const p = parsePath(elementKey);
  if (!p) { ctx.update(elementKey, value); return; }
  const arr = ctx.getCollection(p.coll).map((it) => (it.id === p.id ? { ...it, [p.field]: value } : it));
  ctx.updateCollection(p.coll, arr);
}

const Txt: React.FC<GranthTxtProps> = ({ elementKey, value, as = 'span', className, style, placeholder, multiline, isButton }) => {
  const ctx = useCtx();
  return (
    <GranthEditable
      as={as}
      mode="edit"
      sectionId={ctx.sectionId}
      content={{ [elementKey]: value ?? '' }}
      elementKey={elementKey}
      onSave={(k, v) => saveField(ctx, k, v)}
      className={className}
      style={style}
      placeholder={placeholder}
      multiline={multiline}
      enterBehavior={multiline ? 'newline' : 'save'}
      isButton={isButton}
    />
  );
};

const Img: React.FC<GranthImgProps> = ({ elementKey, src, alt, className, imgClassName, placeholder }) => {
  const ctx = useCtx();
  const [uploading, setUploading] = React.useState(false);
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !ctx.uploadImage) return;
    setUploading(true);
    try {
      const p = parsePath(elementKey);
      const url = await ctx.uploadImage(file, { sectionId: ctx.sectionId, elementKey });
      // Collection-item image: the store writes by elementKey; also patch the item
      // so the resolved collection value carries the new src.
      if (p && typeof url === 'string') saveField(ctx, elementKey, url);
    } catch { /* surfaced by the store */ }
    finally { setUploading(false); }
  };
  const clear = () => saveField(ctx, elementKey, '');
  return (
    <div className={className} style={{ position: 'relative' }}>
      {src ? <img src={src} alt={alt || ''} className={imgClassName} /> : placeholder}
      <span className="gr-img-edit">
        <label className="gr-img-edit__btn">
          {uploading ? '…' : (src ? 'बदलें' : '↥ चित्र')}
          <input type="file" accept="image/*" onChange={onFile} hidden disabled={uploading} />
        </label>
        {src && <button type="button" className="gr-img-edit__x" onClick={clear}>हटाएँ</button>}
      </span>
    </div>
  );
};

const Link: React.FC<GranthLinkProps> = ({ hrefKey, href, className, ariaLabel, children }) => {
  const ctx = useCtx();
  return (
    <span className="gr-link-edit" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className={className} aria-label={ariaLabel}>{children}</span>
      <LinkTargetPopover
        value={href || ''}
        sectionOptions={ctx.sectionOptions}
        pageOptions={ctx.pageOptions}
        onChange={(link) => saveField(ctx, hrefKey, resolveDestination(link.dest))}
      />
    </span>
  );
};

const List: React.FC<GranthListProps> = ({ collectionKey, items, render, makeItem, min = 0, max = 99, addLabel = '+ जोड़ें', className, itemClassName }) => {
  const ctx = useCtx();
  const add = () => {
    if (!makeItem || items.length >= max) return;
    ctx.updateCollection(collectionKey, [...items, { id: genId(collectionKey), ...makeItem() }]);
  };
  const removeAt = (idx: number) => {
    if (items.length <= min) return;
    ctx.updateCollection(collectionKey, items.filter((_, i) => i !== idx));
  };
  return (
    <div className={className}>
      {items.map((item, i) => (
        <div key={item.id ?? i} className={itemClassName} style={{ position: 'relative' }}>
          {render(item, i)}
          {items.length > min && (
            <button type="button" className="gr-list-x" onClick={() => removeAt(i)} title="हटाएँ">×</button>
          )}
        </div>
      ))}
      {makeItem && items.length < max && (
        <button type="button" className="gr-list-add" onClick={add}>{addLabel}</button>
      )}
    </div>
  );
};

export const editPrimitives: GranthPrimitives = { Txt, Img, Link, List };

/**
 * Build the edit context every Granth block wrapper needs, in one place, so the
 * thin `.tsx` wrappers stay ~10 lines. `blockContent` (resolved, incl. collections)
 * backs getCollection; sections/pages/uploadImage come from the store.
 */
export function useGranthEditCtx(
  sectionId: string,
  blockContent: Record<string, any>,
  update: (elementKey: string, value: any) => void,
  updateCollection: (collectionKey: string, value: any[]) => void,
): GranthEditCtx {
  const sections = useEditStore((s) => (s as any).sections) as string[] | undefined;
  const pages = useEditStore((s) => (s as any).pages);
  const uploadImage = useEditStore((s) => (s as any).uploadImage);
  const sectionOptions = React.useMemo(() => buildSectionLinkOptions(sections || []), [sections]);
  const pageOptions = React.useMemo(() => buildPageLinkOptions(pages), [pages]);
  const contentRef = React.useRef(blockContent);
  contentRef.current = blockContent;
  return {
    sectionId,
    update,
    updateCollection,
    getCollection: (k) => (contentRef.current?.[k] as any[]) || [],
    uploadImage,
    sectionOptions,
    pageOptions,
  };
}

/** Small CSS for the edit-only affordances (image/list/link controls). Injected
 *  once by GranthEditProvider consumers via the block styles; kept here so the
 *  markup and its chrome stay together. */
export const EDIT_AFFORDANCE_STYLES = `
.gr-img-edit{ position:absolute; right:8px; bottom:8px; z-index:3; display:inline-flex; gap:6px; }
.gr-img-edit__btn{ font-family:var(--font-caption); font-size:11px; letter-spacing:.04em; color:var(--ink); background:var(--paper); border:1px solid var(--hairline); border-radius:var(--r); padding:5px 9px; cursor:pointer; }
.gr-img-edit__btn:hover{ border-color:var(--accent); }
.gr-img-edit__x{ font-family:var(--font-caption); font-size:11px; color:var(--paper); background:var(--accent); border:none; border-radius:var(--r); padding:5px 8px; cursor:pointer; }
.gr-list-x{ position:absolute; top:-8px; right:-8px; z-index:4; width:20px; height:20px; line-height:1; font-size:14px; color:var(--paper); background:var(--accent); border:none; border-radius:999px; cursor:pointer; opacity:0; transition:opacity .15s; }
.gr-list-x:hover, *:hover > .gr-list-x{ opacity:1; }
.gr-list-add{ font-family:var(--font-caption); font-size:12px; letter-spacing:.06em; color:var(--accent); background:transparent; border:1px dashed var(--hairline); border-radius:var(--r); padding:10px 16px; cursor:pointer; }
.gr-list-add:hover{ border-color:var(--accent); }
`;
