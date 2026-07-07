// src/modules/goals/vocabulary.ts
// FROZEN goal vocabulary — coder-maintained (scalePlan §11.2). The 18 intents ×
// 5 mechanisms below are the closed set every downstream reader (Brief, wizard,
// serve gate, copy prompts, CTA machinery) keys on. Adding/renaming an entry is
// a deliberate vocabulary change, not a feature tweak.
//
// IMPORTANT: today's legacy goal enums (e.g. `serviceGoals` in src/types/service.ts,
// product goal strings routed through generation) are INTENTIONALLY untouched.
// Renames here (`demo`→`request-demo`, `signup`→`signup-free`, `download`→
// `download-app`, `buy`→`buy-via-link`) are NEW vocabulary only; migration of the
// legacy enums is out of scope (scalePlan §6 wiring lands in spec 02+).

/**
 * ===== MECHANISMS (M1–M5) =====
 * The finite CTA machinery (scalePlan §6). What the primary button actually does.
 */
export const goalMechanisms = ['M1', 'M2', 'M3', 'M4', 'M5'] as const;
export type GoalMechanism = (typeof goalMechanisms)[number];

export const goalMechanismMeta: Record<GoalMechanism, { label: string; description: string }> = {
  M1: {
    label: 'On-site form',
    description: 'Collect fields → FormSubmission + lead email',
  },
  M2: {
    label: 'Direct channel',
    description: 'WhatsApp deep-link / tel: / mailto:',
  },
  M3: {
    label: 'Redirect out',
    description: 'External URL: store badge, Amazon, Razorpay, Calendly, aggregator',
  },
  M4: {
    label: 'Subscribe / follow',
    description: 'Newsletter form or social profile links',
  },
  M5: {
    label: 'Scroll / anchor',
    description: 'Secondary / wayfinding only',
  },
};

/**
 * ===== INTENTS (18) =====
 * What the visitor commits to (scalePlan §6 table). Kebab-case, closed set.
 * Includes place intents now (`order-via-platform`, §11.8) and `buy-via-link`
 * (D16 rename — implied on-site purchase was wrong).
 */
export const goalIntents = [
  // Lead capture
  'enquiry',
  'request-quote',
  'book-call',
  'request-demo',
  'book-me',
  'enroll',
  'apply',
  'lead-magnet',
  'waitlist',
  // Product-led
  'signup-free',
  'free-trial',
  // Redirect commerce (D2: always delegated)
  'download-app',
  'buy-via-link',
  'order-via-platform',
  'pay-via-link',
  // Audience building
  'subscribe-newsletter',
  'follow-social',
  // Event
  'rsvp',
] as const;
export type GoalIntent = (typeof goalIntents)[number];

/**
 * Allowed mechanisms per intent (scalePlan §6 table, order preserved).
 * First mechanism listed = the table's primary.
 */
export const goalIntentMeta: Record<GoalIntent, { label: string; mechanisms: GoalMechanism[] }> = {
  'enquiry': { label: 'General enquiry', mechanisms: ['M1', 'M2'] },
  'request-quote': { label: 'Request a quote', mechanisms: ['M1', 'M2'] },
  'book-call': { label: 'Book a call / consultation', mechanisms: ['M1', 'M3', 'M2'] },
  'request-demo': { label: 'Request a demo', mechanisms: ['M1', 'M3'] },
  'book-me': { label: 'Book me / hire for event', mechanisms: ['M1', 'M2'] },
  'enroll': { label: 'Enroll / register', mechanisms: ['M1', 'M3'] },
  'apply': { label: 'Apply', mechanisms: ['M1'] },
  'lead-magnet': { label: 'Get the lead magnet', mechanisms: ['M1'] },
  'waitlist': { label: 'Join the waitlist', mechanisms: ['M1'] },
  'signup-free': { label: 'Sign up free', mechanisms: ['M3'] },
  'free-trial': { label: 'Start free trial', mechanisms: ['M3'] },
  'download-app': { label: 'Download the app', mechanisms: ['M3'] },
  'buy-via-link': { label: 'Buy via link', mechanisms: ['M3'] },
  'order-via-platform': { label: 'Order / reserve via platform', mechanisms: ['M3'] },
  'pay-via-link': { label: 'Pay / donate via link', mechanisms: ['M3'] },
  'subscribe-newsletter': { label: 'Subscribe to newsletter', mechanisms: ['M4'] },
  'follow-social': { label: 'Follow on social', mechanisms: ['M4'] },
  'rsvp': { label: 'RSVP / attend', mechanisms: ['M1', 'M3'] },
};
