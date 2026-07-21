'use client';

// SEO & Social settings panel (SEO track, Phase 2b). Per-page overrides — SEO
// title, meta description, social (OG) image, noindex — stored on the page
// entry's `seo` blob via store.updatePageSeo and published into the static
// <head>. Preview cards render from the REAL buildPageMetadata so what you see
// is exactly what publishes (single source of truth, no drift).
//
// editor-shell-redesign phase 6 — RESKIN ONLY (t16 site settings window + t18
// per-page override panel). The per-page override model already existed; nothing
// about the store wiring, the char meters, the pixel regexes, the Pro gate or
// the metadata builder changed. Two shapes share this file:
//   root page selected → t16 (left nav + SEO pane + side column)
//   sub-page selected  → t18 (General | SEO | Social tabs, tighter fields)
//
// language-settings phase 2 — the 2026-07-16 "no Languages row" ruling was
// REVERSED by the founder: the rail is Domain / SEO / Social & sharing /
// Languages, and this window is now the ONLY place a project declares its
// languages (the editor-header globe was retired). `section` state switches the
// pane; the Languages branch sits BEFORE the `!page` guard because languages are
// site-level and must stay reachable on a project with no page entries.

import React from 'react';
import Link from 'next/link';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import { buildPageMetadata } from '@/lib/staticExport/buildPageMetadata';
import { META_PIXEL_ID_RE, GA4_MEASUREMENT_ID_RE } from '@/lib/staticExport/headTags';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { NavItem, navItemClasses } from '@/components/ui/nav-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { AppIcon } from '@/components/ui/icon';
import { Coming } from '@/components/ui/coming';
import { LanguagesPanel } from './LanguagesPanel';
import { cn } from '@/lib/utils';
import type { PageSeo, ProjectPageEntry } from '@/types/store';

const TITLE_IDEAL = 60;
const TITLE_MAX = 70;
const DESC_IDEAL = 160;
const DESC_MAX = 200;

// t16 field geometry: pad 9px 12px, border #e6e6ec, radius 9.
const FIELD =
  'w-full rounded-app-ctl-sm border border-app-border-hairline bg-app-surface px-3 py-[9px] text-[13px] text-app-ink outline-none transition-colors placeholder:text-app-placeholder focus:border-app-primary disabled:cursor-not-allowed disabled:bg-app-surface-sunken disabled:text-app-placeholder';
// t18 is tighter: radius 8, pad 8px 11px.
const FIELD_TIGHT =
  'w-full rounded-lg border border-app-border-hairline bg-app-surface px-[11px] py-2 text-[12.5px] text-app-ink outline-none transition-colors placeholder:text-app-placeholder focus:border-app-primary';
// t16 labels: 600/11.5 #3a3a44.
const LABEL = 'text-[11.5px] font-semibold text-app-label';

const EYEBROW = 'text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint';

/**
 * Char meter — t16/t18 draw a mono `128 / 160` counter in `#b0b0ba`.
 * The over-ideal amber / within-ideal green TONE is existing BEHAVIOR (it is the
 * meter's whole point) and is preserved; only the neutral state adopts the
 * handoff's placeholder grey.
 */
function CharMeter({ len, ideal }: { len: number; ideal: number }) {
  const tone =
    len === 0 ? 'text-app-placeholder' : len <= ideal ? 'text-app-success' : 'text-amber-600';
  return (
    <span className={cn('font-app-mono text-[11px] tabular-nums', tone)}>
      {len} / {ideal}
    </span>
  );
}

/** t16 header "Saved" dot-pill. Derived read-only from the persistence slice
 *  (same derivation as SaveStateChip). NOT the chip itself — mounting the chip
 *  here would register a second `beforeunload` guard. */
function SavedPill() {
  const { isDirty, isSaving, saveError } = useEditStore(
    useShallow((s) => ({
      isDirty: s.persistence.isDirty,
      isSaving: s.persistence.isSaving,
      saveError: s.persistence.saveError,
    })),
  );
  const view = saveError
    ? { label: 'Save failed', dot: 'bg-app-danger', text: 'text-app-danger' }
    : isSaving || isDirty
      ? { label: 'Saving…', dot: 'bg-app-dim animate-pulse', text: 'text-app-dim' }
      : { label: 'Saved', dot: 'bg-app-success', text: 'text-app-dim' };
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center gap-1.5 text-[12px] font-medium', view.text)}
    >
      <span className={cn('h-[7px] w-[7px] shrink-0 rounded-full', view.dot)} aria-hidden="true" />
      <span>{view.label}</span>
    </div>
  );
}

export function SeoSettingsModal({ onClose }: { onClose: () => void }) {
  // Render-read: pages (tabs + per-page seo), and the active-page working set
  // (currentPageId/sections/content/slug/title) that feeds the live preview meta.
  // updatePageSeo/triggerAutoSave/uploadImage are handler-only.
  // Select the RAW pages record (stable reference between snapshots) and derive
  // the sorted list with useMemo OUTSIDE the selector — calling getPagesList()
  // inside the selector returns a fresh array every snapshot, which prevents
  // useSyncExternalStore from stabilizing ("Maximum update depth exceeded").
  const { pagesMap, currentPageId, sections, content, slug, title, localeCount } = useEditStore(
    useShallow((s) => ({
      pagesMap: s.pages,
      currentPageId: s.currentPageId,
      sections: s.sections,
      content: s.content,
      slug: s.slug,
      title: s.title,
      // Rail badge only — a PRIMITIVE, so the shallow compare stays stable
      // (selecting localeConfig itself would be fine too, but the count is all
      // this component needs; the panel owns the config).
      localeCount: s.localeConfig?.locales?.length ?? 1,
    })),
  );
  const pages = React.useMemo<ProjectPageEntry[]>(() => {
    const entries = Object.values((pagesMap || {}) as Record<string, ProjectPageEntry>);
    return entries.sort((a, b) => {
      if (a.pathSlug === '/') return -1;
      if (b.pathSlug === '/') return 1;
      return a.order - b.order;
    });
  }, [pagesMap]);
  const storeApi = useEditStoreApi();
  const [selectedId, setSelectedId] = React.useState<string>(
    () => pages.find((p) => p.pathSlug === '/')?.id || pages[0]?.id || ''
  );
  // Which pane the rail is showing. SEO was hardcoded-active until phase 2.
  const [section, setSection] = React.useState<'seo' | 'languages'>('seo');
  const [uploading, setUploading] = React.useState<null | 'ogImage' | 'faviconUrl'>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Pro gate (UX only — the real enforcement is the publish-time server strip).
  // Mirror CreditBadge's plan fetch; treat loading as locked (fail-closed UI).
  const [trackingEnabled, setTrackingEnabled] = React.useState(false);
  const [planLoading, setPlanLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/billing/plan');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setTrackingEnabled(!!data?.features?.trackingPixels);
        }
      } catch {
        // fail-closed: leave trackingEnabled false
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const trackingLocked = planLoading || !trackingEnabled;

  const page = pages.find((p) => p.id === selectedId);
  const seo: PageSeo = page?.seo || {};
  const isRoot = page?.pathSlug === '/';

  const patch = (p: Partial<PageSeo>) => page && storeApi.getState().updatePageSeo(page.id, p);

  // Tracking-ID inputs keep raw local state so an in-progress/invalid value stays
  // visible without ever reaching the store (an invalid value would make
  // sanitizeSeo drop the WHOLE seo blob at publish). Only valid or cleared
  // (→ undefined) values are written. Re-sync when the selected page changes.
  const [metaRaw, setMetaRaw] = React.useState('');
  const [ga4Raw, setGa4Raw] = React.useState('');
  const [metaErr, setMetaErr] = React.useState<string | null>(null);
  const [ga4Err, setGa4Err] = React.useState<string | null>(null);
  React.useEffect(() => {
    setMetaRaw(page?.seo?.metaPixelId || '');
    setGa4Raw(page?.seo?.ga4MeasurementId || '');
    setMetaErr(null);
    setGa4Err(null);
  }, [selectedId, page?.seo?.metaPixelId, page?.seo?.ga4MeasurementId]);

  const onMetaChange = (raw: string) => {
    setMetaRaw(raw);
    if (raw === '') {
      setMetaErr(null);
      patch({ metaPixelId: undefined });
    } else if (META_PIXEL_ID_RE.test(raw)) {
      setMetaErr(null);
      patch({ metaPixelId: raw });
    } else {
      setMetaErr('Numeric ID only (e.g. 1234567890123456).');
    }
  };
  const onGa4Change = (raw: string) => {
    const val = raw.toUpperCase();
    setGa4Raw(val);
    if (val === '') {
      setGa4Err(null);
      patch({ ga4MeasurementId: undefined });
    } else if (GA4_MEASUREMENT_ID_RE.test(val)) {
      setGa4Err(null);
      patch({ ga4MeasurementId: val });
    } else {
      setGa4Err('Format: G- followed by letters/numbers (e.g. G-XXXXXXXXXX).');
    }
  };

  const handleClose = () => {
    storeApi.getState().triggerAutoSave?.();
    onClose();
  };

  // `Social & sharing` is WIRED, never greyed (decision 10). The social panel is
  // owned by the GlobalModals singleton; it already listens for the firewall-safe
  // `lessgo:manage-social` window event, so we open it that way rather than
  // importing showSocialModal from GlobalModals (which imports THIS file —
  // a require cycle). Close this window first so the two overlays never stack.
  const openSocial = () => {
    handleClose();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lessgo:manage-social'));
    }
  };

  const upload = async (field: 'ogImage' | 'faviconUrl', file: File | undefined) => {
    if (!file || !page) return;
    setUploading(field);
    setUploadError(null);
    try {
      const url = await storeApi.getState().uploadImage(file);
      if (typeof url === 'string' && url) patch({ [field]: url });
    } catch (e: any) {
      setUploadError(e?.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  // Preview inputs: the ACTIVE page's live copy is the top-level working set
  // (mirror strategy) — its entry in `pages` is only reconciled at commit
  // boundaries, so read the working set for it and the entry for the rest.
  const isActive = page && currentPageId === page.id;
  const previewContent = page
    ? {
        layout: { sections: (isActive ? sections : page.sections) || [] },
        ...((isActive ? content : page.content) || {}),
      }
    : { layout: { sections: [] } };
  const previewSlug = slug || 'your-page';
  const meta = page
    ? buildPageMetadata({
        slug: previewSlug,
        pageTitle: page.title || title || '',
        content: previewContent,
        seo,
        canonicalPath: page.pathSlug,
        baseUrl: 'https://lessgo.ai',
      })
    : null;

  const googlePreview = meta ? (
    // t16 Google preview card — border #eceef2, radius 10. Still rendered from
    // the REAL buildPageMetadata output; no mock markup.
    <div className="rounded-[10px] border border-app-border-pane p-3">
      <div className="flex items-center gap-2">
        {seo.faviconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={seo.faviconUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-contain" />
        ) : (
          <span className="h-6 w-6 shrink-0 rounded-full bg-app-track" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <div className="truncate text-[12px] font-medium text-app-ink">{page?.title || title || 'Your site'}</div>
          <div className="truncate text-[11px] text-app-preview-url">{meta.canonicalURL}</div>
        </div>
      </div>
      <div className="mt-1.5 truncate text-[16px] leading-snug text-app-preview-title">{meta.title}</div>
      <div className="line-clamp-2 text-[12.5px] leading-snug text-app-preview-snippet">{meta.description}</div>
    </div>
  ) : null;

  const indexingToggle = (
    <div className="flex items-center justify-between gap-3 rounded-app-ctl-sm border border-app-border-hairline px-3 py-[9px]">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-app-ink">
          {isRoot ? 'Let search engines index this site' : 'Let search engines index this page'}
        </div>
        <div className="text-[11px] text-app-dim">Turn off while you&apos;re still building</div>
      </div>
      <Switch
        checked={!seo.noIndex}
        onCheckedChange={(v) => patch({ noIndex: v ? undefined : true })}
        // Must track the VISIBLE label above (site vs page) — it was hardcoded to
        // "page" while the root pane says "site", so a screen reader was told the
        // wrong scope for the site-wide switch.
        aria-label={
          isRoot ? 'Let search engines index this site' : 'Let search engines index this page'
        }
        className="shrink-0"
      />
    </div>
  );

  const socialImageControl = (tight?: boolean) => (
    <div>
      <div className={cn(LABEL, 'mb-1.5 block')}>Default social image</div>
      {seo.ogImage ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={seo.ogImage}
            alt="Social share preview"
            className="w-full rounded-app-ctl-sm border border-app-border-hairline object-cover"
            style={{ aspectRatio: '1200 / 630' }}
          />
          <button
            onClick={() => patch({ ogImage: undefined })}
            className="text-[11.5px] font-semibold text-app-primary hover:underline"
          >
            Remove image
          </button>
        </div>
      ) : (
        <ImagePlaceholder
          aspect="1200 / 630"
          rounded="rounded-app-ctl-sm"
          className={cn('w-full flex-col gap-1.5', tight ? 'min-h-[72px]' : 'min-h-[96px]')}
        >
          <span className="rounded bg-app-surface/80 px-1.5 py-0.5 font-app-mono text-[10px] text-app-placeholder">
            1200×630
          </span>
        </ImagePlaceholder>
      )}
      <label className="mt-2 inline-block cursor-pointer text-[11.5px] font-semibold text-app-primary hover:underline">
        {uploading === 'ogImage' ? 'Uploading…' : seo.ogImage ? 'Replace image' : 'Upload image'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading !== null}
          onChange={(e) => upload('ogImage', e.target.files?.[0])}
        />
      </label>
      <p className="mt-1 text-[11px] text-app-dim">Shown when shared. Empty → auto-generated.</p>
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && handleClose()}>
      {/* `.app-chrome` scopes the window's fonts/ink. It sits on the portalled
          DialogContent (outside EditLayout's chrome roots) and NEVER on anything
          containing the canvas. Backgrounds are painted by CHILDREN — `.app-chrome`
          would beat a co-located bg-* utility on this same element.
          `[&>button]:hidden` suppresses DialogContent's built-in corner close so
          the t16 header close (a DialogClose, below) is the only one — the handoff
          draws exactly one. */}
      <DialogContent
        className="app-chrome h-[552px] max-h-[92vh] w-[912px] max-w-[95vw] gap-0 overflow-hidden rounded-app-card border-app-border-strong p-0 shadow-app-window [&>button]:hidden"
      >
        <div className="flex h-full min-h-0 flex-col bg-app-surface font-app-sans text-app-ink">
          {/* Header — 56, bottom border #eceef2 */}
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-app-border-pane px-5">
            <AppIcon
              name={section === 'languages' ? 'language' : 'tune'}
              size={18}
              className="text-app-primary"
            />
            <DialogTitle className="text-[15px] font-bold tracking-normal text-app-ink">
              {section === 'languages' ? 'Site settings · Languages' : 'Site settings'}
            </DialogTitle>
            {/* Radix requires a description (or an explicit opt-out) on every
                DialogContent and logs a console warning on EVERY open without one.
                t16 draws no subtitle in the header, so it is screen-reader-only:
                the warning goes away, the pixels don't move. */}
            <DialogDescription className="sr-only">
              Domain, search-engine (SEO) and social-sharing settings for this site.
            </DialogDescription>
            <div className="flex-1" />
            <SavedPill />
            <DialogClose
              aria-label="Close"
              className="ml-2 rounded-app-badge p-1 text-app-muted transition-colors hover:bg-app-hover hover:text-app-ink"
            >
              <AppIcon name="close" size={18} />
            </DialogClose>
          </div>

          <div className="flex min-h-0 flex-1">
            {/* Left nav — 196, bg #fafafb, right border #eceef2.
                Domain / SEO / Social & sharing / Languages (the last per the
                founder's 2026-07-16 reversal — see the file header). */}
            <nav
              aria-label="Site settings"
              className="w-[196px] shrink-0 space-y-0.5 overflow-y-auto border-r border-app-border-pane bg-app-surface-sunken p-2.5"
            >
              <div className={cn(EYEBROW, 'px-3 pb-1.5 pt-1')}>Site</div>
              {/* Domain — greyed: no domain entry point exists in the editor at all
                  (GlobalModals exports only products/seo/social; the domain modal is
                  local state on the PREVIEW page). */}
              <Coming
                what="custom domain setup"
                side="right"
                className={cn(navItemClasses(false), 'flex gap-3 text-[12.5px]')}
              >
                {/* `public`, not `language`: the handoff gives `language` to the
                    Languages row below, and two rails rows sharing a glyph reads
                    as a bug. The handoff's Domain frame draws `public` too. */}
                <AppIcon name="public" size={20} />
                <span>Domain</span>
              </Coming>
              <NavItem
                active={section === 'seo'}
                activeBar
                icon="search"
                label="SEO"
                onClick={() => setSection('seo')}
                className="text-[12.5px]"
              />
              {/* WIRED — never greyed (decision 10): opens the existing social panel. */}
              <NavItem
                icon="share"
                label="Social & sharing"
                onClick={openSocial}
                className="text-[12.5px]"
              />
              {/* Languages + mono count badge (handoff: blue when active). */}
              <NavItem
                active={section === 'languages'}
                activeBar
                icon="language"
                onClick={() => setSection('languages')}
                className="text-[12.5px]"
              >
                <span className="flex-1">Languages</span>
                <span
                  className={cn(
                    'font-app-mono text-[10px] font-semibold',
                    section === 'languages' ? 'text-app-primary' : 'text-app-faint',
                  )}
                >
                  {localeCount}
                </span>
              </NavItem>
            </nav>

            {/* Pane */}
            <div className="min-h-0 flex-1 overflow-y-auto px-[26px] py-[22px]">
              {/* Languages FIRST — it is site-level, so it must be reachable on a
                  project whose `pages` map is empty (the `!page` guard below
                  would otherwise swallow the whole pane). */}
              {section === 'languages' ? (
                <LanguagesPanel />
              ) : !page ? (
                <div className="p-10 text-center text-[13px] text-app-dim">No pages found.</div>
              ) : (
                <>
                  {pages.length > 1 && (
                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {pages.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedId(p.id)}
                          className={cn(
                            'rounded-app-badge px-2.5 py-1 text-[12px] font-medium transition-colors',
                            p.id === selectedId
                              ? 'bg-app-tint text-app-primary-deep'
                              : 'text-app-dim hover:bg-app-hover hover:text-app-ink'
                          )}
                        >
                          {p.pathSlug === '/' ? 'Home' : p.title || p.pathSlug}
                          {p.seo && Object.keys(p.seo).length > 0 && (
                            <span className="ml-1.5 text-[10px] opacity-60">●</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {isRoot ? (
                    /* ── t16 · site-level SEO pane ─────────────────────────── */
                    <>
                      <h3 className="text-[16px] font-bold text-app-ink">Search engine (SEO)</h3>
                      <p className="mt-0.5 text-[12px] text-app-dim">
                        How this site appears in Google and when shared. Empty fields fall back to
                        your page content.
                      </p>

                      <div className="mt-5 flex gap-[26px]">
                        {/* Main column */}
                        <div className="min-w-0 flex-1 space-y-4">
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <label htmlFor="seo-title" className={LABEL}>
                                Homepage title
                              </label>
                              <CharMeter len={(seo.title || '').length} ideal={TITLE_IDEAL} />
                            </div>
                            <input
                              id="seo-title"
                              value={seo.title || ''}
                              maxLength={TITLE_MAX}
                              onChange={(e) => patch({ title: e.target.value })}
                              placeholder={page.title || 'Page title'}
                              className={FIELD}
                            />
                          </div>

                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <label htmlFor="seo-desc" className={LABEL}>
                                Meta description
                              </label>
                              <CharMeter len={(seo.description || '').length} ideal={DESC_IDEAL} />
                            </div>
                            <textarea
                              id="seo-desc"
                              value={seo.description || ''}
                              maxLength={DESC_MAX}
                              rows={3}
                              onChange={(e) => patch({ description: e.target.value })}
                              placeholder="What this page is about — shown under the title in Google."
                              className={cn(FIELD, 'resize-none')}
                            />
                          </div>

                          {googlePreview}

                          {indexingToggle}

                          <div>
                            <label htmlFor="seo-sdtype" className={cn(LABEL, 'mb-1 block')}>
                              Structured data
                            </label>
                            <select
                              id="seo-sdtype"
                              value={seo.structuredDataType || 'auto'}
                              onChange={(e) =>
                                patch({
                                  structuredDataType:
                                    e.target.value === 'auto'
                                      ? undefined
                                      : (e.target.value as PageSeo['structuredDataType']),
                                })
                              }
                              className={FIELD}
                            >
                              <option value="auto">Automatic (recommended)</option>
                              <option value="Organization">Organization</option>
                              <option value="LocalBusiness">Local business</option>
                              <option value="Service">Service</option>
                              <option value="Product">Product</option>
                              <option value="none">None</option>
                            </select>
                            <p className="mt-1 text-[11px] text-app-dim">
                              Tells Google what kind of business this page represents.
                            </p>
                            {seo.structuredDataType === 'Product' && (
                              <p className="mt-1 text-[11px] text-amber-600">
                                Product markup without prices/reviews can trigger Google Search
                                Console warnings.
                              </p>
                            )}
                          </div>

                          <div>
                            <div className={cn(LABEL, 'mb-1 block')}>Tracking</div>
                            <p className="mb-2 text-[11px] text-app-dim">
                              Applies to every page of your site. Changes take effect after you
                              republish.
                            </p>
                            <div className="space-y-3">
                              <div>
                                <label htmlFor="seo-meta-pixel" className={cn(LABEL, 'mb-1 block')}>
                                  Meta Pixel ID
                                </label>
                                <input
                                  id="seo-meta-pixel"
                                  value={metaRaw}
                                  disabled={trackingLocked}
                                  onChange={(e) => onMetaChange(e.target.value)}
                                  placeholder="1234567890123456"
                                  className={FIELD}
                                />
                                {metaErr && (
                                  <p className="mt-1 text-[11px] text-app-danger">{metaErr}</p>
                                )}
                              </div>
                              <div>
                                <label htmlFor="seo-ga4" className={cn(LABEL, 'mb-1 block')}>
                                  GA4 measurement ID
                                </label>
                                <input
                                  id="seo-ga4"
                                  value={ga4Raw}
                                  disabled={trackingLocked}
                                  onChange={(e) => onGa4Change(e.target.value)}
                                  placeholder="G-XXXXXXXXXX"
                                  className={FIELD}
                                />
                                {ga4Err && <p className="mt-1 text-[11px] text-app-danger">{ga4Err}</p>}
                              </div>
                            </div>
                            {trackingLocked && !planLoading && (
                              <p className="mt-2 text-[11.5px] text-app-dim">
                                Tracking pixels are a Pro feature.{' '}
                                <Link
                                  href="/pricing"
                                  className="font-semibold text-app-primary hover:underline"
                                >
                                  Upgrade to Pro →
                                </Link>
                              </p>
                            )}
                          </div>

                          {uploadError && (
                            <p className="text-[12px] text-app-danger">{uploadError}</p>
                          )}
                        </div>

                        {/* Side column — 184 */}
                        <div className="w-[184px] shrink-0 space-y-5">
                          <div>
                            <div className={cn(LABEL, 'mb-1.5 block')}>Favicon</div>
                            <div className="flex items-center gap-3">
                              {seo.faviconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={seo.faviconUrl}
                                  alt="Favicon"
                                  className="h-10 w-10 shrink-0 rounded-app-ctl-sm border border-app-border-hairline object-contain"
                                />
                              ) : (
                                <ImagePlaceholder
                                  rounded="rounded-app-ctl-sm"
                                  className="h-10 w-10 shrink-0"
                                />
                              )}
                              <div className="flex flex-col items-start gap-0.5">
                                <label className="cursor-pointer text-[11.5px] font-semibold text-app-primary hover:underline">
                                  {uploading === 'faviconUrl'
                                    ? 'Uploading…'
                                    : seo.faviconUrl
                                      ? 'Replace'
                                      : 'Upload'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploading !== null}
                                    onChange={(e) => upload('faviconUrl', e.target.files?.[0])}
                                  />
                                </label>
                                {seo.faviconUrl && (
                                  <button
                                    onClick={() => patch({ faviconUrl: undefined })}
                                    className="text-[11.5px] font-medium text-app-dim hover:text-app-ink"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="mt-1.5 text-[11px] text-app-dim">
                              The little icon in the browser tab.
                            </p>
                          </div>

                          {socialImageControl()}

                          {meta && (
                            <div>
                              <div className={cn(LABEL, 'mb-1.5 block')}>Social card preview</div>
                              <div className="rounded-app-ctl-sm border border-app-border-pane px-2.5 py-2">
                                <div className="truncate text-[12px] font-medium text-app-ink">
                                  {meta.title}
                                </div>
                                <div className="line-clamp-2 text-[11px] text-app-dim">
                                  {meta.description}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Sitemap — greyed. A per-host sitemap route DOES exist
                              (src/app/api/seo/sitemap/route.ts, reached via a
                              middleware rewrite of {publishedHost}/sitemap.xml), but
                              the editor store carries no published host to build the
                              link from (`publishing.publishedUrl` is declared in
                              types/store/state.ts:407 and never assigned anywhere),
                              and this phase adds no fetches. */}
                          <Coming
                            what="the sitemap link"
                            side="left"
                            className="w-full justify-between rounded-app-ctl-sm bg-app-surface-alt px-3 py-2.5 text-[11.5px] font-medium"
                          >
                            <span>Sitemap</span>
                            <AppIcon name="open_in_new" size={16} />
                          </Coming>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ── t18 · per-page overrides ──────────────────────────── */
                    <>
                      <h3 className="text-[14px] font-semibold text-app-ink">
                        Page settings{' '}
                        <span className="text-[12px] font-normal text-app-faint">
                          · {page.title || page.pathSlug}
                        </span>
                      </h3>
                      <p className="mt-1 max-w-[520px] text-[12px] text-app-dim">
                        Overrides, not duplicates. Each field falls back to the site SEO defaults —
                        you only fill in what should differ for this page.
                      </p>

                      <Tabs defaultValue="seo" className="mt-4 max-w-[520px]">
                        {/* t18 tabs: segmented on #f1f1f5, active #fff + #006CFF 600/12 */}
                        <TabsList className="inline-flex gap-0.5 rounded-app-ctl-sm border-0 bg-app-track p-[3px]">
                          {[
                            ['general', 'General'],
                            ['seo', 'SEO'],
                            ['social', 'Social'],
                          ].map(([v, label]) => (
                            <TabsTrigger
                              key={v}
                              value={v}
                              className="-mb-0 rounded-[7px] border-0 px-3 py-1 text-[12px] font-medium text-app-dim hover:text-app-ink aria-selected:bg-app-surface aria-selected:font-semibold aria-selected:text-app-primary aria-selected:shadow-[0_1px_2px_rgba(0,0,0,.07)]"
                            >
                              {label}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        <TabsContent value="general" className="pt-4">
                          {indexingToggle}
                        </TabsContent>

                        <TabsContent value="seo" className="space-y-[13px] pt-4">
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <label htmlFor="seo-title" className={LABEL}>
                                Meta title
                              </label>
                              <CharMeter len={(seo.title || '').length} ideal={TITLE_IDEAL} />
                            </div>
                            <input
                              id="seo-title"
                              value={seo.title || ''}
                              maxLength={TITLE_MAX}
                              onChange={(e) => patch({ title: e.target.value })}
                              placeholder={page.title || 'Page title'}
                              className={FIELD_TIGHT}
                            />
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <label htmlFor="seo-desc" className={LABEL}>
                                Meta description
                              </label>
                              <CharMeter len={(seo.description || '').length} ideal={DESC_IDEAL} />
                            </div>
                            <textarea
                              id="seo-desc"
                              value={seo.description || ''}
                              maxLength={DESC_MAX}
                              rows={3}
                              onChange={(e) => patch({ description: e.target.value })}
                              placeholder="What this page is about — shown under the title in Google."
                              className={cn(FIELD_TIGHT, 'resize-none')}
                            />
                          </div>
                          {googlePreview}
                        </TabsContent>

                        <TabsContent value="social" className="max-w-[280px] pt-4">
                          {socialImageControl(true)}
                          {uploadError && (
                            <p className="mt-2 text-[12px] text-app-danger">{uploadError}</p>
                          )}
                        </TabsContent>
                      </Tabs>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
