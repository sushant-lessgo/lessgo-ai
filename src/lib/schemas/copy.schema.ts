// Zod schema for /api/v2/generate-copy response
// Used with OpenAI Structured Outputs and Anthropic JSON Schema
//
// Note: Copy generation has complex nested elements per UIBlock.
// We use a flexible schema that validates structure but allows
// dynamic element keys based on the UIBlock's requirements.

import { z } from 'zod';

// Element value can be string, string array, or object array (for cards, testimonials, etc.)
// Also supports needsReview flag for elements requiring user attention
const ElementValueUnion = z.union([
  z.string(),
  z.array(z.string()),
  z.array(z.record(z.unknown())),
  z.object({
    value: z.string(),
    needsReview: z.literal(true),
  }),
  z.null(),
]);

/**
 * Tolerant coercion for collection (array) elements: the model sometimes emits a
 * lone object where an array-of-objects is required — e.g. `legal_links` /
 * `link_columns` on the footer (F27). Left alone, zod rejects every union branch
 * and the whole generation dies. We narrowly wrap such a lone object into a
 * single-element array so the `array(record)` branch validates instead.
 *
 * Narrow by construction: only a plain object that is NOT the
 * `{ value, needsReview }` review-sentinel is wrapped. Strings, arrays, the
 * sentinel, and null pass through untouched — so string/scalar elements are
 * never affected (they never carry an object value), only array-shaped ones.
 */
const ElementValueSchema = z.preprocess((val) => {
  if (
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    !('needsReview' in (val as Record<string, unknown>))
  ) {
    return [val];
  }
  return val;
}, ElementValueUnion);

// Section copy - flexible record of element name to value
export const SectionCopySchema = z.object({
  elements: z.record(z.string(), ElementValueSchema),
});

// Main copy response schema
// Record of section name to SectionCopy
export const CopyResponseSchema = z.record(z.string(), SectionCopySchema);

export type CopyResponse = z.infer<typeof CopyResponseSchema>;
export type SectionCopy = z.infer<typeof SectionCopySchema>;
