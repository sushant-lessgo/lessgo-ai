'use client';

// WorkContact — EDIT wrapper. Layout in WorkContact.core.tsx. When
// contact_method === 'form', builds a non-functional PREVIEW form (fields from
// content.forms[form_ref] when present, else DEFAULT_WORK_LEAD_FIELDS); on the
// published page it becomes a real <form data-lessgo-form> wired to form.v1.js.
// For whatsapp/booking/call the core renders a CTA link instead (no formNode).

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkContactCore, type WorkContactContent } from './WorkContact.core';
import { renderWorkLeadField, DEFAULT_WORK_LEAD_FIELDS, WORK_LEAD_SUBMIT_TEXT } from './leadFormMarkup';
import type { MVPFormField } from '@/types/core/forms';

export default function WorkContact({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkContactContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);

  const formRef = (blockContent as any).form_ref || '';
  const form = useEditStore((s) => (formRef ? (s as any).forms?.[formRef] : undefined));
  const fields: MVPFormField[] =
    Array.isArray(form?.fields) && form.fields.length ? form.fields : DEFAULT_WORK_LEAD_FIELDS;

  const formNode = (
    <form className="wk-contact-form" onSubmit={(e) => e.preventDefault()} aria-label="Project enquiry">
      {fields.map((f) => renderWorkLeadField(f, formRef))}
      <span className="wk-contact-submit">{form?.submitButtonText || WORK_LEAD_SUBMIT_TEXT}</span>
      <p className="wk-contact-form__note">Replies within one working day. Nothing is booked until you approve the quote.</p>
    </form>
  );

  return (
    <WorkEditProvider ctx={ctx}>
      <WorkContactCore content={blockContent} E={editPrimitives} sectionId={sectionId} formNode={formNode} />
    </WorkEditProvider>
  );
}
