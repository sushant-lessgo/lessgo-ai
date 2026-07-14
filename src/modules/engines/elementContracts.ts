// src/modules/engines/elementContracts.ts
// scale-07 phase 8 — per-engine (engine, sectionType) → element-list contract.
//
// The §3 invariant "copy depends on engine + Brief only" made true in code for
// the GENERATION path: getCompleteElementsMap()/createElementsMap() (see
// src/modules/sections/elementDetermination.ts) resolve a section's element
// list from THIS contract, keyed off (engine, sectionType) — no longer from the
// template-specific layout NAME. The layout name survives only as a display
// handle (which block renders) and, here, as the pointer that identifies the
// (engine, sectionType) pair — the LIST itself always comes from the contract.
//
// SEEDING (output-preservation guarantee): the thing contract is built at
// module load by UNIONING today's meridian + vestria schemas per shared
// section, per the founder divergence rule (plan Q4, resolved 2026-07-09):
//   contract = current MERIDIAN list, PLUS vestria-only fields the vestria
//   block renders (every vestria schema field is block-rendered — the schemas
//   were derived from the blocks), taken as a union. On key collisions the
//   meridian def wins (requirement/fillMode/default). Vestria-only ELEMENTS
//   enter demoted to requirement:'optional' — meridian owns the mandatory set;
//   vestria extras are additive opportunities, never new mandates. Vestria-only
//   COLLECTIONS keep their own requirement (all optional today); fields that
//   vestria adds INSIDE a shared collection (e.g. features.kicker) are unioned
//   into the meridian collection def.
// Sections only ONE thing template generates (meridian pricing/cta; vestria
// trust/industries/about/materials/process/catalog/contact) are taken verbatim
// from their sole schema — byte-identical output to today.
//
// NOT covered on the GENERATION path (deliberate, plan phase 8):
// - trust + work engines — service legacy + granth stay on the layout path
//   (getLayoutElements) untouched.
//   NOTE (work-contract phase 1): `work` is now covered as DATA — the frozen
//   work-core element contract (workSections.ts) is registered below as
//   `elementContracts.work`. It is INERT at runtime: resolveEngineSectionSchema()
//   is gated by THING_GENERATION_LAYOUTS (thing-only), so no work/granth layout
//   name resolves through here. The generation path still routes work via the
//   layout path until track C wires it. Registration = contract availability,
//   zero behavior change.
// - Editor-runtime callers (useElementCRUD.getLayoutElements, useSectionCRUD's
//   local map, validationActions' local map) — layout path, untouched (no
//   engine context at editor add-section/add-element time).
// - techpremium/naayom EDITOR-ONLY meridian-schema blocks (TrustStrip,
//   ProblemPains, ProcessSteps, ExplainerRows, ProductLineup, GalleryMasonry,
//   CompatibilityChips, FaqDisclosures, GalleryFullPage, ContactForm,
//   ProductCatalogList, ProductDetailRecord) and the Shared* goal blocks —
//   never produced by the thing generation pipeline; they resolve via the
//   layout path so techpremium/naayom regeneration output is unchanged.
//
// Firewall: imports AUDIENCE-LEVEL pure-data schemas only — no template module,
// block, or resolver ever enters this file.

import type { CopyEngine } from '@/types/brief';
import type {
  UIBlockSchemaV2,
  ElementDef,
  CollectionDef,
} from '@/modules/sections/layoutElementSchema';
import {
  meridianElementSchema,
  vestriaElementSchema,
} from '@/modules/audience/product/elementSchema';
import { workElementContract } from './workSections';

/**
 * Union two-or-more V2 schemas for the SAME logical section.
 * Base (meridian) wins on every key collision; extra-side (vestria) elements
 * enter demoted to optional; extra-side fields inside shared collections are
 * unioned in (base fields win per key).
 */
function unionSchemas(base: UIBlockSchemaV2, ...extras: UIBlockSchemaV2[]): UIBlockSchemaV2 {
  const elements: Record<string, ElementDef> = { ...base.elements };
  const collections: Record<string, CollectionDef> = { ...(base.collections ?? {}) };

  for (const extra of extras) {
    for (const [key, def] of Object.entries(extra.elements)) {
      if (!(key in elements)) {
        elements[key] = { ...def, requirement: 'optional' };
      }
    }
    for (const [name, coll] of Object.entries(extra.collections ?? {})) {
      if (!(name in collections)) {
        collections[name] = coll;
      } else {
        // Shared collection: base def wins; union in extra-only FIELDS.
        collections[name] = {
          ...collections[name],
          fields: { ...coll.fields, ...collections[name].fields },
        };
      }
    }
  }

  return {
    sectionType: base.sectionType,
    elements,
    ...(Object.keys(collections).length > 0 ? { collections } : {}),
  };
}

/**
 * The thing-engine section → element contract. Same Brief ⇒ same element list
 * under meridian and vestria: both templates' generations resolve a shared
 * section to the SAME entry here.
 */
export const thingElementContract: Readonly<Record<string, UIBlockSchemaV2>> = {
  // ── Shared thing-core sections (meridian ∪ vestria, meridian wins) ──
  header: unionSchemas(
    meridianElementSchema.MeridianNavHeader,
    vestriaElementSchema.VestriaNavHeader
  ),
  // Hero unions BOTH vestria hero variants: VestriaFullBleedHero shares
  // VestriaTailoredHero's copy keys and adds 3 manual_preferred video keys —
  // included so a full-bleed page's element gating never drops uploaded media.
  hero: unionSchemas(
    meridianElementSchema.TerminalHero,
    vestriaElementSchema.VestriaTailoredHero,
    vestriaElementSchema.VestriaFullBleedHero
  ),
  features: unionSchemas(
    meridianElementSchema.HairlineFeatureGrid,
    vestriaElementSchema.VestriaServicesGrid
  ),
  testimonials: unionSchemas(
    meridianElementSchema.ProofWithLogoRail,
    vestriaElementSchema.VestriaQuotes
  ),
  footer: unionSchemas(
    meridianElementSchema.HairlineFooter,
    vestriaElementSchema.VestriaFooter
  ),

  // ── Capability sections generated by exactly ONE thing template — verbatim ──
  pricing: meridianElementSchema.ThreeTierPricing,
  cta: meridianElementSchema.ArcCTA,
  trust: vestriaElementSchema.VestriaClientStrip,
  industries: vestriaElementSchema.VestriaIndustriesGrid,
  about: vestriaElementSchema.VestriaAboutStats,
  materials: vestriaElementSchema.VestriaMaterials,
  process: vestriaElementSchema.VestriaProcessRail,
  catalog: vestriaElementSchema.VestriaCatalogueGrid,
  contact: vestriaElementSchema.VestriaLeadForm,
};

/**
 * Per-engine contracts. `thing` (scale-07 phase 8) drives generation. `work`
 * (work-contract phase 1) is the frozen work-core contract — registered as DATA
 * only; it is inert on the generation path (resolveEngineSectionSchema is
 * thing-gated) until track C wires the work copy engine. `trust` (service)
 * generation still keeps the existing layout-keyed path.
 */
export const elementContracts: Partial<
  Record<CopyEngine, Readonly<Record<string, UIBlockSchemaV2>>>
> = {
  thing: thingElementContract,
  work: workElementContract,
};

/**
 * GENERATION-path layout names of the thing engine — the layouts the meridian
 * and vestria generation pipelines actually emit. Membership here is the ONLY
 * thing the layout name decides on the generation path (which engine +
 * sectionType this section is); the element list comes from the contract.
 *
 * Deliberately EXCLUDES the techpremium/naayom editor-only meridian-schema
 * blocks and the Shared* goal blocks (see header note) — those fall through to
 * the layout path unchanged.
 */
const THING_GENERATION_LAYOUTS: ReadonlySet<string> = new Set([
  // meridian generation blocks
  'MeridianNavHeader',
  'TerminalHero',
  'HairlineFeatureGrid',
  'ProofWithLogoRail',
  'ThreeTierPricing',
  'ArcCTA',
  'HairlineFooter',
  // meridian block VARIANTS (scale-09 phase 6) — copy-compatible skins that a
  // section may carry after an editor swap; each resolves the SAME contract as
  // its default sibling (hero / features / testimonials).
  'EditorialPhotoHero',
  'LedgerFeatureList',
  'CenteredEditorialTestimonials',
  // vestria generation blocks (+ the full-bleed hero variant)
  'VestriaNavHeader',
  'VestriaTailoredHero',
  'VestriaFullBleedHero',
  'VestriaClientStrip',
  'VestriaIndustriesGrid',
  'VestriaAboutStats',
  'VestriaServicesGrid',
  'VestriaCatalogueGrid',
  'VestriaMaterials',
  'VestriaProcessRail',
  'VestriaQuotes',
  'VestriaLeadForm',
  'VestriaFooter',
]);

/**
 * Resolve a section's engine-contract schema from its layout name, or null
 * when the layout is not engine-covered (service legacy, work, editor-only
 * blocks, unknown layouts) — callers fall back to the layout path.
 */
export function resolveEngineSectionSchema(layoutName: string): UIBlockSchemaV2 | null {
  if (!THING_GENERATION_LAYOUTS.has(layoutName)) return null;
  const source = meridianElementSchema[layoutName] ?? vestriaElementSchema[layoutName];
  if (!source) return null;
  return thingElementContract[source.sectionType] ?? null;
}
