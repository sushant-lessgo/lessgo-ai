// lib/validation.ts - OWASP Input Validation
import { z } from 'zod';
import { templateIds } from '@/types/service';

// A03: Injection Prevention - Input validation schemas
export const FormSubmissionSchema = z.object({
  formId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid form ID format'),
  data: z.record(z.string(), z.unknown()).refine(
    (data) => Object.keys(data).length <= 50, // Prevent large objects
    'Too many form fields'
  ),
  userId: z.string().optional(),
  publishedPageId: z.string().optional(),
});

export const DraftSaveSchema = z.object({
  tokenId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid token format'),
  inputText: z.string().max(5000).optional(),
  stepIndex: z.number().int().min(0).max(999).optional(), // Allow up to 999 for generation complete status
  confirmedFields: z.record(z.string(), z.object({
    value: z.string().max(1000),
    confidence: z.number().min(0).max(1),
    alternatives: z.array(z.string().max(1000)).optional(),
  })).optional(),
  validatedFields: z.record(z.string(), z.string().max(1000)).optional(),
  featuresFromAI: z.array(z.object({
    feature: z.string().max(500),
    benefit: z.string().max(500),
  })).max(20).optional(),
  hiddenInferredFields: z.record(z.string(), z.string().max(1000)).optional(),
  title: z.string().max(200).optional(),
  themeValues: z.record(z.string(), z.unknown()).optional(),
  finalContent: z.unknown().optional(),
  // paletteId is a template-scoped token (Hearth, Lex, Meridian, …) validated at
  // the template's own ThemeInjector boundary and set by our own code (onboarding
  // / P6 picker) — not user free-text. Keep it a bounded string (like variantId)
  // rather than a per-template enum, so new templates don't edit this schema.
  paletteId: z.string().max(50).optional(),
  templateId: z.enum(templateIds as unknown as [string, ...string[]]).optional(),
  variantId: z.string().max(50).optional(),
  // i18n-phase-1 (D4): per-project locale declaration — a TOP-LEVEL sibling of
  // finalContent/baseline (`{ locales, defaultLocale }`, matches LocaleConfig).
  // Optional: legacy single-locale payloads OMIT it and validate unchanged.
  // Wholesale-replaced in the route (mirrors `baseline`), never deep-merged.
  //
  // NOTE — `localeContent` (the D1 text overlay) is intentionally NOT declared
  // here: it rides INSIDE `finalContent` (which is `z.unknown()`), so it passes
  // through this schema untouched and merges via the existing `...finalContent`
  // shallow spread in the route. Declaring it top-level would be wrong. See the
  // saveDraft route merge sites for the two distinct mechanisms.
  localeConfig: z
    .object({
      locales: z.array(z.string().max(20)).max(50),
      defaultLocale: z.string().max(20),
    })
    .optional(),
});

// Per-page SEO overrides (SEO track, Phase 2). These are user-controlled strings
// that get baked into the published <head>, so: https-only URLs (no javascript:/
// data:/http:), bounded lengths, unknown keys stripped. Strings are additionally
// HTML-escaped at render time (htmlGenerator escapeHTML) — this schema is the
// server-entry gate, not the only defense.
const HttpsUrl = z
  .string()
  .max(500)
  .url()
  .refine((u) => u.startsWith('https://'), 'Must be an https:// URL');

export const PageSeoSchema = z
  .object({
    title: z.string().max(70).optional(),
    description: z.string().max(200).optional(),
    ogImage: HttpsUrl.optional(),
    noIndex: z.boolean().optional(),
    faviconUrl: HttpsUrl.optional(),
    structuredDataType: z
      .enum(['auto', 'none', 'Organization', 'LocalBusiness', 'Product', 'Service'])
      .optional(),
  })
  .strip();

export type SanitizedPageSeo = z.infer<typeof PageSeoSchema>;

/** Best-effort seo sanitizer: an invalid/hostile blob becomes undefined — never fails the publish. */
export function sanitizeSeo(raw: unknown): SanitizedPageSeo | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const parsed = PageSeoSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  const seo = parsed.data;
  (Object.keys(seo) as (keyof SanitizedPageSeo)[]).forEach((k) => {
    if (seo[k] === undefined) delete seo[k];
  });
  return Object.keys(seo).length > 0 ? seo : undefined;
}

export const PublishSchema = z.object({
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), 'Slug cannot start or end with hyphen'),
  htmlContent: z.string().min(1).max(500000, 'HTML content too large').optional(), // PHASE 1.3: Optional - now generated server-side
  title: z.string().max(200).optional(),
  content: z.unknown().optional(),
  themeValues: z.record(z.string(), z.unknown()).optional(),
  tokenId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid token format'),
  inputText: z.string().max(5000).optional(),
  previewImage: z.string().url('Must be a valid URL').optional(),
  analyticsEnabled: z.boolean().optional(), // Phase 4: Analytics opt-in
});

// A05: Security Misconfiguration - Rate limiting data
export interface RateLimit {
  requests: number;
  windowMs: number;
  identifier: string;
}

export const validateRateLimit = (requests: number, limit: number, windowMs: number): boolean => {
  // Simple in-memory rate limiting (use Redis in production)
  return requests < limit;
};

// A09: Security Logging - Safe logging without sensitive data
export const sanitizeForLogging = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['apiKey', 'password', 'token', 'secret', 'key', 'authorization'];
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
};