// src/lib/generation/fetchImages.ts
// Parallel Pexels image fetching for landing page generation

import type { ImageFetchSpec } from './imageSlots';

const FETCH_TIMEOUT_MS = 5000;
const STAGGER_DELAY_MS = 100;
const MAX_QUERY_WORDS = 8;

export interface ImageFetchResult {
  sectionType: string;
  elementKey: string;
  imageUrl: string | null;
  candidates?: Array<{ url: string; downloadUrl: string; avgColor: string }>;
  error?: string;
}

/**
 * Build a Pexels search query from categories, a spec modifier, and palette-derived
 * style keywords. Composition: first 2 categories + modifier + styleKeywords, trimmed
 * and capped to ~8 words to keep Pexels relevance. Empty → 'business professional'.
 */
export function buildSearchQuery(
  categories: string[],
  modifier: string,
  styleKeywords?: string
): string {
  const categoryPart = categories.slice(0, 2).join(' ');
  const raw = `${categoryPart} ${modifier || ''} ${styleKeywords || ''}`.trim();
  if (!raw) return 'business professional';
  return raw.split(/\s+/).slice(0, MAX_QUERY_WORDS).join(' ');
}

/**
 * Delay helper for staggered requests
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch a single image from Pexels for one resolved spec.
 * The result carries the spec's sectionId/elementPath in the (legacy-named)
 * sectionType/elementKey fields so downstream logging + keying stay stable.
 */
async function fetchSingleSpec(
  spec: ImageFetchSpec,
  categories: string[],
  styleKeywords?: string
): Promise<ImageFetchResult> {
  const query = buildSearchQuery(categories, spec.queryModifier, styleKeywords);

  try {
    const response = await fetchWithTimeout(
      '/api/images/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          orientation: spec.orientation,
          per_page: 8,
        }),
      },
      FETCH_TIMEOUT_MS
    );

    if (!response.ok) {
      return {
        sectionType: spec.sectionId,
        elementKey: spec.elementPath,
        imageUrl: null,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    const photos = data.photos || [];
    const candidates = photos.map((p: any) => ({
      url: p.url,
      downloadUrl: p.downloadUrl,
      avgColor: p.avgColor || '#888888',
    }));

    // Default to first result (scoring happens later when palette is known)
    const imageUrl = candidates[0]?.downloadUrl || candidates[0]?.url || null;

    return {
      sectionType: spec.sectionId,
      elementKey: spec.elementPath,
      imageUrl,
      candidates,
    };
  } catch (error) {
    return {
      sectionType: spec.sectionId,
      elementKey: spec.elementPath,
      imageUrl: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch Pexels images in parallel for a flat list of resolved image specs.
 * Staggered (100ms) to avoid rate limits, 5s per-fetch timeout, errors swallowed
 * into `{ imageUrl: null, error }` results (an image failure never rejects).
 *
 * @param specs   Resolved specs from `expandImageSlots` (imageSlots.ts).
 * @param options `categories` (product categories) + palette-derived `styleKeywords`.
 * @returns Map of `${sectionId}.${elementPath}` → ImageFetchResult.
 */
export async function fetchImagesForSpecs(
  specs: ImageFetchSpec[],
  options: { categories: string[]; styleKeywords?: string }
): Promise<Map<string, ImageFetchResult>> {
  const { categories, styleKeywords } = options;
  const results = new Map<string, ImageFetchResult>();

  const fetchPromises = specs.map((spec, index) =>
    delay(index * STAGGER_DELAY_MS).then(() =>
      fetchSingleSpec(spec, categories, styleKeywords)
    )
  );

  const fetchResults = await Promise.all(fetchPromises);

  for (const result of fetchResults) {
    const key = `${result.sectionType}.${result.elementKey}`;
    results.set(key, result);
  }

  return results;
}

// ─── Color scoring ───

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s, l };
}

function scoreCandidate(
  avgColor: string,
  paletteMode: 'dark' | 'light',
  paletteTemperature: 'cool' | 'neutral' | 'warm',
  paletteBaseColor: string
): number {
  const photo = hexToHSL(avgColor);
  let score = 50;

  // Mode match (0-30 pts)
  if (paletteMode === 'dark') {
    score += photo.l < 0.45 ? 30 : photo.l < 0.6 ? 15 : 0;
  } else {
    score += photo.l > 0.5 ? 30 : photo.l > 0.35 ? 15 : 0;
  }

  // Temperature match (0-25 pts)
  const isWarmHue = photo.h < 60 || photo.h > 300;
  const isCoolHue = photo.h > 180 && photo.h < 270;
  if (paletteTemperature === 'warm' && isWarmHue) score += 25;
  else if (paletteTemperature === 'cool' && isCoolHue) score += 25;
  else if (paletteTemperature === 'neutral') score += 15;

  // Low saturation bonus for neutral palettes (0-10 pts)
  if (paletteTemperature === 'neutral' && photo.s < 0.3) score += 10;

  // Hue proximity to baseColor (0-15 pts)
  try {
    const base = hexToHSL(paletteBaseColor);
    const hueDiff = Math.abs(photo.h - base.h);
    const hueDistance = Math.min(hueDiff, 360 - hueDiff);
    score += Math.max(0, 15 - (hueDistance / 24));
  } catch { /* baseColor might not be valid hex, skip */ }

  return Math.round(score);
}

/**
 * Pick the best image from candidates for a given palette.
 * Call AFTER palette is known.
 */
export function pickBestImage(
  result: ImageFetchResult,
  paletteMode: 'dark' | 'light',
  paletteTemperature: 'cool' | 'neutral' | 'warm',
  paletteBaseColor: string
): string | null {
  if (!result.candidates?.length) return result.imageUrl;

  const scored = result.candidates
    .map(c => ({
      ...c,
      score: scoreCandidate(c.avgColor, paletteMode, paletteTemperature, paletteBaseColor),
    }))
    .sort((a, b) => b.score - a.score);

  console.log(`[Image Score] ${result.sectionType}.${result.elementKey}:`);
  scored.slice(0, 3).forEach((c, i) =>
    console.log(`   ${i + 1}. score=${c.score} avgColor=${c.avgColor} ${i === 0 ? '<- picked' : ''}`)
  );

  return scored[0].downloadUrl || scored[0].url || result.imageUrl;
}
