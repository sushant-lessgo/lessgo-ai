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
import { workElementContract } from '@/modules/engines/workSections';

/**
 * Built work-skeleton layout name → the frozen work-core SECTION key it renders.
 * Grows as the layout library expands (phases 4/6/7). Phase 4: pilot Home set
 * (hero · header · work/gallery · proof · contact · footer).
 */
const WORK_LAYOUT_TO_SECTION: Record<string, string> = {
  WorkHeroSlider: 'hero',
  WorkHeader: 'header',
  WorkGalleryGrid: 'work',
  WorkProofTestimonials: 'proof',
  WorkContact: 'contact',
  WorkFooter: 'footer',
};

/** layoutName → element schema (the section's frozen contract). */
export const workLayoutElementSchema: Record<string, UIBlockSchemaV2> = Object.fromEntries(
  Object.entries(WORK_LAYOUT_TO_SECTION).map(([layoutName, sectionKey]) => {
    const contract = workElementContract[sectionKey];
    if (!contract) {
      throw new Error(`[work/elementSchema] no frozen contract for section "${sectionKey}" (layout "${layoutName}")`);
    }
    return [layoutName, contract];
  }),
);
