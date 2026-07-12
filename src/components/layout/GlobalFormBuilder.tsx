'use client';

import { useShallow } from 'zustand/react/shallow';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { useEditStore } from '@/hooks/useEditStore';

export function GlobalFormBuilder() {
  const { formBuilderOpen, editingFormId, hideFormBuilder } = useEditStore(
    useShallow((s) => ({
      formBuilderOpen: s.formBuilderOpen,
      editingFormId: s.editingFormId,
      hideFormBuilder: s.hideFormBuilder,
    })),
  );

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