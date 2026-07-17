// src/modules/engines/workPages.ts
// ============================================================================
// WORK-VERTICAL PAGE VOCABULARY + SITE ARCHETYPES + PROPOSAL RULE
// (work-contract phase A / 2).
//
// PURE DATA. The authoritative, typed freeze of the work vertical's page-level
// structure so tracks C (copy engine), D (skeleton + template library) and E
// (onboarding) build against a stable contract without drift. No UI, no prompts,
// no renderers, no stores. Sibling to `workSections.ts` (which freezes the
// per-page section set); this module freezes the PAGES those sections live on.
//
// ── FREEZE (work-contract.spec.md §2) ───────────────────────────────────────
// CLOSED 8-page vocabulary (no other page kind exists for work):
//     home · work · work-group · prices · about · contact · project-story · blog
// SLUGS are FIXED in code here — the AI proposes PAGES, never slugs (mirrors the
// pageArchetypes.ts convention). `work-group` and `project-story` are PARAMETRIC
// (slugs derive from the user's group/item names via existing slugging, never AI).
// `blog` is an ATTACHMENT SLOT ONLY — the vocab reserves the slot; blog content is
// its own system (BlogPost table + per-post publish), NOT a work section list.
//
// 3 NAMED whole-site archetypes (the system PROPOSES one; the user DECIDES at the
// plan screen — same law as clampSitemap in strategy/parseStrategyProduct.ts):
//     one-pager ['home'] · compact ['home','work','contact'] ·
//     standard (default) ['home','work','prices','about','contact']
// Optionals (promoted work-group pages, project-story, blog) attach to any archetype.
//
// ── FIREWALL (D5) ───────────────────────────────────────────────────────────
//   Pure data. `import type` from pageArchetypes (VALUE import would drag
//   templateMeta/businessTypes into the graph and break the dynamic-import
//   firewall). Value imports allowed ONLY from other pure-data contract modules
//   (workSections, collections/registry). NEVER react / stores / hooks / template
//   runtime. No templateId / skeletonId literals.
// ============================================================================

import type { PageArchetypeDef } from '@/modules/audience/product/pageArchetypes';
import type { WorkSectionKey } from './workSections';
import { COLLECTIONS } from '@/modules/collections/registry';

// ─────────────────────────────────────────────────────────────────────────────
// Closed page-type vocabulary
// ─────────────────────────────────────────────────────────────────────────────

/** The closed 8-page vocabulary. No other page kind exists for the work vertical. */
export const workPageTypeKeys = [
  'home',
  'work',
  'work-group',
  'prices',
  'about',
  'contact',
  'project-story',
  'blog',
] as const;

export type WorkPageTypeKey = (typeof workPageTypeKeys)[number];

/**
 * A work page definition = the shared `PageArchetypeDef` shape (key/title/pathSlug/
 * required/defaultIncluded/allowedSections/requiredSections/defaultSections/
 * description) extended with `parametric` for pages whose slug carries a dynamic
 * segment (`work-group`, `project-story`). `allowedSections`/`requiredSections`/
 * `defaultSections` are BODY-ONLY WorkSectionKeys — header/footer chrome is injected
 * at page boundaries, never part of a page's section list (pageArchetypes convention).
 */
export interface WorkPageDef extends PageArchetypeDef {
  /** True when pathSlug carries a dynamic segment (slug derived from user names, never AI). */
  parametric?: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// The 8 page types — FIXED slugs in code.
// ─────────────────────────────────────────────────────────────────────────────

export const workPageTypes: Record<WorkPageTypeKey, WorkPageDef> = {
  // The main landing page — hero + a teaser of work + proof + a way to get in
  // touch. May be the ONLY page (one-pager archetype). Cannot be removed.
  home: {
    key: 'home',
    title: 'Home',
    pathSlug: '/',
    required: true,
    defaultIncluded: true,
    allowedSections: ['hero', 'work', 'proof', 'packages', 'about', 'contact'],
    requiredSections: ['hero'],
    defaultSections: ['hero', 'work', 'proof', 'contact'],
    description:
      'The main landing page — a striking opening, a teaser of selected work, proof, and a way to get in touch. May be the only page for a small/new business.',
  },

  // The portfolio in depth — the full work gallery (a group reference into the
  // `works` collection), with proof.
  work: {
    key: 'work',
    title: 'Work',
    pathSlug: '/work',
    defaultIncluded: true,
    allowedSections: ['work', 'proof', 'contact', 'results'],
    requiredSections: ['work'],
    defaultSections: ['work', 'proof'],
    description:
      'The full work gallery — every selected piece/project, grouped, with proof. The portfolio in depth.',
  },

  // A PROMOTED group page (one category/collection of work). PARAMETRIC — the
  // slug segment derives from the user's group name via existing slugging, never
  // AI. Attaches to any archetype; not part of the base site.
  'work-group': {
    key: 'work-group',
    title: 'Work Group',
    pathSlug: '/work/[group]',
    parametric: true,
    defaultIncluded: false,
    allowedSections: ['work', 'proof', 'contact'],
    requiredSections: ['work'],
    defaultSections: ['work'],
    description:
      'A single promoted group of work (one category/collection). Right when a group is large enough to earn its own page.',
  },

  // Packages & prices in depth — the conviction pillar. "On request" is legal.
  prices: {
    key: 'prices',
    title: 'Prices',
    pathSlug: '/prices',
    defaultIncluded: true,
    allowedSections: ['packages', 'faq', 'contact'],
    requiredSections: ['packages'],
    defaultSections: ['packages'],
    description:
      'The offering as packages with prices ("on request" is legal). Right when the seller wants prices on their own page.',
  },

  // Your story in depth.
  about: {
    key: 'about',
    title: 'About',
    pathSlug: '/about',
    defaultIncluded: true,
    allowedSections: ['about', 'proof', 'process', 'team', 'stats'],
    requiredSections: ['about'],
    defaultSections: ['about', 'proof'],
    description:
      'The story behind the work — who is behind it, the approach, and proof. Right when there is real history worth telling.',
  },

  // How to reach — the lead-mechanism page.
  contact: {
    key: 'contact',
    title: 'Contact',
    pathSlug: '/contact',
    defaultIncluded: true,
    allowedSections: ['contact'],
    requiredSections: ['contact'],
    defaultSections: ['contact'],
    description: 'The enquiry / contact page with the lead mechanism (form / WhatsApp / booking).',
  },

  // A single project story — client, brief, result, photos. PARAMETRIC — the slug
  // segments derive from the group + item names. Archetype `key` REUSES
  // COLLECTIONS.works (work-detail / work-catalog) so project-story pages ride the
  // one collections spine, never a fork.
  'project-story': {
    key: COLLECTIONS.works.itemArchetypeKey, // 'work-detail'
    title: 'Project Story',
    pathSlug: '/work/[group]/[item]',
    parametric: true,
    defaultIncluded: false,
    allowedSections: ['workdetail', 'proof', 'contact'],
    requiredSections: ['workdetail'],
    defaultSections: ['workdetail'],
    description:
      'One project told in full — client, brief, result, and photos. The story-seller page for a single work item.',
  },

  // ATTACHMENT SLOT ONLY. Blog is its own system (BlogPost table + per-post
  // blob/KV publish) — the vocab only reserves the slot so a site can carry it.
  // It has NO work section list of its own, hence `allowedSections: []`.
  blog: {
    key: 'blog',
    title: 'Blog',
    pathSlug: '/blog',
    defaultIncluded: false,
    allowedSections: [], // blog is its own system — no work sections attach here
    requiredSections: [],
    defaultSections: [],
    description:
      'An attachment slot for the blog system (its own publish pipeline). The vocabulary only reserves the slot.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-page conversion goal (E4 plan screen)
// ─────────────────────────────────────────────────────────────────────────────
//
// A page's "goal" = the one action it asks a visitor to take. Closed enum that
// MIRRORS the `contactMethod` fact rail (workFacts.schema.ts slot 7:
// whatsapp|booking|form). Carried + persisted as a forward contract
// (WorkSitemapPage.goal, Brief.structure.pageDetails[].goal); generation does
// NOT consume it yet. Plain user-facing wording lives ONLY in workVocabulary.ts
// (single-source rename law) — this module holds keys/logic only.

/** The closed per-page goal enum. Mirrors the `contactMethod` fact rail. */
export const WORK_PAGE_GOAL_KEYS = ['whatsapp', 'booking', 'form'] as const;

export type WorkPageGoalKey = (typeof WORK_PAGE_GOAL_KEYS)[number];

/**
 * Default goal for a page. Per the workEndtoEnd sketch: every page defaults to
 * the seller's chosen contact method, EXCEPT the contact page which always
 * defaults to `'form'`. When `contactMethod` is absent (not yet confirmed) the
 * neutral fallback is `'form'` (matches the contact-page default).
 */
export function defaultGoalForPage(
  pageKey: string,
  contactMethod?: WorkPageGoalKey
): WorkPageGoalKey {
  if (pageKey === 'contact') return 'form';
  return contactMethod ?? 'form';
}

/**
 * The designed add-page menu: page types the user may ADD to the plan that are
 * not already present. Excludes `home` (required — never removable, never in
 * the menu) and the parametric `work-group` (needs a specific group to attach
 * to). Includes `blog` + `project-story` as explicit adds (only the auto-
 * proposal rule excludes them). `currentKeys` = the page-type keys already in
 * the sitemap.
 */
export function addableWorkPages(currentKeys: string[]): WorkPageTypeKey[] {
  const present = new Set<string>(currentKeys);
  return workPageTypeKeys.filter(
    (key) => key !== 'home' && key !== 'work-group' && !present.has(key)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Named whole-site archetypes
// ─────────────────────────────────────────────────────────────────────────────

export type WorkSiteArchetypeKey = 'one-pager' | 'compact' | 'standard';

/**
 * The 3 named archetypes as ordered page lists. `home` is always first. Optionals
 * (promoted work-group pages, project-story, blog) are NOT in these base lists —
 * they attach to any archetype separately.
 */
export const workSiteArchetypes: Record<WorkSiteArchetypeKey, readonly WorkPageTypeKey[]> = {
  'one-pager': ['home'],
  compact: ['home', 'work', 'contact'],
  standard: ['home', 'work', 'prices', 'about', 'contact'],
};

/** Default whole-site archetype when signals are absent/ambiguous. */
export const defaultWorkSiteArchetype: WorkSiteArchetypeKey = 'standard';

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic proposal rule (zero AI)
// ─────────────────────────────────────────────────────────────────────────────
//
// Mirrors clampSitemap's PHILOSOPHY (strategy/parseStrategyProduct.ts): the system
// PROPOSES a deterministic structure; the user DECIDES at the plan screen. Output
// invariants (enforced below, tested phase 5): pages ⊆ closed vocab, `home` always
// first, archetype ∈ the 3 names, blog / project-story never auto-proposed.

/**
 * Thresholds are the planner's call — placeholder values, tuned at the track-E pilot
 * against real onboarding signal. Named + exported so the phase-5 test and the pilot
 * can reference/adjust them in one place.
 */
// STUB — planner's call, tune at track-E pilot
export const ONE_PAGER_MAX_ITEMS = 3;
// STUB — planner's call, tune at track-E pilot
export const STANDARD_MIN_GROUPS = 3;
// STUB — planner's call, tune at track-E pilot
export const PROMOTE_GROUP_MIN = 2;

/** Signals the proposal rule reads (all derived from the Brief facts, no AI). */
export interface WorkStructureSignals {
  /** Total work items (shoots / projects / pieces) across all groups. */
  workItemCount: number;
  /** Number of top-level groups (categories / collections). */
  groupCount: number;
  /** Whether the seller has given any prices (packages present). */
  pricesPresent: boolean;
  /** Whether the seller is established (vs brand-new) — favours a fuller site. */
  established: boolean;
}

/** The deterministic proposal: an archetype, its ordered pages, and group promotions. */
export interface WorkStructureProposal {
  archetype: WorkSiteArchetypeKey;
  pages: WorkPageTypeKey[];
  /** How many groups earn their own promoted `work-group` page (0 = none). */
  promotedGroupCount: number;
}

/**
 * Propose a whole-site structure from onboarding signals. Deterministic, zero AI.
 *
 * Rule (conservative — small/new sellers get a lean site, rich/established sellers
 * get the standard site):
 *   - one-pager  when the seller has very few items, one-or-zero groups, no prices,
 *                and is not established;
 *   - standard   when there are enough groups OR prices OR the seller is established;
 *   - compact    otherwise (the middle ground).
 * `promotedGroupCount` counts groups that clear PROMOTE_GROUP_MIN; when > 0 a
 * `work-group` page is inserted after `work` (still inside the closed vocab). blog
 * and project-story are NEVER auto-proposed — they are user-attached optionals.
 */
export function proposeWorkSiteStructure(signals: WorkStructureSignals): WorkStructureProposal {
  const { workItemCount, groupCount, pricesPresent, established } = signals;

  let archetype: WorkSiteArchetypeKey;
  if (
    workItemCount <= ONE_PAGER_MAX_ITEMS &&
    groupCount <= 1 &&
    !pricesPresent &&
    !established
  ) {
    archetype = 'one-pager';
  } else if (groupCount >= STANDARD_MIN_GROUPS || pricesPresent || established) {
    archetype = 'standard';
  } else {
    archetype = 'compact';
  }

  const promotedGroupCount = groupCount >= PROMOTE_GROUP_MIN ? groupCount : 0;

  // Base pages from the chosen archetype (home always first, by construction).
  const pages: WorkPageTypeKey[] = [...workSiteArchetypes[archetype]];

  // A promoted group page rides inside the closed vocab — insert `work-group`
  // right after `work` when the base site actually carries a `work` page.
  if (promotedGroupCount > 0) {
    const workIdx = pages.indexOf('work');
    if (workIdx >= 0 && !pages.includes('work-group')) {
      pages.splice(workIdx + 1, 0, 'work-group');
    }
  }

  return { archetype, pages, promotedGroupCount };
}
