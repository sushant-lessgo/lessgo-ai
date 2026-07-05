// src/modules/audience/product/pageArchetypes.ts
// Per-template PAGE-ARCHETYPE menu for multi-page sitemap proposal (newGeneration
// Phase 2). AUDIENCE-LEVEL PURE DATA (like elementSchema.ts): the strategy route
// (server) reads this to constrain the LLM's sitemap proposal, and the review UI
// reads it to render add/remove affordances — template modules stay behind the
// dynamic-import firewall and are never imported here.
//
// A page archetype describes what a page of that kind MAY contain (allowedSections),
// MUST contain (requiredSections), and what it looks like by default. Section
// types are BODY-ONLY — header/footer are shared chrome, injected at page
// boundaries, never part of a page's section list.

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
 * Page-archetype menu for a template, or null when the template is single-page
 * (meridian/techpremium → null → the sitemap gate is SKIPPED, zero behavior
 * change for existing templates).
 */
export function getPageArchetypesForTemplate(
  templateId: string | null | undefined
): PageArchetypeDef[] | null {
  if (templateId === 'vestria') return VESTRIA_PAGE_ARCHETYPES;
  return null;
}
