// src/modules/businessTypes/config.ts
// businessTypes v0 (scale track, scalePlan §7 / spec 01 D-H) — SHAPE, NOT
// BEHAVIOR. Eight seed entries so the shape is proven and downstream specs
// (02+ serve gate, 04 wizard, 08 manufacturerFlow melt-in) have a real record
// to read. LIVE consumers now include the serve gate, wizard hydrate, and
// (scale-08 phase 1) product copy-voice derivation via `voiceHint`.
// scale-08 phase 3 added `photographer` + `app` CONFIG-ONLY (no new code paths)
// to prove "a new business type is a list entry": photographer requires an
// unbacked `gallery` cap (serve gate → demand lane); app rides the thing engine.
//
// Entry shape is modeled on the ServiceVoiceSpec record idiom
// (src/modules/audience/service — keyed record of frozen per-key specs).
//
// - `extractionSchemaKey` values are REAL registry keys (scale-06 phase 7) into
//   `src/lib/schemas/extraction` — engine families thing/trust/work plus the
//   `manufacturer` variant. Kept as a plain string here (no import) to avoid a
//   config↔registry cycle; the registry validates the value.
// - `manufacturer`: `catalog` is PREFERRED, not required — a manufacturer page
//   isn't broken without collections; required flags shrink serveability
//   (scalePlan §7.3). requiredCapabilities = ['lead-form'] only.
// - `likelyIntents` are 3–4 per entry (manufacturer: 2 is fine).

import type { CopyEngine, CapabilityId, DesignStyle } from '@/types/brief';
import type { GoalIntent } from '@/modules/goals/vocabulary';
import type { CollectionKey } from '@/modules/collections/registry';

export interface BusinessTypeEntry {
  key: BusinessTypeKey;
  label: string;
  copyEngine: CopyEngine;
  requiredCapabilities: readonly CapabilityId[];
  defaultStyle: DesignStyle;
  /** Minimal wizard prompts (2–3 per type) — copy TBD, shape frozen. */
  wizardFields: Record<string, { label: string; example: string }>;
  /** Registry key into src/lib/schemas/extraction (thing|trust|work|manufacturer). */
  extractionSchemaKey: string;
  /**
   * Product copy-voice id consumed by the THING engine (scale-08 phase 1) —
   * `productVoiceForBusinessType` maps this to a `ProductVoiceId`. Kept a PLAIN
   * string (no import of the voice module) to avoid a config↔audience import
   * cycle; a test validates it against the ProductVoiceId union. Only set on
   * `copyEngine: 'thing'` entries; service (trust/work) voice stays
   * archetype-keyed via `selectServiceVoice`, so those entries omit it.
   */
  voiceHint?: string;
  likelyIntents: readonly GoalIntent[];
  /**
   * Default site structure for this business type (scale-07 phase 5) — one
   * input to `isMultipage()` (pageArchetypes.ts): a Brief without an explicit
   * `structure.mode` falls back to this. 'single' everywhere except
   * manufacturer (the vestria multipage pilot: catalogue/industries/contact
   * pages are the default shape). Only consulted when the resolved template
   * declares the `multipage` capability.
   */
  structureDefault: 'single' | 'multi';
  /**
   * Collection families this business type NEEDS (scale-10 phase 3). The serve
   * gate (decideServe) checks TEMPLATE capability SUPPLY: if a required key is
   * covered by NO shortlisted template (no shortlisted template declares that
   * collection-family capability), the lead is routed to MANUAL-ONBOARD with a
   * granular `collection:<key>` demand tag. Gates on SUPPLY, not data presence —
   * empty `facts.collections` still serve with an empty-state.
   *
   * DORMANT: intentionally UNSET for every business type today. No shipping
   * template declares a collection-family capability (block pairs are rung-C,
   * Scope-OUT), so populating this would route EVERY such lead to manual until
   * those blocks land. Populating any entry is a separate founder decision.
   * `catalog` (vestria's flat grid) is NOT a CollectionKey and never satisfies
   * a `requiredCollections` key.
   */
  requiredCollections?: readonly CollectionKey[];
}

export const businessTypeKeys = [
  'saas',
  'manufacturer',
  'agency',
  'consultant',
  'coach',
  'writer',
  'photographer',
  'app',
] as const;
export type BusinessTypeKey = (typeof businessTypeKeys)[number];

export const businessTypes: Record<BusinessTypeKey, BusinessTypeEntry> = {
  saas: {
    key: 'saas',
    label: 'SaaS / software product',
    copyEngine: 'thing',
    requiredCapabilities: ['lead-form'],
    defaultStyle: 'tech-minimal',
    wizardFields: {
      product: {
        label: 'What does your product do?',
        example: 'Invoicing software for freelancers that auto-chases late payments',
      },
      audience: {
        label: 'Who is it for?',
        example: 'Freelance designers and developers billing 5–20 clients',
      },
      differentiator: {
        label: 'Why you over the obvious alternative?',
        example: 'Set up in 2 minutes; no accounting knowledge needed',
      },
    },
    extractionSchemaKey: 'thing',
    voiceHint: 'modern-tech',
    likelyIntents: ['request-demo', 'free-trial', 'signup-free', 'waitlist'],
    structureDefault: 'single',
  },
  manufacturer: {
    key: 'manufacturer',
    label: 'Manufacturer / exporter',
    copyEngine: 'thing',
    // catalog is PREFERRED not required (scalePlan §7.3) — see header note.
    requiredCapabilities: ['lead-form'],
    defaultStyle: 'editorial-craft',
    wizardFields: {
      products: {
        label: 'What do you make?',
        example: 'Hand-finished brass hardware for premium furniture makers',
      },
      buyers: {
        label: 'Who buys from you?',
        example: 'Furniture brands and interior contractors, 500+ unit orders',
      },
      // F11 — per-type offer copy: the shared default ("Start a free 14-day
      // trial") is SaaS-only and leaks nonsense into other engines.
      offer: {
        label: 'What is the offer / next step?',
        example: 'Send us your drawings for a quote',
      },
    },
    extractionSchemaKey: 'manufacturer',
    voiceHint: 'tailored-trade',
    likelyIntents: ['enquiry', 'request-quote'],
    structureDefault: 'multi',
  },
  agency: {
    key: 'agency',
    label: 'Agency / studio',
    copyEngine: 'trust',
    requiredCapabilities: ['lead-form'],
    defaultStyle: 'bold-performance',
    wizardFields: {
      services: {
        label: 'What do you do for clients?',
        example: 'Performance marketing for D2C brands — paid social + landing pages',
      },
      results: {
        label: 'Best result you can claim?',
        example: '3.2x average ROAS across 40+ D2C accounts',
      },
      idealClient: {
        label: 'Who is your ideal client?',
        example: 'D2C brands doing $50k–$500k/month',
      },
      offer: {
        label: 'What is the offer / next step?',
        example: 'Book a free strategy call',
      },
    },
    extractionSchemaKey: 'trust',
    likelyIntents: ['book-call', 'enquiry', 'request-quote'],
    structureDefault: 'single',
  },
  consultant: {
    key: 'consultant',
    label: 'Consultant / advisor',
    copyEngine: 'trust',
    requiredCapabilities: ['lead-form'],
    defaultStyle: 'authority-professional',
    wizardFields: {
      expertise: {
        label: 'What do you advise on?',
        example: 'Pricing strategy for B2B SaaS companies',
      },
      credibility: {
        label: 'Why should they trust you?',
        example: 'Ex-Stripe pricing lead; 60+ SaaS engagements',
      },
      offer: {
        label: 'What is the offer / next step?',
        example: 'Book a free strategy call',
      },
    },
    extractionSchemaKey: 'trust',
    likelyIntents: ['book-call', 'enquiry', 'lead-magnet'],
    structureDefault: 'single',
  },
  coach: {
    key: 'coach',
    label: 'Coach / trainer',
    copyEngine: 'trust',
    requiredCapabilities: ['lead-form'],
    defaultStyle: 'warm-human',
    wizardFields: {
      transformation: {
        label: 'What change do you create?',
        example: 'Help first-time managers stop firefighting and lead calmly',
      },
      format: {
        label: 'How do you work with people?',
        example: '8-week 1:1 program, weekly calls + async support',
      },
      offer: {
        label: 'What is the offer / next step?',
        example: 'Book a free intro call',
      },
    },
    extractionSchemaKey: 'trust',
    likelyIntents: ['book-call', 'enroll', 'lead-magnet'],
    structureDefault: 'single',
  },
  writer: {
    key: 'writer',
    label: 'Writer / author',
    copyEngine: 'work',
    requiredCapabilities: [],
    defaultStyle: 'literary-quiet',
    wizardFields: {
      writing: {
        label: 'What do you write?',
        example: 'Hindi literary fiction and essays on small-town life',
      },
      books: {
        label: 'Your books / notable work?',
        example: '"Reth ke Rishtey" (2023), columns in Dainik Bhaskar',
      },
      offer: {
        label: 'What is the offer / next step?',
        example: 'Read a sample or subscribe for new work',
      },
    },
    extractionSchemaKey: 'work',
    likelyIntents: ['follow-social', 'buy-via-link', 'subscribe-newsletter'],
    structureDefault: 'single',
  },
  // scale-08 phase 3 — two CONFIG-ONLY entries proving the pattern: adding a
  // business type touches only this record (+ tests), no new code paths.
  photographer: {
    key: 'photographer',
    label: 'Photographer / studio',
    copyEngine: 'work',
    // gallery is REQUIRED — no shipped template declares it, so the serve gate
    // rejects photographer to the MANUAL-ONBOARD/demand lane (intended: proves
    // an unbacked capability is honestly non-serveable, not silently degraded).
    requiredCapabilities: ['gallery'],
    defaultStyle: 'editorial-craft',
    wizardFields: {
      work: {
        label: 'What do you shoot?',
        example: 'Editorial wedding photography across Rajasthan',
      },
      style: {
        label: 'How would you describe your style?',
        example: 'Candid, warm, documentary — no stiff posed portraits',
      },
      offer: {
        label: 'What is the offer / next step?',
        example: 'Check availability for your date',
      },
    },
    extractionSchemaKey: 'work',
    likelyIntents: ['enquiry', 'book-call', 'follow-social'],
    // atelier phase 5 — photographers default to MULTI now that a work+multipage
    // template (atelier) exists and the served work flow reaches the structure
    // slot (phase 2). This is the businessType signal `isMultipage` reads.
    structureDefault: 'multi',
  },
  app: {
    key: 'app',
    label: 'Mobile app',
    copyEngine: 'thing',
    requiredCapabilities: ['lead-form'],
    defaultStyle: 'tech-minimal',
    wizardFields: {
      app: {
        label: 'What does your app do?',
        example: 'Habit tracker that turns daily streaks into a shared game',
      },
      audience: {
        label: 'Who is it for?',
        example: 'People who bounce off rigid productivity apps',
      },
      platform: {
        label: 'Where can people get it?',
        example: 'iOS and Android, free with an optional Pro tier',
      },
    },
    extractionSchemaKey: 'thing',
    voiceHint: 'modern-tech',
    likelyIntents: ['download-app', 'signup-free', 'waitlist'],
    structureDefault: 'single',
  },
};
