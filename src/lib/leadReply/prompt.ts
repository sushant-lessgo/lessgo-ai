// src/lib/leadReply/prompt.ts
// PURE, server-side prompt builder + output schema for the lead-reply draft. No
// 'use client', no prisma, no next/*, no AI call — a plain module the route
// imports. NOT for client import.

import { z } from 'zod';
import type { ReplyGrounding } from './brandGrounding';

/** Zod contract handed to `generateRawJson('lead-reply', …)`. Shape only. */
export const LeadReplyOutputSchema = z.object({
  reply: z.string().min(1),
});

export type LeadReplyOutput = z.infer<typeof LeadReplyOutputSchema>;

/**
 * Build the single-call prompt that drafts a reply to an inbound lead.
 *
 * The AI must reply in the business's voice, address the lead's actual question,
 * stay concise and sendable via email or WhatsApp, invent NO facts/prices/
 * availability beyond the grounding, use plain text, and end with a simple
 * sign-off (never a placeholder like `[Your Name]`).
 */
export function buildLeadReplyPrompt(
  grounding: ReplyGrounding,
  leadMessage: string,
  leadName?: string
): string {
  const who = leadName?.trim() ? `The lead's name is ${leadName.trim()}.` : '';

  const groundingHeader =
    grounding.mode === 'brief'
      ? 'Use ONLY these brand facts. Do not invent anything beyond them:'
      : 'Only minimal brand context is available. Reply helpfully and honestly, ' +
        'and do NOT invent any specifics (no prices, no availability, no product ' +
        'claims) beyond what the lead already said:';

  return [
    'You are drafting a reply, on behalf of a business, to an inbound message a ' +
      'potential customer sent through the business\'s website contact form.',
    '',
    '=== BRAND CONTEXT ===',
    groundingHeader,
    grounding.summary,
    '',
    '=== LEAD MESSAGE ===',
    who,
    'The lead wrote:',
    `"""${leadMessage}"""`,
    '',
    '=== YOUR TASK ===',
    'Write a reply that:',
    "- speaks in the business's voice and directly addresses the lead's actual question or request;",
    '- is concise, warm, and ready to send as-is via email or WhatsApp;',
    '- invents NO facts, prices, or availability beyond the brand context above;',
    '- is plain text (no markdown, no subject line);',
    '- ends with a simple, natural sign-off and does NOT use bracketed placeholders ' +
      'like [Your Name], [Company], or [phone].',
    '',
    'Return JSON: { "reply": "<the reply text>" }.',
  ].join('\n');
}
