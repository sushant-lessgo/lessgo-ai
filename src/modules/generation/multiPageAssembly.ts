// src/modules/generation/multiPageAssembly.ts
// AI multi-page finalContent assembly (newGeneration Phase 3). Emits the exact
// shape buildTechPremiumHomeFinalContent produces (flat home + chrome + pages +
// homeId/currentPageId) so loadDraft / multi-page normalization / edit / publish
// behave identically — but built from PER-PAGE AI COPY, incrementally, with
// per-page persistence (a paid page is saved before the next one generates).
//
// HARD INVARIANT (PO review blocker 2): this assembler NEVER calls
// materializeIntoPages / materializeHomeTeasers and NEVER sets `collectionKey`
// or `kind: 'collectionItem'` on any page — vestria's catalog is a grid of
// plain ai_generated items, not a registered collection. Guarded by
// multiPageAssembly.test.ts.

import type { SectionCopy } from '@/types/generation';
import type { SitemapPage } from '@/types/product';
import { selectProductBlocks } from '@/modules/audience/product/selectBlocks';

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
  const { uiblocks } = selectProductBlocks({ sections: allTypes, templateId });

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
