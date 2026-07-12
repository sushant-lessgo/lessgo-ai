'use client';

// src/modules/templates/atelier/blocks/editPrimitives.tsx
// SHARED edit-mode primitives for every Atelier block core (one place, not per
// block). Backed by AtelierEditable (text), the store (image upload + collection
// writes), and LinkTargetPopover (href editing). Provided to a core via
// <AtelierEditProvider> + the module-level `editPrimitives` object; the core stays
// a pure plain module that only references the AtelierPrimitives contract.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { AtelierEditable } from '../components/AtelierEditable';
import { LinkTargetPopover } from '@/components/editor/LinkTargetPopover';
import { resolveDestination, externalLinkProps } from '@/utils/resolveCtaHref';
import { EditableImageCollection } from '@/app/edit/[token]/components/primitives/EditableImageCollection';
import { resolveAlt } from '@/modules/editing/altText';
import type {
  AtelierPrimitives, AtelierTxtProps, AtelierImgProps, AtelierLinkProps, AtelierListProps,
} from './primitives';

export interface AtelierEditCtx {
  sectionId: string;
  /** Store render mode — threaded into AtelierEditable so preview renders the
   *  static (marker-emitting) path, matching Meridian/Hearth. */
  mode: 'edit' | 'preview' | 'published';
  update: (elementKey: string, value: any) => void;
  updateCollection: (collectionKey: string, value: any[]) => void;
  getCollection: (collectionKey: string) => any[];
  uploadImage?: (file: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>;
  getItemAlt: (collectionKey: string, itemId: string) => string | undefined;
  setItemAlt: (collectionKey: string, itemId: string, alt: string) => void;
  sectionOptions: { value: string; label: string }[];
  pageOptions: { value: string; label: string }[];
}

const Ctx = React.createContext<AtelierEditCtx | null>(null);

export function AtelierEditProvider({ ctx, children }: { ctx: AtelierEditCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

function useCtx(): AtelierEditCtx {
  const c = React.useContext(Ctx);
  if (!c) throw new Error('Atelier edit primitive used outside <AtelierEditProvider>');
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

function saveField(ctx: AtelierEditCtx, elementKey: string, value: any) {
  const p = parsePath(elementKey);
  if (!p) { ctx.update(elementKey, value); return; }
  const arr = ctx.getCollection(p.coll).map((it) => (it.id === p.id ? { ...it, [p.field]: value } : it));
  ctx.updateCollection(p.coll, arr);
}

const Txt: React.FC<AtelierTxtProps> = ({ elementKey, value, as = 'span', className, style, placeholder, multiline, isButton }) => {
  const ctx = useCtx();
  return (
    <AtelierEditable
      as={as}
      mode={ctx.mode}
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

const Img: React.FC<AtelierImgProps> = ({ elementKey, src, alt, className, imgClassName, placeholder, eager }) => {
  const ctx = useCtx();
  const [uploading, setUploading] = React.useState(false);
  const path = parsePath(elementKey);
  const metaAlt = path ? ctx.getItemAlt(path.coll, path.id) : undefined;
  const shownAlt = resolveAlt(metaAlt, path?.id, alt);
  // Non-edit (preview/parity): render the SAME static DOM as publishedPrimitives.Img
  // — no upload/alt affordances, no relative-positioned wrapper — so edit-static ==
  // published (mode-gated, mirroring Meridian). Editing UI only exists in 'edit'.
  if (ctx.mode !== 'edit') {
    return (
      <div className={className}>
        {src ? <img src={src} alt={shownAlt} className={imgClassName} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : placeholder}
      </div>
    );
  }
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !ctx.uploadImage) return;
    setUploading(true);
    try {
      const p = parsePath(elementKey);
      const url = await ctx.uploadImage(file, { sectionId: ctx.sectionId, elementKey });
      if (p && typeof url === 'string') saveField(ctx, elementKey, url);
    } catch { /* surfaced by the store */ }
    finally { setUploading(false); }
  };
  const clear = () => saveField(ctx, elementKey, '');
  const onAlt = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (path) ctx.setItemAlt(path.coll, path.id, e.target.value);
  };
  return (
    <div className={className} style={{ position: 'relative' }}>
      {src ? <img src={src} alt={shownAlt} className={imgClassName} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : placeholder}
      <span className="lg-atelier-img-edit">
        <label className="lg-atelier-img-edit__btn">
          {uploading ? '…' : (src ? 'Replace' : '↥ Image')}
          <input type="file" accept="image/*" onChange={onFile} hidden disabled={uploading} />
        </label>
        {src && <button type="button" className="lg-atelier-img-edit__x" onClick={clear}>Remove</button>}
      </span>
      {path && src && (
        <input
          className="lg-atelier-img-alt"
          value={metaAlt ?? ''}
          placeholder={alt ? `Alt (fallback: ${alt})` : 'Describe this image (alt text)'}
          onChange={onAlt}
        />
      )}
    </div>
  );
};

const Link: React.FC<AtelierLinkProps> = ({ hrefKey, href, className, ariaLabel, children }) => {
  const ctx = useCtx();
  // Non-edit (preview/parity): render the SAME static <a> as publishedPrimitives.Link
  // — no lg-atelier-link-edit wrapper, no LinkTargetPopover trigger — so edit-static
  // == published (mode-gated, mirroring MeridianNavHeader.tsx:133). The href-editing
  // control only exists in 'edit'. CTA analytics attrs mirror the published primitive.
  if (ctx.mode !== 'edit') {
    const target = href || '#';
    const isCta = /cta/i.test(hrefKey) && !/^nav_items/.test(hrefKey);
    const ctaAttrs = isCta
      ? { 'data-lessgo-cta': '', 'data-lessgo-cta-role': /secondary_cta/i.test(hrefKey) ? 'secondary' : 'primary' }
      : {};
    return (
      <a href={target} className={className} aria-label={ariaLabel} {...externalLinkProps(target)} {...ctaAttrs}>
        {children}
      </a>
    );
  }
  return (
    <span className="lg-atelier-link-edit" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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

const List: React.FC<AtelierListProps> = ({ collectionKey, items, render, makeItem, min = 0, max = 99, addLabel = '+ Add', className, itemClassName, reorderable, imageField, captionField }) => {
  const ctx = useCtx();
  // Non-edit (preview/parity): render the SAME static list DOM as
  // publishedPrimitives.List — no EditableImageCollection chrome, no add/remove
  // buttons — so edit-static == published (mode-gated). Collection editing UI only
  // exists in 'edit'. Inner render() uses the (now mode-gated) Txt/Img/Link, so the
  // whole subtree matches published in non-edit.
  if (ctx.mode !== 'edit') {
    return (
      <div className={className}>
        {items.map((item, i) => (
          <div key={item.id ?? i} className={itemClassName}>{render(item, i)}</div>
        ))}
      </div>
    );
  }
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
            <button type="button" className="lg-atelier-list-x" onClick={() => removeAt(i)} title="Remove">×</button>
          )}
        </div>
      ))}
      {makeItem && items.length < max && (
        <button type="button" className="lg-atelier-list-add" onClick={add}>{addLabel}</button>
      )}
    </div>
  );
};

export const editPrimitives: AtelierPrimitives = { Txt, Img, Link, List };

/**
 * Build the edit context every Atelier block wrapper needs, in one place, so the
 * thin `.tsx` wrappers stay ~10 lines.
 */
export function useAtelierEditCtx(
  sectionId: string,
  blockContent: Record<string, any>,
  update: (elementKey: string, value: any) => void,
  updateCollection: (collectionKey: string, value: any[]) => void,
): AtelierEditCtx {
  const mode = useEditStore((s) => (s as any).mode) as 'edit' | 'preview' | 'published' | undefined;
  const sections = useEditStore((s) => (s as any).sections) as string[] | undefined;
  const pages = useEditStore((s) => (s as any).pages);
  const uploadImage = useEditStore((s) => (s as any).uploadImage);
  const elementMetadata = useEditStore(
    (s) => (s as any).content?.[sectionId]?.elementMetadata as
      | Record<string, { alt?: string | Record<string, string> }>
      | undefined,
  );
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
    mode: mode ?? 'edit',
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
 *  by AtelierThemeInjector (edit/preview only). */
export const EDIT_AFFORDANCE_STYLES = `
.lg-atelier-img-edit{ position:absolute; right:8px; bottom:8px; z-index:3; display:inline-flex; gap:6px; }
.lg-atelier-img-edit__btn{ font-family:var(--ff-mono); font-size:11px; letter-spacing:.04em; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:var(--r); padding:5px 9px; cursor:pointer; }
.lg-atelier-img-edit__btn:hover{ border-color:var(--accent); }
.lg-atelier-img-edit__x{ font-family:var(--ff-mono); font-size:11px; color:#fff; background:var(--accent-deep); border:none; border-radius:var(--r); padding:5px 8px; cursor:pointer; }
.lg-atelier-list-x{ position:absolute; top:-8px; right:-8px; z-index:4; width:20px; height:20px; line-height:1; font-size:14px; color:#fff; background:var(--accent-deep); border:none; border-radius:999px; cursor:pointer; opacity:0; transition:opacity .15s; }
.lg-atelier-list-x:hover, *:hover > .lg-atelier-list-x{ opacity:1; }
.lg-atelier-list-add{ font-family:var(--ff-mono); font-size:12px; letter-spacing:.06em; color:var(--accent-deep); background:transparent; border:1px dashed var(--line); border-radius:var(--r); padding:10px 16px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
.lg-atelier-list-add:hover{ border-color:var(--accent); }
.lg-atelier-img-alt{ position:absolute; left:8px; bottom:8px; right:8px; z-index:3; font-family:var(--ff-mono); font-size:11px; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:var(--r); padding:4px 7px; opacity:0; transition:opacity .15s; }
*:hover > .lg-atelier-img-alt, .lg-atelier-img-alt:focus{ opacity:1; }
`;
