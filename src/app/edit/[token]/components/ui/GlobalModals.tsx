// Global modal manager that persists independent of toolbar state
import React, { useState, useEffect } from 'react';
import { GlobalButtonConfigModal } from '@/components/layout/GlobalButtonConfigModal';
import { ProductsModal } from './ProductsModal';
import { SeoSettingsModal } from './SeoSettingsModal';
import { SocialProfilesPanel } from '@/components/editor/SocialProfilesPanel';

// Global state for modals (outside React to persist)
let modalState = {
  productsModal: {
    isOpen: false,
  },
  seoModal: {
    isOpen: false,
  },
  socialModal: {
    isOpen: false,
  },
};

// Event emitter for modal state changes
const modalEvents = new EventTarget();

export function showProductsModal() {
  modalState.productsModal = { isOpen: true };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function hideProductsModal() {
  modalState.productsModal = { isOpen: false };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function showSeoModal() {
  modalState.seoModal = { isOpen: true };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function hideSeoModal() {
  modalState.seoModal = { isOpen: false };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

// scale-04 (phase 6, D13): site-level social profiles panel. Opened
// programmatically or via the `lessgo:manage-social` window event (mirrors the
// firewall-safe `lessgo:manage-products` pattern so a template footer/nav block
// can request it without importing app code).
export function showSocialModal() {
  modalState.socialModal = { isOpen: true };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function hideSocialModal() {
  modalState.socialModal = { isOpen: false };
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
    const openSocial = () => showSocialModal();
    if (typeof window !== 'undefined') {
      window.addEventListener('lessgo:manage-products', openProducts);
      window.addEventListener('lessgo:manage-social', openSocial);
    }
    return () => {
      modalEvents.removeEventListener('stateChange', handleStateChange);
      if (typeof window !== 'undefined') {
        window.removeEventListener('lessgo:manage-products', openProducts);
        window.removeEventListener('lessgo:manage-social', openSocial);
      }
    };
  }, []);
  
  
  return (
    <>
      {state.productsModal.isOpen && (
        <ProductsModal onClose={hideProductsModal} />
      )}

      {state.seoModal.isOpen && (
        <SeoSettingsModal onClose={hideSeoModal} />
      )}

      <SocialProfilesPanel isVisible={state.socialModal.isOpen} onClose={hideSocialModal} />


      {/* Button Configuration Modal - uses global Zustand state */}
      <GlobalButtonConfigModal />
    </>
  );
}