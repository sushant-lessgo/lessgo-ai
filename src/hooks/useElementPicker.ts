// hooks/useElementPicker.ts - Element picker management hook

import { useState, useCallback } from 'react';
import { useElementCRUD } from './useElementCRUD';
import { useEditStore } from './useEditStore';
import type { UniversalElementType } from '@/types/universalElements';

interface ElementPickerOptions {
  position?: number;
  insertMode?: 'append' | 'prepend' | 'after' | 'before';
  referenceElementKey?: string;
  autoFocus?: boolean;
  categories?: Array<'text' | 'interactive' | 'media' | 'layout'>;
  excludeTypes?: UniversalElementType[];
}

interface ElementPickerState {
  isVisible: boolean;
  sectionId: string | null;
  position: { x: number; y: number };
  options: ElementPickerOptions;
}

export function useElementPicker() {
  const [state, setState] = useState<ElementPickerState>({
    isVisible: false,
    sectionId: null,
    position: { x: 0, y: 0 },
    options: {},
  });

  const { addElement } = useElementCRUD();
  const { announceLiveRegion } = useEditStore();

  // Show element picker
  const showElementPicker = useCallback((
    sectionId: string,
    position: { x: number; y: number },
    options: ElementPickerOptions = {}
  ) => {
    setState({
      isVisible: true,
      sectionId,
      position,
      options,
    });
  }, []);

  // Hide element picker
  const hideElementPicker = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
    }));
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
    if (state.isVisible && state.sectionId === sectionId) {
      hideElementPicker();
    } else {
      showElementPicker(sectionId, position, options);
    }
  }, [state.isVisible, state.sectionId, showElementPicker, hideElementPicker]);

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