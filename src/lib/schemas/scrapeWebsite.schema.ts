// Zod schema for /api/v2/scrape-website response.
// Superset of UnderstandingResponseSchema: the same fields we'd otherwise ask
// for in onboarding (categories/audiences/whatItDoes/features), PLUS suggested
// oneLiner/productName/offer/landingGoal and VERBATIM testimonials lifted from
// the source site. Used with generateWithSchema (OpenAI structured outputs /
// Anthropic JSON schema).

import { z } from 'zod';
import { landingGoals } from '@/types/generation';

// One real testimonial, copied word-for-word from the source site. Mirrors the
// Meridian `ProofWithLogoRail` testimonials collection item shape so it can be
// injected verbatim into generated copy (see parseCopy.injectRealTestimonials).
export const ScrapedTestimonialSchema = z.object({
  quote: z.string(),
  author_name: z.string(),
  author_role: z.string(),
});

export const ScrapeWebsiteSchema = z.object({
  // Suggested replacement for the manual one-liner (>=10 chars when present).
  oneLiner: z.string(),
  // Business / product name, or "" if none is clearly stated.
  productName: z.string(),
  // === UnderstandingData fields (mirror UnderstandingResponseSchema) ===
  categories: z.array(z.string()).min(1).max(3),
  audiences: z.array(z.string()).min(1).max(3),
  whatItDoes: z.string().min(1),
  features: z.array(z.string()).min(1).max(8),
  // Suggested CTA offer text, or "" if none is evident.
  offer: z.string(),
  // Best-guess primary conversion goal; null when not inferable.
  landingGoal: z
    .enum(landingGoals as unknown as [string, ...string[]])
    .nullable(),
  // Real testimonials, verbatim. Empty array when the site has none.
  testimonials: z.array(ScrapedTestimonialSchema).max(3),
});

export type ScrapedTestimonial = z.infer<typeof ScrapedTestimonialSchema>;
export type ScrapeWebsiteData = z.infer<typeof ScrapeWebsiteSchema>;

// ===== Extended extraction (SiteContext — docs/tracks/newGeneration.md Part 2) =====
// Same single AI call at scrape time, extended with confidence-tagged atomic
// facts + VERBATIM excerpts. Product path only for now (service mirrors later,
// on need). NO summary field — summaries launder away the exact phrasing.

export const SiteFactSchema = z.object({
  // One atomic claim in the extractor's own words.
  fact: z.string(),
  topic: z.enum(['company', 'product', 'service', 'proof', 'logistics', 'people', 'other']),
  // high = literally stated on the site; medium = strongly implied; low = inferred.
  confidence: z.enum(['high', 'medium', 'low']),
});

export const SiteExcerptSchema = z.object({
  // WORD-FOR-WORD text from the site (never paraphrased), ≤ ~300 chars.
  text: z.string(),
  kind: z.enum(['voice', 'proof', 'value-prop', 'testimonial']),
});

export const ScrapeWebsiteExtendedSchema = ScrapeWebsiteSchema.extend({
  // 10-25 atomic, confidence-tagged claims (materials, years, certs, numbers,
  // differentiators, locations, client segments…).
  facts: z.array(SiteFactSchema).max(25),
  // 5-12 strong REAL lines copied verbatim (founder voice, proof phrasing,
  // value claims). Testimonials also appear here as kind 'testimonial'.
  excerpts: z.array(SiteExcerptSchema).max(12),
});

export type SiteFactData = z.infer<typeof SiteFactSchema>;
export type SiteExcerptData = z.infer<typeof SiteExcerptSchema>;
export type ScrapeWebsiteExtendedData = z.infer<typeof ScrapeWebsiteExtendedSchema>;

// ===== Manufacturer / trade-supplier variant (onboarding1, D2) =====
// Parallel schema so the existing SaaS parse path (ScrapeWebsiteExtendedSchema)
// stays byte-for-byte untouched. The scrape route picks by the businessType's
// manufacturer extraction schema.
// The 4 manufacturer keys are REQUIRED (mirrors
// ManufacturerUnderstandingResponseSchema): OpenAI strict structured outputs
// can reject optional-not-in-required keys, and requiring them forces the
// extractor to actually fill them.
export const ScrapeWebsiteManufacturerSchema = ScrapeWebsiteExtendedSchema.extend({
  whatYouMake: z.string().min(1),
  industriesServed: z.array(z.string()).min(1).max(3),
  productCategories: z.array(z.string()).min(1).max(8),
  valueAdds: z.array(z.string()).min(1).max(8),
});

export type ScrapeWebsiteManufacturerData = z.infer<typeof ScrapeWebsiteManufacturerSchema>;
