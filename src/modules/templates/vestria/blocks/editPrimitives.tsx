'use client';

// src/modules/templates/vestria/blocks/editPrimitives.tsx
// SHARED edit-mode primitives for every Vestria block core (one place, not per
// block). Backed by VestriaEditable (text), the store (image upload + collection
// writes), and LinkPicker (href editing). Provided to a core via
// <VestriaEditProvider> + the module-level `editPrimitives` object; the core stays
// a pure plain module that only references the VestriaPrimitives contract.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { VestriaEditable } from '../components/VestriaEditable';
import { LinkPicker } from '@/components/editor/LinkPicker';
import { resolveDestination } from '@/utils/resolveCtaHref';
import { EditableImageCollection } from '@/app/edit/[token]/components/primitives/EditableImageCollection';
import { resolveAlt } from '@/modules/editing/altText';
import type {
  VestriaPrimitives, VestriaTxtProps, VestriaImgProps, VestriaLinkProps, VestriaListProps,
} from './primitives';

export interface VestriaEditCtx {
  sectionId: string;
  /**
   * Editor mode, read ONCE in `useVestriaEditCtx` (never per primitive — a page
   * renders hundreds of Txt nodes; per-node store subscriptions would be a perf
   * regression). `'preview'` ⇒ every primitive renders the SAME markup MINUS its
   * edit affordance, so preview matches the published page.
   */
  mode?: 'edit' | 'preview';
  update: (elementKey: string, value: any) => void;
  updateCollection: (collectionKey: string, value: any[]) => void;
  getCollection: (collectionKey: string) => any[];
  uploadImage?: (file: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>;
  // editor phase-3 (phase 6) — per-item alt (imageCollection). Backed by the store
  // `setItemAlt` writer + a read of this section's elementMetadata; canonical store
  // is elementMetadata[collKey].alt[itemId] (2026-07-11 law).
  getItemAlt: (collectionKey: string, itemId: string) => string | undefined;
  setItemAlt: (collectionKey: string, itemId: string, alt: string) => void;
  sectionOptions: { value: string; label: string }[];
  pageOptions: { value: string; label: string }[];
}

const Ctx = React.createContext<VestriaEditCtx | null>(null);

export function VestriaEditProvider({ ctx, children }: { ctx: VestriaEditCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

function useCtx(): VestriaEditCtx {
  const c = React.useContext(Ctx);
  if (!c) throw new Error('Vestria edit primitive used outside <VestriaEditProvider>');
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

function saveField(ctx: VestriaEditCtx, elementKey: string, value: any) {
  const p = parsePath(elementKey);
  if (!p) { ctx.update(elementKey, value); return; }
  const arr = ctx.getCollection(p.coll).map((it) => (it.id === p.id ? { ...it, [p.field]: value } : it));
  ctx.updateCollection(p.coll, arr);
}

const Txt: React.FC<VestriaTxtProps> = ({ elementKey, value, as = 'span', className, style, placeholder, multiline, isButton }) => {
  const ctx = useCtx();
  return (
    <VestriaEditable
      as={as}
      mode={ctx.mode === 'preview' ? 'preview' : 'edit'}
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

const Img: React.FC<VestriaImgProps> = ({ elementKey, src, alt, className, imgClassName, placeholder, eager }) => {
  const ctx = useCtx();
  const [uploading, setUploading] = React.useState(false);
  // editor phase-3 (phase 6): the alt input is owned HERE (the image affordance) so
  // it serves both single-image slots and collection items, and stays colocated with
  // the image it describes. Canonical store = elementMetadata (via ctx.setItemAlt);
  // the `alt` prop is the SIBLING FALLBACK (e.g. item.title). The chrome
  // (EditableImageCollection) deliberately does NOT render an alt input — single alt
  // editor per image.
  const path = parsePath(elementKey);
  const metaAlt = path ? ctx.getItemAlt(path.coll, path.id) : undefined;
  const shownAlt = resolveAlt(metaAlt, path?.id, alt);
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
  const onAlt = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (path) ctx.setItemAlt(path.coll, path.id, e.target.value);
  };
  const preview = ctx.mode === 'preview';
  return (
    <div className={className} style={preview ? undefined : { position: 'relative' }}>
      {src ? <img src={src} alt={shownAlt} className={imgClassName} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : placeholder}
      {!preview && (
        <>
          <span className="vs-img-edit">
            <label className="vs-img-edit__btn">
              {uploading ? '…' : (src ? 'Replace' : '↥ Image')}
              <input type="file" accept="image/*" onChange={onFile} hidden disabled={uploading} />
            </label>
            {src && <button type="button" className="vs-img-edit__x" onClick={clear}>Remove</button>}
          </span>
          {path && src && (
            <input
              className="vs-img-alt"
              value={metaAlt ?? ''}
              placeholder={alt ? `Alt (fallback: ${alt})` : 'Describe this image (alt text)'}
              onChange={onAlt}
            />
          )}
        </>
      )}
    </div>
  );
};

const Link: React.FC<VestriaLinkProps> = ({ hrefKey, href, className, ariaLabel, children }) => {
  const ctx = useCtx();
  if (ctx.mode === 'preview') {
    return (
      <span className="vs-link-edit">
        <span className={className} aria-label={ariaLabel}>{children}</span>
      </span>
    );
  }
  return (
    <span className="vs-link-edit" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className={className} aria-label={ariaLabel}>{children}</span>
      <LinkPicker
        value={href || ''}
        sectionOptions={ctx.sectionOptions}
        pageOptions={ctx.pageOptions}
        onChange={(link) => saveField(ctx, hrefKey, resolveDestination(link.dest))}
      />
    </span>
  );
};

const List: React.FC<VestriaListProps> = ({ collectionKey, items, render, makeItem, min = 0, max = 99, addLabel = '+ Add', className, itemClassName, reorderable, imageField, captionField }) => {
  const ctx = useCtx();
  // Preview: plain items, no add/remove/reorder chrome (also skips the
  // EditableImageCollection editor below — it IS chrome).
  if (ctx.mode === 'preview') {
    return (
      <div className={className}>
        {items.map((item, i) => (
          <div key={item.id ?? i} className={itemClassName}>{render(item, i)}</div>
        ))}
      </div>
    );
  }
  // editor phase-3 (phase 6): an imageCollection slot (declares reorderable and/or
  // imageField) DELEGATES its entire edit chrome to the shared EditableImageCollection
  // — the existing add/remove branch below is NOT used for these lists, so there is
  // exactly ONE editor for the collection. All chrome mutations still flow through
  // ctx.updateCollection (the single whole-array writer).
  if (reorderable || imageField) {
    return (
      <EditableImageCollection
        collectionKey={collectionKey}
        items={items}
        imageField={imageField || 'image'}
        onChange={(next) => ctx.updateCollection(collectionKey, next)}
        makeItem={makeItem}
        min={min}
        max={max}
        reorderable={!!reorderable}
        captionField={captionField}
        render={render}
        className={className}
        itemClassName={itemClassName}
        addLabel={addLabel}
      />
    );
  }
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
            <button type="button" className="vs-list-x" onClick={() => removeAt(i)} title="Remove">×</button>
          )}
        </div>
      ))}
      {makeItem && items.length < max && (
        <button type="button" className="vs-list-add" onClick={add}>{addLabel}</button>
      )}
    </div>
  );
};

export const editPrimitives: VestriaPrimitives = { Txt, Img, Link, List };

/**
 * Build the edit context every Vestria block wrapper needs, in one place, so the
 * thin `.tsx` wrappers stay ~10 lines. `blockContent` (resolved, incl. collections)
 * backs getCollection; sections/pages/uploadImage come from the store.
 */
export function useVestriaEditCtx(
  sectionId: string,
  blockContent: Record<string, any>,
  update: (elementKey: string, value: any) => void,
  updateCollection: (collectionKey: string, value: any[]) => void,
): VestriaEditCtx {
  const sections = useEditStore((s) => (s as any).sections) as string[] | undefined;
  const pages = useEditStore((s) => (s as any).pages);
  const uploadImage = useEditStore((s) => (s as any).uploadImage);
  // editor phase-3 (phase 6): thread this section's elementMetadata + the store
  // setItemAlt writer into the ctx so E.Img can read/write per-item alt. Narrow
  // selector (only this section's metadata) — legacy blocks with no alt read undefined.
  const elementMetadata = useEditStore(
    (s) => (s as any).content?.[sectionId]?.elementMetadata as
      | Record<string, { alt?: string | Record<string, string> }>
      | undefined,
  );
  // ONE mode subscription for the whole block (never per primitive — see VestriaEditCtx).
  const mode = useEditStore((s) => (s as any).mode) as 'edit' | 'preview' | undefined;
  const setItemAltAction = useEditStore((s) => (s as any).setItemAlt) as
    | ((sectionId: string, collectionKey: string, itemId: string, alt: string) => void)
    | undefined;
  const sectionOptions = React.useMemo(() => buildSectionLinkOptions(sections || []), [sections]);
  const pageOptions = React.useMemo(() => buildPageLinkOptions(pages), [pages]);
  const contentRef = React.useRef(blockContent);
  contentRef.current = blockContent;
  const metaRef = React.useRef(elementMetadata);
  metaRef.current = elementMetadata;
  return {
    sectionId,
    mode,
    update,
    updateCollection,
    getCollection: (k) => (contentRef.current?.[k] as any[]) || [],
    uploadImage,
    getItemAlt: (collKey, itemId) => {
      const alt = metaRef.current?.[collKey]?.alt;
      return alt && typeof alt === 'object' ? alt[itemId] : undefined;
    },
    setItemAlt: (collKey, itemId, alt) => setItemAltAction?.(sectionId, collKey, itemId, alt),
    sectionOptions,
    pageOptions,
  };
}

/** Small CSS for the edit-only affordances (image/list/link controls). Injected
 *  by VestriaThemeInjector (edit/preview only); kept here so the markup and its
 *  chrome stay together. */
export const EDIT_AFFORDANCE_STYLES = `
.vs-img-edit{ position:absolute; right:8px; bottom:8px; z-index:3; display:inline-flex; gap:6px; }
.vs-img-edit__btn{ font-family:var(--ff-mono); font-size:11px; letter-spacing:.04em; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:var(--r); padding:5px 9px; cursor:pointer; }
.vs-img-edit__btn:hover{ border-color:var(--accent); }
.vs-img-edit__x{ font-family:var(--ff-mono); font-size:11px; color:#fff; background:var(--accent-deep); border:none; border-radius:var(--r); padding:5px 8px; cursor:pointer; }
.vs-list-x{ position:absolute; top:-8px; right:-8px; z-index:4; width:20px; height:20px; line-height:1; font-size:14px; color:#fff; background:var(--accent-deep); border:none; border-radius:999px; cursor:pointer; opacity:0; transition:opacity .15s; }
.vs-list-x:hover, *:hover > .vs-list-x{ opacity:1; }
.vs-list-add{ font-family:var(--ff-mono); font-size:12px; letter-spacing:.06em; color:var(--accent-deep); background:transparent; border:1px dashed var(--line); border-radius:var(--r); padding:10px 16px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
.vs-list-add:hover{ border-color:var(--accent); }
.vs-ic-add{ display:inline-flex; gap:8px; align-items:center; }
.vs-ic-drag{ position:absolute; top:-8px; left:-8px; z-index:4; width:20px; height:20px; line-height:1; font-size:12px; color:#fff; background:var(--ink); border:none; border-radius:999px; cursor:grab; opacity:0; transition:opacity .15s; touch-action:none; }
.vs-ic-drag:active{ cursor:grabbing; }
.vs-ic-drag:hover, *:hover > .vs-ic-drag{ opacity:1; }
.vs-img-alt{ position:absolute; left:8px; bottom:8px; right:8px; z-index:3; font-family:var(--ff-mono); font-size:11px; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:var(--r); padding:4px 7px; opacity:0; transition:opacity .15s; }
*:hover > .vs-img-alt, .vs-img-alt:focus{ opacity:1; }
.vs-ic-caption{ display:block; width:100%; margin-top:6px; font-family:var(--ff-mono); font-size:11px; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:var(--r); padding:4px 7px; }
`;
