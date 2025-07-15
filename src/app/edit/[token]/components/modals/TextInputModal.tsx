// app/edit/[token]/components/modals/TextInputModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';

interface TextInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
  fieldName: string;
  placeholder?: string;
  description?: string;
}

export function TextInputModal({
  isOpen,
  onClose,
  onSelect,
  currentValue,
  fieldName,
  placeholder = '',
  description = '',
}: TextInputModalProps) {
  const [inputValue, setInputValue] = useState(currentValue || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onSelect(inputValue.trim());
    }
  };

  const handleCancel = () => {
    setInputValue(currentValue || '');
    setHasChanges(false);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasChanges(newValue !== (currentValue || ''));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (inputValue.trim()) {
        handleConfirm();
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentValue || '');
      setHasChanges(false);
    }
  }, [isOpen, currentValue]);

  const getFieldTitle = (fieldName: string): string => {
    const titles: Record<string, string> = {
      keyProblem: 'Key Problem Getting Solved',
      marketCategory: 'Market Category',
      marketSubcategory: 'Market Subcategory',
      targetAudience: 'Target Audience',
      startupStage: 'Startup Stage',
      landingPageGoals: 'Landing Page Goals',
      pricingModel: 'Pricing Model',
    };
    return titles[fieldName] || fieldName;
  };

  const getFieldDescription = (fieldName: string): string => {
    if (description) return description;
    
    const descriptions: Record<string, string> = {
      keyProblem: 'Describe the main problem your product solves. Be specific about the pain point or challenge your target audience faces.',
      marketCategory: 'Enter a custom market category if none of the predefined options fit.',
      marketSubcategory: 'Enter a custom market subcategory for more specific positioning.',
      targetAudience: 'Describe your specific target audience if none of the predefined options fit.',
      startupStage: 'Describe your current startup stage if none of the predefined options fit.',
      landingPageGoals: 'Describe your landing page goal if none of the predefined options fit.',
      pricingModel: 'Describe your pricing model if none of the predefined options fit.',
    };
    return descriptions[fieldName] || `Enter the ${fieldName.toLowerCase()}`;
  };

  const getFieldPlaceholder = (fieldName: string): string => {
    if (placeholder) return placeholder;
    
    const placeholders: Record<string, string> = {
      keyProblem: 'e.g., "Small business owners struggle to manage their social media presence across multiple platforms while focusing on their core business operations..."',
      marketCategory: 'e.g., "Custom Software Solutions"',
      marketSubcategory: 'e.g., "Industry-Specific CRM Systems"',
      targetAudience: 'e.g., "Mid-market SaaS companies with 50-200 employees"',
      startupStage: 'e.g., "Post-Series A with established product-market fit"',
      landingPageGoals: 'e.g., "Schedule a product consultation"',
      pricingModel: 'e.g., "Enterprise contracts with custom pricing"',
    };
    return placeholders[fieldName] || `Enter ${fieldName.toLowerCase()}...`;
  };

  const wordCount = inputValue.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = inputValue.length;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Edit ${getFieldTitle(fieldName)}`}
      description={getFieldDescription(fieldName)}
      size="medium"
    >
      <div className="space-y-6">
        {/* Input Area */}
        <div>
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={getFieldPlaceholder(fieldName)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none text-sm leading-relaxed"
            autoFocus
            rows={6}
          />
          
          {/* Character and Word Count */}
          <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
            <div>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </div>
            <div>
              {charCount} characters
            </div>
          </div>
        </div>

        {/* Tips */}
        {fieldName === 'keyProblem' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Tips for describing the problem:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Be specific about who faces this problem</li>
                  <li>• Explain the impact or consequences</li>
                  <li>• Mention current solutions and their limitations</li>
                  <li>• Use concrete examples when possible</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {inputValue.trim() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">Preview</p>
                <p className="text-sm text-blue-700 whitespace-pre-wrap leading-relaxed">
                  {inputValue.trim()}
                </p>
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
          
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <span className="text-xs text-gray-500">
                Press Cmd+Enter to save
              </span>
            )}
            <button
              onClick={handleConfirm}
              disabled={!inputValue.trim()}
              className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                inputValue.trim()
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default TextInputModal;