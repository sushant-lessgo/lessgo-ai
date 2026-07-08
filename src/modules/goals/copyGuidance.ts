// src/modules/goals/copyGuidance.ts
// scale-05 phase 3 — ONE per-intent copy-guidance table, keyed by GoalIntent,
// consumed by BOTH copy engines (product/service copyPrompt) and BOTH strategy
// prompts. Plain module (NO 'use client', no template imports) — safe to import
// anywhere, including server-only prompt builders.
//
// Each entry steers three things:
//   - cta:     the primary suggested CTA label for this intent (verbs / framing)
//   - subtext: OPTIONAL guidance for the new `cta_subtext` element — the small
//              muted line under the primary CTA. Present only where a supporting
//              term is plausible; ALWAYS conditional on the offer actually
//              stating it (the formatter appends the "do NOT invent terms" rule).
//   - emphasis: which objections/sections the copy (and strategy) should weight
//               for this goal.
//
// Legacy goal enums stay alive (design call #4) — callers reach this table via
// the reverse maps (SERVICE_GOAL_TO_INTENT / LANDING_GOAL_TO_INTENT) in
// src/modules/brief/bridge.ts. The Record<GoalIntent, …> type makes tsc enforce
// totality: every one of the 18 frozen intents must have an entry.

import { goalIntentMeta, type GoalIntent } from './vocabulary';

export interface GoalCopyGuidance {
  /** Primary suggested CTA label (or close, on-brand variant). */
  cta: string;
  /** Conditional cta_subtext guidance — only ever used if the offer states such terms. */
  subtext?: string;
  /** Objection / section emphasis for this goal (fed to copy AND strategy). */
  emphasis: string;
}

export const goalCopyGuidance: Record<GoalIntent, GoalCopyGuidance> = {
  // ── Lead capture (M1/M2) ──
  'enquiry': {
    cta: 'Send enquiry',
    emphasis:
      'address enquiry objections — for manufacturers/trade especially: MOQ, specs, lead-time and quote-turnaround; reassure it is no-obligation',
  },
  'request-quote': {
    cta: 'Request a quote',
    emphasis:
      'signal bespoke, scoped pricing (not a fixed tag); address "how much will this cost" and turnaround objections',
  },
  'book-call': {
    cta: 'Book a call',
    subtext: 'call length + no-obligation framing (e.g. "20-min call, no pressure")',
    emphasis: 'reduce call friction — length, agenda, no hard-sell; warm, low-pressure',
  },
  'request-demo': {
    cta: 'Book a demo',
    emphasis:
      'higher-consideration / B2B — address "is this right for my team/stack" and implementation objections',
  },
  'book-me': {
    cta: 'Check availability',
    emphasis: 'surface availability/dates, event fit, and exactly what is included',
  },
  'enroll': {
    cta: 'Enroll now',
    emphasis: 'address prerequisites, schedule/format, and the outcomes of the program',
  },
  'apply': {
    cta: 'Apply now',
    emphasis: 'clarify eligibility, selection criteria, and what happens after applying',
  },
  'lead-magnet': {
    cta: 'Get the guide',
    subtext: 'free / instant-access framing (e.g. "Free — instant download")',
    emphasis:
      'make the resource\'s value obvious; this is a low-commitment grab, NOT a sales call',
  },
  'waitlist': {
    cta: 'Join the waitlist',
    subtext: 'reassurance framing (e.g. "No spam — one email at launch")',
    emphasis: 'signal earliness/scarcity; address "when does it launch" and "why join now"',
  },
  // ── Product-led (M3) ──
  'signup-free': {
    cta: 'Sign up free',
    subtext: 'free-plan framing (e.g. "Free forever plan")',
    emphasis: 'low friction, immediate value; address the "is it really free" objection',
  },
  'free-trial': {
    cta: 'Start free trial',
    subtext: 'trial terms (e.g. "7 days free, no credit card required")',
    emphasis:
      'address trial-terms objections — length, whether a card is required, what happens after',
  },
  // ── Redirect commerce (M3, always delegated) ──
  'download-app': {
    cta: 'Download the app',
    subtext: 'platform availability framing (e.g. "Free on the App Store & Google Play")',
    emphasis: 'make platform availability obvious; address "is it on my device"',
  },
  'buy-via-link': {
    cta: 'Buy now',
    subtext: 'purchase reassurance (e.g. "Secure checkout", "Ships in X days")',
    emphasis: 'value-forward and confident; address price, shipping and returns objections',
  },
  // Place intents (P3 scope-out) — plain-link guidance only, no subtext.
  'order-via-platform': {
    cta: 'Order now',
    emphasis:
      'the CTA links out to the ordering platform — keep the page focused on appetite/desire, not on-site checkout',
  },
  'pay-via-link': {
    cta: 'Pay via link',
    emphasis:
      'the CTA links out to the payment/donation page — make the cause/value obvious, no on-site payment',
  },
  // ── Audience building ──
  'subscribe-newsletter': {
    cta: 'Subscribe',
    subtext: 'cadence / unsubscribe framing (e.g. "One email a week, unsubscribe anytime")',
    emphasis: 'make the newsletter\'s value and cadence clear; it is an email-capture form',
  },
  'follow-social': {
    cta: 'Follow on Instagram',
    emphasis:
      'the CTA points to the social profile — make the reason to follow (what they will get) obvious',
  },
  // ── Event (M1/M3) ──
  'rsvp': {
    cta: 'RSVP',
    subtext: 'attendance framing (e.g. "Free to attend")',
    emphasis: 'surface date, time, location/format, and why to attend',
  },
};

/**
 * Formats the per-intent guidance into the prompt block injected at the CTA
 * guidance site of both copy engines: a suggested-label line, a conditional
 * cta_subtext instruction (with the hard "do NOT invent terms" rule), and an
 * emphasis line.
 */
export function getGuidanceForIntent(intent: GoalIntent): string {
  const g = goalCopyGuidance[intent];
  const label = goalIntentMeta[intent].label;
  const lines = [
    `Goal = ${label}. Primary CTA copy: "${g.cta}" (or a close, on-brand variant).`,
  ];
  if (g.subtext) {
    lines.push(
      `cta_subtext (optional muted line under the primary CTA): ${g.subtext}. OMIT this element unless the offer EXPLICITLY states such terms — do NOT invent terms (no fabricated "no credit card", trial length, guarantees, or shipping claims).`
    );
  } else {
    lines.push(
      'cta_subtext: leave empty for this goal unless the offer explicitly states a supporting term — do NOT invent terms.'
    );
  }
  lines.push(`Emphasis: ${g.emphasis}.`);
  return lines.join('\n');
}

/** Just the emphasis line for an intent — used by the strategy prompts. */
export function getEmphasisForIntent(intent: GoalIntent): string {
  return goalCopyGuidance[intent].emphasis;
}
