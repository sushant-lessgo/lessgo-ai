// src/modules/email/archetypes.ts
// PURE data module — the archetype map + intent resolver for goal-matched email
// sequences. No AI, no Prisma, no next/*, no 'use client' imports. A plain module
// any server route or client component can import.
//
// Design (email-sequences plan, decisions #2 + #3):
//   - Timing labels are STATIC archetype metadata here, NOT AI-generated and NOT
//     stored on the row. AI output = subject + body only; the rail derives the
//     label at render from archetype + position.
//   - `getSequencePlanForIntent(intent)` is a 3-STATE resolver:
//       available → a SequenceDef exists and is live in this phase
//       deferred  → mapped to an archetype that is not built yet (phase 6) OR
//                   Activation (signup-free / free-trial), which stays deferred
//       skipped   → this goal genuinely has no useful email sequence
//     Deferred and skipped both render the same clean "not available" empty state;
//     neither is ever an error.
//
// Phase 2 pilot slice: ONLY the Show-up archetype (book-call, request-demo,
// book-me, rsvp) is `available`. The other 4 archetypes' intents are `deferred`
// until phase 6 flips them on. The map is keyed off intent ONLY (no mechanism
// arg) and is EXHAUSTIVE over `GoalIntent` (compile-time enforced by the
// `Record<GoalIntent, SequencePlan>` type below).

import type { GoalIntent } from '@/modules/goals/vocabulary';

/**
 * The archetype identifiers. All planned archetypes are enumerated for
 * forward-compatibility with phase 6, but only `show-up` has a live SequenceDef
 * in this phase. `activation` stays deferred indefinitely (spec).
 */
export type EmailArchetypeId =
  | 'show-up'
  | 'follow-up-nurture'
  | 'lead-magnet-delivery'
  | 'waitlist-warm-keeper'
  | 'welcome-series'
  | 'activation';

/**
 * One email slot in a sequence. All fields are STATIC archetype metadata:
 *   - `key`               stable slot identifier (persisted on the row per email)
 *   - `purpose`           short human description (dashboard + prompt context)
 *   - `timingLabel`       static send-timing hint rendered by the rail (decision #2)
 *   - `promptInstructions` per-email guidance the prompt builder injects
 */
export interface EmailDef {
  key: string;
  purpose: string;
  timingLabel: string;
  promptInstructions: string;
}

/** A full sequence definition: an archetype + its ordered email slots. */
export interface SequenceDef {
  archetype: EmailArchetypeId;
  emails: EmailDef[];
}

/** The 3-state resolution result (decision #3). */
export type SequencePlan =
  | { status: 'available'; def: SequenceDef }
  | { status: 'deferred' }
  | { status: 'skipped' };

/**
 * Show-up sequence — the phase-2 pilot slice. Four emails that carry a booked
 * attendee from confirmation to actually showing up: confirm + agenda → proof →
 * 24h reminder → 1h reminder. Timing labels are static and authoritative.
 */
export const SHOW_UP_SEQUENCE: SequenceDef = {
  archetype: 'show-up',
  emails: [
    {
      key: 'confirm-agenda',
      purpose: 'Confirm the booking and set the agenda',
      timingLabel: 'Send immediately after booking',
      promptInstructions:
        'Warmly confirm that the booking is locked in. Restate what was booked, ' +
        'set a short, concrete agenda for the session (2-3 bullet-style points of ' +
        'what will be covered), and tell them what to bring or prepare if relevant. ' +
        'Keep it reassuring and low-friction — the goal is that they feel confident ' +
        'and know exactly what happens next.',
    },
    {
      key: 'proof',
      purpose: 'Build confidence with social proof before the session',
      timingLabel: 'Send 2 days before',
      promptInstructions:
        'Reinforce that they made a good decision by showing the value others got ' +
        'from this. Draw on the brand context (offerings, outcomes, testimonials). ' +
        'Frame proof honestly and generally — build anticipation for the session ' +
        'without over-promising.',
    },
    {
      key: 'reminder-24h',
      purpose: '24-hour reminder',
      timingLabel: 'Send 24h before',
      promptInstructions:
        'A short, friendly reminder that the session is tomorrow. Restate the key ' +
        'detail (what + roughly when), reaffirm the value, and make it effortless to ' +
        'keep the commitment. Include a gentle reschedule option so a conflict does ' +
        'not become a no-show.',
    },
    {
      key: 'reminder-1h',
      purpose: '1-hour reminder',
      timingLabel: 'Send 1h before',
      promptInstructions:
        'A very short, punchy nudge that the session starts in about an hour. Keep ' +
        'it to a couple of sentences with a clear "see you soon" energy and any ' +
        'final join/arrival detail. No new information — just the last push to show up.',
    },
  ],
};

/**
 * EXHAUSTIVE intent → plan map. Typed as `Record<GoalIntent, SequencePlan>` so
 * the compiler rejects the file if any of the 18 frozen intents is missing.
 *
 * Phase 2 state:
 *   - Show-up (book-call, request-demo, book-me, rsvp) → available.
 *   - No-email intents (follow-social, buy-via-link, order-via-platform,
 *     pay-via-link, download-app) → skipped.
 *   - Everything else (enquiry, request-quote, apply, lead-magnet, waitlist,
 *     subscribe-newsletter, enroll, signup-free, free-trial) → deferred.
 */
const INTENT_PLAN: Record<GoalIntent, SequencePlan> = {
  // Show-up archetype — LIVE in phase 2.
  'book-call': { status: 'available', def: SHOW_UP_SEQUENCE },
  'request-demo': { status: 'available', def: SHOW_UP_SEQUENCE },
  'book-me': { status: 'available', def: SHOW_UP_SEQUENCE },
  'rsvp': { status: 'available', def: SHOW_UP_SEQUENCE },

  // Genuinely no useful email sequence for these goals.
  'follow-social': { status: 'skipped' },
  'buy-via-link': { status: 'skipped' },
  'order-via-platform': { status: 'skipped' },
  'pay-via-link': { status: 'skipped' },
  'download-app': { status: 'skipped' },

  // Mapped to archetypes not built until phase 6 (Follow-up nurture, Lead-magnet
  // delivery, Waitlist warm-keeper, Welcome series) — deferred for now.
  'enquiry': { status: 'deferred' },
  'request-quote': { status: 'deferred' },
  'apply': { status: 'deferred' },
  'lead-magnet': { status: 'deferred' },
  'waitlist': { status: 'deferred' },
  'subscribe-newsletter': { status: 'deferred' },
  'enroll': { status: 'deferred' },

  // Activation archetype — stays deferred (spec).
  'signup-free': { status: 'deferred' },
  'free-trial': { status: 'deferred' },
};

/**
 * Resolve a goal intent to its 3-state sequence plan (decision #3). Keyed off
 * intent ONLY — mechanism is irrelevant to which email sequence applies.
 */
export function getSequencePlanForIntent(intent: GoalIntent): SequencePlan {
  return INTENT_PLAN[intent];
}
