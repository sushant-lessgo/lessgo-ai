// src/app/api/analytics/event/schema.ts
// Analytics beacon ingest schema — kept out of route.ts because Next.js route
// modules may only export route handlers (exporting a schema there fails the
// build's route-type check).
//
// Tolerant of BOTH beacon formats forever (F9b versioning contract):
//   - a.v1.js (frozen pre-scale-04): no `v`, no `role`/`placement` on cta_click.
//   - a.v2.js (scale-04+): sends `v: 2` plus `role`/`placement`.
// `v` is accepted-and-ignored; `role`/`placement` are optional and defaulted by the
// route on cta_click. Old published blobs therefore never write garbage rows.

import { z } from 'zod';

export const AnalyticsEventSchema = z.object({
  event: z.enum(['pageview', 'cta_click', 'form_submit']),
  v: z.number().int().optional(), // beacon format version (absent => v1)
  pageId: z.string().min(1),
  slug: z.string().min(1),
  timestamp: z.string().datetime(),
  url: z.string().url(),
  referrer: z.string().url().optional(),
  sessionId: z.string().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),

  // UTM parameters
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),

  // Event-specific data
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
  role: z.enum(['primary', 'secondary']).optional(),
  placement: z.string().optional(),
  formId: z.string().optional(),
  title: z.string().optional(),
});
