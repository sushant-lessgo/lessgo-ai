// Single source of truth for the naayom Contact form's fields (Phase 4c).
// Consumed by ensureContactForm (pageActions.ts — seeds content.forms) AND by both
// Contact block renderers (edit fallback / published fallback). Explicit readable
// ids → readable dashboard columns. form.v1.js builds the payload from input
// `name=field.id` via FormData, so these ids ARE the submission keys.

import type { MVPFormField } from '@/types/core/forms';

// Matches naayom.com's contact (Google) form: Name, Email, Phone, Query — all required.
export const DEFAULT_CONTACT_FIELDS: MVPFormField[] = [
  { id: 'name',  type: 'text',     label: 'Name',  placeholder: 'Your name',       required: true },
  { id: 'email', type: 'email',    label: 'Email', placeholder: 'you@company.com', required: true },
  { id: 'phone', type: 'tel',      label: 'Phone', placeholder: '+91 …',           required: true },
  { id: 'query', type: 'textarea', label: 'Query', placeholder: 'How can we help?', required: true },
];

export const CONTACT_SUBMIT_TEXT = 'Send message';
export const CONTACT_SUCCESS_MESSAGE = 'Thanks — we’ll get back to you within one business day.';
