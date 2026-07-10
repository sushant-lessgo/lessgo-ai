// src/modules/generation/multiPageAssembly.ts
// AI multi-page finalContent assembly (newGeneration Phase 3). Emits the exact
// shape buildTechPremiumHomeFinalContent produces (flat home + chrome + pages +
// homeId/currentPageId) so loadDraft / multi-page normalization / edit / publish
// behave identically — but built from PER-PAGE AI COPY, incrementally, with
// per-page persistence (a paid page is saved before the next one generates).
//
// HARD INVARIANT (PO review blocker 2): the SITEMAP fan-out
// (mergePageIntoFinalContent) NEVER calls materializeIntoPages /
// materializeHomeTeasers and NEVER sets `collectionKey` or `kind:
// 'collectionItem'` on a sitemap page — vestria's catalog is a grid of plain
// ai_generated items, not a registered collection.
//
// scale-10 phase 5: the invariant now holds EXCEPT behind the registry-gated
// collections bridge below (assembleCollectionPages / runCollectionFanOut),
// which DOES stamp `kind:'collectionItem'` + `collectionKey`. That path fires
// only under a DOUBLE GATE — (a) getCollectionDef(K) exists AND (b) the template
// declares collection-family capability K — so it ships DORMANT (no live template
// declares one) and vestria's flat-grid `catalog` (not a CollectionKey, no
// registry def) is explicitly OUTSIDE it. Guarded by multiPageAssembly.test.ts.

import type { SectionCopy } from '@/types/generation';
import type { SitemapPage } from '@/types/product';
import { selectProductBlocks } from '@/modules/audience/product/selectBlocks';
import { getCollectionDef, type CollectionKey } from '@/modules/collections/registry';
import type { CollectionEntry, CollectionsFacts } from '@/modules/brief/collections';
import { buildCollectionCatalogSlice, buildCollectionItemSlice } from '@/hooks/editStore/archetypes';

/** Everything a RESUMED run needs that the in-memory store would have lost —
 *  persisted into finalContent.onboardingData at skeleton-save time. */
export interface MultiPageOnboardingData {
  oneLiner: string;
  productName: string;
  understanding: any;
  landingGoal: string | null;
  offer: string;
  importSourceUrl?: string;
  importedTestimonials?: Array<{ quote: string; author_name: string; author_role: string }>;
  /** businessType key (scale-08 phase 1) — copy-voice source on resumed fan-out. */
  businessTypeKey?: string;
  /** The user-AGREED sitemap (gate output). */
  sitemap: SitemapPage[];
  /** The gate's strategy — generate-copy needs it on every per-page call. */
  strategy: any;
  /** scale-10 phase 5 — Brief-carried collection entries (facts.collections),
   *  persisted so a resumed fan-out can rebuild collection pages. Optional; the
   *  bridge is DORMANT until a template declares a collection-family capability. */
  collections?: CollectionsFacts;
}

export interface GenerationProgress {
  completedPageKeys: string[];
}

/** Template-specific lead-form spec (e.g. vestria's contactFields). */
export interface SiteFormSpec {
  fields: any[];
  submitButtonText: string;
  successMessage: string;
}

/** One shared 'Contact' MVPForm for the whole site (mirror of pageActions'
 *  ensureContactForm). Idempotent — resume finds the persisted form again
 *  (forms live at finalContent.forms, which loadFromDraft restores). */
function ensureSiteContactForm(fc: any, spec: SiteFormSpec): string {
  if (!fc.forms) fc.forms = {};
  const existing = Object.values(fc.forms).find((f: any) => f?.name === 'Contact');
  if (existing) return (existing as any).id;
  const id = `form-${Date.now()}`;
  fc.forms[id] = {
    id,
    name: 'Contact',
    fields: JSON.parse(JSON.stringify(spec.fields)),
    submitButtonText: spec.submitButtonText,
    successMessage: spec.successMessage,
    integrations: [{ id: 'int-dashboard', type: 'dashboard', name: 'Dashboard', enabled: true }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return id;
}

const sectionUid = (type: string) =>
  `${type}-${globalThis.crypto.randomUUID().slice(0, 8)}`;

/**
 * Skeleton finalContent saved BEFORE any copy call — makes the paid gate output
 * (sitemap + strategy) durable, and marks the draft as generation-in-progress
 * (generationProgress present ⇒ resumable).
 */
export function buildMultiPageSkeleton(opts: {
  tokenId: string;
  title: string;
  onboardingData: MultiPageOnboardingData;
}): any {
  return {
    layout: { sections: [], sectionLayouts: {}, theme: {}, globalSettings: {} },
    content: {},
    meta: {
      id: opts.tokenId,
      title: opts.title,
      slug: '',
      lastUpdated: Date.now(),
      version: 1,
      tokenId: opts.tokenId,
    },
    onboardingData: opts.onboardingData,
    generatedAt: Date.now(),
    pages: {},
    homeId: '',
    currentPageId: '',
    generationProgress: { completedPageKeys: [] } as GenerationProgress,
  };
}

/** True when a draft is a resumable in-progress multi-page generation. */
export function isResumableGeneration(fc: any): boolean {
  return !!(
    fc &&
    fc.generationProgress &&
    Array.isArray(fc.generationProgress.completedPageKeys) &&
    Array.isArray(fc.onboardingData?.sitemap) &&
    fc.onboardingData?.strategy
  );
}

/**
 * Merge ONE page's processed copy into the finalContent (mutates fc).
 * Home carries chrome (header/footer generated in its call) and becomes the
 * flat top-level for back-compat; every page is stored BODY-ONLY in fc.pages
 * (chrome is injected at page boundaries by the loader/publish).
 */
export function mergePageIntoFinalContent(opts: {
  fc: any;
  page: SitemapPage;
  order: number;
  copy: Record<string, SectionCopy>;
  templateId: string;
  /** Provision the shared lead form when this page carries a contact section. */
  formSpec?: SiteFormSpec;
}): void {
  const { fc, page, order, copy, templateId, formSpec } = opts;
  const isHome = page.pathSlug === '/';

  const bodyTypes = [...page.sections];
  const allTypes = isHome ? ['header', ...bodyTypes, 'footer'] : bodyTypes;
  // scale-09 phase 4 — deterministic card-count hints from the persisted
  // onboarding data. Optional; no-op for existing single-variant sections.
  const ob = fc.onboardingData as MultiPageOnboardingData | undefined;
  const fanFeatures: string[] = ob?.understanding?.valueAdds ?? ob?.understanding?.features ?? [];
  const cardCountHints: Record<string, number> = {};
  if (fanFeatures.length > 0) cardCountHints.features = fanFeatures.length;
  if (ob?.importedTestimonials?.length) cardCountHints.testimonials = ob.importedTestimonials.length;
  const { uiblocks } = selectProductBlocks({ sections: allTypes, templateId, cardCountHints });

  const ids: Record<string, string> = {};
  const sectionLayouts: Record<string, string> = {};
  const content: Record<string, any> = {};

  for (const type of allTypes) {
    const id = sectionUid(type);
    ids[type] = id;
    const layout = uiblocks[type] || 'default';
    sectionLayouts[id] = layout;
    const elements = copy[type]?.elements ?? {};
    content[id] = {
      id,
      layout,
      elements,
      backgroundType: 'neutral',
      aiMetadata: {
        aiGenerated: true,
        isCustomized: false,
        lastGenerated: Date.now(),
        aiGeneratedElements: Object.keys(elements),
        excludedElements: [],
      },
    };
  }

  // Lead form: ONE shared 'Contact' MVPForm for the whole site — every contact
  // section (home strip and/or contact page) points at the same form_id.
  if (bodyTypes.includes('contact') && formSpec) {
    const formId = ensureSiteContactForm(fc, formSpec);
    const contactId = ids['contact'];
    if (contactId && content[contactId]) content[contactId].elements.form_id = formId;
  }

  const bodyIds = bodyTypes.map((t) => ids[t]);
  const bodyContent: Record<string, any> = {};
  for (const id of bodyIds) bodyContent[id] = content[id];
  const bodyLayouts: Record<string, string> = {};
  for (const id of bodyIds) bodyLayouts[id] = sectionLayouts[id];

  // Body-only page entry. NOTE: no collectionKey, never kind:'collectionItem'.
  const entry: any = {
    id: page.archetypeKey,
    archetypeKey: page.archetypeKey,
    pathSlug: page.pathSlug,
    title: page.title,
    order,
    sections: bodyIds,
    sectionLayouts: bodyLayouts,
    sectionSpacing: {},
    content: bodyContent,
  };
  if (!isHome) entry.kind = 'singleton';
  fc.pages[page.archetypeKey] = entry;

  if (isHome) {
    const headerId = ids['header'];
    const footerId = ids['footer'];
    fc.chrome = {
      header: { id: headerId, layout: sectionLayouts[headerId], data: content[headerId] },
      footer: { id: footerId, layout: sectionLayouts[footerId], data: content[footerId] },
    };
    // Flat top-level = home WITH chrome inline (back-compat single-page loaders).
    fc.layout = {
      sections: [headerId, ...bodyIds, footerId],
      sectionLayouts,
      theme: {},
      globalSettings: {},
    };
    fc.content = { ...content };
    fc.homeId = page.archetypeKey;
    fc.currentPageId = page.archetypeKey;
  }

  fc.meta.lastUpdated = Date.now();
  if (fc.generationProgress && !fc.generationProgress.completedPageKeys.includes(page.archetypeKey)) {
    fc.generationProgress.completedPageKeys.push(page.archetypeKey);
  }
}

/** Generation complete — drop the in-progress marker (draft becomes final). */
export function finalizeMultiPageGeneration(fc: any): void {
  delete fc.generationProgress;
  fc.generatedAt = Date.now();
  fc.meta.lastUpdated = Date.now();
}

// ═══════════════════════════════════════════════════════════════════════════
// scale-10 phase 5 — generation→collections bridge (ships DORMANT)
// ═══════════════════════════════════════════════════════════════════════════
// DOUBLE GATE: a key K fires iff (a) getCollectionDef(K) exists in the registry
// AND (b) the template declares collection-family capability K. NO live template
// declares one, so firingCollectionKeys() returns [] for every real template
// today — this whole path is exercised only by tests passing a fixture
// capability list. vestria's flat-grid `catalog` is not a CollectionKey and has
// no registry def, so it can never fire (the invariant holds on vestria).

/** Item-record fields seeded VERBATIM from the Brief entry — the clamp on merge
 *  never lets AI copy overwrite these. */
const VERBATIM_ITEM_FIELDS = new Set(['name', 'oneLiner', 'images', 'slug']);

export interface CollectionItemPagePlan {
  pageKey: string; // fc.pages key (also the page id)
  collectionKey: CollectionKey;
  slug: string; // code-derived entry slug (never AI)
  pathSlug: string; // def.basePath + '/' + slug
  entry: CollectionEntry;
}

/** Keys that fire the bridge: registry def exists AND capability declared. Dedup
 *  preserves declaration order. Empty for every live template (dormant). */
export function firingCollectionKeys(declaredCapabilities: readonly string[]): CollectionKey[] {
  const out: CollectionKey[] = [];
  const seen = new Set<string>();
  for (const cap of declaredCapabilities) {
    const def = getCollectionDef(cap);
    if (def && !seen.has(def.key)) {
      seen.add(def.key);
      out.push(def.key);
    }
  }
  return out;
}

/** All Brief-entry slugs for the firing keys — the CLAMP set (intersect by slug). */
function collectionBriefSlugs(collections: CollectionsFacts, keys: CollectionKey[]): Set<string> {
  const s = new Set<string>();
  for (const k of keys) for (const e of collections[k] ?? []) s.add(e.slug);
  return s;
}

/**
 * Emit the index singleton + one collectionItem page per Brief entry for every
 * firing key (index-page composition per founder decision 5: the collection def
 * owns topology + the required grid section; the template supplies blocks only).
 * Empty collection ⇒ index only. Idempotent / resume-safe: never overwrites an
 * existing page key (a resumed run keeps already-built pages). Slugs are ALWAYS
 * code-derived (`def.basePath + '/' + entry.slug`), never taken from AI. Returns
 * the item-page plans so the caller's copy fan-out can fill connective copy.
 *
 * GUARD: the bridge must NOT assume a resolvable block exists for services /
 * case-studies / works until rung-C — today the capability gate guarantees it
 * (only a template that declares the family capability, whose blocks conformance
 * proves exist, can pass a firing key here).
 */
export function assembleCollectionPages(opts: {
  fc: any;
  collections: CollectionsFacts;
  declaredCapabilities: readonly string[];
}): CollectionItemPagePlan[] {
  const { fc } = opts;
  if (!fc.pages) fc.pages = {};
  const keys = firingCollectionKeys(opts.declaredCapabilities);
  const plans: CollectionItemPagePlan[] = [];
  let order = Object.keys(fc.pages).length;
  for (const key of keys) {
    const def = getCollectionDef(key)!;
    const entries = opts.collections[key] ?? [];
    const catKey = `page-${def.catalogArchetypeKey}`;
    if (!fc.pages[catKey]) {
      fc.pages[catKey] = {
        id: catKey,
        archetypeKey: def.catalogArchetypeKey,
        pathSlug: def.basePath,
        title: def.label,
        order: order++,
        kind: 'singleton',
        collectionKey: key,
        ...buildCollectionCatalogSlice(key),
      };
    }
    for (const entry of entries) {
      const pathSlug = `${def.basePath}/${entry.slug}`;
      const pageKey = `page-${entry.slug}`;
      if (!fc.pages[pageKey]) {
        fc.pages[pageKey] = {
          id: pageKey,
          archetypeKey: def.itemArchetypeKey,
          pathSlug,
          title: entry.name,
          order: order++,
          kind: 'collectionItem',
          collectionKey: key,
          ...buildCollectionItemSlice(key, entry),
        };
      }
      plans.push({ pageKey, collectionKey: key, slug: entry.slug, pathSlug, entry });
    }
  }
  return plans;
}

/**
 * Merge ONE item page's AI connective copy into fc — CLAMPED:
 *  • the plan must match a Brief entry (intersect by slug); an AI item whose
 *    slug is not in the Brief set is DROPPED (no page created or mutated),
 *  • record fields (VERBATIM_ITEM_FIELDS on the item section) are NEVER
 *    overwritten — AI supplies only connective copy for the rest.
 * Marks the page complete in generationProgress (resume) when present.
 */
export function mergeCollectionItemCopy(opts: {
  fc: any;
  plan: CollectionItemPagePlan;
  briefSlugs: Set<string>;
  copy: Record<string, SectionCopy>;
}): void {
  const { fc, plan, briefSlugs, copy } = opts;
  if (!briefSlugs.has(plan.slug)) return; // CLAMP: not a Brief entry
  const page = fc.pages?.[plan.pageKey];
  if (!page) return;
  const def = getCollectionDef(plan.collectionKey);
  for (const sid of page.sections ?? []) {
    const sec = page.content?.[sid];
    if (!sec) continue;
    const type = sec.type ?? String(sid).split('-')[0];
    const ai = copy[type]?.elements;
    if (!ai) continue;
    if (!sec.elements) sec.elements = {};
    for (const [field, value] of Object.entries(ai)) {
      if (def && type === def.itemSectionType && VERBATIM_ITEM_FIELDS.has(field)) continue;
      sec.elements[field] = value;
    }
  }
  const gp = fc.generationProgress;
  if (gp && Array.isArray(gp.completedPageKeys) && !gp.completedPageKeys.includes(plan.pageKey)) {
    gp.completedPageKeys.push(plan.pageKey);
  }
}

export type CollectionFanOutResult =
  | { status: 'done' }
  | { status: 'credits' }
  | { status: 'error'; error: string };

/**
 * The full collections fan-out, shared by the thing / trust / work adapters:
 * build the pages (assembleCollectionPages), persist them, then fill each item
 * page's connective copy via the injected `generateItemCopy` closure (the
 * adapter owns the actual route call + record-carrying payload). CLAMP + verbatim
 * record fields are handled by mergeCollectionItemCopy. Charge stays FLAT — this
 * adds no strategy call (decision 3: no per-item charging). Per-page persistence/
 * resume: item page keys ride generationProgress.completedPageKeys, and
 * already-completed keys are skipped.
 *
 * DORMANT: returns immediately when no key fires (every live template today) —
 * assembleCollectionPages is not even called, so fc is untouched.
 */
export async function runCollectionFanOut(opts: {
  fc: any;
  collections: CollectionsFacts;
  declaredCapabilities: readonly string[];
  generateItemCopy: (
    plan: CollectionItemPagePlan
  ) => Promise<
    | { status: 'done'; copy: Record<string, SectionCopy> }
    | { status: 'credits' }
    | { status: 'error'; error: string }
  >;
  persist: (fc: any) => Promise<void>;
}): Promise<CollectionFanOutResult> {
  const keys = firingCollectionKeys(opts.declaredCapabilities);
  if (keys.length === 0) return { status: 'done' }; // dormant — no live trigger
  const plans = assembleCollectionPages({
    fc: opts.fc,
    collections: opts.collections,
    declaredCapabilities: opts.declaredCapabilities,
  });
  await opts.persist(opts.fc); // durable index (+ fresh item shells) before copy
  const briefSlugs = collectionBriefSlugs(opts.collections, keys);
  for (const plan of plans) {
    const gp = opts.fc.generationProgress;
    if (gp?.completedPageKeys?.includes(plan.pageKey)) continue;
    const r = await opts.generateItemCopy(plan);
    if (r.status === 'credits') return { status: 'credits' };
    if (r.status === 'error') return { status: 'error', error: r.error };
    mergeCollectionItemCopy({ fc: opts.fc, plan, briefSlugs, copy: r.copy });
    await opts.persist(opts.fc);
  }
  return { status: 'done' };
}
