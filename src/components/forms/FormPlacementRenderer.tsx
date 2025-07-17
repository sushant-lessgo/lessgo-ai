'use client';

import { useEditStore } from '@/hooks/useEditStore';
import { SimpleFormRenderer } from './SimpleFormRenderer';
import type { SimpleFormData } from '@/types/simpleForms';

interface FormPlacementRendererProps {
  placement: 'hero' | 'cta-section';
  className?: string;
}

export function FormPlacementRenderer({ placement, className }: FormPlacementRendererProps) {
  const { getFormsByPlacement } = useEditStore();
  const forms = getFormsByPlacement(placement);

  if (forms.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {forms.map((form) => (
        <div key={form.id} id={`form-${form.id}`} className="mb-8">
          <SimpleFormRenderer form={form} />
        </div>
      ))}
    </div>
  );
}