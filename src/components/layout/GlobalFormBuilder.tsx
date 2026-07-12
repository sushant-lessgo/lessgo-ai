'use client';

import { FormBuilder } from '@/components/forms/FormBuilder';
import { useEditStore } from '@/hooks/useEditStore';

export function GlobalFormBuilder() {
  const { formBuilderOpen, editingFormId, hideFormBuilder } = useEditStore();

  if (!formBuilderOpen) {
    return null;
  }

  return (
    <FormBuilder
      isOpen={formBuilderOpen}
      onClose={hideFormBuilder}
      editingFormId={editingFormId}
    />
  );
}