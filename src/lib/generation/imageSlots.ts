// src/lib/generation/imageSlots.ts
// UIBlock → image element mapping for Pexels image fetching

export interface ImageSlot {
  elementKey: string;
  orientation: 'landscape' | 'portrait' | 'square';
  modifier?: string;        // additional search terms appended to category
  useSilhouette?: boolean;  // use static placeholder instead of Pexels
}

/**
 * Mapping of UIBlocks to their image slots
 * Casing matches layoutNames.ts exactly:
 * - Hero layouts: camelCase
 * - Other layouts: PascalCase
 */
export const UIBLOCK_IMAGE_SLOTS: Record<string, ImageSlot[]> = {
  // Hero layouts - camelCase (from layoutNames.ts)
  'leftCopyRightImage': [{ elementKey: 'hero_image', orientation: 'landscape' }],
  'centerStacked': [{ elementKey: 'center_hero_image', orientation: 'landscape' }],
  'splitScreen': [{ elementKey: 'split_hero_image', orientation: 'landscape' }],
  'imageFirst': [{ elementKey: 'image_first_hero_image', orientation: 'landscape' }],

  // BeforeAfter - PascalCase
  'SplitCard': [
    { elementKey: 'before_visual', orientation: 'landscape', modifier: 'problem struggle difficulty' },
    { elementKey: 'after_visual', orientation: 'landscape', modifier: 'success solution achievement' }
  ],

  // CTA - PascalCase
  'VisualCTAWithMockup': [{ elementKey: 'mockup_image', orientation: 'landscape', modifier: 'laptop computer dashboard software' }],

  // FounderNote - PascalCase, uses silhouette
  'LetterStyleBlock': [{ elementKey: 'founder_image', orientation: 'portrait', useSilhouette: true }],
};

/**
 * Get all image slots needed for a set of UIBlock selections
 * @param uiblocks Map of sectionType → UIBlock name (e.g., { Hero: 'centerStacked', CTA: 'VisualCTAWithMockup' })
 * @returns Array of slots with section context
 */
export function getImageSlotsForUIBlocks(
  uiblocks: Record<string, string>
): Array<{ sectionType: string; uiblock: string; slot: ImageSlot }> {
  const slots: Array<{ sectionType: string; uiblock: string; slot: ImageSlot }> = [];

  for (const [sectionType, uiblock] of Object.entries(uiblocks)) {
    const blockSlots = UIBLOCK_IMAGE_SLOTS[uiblock];
    if (blockSlots) {
      for (const slot of blockSlots) {
        slots.push({ sectionType, uiblock, slot });
      }
    }
  }

  return slots;
}
