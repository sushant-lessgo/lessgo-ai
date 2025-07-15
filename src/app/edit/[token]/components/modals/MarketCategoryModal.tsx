// app/edit/[token]/components/modals/MarketCategoryModal.tsx
"use client";

import React, { useState, useMemo } from 'react';
import BaseModal from './BaseModal';
import TaxonomyTile from '../ui/TaxonomyTile';
import { marketCategories } from '@/modules/inference/taxonomy';
import type { MarketCategory } from '@/modules/inference/taxonomy';

interface MarketCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
  fieldName: string;
}

export function MarketCategoryModal({
  isOpen,
  onClose,
  onSelect,
  currentValue,
  fieldName,
}: MarketCategoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(currentValue || null);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return marketCategories;
    
    const query = searchQuery.toLowerCase();
    return marketCategories.filter(category =>
      category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleCategorySelect = (category: MarketCategory) => {
    setSelectedCategory(category);
  };

  const handleConfirm = () => {
    if (selectedCategory) {
      onSelect(selectedCategory);
    }
  };

  const handleCancel = () => {
    setSelectedCategory(currentValue || null);
    setSearchQuery('');
    onClose();
  };

  // Clear search when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCategory(currentValue || null);
    }
  }, [isOpen, currentValue]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select Market Category"
      description="Choose the category that best describes your product or service"
      size="large"
    >
      <div className="space-y-6">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        {/* Categories Grid */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.44-.954-5.96-2.51" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-1">No categories found</p>
              <p className="text-sm text-gray-500">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCategories.map((category) => (
                <TaxonomyTile
                  key={category}
                  id={category}
                  label={category}
                  isSelected={selectedCategory === category}
                  onClick={() => handleCategorySelect(category)}
                  size="medium"
                  layout="vertical"
                />
              ))}
            </div>
          )}
        </div>

        {/* Selection Info */}
        {selectedCategory && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Selected: {selectedCategory}</p>
                <p className="text-sm text-blue-700 mt-1">
                  You'll be able to choose a specific subcategory next.
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
            disabled={!selectedCategory}
            className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selectedCategory
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export default MarketCategoryModal;