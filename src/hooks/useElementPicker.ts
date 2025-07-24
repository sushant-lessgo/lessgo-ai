// hooks/useElementPicker.ts - Element picker management hook

import React, { useState, useCallback } from 'react';
import { useElementCRUD } from './useElementCRUD';
import { useEditStoreLegacy as useEditStore } from './useEditStoreLegacy';
import type { UniversalElementType } from '@/types/universalElements';

// Global state to ensure all instances share the same state
let globalElementPickerState = {
  isVisible: false,
  sectionId: null as string | null,
  position: { x: 0, y: 0 },
  options: {} as ElementPickerOptions,
};

let stateSetters: Array<(state: typeof globalElementPickerState) => void> = [];

interface ElementPickerOptions {
  position?: number;
  insertMode?: 'append' | 'prepend' | 'after' | 'before';
  referenceElementKey?: string;
  autoFocus?: boolean;
  categories?: Array<'text' | 'interactive' | 'media' | 'layout'>;
  excludeTypes?: UniversalElementType[];
  restrictedTypes?: UniversalElementType[];
  restrictionReason?: string;
  restrictionContext?: {
    sectionType: string;
    layoutType?: string;
    sectionId: string;
  };
}

interface ElementPickerState {
  isVisible: boolean;
  sectionId: string | null;
  position: { x: number; y: number };
  options: ElementPickerOptions;
}

export function useElementPicker() {
  const [state, setState] = useState(globalElementPickerState);

  // Register this setter in the global array
  React.useEffect(() => {
    stateSetters.push(setState);
    return () => {
      const index = stateSetters.indexOf(setState);
      if (index > -1) {
        stateSetters.splice(index, 1);
      }
    };
  }, [setState]);

  const { addElement } = useElementCRUD();
  const store = useEditStore();
  
  // Fallback for announceLiveRegion if it doesn't exist
  const announceLiveRegion = store.announceLiveRegion || ((message: string) => {
    console.log('Live region announcement:', message);
  });

  // Show element picker
  const showElementPicker = useCallback((
    sectionId: string,
    position: { x: number; y: number },
    options: ElementPickerOptions = {}
  ) => {
    console.log('🎯 showElementPicker called:', { sectionId, position, options });
    
    // Update global state
    globalElementPickerState = {
      isVisible: true,
      sectionId,
      position,
      options,
    };
    
    // Notify all instances
    stateSetters.forEach(setter => setter({ ...globalElementPickerState }));
  }, []);

  // Hide element picker
  const hideElementPicker = useCallback(() => {
    console.log('🎯 hideElementPicker called');
    
    // Update global state
    globalElementPickerState = {
      ...globalElementPickerState,
      isVisible: false,
    };
    
    // Notify all instances
    stateSetters.forEach(setter => setter({ ...globalElementPickerState }));
  }, []);

  // Handle element selection
  const handleElementSelect = useCallback(async (elementType: UniversalElementType) => {
    if (!state.sectionId) return;

    try {
      const elementKey = await addElement(state.sectionId, elementType, state.options);
      hideElementPicker();
      announceLiveRegion(`Added ${elementType} element`);
      return elementKey;
    } catch (error) {
      console.error('Failed to add element:', error);
      announceLiveRegion('Failed to add element');
    }
  }, [state.sectionId, state.options, addElement, hideElementPicker, announceLiveRegion]);

  // Toggle element picker
  const toggleElementPicker = useCallback((
    sectionId: string,
    position: { x: number; y: number },
    options: ElementPickerOptions = {}
  ) => {
    if (globalElementPickerState.isVisible && globalElementPickerState.sectionId === sectionId) {
      hideElementPicker();
    } else {
      showElementPicker(sectionId, position, options);
    }
  }, [showElementPicker, hideElementPicker]);

  return {
    // State
    isPickerVisible: state.isVisible,
    pickerPosition: state.position,
    pickerSectionId: state.sectionId,
    pickerOptions: state.options,
    
    // Actions
    showElementPicker,
    hideElementPicker,
    toggleElementPicker,
    handleElementSelect,
  };
}