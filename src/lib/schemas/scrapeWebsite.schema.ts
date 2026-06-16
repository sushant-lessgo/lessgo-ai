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
