"use client";

import React from 'react';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { LayoutChangeSelector } from './LayoutChangeSelector';
import type { EditableElement } from '@/types/core';

export function LayoutChangeModal() {
  const { store } = useEditStoreContext();
  
  // Use useStoreState without passing store as first parameter
  const layoutChangeModal = useStoreState(state => state.layoutChangeModal);
  const executeUndoableAction = useStoreState(state => state.executeUndoableAction);
  const updateSectionLayout = useStoreState(state => state.updateSectionLayout);
  const setSection = useStoreState(state => state.setSection);
  const hideLayoutChangeModal = useStoreState(state => state.hideLayoutChangeModal);

  const handleLayoutChange = (layoutId: string, migratedData: Record<string, EditableElement>) => {
    if (!layoutChangeModal.sectionId) return;

    // Use the store actions
    executeUndoableAction(
      'section-layout-update' as any,
      `Changed layout to ${layoutId}`,
      () => {
        // Update the layout
        updateSectionLayout(layoutChangeModal.sectionId!, layoutId);
        
        // Update the section content with migrated data
        setSection(layoutChangeModal.sectionId!, { elements: migratedData });
      }
    );

    // Hide the modal
    hideLayoutChangeModal();
  };

  if (!layoutChangeModal.visible || !layoutChangeModal.sectionId) {
    return null;
  }

  return (
    <LayoutChangeSelector
      isOpen={layoutChangeModal.visible}
      onClose={() => hideLayoutChangeModal()}
      sectionType={layoutChangeModal.sectionType!}
      currentLayout={layoutChangeModal.currentLayout!}
      currentData={layoutChangeModal.currentData!}
      onLayoutChange={handleLayoutChange}
    />
  );
}