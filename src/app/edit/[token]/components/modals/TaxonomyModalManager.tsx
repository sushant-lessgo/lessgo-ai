// app/edit/[token]/components/modals/TaxonomyModalManager.tsx
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import type { CanonicalFieldName, HiddenFieldName, AnyFieldName } from '@/types/core/index';
import { HIDDEN_FIELD_NAMES, HIDDEN_FIELD_DISPLAY_NAMES } from '@/types/core/index';

// Import individual modal components
import MarketCategoryModal from './MarketCategoryModal';
import MarketSubcategoryModal from './MarketSubcategoryModal';
import TargetAudienceModal from './TargetAudienceModal';
import StartupStageModal from './StartupStageModal';
import LandingGoalsModal from './LandingGoalsModal';
import PricingModelModal from './PricingModelModal';
import TextInputModal from './TextInputModal';
import HiddenFieldModals from './HiddenFieldModals';

import { logger } from '@/lib/logger';
interface ModalState {
  isOpen: boolean;
  fieldName?: AnyFieldName;
  currentValue?: string;
  modalType?: string;
}

export function TaxonomyModalManager() {
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false });
  const [modalQueue, setModalQueue] = useState<AnyFieldName[]>([]);
  const [queueTimeoutId, setQueueTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const { 
    validatedFields, 
    hiddenInferredFields, 
    confirmField,
    removePendingRevalidationField
    // updateHiddenField 
  } = useOnboardingStore();

  const { triggerAutoSave, updateOnboardingData } = useEditStore();

  const openFieldModal = useCallback((fieldName: AnyFieldName, currentValue?: string) => {
    // Remove this field from the queue if it's there (prevents duplicate opening)
    setModalQueue(prev => prev.filter(f => f !== fieldName));
    
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
    
    // Clear any existing queue timeout
    if (queueTimeoutId) {
      clearTimeout(queueTimeoutId);
      setQueueTimeoutId(null);
    }
    
    // Process queue if there are pending modals
    if (modalQueue.length > 0) {
      const nextField = modalQueue[0];
      setModalQueue(prev => prev.slice(1));
      
      // Delay to prevent modal flash - with cleanup tracking
      const timeoutId = setTimeout(() => {
        try {
          openFieldModal(nextField);
        } catch (error) {
          logger.warn('Failed to open next modal from queue:', error);
        }
        setQueueTimeoutId(null);
      }, 150);
      
      setQueueTimeoutId(timeoutId);
    }
  }, [modalQueue, openFieldModal, queueTimeoutId]);

  const getCurrentFieldValue = (fieldName: AnyFieldName): string => {
    return (validatedFields as any)[fieldName] || (hiddenInferredFields as any)[fieldName] || '';
  };

  const handleFieldSelection = useCallback((value: string) => {
    if (!modalState.fieldName) return;

    const fieldName = modalState.fieldName;
    
    // Update onboarding store first
    if ((validatedFields as any)[fieldName] !== undefined) {
      // Field exists in validatedFields - update via confirmField
      const displayName = getDisplayNameForField(fieldName);
      confirmField(displayName, value);
    } else if ((hiddenInferredFields as any)[fieldName] !== undefined) {
      // Field exists in hiddenInferredFields - update via updateHiddenField
      // updateHiddenField(fieldName, value);
    } else {
      // New field - add to validatedFields
      const displayName = getDisplayNameForField(fieldName);
      confirmField(displayName, value);
    }

    // Remove from pending revalidation since user has confirmed the field
    removePendingRevalidationField(fieldName as CanonicalFieldName);

    // Handle field dependencies BEFORE syncing to edit store
    handleFieldDependency(fieldName as any, value);

    // Immediately sync to edit store for left panel reactivity
    const updatedOnboardingState = useOnboardingStore.getState();
    updateOnboardingData({
      validatedFields: updatedOnboardingState.validatedFields,
      hiddenInferredFields: updatedOnboardingState.hiddenInferredFields,
      confirmedFields: updatedOnboardingState.confirmedFields,
      pendingRevalidationFields: updatedOnboardingState.pendingRevalidationFields,
    });
    
    // Trigger auto-save
    triggerAutoSave();
    
    // Close modal
    closeModal();
  }, [modalState.fieldName, validatedFields, hiddenInferredFields, confirmField, updateOnboardingData, triggerAutoSave, closeModal]);

  const handleFieldDependency = (updatedField: CanonicalFieldName, newValue: string) => {
    // Market category change forces subcategory selection
    if (updatedField === 'marketCategory') {
      // Add subcategory to queue - it will open automatically when current modal closes
      // Prevent duplicates in the queue
      setModalQueue(prev => {
        if (!prev.includes('marketSubcategory')) {
          return [...prev, 'marketSubcategory'];
        }
        return prev;
      });
    }
  };

  const isHiddenField = (fieldName: AnyFieldName): boolean => {
    // Use the imported HIDDEN_FIELD_NAMES constant
    return HIDDEN_FIELD_NAMES.includes(fieldName as HiddenFieldName);
  };

  const getModalTypeForField = (fieldName: AnyFieldName): string => {
    // Check if it's a hidden field first
    if (isHiddenField(fieldName)) {
      return 'HiddenFieldModals';
    }
    
    // Handle canonical fields
    const fieldModalMap: Partial<Record<CanonicalFieldName, string>> = {
      marketCategory: 'MarketCategoryModal',
      marketSubcategory: 'MarketSubcategoryModal',
      targetAudience: 'TargetAudienceModal',
      keyProblem: 'TextInputModal',
      startupStage: 'StartupStageModal',
      landingPageGoals: 'LandingGoalsModal',
      pricingModel: 'PricingModelModal',
    };

    const modalType = fieldModalMap[fieldName as CanonicalFieldName] || 'TextInputModal';
    
    // Debug logging in development only
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🔍 Field Modal Routing:', { fieldName, modalType, isHidden: isHiddenField(fieldName) });
    }

    return modalType;
  };

  const getDisplayNameForField = (fieldName: AnyFieldName): string => {
    // Check if it's a hidden field first
    if (isHiddenField(fieldName)) {
      return HIDDEN_FIELD_DISPLAY_NAMES[fieldName as HiddenFieldName] || fieldName;
    }
    
    // Handle canonical fields
    const displayNames: Partial<Record<CanonicalFieldName, string>> = {
      marketCategory: 'Market Category',
      marketSubcategory: 'Market Subcategory',
      targetAudience: 'Target Audience',
      keyProblem: 'Key Problem Getting Solved',
      startupStage: 'Startup Stage',
      landingPageGoals: 'Landing Page Goals',
      pricingModel: 'Pricing Category and Model',
    };

    return displayNames[fieldName as CanonicalFieldName] || fieldName;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (queueTimeoutId) {
        clearTimeout(queueTimeoutId);
      }
    };
  }, [queueTimeoutId]);

  // Expose modal manager to parent components
  useEffect(() => {
    // Global modal manager instance
    (window as any).__taxonomyModalManager = {
      openFieldModal,
      closeModal,
      isModalOpen: modalState.isOpen,
      currentField: modalState.fieldName,
      // Add emergency reset function
      reset: () => {
        setModalState({ isOpen: false });
        setModalQueue([]);
        if (queueTimeoutId) {
          clearTimeout(queueTimeoutId);
          setQueueTimeoutId(null);
        }
      }
    };

    return () => {
      // Cleanup on unmount
      if (queueTimeoutId) {
        clearTimeout(queueTimeoutId);
      }
      delete (window as any).__taxonomyModalManager;
    };
  }, [openFieldModal, closeModal, modalState.isOpen, modalState.fieldName, queueTimeoutId]);

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
        const currentCategory = validatedFields.marketCategory || (hiddenInferredFields as any).marketCategory;
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
            placeholder={getPlaceholderForField(modalState.fieldName! as any)}
            description={getDescriptionForField(modalState.fieldName! as any)}
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