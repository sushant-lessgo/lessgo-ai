// src/lib/generation/imageSlots.ts
// UIBlock (layout) → image element mapping for Pexels image fetching.
//
// scale-03 re-key: entries are keyed by concrete block layout name and classified
// by `stockable`. `stockable:true` = generic/illustrative/decorative (legitimately
// stock). `stockable:false` = customer-promised brand asset (spec T2 rule: labeled
// placeholder, never stock — documented here so a future flip is one boolean).

export interface ImageSlot {
  elementKey: string;
  orientation: 'landscape' | 'portrait' | 'square';
  modifier?: string;        // additional search terms appended to category
  useSilhouette?: boolean;  // use static placeholder instead of Pexels
  stockable: boolean;       // true = legitimately stock; false = customer-promised (never stock)
  collection?: {
    key: string;              // elements[key] is the generated-item array
    imageField: string;       // field on each item to write the image URL into
    perItemQueryField?: string; // field on each item appended to the query modifier
  };
}

/**
 * Mapping of block layout names to their image slots.
 * Keyed by the layout name that appears on each content entry's `.layout` field
 * (see design decision 5 in the plan). Casing matches the block layout names exactly.
 *
 * Pilot scope: meridian + vestria (product onboarding).
 *
 * Meridian: ZERO stockable slots. TerminalHero uses CSS terminal art (no image slot,
 * PO ruling in that file's header); ProofWithLogoRail avatars/logos are decorative/
 * typographic (no image element); `logo_image` (MeridianNavHeader) is a brand asset
 * (stockable:false, not stocked). Nothing legitimately stockable to add without new
 * block scope → no meridian entries here.
 */
export const UIBLOCK_IMAGE_SLOTS: Record<string, ImageSlot[]> = {
  // ─── Vestria: the ONLY stockable slot in the pilot inventory ───
  'VestriaIndustriesGrid': [
    {
      elementKey: 'industries',
      stockable: true,
      orientation: 'landscape',
      modifier: 'industry sector professional',
      collection: { key: 'industries', imageField: 'image', perItemQueryField: 'title' },
    },
  ],

  // ─── Vestria: customer-promised slots (stockable:false) ───
  // Documented so a future flip to stock is a single boolean change. These keep their
  // existing labeled hatched placeholders (spec T2) and are never fetched/stocked.
  'VestriaTailoredHero': [
    { elementKey: 'hero_image', stockable: false, orientation: 'landscape' },
  ],
  'VestriaFullBleedHero': [
    { elementKey: 'hero_video_poster', stockable: false, orientation: 'landscape' },
  ],
  'VestriaAboutStats': [
    { elementKey: 'about_image', stockable: false, orientation: 'landscape' },
  ],
  'VestriaCatalogueGrid': [
    {
      elementKey: 'items',
      stockable: false,
      orientation: 'square',
      collection: { key: 'items', imageField: 'image' },
    },
  ],
};

/**
 * A single resolved image to fetch, keyed by concrete sectionId (never sectionType).
 * `elementPath` is either a flat element key (e.g. 'about_image') or a collection
 * item path (e.g. 'industries.<itemId>.image'). Collection slots carry
 * `collectionWrite` so the caller can locate the item for write-back.
 */
export interface ImageFetchSpec {
  sectionId: string;
  elementPath: string;
  collectionWrite?: { key: string; itemId: string; imageField: string };
  orientation: 'landscape' | 'portrait' | 'square';
  queryModifier: string;
}

/**
 * Expand a sectionId-keyed content map into the flat list of stockable image specs
 * to fetch. Driven by each entry's own `.layout` (design decision 5) — no
 * sectionType→sectionId resolution. Unknown/missing layouts are skipped.
 *
 * Only `stockable:true` slots produce specs. Collection slots expand to one spec per
 * generated item found in `entry.elements[collection.key]`, capturing the item id for
 * write-back and appending the optional `perItemQueryField` value to the query modifier.
 */
export function expandImageSlots(
  content: Record<string, { layout?: string; elements?: Record<string, any> }>
): ImageFetchSpec[] {
  const specs: ImageFetchSpec[] = [];

  for (const [sectionId, entry] of Object.entries(content)) {
    const layout = entry?.layout;
    if (!layout) continue;

    const slots = UIBLOCK_IMAGE_SLOTS[layout];
    if (!slots) continue;

    const elements = entry?.elements || {};

    for (const slot of slots) {
      if (!slot.stockable) continue;

      const baseModifier = slot.modifier || '';

      if (slot.collection) {
        const { key, imageField, perItemQueryField } = slot.collection;
        const items = elements[key];
        if (!Array.isArray(items)) continue;

        for (const item of items) {
          if (!item || typeof item !== 'object') continue;
          const itemId = item.id;
          if (!itemId) continue;

          const perItemValue =
            perItemQueryField && typeof item[perItemQueryField] === 'string'
              ? item[perItemQueryField]
              : '';
          const queryModifier = `${baseModifier} ${perItemValue}`.trim();

          specs.push({
            sectionId,
            elementPath: `${key}.${itemId}.${imageField}`,
            collectionWrite: { key, itemId, imageField },
            orientation: slot.orientation,
            queryModifier,
          });
        }
      } else {
        specs.push({
          sectionId,
          elementPath: slot.elementKey,
          orientation: slot.orientation,
          queryModifier: baseModifier,
        });
      }
    }
  }

  return specs;
}
