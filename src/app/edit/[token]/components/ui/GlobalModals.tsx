// Global modal manager that persists independent of toolbar state
import React, { useState, useEffect } from 'react';
import { SectionBackgroundModal } from './SectionBackgroundModal';
import { GlobalButtonConfigModal } from '@/components/layout/GlobalButtonConfigModal';

// Global state for modals (outside React to persist)
let modalState = {
  backgroundModal: {
    isOpen: false,
    sectionId: null as string | null
  }
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

export function GlobalModals() {
  const [state, setState] = useState(modalState);
  
  useEffect(() => {
    const handleStateChange = () => {
      setState({ ...modalState });
    };
    
    modalEvents.addEventListener('stateChange', handleStateChange);
    return () => modalEvents.removeEventListener('stateChange', handleStateChange);
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
      
      {/* Button Configuration Modal - uses global Zustand state */}
      <GlobalButtonConfigModal />
    </>
  );
}