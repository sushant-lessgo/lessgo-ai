// /app/edit/[token]/components/ui/StyleGrid.tsx
"use client";

import React, { useMemo, useState } from 'react';
import { StyleOption } from './StyleOption';
import { getBackgroundPreview } from './backgroundCompatibility';
import type { BackgroundVariation, BackgroundSelectorMode } from '@/types/core';

import { logger } from '@/lib/logger';
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
  logger.debug('📋 StyleGrid received variations:', { count: variations?.length || 0, variations });

  // Simplified: just limit to 6 variations
  const processedVariations = useMemo(() => {
    if (!variations || !Array.isArray(variations)) {
      return [];
    }
    // Return first 6 variations only
    return variations.slice(0, 6);
  }, [variations]);

  const handleVariationClick = (variation: BackgroundVariation) => {
    logger.debug('🕹️ [STYLEGRID DEBUG] handleVariationClick called with:', {
      id: variation.id,
      label: variation.label,
      css: variation.css,
      baseColor: variation.baseColor,
      category: variation.category,
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Simple header showing count */}
      <div className="text-sm text-gray-500 mb-4">
        {processedVariations.length} curated style{processedVariations.length !== 1 ? 's' : ''}
      </div>

      {/* Grid View Only */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {processedVariations.map((variation) => (
          <StyleOption
            key={variation.id}
            variation={variation}
            isSelected={selectedVariation?.id === variation.id}
            onClick={() => handleVariationClick(variation)}
            onHover={() => handleVariationHover(variation)}
            onHoverEnd={() => handleVariationHover(null)}
            showDetails={false}
            size="medium"
          />
        ))}
      </div>
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
          key={variation.id}
          variation={variation}
          isSelected={selectedVariation?.id === variation.id}
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
  groupBy: 'category' | 'color';
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
        case 'category':
          key = variation.category.charAt(0).toUpperCase() + variation.category.slice(1);
          break;
        case 'color':
          key = variation.baseColor.charAt(0).toUpperCase() + variation.baseColor.slice(1);
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
                key={variation.id}
                variation={variation}
                isSelected={selectedVariation?.id === variation.id}
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