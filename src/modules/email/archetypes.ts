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
//       deferred  → Activation (signup-free / free-trial), whose archetype is
//                   not built and stays deferred (spec)
//       skipped   → this goal genuinely has no useful email sequence
//     Deferred and skipped both render the same clean "not available" empty state;
//     neither is ever an error.
//
// Phase 6: all five built archetypes are `available` — Show-up (book-call,
// request-demo, book-me, rsvp), Follow-up nurture (enquiry, request-quote,
// apply), Lead-magnet delivery (lead-magnet), Waitlist warm-keeper (waitlist),
// and Welcome series (subscribe-newsletter, enroll). Only Activation
// (signup-free, free-trial) remains deferred and the 5 no-email intents stay
// skipped. The map is keyed off intent ONLY (no mechanism arg) and is EXHAUSTIVE
// over `GoalIntent` (compile-time enforced by the `Record<GoalIntent,
// SequencePlan>` type below).

import type { GoalIntent } from '@/modules/goals/vocabulary';

/**
 * The archetype identifiers. All five nurture archetypes have live SequenceDefs;
 * `activation` stays deferred indefinitely (spec — not built).
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
 * Follow-up nurture sequence — reactive nurture for inbound interest that has not
 * yet committed (enquiry, request-quote, apply). Four emails carry a fresh lead
 * from first contact to a booked next step: instant acknowledge → proof →
 * objection-killer → direct CTA. Timing labels are static and authoritative.
 */
export const FOLLOW_UP_NURTURE_SEQUENCE: SequenceDef = {
  archetype: 'follow-up-nurture',
  emails: [
    {
      key: 'acknowledge',
      purpose: 'Instantly acknowledge the enquiry and set expectations',
      timingLabel: 'Send immediately',
      promptInstructions:
        'Warmly acknowledge that their enquiry came through and that a real person ' +
        'has it. Restate what they asked about in your own words so they feel heard, ' +
        'tell them what happens next and roughly when, and invite one quick reply if ' +
        'they want to add detail. Draw only on the brand context (offering, who it is ' +
        'for) — do not invent company names, hard numbers, or quotes. Keep it prompt, ' +
        'human, and low-friction.',
    },
    {
      key: 'proof',
      purpose: 'Build confidence with honest social proof',
      timingLabel: 'Send day 2',
      promptInstructions:
        'Show that others in a similar position got real value from this. Draw on the ' +
        'brand context (offerings, outcomes, testimonials) and frame proof honestly and ' +
        'generally — never fabricate company names, metrics, or quoted results. The goal ' +
        'is to make them feel this is a safe, proven choice while their interest is warm.',
    },
    {
      key: 'objection-killer',
      purpose: 'Pre-empt the most likely hesitation',
      timingLabel: 'Send day 4',
      promptInstructions:
        'Address the single most common reason someone in their position hesitates ' +
        '(price, timing, fit, or uncertainty about the process) and defuse it honestly. ' +
        'Use the brand context to explain how the offer removes that risk. Do not invent ' +
        'guarantees, numbers, or testimonials that are not in the brand facts. Reassure, ' +
        'do not pressure.',
    },
    {
      key: 'direct-cta',
      purpose: 'Make a clear, direct ask to take the next step',
      timingLabel: 'Send day 6',
      promptInstructions:
        'Make one clear, direct ask to move forward — book the call, approve the quote, ' +
        'or complete the application, whichever fits the offer. Keep it short, restate the ' +
        'core value in a line, and make the next step effortless with a single obvious ' +
        'action. Confident and friendly, not pushy. No new claims beyond the brand facts.',
    },
  ],
};

/**
 * Lead-magnet delivery sequence — deliver a requested resource and convert the
 * new subscriber over time (lead-magnet). Four emails: deliver the magnet →
 * consume nudge → related proof → offer. Timing labels are static.
 */
export const LEAD_MAGNET_DELIVERY_SEQUENCE: SequenceDef = {
  archetype: 'lead-magnet-delivery',
  emails: [
    {
      key: 'deliver',
      purpose: 'Deliver the requested resource immediately',
      timingLabel: 'Send immediately',
      promptInstructions:
        'Deliver what they asked for right away — lead with the link or attachment so ' +
        'they get it in the first line. Briefly restate what it is and the one outcome it ' +
        'helps them reach. Keep it clean and fast; the only job of this email is a smooth ' +
        'hand-off. Use the brand context for the resource and voice — do not invent ' +
        'company names, numbers, or quotes.',
    },
    {
      key: 'consume-nudge',
      purpose: 'Nudge them to actually use the resource',
      timingLabel: 'Send day 1',
      promptInstructions:
        'Nudge them to actually open and use the resource. Point to the most valuable ' +
        'part or the first step to take, and frame the quick win they get by acting now. ' +
        'Helpful and encouraging, not naggy. Stay within the brand facts — no fabricated ' +
        'stats or testimonials.',
    },
    {
      key: 'related-proof',
      purpose: 'Connect the resource to real outcomes with honest proof',
      timingLabel: 'Send day 3',
      promptInstructions:
        'Bridge from the free resource to how the paid offer helps people go further. ' +
        'Use honest, general social proof from the brand context (outcomes, testimonials) ' +
        'to show it works — never invent company names, metrics, or quoted results. Build ' +
        'trust and curiosity without hard-selling yet.',
    },
    {
      key: 'offer',
      purpose: 'Make a soft, relevant offer tied to the resource',
      timingLabel: 'Send day 5',
      promptInstructions:
        'Make a clear but soft offer that is the natural next step after the resource. ' +
        'Restate the value in a line, connect it back to the problem the magnet addressed, ' +
        'and give one obvious action to take. Confident and low-pressure. No claims beyond ' +
        'the brand facts.',
    },
  ],
};

/**
 * Waitlist warm-keeper sequence — keep a waitlisted audience warm and excited
 * until launch (waitlist). Three emails: you're in → update/story → early-access
 * offer. Timing labels are static, with the last pinned to launch.
 */
export const WAITLIST_WARM_KEEPER_SEQUENCE: SequenceDef = {
  archetype: 'waitlist-warm-keeper',
  emails: [
    {
      key: 'youre-in',
      purpose: 'Confirm their spot and set expectations',
      timingLabel: 'Send immediately',
      promptInstructions:
        'Confirm warmly that they are on the list and their spot is saved. Set ' +
        'expectations for what happens next and roughly when they will hear more, and ' +
        'build a little anticipation for what is coming. Use the brand context for what ' +
        'the offer is — do not invent launch dates, numbers, or quotes that are not given.',
    },
    {
      key: 'update-story',
      purpose: 'Keep them warm with a genuine update or story',
      timingLabel: 'Send day 7',
      promptInstructions:
        'Keep the list warm with a genuine update or short story — progress toward ' +
        'launch, the reason behind the offer, or a glimpse of what they will get. Draw on ' +
        'the brand context and keep it honest; do not fabricate milestones, metrics, or ' +
        'testimonials. Make them feel like an insider who made a smart move getting in early.',
    },
    {
      key: 'early-access-offer',
      purpose: 'Give waitlisters a real early-access reason to act at launch',
      timingLabel: 'Send at launch',
      promptInstructions:
        'Announce that it is live and give the waitlist a genuine early-access reason to ' +
        'act now — first access, or the perk you promised them for waiting. Restate the ' +
        'core value briefly and give one clear action. Only reference perks and details ' +
        'present in the brand context; do not invent discounts, numbers, or quotes.',
    },
  ],
};

/**
 * Welcome series sequence — onboard a new subscriber or enrollee and warm them
 * toward the offer (subscribe-newsletter, enroll). Three emails: welcome +
 * expectations → best content/story → soft offer. Timing labels are static.
 */
export const WELCOME_SERIES_SEQUENCE: SequenceDef = {
  archetype: 'welcome-series',
  emails: [
    {
      key: 'welcome-expectations',
      purpose: 'Welcome them and set expectations for what they will get',
      timingLabel: 'Send immediately',
      promptInstructions:
        'Warmly welcome them and make them feel they made a good decision. Set clear ' +
        'expectations for what they will receive, how often, and the value it brings. Use ' +
        'the brand context for voice and what the offering is about — do not invent company ' +
        'names, numbers, or quotes. Friendly, human, and easy to read.',
    },
    {
      key: 'best-content-story',
      purpose: 'Deliver the best content or story to build the relationship',
      timingLabel: 'Send day 2',
      promptInstructions:
        'Share the most valuable thing you have — your best insight, resource, or a short ' +
        'genuine story that shows what you are about. The goal is a real win that deepens ' +
        'trust. Draw on the brand context and keep it honest; no fabricated stats or ' +
        'testimonials. Give before you ask.',
    },
    {
      key: 'soft-offer',
      purpose: 'Make a soft, relevant offer once trust is established',
      timingLabel: 'Send day 5',
      promptInstructions:
        'Now that trust is building, make a soft, relevant offer. Restate the value in a ' +
        'line, tie it to what they came for, and give one clear low-pressure action. ' +
        'Confident and warm, never pushy. Stay within the brand facts — no invented claims, ' +
        'numbers, or quotes.',
    },
  ],
};

/**
 * EXHAUSTIVE intent → plan map. Typed as `Record<GoalIntent, SequencePlan>` so
 * the compiler rejects the file if any of the 18 frozen intents is missing.
 *
 * Phase 6 state:
 *   - Show-up (book-call, request-demo, book-me, rsvp) → available.
 *   - Follow-up nurture (enquiry, request-quote, apply) → available.
 *   - Lead-magnet delivery (lead-magnet) → available.
 *   - Waitlist warm-keeper (waitlist) → available.
 *   - Welcome series (subscribe-newsletter, enroll) → available.
 *   - No-email intents (follow-social, buy-via-link, order-via-platform,
 *     pay-via-link, download-app) → skipped.
 *   - Activation (signup-free, free-trial) → deferred (spec; not built).
 */
const INTENT_PLAN: Record<GoalIntent, SequencePlan> = {
  // Show-up archetype — LIVE.
  'book-call': { status: 'available', def: SHOW_UP_SEQUENCE },
  'request-demo': { status: 'available', def: SHOW_UP_SEQUENCE },
  'book-me': { status: 'available', def: SHOW_UP_SEQUENCE },
  'rsvp': { status: 'available', def: SHOW_UP_SEQUENCE },

  // Follow-up nurture archetype — LIVE (phase 6).
  'enquiry': { status: 'available', def: FOLLOW_UP_NURTURE_SEQUENCE },
  'request-quote': { status: 'available', def: FOLLOW_UP_NURTURE_SEQUENCE },
  'apply': { status: 'available', def: FOLLOW_UP_NURTURE_SEQUENCE },

  // Lead-magnet delivery archetype — LIVE (phase 6).
  'lead-magnet': { status: 'available', def: LEAD_MAGNET_DELIVERY_SEQUENCE },

  // Waitlist warm-keeper archetype — LIVE (phase 6).
  'waitlist': { status: 'available', def: WAITLIST_WARM_KEEPER_SEQUENCE },

  // Welcome series archetype — LIVE (phase 6).
  'subscribe-newsletter': { status: 'available', def: WELCOME_SERIES_SEQUENCE },
  'enroll': { status: 'available', def: WELCOME_SERIES_SEQUENCE },

  // Genuinely no useful email sequence for these goals.
  'follow-social': { status: 'skipped' },
  'buy-via-link': { status: 'skipped' },
  'order-via-platform': { status: 'skipped' },
  'pay-via-link': { status: 'skipped' },
  'download-app': { status: 'skipped' },

  // Activation archetype — stays deferred (spec; not built).
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
