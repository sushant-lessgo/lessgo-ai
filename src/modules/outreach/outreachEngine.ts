// src/modules/outreach/outreachEngine.ts
// PURE generation core for cold outreach: prompt builders, cap-FREE output
// schemas, length validators, and mock outputs. No AI call, no Prisma, no
// next/*, no 'use client' imports — a plain module a server route imports.
// Cloned from src/modules/email/sequenceEngine.ts (same decision #10 contract).
//
// CRITICAL (decision #6 / #10): the zod schemas handed to the AI-call layer
// (`outreachOutputSchema(platforms)` and `singleMessageOutputSchema(def)`)
// validate SHAPE ONLY — array length, platform ids, and subject-present-iff-
// hasSubject. They carry NO subject/body length caps. Caps would surface as a
// PARSE failure and make `too_long` indistinguishable from `invalid_shape`,
// breaking the retry/trim contract. All length caps are enforced ONLY in
// `validateOutreachMessages` / `validateSingleMessage`, read from the PlatformDef.
//
// PROOF-TRUTH (both sides): sender claims come only from the Brief brand context
// (reused from the email rail); prospect facts come only from the grounding
// (extracted scrape or pasted text). Never invent either side.

import { z } from 'zod';
import type { EmailBrandContext } from '@/modules/email/brandContext';
import { summarizeBrandContext, hasTestimonials } from '@/modules/email/brandContext';
import { PROOF_TRUTH_FRAGMENT } from '@/modules/email/sequenceEngine';
import type { ProspectExtract, ProspectRawGrounding } from './prospectExtraction';
import { summarizeProspect } from './prospectExtraction';
import type { PlatformDef } from './platforms';

// Re-export so consumers get the proof-truth fragment through the outreach engine
// too (single import surface); the source of truth stays the email module.
export { PROOF_TRUTH_FRAGMENT };

/** Grounding accepted by the generation prompt: an extract, pasted text, or none. */
export type OutreachGrounding = ProspectExtract | ProspectRawGrounding | null;

/** Minimal intake slice the prompt needs (mirrors the OutreachIntake row). */
export interface OutreachIntakeContext {
  targetDescriptor: string;
  openerContext?: string;
}

// ---- prompt builders ---------------------------------------------------------

function proofAvailabilityNote(ctx: EmailBrandContext): string {
  return hasTestimonials(ctx)
    ? 'Real testimonials are provided in the brand context — you may quote or closely paraphrase them, honoring the wording. Do not alter their meaning.'
    : 'No customer testimonials are provided, so DO NOT fabricate a quote or attribute words to a named customer. Speak to the value and outcomes the business delivers, drawing only on the brand context.';
}

/**
 * Render the prospect-grounding section. A real grounding becomes a PROSPECT
 * FACTS / pasted-text block with a "reference at least one concrete specific"
 * instruction (via `summarizeProspect`). A `null` grounding becomes an explicit
 * GENERIC block — write a solid generic message for the target descriptor and
 * NEVER fabricate prospect facts.
 */
function groundingBlock(grounding: OutreachGrounding, targetDescriptor: string): string {
  if (grounding === null) {
    return (
      '=== PROSPECT GROUNDING ===\n' +
      'NO prospect info was provided. Do NOT invent or assume ANY specific fact ' +
      'about the recipient (no company name, no product, no metric). Write a solid, ' +
      'genuine GENERIC message aimed at the target descriptor below, speaking to ' +
      'their likely situation without pretending to know specifics.\n' +
      `Target descriptor (who the sender wants to reach): ${targetDescriptor}`
    );
  }

  return (
    '=== PROSPECT GROUNDING ===\n' +
    summarizeProspect(grounding) +
    '\nEvery message MUST reference at least one concrete specific from the prospect ' +
    'facts above. Use ONLY these facts about the prospect — never invent, guess, or ' +
    'embellish any prospect detail beyond what is stated here.'
  );
}

/** initial = first-touch message; bump = one optional follow-up (Scope OUT: no cadence). */
export type OutreachKind = 'initial' | 'bump';

/**
 * Resolve the per-platform instructions for a given kind. A bump uses the def's
 * `bumpInstructions` when present, falling back to the initial instructions (so a
 * platform without a bump template still produces a sane follow-up).
 */
function instructionsFor(def: PlatformDef, kind: OutreachKind): string {
  if (kind === 'bump' && def.bumpInstructions) return def.bumpInstructions;
  return def.promptInstructions;
}

/** Render one initial message as bump context ("the first message you already sent"). */
function priorMessageBlock(prior: OutreachSibling): string {
  return (
    'FIRST MESSAGE ALREADY SENT (the prospect has NOT replied — your follow-up must ' +
    'reference it lightly, never repeat it verbatim):\n' +
    (prior.subject ? `Subject: ${prior.subject}\n` : '') +
    prior.body
  );
}

function platformSlotBlock(def: PlatformDef, kind: OutreachKind, prior?: OutreachSibling): string {
  const subjectNote = def.hasSubject
    ? 'This channel HAS a subject line — provide both a "subject" and a "body".'
    : 'This channel has NO subject line — provide a "body" only, and OMIT "subject".';
  const lines = [
    `Platform: ${def.id} (${def.label})`,
    subjectNote,
    `Instructions: ${instructionsFor(def, kind)}`,
  ];
  if (kind === 'bump' && prior) lines.push(priorMessageBlock(prior));
  return lines.join('\n');
}

export interface BuildOutreachPromptArgs {
  platforms: PlatformDef[];
  brandContext: EmailBrandContext;
  intake: OutreachIntakeContext;
  grounding: OutreachGrounding;
  /** 'initial' (default) or 'bump' — a bump follow-up per platform. */
  kind?: OutreachKind;
  /**
   * For `kind: 'bump'` — the already-sent initial message per platform, in the SAME
   * ORDER as `platforms`. Ignored for 'initial'. A missing entry degrades gracefully
   * (bump written without prior-message context).
   */
  priorMessages?: OutreachSibling[];
}

/**
 * Build the full multi-platform outreach prompt. Injects the sender brand context
 * (Brief-only claims) + proof-truth fragment, the prospect grounding block (or a
 * generic block when grounding is null), one slot per selected platform from its
 * `promptInstructions`, and requests JSON-ONLY output as `{messages:[...]}` in
 * platform order.
 */
export function buildOutreachPrompt(args: BuildOutreachPromptArgs): string {
  const { platforms, brandContext, intake, grounding, kind = 'initial', priorMessages = [] } = args;
  const brand = summarizeBrandContext(brandContext);

  const slots = platforms
    .map((def, i) => platformSlotBlock(def, kind, priorMessages[i]))
    .join('\n\n');

  const parts: string[] = [];

  parts.push(
    kind === 'bump'
      ? 'You are an expert cold-outreach copywriter writing ONE short follow-up ("bump") ' +
          "message per platform in the sender's own voice: warm, concrete, and free of " +
          'hype. Each follow-up goes to a prospect who did NOT reply to the first message ' +
          '(provided per platform below). Reference the first message lightly, add a small ' +
          'reason to reply, and NEVER guilt-trip or pressure. The sender will paste each ' +
          'message into their own tool, so keep every message self-contained.'
      : 'You are an expert cold-outreach copywriter writing short, personalized, ' +
          "platform-correct outreach messages in the sender's own voice: warm, concrete, " +
          'and free of hype. The sender will paste each message into their own tool, so ' +
          'keep every message self-contained.',
  );

  if (intake.openerContext && intake.openerContext.trim()) {
    parts.push(`Opener context / angle the sender wants to lead with: ${intake.openerContext.trim()}`);
  }

  parts.push('=== SENDER BRAND CONTEXT (claims may come ONLY from here) ===\n' + brand);

  parts.push('=== ' + PROOF_TRUTH_FRAGMENT);

  parts.push(proofAvailabilityNote(brandContext));

  parts.push(groundingBlock(grounding, intake.targetDescriptor));

  parts.push(
    `=== PLATFORMS (${platforms.length}, write one message per platform IN THIS ORDER) ===\n` + slots,
  );

  parts.push(
    '=== OUTPUT ===\n' +
      'Respond with ONLY a JSON object of the form ' +
      '{"messages": [{"platform": "...", "subject": "...", "body": "..."}, ...]}, where ' +
      '"messages" is an array of exactly ' +
      platforms.length +
      ' objects, one per platform, in the SAME ORDER as listed above and with the ' +
      'matching "platform" id. Include "subject" ONLY for platforms that have a subject ' +
      'line; omit it otherwise. "body" is the full paste-ready message text. No ' +
      'commentary, no markdown fences — an object with a "messages" array only.',
  );

  return parts.join('\n\n');
}

/** A sibling message passed as coherence context to a single-message regen. */
export interface OutreachSibling {
  platform: string;
  subject?: string;
  body: string;
}

export interface BuildSingleMessagePromptArgs {
  platformDef: PlatformDef;
  /** Other recent messages (same or other platforms) for tone coherence. */
  siblings: OutreachSibling[];
  brandContext: EmailBrandContext;
  intake: OutreachIntakeContext;
  grounding: OutreachGrounding;
  /** 'initial' (default) or 'bump' — regenerate a follow-up bump message. */
  kind?: OutreachKind;
  /**
   * For `kind: 'bump'` — the corresponding initial message this bump follows up on,
   * injected as context so the rewrite stays grounded in the first touch.
   */
  priorMessage?: OutreachSibling;
}

/**
 * Build a single-message regeneration prompt for ONE platform. Passes recent
 * siblings as coherence context. Same brand-context + proof-truth + grounding
 * contract as the full prompt.
 */
export function buildSingleMessagePrompt(args: BuildSingleMessagePromptArgs): string {
  const { platformDef, siblings, brandContext, intake, grounding, kind = 'initial', priorMessage } = args;
  const brand = summarizeBrandContext(brandContext);

  const parts: string[] = [];

  parts.push(
    kind === 'bump'
      ? 'You are an expert cold-outreach copywriter rewriting ONE short follow-up ("bump") ' +
          "message for a specific platform, in the sender's own voice: warm, concrete, and " +
          'free of hype. It goes to a prospect who did NOT reply to the first message ' +
          '(provided below). Reference the first message lightly, never guilt-trip. Produce ' +
          'a fresh, paste-ready alternative.'
      : 'You are an expert cold-outreach copywriter rewriting ONE outreach message for a ' +
          "specific platform, in the sender's own voice: warm, concrete, and free of hype. " +
          'Produce a fresh, paste-ready alternative.',
  );

  if (intake.openerContext && intake.openerContext.trim()) {
    parts.push(`Opener context / angle the sender wants to lead with: ${intake.openerContext.trim()}`);
  }

  parts.push('=== SENDER BRAND CONTEXT (claims may come ONLY from here) ===\n' + brand);

  parts.push('=== ' + PROOF_TRUTH_FRAGMENT);

  parts.push(proofAvailabilityNote(brandContext));

  parts.push(groundingBlock(grounding, intake.targetDescriptor));

  parts.push(
    '=== MESSAGE TO WRITE ===\n' +
      `Platform: ${platformDef.id} (${platformDef.label})\n` +
      (platformDef.hasSubject
        ? 'This channel HAS a subject line — provide both a "subject" and a "body".'
        : 'This channel has NO subject line — provide a "body" only.') +
      `\nInstructions: ${instructionsFor(platformDef, kind)}` +
      (kind === 'bump' && priorMessage ? '\n' + priorMessageBlock(priorMessage) : ''),
  );

  if (siblings.length > 0) {
    const siblingText = siblings
      .map((s) => `- [${s.platform}]${s.subject ? ` subject: ${s.subject} —` : ''} ${s.body}`)
      .join('\n');
    parts.push(
      '=== RECENT MESSAGES (for tone coherence — do NOT copy them) ===\n' + siblingText,
    );
  }

  parts.push(
    '=== OUTPUT ===\n' +
      'Respond with ONLY a JSON object of the form ' +
      (platformDef.hasSubject
        ? '{"subject": "...", "body": "..."}'
        : '{"body": "..."}') +
      ' for the single rewritten message. No commentary, no markdown fences.',
  );

  return parts.join('\n\n');
}

// ---- output schemas (SHAPE ONLY — decision #10, NO char caps) ----------------

/** One message's raw model output: platform + optional subject + body, no caps. */
export const outreachMessageItemSchema = z.object({
  platform: z.string(),
  subject: z.string().optional(),
  body: z.string(),
});

export type OutreachMessageItem = z.infer<typeof outreachMessageItemSchema>;

/**
 * Full multi-platform output schema — a factory because the array length, the
 * platform ids, and subject-present-iff-hasSubject are checked against the
 * selected platforms. SHAPE ONLY: NO char caps here (those live in the validator).
 *
 * Wrapped as `{ messages: [...] }` (an OBJECT, not a bare array) so the AI layer's
 * object-brace extraction handles unfenced responses — pattern-consistent with the
 * email rail's `{ emails: [...] }`.
 */
export function outreachOutputSchema(platforms: PlatformDef[]) {
  return z.object({
    messages: z
      .array(outreachMessageItemSchema)
      .length(platforms.length)
      .superRefine((messages, ctx) => {
        messages.forEach((msg, i) => {
          const def = platforms[i];
          if (!def) return; // length mismatch already flagged by .length()
          if (msg.platform !== def.id) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [i, 'platform'],
              message: `message ${i + 1} platform "${msg.platform}" !== expected "${def.id}"`,
            });
          }
          const hasSubject = typeof msg.subject === 'string';
          if (def.hasSubject && !hasSubject) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [i, 'subject'],
              message: `message ${i + 1} (${def.id}) is missing a required subject`,
            });
          }
          if (!def.hasSubject && hasSubject) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [i, 'subject'],
              message: `message ${i + 1} (${def.id}) must not have a subject`,
            });
          }
        });
      }),
  });
}

/** Single-message output schema — SHAPE ONLY (subject iff hasSubject), no caps. */
export function singleMessageOutputSchema(def: PlatformDef) {
  return outreachMessageItemSchema.superRefine((msg, ctx) => {
    const hasSubject = typeof msg.subject === 'string';
    if (def.hasSubject && !hasSubject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subject'],
        message: `${def.id} message is missing a required subject`,
      });
    }
    if (!def.hasSubject && hasSubject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subject'],
        message: `${def.id} message must not have a subject`,
      });
    }
  });
}

// ---- validators (caps enforced HERE and only here — decision #6/#10) ---------

export interface OutreachLengthViolation {
  index: number;
  platform: string;
  field: 'subject' | 'body';
  metric: 'chars' | 'words';
  value: number;
  max: number;
}

/** Result shape (task contract): ok, or a reason-tagged failure with detail. */
export type ValidateOutreachResult =
  | { ok: true; messages: OutreachMessageItem[] }
  | { ok: false; reason: 'too_long'; detail: string; violations: OutreachLengthViolation[] }
  | { ok: false; reason: 'invalid_shape'; detail: string };

export type ValidateSingleMessageResult =
  | { ok: true; message: OutreachMessageItem }
  | { ok: false; reason: 'too_long'; detail: string; violations: OutreachLengthViolation[] }
  | { ok: false; reason: 'invalid_shape'; detail: string };

function wordCount(body: string): number {
  const trimmed = body.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/** Caps come from the PlatformDef — enforced here, never in the schema. */
function checkCaps(msg: OutreachMessageItem, def: PlatformDef, index: number): OutreachLengthViolation[] {
  const violations: OutreachLengthViolation[] = [];
  const caps = def.caps;

  if (caps.subjectMaxChars !== undefined && typeof msg.subject === 'string' && msg.subject.length > caps.subjectMaxChars) {
    violations.push({ index, platform: def.id, field: 'subject', metric: 'chars', value: msg.subject.length, max: caps.subjectMaxChars });
  }
  if (caps.bodyMaxChars !== undefined && msg.body.length > caps.bodyMaxChars) {
    violations.push({ index, platform: def.id, field: 'body', metric: 'chars', value: msg.body.length, max: caps.bodyMaxChars });
  }
  if (caps.bodyMaxWords !== undefined) {
    const words = wordCount(msg.body);
    if (words > caps.bodyMaxWords) {
      violations.push({ index, platform: def.id, field: 'body', metric: 'words', value: words, max: caps.bodyMaxWords });
    }
  }

  return violations;
}

/**
 * Parse a raw multi-platform output against the SHAPE schema, then hard-check
 * per-platform length caps. Empty body (or empty required subject) → invalid_shape.
 * Over-cap → too_long (the object still parses the SHAPE schema — the guarantee
 * decision #10 relies on).
 */
export function validateOutreachMessages(raw: unknown, platforms: PlatformDef[]): ValidateOutreachResult {
  const parsed = outreachOutputSchema(platforms).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: 'invalid_shape', detail: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  const messages = parsed.data.messages.map((m) => ({
    platform: m.platform,
    ...(typeof m.subject === 'string' ? { subject: m.subject.trim() } : {}),
    body: m.body.trim(),
  }));

  for (let i = 0; i < messages.length; i++) {
    const def = platforms[i];
    if (messages[i].body.length === 0) {
      return { ok: false, reason: 'invalid_shape', detail: `message ${i + 1} (${def.id}) has an empty body` };
    }
    if (def.hasSubject && (!messages[i].subject || messages[i].subject!.length === 0)) {
      return { ok: false, reason: 'invalid_shape', detail: `message ${i + 1} (${def.id}) has an empty subject` };
    }
  }

  const violations = messages.flatMap((m, i) => checkCaps(m, platforms[i], i));
  if (violations.length > 0) {
    const detail = violations
      .map((v) => `${v.platform} ${v.field} ${v.value} ${v.metric} > ${v.max}`)
      .join('; ');
    return { ok: false, reason: 'too_long', detail, violations };
  }

  return { ok: true, messages };
}

/** Same contract as `validateOutreachMessages` but for one regenerated message. */
export function validateSingleMessage(raw: unknown, def: PlatformDef): ValidateSingleMessageResult {
  const parsed = singleMessageOutputSchema(def).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: 'invalid_shape', detail: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  const message: OutreachMessageItem = {
    platform: parsed.data.platform,
    ...(typeof parsed.data.subject === 'string' ? { subject: parsed.data.subject.trim() } : {}),
    body: parsed.data.body.trim(),
  };

  if (message.body.length === 0) {
    return { ok: false, reason: 'invalid_shape', detail: `${def.id} message has an empty body` };
  }
  if (def.hasSubject && (!message.subject || message.subject.length === 0)) {
    return { ok: false, reason: 'invalid_shape', detail: `${def.id} message has an empty subject` };
  }

  const violations = checkCaps(message, def, 0);
  if (violations.length > 0) {
    const detail = violations.map((v) => `${v.platform} ${v.field} ${v.value} ${v.metric} > ${v.max}`).join('; ');
    return { ok: false, reason: 'too_long', detail, violations };
  }

  return { ok: true, message };
}

// ---- mock outputs (NEXT_PUBLIC_USE_MOCK_GPT + demo) --------------------------

function mockBodyFor(def: PlatformDef): string {
  switch (def.id) {
    case 'linkedin_note':
      // Must fit within 300 chars.
      return 'Loved what your team is building — the specifics on your site really stood out. Would be glad to connect and follow along.';
    case 'linkedin_inmail':
      // Within 600 chars.
      return (
        'Hi — the work you highlight on your site really caught my eye. We help teams ' +
        'like yours get more out of exactly that, and it tends to pay back fast. ' +
        'Worth a quick chat to see if it fits?'
      );
    case 'whatsapp':
      // Within 400 chars, 2–3 casual lines.
      return (
        'Hey! Came across your work and really liked the specifics you focus on.\n' +
        'Think we could help you get more from it — mind if I share a quick idea?'
      );
    case 'instagram_dm':
      // Within 500 chars, content-first.
      return (
        'Been enjoying your posts — the stuff you share really stands out.\n' +
        'We help folks doing what you do get more reach from it. Open to a quick idea?'
      );
    case 'cold_email':
    default:
      return (
        'Hi there — I came across your work and the specifics you highlight stood out to me. ' +
        'I think there is a clear way we could help you get more from it. ' +
        'Open to a quick reply if this is useful?'
      );
  }
}

/**
 * Mock multi-platform output. Shape matches `outreachOutputSchema(platforms)` — an
 * OBJECT `{ messages: [...] }` whose array length === platforms.length, platform
 * ids and subject-presence match, and every message stays within its caps, so
 * `validateOutreachMessages(mockOutreachOutput(platforms), platforms)` returns ok.
 */
export function mockOutreachOutput(platforms: PlatformDef[]): { messages: OutreachMessageItem[] } {
  return {
    messages: platforms.map((def) => ({
      platform: def.id,
      ...(def.hasSubject ? { subject: `[Mock] Quick idea for you`.slice(0, def.caps.subjectMaxChars ?? undefined) } : {}),
      body: mockBodyFor(def),
    })),
  };
}

/** Mock single-message output — matches `singleMessageOutputSchema(def)`, within caps. */
export function mockSingleMessageOutput(def: PlatformDef): OutreachMessageItem {
  return {
    platform: def.id,
    ...(def.hasSubject ? { subject: `[Mock] Regenerated`.slice(0, def.caps.subjectMaxChars ?? undefined) } : {}),
    body: mockBodyFor(def),
  };
}
