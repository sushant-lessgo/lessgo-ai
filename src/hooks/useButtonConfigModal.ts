// Global state for button configuration modal
import { create } from 'zustand';
import type { ElementSelection } from '@/types/store/state';
import { logger } from '@/lib/logger';

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
    logger.debug('🔧 Button config modal opened for:', elementSelection);
    set({ isOpen: true, elementSelection });
  },
  closeModal: () => {
    logger.debug('🔧 Button config modal closed');
    set({ isOpen: false, elementSelection: null });
  },
}));