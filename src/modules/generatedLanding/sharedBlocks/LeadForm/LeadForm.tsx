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
import { getEffectiveElementValue } from '@/lib/i18n/localeContent';
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
  // i18n-phase-1 (3b): resolve the editable heading through the shared helper,
  // keyed on the active locale. Narrow selectors (activeLocale + this section's
  // overlay slice only). Legacy store ⇒ overlay undefined ⇒ base value.
  // `form_id`, `form.fields`, submit text = form-slice/structure = locale-shared.
  const activeLocale = useEditStore((s) => (s as any).activeLocale as string | undefined);
  const sectionOverlay = useEditStore(
    (s) => (s as any).localeContent?.[(s as any).activeLocale]?.[sectionId],
  );
  const headline =
    (getEffectiveElementValue(
      { [sectionId]: section } as any,
      activeLocale ? { [activeLocale]: { [sectionId]: sectionOverlay || {} } } : undefined,
      activeLocale,
      sectionId,
      'form_headline',
    ) as string) || LEAD_FORM_DEFAULT_HEADLINE;

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
