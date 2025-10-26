'use client';

import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { FormRenderer } from './FormRenderer';
import type { MVPForm } from '@/types/core/forms';

interface FormPlacementRendererProps {
  sectionId: string;
  className?: string;
  userId?: string;
  publishedPageId?: string;
  pageSlug?: string; // For analytics tracking
}

export function FormPlacementRenderer({ sectionId, className, userId, publishedPageId, pageSlug }: FormPlacementRendererProps) {
  const { content, getAllForms } = useEditStore();
  
  // Get all forms that should be rendered inline in this section
  const allForms = getAllForms();
  const section = content[sectionId];
  
  // Find forms that are linked to buttons in this section with "scrollTo" behavior
  const formsToRender: MVPForm[] = [];
  
  if (section?.elements) {
    Object.values(section.elements).forEach((element: any) => {
      if (element.metadata?.buttonConfig?.type === 'form' && 
          element.metadata?.buttonConfig?.behavior === 'scrollTo' &&
          element.metadata?.buttonConfig?.formId) {
        
        const form = allForms.find((f: MVPForm) => f.id === element.metadata.buttonConfig.formId);
        if (form && !formsToRender.find((f: MVPForm) => f.id === form.id)) {
          formsToRender.push(form);
        }
      }
    });
  }

  if (formsToRender.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {formsToRender.map((form) => (
        <div key={form.id} id={`form-${form.id}`} className="mb-8">
          <FormRenderer
            form={form}
            userId={userId}
            publishedPageId={publishedPageId}
            pageSlug={pageSlug}
            mode="inline"
          />
        </div>
      ))}
    </div>
  );
}