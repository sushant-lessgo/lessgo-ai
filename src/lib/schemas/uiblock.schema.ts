// Zod schema for /api/v2/uiblock-select response
// Used with OpenAI Structured Outputs and Anthropic JSON Schema
//
// NOTE: Uses array of entries instead of z.record(enum, ...) because
// OpenAI doesn't support 'propertyNames' constraint in JSON Schema.

import { z } from 'zod';
import { sectionTypes } from '@/types/generation';

// Section type enum - validates section names
const SectionTypeEnum = z.enum(sectionTypes as unknown as [string, ...string[]]);

// Selection entry - keeps enum validation on section field
const SelectionEntry = z.object({
  section: SectionTypeEnum,
  layout: z.string().nullable(),
});

// Question schema for uncertain selections
export const UIBlockQuestionSchema = z.object({
  id: z.string(),
  section: SectionTypeEnum,
  question: z.string(),
  options: z.array(z.string()).min(2).max(4),
});

// Main UIBlock selection response schema
// Uses array of entries to avoid propertyNames constraint
export const UIBlockSelectionResponseSchema = z.object({
  selections: z.array(SelectionEntry),
  questions: z.array(UIBlockQuestionSchema),
});

export type UIBlockSelectionResponse = z.infer<typeof UIBlockSelectionResponseSchema>;
export type UIBlockQuestion = z.infer<typeof UIBlockQuestionSchema>;
export type SelectionEntryType = z.infer<typeof SelectionEntry>;
