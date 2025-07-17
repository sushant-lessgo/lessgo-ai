// Global state for button configuration modal
import { create } from 'zustand';
import type { ElementSelection } from '@/types/core/ui';

interface ButtonConfigModalState {
  isOpen: boolean;
  elementSelection: ElementSelection | null;
  openModal: (elementSelection: ElementSelection) => void;
  closeModal: () => void;
}

export const useButtonConfigModal = create<ButtonConfigModalState>((set) => ({
  isOpen: false,
  elementSelection: null,
  openModal: (elementSelection) => {
    console.log('🔧 Global modal opened for:', elementSelection);
    set({ isOpen: true, elementSelection });
  },
  closeModal: () => {
    console.log('🔧 Global modal closed');
    set({ isOpen: false, elementSelection: null });
  },
}));