'use client';

// SEO & Social settings panel (SEO track, Phase 2b). Per-page overrides — SEO
// title, meta description, social (OG) image, noindex — stored on the page
// entry's `seo` blob via store.updatePageSeo and published into the static
// <head>. Preview cards render from the REAL buildPageMetadata so what you see
// is exactly what publishes (single source of truth, no drift).

import React from 'react';
import Link from 'next/link';
import { useEditStore } from '@/hooks/useEditStoreLegacy';
import { buildPageMetadata } from '@/lib/staticExport/buildPageMetadata';
import { META_PIXEL_ID_RE, GA4_MEASUREMENT_ID_RE } from '@/lib/staticExport/headTags';
import type { PageSeo, ProjectPageEntry } from '@/types/store';

const TITLE_IDEAL = 60;
const TITLE_MAX = 70;
const DESC_IDEAL = 160;
const DESC_MAX = 200;

function CharMeter({ len, ideal, max }: { len: number; ideal: number; max: number }) {
  const tone = len === 0 ? 'text-gray-300' : len <= ideal ? 'text-green-600' : 'text-amber-600';
  return (
    <span className={`text-xs tabular-nums ${tone}`}>
      {len}/{ideal}
    </span>
  );
}

export function SeoSettingsModal({ onClose }: { onClose: () => void }) {
  const store = useEditStore();
  const pages: ProjectPageEntry[] = store.getPagesList ? store.getPagesList() : [];
  const [selectedId, setSelectedId] = React.useState<string>(
    () => pages.find((p) => p.pathSlug === '/')?.id || pages[0]?.id || ''
  );
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

  const patch = (p: Partial<PageSeo>) => page && store.updatePageSeo(page.id, p);

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
    store.triggerAutoSave?.();
    onClose();
  };

  const upload = async (field: 'ogImage' | 'faviconUrl', file: File | undefined) => {
    if (!file || !page) return;
    setUploading(field);
    setUploadError(null);
    try {
      const url = await store.uploadImage(file);
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
  const isActive = page && store.currentPageId === page.id;
  const previewContent = page
    ? {
        layout: { sections: (isActive ? store.sections : page.sections) || [] },
        ...((isActive ? store.content : page.content) || {}),
      }
    : { layout: { sections: [] } };
  const previewSlug = store.slug || 'your-page';
  const meta = page
    ? buildPageMetadata({
        slug: previewSlug,
        pageTitle: page.title || store.title || '',
        content: previewContent,
        seo,
        canonicalPath: page.pathSlug,
        baseUrl: 'https://lessgo.ai',
      })
    : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div className="w-full max-w-3xl max-h-[85vh] overflow-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">SEO &amp; Tracking</h2>
            <p className="text-sm text-gray-500">How each page appears in Google and when shared. Empty fields fall back to your page content.</p>
          </div>
          <button onClick={handleClose} aria-label="Close" className="rounded-md px-2 py-1.5 text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        {/* Page selector */}
        {pages.length > 1 && (
          <div className="flex gap-1 overflow-x-auto border-b bg-gray-50 px-5 py-2">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                  p.id === selectedId ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p.pathSlug === '/' ? 'Home' : p.title || p.pathSlug}
                {p.seo && Object.keys(p.seo).length > 0 && <span className="ml-1.5 text-xs opacity-60">●</span>}
              </button>
            ))}
          </div>
        )}

        {!page ? (
          <div className="p-10 text-center text-gray-500">No pages found.</div>
        ) : (
          <div className="grid gap-6 p-5 md:grid-cols-2">
            {/* Left: fields */}
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="seo-title" className="text-sm font-medium text-gray-700">SEO title</label>
                  <CharMeter len={(seo.title || '').length} ideal={TITLE_IDEAL} max={TITLE_MAX} />
                </div>
                <input
                  id="seo-title"
                  value={seo.title || ''}
                  maxLength={TITLE_MAX}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder={page.title || 'Page title'}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="seo-desc" className="text-sm font-medium text-gray-700">Meta description</label>
                  <CharMeter len={(seo.description || '').length} ideal={DESC_IDEAL} max={DESC_MAX} />
                </div>
                <textarea
                  id="seo-desc"
                  value={seo.description || ''}
                  maxLength={DESC_MAX}
                  rows={3}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="What this page is about — shown under the title in Google."
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Social share image</label>
                <p className="mb-2 text-xs text-gray-400">Shown when the page is shared (1200×630 works best). Empty → auto-generated.</p>
                {seo.ogImage ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={seo.ogImage} alt="Social share preview" className="h-16 w-28 rounded-md border object-cover" />
                    <button onClick={() => patch({ ogImage: undefined })} className="rounded-md border px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-50">Remove</button>
                  </div>
                ) : (
                  <label className="inline-block cursor-pointer rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                    {uploading === 'ogImage' ? 'Uploading…' : 'Upload image'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading !== null}
                      onChange={(e) => upload('ogImage', e.target.files?.[0])} />
                  </label>
                )}
              </div>

              {isRoot && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Favicon</label>
                  <p className="mb-2 text-xs text-gray-400">The little icon in the browser tab. Applies to the whole site.</p>
                  {seo.faviconUrl ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={seo.faviconUrl} alt="Favicon" className="h-8 w-8 rounded border object-contain" />
                      <button onClick={() => patch({ faviconUrl: undefined })} className="rounded-md border px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-50">Remove</button>
                    </div>
                  ) : (
                    <label className="inline-block cursor-pointer rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      {uploading === 'faviconUrl' ? 'Uploading…' : 'Upload favicon'}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading !== null}
                        onChange={(e) => upload('faviconUrl', e.target.files?.[0])} />
                    </label>
                  )}
                </div>
              )}

              {isRoot && (
                <div>
                  <label htmlFor="seo-sdtype" className="mb-1 block text-sm font-medium text-gray-700">Structured data</label>
                  <p className="mb-2 text-xs text-gray-400">Tells Google what kind of business this page represents.</p>
                  <select
                    id="seo-sdtype"
                    value={seo.structuredDataType || 'auto'}
                    onChange={(e) =>
                      patch({
                        structuredDataType:
                          e.target.value === 'auto' ? undefined : (e.target.value as PageSeo['structuredDataType']),
                      })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="auto">Automatic (recommended)</option>
                    <option value="Organization">Organization</option>
                    <option value="LocalBusiness">Local business</option>
                    <option value="Service">Service</option>
                    <option value="Product">Product</option>
                    <option value="none">None</option>
                  </select>
                  {seo.structuredDataType === 'Product' && (
                    <p className="mt-1 text-xs text-amber-600">
                      Product markup without prices/reviews can trigger Google Search Console warnings.
                    </p>
                  )}
                </div>
              )}

              {isRoot && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tracking</label>
                  <p className="mb-2 text-xs text-gray-400">Applies to every page of your site. Changes take effect after you republish.</p>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="seo-meta-pixel" className="mb-1 block text-xs font-medium text-gray-600">Meta Pixel ID</label>
                      <input
                        id="seo-meta-pixel"
                        value={metaRaw}
                        disabled={trackingLocked}
                        onChange={(e) => onMetaChange(e.target.value)}
                        placeholder="1234567890123456"
                        className="w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      {metaErr && <p className="mt-1 text-xs text-red-600">{metaErr}</p>}
                    </div>

                    <div>
                      <label htmlFor="seo-ga4" className="mb-1 block text-xs font-medium text-gray-600">GA4 measurement ID</label>
                      <input
                        id="seo-ga4"
                        value={ga4Raw}
                        disabled={trackingLocked}
                        onChange={(e) => onGa4Change(e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      {ga4Err && <p className="mt-1 text-xs text-red-600">{ga4Err}</p>}
                    </div>
                  </div>

                  {trackingLocked && !planLoading && (
                    <p className="mt-2 text-xs text-gray-500">
                      Tracking pixels are a Pro feature.{' '}
                      <Link href="/pricing" className="font-semibold text-gray-900 underline hover:text-gray-700">
                        Upgrade to Pro →
                      </Link>
                    </p>
                  )}
                </div>
              )}

              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

              <label className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={!!seo.noIndex}
                  onChange={(e) => patch({ noIndex: e.target.checked || undefined })}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-700">Hide this page from Google</span>
                  <span className="block text-xs text-gray-400">Adds a noindex tag and leaves the page out of your sitemap.</span>
                </span>
              </label>
            </div>

            {/* Right: live previews from the real metadata builder */}
            {meta && (
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Google preview</div>
                  <div className="rounded-lg border p-3">
                    <div className="truncate text-xs text-gray-600">{meta.canonicalURL}</div>
                    <div className="truncate text-lg leading-snug text-blue-700">{meta.title}</div>
                    <div className="line-clamp-2 text-sm text-gray-600">{meta.description}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Social card preview</div>
                  <div className="overflow-hidden rounded-lg border">
                    {seo.ogImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={seo.ogImage} alt="" className="aspect-[1200/630] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[1200/630] w-full items-center justify-center bg-gray-100 text-xs text-gray-400">
                        Auto-generated share image
                      </div>
                    )}
                    <div className="border-t px-3 py-2">
                      <div className="truncate text-sm font-medium text-gray-900">{meta.title}</div>
                      <div className="line-clamp-2 text-xs text-gray-500">{meta.description}</div>
                    </div>
                  </div>
                </div>
                {seo.noIndex && (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    This page won&apos;t appear in search results after the next publish.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
