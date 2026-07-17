// Atelier Contact — PUBLISHED wrapper (server-safe). Layout in
// AtelierContact.core.tsx. Emits a real <form data-lessgo-form …> wired to
// form.v1.js → /api/forms/submit → FormSubmission (dashboard). form.v1.js loads
// only when content.forms is non-empty and replaces the form with its own success
// UI on submit. Mirrors VestriaLeadForm.published / TechPremiumContact.published.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { AtelierContactCore, type AtelierContactContent } from './AtelierContact.core';
import { renderAtelierLeadField } from './leadFormMarkup';
import { DEFAULT_ATELIER_LEAD_FIELDS, ATELIER_LEAD_SUBMIT_TEXT, ATELIER_LEAD_SUCCESS_MESSAGE } from './contactFields';
import type { MVPFormField } from '@/types/core/forms';

interface Props extends AtelierContactContent {
  sectionId: string;
  content?: any;
  publishedPageId?: string;
  pageOwnerId?: string;
}

export default function AtelierContactPublished(props: Props) {
  const E = makePublishedPrimitives();
  const formId = props.form_id || '';
  const form = formId ? props.content?.forms?.[formId] : undefined;
  const fields: MVPFormField[] =
    Array.isArray(form?.fields) && form.fields.length ? form.fields : DEFAULT_ATELIER_LEAD_FIELDS;

  const formNode = (
    <form
      className="lg-atelier-form"
      data-lessgo-form
      data-form-id={formId}
      data-page-id={props.publishedPageId}
      data-success-message={form?.successMessage || ATELIER_LEAD_SUCCESS_MESSAGE}
      aria-label="Project enquiry"
    >
      {fields.map((f) => renderAtelierLeadField(f, formId))}
      <button type="submit" className="lg-atelier-btn lg-atelier-fill lg-atelier-lg">{form?.submitButtonText || ATELIER_LEAD_SUBMIT_TEXT}</button>
      <p className="lg-atelier-form__note">Replies within one working day. Nothing is booked until you approve the quote.</p>
    </form>
  );

  return <AtelierContactCore content={props} E={E} formNode={formNode} />;
}
