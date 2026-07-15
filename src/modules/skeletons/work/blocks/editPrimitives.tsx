'use client';

// src/modules/skeletons/work/blocks/editPrimitives.tsx
// SHARED edit-mode primitives for every work-skeleton block core (one place, not
// per block). Backed by InlineTextEditorV2 (text), the store (image upload +
// collection writes), and LinkTargetPopover (href editing). Provided to a core via
// <WorkEditProvider> + the module-level `editPrimitives` object; the core stays a
// pure plain module that only references the WorkPrimitives contract.
//
// granth `editPrimitives` clone, adapted, PLUS the two new shared primitives
// `Logo` + `Nav`. Logo/Nav are PURE attribute emitters — they render through the
// shared Txt/Img/Link/List primitives (which already emit `data-element-key` /
// `data-section-id` so the shell Text/Image/Link/Section toolbars auto-consume) —
// they add NO bespoke upload buttons, popovers, or NavigationEditor of their own.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { InlineTextEditorV2 } from '@/app/edit/[token]/components/editor/InlineTextEditorV2';
import { useIsElementExcluded } from '@/modules/templates/shared/elementExclusion';
import { buildSectionLinkOptions } from '@/utils/sectionAnchors';
import { buildPageLinkOptions } from '@/utils/pageLinks';
import { LinkTargetPopover } from '@/components/editor/LinkTargetPopover';
import { resolveDestination } from '@/utils/resolveCtaHref';
import type {
  WorkPrimitives, WorkTxtProps, WorkImgProps, WorkLinkProps, WorkListProps,
  WorkLogoProps, WorkNavProps, WorkTag,
} from './primitives';

export interface WorkEditCtx {
  sectionId: string;
  update: (elementKey: string, value: any) => void;
  updateCollection: (collectionKey: string, value: any[]) => void;
  getCollection: (collectionKey: string) => any[];
  uploadImage?: (file: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>;
  sectionOptions: { value: string; label: string }[];
  pageOptions: { value: string; label: string }[];
}

const Ctx = React.createContext<WorkEditCtx | null>(null);

export function WorkEditProvider({ ctx, children }: { ctx: WorkEditCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

function useCtx(): WorkEditCtx {
  const c = React.useContext(Ctx);
  if (!c) throw new Error('Work edit primitive used outside <WorkEditProvider>');
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

function saveField(ctx: WorkEditCtx, elementKey: string, value: any) {
  const p = parsePath(elementKey);
  if (!p) { ctx.update(elementKey, value); return; }
  const arr = ctx.getCollection(p.coll).map((it) => (it.id === p.id ? { ...it, [p.field]: value } : it));
  ctx.updateCollection(p.coll, arr);
}

// Inline contentEditable wrapper (granth GranthEditable, inlined so the skeleton
// carries no extra component file). Emits `data-section-id`/`data-element-key` so
// the shell toolbars consume it.
const Editable: React.FC<{
  sectionId: string;
  elementKey: string;
  value: string;
  as: WorkTag;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  isButton?: boolean;
  onSave: (key: string, value: string) => void;
}> = ({ sectionId, elementKey, value, as, className = '', style, placeholder = '', multiline = false, isButton = false, onSave }) => {
  const Tag = as as any;
  const isHtml = /<[^>]*>/.test(value || '');
  const [editing, setEditing] = React.useState(false);
  const isElExcluded = useIsElementExcluded(sectionId, elementKey);
  if (isElExcluded) return null;

  // Button mode: selectable (non-editing) until double-clicked.
  if (isButton && !editing) {
    const buttonProps = {
      className: `${className} cursor-pointer`,
      style,
      'data-section-id': sectionId,
      'data-element-key': elementKey,
      role: 'button' as const,
      tabIndex: 0,
      title: 'Click for button settings · double-click to edit text',
      onDoubleClick: () => setEditing(true),
    };
    return isHtml
      ? <Tag {...buttonProps} dangerouslySetInnerHTML={{ __html: value || placeholder }} />
      : <Tag {...buttonProps}>{value || placeholder}</Tag>;
  }

  return (
    <InlineTextEditorV2
      content={value || ''}
      onContentChange={(next) => onSave(elementKey, next)}
      element={(as === 'small' || as === 'label' || as === 'blockquote' || as === 'cite' || as === 'b'
        ? (as === 'b' ? 'span' : 'p')
        : as) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'}
      elementKey={elementKey}
      sectionId={sectionId}
      enterBehavior={multiline ? 'newline' : 'save'}
      multiline={multiline}
      preserveHtml={true}
      className={className}
      style={style}
      placeholder={placeholder}
      autoFocus={isButton}
      onEditingChange={isButton ? (e) => { if (!e) setEditing(false); } : undefined}
    />
  );
};

const Txt: React.FC<WorkTxtProps> = ({ elementKey, value, as = 'span', className, style, placeholder, multiline, isButton }) => {
  const ctx = useCtx();
  return (
    <Editable
      sectionId={ctx.sectionId}
      elementKey={elementKey}
      value={value ?? ''}
      as={as}
      className={className}
      style={style}
      placeholder={placeholder}
      multiline={multiline}
      isButton={isButton}
      onSave={(k, v) => saveField(ctx, k, v)}
    />
  );
};

const Img: React.FC<WorkImgProps> = ({ elementKey, src, alt, className, imgClassName, placeholder, eager }) => {
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
      if (p && typeof url === 'string') saveField(ctx, elementKey, url);
    } catch { /* surfaced by the store */ }
    finally { setUploading(false); }
  };
  const clear = () => saveField(ctx, elementKey, '');
  return (
    <div
      className={className}
      style={{ position: 'relative' }}
      data-section-id={ctx.sectionId}
      data-element-key={elementKey}
    >
      {src ? <img src={src} alt={alt || ''} className={imgClassName} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : placeholder}
      <span className="wk-img-edit">
        <label className="wk-img-edit__btn">
          {uploading ? '…' : (src ? 'Replace' : '↥ Image')}
          <input type="file" accept="image/*" onChange={onFile} hidden disabled={uploading} />
        </label>
        {src && <button type="button" className="wk-img-edit__x" onClick={clear}>Remove</button>}
      </span>
    </div>
  );
};

const Link: React.FC<WorkLinkProps> = ({ hrefKey, href, className, ariaLabel, children }) => {
  const ctx = useCtx();
  return (
    <span className="wk-link-edit" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className={className} aria-label={ariaLabel} data-section-id={ctx.sectionId} data-element-key={hrefKey}>{children}</span>
      <LinkTargetPopover
        value={href || ''}
        sectionOptions={ctx.sectionOptions}
        pageOptions={ctx.pageOptions}
        onChange={(link) => saveField(ctx, hrefKey, resolveDestination(link.dest))}
      />
    </span>
  );
};

const List: React.FC<WorkListProps> = ({ collectionKey, items, render, makeItem, min = 0, max = 99, addLabel = '+ Add', className, itemClassName }) => {
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
            <button type="button" className="wk-list-x" onClick={() => removeAt(i)} title="Remove">×</button>
          )}
        </div>
      ))}
      {makeItem && items.length < max && (
        <button type="button" className="wk-list-add" onClick={add}>{addLabel}</button>
      )}
    </div>
  );
};

// Logo: home-linked image-or-text. Attribute-driven via the shared Img/Txt
// primitives (which carry data-element-key/data-section-id) — no bespoke UI.
const Logo: React.FC<WorkLogoProps> = ({ imageKey, textKey, src, text, hrefKey, href, className, imgClassName, textClassName, alt }) => {
  const ctx = useCtx();
  const home = href || '/';
  return (
    <a
      href={home}
      className={className}
      data-wk-logo=""
      data-section-id={ctx.sectionId}
      data-element-key={hrefKey || 'logo_href'}
      onClick={(e) => e.preventDefault()}
    >
      {src
        ? <Img elementKey={imageKey} src={src} alt={alt} className={imgClassName} eager />
        : <Txt elementKey={textKey} value={text} as="span" className={textClassName} />}
    </a>
  );
};

// Nav: renders a nav_links collection as a row of editable Links. Reuses List +
// Link + Txt — no NavigationEditor.
const Nav: React.FC<WorkNavProps> = ({
  collectionKey, items, labelField = 'label', hrefField = 'href',
  className, itemClassName, linkClassName, makeItem, min, max, addLabel,
}) => {
  return (
    <List
      collectionKey={collectionKey}
      items={items}
      makeItem={makeItem}
      min={min}
      max={max}
      addLabel={addLabel}
      className={className}
      itemClassName={itemClassName}
      render={(item) => (
        <Link
          hrefKey={`${collectionKey}.${item.id}.${hrefField}`}
          href={item?.[hrefField]}
        >
          <Txt
            elementKey={`${collectionKey}.${item.id}.${labelField}`}
            value={item?.[labelField]}
            as="span"
            className={linkClassName}
          />
        </Link>
      )}
    />
  );
};

export const editPrimitives: WorkPrimitives = { Txt, Img, Link, List, Logo, Nav };

/**
 * Build the edit context every work block wrapper needs, in one place, so the thin
 * `.tsx` wrappers stay ~10 lines. `blockContent` (resolved, incl. collections)
 * backs getCollection; sections/pages/uploadImage come from the store.
 */
export function useWorkEditCtx(
  sectionId: string,
  blockContent: Record<string, any>,
  update: (elementKey: string, value: any) => void,
  updateCollection: (collectionKey: string, value: any[]) => void,
): WorkEditCtx {
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

/** Small CSS for the edit-only affordances (image/list controls). Appended by the
 *  edit-side ThemeInjector only; the published SSRTokens omit it. */
export const EDIT_AFFORDANCE_STYLES = `
.wk-img-edit{ position:absolute; right:8px; bottom:8px; z-index:3; display:inline-flex; gap:6px; }
.wk-img-edit__btn{ font-family:var(--wk-ff-body); font-size:11px; letter-spacing:.04em; color:var(--wk-ink); background:var(--wk-paper); border:1px solid var(--wk-line); border-radius:var(--wk-r); padding:5px 9px; cursor:pointer; }
.wk-img-edit__btn:hover{ border-color:var(--wk-accent); }
.wk-img-edit__x{ font-family:var(--wk-ff-body); font-size:11px; color:var(--wk-paper); background:var(--wk-accent); border:none; border-radius:var(--wk-r); padding:5px 8px; cursor:pointer; }
.wk-list-x{ position:absolute; top:-8px; right:-8px; z-index:4; width:20px; height:20px; line-height:1; font-size:14px; color:var(--wk-paper); background:var(--wk-accent); border:none; border-radius:999px; cursor:pointer; opacity:0; transition:opacity .15s; }
.wk-list-x:hover, *:hover > .wk-list-x{ opacity:1; }
.wk-list-add{ font-family:var(--wk-ff-body); font-size:12px; letter-spacing:.06em; color:var(--wk-accent); background:transparent; border:1px dashed var(--wk-line); border-radius:var(--wk-r); padding:10px 16px; cursor:pointer; }
.wk-list-add:hover{ border-color:var(--wk-accent); }
`;
