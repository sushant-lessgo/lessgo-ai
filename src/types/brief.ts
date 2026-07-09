// src/types/brief.ts
// Shared closed enums for the Brief record (scale track, scalePlan §§2/3/7) +
// canonical re-export of `type Brief` (inferred from the zod schema in
// src/lib/schemas/brief.schema.ts — single source of truth, no dual-maintained
// interface). Import Brief from HERE (`@/types/brief`), not the schema file.
//
// These lists are FROZEN closed vocabularies (scalePlan §11.2): copy engines,
// capability ids, and design styles are coder-maintained; do not extend them
// casually — every downstream catalog/shortlist/gate keys on them.

/**
 * ===== COPY ENGINES =====
 * The closed copy-engine set (scalePlan §2): thing (products), trust
 * (expertise/services), work (the work itself). place/quick-yes reserved.
 */
export const copyEngines = ['thing', 'trust', 'work'] as const;
export type CopyEngine = (typeof copyEngines)[number];

/**
 * ===== CAPABILITIES =====
 * Closed capability vocabulary (scalePlan §7). Block-backed vs structural split
 * lives in the conformance tests (spec 01 phase 4), not here.
 */
export const capabilityIds = [
  'multipage',
  'gallery',
  // `catalog` = vestria's FLAT-GRID capability (plain ai_generated items on one
  // page) — it is NOT a collection and must NEVER key a CollectionDef
  // (src/modules/collections/registry.ts). It merely shares the name with the
  // collection concept; see the family ids below.
  'catalog',
  'map-hours',
  'bilingual',
  'video-hero',
  'store-badges',
  'lead-form',
  'packages',
  'blog',
  // scale-07 phase 2 (founder-approved extension, discovery-driven): vestria's
  // non-mappable extra sections become EXPLICIT-TRIGGER capabilities. They are
  // NEVER auto-inferred by requiredCapabilitiesFromBrief() (fit.ts) — they
  // enter a page only via explicit inclusion at the 7b structure gate. See
  // EXPLICIT_TRIGGER_CAPABILITIES in src/modules/templates/fit.ts.
  'trust',
  'industries',
  'about',
  'materials',
  'process',
  // scale-10 collection FAMILY (per-type collection capabilities). A template
  // declaring one of these opts its pages into the generation→collections
  // bridge for that key. These map 1:1 to CollectionKey / the collections
  // registry (src/modules/collections/registry.ts). `locations` is reserved
  // for P3 (place engine) and is intentionally NOT added yet.
  'products',
  'services',
  'case-studies',
  'works',
] as const;
export type CapabilityId = (typeof capabilityIds)[number];

/**
 * ===== DESIGN STYLES =====
 * Closed design-style vocabulary — one per shipped template family feel.
 */
export const designStyles = [
  'tech-minimal',
  'editorial-craft',
  'warm-human',
  'authority-professional',
  'bold-performance',
  'literary-quiet',
] as const;
export type DesignStyle = (typeof designStyles)[number];

// Canonical Brief type — inferred from BriefSchema (zod = source of truth).
export type { Brief } from '@/lib/schemas/brief.schema';
