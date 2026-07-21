// src/modules/engines/workSections.ts
// ============================================================================
// WORK-CORE SECTION FREEZE + WORK ELEMENT CONTRACT (work-contract phase A / 1).
//
// PURE DATA. This module is the authoritative, typed freeze of the work-vertical
// section set and its per-section element shapes. It exists so tracks C (copy
// engine), D (skeleton + template library) and E (onboarding) can build against a
// stable contract without drift. No UI, no prompts, no renderers, no stores.
//
// ── FREEZE (agreed 2026-07-14; work-contract.spec.md §1) ────────────────────
// MUST (8) — every work template DESIGNS all of these (a DESIGNER obligation,
//   never a user obligation; the user may remove any section at the plan screen
//   or in the editor):
//     header · hero · work · proof · packages · about · contact · footer
// OPTIONAL (7):
//     results · faq · process · stats · logos · team · workdetail
// PROOF SHAPES (3) — variants of the ONE `proof` section, NOT extra must-sections:
//     testimonials (default) · logos · results
//
// ── EVIDENCE (coverage-100 findings §6, N=14 work corpus) ───────────────────
//   founderNote 12/14  → `about` (your story) is a MUST.
//   leadForm   13/14   → `contact` (how to reach) is a MUST.
//   prices      3/14   → `packages` is a MUST by CONVICTION OVERRIDE (ruled a
//                        conversion pillar; "on request" is a legal price answer),
//                        not by frequency.
//   results     7/14   → OPTIONAL, but the recommended default for designers /
//                        agencies.
//
// ── DONOR MAPPING (granth = writer/Granth template; lumen = bespoke §13) ─────
//   | internal key | granth donor          | lumen donor        |
//   |--------------|-----------------------|--------------------|
//   | header       | (none — single-page)  | header             |
//   | hero         | GranthArchedHero      | hero               |
//   | work         | GranthJacketShelf(*)  | portfolio          |
//   | proof        | GranthCriticsGrid     | logos              |
//   | packages     | (none)                | services           |
//   | about        | GranthParichay        | about              |
//   | contact      | (none — lumen/vestria)| contact            |
//   | footer       | GranthFollowFooter    | footer             |
//   (*) `work` renders a group REFERENCE onto the `works` CollectionKey
//       (COLLECTIONS.works) — it does NOT fork granth's book-item shape. Items
//       live in the collection; `work` seeds only the gallery + group frame.
//
// ── D1 INVARIANT (do NOT merge with coreSections) ───────────────────────────
//   `engineCoreSections.work` (coreSections.ts) is the conformance-tested SUBSET
//   that shipping templates must resolve TODAY (`hero · work · about · footer`).
//   It is intentionally NOT grown to the full freeze — growing it would un-ship
//   granth (no header/proof/packages/contact blocks), a behavior change the spec
//   forbids. The relationship is a SUBSET, asserted in the phase-5 test:
//       engineCoreSections.work ⊆ workMustSections
//   Templates converge on the full freeze in track D; this module is authoritative
//   NOW. Never replace/merge the two constants.
//
// ── FIREWALL (D5) ───────────────────────────────────────────────────────────
//   Imports allowed: other pure-data contract modules + `import type` from schema
//   modules. NEVER react / stores / hooks / template runtime. No templateId /
//   skeletonId literals.
// ============================================================================

import type {
  UIBlockSchemaV2,
  ElementDef,
  CollectionDef,
} from '@/modules/sections/layoutElementSchema';
import { writerElementSchema } from '@/modules/audience/writer/elementSchema';
import { COLLECTIONS } from '@/modules/collections/registry';

// ─────────────────────────────────────────────────────────────────────────────
// Section-key freeze
// ─────────────────────────────────────────────────────────────────────────────

/** MUST sections — every work template designs all 8 (designer obligation). */
export const workMustSections = [
  'header',
  'hero',
  'work',
  'proof',
  'packages',
  'about',
  'contact',
  'footer',
] as const;

/** OPTIONAL sections — offered, never mandated. `workdetail` = project-story page. */
export const workOptionalSections = [
  'results',
  'faq',
  'process',
  'stats',
  'logos',
  'team',
  'workdetail',
] as const;

export type WorkMustSectionKey = (typeof workMustSections)[number];
export type WorkOptionalSectionKey = (typeof workOptionalSections)[number];
/** Every valid work-core section key (must ∪ optional). */
export type WorkSectionKey = WorkMustSectionKey | WorkOptionalSectionKey;

// ─────────────────────────────────────────────────────────────────────────────
// Proof shapes — variants of the ONE `proof` section (never separate sections)
// ─────────────────────────────────────────────────────────────────────────────

export const workProofShapes = ['testimonials', 'logos', 'results'] as const;
export type WorkProofShape = (typeof workProofShapes)[number];
/** Default proof shape = "what clients say" (verbatim testimonials). */
export const defaultWorkProofShape: WorkProofShape = 'testimonials';

// ─────────────────────────────────────────────────────────────────────────────
// Element-contract helpers (pure)
// ─────────────────────────────────────────────────────────────────────────────

/** Every work element is user-owned (voice = the seller's), mirroring granth. */
const FILL = 'manual_preferred' as const;

/** Neutral string element. */
function str(requirement: 'required' | 'optional', def = ''): ElementDef {
  return { type: 'string', requirement, fillMode: FILL, default: def };
}

/**
 * Re-seed a granth donor schema onto a work-core section: keep its element +
 * collection SHAPE, re-key `sectionType`, and blank the Hindi placeholder
 * defaults (the contract is language-neutral; wording lands in track E). This is
 * a lineage-preserving copy — the donor is the proof the shape already ships.
 */
function fromDonor(donor: UIBlockSchemaV2, sectionType: string): UIBlockSchemaV2 {
  const elements: Record<string, ElementDef> = {};
  for (const [key, def] of Object.entries(donor.elements)) {
    elements[key] = { ...def, default: def.type === 'string' ? '' : def.default };
  }
  const out: UIBlockSchemaV2 = { sectionType, elements };
  if (donor.collections) {
    out.collections = { ...donor.collections } as Record<string, CollectionDef>;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// MUST-section contracts
// ─────────────────────────────────────────────────────────────────────────────

// chrome: top menu. granth is single-page (no donor); minimal nav frame.
const headerContract: UIBlockSchemaV2 = {
  sectionType: 'header',
  elements: {
    logo_text: str('required'),
    // Optional wordmark IMAGE. Manual lane (`fillMode:'system'`) — never AI-emitted;
    // the text wordmark stays the default. `WorkHeader.core` already binds
    // `E.Logo imageKey="logo_image"`; empty → wordmark, unchanged.
    logo_image: { type: 'string', requirement: 'optional', fillMode: 'system', default: '' },
    cta_label: str('optional'),
    cta_href: str('optional', '#contact'),
  },
  collections: {
    nav_links: {
      requirement: 'optional',
      fillMode: FILL,
      constraints: { min: 0, max: 6 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        label: { type: 'string', fillMode: FILL, default: '' },
        href: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

// opening. Donor: GranthArchedHero.
const heroContract = fromDonor(writerElementSchema.GranthArchedHero, 'hero');

// work gallery — a group REFERENCE onto the `works` collection (no forked item
// shape; items live in COLLECTIONS.works). `groups` are the promoted top-level
// buckets (categories/collections), each pointing into the collection.
const workContract: UIBlockSchemaV2 = {
  sectionType: 'work',
  elements: {
    eyebrow: str('optional'),
    heading: str('required'),
    lead: str('optional'),
  },
  collections: {
    // Group-level reference frame. One spine with the collections registry:
    // items are held by COLLECTIONS.works ('${WORKS_COLLECTION_KEY}'), never here.
    groups: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 12 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        name: { type: 'string', fillMode: FILL, default: '' },
        cover_image: { type: 'string', fillMode: FILL, default: '' },
        href: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

// proof — DEFAULT shape = testimonials. Donor: GranthCriticsGrid (praise).
// This object IS the registered `proof` schema AND workProofShapeContracts.testimonials.
const proofTestimonialsContract = fromDonor(writerElementSchema.GranthCriticsGrid, 'proof');

// packages & prices — conviction pillar. Price display slots per package;
// "on request" is legal (price_mode default 'on-request', price_line optional).
const packagesContract: UIBlockSchemaV2 = {
  sectionType: 'packages',
  elements: {
    eyebrow: str('optional'),
    heading: str('required'),
    lead: str('optional'),
  },
  collections: {
    packages: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 6 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        name: { type: 'string', fillMode: FILL, default: '' },
        // Per-tier category label (Wave 2b — per-card, matching the designer
        // `.atl-pack` where each tier card shows its own category). AI-drafted +
        // editable (manual_preferred): WorkFacts carries no category, so it has
        // no facts source — the model drafts a short label, the seller can edit.
        // Optional (default '') → graceful-empty: a tier with no category renders
        // EXACTLY today's card (no node).
        category: { type: 'string', fillMode: FILL, default: '' },
        // price display slots: mode drives whether an amount is shown.
        price_mode: { type: 'string', fillMode: FILL, default: 'on-request' }, // exact | from | on-request
        price_line: { type: 'string', fillMode: FILL, default: 'On request' },
        description: { type: 'string', fillMode: FILL, default: '' },
        cta_label: { type: 'string', fillMode: FILL, default: '' },
        // Wave 2 packages quad — per-tier extensions. All optional, graceful-empty
        // (empty → today's card markup exactly).
        //  • bullets — newline-delimited "what's included" list, split at render.
        //    AI-drafted (manual_preferred), but facts-verbatim-injected at parse
        //    (injectPackages) when the seller stated group items.
        //  • image / featured — MANUAL lane (`fillMode:'system'`): never AI-emitted
        //    (isSystemField skip in the prompt + the parse-time system-key strip);
        //    set only via the editor (picker / toggle).
        bullets: { type: 'string', fillMode: FILL, default: '' },
        image: { type: 'string', fillMode: 'system', default: '' },
        featured: { type: 'string', fillMode: 'system', default: '' },
      },
    },
  },
};

// your story. Donor: GranthParichay.
const aboutContract = fromDonor(writerElementSchema.GranthParichay, 'about');

// how to reach — REFERENCES a lead mechanism (forms internals are scope-OUT).
// `contact_method` picks the mechanism; `form_ref` names a form the forms system owns.
const contactContract: UIBlockSchemaV2 = {
  sectionType: 'contact',
  elements: {
    eyebrow: str('optional'),
    heading: str('required'),
    lead: str('optional'),
    contact_method: str('required', 'form'), // whatsapp | booking | form
    form_ref: str('optional'), // reference to a form owned by the forms system
    cta_label: str('optional'),
  },
};

// chrome: page bottom. Donor: GranthFollowFooter.
const footerContract = fromDonor(writerElementSchema.GranthFollowFooter, 'footer');

// ─────────────────────────────────────────────────────────────────────────────
// OPTIONAL-section contracts
// ─────────────────────────────────────────────────────────────────────────────

// results / outcomes — recommended default for designers/agencies (7/14).
const resultsContract: UIBlockSchemaV2 = {
  sectionType: 'results',
  elements: {
    eyebrow: str('optional'),
    heading: str('required'),
    lead: str('optional'),
  },
  collections: {
    metrics: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 6 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        value: { type: 'string', fillMode: FILL, default: '' },
        label: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

const faqContract: UIBlockSchemaV2 = {
  sectionType: 'faq',
  elements: {
    eyebrow: str('optional'),
    heading: str('required'),
  },
  collections: {
    items: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 12 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        question: { type: 'string', fillMode: FILL, default: '' },
        answer: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

const processContract: UIBlockSchemaV2 = {
  sectionType: 'process',
  elements: {
    eyebrow: str('optional'),
    heading: str('required'),
    lead: str('optional'),
  },
  collections: {
    steps: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 8 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        title: { type: 'string', fillMode: FILL, default: '' },
        description: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

const statsContract: UIBlockSchemaV2 = {
  sectionType: 'stats',
  elements: {
    eyebrow: str('optional'),
    heading: str('optional'),
  },
  collections: {
    stats: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 6 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        value: { type: 'string', fillMode: FILL, default: '' },
        label: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

// seen-with / featured-in. Deliberately ALSO a proof shape (documented duplication).
const logosContract: UIBlockSchemaV2 = {
  sectionType: 'logos',
  elements: {
    heading: str('optional'),
  },
  collections: {
    logos: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 12 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        name: { type: 'string', fillMode: FILL, default: '' },
        image: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

const teamContract: UIBlockSchemaV2 = {
  sectionType: 'team',
  elements: {
    eyebrow: str('optional'),
    heading: str('required'),
    lead: str('optional'),
  },
  collections: {
    members: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 12 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        name: { type: 'string', fillMode: FILL, default: '' },
        role: { type: 'string', fillMode: FILL, default: '' },
        photo: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

// project-story page — freezes the story-seller FIELDS only (treatment later).
// Reuses COLLECTIONS.works.itemSectionType VERBATIM — one spine with the
// collections registry, never a fork.
const workdetailContract: UIBlockSchemaV2 = {
  sectionType: COLLECTIONS.works.itemSectionType, // 'workdetail'
  elements: {
    name: str('required'), // project / piece title
    client: str('optional'),
    problem: str('optional'), // brief / the ask
    result: str('optional'), // the outcome
  },
  collections: {
    photos: {
      requirement: 'optional',
      fillMode: FILL,
      constraints: { min: 0, max: 24 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        url: { type: 'string', fillMode: FILL, default: '' },
        alt: { type: 'string', fillMode: FILL, default: '' },
        cover: { type: 'boolean', fillMode: FILL, default: false },
      },
    },
  },
};

// `/works` catalog index — the auto-listing block that fronts the works
// collection (COLLECTIONS.works.catalogSectionType = 'workcatalog'). ADDITIVE
// (work-onboarding-ingestion E2 / phase 2): this is collection MACHINERY, not a
// member of the frozen must/optional section FREEZE — the freeze is untouched.
// `items` are MATERIALIZED at assemble time from the works entries (name / cover /
// href) — never authored here (fillMode:'system'). Field names mirror the generic
// catalog slice (headline/lede, items.name/cover/href).
const workcatalogContract: UIBlockSchemaV2 = {
  sectionType: COLLECTIONS.works.catalogSectionType, // 'workcatalog'
  elements: {
    eyebrow: str('optional'),
    headline: str('optional'),
    lede: str('optional'),
  },
  collections: {
    items: {
      requirement: 'optional',
      fillMode: 'system',
      constraints: { min: 0, max: 99 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        name: { type: 'string', fillMode: FILL, default: '' },
        cover: { type: 'string', fillMode: FILL, default: '' },
        href: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Proof-shape contracts — the `testimonials` entry IS the registered `proof`.
// ─────────────────────────────────────────────────────────────────────────────

const proofLogosContract: UIBlockSchemaV2 = {
  sectionType: 'proof',
  elements: {
    eyebrow: str('optional'),
    heading: str('optional'),
  },
  collections: {
    logos: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 12 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        name: { type: 'string', fillMode: FILL, default: '' },
        image: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

const proofResultsContract: UIBlockSchemaV2 = {
  sectionType: 'proof',
  elements: {
    eyebrow: str('optional'),
    heading: str('optional'),
  },
  collections: {
    metrics: {
      requirement: 'required',
      fillMode: FILL,
      constraints: { min: 1, max: 6 },
      fields: {
        id: { type: 'string', fillMode: 'system' },
        value: { type: 'string', fillMode: FILL, default: '' },
        label: { type: 'string', fillMode: FILL, default: '' },
      },
    },
  },
};

/**
 * The three proof SHAPES. `testimonials` (default) is the SAME object registered
 * as `workElementContract.proof` — logos/results are alternates of the one section.
 */
export const workProofShapeContracts: Record<WorkProofShape, UIBlockSchemaV2> = {
  testimonials: proofTestimonialsContract,
  logos: proofLogosContract,
  results: proofResultsContract,
};

// ─────────────────────────────────────────────────────────────────────────────
// The work element contract — one entry per MUST + OPTIONAL section.
// must-vs-optional WITHIN a section is expressed per-element via `requirement`;
// must-vs-optional of the SECTION itself is the workMustSections/workOptionalSections
// membership. `proof` === the default (testimonials) proof-shape contract.
// ─────────────────────────────────────────────────────────────────────────────

export const workElementContract: Readonly<Record<string, UIBlockSchemaV2>> = {
  // MUST
  header: headerContract,
  hero: heroContract,
  work: workContract,
  proof: proofTestimonialsContract,
  packages: packagesContract,
  about: aboutContract,
  contact: contactContract,
  footer: footerContract,
  // OPTIONAL
  results: resultsContract,
  faq: faqContract,
  process: processContract,
  stats: statsContract,
  logos: logosContract,
  team: teamContract,
  workdetail: workdetailContract,
  // COLLECTION MACHINERY (E2 / phase 2) — additive, NOT part of the section freeze
  // (workMustSections/workOptionalSections). Registered here so the contract is
  // available to the collections spine; the workContract.test freeze walks the
  // section-key lists, not this map's extra keys.
  workcatalog: workcatalogContract,
};
