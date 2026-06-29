// Plain, server-safe shared defaults for the Lumen enquiry form (no 'use client',
// no React). Imported by BOTH the seed (src/hooks/editStore/lumenSeed.ts, which
// builds content.forms[formId].fields) AND LumenContactForm.published.tsx (the
// fallback when the form lookup is empty) so the two never drift. Field ids
// (name/email/message) match the input `name=` attributes the published block
// renders → /api/forms/submit maps them correctly.

import type { MVPFormField } from '@/types/core/forms';

export const DEFAULT_CONTACT_FIELDS: MVPFormField[] = [
  { id: 'name', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
  { id: 'email', type: 'email', label: 'Email', placeholder: 'you@company.com', required: true },
  { id: 'message', type: 'textarea', label: 'Message', placeholder: '', required: true },
];

export const CONTACT_SUBMIT_TEXT = 'Send enquiry';
