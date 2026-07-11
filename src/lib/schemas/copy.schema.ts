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

// ---------------------------------------------------------------------------
// Sentinel hardening (proof-truth phase 2)
// ---------------------------------------------------------------------------
// The `{ value, needsReview: true }` union branch above is DEAD by design —
// nothing in generation produces it, and the needs-review signal is carried by
// element-schema fillMode, not by an inline content sentinel. The branch stays
// (F27a's lone-object coercion excludes it by name). But if a model ever emits
// it, an object-shaped value would reach a block and render `[object Object]`
// on a published page. This normalizer flattens any such sentinel back to its
// plain `value` string BEFORE content assembly — guaranteeing no object-shaped
// value ever survives into content. Applied post-validation in both parseCopy
// pipelines (product + service). Recurses into collection-item fields defensively.

/** True if `v` is the `{ value, needsReview: true }` review sentinel. */
function isReviewSentinel(v: unknown): v is { value: unknown; needsReview: true } {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    'needsReview' in (v as Record<string, unknown>) &&
    (v as Record<string, unknown>).needsReview === true &&
    'value' in (v as Record<string, unknown>)
  );
}

/** Recursively flatten any review-sentinel to its plain string value. */
function flattenValue(v: unknown): unknown {
  if (isReviewSentinel(v)) {
    const inner = v.value;
    return typeof inner === 'string' ? inner : String(inner ?? '');
  }
  if (Array.isArray(v)) {
    return v.map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const obj = item as Record<string, unknown>;
        for (const k of Object.keys(obj)) obj[k] = flattenValue(obj[k]);
        return obj;
      }
      return flattenValue(item);
    });
  }
  return v;
}

/**
 * Flatten every `{ value, needsReview: true }` sentinel found in a copy sections
 * map to its plain string value (mutates in place, returns the same object).
 * Idempotent — plain strings/arrays/null pass through untouched.
 */
export function flattenReviewSentinel<
  T extends Record<string, { elements?: Record<string, unknown> } | undefined>
>(sections: T): T {
  for (const section of Object.values(sections || {})) {
    const elements = section?.elements;
    if (!elements) continue;
    for (const key of Object.keys(elements)) {
      elements[key] = flattenValue(elements[key]);
    }
  }
  return sections;
}
