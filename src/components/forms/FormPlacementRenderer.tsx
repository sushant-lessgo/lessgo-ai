'use client';

import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { FormRenderer } from './FormRenderer';
import { InlineFormInput } from './InlineFormInput';
import type { MVPForm } from '@/types/core/forms';
import {
  determineFormPlacement,
  shouldRenderInline,
  shouldRenderFullForm,
} from '@/utils/formPlacement';
import { getSectionType } from '@/utils/sectionHelpers';

interface FormPlacementRendererProps {
  sectionId: string;
  className?: string;
  userId?: string;
  publishedPageId?: string;
  pageSlug?: string; // For analytics tracking
  colorTokens?: any; // Color tokens for styling
}

/**
 * FormPlacementRenderer - Intelligently renders forms based on placement logic
 *
 * New behavior:
 * - Single-field forms: Render inline (InlineFormInput) in hero AND primary CTA sections
 * - Multi-field forms: Render full form only in primary CTA section
 * - Modal forms: Skip (handled by button component)
 */
export function FormPlacementRenderer({
  sectionId,
  className,
  userId,
  publishedPageId,
  pageSlug,
  colorTokens,
}: FormPlacementRendererProps) {
  const { content, getAllForms, sections } = useEditStore();

  // Get all forms and current section
  const allForms = getAllForms();
  const section = content[sectionId];

  if (!section?.elements) {
    return null;
  }

  // Track forms to render (avoid duplicates)
  const renderedFormIds = new Set<string>();
  const formsToRender: Array<{
    form: MVPForm;
    placement: ReturnType<typeof determineFormPlacement>;
    buttonElement: any;
  }> = [];

  // Scan section elements for form-connected buttons
  Object.entries(section.elements).forEach(([elementKey, element]: [string, any]) => {
    const buttonConfig = element.metadata?.buttonConfig;

    if (
      buttonConfig?.type === 'form' &&
      buttonConfig?.formId &&
      !renderedFormIds.has(buttonConfig.formId)
    ) {
      const form = allForms.find((f: MVPForm) => f.id === buttonConfig.formId);

      if (form) {
        // Determine placement based on new logic
        const ctaType = buttonConfig.ctaType || 'primary'; // Default to primary if not set
        const placement = determineFormPlacement(
          form,
          ctaType,
          sectionId,
          sections,
          buttonConfig.behavior
        );

        formsToRender.push({
          form,
          placement,
          buttonElement: element,
        });

        renderedFormIds.add(form.id);
      }
    }
  });

  if (formsToRender.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {formsToRender.map(({ form, placement, buttonElement }) => {
        // SKIP inline forms - they're rendered by FormConnectedButton in the UIBlock
        // This prevents duplicate rendering of inline forms

        // Check if we should render full form in this section
        if (shouldRenderFullForm(placement, sectionId)) {
          return (
            <div
              key={form.id}
              id={`form-${form.id}`}
              data-has-email-form={form.fields.some((f) => f.type === 'email')}
              className="mb-8"
            >
              <FormRenderer
                form={form}
                userId={userId}
                publishedPageId={publishedPageId}
                pageSlug={pageSlug}
                sectionId={sectionId}
                colorTokens={colorTokens}
                mode="inline"
              />
            </div>
          );
        }

        // Modal forms: skip (rendered by FormConnectedButton component)
        // Inline forms: skip (rendered by FormConnectedButton in button position)
        return null;
      })}
    </div>
  );
}