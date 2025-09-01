// app/edit/[token]/components/hooks/useModalManager.ts
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import type { CanonicalFieldName } from '@/types/core/index';
import { FIELD_DISPLAY_NAMES } from '@/types/core/index';

interface ModalState {
  isOpen: boolean;
  fieldName?: CanonicalFieldName;
  currentValue?: string;
  modalType?: string;
}

interface ModalManagerHook {
  modalState: ModalState;
  openFieldModal: (fieldName: CanonicalFieldName, currentValue?: string) => void;
  closeModal: () => void;
  handleFieldSelection: (value: string) => void;
  isModalOpen: boolean;
  currentField?: CanonicalFieldName;
}

export function useModalManager(): ModalManagerHook {
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false });
  const [modalQueue, setModalQueue] = useState<CanonicalFieldName[]>([]);

  const { 
    validatedFields, 
    hiddenInferredFields, 
    confirmField
  } = useOnboardingStore();

  const { triggerAutoSave } = useEditStore();

  const openFieldModal = useCallback((fieldName: CanonicalFieldName, currentValue?: string) => {
    const modalType = getModalTypeForField(fieldName);
    
    setModalState({
      isOpen: true,
      fieldName,
      currentValue: currentValue || getCurrentFieldValue(fieldName),
      modalType,
    });
  }, [validatedFields, hiddenInferredFields]);

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false });
    
    // Process queue if there are pending modals
    if (modalQueue.length > 0) {
      const nextField = modalQueue[0];
      setModalQueue(prev => prev.slice(1));
      
      // Delay to prevent modal flash
      setTimeout(() => {
        openFieldModal(nextField);
      }, 150);
    }
  }, [modalQueue, openFieldModal]);

  const getCurrentFieldValue = (fieldName: CanonicalFieldName): string => {
    return validatedFields[fieldName] || (hiddenInferredFields as any)[fieldName] || '';
  };

  const handleFieldSelection = useCallback((value: string) => {
    if (!modalState.fieldName) return;

    const fieldName = modalState.fieldName;
    
    // Update appropriate store
    if (validatedFields[fieldName] !== undefined) {
      // Field exists in validatedFields - update via confirmField
      const displayName = getDisplayNameForField(fieldName);
      confirmField(displayName, value);
    } else if ((hiddenInferredFields as any)[fieldName] !== undefined) {
      // Field exists in hiddenInferredFields - update via updateHiddenField
    } else {
      // New field - add to validatedFields
      const displayName = getDisplayNameForField(fieldName);
      confirmField(displayName, value);
    }

    // Handle field dependencies
    handleFieldDependency(fieldName, value);
    
    // Trigger auto-save
    triggerAutoSave();
    
    // Close modal
    closeModal();
  }, [modalState.fieldName, validatedFields, hiddenInferredFields, confirmField, triggerAutoSave, closeModal]);

  const handleFieldDependency = (updatedField: CanonicalFieldName, newValue: string) => {
    // Market category change forces subcategory selection
    if (updatedField === 'marketCategory') {
      // Add subcategory to queue for auto-opening
      setModalQueue(prev => [...prev, 'marketSubcategory']);
    }
  };

  const getModalTypeForField = (fieldName: CanonicalFieldName): string => {
    const fieldModalMap: Record<CanonicalFieldName, string> = {
      marketCategory: 'MarketCategoryModal',
      marketSubcategory: 'MarketSubcategoryModal',
      targetAudience: 'TargetAudienceModal',
      keyProblem: 'TextInputModal',
      startupStage: 'StartupStageModal',
      landingPageGoals: 'LandingGoalsModal',
      pricingModel: 'PricingModelModal',
    };

    return fieldModalMap[fieldName] || 'TextInputModal';
  };

  const getDisplayNameForField = (fieldName: CanonicalFieldName): string => {
    return FIELD_DISPLAY_NAMES[fieldName] || fieldName;
  };

  // Expose modal manager to global scope for integration
  useEffect(() => {
    (window as any).__taxonomyModalManager = {
      openFieldModal,
      closeModal,
      isModalOpen: modalState.isOpen,
      currentField: modalState.fieldName,
    };

    return () => {
      delete (window as any).__taxonomyModalManager;
    };
  }, [openFieldModal, closeModal, modalState.isOpen, modalState.fieldName]);

  return {
    modalState,
    openFieldModal,
    closeModal,
    handleFieldSelection,
    isModalOpen: modalState.isOpen,
    currentField: modalState.fieldName,
  };
}

export default useModalManager;