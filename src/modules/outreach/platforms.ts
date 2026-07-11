// src/modules/outreach/platforms.ts
// PURE static platform-definition map for cold outreach — the per-channel copy
// contract (label, whether it has a subject line, prompt guidance, and length
// caps). No AI, no Prisma, no next/*, no 'use client' imports. Mirrors the
// static-def style of src/modules/email/archetypes.ts.
//
// CAPS LIVE HERE AS DATA, ENFORCED IN THE ENGINE (decision #6): the numeric caps
// on this def are read only by `validateOutreachMessages` in outreachEngine.ts —
// they are NEVER baked into the zod output schemas (which stay shape-only so
// `too_long` is distinguishable from `invalid_shape`).
//
// FULL SLICE (phase 6): all five platforms now have defs and resolve via
// `getPlatformDef` (no longer null). Each def additionally carries
// `bumpInstructions` — a short, one-shot follow-up (NOT a cadence; Scope OUT) that
// references the first message without a guilt-trip. The cold-email bump gets its
// own subject.

/** All outreach channels. Full union now; pilot defs for two of them this phase. */
export type OutreachPlatform =
  | 'cold_email'
  | 'linkedin_note'
  | 'linkedin_inmail'
  | 'whatsapp'
  | 'instagram_dm';

/** Length caps for one platform. All optional — a platform enforces only what applies. */
export interface PlatformCaps {
  subjectMaxChars?: number;
  bodyMaxChars?: number;
  bodyMaxWords?: number;
}

/**
 * One platform's static copy contract:
 *   - `id`                 the platform key (persisted on the message row)
 *   - `label`              human display label (dashboard + prompt slot header)
 *   - `hasSubject`         whether this channel carries a subject line
 *   - `promptInstructions` per-platform guidance injected into the prompt slot
 *   - `caps`              length caps read by the engine validator (never the schema)
 *   - `bumpInstructions`   optional follow-up guidance (phase 6; unused this phase)
 */
export interface PlatformDef {
  id: OutreachPlatform;
  label: string;
  hasSubject: boolean;
  promptInstructions: string;
  caps: PlatformCaps;
  bumpInstructions?: string;
}

/**
 * Cold email — the only pilot platform with a subject line. Short, personalized,
 * one clear CTA; subject ≤120 chars, body ≤120 words.
 */
export const COLD_EMAIL_DEF: PlatformDef = {
  id: 'cold_email',
  label: 'Cold email',
  hasSubject: true,
  promptInstructions:
    'Write a short, personalized cold email. Open with a genuine, specific line ' +
    'about the PROSPECT (reference a real fact about their business), then bridge ' +
    'in ONE sentence to how the sender can help them, and close with exactly ONE ' +
    'clear, low-friction call to action (e.g. a short reply or a quick call). No ' +
    'hype, no multiple asks, no link-dump. Keep the whole body under 120 words. ' +
    'The subject line must be specific and curiosity-earning, under 120 characters, ' +
    'never clickbait. This is copy the sender will paste into their own email tool.',
  caps: { subjectMaxChars: 120, bodyMaxWords: 120 },
  bumpInstructions:
    'Write a SINGLE short follow-up email to the same prospect who did not reply to ' +
    'the first message (shown as context). Briefly, warmly reference the earlier ' +
    'note without repeating it, add one small new angle or reason it is worth a ' +
    'reply, and close with the same single low-friction CTA. No guilt-trip, no ' +
    '"just following up / did you see this", no pressure. Give this follow-up its ' +
    'OWN fresh subject line, under 120 characters. Keep the body under 120 words.',
};

/**
 * LinkedIn connection note — the tightest pilot channel. No subject, no pitch:
 * a warm, specific reason-to-connect that fits LinkedIn's 300-character limit.
 */
export const LINKEDIN_NOTE_DEF: PlatformDef = {
  id: 'linkedin_note',
  label: 'LinkedIn connection note',
  hasSubject: false,
  promptInstructions:
    'Write a LinkedIn connection request note. This is NOT a pitch — do not sell, ' +
    'do not describe the sender\'s offer, and do not include a call to action. Give ' +
    'a warm, specific, genuine reason to connect that references a real fact about ' +
    'the PROSPECT\'s business. It MUST fit within 300 characters total, so keep it ' +
    'to one or two tight sentences. Plain text only.',
  caps: { bodyMaxChars: 300 },
  bumpInstructions:
    'The prospect accepted the connection but has not replied to the earlier note ' +
    '(shown as context). Write ONE short, warm follow-up message: reference the ' +
    'earlier note lightly, offer a genuine reason to talk, and end with a soft, ' +
    'low-pressure invitation. No pitch-dump, no guilt-trip. Plain text, keep it ' +
    'tight — well under 300 characters.',
};

/**
 * LinkedIn InMail / DM — more room than a connection note. A short, direct pitch:
 * one specific prospect fact, one proof/value line, one soft CTA. No subject line.
 */
export const LINKEDIN_INMAIL_DEF: PlatformDef = {
  id: 'linkedin_inmail',
  label: 'LinkedIn InMail / DM',
  hasSubject: false,
  promptInstructions:
    'Write a LinkedIn InMail / direct message. Open with one specific, genuine line ' +
    'about the PROSPECT (a real fact about their business), give ONE short proof or ' +
    'value line about how the sender helps (grounded only in the brand context), and ' +
    'close with ONE soft, low-friction call to action (an easy yes — e.g. "worth a ' +
    'quick chat?"). Conversational, not formal; no hype, no multiple asks, no ' +
    'link-dump. Keep the whole message under 600 characters. Plain text only.',
  caps: { bodyMaxChars: 600 },
  bumpInstructions:
    'The prospect has not replied to the earlier InMail (shown as context). Write ONE ' +
    'short follow-up: lightly reference the earlier message, add a single fresh ' +
    'angle, and repeat the same soft CTA. No guilt-trip, no pressure. Plain text, ' +
    'under 600 characters.',
};

/**
 * WhatsApp — the most casual channel. Two or three short, human lines; no link-dump,
 * no formal pitch. No subject line.
 */
export const WHATSAPP_DEF: PlatformDef = {
  id: 'whatsapp',
  label: 'WhatsApp',
  hasSubject: false,
  promptInstructions:
    'Write a WhatsApp message: two or three short, casual, human lines — the way ' +
    'you would actually text someone. Reference one real fact about the PROSPECT, ' +
    'say in a line how the sender can help, and end with a light, easy question. Do ' +
    'NOT dump links, do NOT paste a formal pitch, do NOT over-explain. Warm and ' +
    'brief. Keep the whole message under 400 characters. Plain text only.',
  caps: { bodyMaxChars: 400 },
  bumpInstructions:
    'A casual WhatsApp nudge to someone who has not replied yet (earlier message ' +
    'shown as context). One or two friendly lines that lightly reference the first ' +
    'message and re-ask the easy question. No guilt-trip, no pressure, no ' +
    'link-dump. Plain text, under 400 characters.',
};

/**
 * Instagram DM — reference the prospect's content FIRST, then bridge. No subject.
 */
export const INSTAGRAM_DM_DEF: PlatformDef = {
  id: 'instagram_dm',
  label: 'Instagram DM',
  hasSubject: false,
  promptInstructions:
    'Write an Instagram direct message. Lead by referencing the PROSPECT\'s actual ' +
    'content or work (a specific post, theme, or thing they make) in a genuine, ' +
    'non-generic way — this comes FIRST. THEN bridge in one line to how the sender ' +
    'could help, and close with a light, low-friction question. Casual and warm, ' +
    'the way people actually DM on Instagram; no formal pitch, no link-dump. Keep ' +
    'the whole message under 500 characters. Plain text only.',
  caps: { bodyMaxChars: 500 },
  bumpInstructions:
    'A light Instagram DM follow-up to someone who has not replied (earlier message ' +
    'shown as context). Reference their content again or the earlier message, add a ' +
    'small genuine note, and re-ask the easy question. No guilt-trip, no pressure. ' +
    'Plain text, under 500 characters.',
};

/** All platform defs, keyed by id. Every union member is now resolvable (phase 6). */
const PLATFORM_DEFS: Partial<Record<OutreachPlatform, PlatformDef>> = {
  cold_email: COLD_EMAIL_DEF,
  linkedin_note: LINKEDIN_NOTE_DEF,
  linkedin_inmail: LINKEDIN_INMAIL_DEF,
  whatsapp: WHATSAPP_DEF,
  instagram_dm: INSTAGRAM_DM_DEF,
};

/** The pilot platforms, in canonical order (email first, then LinkedIn note). */
export const PILOT_PLATFORMS: PlatformDef[] = [COLD_EMAIL_DEF, LINKEDIN_NOTE_DEF];

/** The three platforms added in phase 6 (InMail/DM, WhatsApp, Instagram DM). */
export const EXTENDED_PLATFORMS: PlatformDef[] = [
  LINKEDIN_INMAIL_DEF,
  WHATSAPP_DEF,
  INSTAGRAM_DM_DEF,
];

/** All platforms, canonical order: pilot two then the phase-6 three. */
export const ALL_PLATFORMS: PlatformDef[] = [...PILOT_PLATFORMS, ...EXTENDED_PLATFORMS];

/**
 * Resolve a platform id to its def. Returns `null` only for genuinely unknown ids
 * (all five union members now resolve). A route treats null as "not available".
 */
export function getPlatformDef(id: string): PlatformDef | null {
  return PLATFORM_DEFS[id as OutreachPlatform] ?? null;
}
