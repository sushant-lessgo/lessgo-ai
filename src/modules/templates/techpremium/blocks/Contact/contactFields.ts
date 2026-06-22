// Single source of truth for the naayom Contact form's fields (Phase 4c).
// Consumed by ensureContactForm (pageActions.ts — seeds content.forms) AND by both
// Contact block renderers (edit fallback / published fallback). Explicit readable
// ids → readable dashboard columns. form.v1.js builds the payload from input
// `name=field.id` via FormData, so these ids ARE the submission keys.

import type { MVPFormField } from '@/types/core/forms';

export const DEFAULT_CONTACT_FIELDS: MVPFormField[] = [
  { id: 'name',     type: 'text',     label: 'Name',                          placeholder: 'Your name',                 required: true },
  { id: 'farm',     type: 'text',     label: 'Farm / company',                placeholder: 'Farm name',                 required: false },
  { id: 'phone',    type: 'tel',      label: 'Phone / WhatsApp',              placeholder: '+91 …',                     required: true },
  { id: 'email',    type: 'email',    label: 'Email',                         placeholder: 'you@farm.com',              required: false },
  { id: 'crop',     type: 'select',   label: 'Mushroom type',                 required: false, options: ['Oyster', 'Button', 'Cordyceps', 'Shiitake', 'Other / mixed'] },
  { id: 'chambers', type: 'select',   label: 'Number of chambers',            required: false, options: ['1–2', '3–5', '6–12', '12+'] },
  { id: 'message',  type: 'textarea', label: 'What would you like to control?', placeholder: 'e.g. 4 cordyceps chambers, CO₂ + humidity, alerts to my phone…', required: false },
];

export const CONTACT_SUBMIT_TEXT = 'Request my demo';
export const CONTACT_SUCCESS_MESSAGE = 'Request received — we’ll be in touch within one business day.';
