// src/modules/businessTypes/config.ts
// businessTypes v0 (scale track, scalePlan §7 / spec 01 D-H) — SHAPE, NOT
// BEHAVIOR. Six seed entries so the shape is proven and downstream specs
// (02+ serve gate, 04 wizard, 08 manufacturerFlow melt-in) have a real record
// to read. Nothing in the app imports this yet.
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
  likelyIntents: readonly GoalIntent[];
}

export const businessTypeKeys = [
  'saas',
  'manufacturer',
  'agency',
  'consultant',
  'coach',
  'writer',
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
    likelyIntents: ['request-demo', 'free-trial', 'signup-free', 'waitlist'],
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
    },
    extractionSchemaKey: 'manufacturer',
    likelyIntents: ['enquiry', 'request-quote'],
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
    },
    extractionSchemaKey: 'trust',
    likelyIntents: ['book-call', 'enquiry', 'request-quote'],
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
    },
    extractionSchemaKey: 'trust',
    likelyIntents: ['book-call', 'enquiry', 'lead-magnet'],
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
    },
    extractionSchemaKey: 'trust',
    likelyIntents: ['book-call', 'enroll', 'lead-magnet'],
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
    },
    extractionSchemaKey: 'work',
    likelyIntents: ['follow-social', 'buy-via-link', 'subscribe-newsletter'],
  },
};
