// Variable Style Grid - Enhanced StyleGrid with CSS variable support
// Supports both legacy variations and variable background variations

"use client";

import React, { useMemo, useState } from 'react';
import { StyleOption } from './StyleOption';
import { VariableBackgroundVariation } from '@/modules/Design/ColorSystem/VariableBackgroundRenderer';
import { getBackgroundPreview } from './backgroundCompatibility';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Grid, List, Filter, SortAsc, Search, Code, Palette, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BackgroundVariation, BackgroundSelectorMode } from '@/types/core';
import type { VariableBackgroundVariation as VarBgVariation } from '@/modules/Design/ColorSystem/migrationAdapter';

interface VariableStyleGridProps {
  options: (BackgroundVariation | VarBgVariation)[];
  selectedVariation?: (BackgroundVariation | VarBgVariation) | null;
  onSelect: (variation: BackgroundVariation | VarBgVariation) => void;
  onHover?: (variation: BackgroundVariation | VarBgVariation | null) => void;
  isLoading?: boolean;
  useVariableRenderer?: boolean;
  tokenId: string;
  customColors?: Record<string, string>;
  mode?: BackgroundSelectorMode;
  searchQuery?: string;
  filterBy?: string;
}

interface FilterOption {
  id: string;
  label: string;
  count: number;
  icon?: React.ReactNode;
}

export function VariableStyleGrid({
  options,
  selectedVariation,
  onSelect,
  onHover,
  isLoading = false,
  useVariableRenderer = false,
  tokenId,
  customColors = {},
  mode = 'recommended',
  searchQuery: initialSearchQuery = '',
  filterBy: initialFilterBy = 'all',
}: VariableStyleGridProps) {
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'archetype' | 'color' | 'complexity'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterBy, setFilterBy] = useState(initialFilterBy);
  const [showVariableInfo, setShowVariableInfo] = useState(false);

  // Categorize options by type
  const categorizedOptions = useMemo(() => {
    const legacy: BackgroundVariation[] = [];
    const variable: VarBgVariation[] = [];
    
    options.forEach(option => {
      if ('structuralClass' in option) {
        variable.push(option as VarBgVariation);
      } else {
        legacy.push(option as BackgroundVariation);
      }
    });
    
    return { legacy, variable };
  }, [options]);

  // Filter and sort variations
  const processedOptions = useMemo(() => {
    if (!options || !Array.isArray(options)) {
      return [];
    }
    
    let filtered = [...options];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(option => {
        const label = option.variationLabel.toLowerCase();
        const archetype = option.archetypeId.toLowerCase();
        const baseColor = option.baseColor.toLowerCase();
        
        // Check if it's a variable variation for additional search fields
        if ('structuralClass' in option) {
          const varOption = option as VarBgVariation;
          const structural = varOption.structuralClass.toLowerCase();
          return label.includes(query) || archetype.includes(query) || 
                 baseColor.includes(query) || structural.includes(query);
        }
        
        const legacyOption = option as BackgroundVariation;
        const tailwindClass = legacyOption.tailwindClass.toLowerCase();
        return label.includes(query) || archetype.includes(query) || 
               baseColor.includes(query) || tailwindClass.includes(query);
      });
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(option => {
        const isVariable = 'structuralClass' in option;
        
        switch (filterBy) {
          case 'variable':
            return isVariable;
          case 'legacy':
            return !isVariable;
          case 'gradients':
            if (isVariable) {
              const varOption = option as VarBgVariation;
              return varOption.structuralClass.includes('gradient');
            } else {
              const legacyOption = option as BackgroundVariation;
              return legacyOption.tailwindClass.includes('gradient');
            }
          case 'solid':
            if (isVariable) {
              const varOption = option as VarBgVariation;
              return varOption.structuralClass.includes('pattern');
            } else {
              const legacyOption = option as BackgroundVariation;
              return !legacyOption.tailwindClass.includes('gradient');
            }
          case 'high-complexity':
            return isVariable && (option as VarBgVariation).complexity === 'high';
          case 'low-complexity':
            return isVariable && (option as VarBgVariation).complexity === 'low';
          case 'migrated':
            return isVariable && !(option as VarBgVariation).legacyOnly;
          case 'legacy-only':
            return isVariable && (option as VarBgVariation).legacyOnly;
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
        case 'complexity':
          if ('complexity' in a && 'complexity' in b) {
            const complexityOrder = { low: 0, medium: 1, high: 2 };
            return complexityOrder[a.complexity] - complexityOrder[b.complexity];
          }
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [options, searchQuery, filterBy, sortBy]);

  // Generate filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    if (!options || !Array.isArray(options)) {
      return [{ id: 'all', label: 'All Styles', count: 0 }];
    }
    
    const baseOptions = [
      { 
        id: 'all', 
        label: 'All Styles', 
        count: options.length,
        icon: <Sparkles className="w-3 h-3" />
      },
    ];
    
    // Add variable/legacy filters if we have mixed content
    if (categorizedOptions.variable.length > 0 && categorizedOptions.legacy.length > 0) {
      baseOptions.push(
        { 
          id: 'variable', 
          label: 'Variable Mode', 
          count: categorizedOptions.variable.length,
          icon: <Code className="w-3 h-3" />
        },
        { 
          id: 'legacy', 
          label: 'Legacy Mode', 
          count: categorizedOptions.legacy.length,
          icon: <Palette className="w-3 h-3" />
        }
      );
    }
    
    // Pattern-based filters
    const gradientCount = options.filter(opt => {
      if ('structuralClass' in opt) {
        return opt.structuralClass.includes('gradient');
      } else {
        return opt.tailwindClass.includes('gradient');
      }
    }).length;
    
    if (gradientCount > 0) {
      baseOptions.push({ 
        id: 'gradients', 
        label: 'Gradients', 
        count: gradientCount 
      });
    }
    
    const solidCount = options.length - gradientCount;
    if (solidCount > 0) {
      baseOptions.push({ 
        id: 'solid', 
        label: 'Solid Colors', 
        count: solidCount 
      });
    }
    
    // Variable-specific filters
    if (categorizedOptions.variable.length > 0) {
      const highComplexity = categorizedOptions.variable.filter(v => v.complexity === 'high').length;
      const lowComplexity = categorizedOptions.variable.filter(v => v.complexity === 'low').length;
      const migrated = categorizedOptions.variable.filter(v => !v.legacyOnly).length;
      const legacyOnly = categorizedOptions.variable.filter(v => v.legacyOnly).length;
      
      if (highComplexity > 0) {
        baseOptions.push({ id: 'high-complexity', label: 'Complex', count: highComplexity });
      }
      if (lowComplexity > 0) {
        baseOptions.push({ id: 'low-complexity', label: 'Simple', count: lowComplexity });
      }
      if (migrated > 0) {
        baseOptions.push({ id: 'migrated', label: 'Migrated', count: migrated });
      }
      if (legacyOnly > 0) {
        baseOptions.push({ id: 'legacy-only', label: 'Legacy Only', count: legacyOnly });
      }
    }

    return baseOptions.filter(option => option.count > 0);
  }, [options, categorizedOptions]);

  const handleVariationClick = (variation: BackgroundVariation | VarBgVariation) => {
    onSelect(variation);
  };

  const handleVariationHover = (variation: BackgroundVariation | VarBgVariation | null) => {
    onHover?.(variation);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-video bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (processedOptions.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No backgrounds found</p>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </div>
        {searchQuery && (
          <Button
            variant="outline"
            onClick={() => setSearchQuery('')}
            className="mt-4"
          >
            Clear search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats and variable info toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {processedOptions.length} of {options.length} backgrounds
          </span>
          {categorizedOptions.variable.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {categorizedOptions.variable.length} Variable
            </Badge>
          )}
          {categorizedOptions.legacy.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {categorizedOptions.legacy.length} Legacy
            </Badge>
          )}
        </div>
        
        {categorizedOptions.variable.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVariableInfo(!showVariableInfo)}
            className="text-xs"
          >
            <Code className="w-3 h-3 mr-1" />
            Variable Info
          </Button>
        )}
      </div>

      {/* Variable info panel */}
      {showVariableInfo && categorizedOptions.variable.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
          <div className="text-sm space-y-2">
            <div className="font-medium text-blue-800 dark:text-blue-200">
              CSS Variable Migration Status
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>Total Variable: {categorizedOptions.variable.length}</div>
              <div>Migrated: {categorizedOptions.variable.filter(v => !v.legacyOnly).length}</div>
              <div>Legacy Only: {categorizedOptions.variable.filter(v => v.legacyOnly).length}</div>
              <div>With Warnings: {categorizedOptions.variable.filter(v => v.migrationWarnings?.length).length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search backgrounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter */}
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map(option => (
              <SelectItem key={option.id} value={option.id}>
                <div className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                  <span className="text-xs text-gray-500">({option.count})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SortAsc className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="archetype">Type</SelectItem>
            <SelectItem value="color">Color</SelectItem>
            {categorizedOptions.variable.length > 0 && (
              <SelectItem value="complexity">Complexity</SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-none px-3"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-none px-3"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
          : "space-y-2"
      }>
        {processedOptions.map((option, index) => {
          const isSelected = selectedVariation?.variationId === option.variationId;
          const isVariable = 'structuralClass' in option;
          
          if (useVariableRenderer && isVariable) {
            return (
              <VariableBackgroundVariation
                key={`${option.variationId}-${index}`}
                variation={option as VarBgVariation}
                tokenId={tokenId}
                customColors={customColors}
                className={`
                  relative aspect-video rounded-lg border cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'ring-2 ring-blue-500 border-blue-200' 
                    : 'hover:border-gray-300 hover:shadow-md'
                  }
                  ${viewMode === 'list' ? 'aspect-[3/1]' : 'aspect-video'}
                `}
                onClick={() => handleVariationClick(option)}
                selected={isSelected}
              >
                <div className="absolute inset-0 flex items-end p-2">
                  <div className="bg-white/90 backdrop-blur-sm rounded px-2 py-1">
                    <div className="text-xs font-medium truncate">
                      {option.variationLabel}
                    </div>
                    {isVariable && (
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs py-0">
                          Variable
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs py-0 ${
                            (option as VarBgVariation).complexity === 'high' ? 'border-orange-200 text-orange-700' :
                            (option as VarBgVariation).complexity === 'medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-green-200 text-green-700'
                          }`}
                        >
                          {(option as VarBgVariation).complexity}
                        </Badge>
                        {(option as VarBgVariation).legacyOnly && (
                          <Badge variant="destructive" className="text-xs py-0">
                            Legacy Only
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </VariableBackgroundVariation>
            );
          } else {
            // Legacy rendering with StyleOption
            const legacyOption = option as BackgroundVariation;
            return (
              <StyleOption
                key={`${legacyOption.variationId}-${index}`}
                variation={legacyOption}
                isSelected={isSelected}
                onClick={() => handleVariationClick(legacyOption)}
                onHover={(variation) => handleVariationHover(variation)}
                preview={getBackgroundPreview(legacyOption)}
                className={viewMode === 'list' ? 'aspect-[3/1]' : 'aspect-video'}
              />
            );
          }
        })}
      </div>
    </div>
  );
}