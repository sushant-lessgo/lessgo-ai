'use client';

import { useButtonConfigModal } from '@/hooks/useButtonConfigModal';
import { ButtonConfigurationModal } from '@/components/toolbars/ButtonConfigurationModal';

export function GlobalButtonConfigModal() {
  const { isOpen, elementSelection, closeModal } = useButtonConfigModal();

  if (!isOpen || !elementSelection) {
    return null;
  }

  return (
    <ButtonConfigurationModal
      isOpen={isOpen}
      onClose={closeModal}
      elementSelection={elementSelection}
    />
  );
}