// Vestria Lead Form — PUBLISHED wrapper (server-safe). Layout in
// VestriaLeadForm.core.tsx. Emits a real <form data-lessgo-form …> wired to
// form.v1.js → /api/forms/submit → FormSubmission (dashboard). form.v1.js loads
// only when content.forms is non-empty and replaces the form with its own
// success UI on submit. Mirrors TechPremiumContact.published.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaLeadFormCore, type VestriaLeadFormContent } from './VestriaLeadForm.core';
import { renderVestriaLeadField } from './leadFormMarkup';
import { DEFAULT_VESTRIA_LEAD_FIELDS, VESTRIA_LEAD_SUBMIT_TEXT, VESTRIA_LEAD_SUCCESS_MESSAGE } from './contactFields';
import type { MVPFormField } from '@/types/core/forms';

interface Props extends VestriaLeadFormContent {
  sectionId: string;
  content?: any;
  publishedPageId?: string;
  pageOwnerId?: string;
}

export default function VestriaLeadFormPublished(props: Props) {
  const E = makePublishedPrimitives();
  const formId = props.form_id || '';
  const form = formId ? props.content?.forms?.[formId] : undefined;
  const fields: MVPFormField[] =
    Array.isArray(form?.fields) && form.fields.length ? form.fields : DEFAULT_VESTRIA_LEAD_FIELDS;

  const formNode = (
    <form
      className="vs-form"
      data-lessgo-form
      data-form-id={formId}
      data-page-id={props.publishedPageId}
      data-success-message={form?.successMessage || VESTRIA_LEAD_SUCCESS_MESSAGE}
    >
      {fields.map((f) => renderVestriaLeadField(f, formId))}
      <div className="vs-form__foot">
        <button type="submit" className="vs-btn vs-accent">{form?.submitButtonText || VESTRIA_LEAD_SUBMIT_TEXT} <span className="vs-arw">→</span></button>
        {props.form_note && <p className="vs-form__note">{props.form_note}</p>}
      </div>
    </form>
  );

  return <VestriaLeadFormCore content={props} E={E} formNode={formNode} />;
}
