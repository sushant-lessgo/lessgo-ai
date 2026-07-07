// Zod schemas for the ENTRY-MODE classification extension of
// /api/v2/understand and /api/v2/scrape-website (scale-02 phase 3, plan D6).
//
// The AI emits ONLY raw signals (EntrySignals in @/modules/brief/classify) —
// businessType GUESS + confidence, goal-intent guess, tiebreaker rung, hints,
// neutral prefill. Engine resolution + Brief construction happen in CODE
// (buildBriefDraft), server-side in the routes. One AI call, zero new calls.
//
// Idiom (mirrors scrapeWebsite.schema.ts): OpenAI strict structured outputs
// require every key present, so guess-ish fields are NULLABLE, not optional.
// No numeric min/max constraints (strict json_schema conversion) — ranges are
// enforced by prompt instruction instead.

import { z } from 'zod';
import { designStyles } from '@/types/brief';
import { goalIntents } from '@/modules/goals/vocabulary';
import { businessTypeKeys, businessTypes } from '@/modules/businessTypes/config';
import { goalIntentMeta } from '@/modules/goals/vocabulary';
import type { EntrySignals } from '@/modules/brief/classify';
import { ScrapeWebsiteExtendedSchema } from './scrapeWebsite.schema';

// Tiebreaker rungs / platform needs / delivery model — mirror the closed
// unions in @/modules/brief/classify (type-parity asserted below).
export const entryTiebreakerRungs = [
  'expertise',
  'portfolio-is-proof',
  'browsing-place',
  'offer-already-understood',
  'none',
] as const;

export const entryPlatformNeeds = ['none', 'checkout', 'ordering', 'booking-payments'] as const;

export const entryDeliveryModels = ['remote', 'in-person', 'hybrid'] as const;

// === Classification signal fields (shared core: both entry composites) ===
// Extracted as a plain shape so EntryScrapeSchema can .extend() with exactly
// these keys without colliding with the scrape base fields.
const entryClassificationFields = {
  // Best-guess business type: a known key OR a short free label ("photographer").
  // GUESS ONLY — the engine is resolved by code lookup, never by the AI (D6).
  businessTypeGuess: z.string().nullable(),
  // 0-1 confidence in businessTypeGuess (range prompt-enforced).
  businessTypeConfidence: z.number(),
  // Short market category ("Performance marketing"), or null.
  category: z.string().nullable(),
  // Visitor-action guess from the frozen goal vocabulary, or null.
  goalIntentGuess: z.enum(goalIntents).nullable(),
  // Trust-signal rung (ladder applied in code for unknown types).
  tiebreaker: z.enum(entryTiebreakerRungs),
  // Single landing page vs multi-page site need.
  structureHint: z.enum(['single', 'multi']),
  // Design-style feel hint from the closed vocabulary, or null.
  designStyleHint: z.enum(designStyles).nullable(),
  // Transactional-platform requirement (checkout/ordering ⇒ out-of-ICP gate).
  platformNeeds: z.enum(entryPlatformNeeds),
} as const;

// === Neutral prefill fields NOT present in the scrape base schema ===
const entryPrefillDeltaFields = {
  // One-paragraph neutral summary of the business.
  summary: z.string(),
  // What the business offers/sells/does (short phrases).
  offerings: z.array(z.string()),
  // Client outcomes / results claims (short phrases).
  outcomes: z.array(z.string()),
  // How the work is delivered; null when not inferable.
  deliveryModel: z.enum(entryDeliveryModels).nullable(),
  // Kinds of proof available (e.g. "testimonials", "case studies"), "" items never.
  proofAvailable: z.array(z.string()),
  // Social profiles found/stated.
  socialProfiles: z.array(z.object({ platform: z.string(), url: z.string() })),
} as const;

/**
 * Full zod mirror of the phase-1 `EntrySignals` interface — the standalone
 * one-liner (understand) composite emits exactly this shape.
 */
export const EntrySignalsSchema = z.object({
  ...entryClassificationFields,
  ...entryPrefillDeltaFields,
  // Neutral understanding superset (understand path emits these directly;
  // the scrape path reuses its base fields and maps in the route).
  businessName: z.string(),
  audiences: z.array(z.string()),
  categories: z.array(z.string()),
  offer: z.string(),
  oneLiner: z.string(),
  // Plain verbatim quote strings (the scrape path keeps its richer
  // { quote, author_name, author_role } testimonials and maps to strings).
  testimonials: z.array(z.string()),
});

export type EntrySignalsData = z.infer<typeof EntrySignalsSchema>;

// Compile-time parity guard: the schema output must satisfy the phase-1
// EntrySignals interface consumed by buildBriefDraft (type-only, erased).
type _AssertEntrySignalsParity = EntrySignalsData extends EntrySignals ? true : never;
const _entrySignalsParity: _AssertEntrySignalsParity = true;
void _entrySignalsParity;

/**
 * One-liner entry composite (POST /api/v2/understand with entry:true).
 * Standalone: signals + neutral understanding in one shape.
 */
export const EntryUnderstandSchema = EntrySignalsSchema;
export type EntryUnderstandData = z.infer<typeof EntryUnderstandSchema>;

/**
 * URL entry composite (POST /api/v2/scrape-website with entry:true).
 * Extends the existing EXTENDED scrape schema — keeps verbatim testimonials
 * ({quote,author_name,author_role}), facts, and excerpts — plus the entry
 * signal fields. Base fields (oneLiner/productName/categories/audiences/
 * offer/testimonials) double as the neutral prefill; the route maps them
 * into EntrySignals before buildBriefDraft.
 */
export const EntryScrapeSchema = ScrapeWebsiteExtendedSchema.extend({
  ...entryClassificationFields,
  ...entryPrefillDeltaFields,
});
export type EntryScrapeData = z.infer<typeof EntryScrapeSchema>;

/**
 * Shared classification prompt block (appended/embedded by both routes).
 * Lives beside the schema because the menus derive from the same closed
 * vocabularies the schema enums are built from — single source, and route
 * files stay free of duplicated menu text.
 */
export function entryClassificationPromptBlock(): string {
  const businessTypeMenu = businessTypeKeys
    .map((k) => `${k} (${businessTypes[k].label})`)
    .join(' | ');
  const goalIntentMenu = goalIntents
    .map((i) => `${i} (${goalIntentMeta[i].label})`)
    .join(' | ');

  return `CLASSIFICATION SIGNALS — you are GUESSING raw signals only. Do NOT decide the copy engine, template, or page structure strategy; downstream code decides all of that from your signals.
- businessTypeGuess: your best guess at the business type. Prefer one of: ${businessTypeMenu}. If none of those fit, use a short lowercase label of your own (e.g. "photographer", "restaurant"). Use null only if you cannot tell at all. This is a guess only — do not decide the engine.
- businessTypeConfidence: number between 0 and 1 — your confidence in businessTypeGuess.
- category: a short market category (e.g. "Performance marketing", "Wedding photography"), or null.
- goalIntentGuess: the single action a visitor would most plausibly take — one of: ${goalIntentMenu} — or null if unclear.
- tiebreaker: which trust signal best describes how this business wins customers:
  - "expertise": sells knowledge, judgment, or outcomes (agencies, consultants, coaches)
  - "portfolio-is-proof": the work itself is the pitch — visitors must SEE it (photographers, designers, artists, portfolios)
  - "browsing-place": a physical or local place visitors browse, visit, or order from (restaurants, salons, venues, stores)
  - "offer-already-understood": the offer is instantly understood and the page only needs a quick yes (an event, a donation, a simple deal)
  - "none": none of the above clearly apply (typical for product/software businesses)
- structureHint: "single" if one landing page serves this business, "multi" if it clearly needs multiple pages.
- designStyleHint: the visual feel that fits — one of: ${designStyles.join(' | ')} — or null.
- platformNeeds: "checkout" if they need an online store with checkout, "ordering" if they need platform ordering (e.g. food delivery), "booking-payments" if they take paid bookings, else "none".`;
}

/**
 * Prompt block for the neutral-prefill DELTA fields (scrape path appends this;
 * its base prompt already extracts oneLiner/productName/categories/audiences/
 * offer/testimonials/facts/excerpts).
 */
export function entryPrefillDeltaPromptBlock(): string {
  return `ADDITIONAL PREFILL FIELDS:
- summary: one neutral paragraph describing the business.
- offerings: 1-8 short phrases for what the business offers/sells/does.
- outcomes: 0-6 short phrases for client outcomes or results claims.
- deliveryModel: "remote", "in-person", or "hybrid" — or null when not inferable.
- proofAvailable: 0-6 kinds of proof present (e.g. "testimonials", "case studies", "client logos"). Empty array if none.
- socialProfiles: social profiles found, each { platform, url }. Empty array if none.`;
}
