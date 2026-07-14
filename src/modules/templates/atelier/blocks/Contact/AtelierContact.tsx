'use client';

// Atelier Contact — EDIT wrapper. Layout lives in AtelierContact.core.tsx. The
// form here is a non-functional PREVIEW (fields from content.forms[form_id] when
// present, else DEFAULT_ATELIER_LEAD_FIELDS); on the published page it becomes a
// real <form data-lessgo-form> wired to form.v1.js → /api/forms/submit.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierContactCore, type AtelierContactContent } from './AtelierContact.core';
import { renderAtelierLeadField } from './leadFormMarkup';
import { DEFAULT_ATELIER_LEAD_FIELDS, ATELIER_LEAD_SUBMIT_TEXT } from './contactFields';
import type { MVPFormField } from '@/types/core/forms';

export default function AtelierContact({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierContactContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);

  const formId = (blockContent as any).form_id || '';
  const form = useEditStore((s) => (formId ? (s as any).forms?.[formId] : undefined));
  const fields: MVPFormField[] =
    Array.isArray(form?.fields) && form.fields.length ? form.fields : DEFAULT_ATELIER_LEAD_FIELDS;

  const formNode = (
    <form className="lg-atelier-form" onSubmit={(e) => e.preventDefault()} aria-label="Project enquiry">
      {fields.map((f) => renderAtelierLeadField(f, formId))}
      <span className="lg-atelier-btn lg-atelier-fill lg-atelier-lg">{form?.submitButtonText || ATELIER_LEAD_SUBMIT_TEXT}</span>
      <p className="lg-atelier-form__note">Replies within one working day. Nothing is booked until you approve the quote.</p>
    </form>
  );

  return (
    <AtelierEditProvider ctx={ctx}>
      <AtelierContactCore content={blockContent} E={editPrimitives} formNode={formNode} />
    </AtelierEditProvider>
  );
}
