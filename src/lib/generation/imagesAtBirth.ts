// src/lib/generation/imagesAtBirth.ts
// scale-03 orchestrator — "images at birth". Client-safe (no React): fetches
// palette-scored Pexels images for the stockable slots on one already-assembled
// page and writes plain URL strings into the SAME content object the caller will
// persist (mutated IN PLACE — design decision 5). Any failure resolves to a
// logged no-op: an image miss must NEVER fail a paid generation.
//
// Firewall note: template data is pulled via a STATIC LEAF import of
// vestria/imageKeywords (imports only `@/types/product` — no block/registry
// code), so this stays safe to import from the client onboarding path.

import type { SectionData } from '@/types/core/content';
import { expandImageSlots } from './imageSlots';
import { fetchImagesForSpecs, pickBestImage } from './fetchImages';
import {
  PALETTE_IMAGE_KEYWORDS,
  PALETTE_IMAGE_PROFILES,
} from '@/modules/templates/vestria/imageKeywords';

type ImageProfile = {
  mode: 'light' | 'dark';
  temperature: 'cool' | 'neutral' | 'warm';
  baseColor: string;
};

// Neutral fallback used when a paletteId is unknown (defensive — never crash).
const FALLBACK_PROFILE: ImageProfile = {
  mode: 'light',
  temperature: 'neutral',
  baseColor: '#888888',
};

// Pilot allow-list (design decision / plan line 141). meridian has zero stockable
// slots, so it resolves to an empty spec list and returns immediately.
const ALLOWED_TEMPLATES = new Set(['meridian', 'vestria']);

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : 0;
}

/**
 * Fetch + inject stockable images for one page's content map (mutates in place).
 *
 * @param opts.content    The EXACT sectionId-keyed content object the caller saves.
 *                        Each entry's own `.layout` drives the slot lookup — no
 *                        sectionType→sectionId resolution.
 * @param opts.templateId Pilot allow-list gate (meridian | vestria); anything else
 *                        is a no-op.
 * @param opts.paletteId  Palette → query keywords + scoring scalars (vestria leaf data).
 * @param opts.categories Product categories, first two feed the Pexels query.
 * @returns { requested, filled, ms } for Phase 4 measurement.
 */
export async function injectImagesForPage(opts: {
  content: Record<string, SectionData>;
  templateId: string;
  paletteId: string;
  categories: string[];
}): Promise<{ requested: number; filled: number; ms: number }> {
  const start = nowMs();
  const done = (requested: number, filled: number) => ({
    requested,
    filled,
    ms: Math.round(nowMs() - start),
  });

  try {
    const { content, templateId, paletteId, categories } = opts;

    if (!ALLOWED_TEMPLATES.has(templateId)) return done(0, 0);

    const specs = expandImageSlots(content);
    if (specs.length === 0) return done(0, 0); // meridian lands here (zero slots)

    const styleKeywords = (PALETTE_IMAGE_KEYWORDS as Record<string, string>)[paletteId];
    const profile: ImageProfile =
      (PALETTE_IMAGE_PROFILES as Record<string, ImageProfile>)[paletteId] ?? FALLBACK_PROFILE;

    const results = await fetchImagesForSpecs(specs, { categories, styleKeywords });

    let filled = 0;
    for (const spec of specs) {
      const result = results.get(`${spec.sectionId}.${spec.elementPath}`);
      // Null / error / no-candidate results write NOTHING (placeholder stands).
      if (!result || !result.candidates?.length) continue;

      const url = pickBestImage(result, profile.mode, profile.temperature, profile.baseColor);
      if (!url) continue;

      const section = content[spec.sectionId];
      if (!section || !section.elements) continue;

      if (spec.collectionWrite) {
        const { key, itemId, imageField } = spec.collectionWrite;
        const items = section.elements[key];
        if (!Array.isArray(items)) continue;
        const item = items.find((it: any) => it && it.id === itemId);
        if (!item) continue; // item vanished — skip silently
        item[imageField] = url;
        filled++;
      } else {
        section.elements[spec.elementPath] = url;
        filled++;
      }
    }

    return done(specs.length, filled);
  } catch (err) {
    // Image failure must never fail a paid generation.
    console.error('[imagesAtBirth] injection failed — no-op:', err);
    return done(0, 0);
  }
}
