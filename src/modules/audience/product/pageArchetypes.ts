// src/modules/audience/product/pageArchetypes.ts
// Per-template PAGE-ARCHETYPE menu for multi-page sitemap proposal (newGeneration
// Phase 2). AUDIENCE-LEVEL PURE DATA (like elementSchema.ts): the strategy route
// (server) reads this to constrain the LLM's sitemap proposal, and the review UI
// reads it to render add/remove affordances — template modules stay behind the
// dynamic-import firewall and are never imported here (templateMeta/businessTypes
// are pure-data siblings, firewall-safe).
//
// A page archetype describes what a page of that kind MAY contain (allowedSections),
// MUST contain (requiredSections), and what it looks like by default. Section
// types are BODY-ONLY — header/footer are shared chrome, injected at page
// boundaries, never part of a page's section list.
//
// scale-07 phase 5: multipage is a CAPABILITY question, not a templateId
// hardcode. `getPageArchetypesForTemplate` keys off the template's declared
// `multipage` capability (templateMeta) + its archetype registry entry;
// `isMultipage` folds in the Brief signal (structure.mode / businessType
// structureDefault) for the detection sites.

import type { Brief } from '@/types/brief';
import type { TemplateId } from '@/types/service';
import { templateMeta } from '@/modules/templates/templateMeta';
import { businessTypes, type BusinessTypeKey } from '@/modules/businessTypes/config';

export interface PageArchetypeDef {
  /** Stable key — persisted on ProjectPageEntry.archetypeKey. */
  key: string;
  /** Default page title (user-editable in the gate). */
  title: string;
  /** Fixed path — the AI proposes pages, never slugs. Home is always '/'. */
  pathSlug: string;
  /** Home: cannot be removed from the sitemap. */
  required?: boolean;
  /** Included in the default/fallback sitemap when the LLM omits a proposal. */
  defaultIncluded: boolean;
  /** Body section types this page may carry (subset of the template's types). */
  allowedSections: string[];
  /** Body section types this page must carry (inserted if the LLM drops them). */
  requiredSections: string[];
  /** Default body section order (used for fallback + newly added pages). */
  defaultSections: string[];
  /** One line — feeds both the strategy prompt and the review UI. */
  description: string;
}

/** Vestria (manufacturing/trade lead-gen) page menu. */
export const VESTRIA_PAGE_ARCHETYPES: PageArchetypeDef[] = [
  {
    key: 'home',
    title: 'Home',
    pathSlug: '/',
    required: true,
    defaultIncluded: true,
    allowedSections: [
      'hero', 'trust', 'industries', 'about', 'features',
      'catalog', 'materials', 'process', 'testimonials', 'contact',
    ],
    requiredSections: ['hero'],
    defaultSections: [
      'hero', 'trust', 'industries', 'about', 'features',
      'catalog', 'materials', 'process', 'testimonials', 'contact',
    ],
    description:
      'The main landing page — hero, proof, and an overview of everything the business does. May be the ONLY page for a small/new business.',
  },
  {
    key: 'about',
    title: 'About',
    pathSlug: '/about',
    defaultIncluded: true,
    allowedSections: ['about', 'process', 'testimonials', 'trust'],
    requiredSections: ['about'],
    defaultSections: ['about', 'process', 'testimonials'],
    description:
      'Company story in depth — history, values, how they work, and the proof behind it. Right when the business has real history worth telling.',
  },
  {
    key: 'industries',
    title: 'Industries',
    pathSlug: '/industries',
    defaultIncluded: true,
    allowedSections: ['industries', 'testimonials', 'contact'],
    requiredSections: ['industries'],
    defaultSections: ['industries', 'testimonials'],
    description:
      'Sector-by-sector detail — one card per industry served, with sector-specific proof. Right when the business serves 3+ distinct sectors.',
  },
  {
    key: 'services',
    title: 'Services',
    pathSlug: '/services',
    defaultIncluded: true,
    allowedSections: ['features', 'process', 'materials'],
    requiredSections: ['features'],
    defaultSections: ['features', 'process'],
    description:
      'The service offering in depth — what they do, how the engagement runs, what it is made from/with.',
  },
  {
    key: 'catalogue',
    title: 'Catalogue',
    pathSlug: '/catalogue',
    defaultIncluded: true,
    allowedSections: ['catalog', 'materials'],
    requiredSections: ['catalog'],
    defaultSections: ['catalog', 'materials'],
    description:
      'The product/item range as a browsable grid (+ materials). Right when the business sells enumerable items.',
  },
  {
    key: 'contact',
    title: 'Contact',
    pathSlug: '/contact',
    defaultIncluded: true,
    allowedSections: ['contact'],
    requiredSections: ['contact'],
    defaultSections: ['contact'],
    description: 'The quote-request / contact page with the lead form.',
  },
];

/**
 * Atelier (visual-portfolio / work engine — Kundius Photography anchor) 5-page
 * menu: Home / Work / Experiences / About / Contact. Body section types are the
 * ones atelier actually RESOLVES (work-skeleton resolveWorkBlock): hero, work,
 * packages, about, proof, contact. `header`/`footer` are shared chrome — never in
 * a page's section list. NOTE: the dark quote/testimonial band is `proof` (the
 * skeleton registry key; the old skin's `quote` type was retired at the
 * atelier-skeleton-cutover). Photographers default to `multi` (businessTypes
 * config), so the whole menu (all 5 `defaultIncluded`) is the served skeleton
 * default.
 */
export const ATELIER_PAGE_ARCHETYPES: PageArchetypeDef[] = [
  {
    key: 'home',
    title: 'Home',
    pathSlug: '/',
    required: true,
    defaultIncluded: true,
    allowedSections: ['hero', 'work', 'proof', 'packages', 'about', 'contact'],
    requiredSections: ['hero'],
    defaultSections: ['hero', 'work', 'proof', 'contact'],
    description:
      'The main landing page — a striking hero, a teaser of selected work, a client quote, and a call to get in touch.',
  },
  {
    key: 'work',
    title: 'Work',
    pathSlug: '/work',
    required: true,
    defaultIncluded: true,
    allowedSections: ['work', 'proof', 'contact'],
    requiredSections: ['work'],
    defaultSections: ['work', 'proof'],
    description:
      'The portfolio in depth — the full selected-work gallery (the gallery capability), with a client quote.',
  },
  {
    key: 'experiences',
    title: 'Experiences',
    pathSlug: '/experiences',
    defaultIncluded: true,
    allowedSections: ['packages', 'proof', 'contact'],
    requiredSections: ['packages'],
    defaultSections: ['packages', 'proof'],
    description:
      'The offering as tiered packages/experiences — two-to-four options, plus a client quote. Right when the studio sells distinct package tiers.',
  },
  {
    key: 'about',
    title: 'About',
    pathSlug: '/about',
    defaultIncluded: true,
    allowedSections: ['about', 'proof', 'packages'],
    requiredSections: ['about'],
    defaultSections: ['about', 'proof'],
    description:
      'The studio story — who is behind the camera, the approach, and a client quote as proof.',
  },
  {
    key: 'contact',
    title: 'Contact',
    pathSlug: '/contact',
    defaultIncluded: true,
    allowedSections: ['contact'],
    requiredSections: ['contact'],
    defaultSections: ['contact'],
    description: 'The enquiry / contact page with the lead form (shared-block lead-form lane).',
  },
];

/**
 * Archetype registry — the page menus, keyed by the template that OWNS them.
 * A template appears here iff it ships a page-archetype menu; the `multipage`
 * capability declaration (templateMeta) is what makes the menu REACHABLE.
 */
const PAGE_ARCHETYPES_BY_TEMPLATE: Record<string, PageArchetypeDef[]> = {
  vestria: VESTRIA_PAGE_ARCHETYPES,
  atelier: ATELIER_PAGE_ARCHETYPES,
};

/** Does this template declare the `multipage` capability (templateMeta)? */
function hasMultipageCapability(templateId: string | null | undefined): boolean {
  if (!templateId) return false;
  const meta = templateMeta[templateId as TemplateId];
  return !!meta && meta.capabilities.includes('multipage');
}

/**
 * Page-archetype menu for a template, or null when the template is single-page.
 * scale-07 phase 5 re-key: the template must DECLARE the `multipage` capability
 * (templateMeta) AND ship an archetype registry entry — no templateId hardcode.
 * Today only vestria satisfies both, so behavior is identical; the key is now
 * honest (meridian/techpremium → null → the sitemap gate is skipped).
 *
 * `registry` is test-injection only (a hypothetical multipage-capable template
 * with its own menu) — production callers use the default.
 */
export function getPageArchetypesForTemplate(
  templateId: string | null | undefined,
  registry: Record<string, PageArchetypeDef[]> = PAGE_ARCHETYPES_BY_TEMPLATE
): PageArchetypeDef[] | null {
  if (!hasMultipageCapability(templateId)) return null;
  return registry[templateId as string] ?? null;
}

/**
 * The single multipage-detection helper (scale-07 phase 5, plan step 1) —
 * called by all detection sites (strategy route, assembleProductStrategy,
 * StructureSlot) and thing.ts's fan-out branch:
 *
 *   template `multipage` capability
 *     ∧ ( Brief structure.mode === 'multi'
 *         ∨ businessType structureDefault === 'multi'
 *         ∨ no Brief signal at all )
 *
 * Capability is a hard gate. An explicit Brief `structure.mode` wins over the
 * businessType default. When the caller has NO Brief signal (no brief, or a
 * brief without structure/businessType) the capability alone decides — that is
 * today's behavior (vestria is always multi), kept so the re-key is
 * behavior-identical.
 */
export function isMultipage(
  templateId: string | null | undefined,
  brief?: Pick<Brief, 'structure' | 'businessType'> | null
): boolean {
  if (!hasMultipageCapability(templateId)) return false;
  const mode = brief?.structure?.mode;
  if (mode === 'multi') return true;
  if (mode === 'single') return false;
  const key = brief?.businessType as BusinessTypeKey | undefined;
  const entry = key && key in businessTypes ? businessTypes[key] : undefined;
  if (entry) return entry.structureDefault === 'multi';
  return true; // capability alone — no Brief signal to override it
}
