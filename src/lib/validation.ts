// lib/validation.ts - OWASP Input Validation
import { z } from 'zod';

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
});

export const PublishSchema = z.object({
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), 'Slug cannot start or end with hyphen'),
  htmlContent: z.string().min(1).max(500000, 'HTML content too large'),
  title: z.string().max(200).optional(),
  content: z.unknown().optional(),
  themeValues: z.record(z.string(), z.unknown()).optional(),
  tokenId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid token format'),
  inputText: z.string().max(5000).optional(),
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