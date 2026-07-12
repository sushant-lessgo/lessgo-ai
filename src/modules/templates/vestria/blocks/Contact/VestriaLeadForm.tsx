'use client';

// Vestria Lead Form — EDIT wrapper. Layout lives in VestriaLeadForm.core.tsx.
// The form here is a non-functional PREVIEW (fields from content.forms[form_id]
// when present, else DEFAULT_VESTRIA_LEAD_FIELDS); on the published page it
// becomes a real <form data-lessgo-form> wired to form.v1.js → /api/forms/submit.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaLeadFormCore, type VestriaLeadFormContent } from './VestriaLeadForm.core';
import { renderVestriaLeadField } from './leadFormMarkup';
import { DEFAULT_VESTRIA_LEAD_FIELDS, VESTRIA_LEAD_SUBMIT_TEXT } from './contactFields';
import type { MVPFormField } from '@/types/core/forms';

export default function VestriaLeadForm({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaLeadFormContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);

  const formId = blockContent.form_id || '';
  const form = useEditStore((s) => (formId ? (s as any).forms?.[formId] : undefined));
  const fields: MVPFormField[] =
    Array.isArray(form?.fields) && form.fields.length ? form.fields : DEFAULT_VESTRIA_LEAD_FIELDS;

  const formNode = (
    <form className="vs-form" onSubmit={(e) => e.preventDefault()}>
      {fields.map((f) => renderVestriaLeadField(f, formId))}
      <div className="vs-form__foot">
        <span className="vs-btn vs-accent">{form?.submitButtonText || VESTRIA_LEAD_SUBMIT_TEXT} <span className="vs-arw">→</span></span>
        <p className="vs-form__note">{blockContent.form_note || ''}</p>
      </div>
    </form>
  );

  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaLeadFormCore content={blockContent} E={editPrimitives} formNode={formNode} />
    </VestriaEditProvider>
  );
}
