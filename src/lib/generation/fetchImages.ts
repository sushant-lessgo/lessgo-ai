// src/lib/generation/fetchImages.ts
// Parallel Pexels image fetching for landing page generation

import { getImageSlotsForUIBlocks, type ImageSlot } from './imageSlots';

const SILHOUETTE_PATH = '/silhouette-avatar.svg';
const FETCH_TIMEOUT_MS = 5000;
const STAGGER_DELAY_MS = 100;

export interface ImageFetchResult {
  sectionType: string;
  elementKey: string;
  imageUrl: string | null;
  candidates?: Array<{ url: string; downloadUrl: string; avgColor: string }>;
  error?: string;
}

const VIBE_MODIFIERS: Record<string, string> = {
  'Dark Tech':     'dark moody technology',
  'Light Trust':   'bright clean professional',
  'Warm Friendly': 'warm vibrant people friendly',
  'Bold Energy':   'colorful dynamic bold modern',
  'Calm Minimal':  'minimal clean simple white',
};

/**
 * Build search query from categories, slot modifier, and optional vibe
 */
function buildSearchQuery(categories: string[], slot: ImageSlot, vibe?: string): string {
  const categoryPart = categories.slice(0, 2).join(' ');
  const modifier = slot.modifier || '';
  const vibeMod = vibe ? (VIBE_MODIFIERS[vibe] || '') : '';
  return `${categoryPart} ${modifier} ${vibeMod}`.trim() || 'business professional';
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
 * Fetch a single image from Pexels
 */
async function fetchSingleImage(
  sectionType: string,
  slot: ImageSlot,
  categories: string[],
  vibe?: string
): Promise<ImageFetchResult> {
  const query = buildSearchQuery(categories, slot, vibe);

  try {
    const response = await fetchWithTimeout(
      '/api/images/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          orientation: slot.orientation,
          per_page: 8,
        }),
      },
      FETCH_TIMEOUT_MS
    );

    if (!response.ok) {
      return {
        sectionType,
        elementKey: slot.elementKey,
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
      sectionType,
      elementKey: slot.elementKey,
      imageUrl,
      candidates,
    };
  } catch (error) {
    return {
      sectionType,
      elementKey: slot.elementKey,
      imageUrl: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch Pexels images in parallel for all UIBlock image slots
 *
 * @param categories Product categories (e.g., ["Invoicing", "Accounting"])
 * @param uiblocks Map of sectionType → UIBlock name
 * @returns Map of "sectionType.elementKey" → ImageFetchResult
 */
export async function fetchPexelsImagesParallel(
  categories: string[],
  uiblocks: Record<string, string>,
  vibe?: string
): Promise<Map<string, ImageFetchResult>> {
  const slots = getImageSlotsForUIBlocks(uiblocks);
  const results = new Map<string, ImageFetchResult>();

  // Separate silhouette slots (no API call needed)
  const silhouetteSlots = slots.filter(s => s.slot.useSilhouette);
  const pexelsSlots = slots.filter(s => !s.slot.useSilhouette);

  // Handle silhouette slots immediately
  for (const { sectionType, slot } of silhouetteSlots) {
    const key = `${sectionType}.${slot.elementKey}`;
    results.set(key, {
      sectionType,
      elementKey: slot.elementKey,
      imageUrl: SILHOUETTE_PATH,
    });
  }

  // Fetch Pexels images with staggered requests to avoid rate limits
  const fetchPromises = pexelsSlots.map(({ sectionType, slot }, index) =>
    delay(index * STAGGER_DELAY_MS).then(() =>
      fetchSingleImage(sectionType, slot, categories, vibe)
    )
  );

  const fetchResults = await Promise.all(fetchPromises);

  // Add Pexels results to map
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
