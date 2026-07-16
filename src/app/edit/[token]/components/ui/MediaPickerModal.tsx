'use client';

// MediaPickerModal — the t7 media picker (media-library-picker phase 4).
//
// One Radix Dialog with two tabs:
//   - Library/Upload: this project's MediaAsset registry (GET /api/media) + a file
//     input posting to /api/upload-image (which writes the registry row via the
//     phase-2 seam, so the grid picks it up on refresh).
//   - Stock: Pexels via POST /api/images/search, pick → POST /api/proxy-image so the
//     photo is COPIED to our blob (never hotlink `photos[].url` — published pages are
//     static snapshots and hotlinks rot).
//
// "From CMS" is stubbed behind SHOW_CMS_TAB=false — CMS boards don't exist yet.
//
// This modal REPLACES the old in-file StockPhotosPanel of ImageToolbar and must carry
// its template-aware behaviors forward verbatim (palette-enriched queries, the six
// category buttons, curated-on-mount) — dropping them would silently degrade stock
// relevance platform-wide with no test to catch it.
//
// Open state is owned by the invoking toolbar (local useState), NOT useModalManager
// (that queue is onboarding-oriented) — same as StyleBrowserModal/ElementToggleModal.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEditStore } from '@/hooks/useEditStore';
import type { StockPhoto } from '@/services/pexelsApi';
// Palette mood phrase comes from the PRELOADED template module (EditablePageRenderer
// loads it before any toolbar can exist) — a sync read of a memoized cache, so this is
// firewall-legal: no static template import lands in the shared editor bundle.
import { getServiceImageQuery } from '@/modules/audience/service/imageKeywords';
import { getLoadedTemplate } from '@/modules/templates/registry';
import type { TemplateId } from '@/types/service';
import { usesTemplateModule } from '@/types/service';

/** From-CMS: no CMS boards exist yet. Kept as a visible seam. TODO(t8/E2): wire. */
const SHOW_CMS_TAB = false;

export type MediaPickerTab = 'library' | 'stock';

type StockCategory = 'featured' | 'business' | 'tech' | 'people' | 'nature' | 'lifestyle';

const CATEGORIES: { key: StockCategory; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'business', label: 'Business' },
  { key: 'tech', label: 'Tech' },
  { key: 'people', label: 'People' },
  { key: 'nature', label: 'Nature' },
  { key: 'lifestyle', label: 'Lifestyle' },
];

interface MediaAssetDto {
  id: string;
  url: string;
  source: string;
  width: number | null;
  height: number | null;
  /** null for SVG uploads and for proxy cache-hit backfill rows — always have a fallback. */
  blurDataUrl: string | null;
  alt: string | null;
}

interface MediaPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: MediaPickerTab;
  tokenId: string | null | undefined;
  onPick: (url: string) => void;
}

export function MediaPickerModal({
  open,
  onOpenChange,
  initialTab = 'library',
  tokenId,
  onPick,
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<MediaPickerTab>(initialTab);

  // Re-seed the tab each time the modal is opened from a different action.
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const handlePick = useCallback(
    (url: string) => {
      onPick(url);
      onOpenChange(false);
    },
    [onPick, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl"
        data-testid="media-picker"
        // The toolbar lives inside the editor canvas; clicks inside the modal must not
        // bubble back out and dismiss the toolbar/selection underneath.
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as MediaPickerTab)}>
          <TabsList>
            <TabsTrigger value="library" data-testid="media-picker-tab-library">
              Library
            </TabsTrigger>
            <TabsTrigger value="stock" data-testid="media-picker-tab-stock">
              Stock
            </TabsTrigger>
            {SHOW_CMS_TAB && <TabsTrigger value="cms">From CMS</TabsTrigger>}
          </TabsList>

          <TabsContent value="library" className="pt-4">
            <LibraryTab tokenId={tokenId} onPick={handlePick} />
          </TabsContent>

          <TabsContent value="stock" className="pt-4">
            <StockTab tokenId={tokenId} onPick={handlePick} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ Library */

function LibraryTab({
  tokenId,
  onPick,
}: {
  tokenId: string | null | undefined;
  onPick: (url: string) => void;
}) {
  const [assets, setAssets] = useState<MediaAssetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/media?tokenId=${encodeURIComponent(tokenId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAssets(data.assets ?? []);
    } catch {
      setError('Could not load your library.');
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !tokenId) return;

    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('tokenId', tokenId);
      const res = await fetch('/api/upload-image', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) throw new Error(data?.error || `HTTP ${res.status}`);
      // A deliberate upload IS the pick — no second click.
      onPick(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          data-testid="media-picker-file"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !tokenId}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
        <span className="text-xs text-gray-500">PNG, JPG, WebP, SVG · up to 10MB</span>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading && <p className="py-8 text-center text-sm text-gray-500">Loading library…</p>}

      {!loading && assets.length === 0 && !error && (
        <p className="py-8 text-center text-sm text-gray-500">
          No images yet — upload one, or pick from Stock.
        </p>
      )}

      <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onPick(asset.url)}
            data-testid="media-picker-asset"
            data-asset-url={asset.url}
            className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100 hover:border-blue-500"
            style={{
              aspectRatio: '16/9',
              // blurDataUrl is null for SVG + cache-hit backfill rows → plain grey.
              backgroundImage: asset.blurDataUrl ? `url(${asset.blurDataUrl})` : undefined,
              backgroundSize: 'cover',
            }}
            title={asset.alt || asset.url}
          >
            {/* url is absolute for blob rows and RELATIVE (/uploads/…) for the dev-fs
                fallback — <img src> handles both without normalisation. */}
            <img
              src={asset.url}
              alt={asset.alt || ''}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Stock */

function StockTab({
  tokenId,
  onPick,
}: {
  tokenId: string | null | undefined;
  onPick: (url: string) => void;
}) {
  // Narrow selector — bare useEditStore() is ESLint-banned. Same three identity
  // fields the retired StockPhotosPanel read.
  const { audienceType, templateId, paletteId } = useEditStore(
    useShallow((s) => ({
      audienceType: s.audienceType,
      templateId: s.templateId,
      paletteId: s.paletteId,
    })),
  );
  const usesTemplate = usesTemplateModule(audienceType, templateId);

  // `|| 'hearth'` fallback carried verbatim from the retired panel.
  const palettePhrase = usesTemplate
    ? getLoadedTemplate((templateId || 'hearth') as TemplateId)?.paletteImageKeywords?.[
        (paletteId as string) ?? ''
      ]
    : undefined;

  /**
   * Enrichment guard wraps the WHOLE call, exactly as the retired panel did: on a
   * non-template project the query goes out RAW. Enriching unconditionally would
   * append the default service suffix to every search on those projects.
   */
  const enrich = (q: string) => (usesTemplate ? getServiceImageQuery(q, undefined, palettePhrase) : q.trim());

  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<StockCategory>('featured');

  const search = useCallback(async (body: Record<string, unknown>) => {
    setSearching(true);
    setError(null);
    try {
      const res = await fetch('/api/images/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Search failed');
      setPhotos(data.photos ?? []);
    } catch {
      setError('Could not load stock photos. Please try again.');
    } finally {
      setSearching(false);
    }
  }, []);

  // Curated-on-mount: the tab opens with results, never an empty grid.
  useEffect(() => {
    search({ searchType: 'curated', per_page: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setCategory('featured');
      search({ searchType: 'curated', per_page: 12 });
      return;
    }
    search({
      searchType: 'search',
      query: enrich(value),
      per_page: 12,
      orientation: 'landscape',
    });
  };

  const handleCategory = (key: StockCategory) => {
    setCategory(key);
    setQuery('');
    if (key === 'featured') {
      search({ searchType: 'curated', per_page: 12 });
      return;
    }
    search({ searchType: key, query: enrich(key), per_page: 12 });
  };

  const handlePickPhoto = async (photo: StockPhoto) => {
    if (!tokenId) return;
    setPicking(photo.id);
    setError(null);
    try {
      // ALWAYS via the proxy: it copies the photo to our blob and records the row.
      const res = await fetch('/api/proxy-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pexelsPhotoId: photo.id, tokenId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) throw new Error(data?.error || `HTTP ${res.status}`);
      onPick(data.url);
    } catch {
      setError('Could not add that photo. Please try again.');
    } finally {
      setPicking(null);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search stock photos…"
        data-testid="media-picker-stock-search"
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mb-3 flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => handleCategory(c.key)}
            data-testid={`media-picker-category-${c.key}`}
            className={`rounded-md px-2 py-1 text-xs transition-colors ${
              category === c.key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {searching && <p className="py-6 text-center text-sm text-gray-500">Loading stock photos…</p>}

      <div className="grid max-h-72 grid-cols-3 gap-3 overflow-y-auto">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => handlePickPhoto(photo)}
            data-testid="media-picker-stock-photo"
            className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100 hover:border-blue-500 disabled:opacity-60"
            style={{ aspectRatio: '16/9' }}
            title={`${photo.alt} by ${photo.author}`}
            disabled={picking !== null}
          >
            <img
              src={photo.url}
              alt={photo.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {picking === photo.id && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                Adding…
              </span>
            )}
          </button>
        ))}
      </div>

      {!searching && photos.length === 0 && !error && (
        <p className="py-6 text-center text-sm text-gray-500">No photos found</p>
      )}

      <p className="mt-3 text-center text-xs text-gray-500">
        Photos provided by{' '}
        <a
          href="https://pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Pexels
        </a>
      </p>
    </div>
  );
}

export default MediaPickerModal;
