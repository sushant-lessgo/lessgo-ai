// app/edit/[token]/components/content/ElementPicker.tsx - Element selection interface

import React, { useMemo, useCallback } from 'react';
import { useUniversalElements } from '@/hooks/useUniversalElements';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import type { UniversalElementType, UniversalElementConfig } from '@/types/universalElements';
import type { ElementPickerOptions } from '@/types/elementRestrictions';
import { filterElementsByRestrictions } from '@/utils/elementRestrictions';

interface ElementPickerProps {
  sectionId: string;
  isVisible: boolean;
  position: { x: number; y: number };
  onElementSelect: (elementType: UniversalElementType) => void;
  onClose: () => void;
  options?: ElementPickerOptions & {
    position?: number;
    insertMode?: 'append' | 'prepend' | 'after' | 'before';
    referenceElementKey?: string;
    autoFocus?: boolean;
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

  const { elementConfigs } = useUniversalElements();
  const { announceLiveRegion, content } = useEditStore();
  
  // Get section information for restrictions
  const sectionData = content[sectionId];
  const sectionType = sectionId || 'content';
  const layoutType = sectionData?.layout;

  // Get available elements (filtered by restrictions)
  const availableElements = useMemo(() => {
    let elements = Object.values(elementConfigs);
    
    // Apply restriction filtering based on section/layout
    elements = filterElementsByRestrictions(elements, sectionType, layoutType);
    
    // Apply additional filters from options
    if (options?.excludeTypes && options.excludeTypes.length > 0) {
      elements = elements.filter(el => !options.excludeTypes!.includes(el.type));
    }
    
    return elements;
  }, [elementConfigs, sectionType, layoutType, options?.excludeTypes]);


  // Handle element selection
  const handleElementSelect = useCallback((elementType: UniversalElementType) => {
    onElementSelect(elementType);
    announceLiveRegion(`Added ${elementConfigs[elementType].label} element`);
  }, [onElementSelect, elementConfigs, announceLiveRegion]);

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
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Add Element</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>


        {/* Elements List */}
        <div className="p-3">
          {availableElements.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">No elements can be added to this section</p>
            </div>
          ) : (
            <div className="space-y-1">
              {availableElements.map((config) => (
                <button
                  key={config.type}
                  onClick={() => handleElementSelect(config.type)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                    <ElementIcon icon={config.icon} className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{config.label}</div>
                    <div className="text-xs text-gray-500">{config.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
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