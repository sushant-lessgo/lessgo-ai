// src/modules/audience/service/formTemplates.ts
// Goal-driven default form templates (scale-05 phase 4).
//
// Template-only: these return ready-to-use MVPForm shapes (minus the
// system-managed id/createdAt/updatedAt). They are consumed by:
//  - the editor FormBuilder "start from a template" picker (manual path), and
//  - the generation-time M1 auto-seed (`seedGoalForm`, scale-05 phase 4).
//
// scale-05 phase 4 re-keys the template map by `GoalIntent` (the frozen goal
// vocabulary) so the M1 auto-seed can look a template up straight from
// `brief.goal.intent`. The legacy `getServiceFormTemplate(goal: ServiceGoal)`
// wrapper is retained UNCHANGED for the FormBuilder call site — it maps the
// legacy ServiceGoal → GoalIntent via `SERVICE_GOAL_TO_INTENT` (bridge.ts) and
// delegates to `getFormTemplateForIntent`.
//
// No CTA buttonConfig wiring happens here (that lives in `seedGoalForm` /
// ButtonConfigurationModal); the lead-magnet asset URL is added by the founder
// in the editor.

import type { MVPForm, MVPFormField } from '@/types/core/forms';
import type { ServiceGoal } from '@/types/service';
import type { GoalIntent } from '@/modules/goals/vocabulary';
import { SERVICE_GOAL_TO_INTENT } from '@/modules/brief/bridge';

export type ServiceFormTemplate = Omit<MVPForm, 'id' | 'createdAt' | 'updatedAt'>;

// Field ids are local to the template; the form builder treats them as opaque
// keys, so stable human-readable ids are fine (and avoid Date.now() churn).
function field(
  id: string,
  type: MVPFormField['type'],
  label: string,
  required: boolean,
  extra: Partial<MVPFormField> = {}
): MVPFormField {
  return { id, type, label, required, ...extra };
}

const NAME = () => field('name', 'text', 'Your name', true, { placeholder: 'Jane Doe' });
const EMAIL = (required = true) =>
  field('email', 'email', 'Email', required, { placeholder: 'you@company.com' });

const ENQUIRY_TEMPLATE: ServiceFormTemplate = {
  name: 'Send an enquiry',
  submitButtonText: 'Send enquiry',
  successMessage: "Thanks — we'll get back to you shortly.",
  fields: [
    NAME(),
    EMAIL(),
    field('message', 'textarea', 'How can we help?', true, {
      placeholder: 'Tell us a little about what you need',
    }),
  ],
  integrations: [],
};

const REQUEST_QUOTE_TEMPLATE: ServiceFormTemplate = {
  name: 'Request a quote',
  submitButtonText: 'Request a quote',
  successMessage: "Thanks — we'll review your details and send a scoped quote.",
  fields: [
    NAME(),
    EMAIL(),
    field('budget', 'select', 'Estimated budget', false, {
      options: ['Under $5k', '$5k–$15k', '$15k–$50k', '$50k+', 'Not sure yet'],
    }),
    field('timeline', 'select', 'Ideal timeline', false, {
      options: ['ASAP', '1–3 months', '3–6 months', 'Just exploring'],
    }),
    field('scope', 'textarea', 'Project scope', true, {
      placeholder: 'What do you need done, and what does success look like?',
    }),
  ],
  integrations: [],
};

const BOOK_CALL_TEMPLATE: ServiceFormTemplate = {
  name: 'Book a call',
  submitButtonText: 'Book a call',
  successMessage: "Thanks — we'll be in touch shortly to set up your call.",
  fields: [
    NAME(),
    EMAIL(),
    field('message', 'textarea', 'What would you like to talk about?', false, {
      placeholder: 'A sentence or two about your project',
    }),
  ],
  integrations: [],
};

const REQUEST_DEMO_TEMPLATE: ServiceFormTemplate = {
  name: 'Request a demo',
  submitButtonText: 'Request a demo',
  successMessage: "Thanks — we'll reach out to schedule your demo.",
  fields: [
    NAME(),
    EMAIL(),
    field('company', 'text', 'Company', false, { placeholder: 'Acme Inc.' }),
    field('message', 'textarea', "What would you like to see?", false, {
      placeholder: 'What are you hoping the demo covers?',
    }),
  ],
  integrations: [],
};

// book-me = hire for an event. Event date + type, plus contact fields. Note:
// MVPFormFieldType has no 'date' — the event date is a plain text field.
const BOOK_ME_TEMPLATE: ServiceFormTemplate = {
  name: 'Book me for your event',
  submitButtonText: 'Check availability',
  successMessage: "Thanks — we'll confirm availability and get back to you.",
  fields: [
    NAME(),
    EMAIL(),
    field('event_date', 'text', 'Event date', true, { placeholder: 'e.g. 12 Aug 2026' }),
    field('event_type', 'select', 'Event type', true, {
      options: ['Keynote', 'Workshop', 'Panel', 'Wedding', 'Corporate', 'Other'],
    }),
    field('message', 'textarea', 'Tell us about the event', false, {
      placeholder: 'Audience, location, what you have in mind',
    }),
  ],
  integrations: [],
};

const ENROLL_TEMPLATE: ServiceFormTemplate = {
  name: 'Enroll / register',
  submitButtonText: 'Register',
  successMessage: "Thanks — you're registered. We'll send the details shortly.",
  fields: [
    NAME(),
    EMAIL(),
    field('phone', 'tel', 'Phone', false, { placeholder: '+1 555 000 0000' }),
    field('message', 'textarea', 'Anything we should know?', false, {
      placeholder: 'Optional',
    }),
  ],
  integrations: [],
};

const APPLY_TEMPLATE: ServiceFormTemplate = {
  name: 'Apply',
  submitButtonText: 'Submit application',
  successMessage: "Thanks — we've received your application and will be in touch.",
  fields: [
    NAME(),
    EMAIL(),
    field('link', 'text', 'Portfolio / LinkedIn (optional)', false, {
      placeholder: 'https://…',
    }),
    field('message', 'textarea', 'Why are you a good fit?', true, {
      placeholder: 'A few sentences about you',
    }),
  ],
  integrations: [],
};

const LEAD_MAGNET_TEMPLATE: ServiceFormTemplate = {
  name: 'Get the resource',
  submitButtonText: 'Get the resource',
  // Manual delivery — no auto-send exists yet (set founder expectations).
  successMessage:
    "Thanks — we'll email the resource to you shortly. Keep an eye on your inbox.",
  fields: [NAME(), EMAIL()],
  integrations: [],
};

const WAITLIST_TEMPLATE: ServiceFormTemplate = {
  name: 'Join the waitlist',
  submitButtonText: 'Join the waitlist',
  successMessage: "You're on the list — we'll let you know the moment we're live.",
  fields: [EMAIL(), field('name', 'text', 'Your name', false, { placeholder: 'Jane Doe' })],
  integrations: [],
};

// rsvp = attend an event. Name/email + attendee count select. (param.date is
// captured on the Brief but not rendered in this feature — spec unresolved #6.)
const RSVP_TEMPLATE: ServiceFormTemplate = {
  name: 'RSVP',
  submitButtonText: 'RSVP',
  successMessage: "Thanks — you're on the list. See you there!",
  fields: [
    NAME(),
    EMAIL(),
    field('attendees', 'select', 'How many attending?', true, {
      options: ['Just me', '2', '3', '4', '5+'],
    }),
  ],
  integrations: [],
};

// subscribe-newsletter = email capture (design call #6: M1 form, NOT the M4
// follow-strip). Email required + name optional.
const SUBSCRIBE_NEWSLETTER_TEMPLATE: ServiceFormTemplate = {
  name: 'Subscribe',
  submitButtonText: 'Subscribe',
  successMessage: "You're subscribed — thanks for joining.",
  fields: [EMAIL(), field('name', 'text', 'Your name', false, { placeholder: 'Jane Doe' })],
  integrations: [],
};

/**
 * Form template per M1 goal intent (scale-05 phase 4). Keyed by `GoalIntent`.
 * Every intent whose goal mechanism resolves to M1 (an on-site form) has an
 * entry here, plus `subscribe-newsletter` (design call #6).
 */
const TEMPLATES_BY_INTENT: Partial<Record<GoalIntent, ServiceFormTemplate>> = {
  'enquiry': ENQUIRY_TEMPLATE,
  'request-quote': REQUEST_QUOTE_TEMPLATE,
  'book-call': BOOK_CALL_TEMPLATE,
  'request-demo': REQUEST_DEMO_TEMPLATE,
  'book-me': BOOK_ME_TEMPLATE,
  'enroll': ENROLL_TEMPLATE,
  'apply': APPLY_TEMPLATE,
  'lead-magnet': LEAD_MAGNET_TEMPLATE,
  'waitlist': WAITLIST_TEMPLATE,
  'rsvp': RSVP_TEMPLATE,
  'subscribe-newsletter': SUBSCRIBE_NEWSLETTER_TEMPLATE,
};

/**
 * Form template for a goal INTENT. Falls back to the book-call template for
 * intents without a dedicated template (keeps the seed/editor robust).
 */
export function getFormTemplateForIntent(
  intent: GoalIntent | null | undefined
): ServiceFormTemplate {
  if (intent && TEMPLATES_BY_INTENT[intent]) return TEMPLATES_BY_INTENT[intent]!;
  return BOOK_CALL_TEMPLATE;
}

/** The three legacy goals that ship a form template in the FormBuilder picker. */
export const SERVICE_FORM_TEMPLATE_GOALS = ['book-call', 'request-quote', 'lead-magnet'] as const;

/**
 * LEGACY WRAPPER (unchanged call signature). Maps the legacy `ServiceGoal` to a
 * `GoalIntent` via `SERVICE_GOAL_TO_INTENT` and delegates to
 * `getFormTemplateForIntent`. Existing callers (FormBuilder) compile untouched.
 */
export function getServiceFormTemplate(goal: ServiceGoal | null | undefined): ServiceFormTemplate {
  const intent = goal ? SERVICE_GOAL_TO_INTENT[goal] : undefined;
  return getFormTemplateForIntent(intent);
}
