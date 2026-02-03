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
  error?: string;
}

/**
 * Build search query from categories and slot modifier
 */
function buildSearchQuery(categories: string[], slot: ImageSlot): string {
  // Use first 2 categories for relevance
  const categoryPart = categories.slice(0, 2).join(' ');
  const modifier = slot.modifier || '';

  return `${categoryPart} ${modifier}`.trim() || 'business professional';
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
  categories: string[]
): Promise<ImageFetchResult> {
  const query = buildSearchQuery(categories, slot);

  try {
    const response = await fetchWithTimeout(
      '/api/images/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          orientation: slot.orientation,
          per_page: 1,
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

    // Use downloadUrl (large) if available, fallback to url (medium)
    const photo = data.photos?.[0];
    const imageUrl = photo?.downloadUrl || photo?.url || null;

    return {
      sectionType,
      elementKey: slot.elementKey,
      imageUrl,
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
  uiblocks: Record<string, string>
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
      fetchSingleImage(sectionType, slot, categories)
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
