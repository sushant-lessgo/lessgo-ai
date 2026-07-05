// Shared lead-form FIELD markup (plain module — no 'use client', no hooks).
// Used by the edit wrapper (inert preview) and the published wrapper (real
// <form data-lessgo-form>) so both render identical field DOM/CSS.

import React from 'react';
import type { MVPFormField } from '@/types/core/forms';

export function renderVestriaLeadField(f: MVPFormField, formId: string) {
  const fid = `${formId || 'lead'}-${f.id}`;
  return (
    <div key={f.id} className="vs-fld">
      <label htmlFor={fid}>{f.label}{f.required && <span className="vs-req">*</span>}</label>
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
