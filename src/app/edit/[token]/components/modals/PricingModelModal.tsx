// app/edit/[token]/components/modals/PricingModelModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import TaxonomyTile from '../ui/TaxonomyTile';
import { pricingModels } from '@/modules/inference/taxonomy';

interface PricingModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
  fieldName: string;
}

export function PricingModelModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentValue, 
  fieldName 
}: PricingModelModalProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(currentValue || null);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleConfirm = () => {
    if (selectedModel) {
      onSelect(selectedModel);
    }
  };

  const handleCancel = () => {
    setSelectedModel(currentValue || null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedModel(currentValue || null);
    }
  }, [isOpen, currentValue]);

  const getFrictionColor = (friction: string) => {
    switch (friction) {
      case 'None': return 'bg-green-50 text-green-700 border-green-200';
      case 'Low': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'High': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getSelectedModelData = () => {
    return pricingModels.find(model => model.id === selectedModel);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select Pricing Model"
      description="Choose the pricing approach that best fits your business"
      size="large"
    >
      <div className="space-y-6">
        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3">
            {pricingModels.map((model) => (
              <div key={model.id} className="relative">
                <TaxonomyTile
                  id={model.id}
                  label={model.label}
                  isSelected={selectedModel === model.id}
                  onClick={() => handleModelSelect(model.id)}
                  size="medium"
                  layout="horizontal"
                />
                <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full border ${getFrictionColor(model.friction)}`}>
                  {model.friction} Friction
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selection Info */}
        {selectedModel && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                {(() => {
                  const modelData = getSelectedModelData();
                  return (
                    <>
                      <p className="text-sm font-medium text-blue-900">
                        Selected: {modelData?.label}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Friction Level: {modelData?.friction} - This affects your conversion strategy and messaging.
                      </p>
                      {modelData?.commitmentOptions && modelData.commitmentOptions.length > 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          Commitment: {modelData.commitmentOptions.join(', ')}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedModel}
            className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selectedModel
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export default PricingModelModal;