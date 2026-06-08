// src/modules/audience/service/formTemplates.ts
// Goal-driven default form templates for the service route (Phase 8).
//
// Template-only: these return ready-to-use MVPForm shapes (minus the
// system-managed id/createdAt/updatedAt). They are applied **manually** in the
// editor via the FormBuilder "start from a template" picker (the only wired
// consumer). First-edit-load auto-seed is intentionally NOT implemented in
// Phase 8 — the edit store's onboardingData slice is product-shaped and doesn't
// carry the service `goal`, so seeding from the goal would need the frozen
// loadDraft path. Auto-seed is deferred to Phase 11 (edit-surface polish).
//
// No CTA buttonConfig wiring and no onboarding-side injection happen here; the
// lead-magnet asset URL is added by the founder in the editor.

import type { MVPForm, MVPFormField } from '@/types/core/forms';
import type { ServiceGoal } from '@/types/service';

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

const BOOK_CALL_TEMPLATE: ServiceFormTemplate = {
  name: 'Book a call',
  submitButtonText: 'Book a call',
  successMessage: "Thanks — we'll be in touch shortly to set up your call.",
  fields: [
    field('name', 'text', 'Your name', true, { placeholder: 'Jane Doe' }),
    field('email', 'email', 'Email', true, { placeholder: 'you@company.com' }),
    field('message', 'textarea', 'What would you like to talk about?', false, {
      placeholder: 'A sentence or two about your project',
    }),
  ],
  integrations: [],
};

const REQUEST_QUOTE_TEMPLATE: ServiceFormTemplate = {
  name: 'Request a quote',
  submitButtonText: 'Request a quote',
  successMessage: "Thanks — we'll review your details and send a scoped quote.",
  fields: [
    field('name', 'text', 'Your name', true, { placeholder: 'Jane Doe' }),
    field('email', 'email', 'Email', true, { placeholder: 'you@company.com' }),
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

const LEAD_MAGNET_TEMPLATE: ServiceFormTemplate = {
  name: 'Get the resource',
  submitButtonText: 'Get the resource',
  // Manual delivery — no auto-send exists yet (set founder expectations).
  successMessage:
    "Thanks — we'll email the resource to you shortly. Keep an eye on your inbox.",
  fields: [
    field('name', 'text', 'Your name', true, { placeholder: 'Jane Doe' }),
    field('email', 'email', 'Email', true, { placeholder: 'you@company.com' }),
  ],
  integrations: [],
};

const TEMPLATES_BY_GOAL: Partial<Record<ServiceGoal, ServiceFormTemplate>> = {
  'book-call': BOOK_CALL_TEMPLATE,
  'request-quote': REQUEST_QUOTE_TEMPLATE,
  'lead-magnet': LEAD_MAGNET_TEMPLATE,
};

/** The three goals that ship a form template in Phase 8. */
export const SERVICE_FORM_TEMPLATE_GOALS = ['book-call', 'request-quote', 'lead-magnet'] as const;

/**
 * Form template for a goal. Falls back to the book-call template for goals that
 * don't have a dedicated template (apply / download-portfolio / subscribe-newsletter).
 */
export function getServiceFormTemplate(goal: ServiceGoal | null | undefined): ServiceFormTemplate {
  if (goal && TEMPLATES_BY_GOAL[goal]) return TEMPLATES_BY_GOAL[goal]!;
  return BOOK_CALL_TEMPLATE;
}
