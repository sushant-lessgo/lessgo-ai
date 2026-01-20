// Zod schema for /api/v2/generate-copy response
// Used with OpenAI Structured Outputs and Anthropic JSON Schema
//
// Note: Copy generation has complex nested elements per UIBlock.
// We use a flexible schema that validates structure but allows
// dynamic element keys based on the UIBlock's requirements.

import { z } from 'zod';

// Element value can be string, string array, or object array (for cards, testimonials, etc.)
// Also supports needsReview flag for elements requiring user attention
const ElementValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.array(z.record(z.unknown())),
  z.object({
    value: z.string(),
    needsReview: z.literal(true),
  }),
  z.null(),
]);

// Section copy - flexible record of element name to value
export const SectionCopySchema = z.object({
  elements: z.record(z.string(), ElementValueSchema),
});

// Main copy response schema
// Record of section name to SectionCopy
export const CopyResponseSchema = z.record(z.string(), SectionCopySchema);

export type CopyResponse = z.infer<typeof CopyResponseSchema>;
export type SectionCopy = z.infer<typeof SectionCopySchema>;
