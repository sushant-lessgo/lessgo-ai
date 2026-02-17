// hooks/useReviewState.ts — Review indicator state for element verification system
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  layoutElementSchema,
  type UIBlockSchemaV2,
  type CollectionDef,
  type CollectionFieldDef,
} from '@/modules/sections/layoutElementSchema';
import {
  DEFAULT_PLACEHOLDERS,
  getDefaultValueByPattern,
} from '@/modules/sections/defaultPlaceholders';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewStatus = 'needs_review' | 'manual_preferred' | 'stock_image';

export interface ReviewItem {
  sectionId: string;
  elementKey: string;
  type: ReviewStatus;
}

interface ReviewState {
  /** Unreviewed elements (derived from schema + content, minus reviewedElements) */
  reviewItems: ReviewItem[];
  /** Elements user has edited or confirmed — format `${sectionId}::${elementKey}` */
  reviewedElements: Set<string>;
  /** Count of remaining unreviewed items */
  remainingCount: number;
  /** Cycle index for pill click-through */
  lastCycledIndex: number;

  // Actions
  initFromContent: (
    content: Record<string, any>,
    sectionLayouts: Record<string, string>,
    sections: string[]
  ) => void;
  markReviewed: (sectionId: string, elementKey: string) => void;
  getElementReviewStatus: (sectionId: string, elementKey: string) => ReviewStatus | null;
  getNextUnreviewed: () => { sectionId: string; elementKey: string } | null;
  resetCycleIndex: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isStockOrPlaceholder(src: string): 'stock' | 'placeholder' | null {
  if (!src) return 'placeholder';
  if (src.startsWith('/placeholder')) return 'placeholder';
  if (src.includes('pexels') || src.includes('proxy-image')) return 'stock';
  return null;
}

function isImageElement(key: string): boolean {
  return (
    key.includes('image') ||
    key.includes('visual') ||
    key.includes('avatar') ||
    key.includes('logo') ||
    key.includes('thumbnail') ||
    key.includes('mockup')
  );
}

/** Check if current value matches a default placeholder */
function isDefaultPlaceholderValue(key: string, value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;

  // Exact match
  const exact = DEFAULT_PLACEHOLDERS[key];
  if (exact !== undefined && exact === value) return true;

  // Pattern match for image fields
  if (isImageElement(key)) {
    const pattern = getDefaultValueByPattern(key);
    if (pattern !== null && pattern === value) return true;
    // Generic placeholder prefix
    if (value.startsWith('/placeholder')) return true;
  }
  return false;
}

/** Type guard: is schema V2 format? */
function isV2Schema(schema: unknown): schema is UIBlockSchemaV2 {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    'sectionType' in schema &&
    'elements' in schema
  );
}

/** Get review status for a single element value given its fillMode */
function getStatusForElement(
  fillMode: string,
  key: string,
  value: unknown
): ReviewStatus | null {
  if (fillMode === 'ai_generated_needs_review') {
    return 'needs_review';
  }

  if (fillMode === 'manual_preferred' && isImageElement(key)) {
    if (isDefaultPlaceholderValue(key, value)) return 'manual_preferred';
    // Check stock
    if (typeof value === 'string' && isStockOrPlaceholder(value)) return 'stock_image';
  }

  // For any image regardless of fillMode — show stock badge if stock/placeholder
  if (isImageElement(key) && typeof value === 'string') {
    const imageType = isStockOrPlaceholder(value);
    if (imageType === 'stock') return 'stock_image';
    if (imageType === 'placeholder' && fillMode !== 'manual_preferred') return 'stock_image';
  }

  return null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useReviewState = create<ReviewState>()(
  devtools(
    (set, get) => ({
      reviewItems: [],
      reviewedElements: new Set<string>(),
      remainingCount: 0,
      lastCycledIndex: -1,

      initFromContent: (content, sectionLayouts, sections) => {
        const { reviewedElements } = get();
        const items: ReviewItem[] = [];

        for (const sectionId of sections) {
          const sectionData = content[sectionId];
          if (!sectionData) continue;

          const layoutName = sectionLayouts[sectionId];
          if (!layoutName) continue;

          const schema = layoutElementSchema[layoutName];
          if (!schema || !isV2Schema(schema)) continue;

          const elements = sectionData.elements || {};

          // --- Scan top-level elements ---
          for (const [key, def] of Object.entries(schema.elements)) {
            if (def.type === 'boolean') continue; // Booleans have no DOM element
            const compositeKey = `${sectionId}::${key}`;
            if (reviewedElements.has(compositeKey)) continue;

            const status = getStatusForElement(def.fillMode, key, elements[key]);
            if (status) {
              items.push({ sectionId, elementKey: key, type: status });
            }
          }

          // --- Scan collections ---
          if (schema.collections) {
            for (const [collName, collDef] of Object.entries(schema.collections)) {
              const collData = elements[collName];
              if (!Array.isArray(collData)) continue;

              for (const item of collData) {
                const itemId = item?.id;
                if (!itemId) continue;

                for (const [fieldName, fieldDef] of Object.entries(collDef.fields)) {
                  if (fieldName === 'id') continue;
                  const elementKey = `${collName}.${itemId}.${fieldName}`;
                  const compositeKey = `${sectionId}::${elementKey}`;
                  if (reviewedElements.has(compositeKey)) continue;

                  const status = getStatusForElement(
                    fieldDef.fillMode,
                    fieldName,
                    item[fieldName]
                  );
                  if (status) {
                    items.push({ sectionId, elementKey, type: status });
                  }
                }
              }
            }
          }
        }

        set({
          reviewItems: items,
          remainingCount: items.length,
          lastCycledIndex: -1,
        });
      },

      markReviewed: (sectionId, elementKey) => {
        const { reviewedElements, reviewItems } = get();
        const compositeKey = `${sectionId}::${elementKey}`;
        if (reviewedElements.has(compositeKey)) return;

        const newSet = new Set(reviewedElements);
        newSet.add(compositeKey);

        const newItems = reviewItems.filter(
          (item) =>
            !(item.sectionId === sectionId && item.elementKey === elementKey)
        );

        set({
          reviewedElements: newSet,
          reviewItems: newItems,
          remainingCount: newItems.length,
        });
      },

      getElementReviewStatus: (sectionId, elementKey) => {
        const { reviewItems } = get();
        const item = reviewItems.find(
          (i) => i.sectionId === sectionId && i.elementKey === elementKey
        );
        return item?.type ?? null;
      },

      getNextUnreviewed: () => {
        const { reviewItems, lastCycledIndex } = get();
        if (reviewItems.length === 0) return null;

        const nextIndex = (lastCycledIndex + 1) % reviewItems.length;
        const item = reviewItems[nextIndex];
        set({ lastCycledIndex: nextIndex });
        return { sectionId: item.sectionId, elementKey: item.elementKey };
      },

      resetCycleIndex: () => {
        set({ lastCycledIndex: -1 });
      },
    }),
    { name: 'ReviewState' }
  )
);
