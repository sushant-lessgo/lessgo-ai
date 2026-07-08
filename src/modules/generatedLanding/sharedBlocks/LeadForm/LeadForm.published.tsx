// Shared LeadForm — PUBLISHED twin (server-safe, no hooks). Emits a real
// <form data-lessgo-form …> wired to form.v1.js → /api/forms/submit →
// FormSubmission (+ lead email). form.v1.js embeds automatically when
// content.forms is non-empty (the M1 seed guarantees that) and reads EXACTLY
// these dataset keys: data-form-id→formId, data-page-id→pageId,
// data-owner-id→ownerId, data-success-message→successMessage. Contract matches
// VestriaLeadForm.published.tsx. Renders the seeded fields from
// content.forms[form_id]. Layout lives in leadFormFields.LeadFormCore so this is
// byte-parallel with the edit twin.

import React from 'react';
import {
  LeadFormCore,
  renderLeadField,
  LEAD_FORM_DEFAULT_HEADLINE,
  LEAD_FORM_SUBMIT_FALLBACK,
  LEAD_FORM_SUCCESS_FALLBACK,
} from './leadFormFields';
import type { MVPFormField } from '@/types/core/forms';

interface Props {
  sectionId: string;
  content?: any;
  publishedPageId?: string;
  pageOwnerId?: string;
  form_id?: string;
  form_headline?: string;
  [key: string]: any;
}

export default function LeadFormPublished(props: Props) {
  const formId = props.form_id || '';
  const form = formId ? props.content?.forms?.[formId] : undefined;
  const fields: MVPFormField[] = Array.isArray(form?.fields) ? form.fields : [];
  const headline = props.form_headline || LEAD_FORM_DEFAULT_HEADLINE;

  const formNode = (
    <form
      className="lg-lead__form"
      data-lessgo-form
      data-form-id={formId}
      data-page-id={props.publishedPageId}
      data-owner-id={props.pageOwnerId}
      data-success-message={form?.successMessage || LEAD_FORM_SUCCESS_FALLBACK}
    >
      {fields.map((f) => renderLeadField(f, formId))}
      <div className="lg-lead__foot">
        <button type="submit" className="lg-lead__btn">
          {form?.submitButtonText || LEAD_FORM_SUBMIT_FALLBACK}
        </button>
      </div>
    </form>
  );

  const headingSlot = <h2 className="lg-lead__h">{headline}</h2>;

  return <LeadFormCore headingSlot={headingSlot} formNode={formNode} />;
}
