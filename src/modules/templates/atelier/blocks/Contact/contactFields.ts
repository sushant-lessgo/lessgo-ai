// Single source of truth for the Atelier project-enquiry form's fields. Consumed
// by the lead-form provisioning (seeds content.forms) AND by both Contact renderers
// (edit preview / published fallback). Explicit readable ids → readable dashboard
// columns; form.v1.js builds the payload from input `name=field.id`, so these ids
// ARE the submission keys. MVP form types only (text/email/tel/textarea/select).
// Mirrors the Vestria contactFields precedent.

import type { MVPFormField } from '@/types/core/forms';

export const DEFAULT_ATELIER_LEAD_FIELDS: MVPFormField[] = [
  { id: 'name',     type: 'text',     label: 'Name',            placeholder: 'Your name',        required: true },
  { id: 'email',    type: 'email',    label: 'Email',           placeholder: 'you@example.com',  required: true },
  { id: 'occasion', type: 'text',     label: 'Date / occasion', placeholder: 'Rough date, deadline or occasion', required: false },
  { id: 'brief',    type: 'textarea', label: 'Brief',           placeholder: 'What you’re making, where it will be used, and anything already decided.', required: false },
];

export const ATELIER_LEAD_SUBMIT_TEXT = 'Send brief';
export const ATELIER_LEAD_SUCCESS_MESSAGE = 'Received — you’ll hear back within one working day with a plan and a fixed quote.';
