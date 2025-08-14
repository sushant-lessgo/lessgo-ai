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
  console.log('🎯 showBackgroundModal called for:', sectionId);
  modalState.backgroundModal = { isOpen: true, sectionId };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function hideBackgroundModal() {
  console.log('🎯 hideBackgroundModal called');
  modalState.backgroundModal = { isOpen: false, sectionId: null };
  modalEvents.dispatchEvent(new Event('stateChange'));
}

export function GlobalModals() {
  const [state, setState] = useState(modalState);
  
  useEffect(() => {
    const handleStateChange = () => {
      console.log('🎯 GlobalModals state changed:', modalState);
      setState({ ...modalState });
    };
    
    modalEvents.addEventListener('stateChange', handleStateChange);
    return () => modalEvents.removeEventListener('stateChange', handleStateChange);
  }, []);
  
  // console.log('🎯 GlobalModals rendering with state:', state);
  
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