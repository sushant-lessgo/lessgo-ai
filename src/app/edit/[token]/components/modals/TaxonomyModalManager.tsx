// app/edit/[token]/components/modals/TaxonomyModalManager.tsx
"use client";

import { useState, useCallback } from 'react';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useEditStore } from '@/hooks/useEditStore';
import type { CanonicalFieldName } from '@/types/core/index';

// Import individual modal components
import MarketCategoryModal from './MarketCategoryModal';
import MarketSubcategoryModal from './MarketSubcategoryModal';
import TargetAudienceModal from './TargetAudienceModal';
import StartupStageModal from './StartupStageModal';
import LandingGoalsModal from './LandingGoalsModal';
import PricingModelModal from './PricingModelModal';
import TextInputModal from './TextInputModal';
import HiddenFieldModals from './HiddenFieldModals';

interface ModalState {
  isOpen: boolean;
  fieldName?: CanonicalFieldName;
  currentValue?: string;
  modalType?: string;
}

export function TaxonomyModalManager() {
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false });
  const [modalQueue, setModalQueue] = useState<CanonicalFieldName[]>([]);

  const { 
    validatedFields, 
    hiddenInferredFields, 
    confirmField,
    updateHiddenField 
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
    return validatedFields[fieldName] || hiddenInferredFields[fieldName] || '';
  };

  const handleFieldSelection = useCallback((value: string) => {
    if (!modalState.fieldName) return;

    const fieldName = modalState.fieldName;
    
    // Update appropriate store
    if (validatedFields[fieldName] !== undefined) {
      // Field exists in validatedFields - update via confirmField
      const displayName = getDisplayNameForField(fieldName);
      confirmField(displayName, value);
    } else if (hiddenInferredFields[fieldName] !== undefined) {
      // Field exists in hiddenInferredFields - update via updateHiddenField
      updateHiddenField(fieldName, value);
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
  }, [modalState.fieldName, validatedFields, hiddenInferredFields, confirmField, updateHiddenField, triggerAutoSave, closeModal]);

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
    const displayNames: Record<CanonicalFieldName, string> = {
      marketCategory: 'Market Category',
      marketSubcategory: 'Market Subcategory',
      targetAudience: 'Target Audience',
      keyProblem: 'Key Problem Getting Solved',
      startupStage: 'Startup Stage',
      landingPageGoals: 'Landing Page Goals',
      pricingModel: 'Pricing Category and Model',
    };

    return displayNames[fieldName] || fieldName;
  };

  // Expose modal manager to parent components
  React.useEffect(() => {
    // Global modal manager instance
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

  if (!modalState.isOpen || !modalState.fieldName || !modalState.modalType) {
    return null;
  }

  // Render appropriate modal based on field type
  const renderModal = () => {
    const commonProps = {
      isOpen: modalState.isOpen,
      onClose: closeModal,
      onSelect: handleFieldSelection,
      currentValue: modalState.currentValue,
      fieldName: modalState.fieldName!,
    };

    switch (modalState.modalType) {
      case 'MarketCategoryModal':
        return <MarketCategoryModal {...commonProps} />;
      
      case 'MarketSubcategoryModal':
        const currentCategory = validatedFields.marketCategory || hiddenInferredFields.marketCategory;
        return <MarketSubcategoryModal {...commonProps} currentCategory={currentCategory} />;
      
      case 'TargetAudienceModal':
        return <TargetAudienceModal {...commonProps} />;
      
      case 'StartupStageModal':
        return <StartupStageModal {...commonProps} />;
      
      case 'LandingGoalsModal':
        return <LandingGoalsModal {...commonProps} />;
      
      case 'PricingModelModal':
        return <PricingModelModal {...commonProps} />;
      
      case 'TextInputModal':
        return (
          <TextInputModal 
            {...commonProps} 
            placeholder={getPlaceholderForField(modalState.fieldName!)}
            description={getDescriptionForField(modalState.fieldName!)}
          />
        );
      
      default:
        // Check if it's a hidden field
        if (modalState.fieldName && isHiddenField(modalState.fieldName)) {
          return <HiddenFieldModals {...commonProps} />;
        }
        return null;
    }
  };

  const getPlaceholderForField = (fieldName: CanonicalFieldName): string => {
    const placeholders: Record<CanonicalFieldName, string> = {
      keyProblem: 'Describe the main problem your product solves...',
      marketCategory: '',
      marketSubcategory: '',
      targetAudience: '',
      startupStage: '',
      landingPageGoals: '',
      pricingModel: '',
    };

    return placeholders[fieldName] || '';
  };

  const getDescriptionForField = (fieldName: CanonicalFieldName): string => {
    const descriptions: Record<CanonicalFieldName, string> = {
      keyProblem: 'Be specific about the pain point or challenge your target audience faces.',
      marketCategory: '',
      marketSubcategory: '',
      targetAudience: '',
      startupStage: '',
      landingPageGoals: '',
      pricingModel: '',
    };

    return descriptions[fieldName] || '';
  };

  const isHiddenField = (fieldName: CanonicalFieldName): boolean => {
    // These would be the hidden inferred field names
    const hiddenFieldNames = ['awarenessLevel', 'copyIntent', 'toneProfile', 'marketSophisticationLevel', 'problemType'];
    return hiddenFieldNames.includes(fieldName);
  };

  return (
    <>
      {renderModal()}
      
      {/* Modal queue indicator for development */}
      {process.env.NODE_ENV === 'development' && modalQueue.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm z-50">
          {modalQueue.length} modal(s) queued
        </div>
      )}
    </>
  );
}

export default TaxonomyModalManager;