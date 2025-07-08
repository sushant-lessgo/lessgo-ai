// app/edit/[token]/components/modals/LandingGoalsModal.tsx
"use client";

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import TaxonomyTile from '../ui/TaxonomyTile';
import { landingGoalTypes } from '@/modules/inference/taxonomy';

interface LandingGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
  fieldName: string;
}

export function LandingGoalsModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentValue, 
  fieldName 
}: LandingGoalsModalProps) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(currentValue || null);

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
  };

  const handleConfirm = () => {
    if (selectedGoal) {
      onSelect(selectedGoal);
    }
  };

  const handleCancel = () => {
    setSelectedGoal(currentValue || null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedGoal(currentValue || null);
    }
  }, [isOpen, currentValue]);

  const getCtaTypeColor = (ctaType: string) => {
    switch (ctaType) {
      case 'Soft': return 'bg-green-50 text-green-700 border-green-200';
      case 'Direct': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Trust': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Hard': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getSelectedGoalData = () => {
    return landingGoalTypes.find(goal => goal.id === selectedGoal);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select Landing Page Goal"
      description="Choose the primary action you want visitors to take"
      size="large"
    >
      <div className="space-y-6">
        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3">
            {landingGoalTypes.map((goal) => (
              <div key={goal.id} className="relative">
                <TaxonomyTile
                  id={goal.id}
                  label={goal.label}
                  isSelected={selectedGoal === goal.id}
                  onClick={() => handleGoalSelect(goal.id)}
                  size="medium"
                  layout="horizontal"
                />
                <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full border ${getCtaTypeColor(goal.ctaType)}`}>
                  {goal.ctaType}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selection Info */}
        {selectedGoal && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                {(() => {
                  const goalData = getSelectedGoalData();
                  return (
                    <>
                      <p className="text-sm font-medium text-blue-900">
                        Selected: {goalData?.label}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        CTA Type: {goalData?.ctaType} - This will influence your page's messaging and design.
                      </p>
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
            disabled={!selectedGoal}
            className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selectedGoal
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

export default LandingGoalsModal;