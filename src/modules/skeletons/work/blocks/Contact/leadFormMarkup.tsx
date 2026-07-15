// src/modules/skeletons/work/blocks/Contact/leadFormMarkup.tsx
// Shared lead-form FIELD markup + defaults (plain module — no 'use client', no
// hooks). Server-safe: used by the edit wrapper (inert preview) AND the published
// wrapper (real <form data-lessgo-form>) so both render identical field DOM/CSS.
// HARVESTED from src/modules/templates/atelier/blocks/Contact (leadFormMarkup +
// contactFields), re-styled to the work-skeleton `wk-contact-field` classes.
// Mirrors the Vestria renderVestriaLeadField precedent.

import React from 'react';
import type { MVPFormField } from '@/types/core/forms';

export function renderWorkLeadField(f: MVPFormField, formId: string) {
  const fid = `${formId || 'lead'}-${f.id}`;
  return (
    <div key={f.id} className="wk-contact-field">
      <label htmlFor={fid}>{f.label}{f.required && <span className="wk-contact-req">*</span>}</label>
      {f.type === 'textarea' ? (
        <textarea id={fid} name={f.id} placeholder={f.placeholder} required={f.required} rows={4} />
      ) : f.type === 'select' ? (
        <select id={fid} name={f.id} required={f.required} defaultValue="">
          <option value="">{f.placeholder || 'Select…'}</option>
          {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input id={fid} type={f.type} name={f.id} placeholder={f.placeholder} required={f.required} />
      )}
    </div>
  );
}

// Default project-enquiry fields (harvested from atelier contactFields). Explicit
// readable ids → readable dashboard columns; form.v1.js builds the payload from
// input `name=field.id`, so these ids ARE the submission keys.
export const DEFAULT_WORK_LEAD_FIELDS: MVPFormField[] = [
  { id: 'name',     type: 'text',     label: 'Name',            placeholder: 'Your name',        required: true },
  { id: 'email',    type: 'email',    label: 'Email',           placeholder: 'you@example.com',  required: true },
  { id: 'occasion', type: 'text',     label: 'Date / occasion', placeholder: 'Rough date, deadline or occasion', required: false },
  { id: 'brief',    type: 'textarea', label: 'Brief',           placeholder: 'What you’re making, where it will be used, and anything already decided.', required: false },
];

export const WORK_LEAD_SUBMIT_TEXT = 'Send brief';
export const WORK_LEAD_SUCCESS_MESSAGE =
  'Received — you’ll hear back within one working day with a plan and a fixed quote.';
