// ColorPresets.tsx - Smart color recommendations + all options
"use client";

import React, { useState, useMemo } from 'react';
import type { ColorOption } from './ColorSystemModalMVP';
import { getColorRecommendations, getStandardPresets } from './colorRecommendations';
import { SimpleCustomColorPicker } from './SimpleCustomColorPicker';

interface ColorPresetsProps {
  currentColor: string;
  backgroundColor: string;
  onSelect: (color: ColorOption) => void;
  onPreview: (color: ColorOption) => void;
  onPreviewEnd: () => void;
}

interface ColorButtonProps {
  color: ColorOption;
  isSelected: boolean;
  score?: number;
  reason?: string;
  onSelect: () => void;
  onPreview: () => void;
  onPreviewEnd: () => void;
}

function ColorButton({ color, isSelected, score, reason, onSelect, onPreview, onPreviewEnd }: ColorButtonProps) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onPreview}
      onMouseLeave={onPreviewEnd}
      className={`relative p-3 rounded-lg border-2 transition-all group ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
      }`}
    >
      {/* Color swatch */}
      <div className={`w-full h-10 rounded-md ${color.tailwindClass} mb-2 shadow-sm`} />
      
      {/* Color name */}
      <span className="text-xs font-medium text-gray-700 block">{color.name}</span>
      
      {/* Score indicator for recommended colors */}
      {score && score >= 85 && (
        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {Math.round(score)}%
        </div>
      )}
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {/* Tooltip for reason */}
      {reason && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {reason}
        </div>
      )}
    </button>
  );
}

export function ColorPresets({ currentColor, backgroundColor, onSelect, onPreview, onPreviewEnd }: ColorPresetsProps) {
  const [showAllColors, setShowAllColors] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  const { recommended, allColors } = useMemo(() => 
    getColorRecommendations(backgroundColor, currentColor), 
    [backgroundColor, currentColor]
  );
  
  const standardPresets = useMemo(() => getStandardPresets(), []);
  
  return (
    <div className="space-y-8">
      {/* Recommended Colors Section */}
      {recommended.length > 0 && (
        <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border border-green-200/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center">
              <span className="text-green-600 mr-2 text-base">✨</span>
              Recommended for your background
            </h4>
            <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full font-medium">
              {recommended.length} high-visibility options
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {recommended.map((color) => (
              <ColorButton
                key={`${color.tailwindClass}-rec`}
                color={color}
                isSelected={color.value === currentColor}
                score={color.score}
                reason={color.reason}
                onSelect={() => onSelect(color)}
                onPreview={() => onPreview(color)}
                onPreviewEnd={onPreviewEnd}
              />
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-green-700 font-medium">
              🎯 These colors score 85%+ visibility on your background
            </p>
          </div>
        </div>
      )}
      
      {/* All Colors Section */}
      <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800">All Colors</h4>
          <button
            onClick={() => setShowAllColors(!showAllColors)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
          >
            {showAllColors ? 'Show less' : `Show ${allColors.length - 8} more options`}
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {/* Show standard presets first */}
          {(showAllColors ? allColors : standardPresets).map((color) => (
            <ColorButton
              key={`${color.tailwindClass}-all`}
              color={color}
              isSelected={color.value === currentColor}
              onSelect={() => onSelect(color)}
              onPreview={() => onPreview(color)}
              onPreviewEnd={onPreviewEnd}
            />
          ))}
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Classic color palette with various contrast levels
          </p>
        </div>
      </div>
      
      {/* Custom Color Option */}
      <div className="bg-gradient-to-r from-blue-50/30 to-purple-50/30 border-2 border-dashed border-blue-300/60 rounded-xl p-4">
        <button
          onClick={() => setShowCustomPicker(true)}
          className="w-full py-4 px-4 text-sm text-gray-700 hover:text-blue-700 transition-colors flex items-center justify-center space-x-2 group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">🎨</span>
          <span className="font-medium">Need a custom shade? Click here</span>
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Pick any color with real-time visibility scoring
        </p>
      </div>
      
      {/* Custom Color Picker Modal */}
      {showCustomPicker && (
        <SimpleCustomColorPicker
          backgroundColor={backgroundColor}
          onSelect={(color) => {
            onSelect(color);
            setShowCustomPicker(false);
          }}
          onClose={() => setShowCustomPicker(false)}
        />
      )}
    </div>
  );
}