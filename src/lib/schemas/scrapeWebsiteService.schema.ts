// Zod schema for /api/v2/scrape-website?audienceType=service response.
// Service-shaped mirror of ScrapeWebsiteSchema: superset of
// ServiceUnderstandingResponseSchema (the same fields the service onboarding
// would otherwise ask for) PLUS suggested oneLiner/businessName/offer/goal and
// VERBATIM testimonials lifted from the source site.
// Used with generateWithSchema (OpenAI structured outputs / Anthropic JSON schema).

import { z } from 'zod';
import { ScrapedTestimonialSchema } from './scrapeWebsite.schema';

export const ScrapeWebsiteServiceSchema = z.object({
  // Suggested replacement for the manual one-liner (>=10 chars when present).
  oneLiner: z.string(),
  // Business / studio name, or "" if none is clearly stated.
  businessName: z.string(),
  // === ServiceUnderstanding fields (mirror ServiceUnderstandingResponseSchema;
  // serviceType is persona-derived, not extracted) ===
  whatYouDo: z.string().min(1),
  services: z.array(z.string()).min(1).max(8),
  targetClients: z.array(z.string()).min(1).max(3),
  outcomes: z.array(z.string()).min(1).max(6),
  deliveryModel: z.enum(['remote', 'in-person', 'hybrid']),
  // Suggested CTA offer text, or "" if none is evident.
  offer: z.string(),
  // Best-guess primary goal; null when not inferable. Constrained to the goals
  // the service GoalStep actually surfaces (types/service.ts serviceGoals[0..2]).
  goal: z.enum(['book-call', 'request-quote', 'lead-magnet']).nullable(),
  // Real testimonials, verbatim. Empty array when the site has none.
  testimonials: z.array(ScrapedTestimonialSchema).max(3),
});

export type ScrapeWebsiteServiceData = z.infer<typeof ScrapeWebsiteServiceSchema>;
