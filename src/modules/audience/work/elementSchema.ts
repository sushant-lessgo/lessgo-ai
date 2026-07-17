// src/modules/audience/work/elementSchema.ts
// WORK layout → element schema, DERIVED programmatically from the FROZEN work-core
// element contract (src/modules/engines/workSections.ts → workElementContract).
// One entry per BUILT work-skeleton layout name, mapping it to its section's frozen
// contract. These entries are SPREAD into `serviceElementSchema`
// (audience/service/elementSchema.ts) — the SAME registration lane old atelier's
// `Atelier*` layouts use — so BOTH `contractFor`/`classify` (manifest conformance)
// AND the `layoutElementSchema` aggregator see them with zero conformance-layer
// patch. (`contractFor` reads productElementSchema ?? serviceElementSchema, NOT the
// layoutElementSchema aggregator — so reaching serviceElementSchema is required.)
//
// FIREWALL: this READS the pure-data contract; it does NOT make the engine import a
// skeleton/skin module (the copy firewall is preserved). Pure data — no React.
//
// SLOTS are absent: a slot (e.g. WorkHeroVideo) has no built component and no
// schema — it is never generated/offered, so it never needs a layout schema.

import type { UIBlockSchemaV2 } from '@/modules/sections/layoutElementSchema';
import { workElementContract, workProofShapeContracts } from '@/modules/engines/workSections';

/**
 * Built work-skeleton layout name → the frozen work-core SECTION key it renders.
 * Grows as the layout library expands (phases 4/6/7). Every layout that renders a
 * given section maps to the SAME section contract (arrangement variants share the
 * section's content shape) — EXCEPT the alternate proof SHAPES, which read a
 * DIFFERENT collection and so bind their own proof-shape contract below.
 *
 * Phase 4: pilot Home set. Phase 6: layout library — the 4 non-default header
 * arrangements (internal dispatch → same `header` contract), the 3 alternate hero
 * arrangements, the 2 alternate galleries, the 2 alternate proof SHAPES.
 */
const WORK_LAYOUT_TO_SECTION: Record<string, string> = {
  // hero — all arrangements share the frozen `hero` contract.
  WorkHeroSlider: 'hero',
  WorkHeroImage: 'hero',
  WorkHeroSplit: 'hero',
  WorkHeroCenter: 'hero',
  // header — all 5 arrangements (internal dispatch) share the `header` contract.
  WorkHeader: 'header',
  WorkHeaderStart: 'header',
  WorkHeaderCentered: 'header',
  WorkHeaderSplit: 'header',
  WorkHeaderMinimal: 'header',
  // work/gallery — all arrangements share the `work` (group-reference) contract.
  WorkGalleryGrid: 'work',
  WorkGalleryMasonry: 'work',
  WorkGalleryStrip: 'work',
  // proof — the DEFAULT (testimonials) shape IS workElementContract.proof.
  WorkProofTestimonials: 'proof',
  WorkContact: 'contact',
  WorkFooter: 'footer',
  // phase 7 — remaining MUST sections (packages/about) + optionals (faq/results).
  WorkPackages: 'packages',
  WorkAbout: 'about',
  WorkFaq: 'faq',
  WorkResults: 'results',
  // work-onboarding-ingestion E2 / phase 2 — COLLECTION-MACHINERY sections. Keyed
  // LOWERCASE because, unlike the section-picker arrangements above (stored
  // PascalCase), the collections fan-out stores the layout as the lowercase SECTION
  // TYPE (buildCollection{Catalog,Item}Slice → catType/itType, no COLLECTION_BLOCK_
  // LAYOUTS override for `works`). This registration is what lets the EDIT/preview
  // renderer resolve their content (getSchemaDefaults(layout) → this schema).
  workcatalog: 'workcatalog',
  workdetail: 'workdetail',
};

/**
 * Alternate proof SHAPES bind their OWN proof-shape contract (they read a different
 * collection than the default testimonials shape — logos vs metrics vs quotes).
 * Registered directly so `contractFor(layoutName)` resolves the right element/
 * collection set for each shape's `consumes` conformance.
 */
const WORK_PROOF_SHAPE_LAYOUTS: Record<string, UIBlockSchemaV2> = {
  WorkProofLogos: workProofShapeContracts.logos,
  WorkProofResults: workProofShapeContracts.results,
};

/** layoutName → element schema (the section's frozen contract). */
export const workLayoutElementSchema: Record<string, UIBlockSchemaV2> = {
  ...Object.fromEntries(
    Object.entries(WORK_LAYOUT_TO_SECTION).map(([layoutName, sectionKey]) => {
      const contract = workElementContract[sectionKey];
      if (!contract) {
        throw new Error(`[work/elementSchema] no frozen contract for section "${sectionKey}" (layout "${layoutName}")`);
      }
      return [layoutName, contract];
    }),
  ),
  ...WORK_PROOF_SHAPE_LAYOUTS,
};
