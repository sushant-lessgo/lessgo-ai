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
// PILOT SLICE: the `OutreachPlatform` union is the FULL set now, but only the two
// pilot platforms (`cold_email`, `linkedin_note`) have defs this phase. The other
// three resolve to `null` via `getPlatformDef` — a route treats null as
// not-available (phase 6 adds their defs).

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
};

/** Pilot platform defs, keyed by id. Non-pilot platforms are intentionally absent. */
const PLATFORM_DEFS: Partial<Record<OutreachPlatform, PlatformDef>> = {
  cold_email: COLD_EMAIL_DEF,
  linkedin_note: LINKEDIN_NOTE_DEF,
};

/** The pilot platforms, in canonical order (email first, then LinkedIn note). */
export const PILOT_PLATFORMS: PlatformDef[] = [COLD_EMAIL_DEF, LINKEDIN_NOTE_DEF];

/**
 * Resolve a platform id to its def. Returns `null` for unknown ids AND for
 * platforms in the union that are not yet implemented (phase 6) — a route treats
 * null as "not available", mirroring the email intent-plan not-available state.
 */
export function getPlatformDef(id: string): PlatformDef | null {
  return PLATFORM_DEFS[id as OutreachPlatform] ?? null;
}
