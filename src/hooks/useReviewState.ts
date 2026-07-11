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

// ---------------------------------------------------------------------------
// Feature 1 — curated "Getting started" guide (derived from live content)
// ---------------------------------------------------------------------------

/** Curated task ids — exactly these four, same for everyone. */
export type GuideTaskId = 'add_logo' | 'link_ctas' | 'replace_stock_photos' | 'add_contact';

export interface GuideTask {
  id: GuideTaskId;
  label: string;
  /** Auto-check signal met. */
  done: boolean;
  /** The page actually has this surface (else the task is not shown). */
  present: boolean;
  /** Where clicking the task should scroll/focus. */
  target?: { sectionId: string; elementKey: string };
}

/** Surface facts collected during the single content scan, fed to the guide derivation. */
export interface GuideSurfaces {
  headerSectionId: string | null;
  footerSectionId: string | null;
  /** Present primary CTA elements (elementKey `cta_text`). */
  primaryCtas: Array<{ sectionId: string; elementKey: string }>;
  /** Page has at least one non-logo image element. */
  hasImageElement: boolean;
  firstImageTarget: { sectionId: string; elementKey: string } | null;
  /** Stock/placeholder image items from the scan (`type === 'stock_image'`). */
  stockItems: ReviewItem[];
}

interface ReviewState {
  /** All review items — never filtered on confirm, stays stable after init */
  reviewItems: ReviewItem[];
  /** Feature 2 — AI-invented specifics (the `needs_review` category), isolated for markers. */
  needsReviewItems: ReviewItem[];
  /** Feature 2 render source — needs_review items still equal to their baseline AI original.
   *  A marker auto-clears (drops out) once the element value diverges from baseline. */
  activeMarkers: ReviewItem[];
  /** Feature 1 — curated, content-derived task list (always exactly 4 tasks). */
  guideTasks: GuideTask[];
  /** Count of present-but-not-done guide tasks (backs the pill wording + auto-hide). */
  remainingCount: number;
  /** True when no present guide task remains. */
  allComplete: boolean;
  /** Confirmed elements — format `${sectionId}::${elementKey}` */
  confirmedElements: Set<string>;
  totalCount: number;
  confirmedCount: number;

  // --- Scan inputs retained so a content-only refresh can re-derive ---
  /** Section→layout map from the last `initFromContent`, reused by `refreshFromContent`. */
  sectionLayouts: Record<string, string>;
  /** Section id list from the last `initFromContent`, reused by `refreshFromContent`. */
  sections: string[];
  /** Persisted AI-original baseline snapshot (edit store `export()`), threaded in for Phase 5
   *  auto-clear. Stored now; not yet consumed by the derive. */
  baseline: Record<string, any> | null;
  /** Active page id (edit-store `currentPageId`), threaded in for Phase 5 page-aware baseline. */
  currentPageId: string | null;
  /** Phase 6 — the ONE persisted field of this feature: "leave as-is" dismisses, as
   *  `"sectionId::elementKey"` composite keys. Hydrated from `finalContent.dismissedReviewFlags`
   *  on init, excluded from `activeMarkers`, and re-emitted by `useContentSerializer`. Survives a
   *  content-only `refreshFromContent` (never wiped by a refresh). */
  dismissedReviewFlags: string[];

  // Actions
  initFromContent: (
    content: Record<string, any>,
    sectionLayouts: Record<string, string>,
    sections: string[],
    globalSettings?: { logoUrl?: string },
    baseline?: Record<string, any> | null,
    currentPageId?: string | null,
    dismissedReviewFlags?: string[]
  ) => void;
  /** Re-derive tasks + needs_review from live content WITHOUT resetting user-set state.
   *  No-ops (`set` skipped) when the derived output is unchanged so keystrokes don't re-render. */
  refreshFromContent: (
    content: Record<string, any>,
    baseline?: Record<string, any> | null,
    currentPageId?: string | null,
    globalSettings?: { logoUrl?: string }
  ) => void;
  confirmItem: (sectionId: string, elementKey: string) => void;
  unconfirmItem: (sectionId: string, elementKey: string) => void;
  isConfirmed: (sectionId: string, elementKey: string) => boolean;
  /** Phase 6 — "leave as-is": permanently suppress a marker at this key. Adds the composite key
   *  to `dismissedReviewFlags` and drops the item from `activeMarkers` immediately. */
  dismiss: (sectionId: string, elementKey: string) => void;
  /** Phase 6 — clear ALL dismisses (Regen Copy recaptures baseline → re-invented specifics must
   *  start un-dismissed). Re-derives `activeMarkers` from the last scan without them. */
  clearDismissed: () => void;
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

/** Unwrap a content value that may be a plain string or a `{ content }` wrapper. */
function unwrapContentValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof (value as any).content === 'string') {
    return (value as any).content;
  }
  return '';
}

/**
 * Resolve an element's normalized value from a content root, handling BOTH key shapes:
 *  - plain `elementKey` → `root[sectionId].elements[elementKey]`
 *  - dotted `collName.itemId.fieldName` → the `collName` array item whose `id === itemId`,
 *    then `item[fieldName]`.
 * Returns the value unwrapped through {@link unwrapContentValue}, or `undefined` when the
 * path cannot be resolved (missing section/elements/collection/item/field). The `undefined`
 * signal is meaningful — Phase 5 auto-clear treats a `undefined` baseline as "no baseline
 * for that page/element" and keeps the marker active rather than crashing.
 *
 * Used for BOTH the current-content read and the baseline read so the comparison is
 * apples-to-apples.
 */
export function resolveElementValue(
  root: Record<string, any> | null | undefined,
  sectionId: string,
  elementKey: string
): string | undefined {
  const elements = root?.[sectionId]?.elements;
  if (!elements) return undefined;

  const parts = elementKey.split('.');
  if (parts.length === 1) {
    const raw = elements[elementKey];
    if (raw === undefined) return undefined;
    return unwrapContentValue(raw);
  }

  const [collName, itemId, fieldName] = parts;
  const coll = elements[collName];
  if (!Array.isArray(coll)) return undefined;
  const item = coll.find((it) => it?.id === itemId);
  if (!item) return undefined;
  const raw = item[fieldName];
  if (raw === undefined) return undefined;
  return unwrapContentValue(raw);
}

/**
 * A primary CTA is "linked" when its buttonConfig is a link with a non-empty url.
 * Mirrors `src/utils/ctaHandler.ts:20-51` semantics (V2 elementMetadata, legacy `cta` fallback).
 */
function isPrimaryCtaLinked(sectionData: any, elementKey: string): boolean {
  const bc = sectionData?.elementMetadata?.[elementKey]?.buttonConfig;
  if (bc?.type === 'link' && bc.url) return true;
  const legacy = sectionData?.cta;
  if (legacy?.type === 'link' && legacy.url) return true;
  return false;
}

/**
 * Feature 1 — derive the curated 4-task guide purely from live content + surface facts.
 * Always returns exactly 4 tasks (present may be false so the UI can gate them).
 */
export function deriveGuideTasks(
  content: Record<string, any>,
  surfaces: GuideSurfaces,
  globalSettings?: { logoUrl?: string }
): GuideTask[] {
  const {
    headerSectionId,
    footerSectionId,
    primaryCtas,
    hasImageElement,
    firstImageTarget,
    stockItems,
  } = surfaces;

  // --- add_logo ---
  const logoPresent = !!headerSectionId;
  const headerLogo = headerSectionId
    ? unwrapContentValue(content[headerSectionId]?.elements?.logo_image)
    : '';
  const logoDone = !!globalSettings?.logoUrl || headerLogo.length > 0;

  // --- link_ctas: done only when ALL present primary CTAs are linked ---
  const ctaPresent = primaryCtas.length > 0;
  const firstUnlinkedCta = primaryCtas.find(
    (cta) => !isPrimaryCtaLinked(content[cta.sectionId], cta.elementKey)
  );
  const ctaDone = ctaPresent && !firstUnlinkedCta;

  // --- replace_stock_photos: done when no stock/placeholder image remains ---
  const photosPresent = hasImageElement;
  const photosDone = stockItems.length === 0;
  const firstStock = stockItems[0]
    ? { sectionId: stockItems[0].sectionId, elementKey: stockItems[0].elementKey }
    : null;

  // --- add_contact ---
  const contactPresent = !!footerSectionId;
  const contactEmail = footerSectionId
    ? unwrapContentValue(content[footerSectionId]?.elements?.contact_email)
    : '';
  const contactAddress = footerSectionId
    ? unwrapContentValue(content[footerSectionId]?.elements?.contact_address)
    : '';
  const contactDone = contactEmail.length > 0 || contactAddress.length > 0;

  return [
    {
      id: 'add_logo',
      label: 'Add your logo',
      present: logoPresent,
      done: logoDone,
      target: headerSectionId ? { sectionId: headerSectionId, elementKey: 'logo_image' } : undefined,
    },
    {
      id: 'link_ctas',
      label: 'Link your CTA buttons',
      present: ctaPresent,
      done: ctaDone,
      target: (firstUnlinkedCta ?? primaryCtas[0]) ?? undefined,
    },
    {
      id: 'replace_stock_photos',
      label: 'Replace stock photos',
      present: photosPresent,
      done: photosDone,
      target: firstStock ?? firstImageTarget ?? undefined,
    },
    {
      id: 'add_contact',
      label: 'Add contact info',
      present: contactPresent,
      done: contactDone,
      target: footerSectionId ? { sectionId: footerSectionId, elementKey: 'contact_email' } : undefined,
    },
  ];
}

// ---------------------------------------------------------------------------
// Shared derivation — single scan, used by both initFromContent + refreshFromContent
// ---------------------------------------------------------------------------

/** The content-derived slice of review state (everything auto-computed from content). */
interface DerivedReview {
  reviewItems: ReviewItem[];
  needsReviewItems: ReviewItem[];
  /** Feature 2 — the needs_review items still equal to their baseline AI original (render source). */
  activeMarkers: ReviewItem[];
  guideTasks: GuideTask[];
  remainingCount: number;
  allComplete: boolean;
  totalCount: number;
  confirmedCount: number;
}

/**
 * Run the single content scan and derive the review slice (items, needs_review,
 * curated guide tasks, counts). Pure — no store access; `confirmedElements` is passed in.
 */
function deriveReviewState(
  content: Record<string, any>,
  sectionLayouts: Record<string, string>,
  sections: string[],
  confirmedElements: Set<string>,
  globalSettings?: { logoUrl?: string },
  baseline?: Record<string, any> | null,
  currentPageId?: string | null,
  dismissedReviewFlags: string[] = []
): DerivedReview {
  const items: ReviewItem[] = [];

  // Surface facts collected during the single scan → curated guide (Feature 1).
  let headerSectionId: string | null = null;
  let footerSectionId: string | null = null;
  const primaryCtas: Array<{ sectionId: string; elementKey: string }> = [];
  let hasImageElement = false;
  let firstImageTarget: { sectionId: string; elementKey: string } | null = null;

  for (const sectionId of sections) {
    const sectionData = content[sectionId];
    if (!sectionData) continue;

    const layoutName = sectionLayouts[sectionId];
    if (!layoutName) continue;

    const schema = layoutElementSchema[layoutName];
    if (!schema || !isV2Schema(schema)) continue;

    const elements = sectionData.elements || {};
    const excluded: string[] = sectionData.aiMetadata?.excludedElements || [];

    // proof-truth phase 4: sections whose quotes were injected from the real
    // (imported/table-backed) proof set carry aiMetadata.realProof. Suppress
    // needs-review markers for those sections — the quotes are real, not
    // AI-drafted. Section-level suppression is exact: injectRealTestimonials
    // overwrites the whole quote set (all-or-nothing per section). Other
    // statuses (stock_image, unconfigured, etc.) are unaffected.
    const suppressNeedsReview = !!sectionData.aiMetadata?.realProof;

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

      // Track non-logo image surfaces for the "replace stock photos" task.
      if (isImageElement(key) && !key.includes('logo')) {
        hasImageElement = true;
        if (!firstImageTarget) firstImageTarget = { sectionId, elementKey: key };
      }

      const status = getStatusForElement(def.fillMode, key, elements[key], def.default);
      if (status && !(status === 'needs_review' && suppressNeedsReview)) {
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
      primaryCtas.push({ sectionId, elementKey: 'cta_text' });
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

    // Header-specific config → surface fact for the "add logo" task.
    if (sectionType === 'header') {
      if (!headerSectionId) headerSectionId = sectionId;
      if (schema.collections?.nav_items && !effectiveExclusions.has('nav_items')) {
        items.push({
          sectionId, elementKey: '__nav_links__', type: 'unconfigured',
          severity: 'config', displayName: 'Navigation Links',
        });
      }
    }

    // Footer-specific config → surface fact for the "add contact" task.
    if (sectionType === 'footer') {
      if (!footerSectionId) footerSectionId = sectionId;
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
            if (status && !(status === 'needs_review' && suppressNeedsReview)) {
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
  let confirmedCount = 0;
  for (const item of items) {
    if (confirmedElements.has(`${item.sectionId}::${item.elementKey}`)) {
      confirmedCount++;
    }
  }

  // Feature 2 — isolate the AI-invented-specifics category (untouched, for markers).
  const needsReviewItems = items.filter((i) => i.type === 'needs_review');

  // Feature 2 auto-clear — a marker is ACTIVE only while the element still equals its
  // baseline AI original (i.e. unedited). Derive purely from (current content, baseline);
  // hold NO snapshot state so the result survives reload (baseline is immutable).
  //
  // Page-aware baseline root: on a multi-page project the live `content` is the ACTIVE page,
  // so the baseline for that page lives in `baseline.pages[currentPageId].content`. Fall back
  // to `baseline.content` (home body-only) when absent. NOTE the optional chaining on `.pages`
  // — a baseline captured before `pages` existed would otherwise throw.
  const baselineRoot =
    (currentPageId ? baseline?.pages?.[currentPageId]?.content : undefined) ??
    baseline?.content;
  const dismissed = new Set(dismissedReviewFlags);
  const activeMarkers = needsReviewItems.filter((item) => {
    // Phase 6 — a dismissed ("leave as-is") key is never active, regardless of value.
    if (dismissed.has(`${item.sectionId}::${item.elementKey}`)) return false;
    const currentVal = resolveElementValue(content, item.sectionId, item.elementKey);
    const baselineVal = resolveElementValue(baselineRoot, item.sectionId, item.elementKey);
    // Missing-baseline guard: no baseline for that page/element (e.g. legacy page) →
    // treat the marker as active (unchanged) rather than crashing.
    if (baselineVal === undefined) return true;
    return currentVal === baselineVal;
  });

  // Feature 1 — derive the curated 4-task guide from live content + surface facts.
  const stockItems = items.filter((i) => i.type === 'stock_image');
  const guideTasks = deriveGuideTasks(
    content,
    {
      headerSectionId,
      footerSectionId,
      primaryCtas,
      hasImageElement,
      firstImageTarget,
      stockItems,
    },
    globalSettings
  );
  const remainingCount = guideTasks.filter((t) => t.present && !t.done).length;

  return {
    reviewItems: items,
    needsReviewItems,
    activeMarkers,
    guideTasks,
    remainingCount,
    allComplete: remainingCount === 0,
    totalCount: items.length,
    confirmedCount,
  };
}

/** Structural equality of the derived slice, so a refresh can skip a no-op `set`. */
function derivedEqual(a: DerivedReview, b: DerivedReview): boolean {
  return (
    a.remainingCount === b.remainingCount &&
    a.allComplete === b.allComplete &&
    a.totalCount === b.totalCount &&
    a.confirmedCount === b.confirmedCount &&
    JSON.stringify(a.guideTasks) === JSON.stringify(b.guideTasks) &&
    JSON.stringify(a.needsReviewItems) === JSON.stringify(b.needsReviewItems) &&
    JSON.stringify(a.activeMarkers) === JSON.stringify(b.activeMarkers) &&
    JSON.stringify(a.reviewItems) === JSON.stringify(b.reviewItems)
  );
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useReviewState = create<ReviewState>()(
  devtools(
    (set, get) => ({
      reviewItems: [],
      needsReviewItems: [],
      activeMarkers: [],
      guideTasks: [],
      remainingCount: 0,
      allComplete: true,
      confirmedElements: new Set<string>(),
      totalCount: 0,
      confirmedCount: 0,
      sectionLayouts: {},
      sections: [],
      baseline: null,
      currentPageId: null,
      dismissedReviewFlags: [],

      initFromContent: (content, sectionLayouts, sections, globalSettings, baseline, currentPageId, dismissedReviewFlags) => {
        const { confirmedElements } = get();
        // Hydrate the persisted "leave as-is" dismisses (from finalContent) on first load.
        const nextDismissed = dismissedReviewFlags ?? [];
        const derived = deriveReviewState(
          content,
          sectionLayouts,
          sections,
          confirmedElements,
          globalSettings,
          baseline ?? null,
          currentPageId ?? null,
          nextDismissed
        );

        set({
          ...derived,
          // Retain scan inputs so a content-only refresh can re-derive without them.
          sectionLayouts,
          sections,
          baseline: baseline ?? null,
          currentPageId: currentPageId ?? null,
          dismissedReviewFlags: nextDismissed,
        });
      },

      refreshFromContent: (content, baseline, currentPageId, globalSettings) => {
        const state = get();
        // Fall back to the stored baseline / active page when the caller omits them, so the
        // auto-clear derivation always has the immutable AI-original reference to diff against.
        const effectiveBaseline = baseline !== undefined ? baseline : state.baseline;
        const effectivePageId =
          currentPageId !== undefined ? currentPageId : state.currentPageId;
        const derived = deriveReviewState(
          content,
          state.sectionLayouts,
          state.sections,
          state.confirmedElements,
          globalSettings,
          effectiveBaseline,
          effectivePageId,
          // Preserve dismisses across a content-only refresh — never wiped here.
          state.dismissedReviewFlags
        );

        // No-op guard: skip the `set` entirely when nothing content-derived changed,
        // so contentEditable keystrokes don't trigger review-state re-renders.
        const current: DerivedReview = {
          reviewItems: state.reviewItems,
          needsReviewItems: state.needsReviewItems,
          activeMarkers: state.activeMarkers,
          guideTasks: state.guideTasks,
          remainingCount: state.remainingCount,
          allComplete: state.allComplete,
          totalCount: state.totalCount,
          confirmedCount: state.confirmedCount,
        };
        const baselineChanged =
          baseline !== undefined && baseline !== state.baseline;
        const pageChanged =
          currentPageId !== undefined && (currentPageId ?? null) !== state.currentPageId;

        if (derivedEqual(derived, current) && !baselineChanged && !pageChanged) {
          return;
        }

        set({
          ...derived,
          // Keep the latest baseline / active page for Phase 5 auto-clear derivation.
          // Never touch confirmedElements or other user-set state here.
          ...(baseline !== undefined ? { baseline: baseline ?? null } : {}),
          ...(currentPageId !== undefined ? { currentPageId: currentPageId ?? null } : {}),
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

      dismiss: (sectionId, elementKey) => {
        const key = `${sectionId}::${elementKey}`;
        const { dismissedReviewFlags, activeMarkers } = get();
        if (dismissedReviewFlags.includes(key)) return;
        // A dismiss can only REMOVE a marker, never add one, so filter activeMarkers directly
        // (no re-scan / no stored content needed). Future refreshes also exclude it because
        // deriveReviewState reads state.dismissedReviewFlags.
        set({
          dismissedReviewFlags: [...dismissedReviewFlags, key],
          activeMarkers: activeMarkers.filter(
            (m) => `${m.sectionId}::${m.elementKey}` !== key
          ),
        });
      },

      clearDismissed: () => {
        const { dismissedReviewFlags, needsReviewItems } = get();
        if (dismissedReviewFlags.length === 0) return;
        // Clearing dismisses can only make previously-suppressed needs_review items active again.
        // We hold no live content here to re-run the value diff, but callers (Regen Copy) re-capture
        // baseline and fire a value-aware refreshFromContent immediately after — that produces the
        // authoritative activeMarkers. Set them to all needs_review now so nothing stays wrongly
        // suppressed in the gap.
        set({ dismissedReviewFlags: [], activeMarkers: needsReviewItems });
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
