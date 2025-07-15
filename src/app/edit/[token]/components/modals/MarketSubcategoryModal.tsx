// app/edit/[token]/components/modals/MarketSubcategoryModal.tsx
"use client";

import React, { useState, useMemo } from 'react';
import BaseModal from './BaseModal';
import TaxonomyTile from '../ui/TaxonomyTile';
import { marketSubcategories, getSubcategoriesForCategory } from '@/modules/inference/taxonomy';
import type { MarketCategory, MarketSubcategory } from '@/modules/inference/taxonomy';

interface MarketSubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
  fieldName: string;
  currentCategory?: string;
}

export function MarketSubcategoryModal({
  isOpen,
  onClose,
  onSelect,
  currentValue,
  fieldName,
  currentCategory,
}: MarketSubcategoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(currentValue || null);

  // Get subcategories for current category
  const availableSubcategories = useMemo(() => {
    if (!currentCategory) return [];
    return getSubcategoriesForCategory(currentCategory as MarketCategory);
  }, [currentCategory]);

  // Filter subcategories based on search
  const filteredSubcategories = useMemo(() => {
    if (!searchQuery.trim()) return availableSubcategories;
    
    const query = searchQuery.toLowerCase();
    return availableSubcategories.filter(subcategory =>
      subcategory.toLowerCase().includes(query)
    );
  }, [availableSubcategories, searchQuery]);

  const handleSubcategorySelect = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
  };

  const handleConfirm = () => {
    if (selectedSubcategory) {
      onSelect(selectedSubcategory);
    }
  };

  const handleCancel = () => {
    setSelectedSubcategory(currentValue || null);
    setSearchQuery('');
    onClose();
  };

  // Clear search when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedSubcategory(currentValue || null);
    }
  }, [isOpen, currentValue]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select Market Subcategory"
      description={currentCategory ? `Choose a subcategory within ${currentCategory}` : 'Choose a specific subcategory'}
      size="large"
    >
      <div className="space-y-6">
        {/* Category Context */}
        {currentCategory && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <span className="text-sm text-gray-900 font-semibold">{currentCategory}</span>
            </div>
          </div>
        )}

        {/* No category selected warning */}
        {!currentCategory && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">No market category selected</p>
                <p className="text-sm text-amber-700 mt-1">Please select a market category first to see available subcategories.</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Input */}
        {availableSubcategories.length > 0 && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search subcategories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus={availableSubcategories.length > 0}
            />
          </div>
        )}

        {/* Subcategories Grid */}
        {availableSubcategories.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {filteredSubcategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.44-.954-5.96-2.51" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-1">No subcategories found</p>
                <p className="text-sm text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredSubcategories.map((subcategory) => (
                  <TaxonomyTile
                    key={subcategory}
                    id={subcategory}
                    label={subcategory}
                    isSelected={selectedSubcategory === subcategory}
                    onClick={() => handleSubcategorySelect(subcategory)}
                    size="medium"
                    layout="horizontal"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selection Info */}
        {selectedSubcategory && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Selected: {selectedSubcategory}</p>
                <p className="text-sm text-blue-700 mt-1">
                  This will be used to refine your content and positioning.
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
          
          <button
            onClick={handleConfirm}
            disabled={!selectedSubcategory}
            className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selectedSubcategory
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

export default MarketSubcategoryModal;