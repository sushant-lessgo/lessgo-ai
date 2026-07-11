// src/modules/email/sequenceEngine.ts
// PURE generation core for email sequences: prompt builders, cap-FREE output
// schemas, length validators, and mock outputs. No AI call, no Prisma, no
// next/*, no 'use client' imports — a plain module a server route imports.
//
// CRITICAL (decision #10): the zod schemas handed to `generateRawJson`
// (`sequenceOutputSchema(def)` and `SingleEmailOutputSchema`) validate SHAPE
// ONLY — fields, types, and array length vs the def. They carry NO subject/body
// max-char constraints. `generateRawJson` runs `schema.parse` internally, so a
// cap inside the schema would surface as a PARSE failure and make `too_long`
// indistinguishable from `invalid_shape`, breaking the retry/trim contract.
// Length caps are enforced ONLY in `validateSequence` / `validateSingleEmail`
// on the returned object.

import { z } from 'zod';
import type { GoalIntent } from '@/modules/goals/vocabulary';
import type { SequenceDef, EmailDef } from './archetypes';
import type { EmailBrandContext } from './brandContext';
import { summarizeBrandContext, hasTestimonials } from './brandContext';

// ---- length caps (enforced in validators only, NEVER in the schemas) --------

export const SUBJECT_MAX_CHARS = 120;
export const BODY_MAX_CHARS = 2000;

// ---- proof-truth fragment ----------------------------------------------------
// Paraphrased from src/modules/audience/product/copyPrompt.ts (PROOF_ELEMENT_GUARD
// + global proof rules). Do NOT import that module here (it is in the copy path).

export const PROOF_TRUTH_FRAGMENT = [
  'PROOF & HONESTY RULES (follow exactly):',
  '- Never attribute a quote to a real or invented company name.',
  '- Do NOT put specific numbers, percentages, dollar figures, or ROI/results claims inside a testimonial quote.',
  '- Keep any social proof realistic and honestly general — the founder verifies and personalizes before sending.',
  '- A fictional first-name persona for an illustrative quote is acceptable, but never fabricate a named company, exact client count, or hard metric you cannot support.',
  '- Do not invent facts, statistics, product names, or customer quotes that are not supported by the brand context.',
].join('\n');

// ---- prompt builders ---------------------------------------------------------

export interface BuildSequencePromptArgs {
  def: SequenceDef;
  brandContext: EmailBrandContext;
  intent: GoalIntent;
}

function proofAvailabilityNote(ctx: EmailBrandContext): string {
  return hasTestimonials(ctx)
    ? 'Real testimonials are provided in the brand context — you may quote or closely paraphrase them, honoring the wording. Do not alter their meaning.'
    : 'No customer testimonials are provided, so DO NOT fabricate a quote or attribute words to a named customer. Speak to the value and outcomes the business delivers, drawing only on the brand context.';
}

function emailSlotBlock(email: EmailDef, position: number): string {
  return [
    `Email ${position + 1} — ${email.purpose} (timing: ${email.timingLabel})`,
    `Instructions: ${email.promptInstructions}`,
  ].join('\n');
}

/**
 * Build the full-sequence prompt. Instructs a subject + body per email using each
 * `EmailDef.promptInstructions`, injects the brand context and proof-truth
 * fragment, and requests JSON-ONLY output as an array of {subject, body} in order.
 */
export function buildSequencePrompt(args: BuildSequencePromptArgs): string {
  const { def, brandContext, intent } = args;
  const brand = summarizeBrandContext(brandContext);

  const slots = def.emails
    .map((email, i) => emailSlotBlock(email, i))
    .join('\n\n');

  const parts: string[] = [];

  parts.push(
    'You are an expert email copywriter writing a short, on-brand email sequence for a ' +
      "specific business. Write in the business's own voice: warm, concrete, and free of hype. " +
      'The business does NOT send these for the user — this is copy they will paste into their ' +
      'own email tool, so keep each email self-contained.',
  );

  parts.push(`Goal / intent this sequence serves: ${intent}.`);

  parts.push('=== BRAND CONTEXT ===\n' + brand);

  parts.push('=== ' + PROOF_TRUTH_FRAGMENT);

  parts.push(proofAvailabilityNote(brandContext));

  parts.push(
    `=== SEQUENCE (${def.emails.length} emails, write them IN THIS ORDER) ===\n` + slots,
  );

  parts.push(
    '=== OUTPUT ===\n' +
      'Respond with ONLY a JSON object of the form ' +
      '{"emails": [{"subject": "...", "body": "..."}, ...]}, where "emails" is an array of ' +
      'exactly ' +
      def.emails.length +
      ' objects, in order. Each "subject" is the email subject line and each "body" is the ' +
      'full email body (plain text, paste-ready). No commentary, no markdown fences, no ' +
      'timing labels — an object with an "emails" array only.',
  );

  return parts.join('\n\n');
}

export interface EmailSibling {
  position: number;
  subject: string;
  body: string;
}

export interface BuildSingleEmailPromptArgs {
  def: SequenceDef;
  /** Zero-based index of the email to regenerate. */
  position: number;
  /** The OTHER emails already in the sequence, for coherence context. */
  siblings: EmailSibling[];
  brandContext: EmailBrandContext;
}

/**
 * Build a single-email regeneration prompt. Regenerates ONE email at `position`,
 * passing the sibling emails as coherence context so the rewrite fits the arc.
 */
export function buildSingleEmailPrompt(args: BuildSingleEmailPromptArgs): string {
  const { def, position, siblings, brandContext } = args;
  const brand = summarizeBrandContext(brandContext);
  const target = def.emails[position];

  const parts: string[] = [];

  parts.push(
    'You are an expert email copywriter rewriting ONE email inside an existing on-brand ' +
      "email sequence for a specific business. Write in the business's own voice: warm, " +
      'concrete, and free of hype. Keep it coherent with the surrounding emails.',
  );

  parts.push('=== BRAND CONTEXT ===\n' + brand);

  parts.push('=== ' + PROOF_TRUTH_FRAGMENT);

  parts.push(proofAvailabilityNote(brandContext));

  parts.push(
    `=== EMAIL TO REWRITE ===\n` +
      `This is email ${position + 1} of ${def.emails.length}.\n` +
      (target
        ? `Purpose: ${target.purpose}\nTiming: ${target.timingLabel}\nInstructions: ${target.promptInstructions}`
        : 'Purpose: (unknown position — write a coherent email that fits the sequence.)'),
  );

  if (siblings.length > 0) {
    const siblingText = siblings
      .map((s) => `Email ${s.position + 1} subject: ${s.subject}\nEmail ${s.position + 1} body: ${s.body}`)
      .join('\n\n');
    parts.push(
      '=== OTHER EMAILS IN THE SEQUENCE (for coherence — do NOT repeat them) ===\n' +
        siblingText,
    );
  }

  parts.push(
    '=== OUTPUT ===\n' +
      'Respond with ONLY a JSON object of the form {"subject": "...", "body": "..."} for the ' +
      'single rewritten email. No commentary, no markdown fences, no timing label.',
  );

  return parts.join('\n\n');
}

// ---- output schemas (SHAPE ONLY — decision #10, NO char caps) ----------------

/** One email's raw model output: subject + body, no length constraints. */
export const emailItemSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export type EmailItem = z.infer<typeof emailItemSchema>;

/**
 * Full-sequence output schema — a factory because the array length is checked
 * against the def. SHAPE ONLY: fields, types, and length. NO char caps here.
 *
 * Wrapped as `{ emails: [...] }` (an OBJECT, not a bare array) so aiClient's
 * `generateRawJson` object-brace extraction (`/(\{[\s\S]*\})/`) handles unfenced
 * responses — a bare top-level array would not match. Pattern-consistent with
 * social-posts' `{ post }`.
 */
export function sequenceOutputSchema(def: SequenceDef) {
  return z.object({
    emails: z.array(emailItemSchema).length(def.emails.length),
  });
}

/** Single-email output schema — SHAPE ONLY, no char caps. */
export const SingleEmailOutputSchema = emailItemSchema;

// ---- validators (caps enforced HERE and only here — decision #10) -----------

export interface EmailLengthViolation {
  position: number;
  field: 'subject' | 'body';
  length: number;
  maxChars: number;
}

/**
 * Validation result — discriminated on `status`. Length violations are NOT
 * thrown: they return `too_long` so the route can retry once then trim, kept
 * distinct from `invalid_shape` (a genuine parse failure).
 */
export type ValidateSequenceResult =
  | { status: 'ok'; emails: EmailItem[] }
  | { status: 'invalid_shape'; error: string }
  | { status: 'too_long'; emails: EmailItem[]; violations: EmailLengthViolation[] };

export type ValidateSingleEmailResult =
  | { status: 'ok'; email: EmailItem }
  | { status: 'invalid_shape'; error: string }
  | { status: 'too_long'; email: EmailItem; violations: EmailLengthViolation[] };

function checkItemCaps(item: EmailItem, position: number): EmailLengthViolation[] {
  const violations: EmailLengthViolation[] = [];
  if (item.subject.length > SUBJECT_MAX_CHARS) {
    violations.push({ position, field: 'subject', length: item.subject.length, maxChars: SUBJECT_MAX_CHARS });
  }
  if (item.body.length > BODY_MAX_CHARS) {
    violations.push({ position, field: 'body', length: item.body.length, maxChars: BODY_MAX_CHARS });
  }
  return violations;
}

/**
 * Parse a raw full-sequence output against the SHAPE schema, then hard-check
 * per-email length caps. Empty subject/body → `invalid_shape`. Over-cap →
 * `too_long` (the object still parses the SHAPE schema — that is the guarantee
 * decision #10 relies on).
 */
export function validateSequence(raw: unknown, def: SequenceDef): ValidateSequenceResult {
  const parsed = sequenceOutputSchema(def).safeParse(raw);
  if (!parsed.success) {
    return { status: 'invalid_shape', error: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  const emails = parsed.data.emails.map((e) => ({ subject: e.subject.trim(), body: e.body.trim() }));

  for (let i = 0; i < emails.length; i++) {
    if (emails[i].subject.length === 0 || emails[i].body.length === 0) {
      return { status: 'invalid_shape', error: `email ${i + 1} has an empty subject or body` };
    }
  }

  const violations = emails.flatMap((e, i) => checkItemCaps(e, i));
  if (violations.length > 0) {
    return { status: 'too_long', emails, violations };
  }

  return { status: 'ok', emails };
}

/** Same contract as `validateSequence` but for one regenerated email. */
export function validateSingleEmail(raw: unknown): ValidateSingleEmailResult {
  const parsed = SingleEmailOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'invalid_shape', error: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  const email = { subject: parsed.data.subject.trim(), body: parsed.data.body.trim() };
  if (email.subject.length === 0 || email.body.length === 0) {
    return { status: 'invalid_shape', error: 'email has an empty subject or body' };
  }

  const violations = checkItemCaps(email, 0);
  if (violations.length > 0) {
    return { status: 'too_long', email, violations };
  }

  return { status: 'ok', email };
}

// ---- mock outputs (NEXT_PUBLIC_USE_MOCK_GPT + demo) --------------------------

/**
 * Mock full-sequence output. Shape matches `sequenceOutputSchema(def)` — an OBJECT
 * `{ emails: [...] }` whose array length === def.emails.length and stays within the
 * caps, so `validateSequence(mockSequenceOutput(def), def)` returns `ok`.
 */
export function mockSequenceOutput(def: SequenceDef): { emails: EmailItem[] } {
  return {
    emails: def.emails.map((email, i) => ({
      subject: `[Mock] ${email.purpose}`.slice(0, SUBJECT_MAX_CHARS),
      body:
        `This is a mock email ${i + 1} of ${def.emails.length} (${email.key}).\n\n` +
        `${email.promptInstructions}\n\n` +
        `Timing: ${email.timingLabel}.`,
    })),
  };
}

/** Mock single-email output — matches `SingleEmailOutputSchema`, within caps. */
export function mockSingleEmailOutput(def?: SequenceDef, position = 0): EmailItem {
  const email = def?.emails[position];
  return {
    subject: `[Mock] ${email?.purpose ?? 'Regenerated email'}`.slice(0, SUBJECT_MAX_CHARS),
    body:
      `This is a mock regenerated email${email ? ` (${email.key})` : ''}.\n\n` +
      `${email?.promptInstructions ?? 'Coherent replacement copy.'}`,
  };
}
