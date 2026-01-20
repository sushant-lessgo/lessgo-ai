// Zod schema for /api/v2/understand response
// Used with OpenAI Structured Outputs and Anthropic JSON Schema

import { z } from 'zod';

export const UnderstandingResponseSchema = z.object({
  categories: z.array(z.string()).min(1).max(3),
  audiences: z.array(z.string()).min(1).max(3),
  whatItDoes: z.string().min(1),
  features: z.array(z.string()).min(1).max(8),
});

export type UnderstandingResponse = z.infer<typeof UnderstandingResponseSchema>;
