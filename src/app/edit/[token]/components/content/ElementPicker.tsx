// app/edit/[token]/components/content/ElementPicker.tsx - Element selection interface

import React, { useState, useMemo, useCallback } from 'react';
import { useUniversalElements } from '@/hooks/useUniversalElements';
import { useEditStore } from '@/hooks/useEditStore';
import type { UniversalElementType, UniversalElementConfig } from '@/types/universalElements';

interface ElementPickerProps {
  sectionId: string;
  isVisible: boolean;
  position: { x: number; y: number };
  onElementSelect: (elementType: UniversalElementType) => void;
  onClose: () => void;
  options?: {
    position?: number;
    insertMode?: 'append' | 'prepend' | 'after' | 'before';
    referenceElementKey?: string;
    autoFocus?: boolean;
    categories?: Array<'text' | 'interactive' | 'media' | 'layout'>;
    excludeTypes?: UniversalElementType[];
  };
}

export function ElementPicker({
  sectionId,
  isVisible,
  position,
  onElementSelect,
  onClose,
  options = {}
}: ElementPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredElement, setHoveredElement] = useState<UniversalElementType | null>(null);
  const [recentElements, setRecentElements] = useState<UniversalElementType[]>(['text', 'button', 'headline']);
  const [favoriteElements, setFavoriteElements] = useState<UniversalElementType[]>(['headline', 'text']);

  const { elementConfigs } = useUniversalElements();
  const { announceLiveRegion } = useEditStore();

  // Filter elements based on search, category, and options
  const filteredElements = useMemo(() => {
    let elements = Object.values(elementConfigs);

    // Apply category filter from options
    if (options.categories && options.categories.length > 0) {
      elements = elements.filter(el => options.categories!.includes(el.category));
    }

    // Apply exclude filter from options
    if (options.excludeTypes && options.excludeTypes.length > 0) {
      elements = elements.filter(el => !options.excludeTypes!.includes(el.type));
    }

    // Apply selected category filter
    if (selectedCategory !== 'all') {
      elements = elements.filter(el => el.category === selectedCategory);
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      elements = elements.filter(el =>
        el.label.toLowerCase().includes(query) ||
        el.description.toLowerCase().includes(query) ||
        el.type.toLowerCase().includes(query)
      );
    }

    return elements;
  }, [elementConfigs, selectedCategory, searchQuery, options.categories, options.excludeTypes]);

  // Get recommended elements based on section content
  const recommendedElements = useMemo(() => {
    // This could be enhanced with AI-based recommendations
    // For now, return common elements based on what's already in the section
    return [
      elementConfigs.text,
      elementConfigs.button,
      elementConfigs.image,
    ].filter(config => !options.excludeTypes?.includes(config.type));
  }, [elementConfigs, options.excludeTypes]);

  // Handle element selection
  const handleElementSelect = useCallback((elementType: UniversalElementType) => {
    // Add to recent elements
    setRecentElements(prev => {
      const updated = [elementType, ...prev.filter(type => type !== elementType)];
      return updated.slice(0, 5); // Keep only last 5
    });

    onElementSelect(elementType);
    announceLiveRegion(`Selected ${elementConfigs[elementType].label} element`);
  }, [onElementSelect, elementConfigs, announceLiveRegion]);

  // Toggle favorite
  const toggleFavorite = useCallback((elementType: UniversalElementType) => {
    setFavoriteElements(prev => {
      if (prev.includes(elementType)) {
        return prev.filter(type => type !== elementType);
      } else {
        return [...prev, elementType];
      }
    });
  }, []);

  // Get available categories
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    Object.values(elementConfigs).forEach(config => {
      if (!options.categories || options.categories.includes(config.category)) {
        if (!options.excludeTypes || !options.excludeTypes.includes(config.type)) {
          categories.add(config.category);
        }
      }
    });
    return Array.from(categories);
  }, [elementConfigs, options.categories, options.excludeTypes]);

  if (!isVisible) return null;

  return (
    <div 
      className="element-picker-overlay fixed inset-0 z-50 bg-black bg-opacity-20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="element-picker bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        style={{
          left: Math.min(position.x, window.innerWidth - 400),
          top: Math.min(position.y, window.innerHeight - 500),
          width: 380,
          maxHeight: 480,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Add Element</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choose an element to add to your section</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            aria-label="Close element picker"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Search elements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus={options.autoFocus}
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap gap-1 p-3 border-b border-gray-100">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 280 }}>
          {/* Recent Elements */}
          {!searchQuery && recentElements.length > 0 && selectedCategory === 'all' && (
            <div className="p-3 border-b border-gray-100">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Recently Used</h4>
              <div className="flex flex-wrap gap-2">
                {recentElements.slice(0, 3).map((elementType) => {
                  const config = elementConfigs[elementType];
                  if (!config) return null;
                  
                  return (
                    <button
                      key={elementType}
                      onClick={() => handleElementSelect(elementType)}
                      className="flex items-center gap-2 px-3 py-2 text-xs bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 rounded-lg transition-colors"
                    >
                      <ElementIcon icon={config.icon} className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-700">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Elements */}
          {!searchQuery && selectedCategory === 'all' && (
            <div className="p-3 border-b border-gray-100">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Recommended</h4>
              <div className="grid grid-cols-1 gap-1">
                {recommendedElements.slice(0, 3).map((config) => (
                  <ElementCard
                    key={config.type}
                    config={config}
                    onClick={() => handleElementSelect(config.type)}
                    onMouseEnter={() => setHoveredElement(config.type)}
                    onMouseLeave={() => setHoveredElement(null)}
                    isFavorite={favoriteElements.includes(config.type)}
                    onToggleFavorite={() => toggleFavorite(config.type)}
                    isCompact
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Elements Grid */}
          <div className="p-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              {searchQuery ? `Search Results (${filteredElements.length})` : 'All Elements'}
            </h4>
            
            {filteredElements.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.881-6.08 2.33l-.926-.924A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10a9.933 9.933 0 01-2.254 6.33l-.924.924A7.96 7.96 0 0117 15.001c-.34 0-.677.022-1 .065z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No elements found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {filteredElements.map((config) => (
                  <ElementCard
                    key={config.type}
                    config={config}
                    onClick={() => handleElementSelect(config.type)}
                    onMouseEnter={() => setHoveredElement(config.type)}
                    onMouseLeave={() => setHoveredElement(null)}
                    isFavorite={favoriteElements.includes(config.type)}
                    onToggleFavorite={() => toggleFavorite(config.type)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {hoveredElement && (
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-600 mb-2">Preview:</div>
            <div 
              className="text-sm bg-white p-2 rounded border"
              dangerouslySetInnerHTML={{ 
                __html: elementConfigs[hoveredElement].previewTemplate 
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Element Card Component
interface ElementCardProps {
  config: UniversalElementConfig;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isCompact?: boolean;
}

function ElementCard({
  config,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isFavorite,
  onToggleFavorite,
  isCompact = false
}: ElementCardProps) {
  return (
    <div
      className="group flex items-center gap-3 p-2 hover:bg-blue-50 hover:border-blue-200 border border-transparent rounded-lg cursor-pointer transition-all duration-150"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors">
        <ElementIcon icon={config.icon} className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{config.label}</span>
          {!isCompact && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {config.category}
            </span>
          )}
        </div>
        {!isCompact && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{config.description}</p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`p-1 rounded transition-colors ${
          isFavorite 
            ? 'text-yellow-500 hover:text-yellow-600' 
            : 'text-gray-400 hover:text-yellow-500'
        }`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg className="w-3 h-3" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
    </div>
  );
}

// Element Icon Component
function ElementIcon({ icon, className = "w-4 h-4" }: { icon: string; className?: string }) {
  const iconMap: Record<string, JSX.Element> = {
    'type': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    'heading': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    'list': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    'mouse-pointer': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    'link': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    'image': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    'star': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    'more-horizontal': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
    'box': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  };

  return iconMap[icon] || (
    <div className={`${className} bg-gray-400 rounded-sm`} />
  );
}