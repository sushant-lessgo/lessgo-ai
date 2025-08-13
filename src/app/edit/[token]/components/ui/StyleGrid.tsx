// /app/edit/[token]/components/ui/StyleGrid.tsx
"use client";

import React, { useMemo, useState } from 'react';
import { StyleOption } from './StyleOption';
import { getBackgroundPreview } from './backgroundCompatibility';
import type { BackgroundVariation, BackgroundSelectorMode } from '@/types/core';

interface StyleGridProps {
  variations: BackgroundVariation[];
  selectedVariation?: BackgroundVariation | null;
  onVariationSelect: (variation: BackgroundVariation) => void;
  onVariationHover?: (variation: BackgroundVariation | null) => void;
  isLoading?: boolean;
  mode: BackgroundSelectorMode;
  searchQuery?: string;
  filterBy?: string;
}

interface FilterOption {
  id: string;
  label: string;
  count: number;
}

export function StyleGrid({
  variations,
  selectedVariation,
  onVariationSelect,
  onVariationHover,
  isLoading = false,
  mode,
  searchQuery = '',
  filterBy = 'all',
}: StyleGridProps) {
  console.log('📋 StyleGrid received variations:', variations?.length || 0, variations);
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'archetype' | 'color'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort variations
  const processedVariations = useMemo(() => {
    if (!variations || !Array.isArray(variations)) {
      return [];
    }
    let filtered = [...variations];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(variation =>
        variation.variationLabel.toLowerCase().includes(query) ||
        variation.archetypeId.toLowerCase().includes(query) ||
        variation.baseColor.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(variation => {
        switch (filterBy) {
          case 'gradients':
            return variation.tailwindClass?.includes('gradient');
          case 'solid':
            return variation.tailwindClass && !variation.tailwindClass.includes('gradient');
          case 'soft':
            return variation.archetypeId?.includes('soft') || variation.archetypeId?.includes('blur');
          case 'bold':
            return variation.archetypeId?.includes('energetic') || variation.archetypeId?.includes('vibrant');
          case 'professional':
            return variation.archetypeId?.includes('startup') || variation.archetypeId?.includes('trusty');
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.variationLabel.localeCompare(b.variationLabel);
        case 'archetype':
          return a.archetypeId.localeCompare(b.archetypeId);
        case 'color':
          return a.baseColor.localeCompare(b.baseColor);
        default:
          return 0; // Keep original order
      }
    });

    return filtered;
  }, [variations, searchQuery, filterBy, sortBy]);

  // Generate filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    if (!variations || !Array.isArray(variations)) {
      return [{ id: 'all', label: 'All Styles', count: 0 }];
    }
    const options = [
      { id: 'all', label: 'All Styles', count: variations.length },
      { 
        id: 'gradients', 
        label: 'Gradients', 
        count: variations.filter(v => v.tailwindClass?.includes('gradient')).length 
      },
      { 
        id: 'solid', 
        label: 'Solid Colors', 
        count: variations.filter(v => v.tailwindClass && !v.tailwindClass.includes('gradient')).length 
      },
    ];

    // Mode-specific filters
    if (mode === 'custom') {
      options.push(
        { 
          id: 'soft', 
          label: 'Soft & Subtle', 
          count: variations.filter(v => v.archetypeId.includes('soft') || v.archetypeId.includes('blur')).length 
        },
        { 
          id: 'bold', 
          label: 'Bold & Vibrant', 
          count: variations.filter(v => v.archetypeId.includes('energetic') || v.archetypeId.includes('vibrant')).length 
        },
        { 
          id: 'professional', 
          label: 'Professional', 
          count: variations.filter(v => v.archetypeId.includes('startup') || v.archetypeId.includes('trusty')).length 
        }
      );
    }

    return options.filter(option => option.count > 0);
  }, [variations, mode]);

  const handleVariationClick = (variation: BackgroundVariation) => {
    console.log('🕹️ [STYLEGRID DEBUG] handleVariationClick called with:', {
      variationId: variation.variationId,
      variationLabel: variation.variationLabel,
      tailwindClass: variation.tailwindClass,
      baseColor: variation.baseColor,
      archetypeId: variation.archetypeId,
      timestamp: new Date().toISOString()
    });
    onVariationSelect(variation);
  };

  const handleVariationHover = (variation: BackgroundVariation | null) => {
    onVariationHover?.(variation);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {processedVariations.length} style{processedVariations.length !== 1 ? 's' : ''}
          </span>
          {searchQuery && (
            <span className="text-xs text-gray-500">
              for "{searchQuery}"
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="default">Default Order</option>
            <option value="name">Sort by Name</option>
            <option value="archetype">Sort by Style</option>
            <option value="color">Sort by Color</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded text-xs ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid view"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded text-xs ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List view"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      {filterOptions.length > 1 && (
        <div className="flex items-center space-x-1 overflow-x-auto pb-1">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                // This would be passed up to parent component
                // setFilterBy(option.id)
              }}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${filterBy === option.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {option.label}
              <span className="ml-1 text-xs opacity-75">
                {option.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {processedVariations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 12l6 6m-6-6l6-6" />
            </svg>
          </div>
          <div className="text-gray-500 text-sm mb-1">No backgrounds found</div>
          <div className="text-gray-400 text-xs">
            {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
          </div>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {processedVariations.map((variation) => (
                <StyleOption
                  key={variation.variationId}
                  variation={variation}
                  isSelected={selectedVariation?.variationId === variation.variationId}
                  onClick={() => handleVariationClick(variation)}
                  onHover={() => handleVariationHover(variation)}
                  onHoverEnd={() => handleVariationHover(null)}
                  showDetails={false}
                  size="medium"
                />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {processedVariations.map((variation) => (
                <StyleOption
                  key={variation.variationId}
                  variation={variation}
                  isSelected={selectedVariation?.variationId === variation.variationId}
                  onClick={() => handleVariationClick(variation)}
                  onHover={() => handleVariationHover(variation)}
                  onHoverEnd={() => handleVariationHover(null)}
                  showDetails={true}
                  size="large"
                  layout="horizontal"
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Load More (for future pagination) */}
      {processedVariations.length >= 20 && (
        <div className="text-center pt-4">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Load More Styles
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact grid for smaller spaces
 */
interface CompactStyleGridProps {
  variations: BackgroundVariation[];
  selectedVariation?: BackgroundVariation | null;
  onVariationSelect: (variation: BackgroundVariation) => void;
  maxItems?: number;
}

export function CompactStyleGrid({
  variations,
  selectedVariation,
  onVariationSelect,
  maxItems = 6,
}: CompactStyleGridProps) {
  if (!variations || !Array.isArray(variations)) {
    return <div className="text-center text-gray-500 text-sm">No variations available</div>;
  }
  const displayVariations = variations.slice(0, maxItems);

  return (
    <div className="grid grid-cols-3 gap-2">
      {displayVariations.map((variation) => (
        <StyleOption
          key={variation.variationId}
          variation={variation}
          isSelected={selectedVariation?.variationId === variation.variationId}
          onClick={() => onVariationSelect(variation)}
          showDetails={false}
          size="small"
        />
      ))}
      
      {variations.length > maxItems && (
        <div className="col-span-3 text-center pt-2">
          <div className="text-xs text-gray-500">
            +{variations.length - maxItems} more styles
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Style grid with category sections
 */
interface CategorizedStyleGridProps {
  variations: BackgroundVariation[];
  selectedVariation?: BackgroundVariation | null;
  onVariationSelect: (variation: BackgroundVariation) => void;
  groupBy: 'archetype' | 'color' | 'theme';
}

export function CategorizedStyleGrid({
  variations,
  selectedVariation,
  onVariationSelect,
  groupBy,
}: CategorizedStyleGridProps) {
  const groupedVariations = useMemo(() => {
    if (!variations || !Array.isArray(variations)) {
      return {};
    }
    const groups: Record<string, BackgroundVariation[]> = {};
    
    variations.forEach((variation) => {
      let key: string;
      switch (groupBy) {
        case 'archetype':
          key = variation.archetypeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          break;
        case 'color':
          key = variation.baseColor.charAt(0).toUpperCase() + variation.baseColor.slice(1);
          break;
        case 'theme':
          key = variation.themeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          break;
        default:
          key = 'Other';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(variation);
    });
    
    return groups;
  }, [variations, groupBy]);

  const sortedGroupKeys = Object.keys(groupedVariations).sort();

  return (
    <div className="space-y-6">
      {sortedGroupKeys.map((groupKey) => (
        <div key={groupKey} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">{groupKey}</h3>
            <span className="text-xs text-gray-500">
              {groupedVariations[groupKey].length} style{groupedVariations[groupKey].length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {groupedVariations[groupKey].map((variation) => (
              <StyleOption
                key={variation.variationId}
                variation={variation}
                isSelected={selectedVariation?.variationId === variation.variationId}
                onClick={() => onVariationSelect(variation)}
                showDetails={false}
                size="medium"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}