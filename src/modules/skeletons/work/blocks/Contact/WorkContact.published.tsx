// WorkContact — PUBLISHED wrapper (server-safe). Layout in WorkContact.core.tsx.
// When contact_method === 'form', emits a real <form data-lessgo-form …> wired to
// form.v1.js → /api/forms/submit → FormSubmission. For whatsapp/booking/call the
// core renders a CTA link (no formNode). Mirrors AtelierContact.published.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkContactCore, type WorkContactContent } from './WorkContact.core';
import { renderWorkLeadField, DEFAULT_WORK_LEAD_FIELDS, WORK_LEAD_SUBMIT_TEXT, WORK_LEAD_SUCCESS_MESSAGE } from './leadFormMarkup';
import type { MVPFormField } from '@/types/core/forms';

interface Props extends WorkContactContent {
  sectionId: string;
  content?: any;
  publishedPageId?: string;
  pageOwnerId?: string;
}

export default function WorkContactPublished(props: Props) {
  const E = makePublishedPrimitives();
  const formRef = props.form_ref || '';
  const form = formRef ? props.content?.forms?.[formRef] : undefined;
  const fields: MVPFormField[] =
    Array.isArray(form?.fields) && form.fields.length ? form.fields : DEFAULT_WORK_LEAD_FIELDS;

  const formNode = (
    <form
      className="wk-contact-form"
      data-lessgo-form
      data-form-id={formRef}
      data-page-id={props.publishedPageId}
      data-success-message={form?.successMessage || WORK_LEAD_SUCCESS_MESSAGE}
      aria-label="Project enquiry"
    >
      {fields.map((f) => renderWorkLeadField(f, formRef))}
      <button type="submit" className="wk-contact-submit">{form?.submitButtonText || WORK_LEAD_SUBMIT_TEXT}</button>
      <p className="wk-contact-form__note">Replies within one working day. Nothing is booked until you approve the quote.</p>
    </form>
  );

  return <WorkContactCore content={props} E={E} sectionId={props.sectionId} formNode={formNode} />;
}
