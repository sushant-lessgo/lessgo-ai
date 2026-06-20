// Global modal manager that persists independent of toolbar state
import React, { useState, useEffect } from 'react';
import { SectionBackgroundModal } from './SectionBackgroundModal';
import { GlobalButtonConfigModal } from '@/components/layout/GlobalButtonConfigModal';
import { ProductsModal } from './ProductsModal';

// Global state for modals (outside React to persist)
let modalState = {
  backgroundModal: {
    isOpen: false,
    sectionId: null as string | null
  },
  productsModal: {
    isOpen: false,
  },
};

// Event emitter for modal state changes
const modalEvents = new EventTarget();

export function showBackgroundModal(sectionId: string) {
  modalState.backgroundModal = { isOpen: true, sectionId };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function hideBackgroundModal() {
  modalState.backgroundModal = { isOpen: false, sectionId: null };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function showProductsModal() {
  modalState.productsModal = { isOpen: true };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function hideProductsModal() {
  modalState.productsModal = { isOpen: false };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function GlobalModals() {
  const [state, setState] = useState(modalState);
  
  useEffect(() => {
    const handleStateChange = () => {
      setState({ ...modalState });
    };

    modalEvents.addEventListener('stateChange', handleStateChange);
    // Catalog block (a template module) opens the panel via a DOM event to avoid
    // importing app code across the template firewall.
    const openProducts = () => showProductsModal();
    if (typeof window !== 'undefined') window.addEventListener('lessgo:manage-products', openProducts);
    return () => {
      modalEvents.removeEventListener('stateChange', handleStateChange);
      if (typeof window !== 'undefined') window.removeEventListener('lessgo:manage-products', openProducts);
    };
  }, []);
  
  
  return (
    <>
      {state.backgroundModal.isOpen && state.backgroundModal.sectionId && (
        <SectionBackgroundModal
          isOpen={true}
          onClose={hideBackgroundModal}
          sectionId={state.backgroundModal.sectionId}
        />
      )}
      
      {state.productsModal.isOpen && (
        <ProductsModal onClose={hideProductsModal} />
      )}

      {/* Button Configuration Modal - uses global Zustand state */}
      <GlobalButtonConfigModal />
    </>
  );
}