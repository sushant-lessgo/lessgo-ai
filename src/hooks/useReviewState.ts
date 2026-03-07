// hooks/useReviewState.ts — Review indicator state for element verification system
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  layoutElementSchema,
  type UIBlockSchemaV2,
} from '@/modules/sections/layoutElementSchema';
import {
  DEFAULT_PLACEHOLDERS,
} from '@/modules/sections/defaultPlaceholders';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewStatus = 'needs_review' | 'manual_preferred' | 'stock_image' | 'unconfigured';
export type ReviewSeverity = 'high' | 'medium' | 'config';

export interface ReviewItem {
  sectionId: string;
  elementKey: string;
  type: ReviewStatus;
  severity: ReviewSeverity;
  displayName: string;
}

interface ReviewState {
  /** All review items — never filtered on confirm, stays stable after init */
  reviewItems: ReviewItem[];
  /** Confirmed elements — format `${sectionId}::${elementKey}` */
  confirmedElements: Set<string>;
  totalCount: number;
  confirmedCount: number;

  // Actions
  initFromContent: (
    content: Record<string, any>,
    sectionLayouts: Record<string, string>,
    sections: string[]
  ) => void;
  confirmItem: (sectionId: string, elementKey: string) => void;
  unconfirmItem: (sectionId: string, elementKey: string) => void;
  isConfirmed: (sectionId: string, elementKey: string) => boolean;
  getElementReviewStatus: (sectionId: string, elementKey: string) => ReviewStatus | null;
  getItemsBySectionId: () => Map<string, ReviewItem[]>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isStockOrPlaceholder(src: string): 'stock' | 'placeholder' | null {
  if (!src) return 'placeholder';
  if (src.startsWith('/placeholder') || src.includes('-placeholder.')) return 'placeholder';
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

function isDefaultPlaceholderValue(key: string, value: unknown, schemaDefault?: any): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;
  if (schemaDefault && value === schemaDefault) return true;
  const exact = DEFAULT_PLACEHOLDERS[key];
  if (exact !== undefined && exact === value) return true;
  if (isImageElement(key)) {
    if (value.startsWith('/placeholder') || value.includes('-placeholder')) return true;
  }
  return false;
}

function isV2Schema(schema: unknown): schema is UIBlockSchemaV2 {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    'sectionType' in schema &&
    'elements' in schema
  );
}

function getStatusForElement(
  fillMode: string,
  key: string,
  value: unknown,
  schemaDefault?: any
): ReviewStatus | null {
  if (fillMode === 'ai_generated_needs_review') {
    return 'needs_review';
  }

  if (fillMode === 'manual_preferred' && isImageElement(key)) {
    if (isDefaultPlaceholderValue(key, value, schemaDefault)) return 'manual_preferred';
    if (typeof value === 'string' && isStockOrPlaceholder(value)) return 'stock_image';
  }

  if (isImageElement(key) && typeof value === 'string') {
    const imageType = isStockOrPlaceholder(value);
    if (imageType === 'stock') return 'stock_image';
    if (imageType === 'placeholder' && fillMode !== 'manual_preferred') return 'stock_image';
  }

  return null;
}

function statusToSeverity(status: ReviewStatus): ReviewSeverity {
  if (status === 'needs_review') return 'high';
  if (status === 'unconfigured') return 'config';
  return 'medium';
}

/** Humanize an element key for display */
function humanizeElementKey(elementKey: string): string {
  const parts = elementKey.split('.');
  const lastPart = parts[parts.length - 1];
  return lastPart
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useReviewState = create<ReviewState>()(
  devtools(
    (set, get) => ({
      reviewItems: [],
      confirmedElements: new Set<string>(),
      totalCount: 0,
      confirmedCount: 0,

      initFromContent: (content, sectionLayouts, sections) => {
        const { confirmedElements } = get();
        const items: ReviewItem[] = [];

        for (const sectionId of sections) {
          const sectionData = content[sectionId];
          if (!sectionData) continue;

          const layoutName = sectionLayouts[sectionId];
          if (!layoutName) continue;

          const schema = layoutElementSchema[layoutName];
          if (!schema || !isV2Schema(schema)) continue;

          const elements = sectionData.elements || {};
          const excluded: string[] = sectionData.aiMetadata?.excludedElements || [];

          const effectiveExclusions = new Set(excluded);
          for (const [key, def] of Object.entries(schema.elements)) {
            if (def.toggleGroup && effectiveExclusions.has(def.toggleGroup)) {
              effectiveExclusions.add(key);
            }
          }

          // Scan top-level elements
          for (const [key, def] of Object.entries(schema.elements)) {
            if (def.type === 'boolean') continue;
            if (effectiveExclusions.has(key)) continue;
            if (elements[key] === undefined && def.requirement === 'optional') continue;

            const status = getStatusForElement(def.fillMode, key, elements[key], def.default);
            if (status) {
              items.push({
                sectionId,
                elementKey: key,
                type: status,
                severity: statusToSeverity(status),
                displayName: humanizeElementKey(key),
              });
            }
          }

          // --- Config items: CTA buttons always need setup ---
          const sectionType = sectionId.split('-')[0].toLowerCase();

          if (schema.elements.cta_text && !effectiveExclusions.has('cta_text')) {
            items.push({
              sectionId, elementKey: 'cta_text', type: 'unconfigured',
              severity: 'config', displayName: 'CTA Button Link',
            });
          }
          if (schema.elements.secondary_cta_text && !effectiveExclusions.has('secondary_cta_text')) {
            items.push({
              sectionId, elementKey: 'secondary_cta_text', type: 'unconfigured',
              severity: 'config', displayName: 'Secondary CTA Link',
            });
          }

          // Header-specific config
          if (sectionType === 'header') {
            items.push({
              sectionId, elementKey: '__logo__', type: 'unconfigured',
              severity: 'config', displayName: 'Logo',
            });
            if (schema.collections?.nav_items && !effectiveExclusions.has('nav_items')) {
              items.push({
                sectionId, elementKey: '__nav_links__', type: 'unconfigured',
                severity: 'config', displayName: 'Navigation Links',
              });
            }
          }

          // Footer-specific config
          if (sectionType === 'footer') {
            items.push({
              sectionId, elementKey: '__contact__', type: 'unconfigured',
              severity: 'config', displayName: 'Contact Info',
            });
          }

          // Scan collections
          if (schema.collections) {
            for (const [collName, collDef] of Object.entries(schema.collections)) {
              if (effectiveExclusions.has(collName)) continue;
              if ((collDef as any).toggleGroup && effectiveExclusions.has((collDef as any).toggleGroup)) continue;
              const collData = elements[collName];
              if (!Array.isArray(collData)) continue;

              for (const item of collData) {
                const itemId = item?.id;
                if (!itemId) continue;

                for (const [fieldName, fieldDef] of Object.entries(collDef.fields)) {
                  if (fieldName === 'id') continue;
                  const elementKey = `${collName}.${itemId}.${fieldName}`;

                  const status = getStatusForElement(
                    fieldDef.fillMode,
                    fieldName,
                    item[fieldName],
                    fieldDef.default
                  );
                  if (status) {
                    items.push({
                      sectionId,
                      elementKey,
                      type: status,
                      severity: statusToSeverity(status),
                      displayName: humanizeElementKey(elementKey),
                    });
                  }
                }
              }
            }
          }
        }

        // Count how many are already confirmed from previous state
        let confirmedInItems = 0;
        for (const item of items) {
          if (confirmedElements.has(`${item.sectionId}::${item.elementKey}`)) {
            confirmedInItems++;
          }
        }

        set({
          reviewItems: items,
          totalCount: items.length,
          confirmedCount: confirmedInItems,
        });
      },

      confirmItem: (sectionId, elementKey) => {
        const { confirmedElements, confirmedCount } = get();
        const compositeKey = `${sectionId}::${elementKey}`;
        if (confirmedElements.has(compositeKey)) return;

        const newSet = new Set(confirmedElements);
        newSet.add(compositeKey);

        set({
          confirmedElements: newSet,
          confirmedCount: confirmedCount + 1,
        });
      },

      unconfirmItem: (sectionId, elementKey) => {
        const { confirmedElements, confirmedCount } = get();
        const compositeKey = `${sectionId}::${elementKey}`;
        if (!confirmedElements.has(compositeKey)) return;

        const newSet = new Set(confirmedElements);
        newSet.delete(compositeKey);

        set({
          confirmedElements: newSet,
          confirmedCount: confirmedCount - 1,
        });
      },

      isConfirmed: (sectionId, elementKey) => {
        return get().confirmedElements.has(`${sectionId}::${elementKey}`);
      },

      getElementReviewStatus: (sectionId, elementKey) => {
        // Searches ALL items — badges persist even after confirmation
        const { reviewItems } = get();
        const item = reviewItems.find(
          (i) => i.sectionId === sectionId && i.elementKey === elementKey
        );
        return item?.type ?? null;
      },

      getItemsBySectionId: () => {
        const { reviewItems } = get();
        const map = new Map<string, ReviewItem[]>();
        for (const item of reviewItems) {
          const arr = map.get(item.sectionId) || [];
          arr.push(item);
          map.set(item.sectionId, arr);
        }
        return map;
      },
    }),
    { name: 'ReviewState' }
  )
);
