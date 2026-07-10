'use client';

// Shared LeadForm — EDIT twin. The form is a non-functional PREVIEW; on the
// published page LeadForm.published.tsx renders a real <form data-lessgo-form>.
// Per plan-review finding #1 the edit renderer does NOT pass a `content` prop
// (LandingPageRenderer spreads only the section's own `data`), so — like
// VestriaLeadForm.tsx — this reads the form from the store's top-level
// FormsSlice: useEditStoreLegacy().forms?.[form_id], with form_id / form_headline
// pulled from the section's own elements. Layout lives in leadFormFields so this
// is byte-parallel with the published twin.

import React from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import {
  LeadFormCore,
  renderLeadField,
  LEAD_FORM_DEFAULT_HEADLINE,
  LEAD_FORM_SUBMIT_FALLBACK,
} from './leadFormFields';
import type { MVPFormField } from '@/types/core/forms';

export default function LeadForm({ sectionId }: { sectionId: string }) {
  const section = useEditStore((s) => (s as any).content?.[sectionId]);
  const elements = (section?.elements || {}) as Record<string, any>;
  const formId = elements.form_id || '';
  const form = useEditStore((s) => (formId ? (s as any).forms?.[formId] : undefined));
  const updateElementContent = useEditStore((s) => (s as any).updateElementContent);
  const fields: MVPFormField[] = Array.isArray(form?.fields) ? form.fields : [];
  const headline = elements.form_headline || LEAD_FORM_DEFAULT_HEADLINE;

  const onHeadingBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const value = (e.currentTarget.textContent || '').trim();
    if (value !== headline && typeof updateElementContent === 'function') {
      updateElementContent(sectionId, 'form_headline', value);
    }
  };

  const formNode = (
    <form className="lg-lead__form" onSubmit={(e) => e.preventDefault()}>
      {fields.map((f) => renderLeadField(f, formId))}
      <div className="lg-lead__foot">
        <span className="lg-lead__btn">{form?.submitButtonText || LEAD_FORM_SUBMIT_FALLBACK}</span>
      </div>
    </form>
  );

  const headingSlot = (
    <h2
      className="lg-lead__h"
      contentEditable
      suppressContentEditableWarning
      onBlur={onHeadingBlur}
    >
      {headline}
    </h2>
  );

  return <LeadFormCore headingSlot={headingSlot} formNode={formNode} />;
}
