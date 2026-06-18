// Zod schema for /api/v2/understand?audienceType=service response.
// Service-shaped mirror of UnderstandingResponseSchema. Lean, de-overlapped set
// (see useServiceGenerationStore.ServiceUnderstanding). serviceType is NOT here
// — it's persona-derived server-/client-side, not LLM-extracted.
// Used with OpenAI Structured Outputs and Anthropic JSON Schema.

import { z } from 'zod';

export const ServiceUnderstandingResponseSchema = z.object({
  whatYouDo: z.string().min(1),
  services: z.array(z.string()).min(1).max(8),
  targetClients: z.array(z.string()).min(1).max(3),
  outcomes: z.array(z.string()).min(1).max(6),
  deliveryModel: z.enum(['remote', 'in-person', 'hybrid']),
});

export type ServiceUnderstandingResponse = z.infer<
  typeof ServiceUnderstandingResponseSchema
>;
