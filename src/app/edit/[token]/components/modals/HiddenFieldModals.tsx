// app/edit/[token]/components/modals/HiddenFieldModals.tsx
"use client";

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import TaxonomyTile from '../ui/TaxonomyTile';
import { 
  awarenessLevels, 
  toneProfiles, 
  copyIntents, 
  marketSophisticationLevels, 
  problemTypes 
} from '@/modules/inference/taxonomy';

interface HiddenFieldModalsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
  fieldName: string;
}

export function HiddenFieldModals({
  isOpen,
  onClose,
  onSelect,
  currentValue,
  fieldName,
}: HiddenFieldModalsProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(currentValue || null);

  const handleValueSelect = (value: string) => {
    setSelectedValue(value);
  };

  const handleConfirm = () => {
    if (selectedValue) {
      onSelect(selectedValue);
    }
  };

  const handleCancel = () => {
    setSelectedValue(currentValue || null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedValue(currentValue || null);
    }
  }, [isOpen, currentValue]);

  const getFieldData = () => {
    switch (fieldName) {
      case 'awarenessLevel':
        return {
          title: 'Select Awareness Level',
          description: 'Choose how aware your audience is of their problem and solutions',
          options: awarenessLevels.map(level => ({
            id: level.id,
            label: level.label,
            description: level.description,
            badge: level.persuasionFocus?.[0] || undefined,
          })),
        };
      case 'toneProfile':
        return {
          title: 'Select Tone Profile',
          description: 'Choose the tone that best fits your brand and audience',
          options: toneProfiles.map(tone => ({
            id: tone.id,
            label: tone.label,
            description: tone.description,
            badge: undefined,
          })),
        };
      case 'copyIntent':
        return {
          title: 'Select Copy Intent',
          description: 'Choose the primary approach for your messaging',
          options: copyIntents.map(intent => ({
            id: intent,
            label: intent === 'pain-led' ? 'Pain-Led' : 'Desire-Led',
            description: intent === 'pain-led' 
              ? 'Focus on problems and pain points to motivate action' 
              : 'Focus on benefits and aspirations to inspire action',
            badge: intent === 'pain-led' ? 'Problem-focused' : 'Benefit-focused',
          })),
        };
      case 'marketSophisticationLevel':
        return {
          title: 'Select Market Sophistication',
          description: 'Choose how experienced your market is with similar solutions',
          options: marketSophisticationLevels.map(level => ({
            id: level.id,
            label: level.label,
            description: level.description,
            badge: level.copyStrategy ? 'Strategy' : undefined,
          })),
        };
      case 'problemType':
        return {
          title: 'Select Problem Type',
          description: 'Choose the type of problem your product solves',
          options: problemTypes.map(problem => ({
            id: problem.id,
            label: problem.label,
            description: `Copy intent: ${problem.copyIntent}`,
            badge: problem.copyIntent === 'pain-led' ? 'Pain-Led' : 'Desire-Led',
          })),
        };
      default:
        return {
          title: 'Select Value',
          description: 'Choose an option',
          options: [],
        };
    }
  };

  const fieldData = getFieldData();

  const getBadgeColor = (badge: string | undefined) => {
    if (!badge) return '';
    
    switch (badge.toLowerCase()) {
      case 'pain-led':
      case 'problem-focused':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'desire-led':
      case 'benefit-focused':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'strategy':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getSelectedOptionData = () => {
    return fieldData.options.find(option => option.id === selectedValue);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={fieldData.title}
      description={fieldData.description}
      size="large"
    >
      <div className="space-y-6">
        {/* AI Inference Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">AI Inference</p>
              <p className="text-sm text-blue-700 mt-1">
                This field was automatically inferred by AI based on your other inputs. You can review and adjust it if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Options List */}
        <div className="max-h-96 overflow-y-auto">
          {fieldData.options.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.44-.954-5.96-2.51" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-1">No options available</p>
              <p className="text-sm text-gray-500">This field type is not yet supported</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fieldData.options.map((option) => (
                <div key={option.id} className="relative">
                  <TaxonomyTile
                    id={option.id}
                    label={option.label}
                    description={option.description}
                    isSelected={selectedValue === option.id}
                    onClick={() => handleValueSelect(option.id)}
                    size="medium"
                    layout="horizontal"
                  />
                  {option.badge && (
                    <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full border ${getBadgeColor(option.badge)}`}>
                      {option.badge}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection Info */}
        {selectedValue && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                {(() => {
                  const optionData = getSelectedOptionData();
                  return (
                    <>
                      <p className="text-sm font-medium text-green-900">
                        Selected: {optionData?.label}
                      </p>
                      {optionData?.description && (
                        <p className="text-sm text-green-700 mt-1">
                          {optionData.description}
                        </p>
                      )}
                      <p className="text-sm text-green-600 mt-1">
                        This will influence how your content is generated and optimized.
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
            disabled={!selectedValue}
            className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selectedValue
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

export default HiddenFieldModals;