// Global state for button configuration modal
import { create } from 'zustand';
import type { ElementSelection } from '@/types/store/state';

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
    console.log('🔧 Button config modal opened for:', elementSelection);
    set({ isOpen: true, elementSelection });
  },
  closeModal: () => {
    console.log('🔧 Button config modal closed');
    set({ isOpen: false, elementSelection: null });
  },
}));