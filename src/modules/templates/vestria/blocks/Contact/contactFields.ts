// Single source of truth for the Vestria quote-request form's fields. Consumed by
// the lead-form provisioning (generation path — seeds content.forms) AND by both
// Contact block renderers (edit preview / published fallback). Explicit readable
// ids → readable dashboard columns. form.v1.js builds the payload from input
// `name=field.id` via FormData, so these ids ARE the submission keys.
//
// MVP form types only (text/email/tel/textarea/select) — the mock's interest
// checkboxes become a select (checkboxgroup is not an MVPFormFieldType).

import type { MVPFormField } from '@/types/core/forms';

export const DEFAULT_VESTRIA_LEAD_FIELDS: MVPFormField[] = [
  { id: 'name',     type: 'text',     label: 'Full name',              placeholder: 'Your name',       required: true },
  { id: 'company',  type: 'text',     label: 'Company / organisation', placeholder: 'Company',         required: true },
  { id: 'email',    type: 'email',    label: 'Work email',             placeholder: 'you@company.com', required: true },
  { id: 'phone',    type: 'tel',      label: 'Phone / WhatsApp',       placeholder: '+…',              required: false },
  { id: 'industry', type: 'select',   label: 'Industry',               placeholder: 'Select…',         required: false,
    options: ['Hospitality', 'Healthcare', 'Corporate', 'Aviation', 'Education', 'Industrial & Safety', 'Other'] },
  { id: 'quantity', type: 'select',   label: 'Estimated quantity',     placeholder: 'Select…',         required: false,
    options: ['50 – 200', '200 – 500', '500 – 2,000', '2,000+'] },
  { id: 'message',  type: 'textarea', label: 'Anything else? (optional)', placeholder: 'Roll-out dates, branding needs, sizing notes…', required: false },
];

export const VESTRIA_LEAD_SUBMIT_TEXT = 'Send request';
export const VESTRIA_LEAD_SUCCESS_MESSAGE = 'Request received — a member of our team will be in touch within one business day.';
