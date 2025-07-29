// SimpleCustomColorPicker.tsx - Simple custom color picker with real-time scoring
"use client";

import React, { useState, useCallback } from 'react';
import type { ColorOption } from './ColorSystemModalMVP';
import { validateWCAGContrast } from '@/utils/improvedTextColors';

interface SimpleCustomColorPickerProps {
  backgroundColor: string;
  onSelect: (color: ColorOption) => void;
  onClose: () => void;
}

export function SimpleCustomColorPicker({ backgroundColor, onSelect, onClose }: SimpleCustomColorPickerProps) {
  const [hexColor, setHexColor] = useState('#3b82f6');
  
  // Calculate score in real-time
  const calculateScore = useCallback((color: string) => {
    try {
      const { ratio } = validateWCAGContrast(color, backgroundColor);
      
      if (ratio >= 15) return 95 + Math.min(5, (ratio - 15) * 0.5);
      if (ratio >= 7) return 70 + ((ratio - 7) / 8) * 25;
      if (ratio >= 4.5) return 50 + ((ratio - 4.5) / 2.5) * 20;
      return Math.max(0, (ratio / 4.5) * 50);
    } catch {
      return 0;
    }
  }, [backgroundColor]);
  
  const currentScore = calculateScore(hexColor);
  
  const getScoreMessage = (score: number) => {
    if (score >= 90) return { text: 'Perfect! Will really pop ✨', color: 'text-green-600' };
    if (score >= 70) return { text: 'Great visibility ✅', color: 'text-emerald-600' };
    if (score >= 50) return { text: 'Good contrast 👍', color: 'text-yellow-600' };
    return { text: 'Might blend in ⚠️', color: 'text-orange-600' };
  };
  
  const scoreMessage = getScoreMessage(currentScore);
  
  const handleApply = () => {
    const colorOption: ColorOption = {
      name: 'Custom',
      value: 'custom',
      tailwindClass: hexColor, // Use hex directly for custom colors
      hex: hexColor,
    };
    
    onSelect(colorOption);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Custom Color</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Color Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose your color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={hexColor}
                onChange={(e) => setHexColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={hexColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                    setHexColor(value);
                  }
                }}
                placeholder="#3b82f6"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Live Preview */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Preview</h4>
            <div className="p-4 rounded-lg" style={{ backgroundColor: backgroundColor }}>
              <button
                className="px-6 py-2.5 text-white font-medium rounded-lg shadow-sm"
                style={{ backgroundColor: hexColor }}
              >
                Get Started
              </button>
            </div>
          </div>
          
          {/* Real-time Score */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Visibility Score</span>
              <span className="text-2xl font-bold text-gray-900">{Math.round(currentScore)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-orange-400 to-green-500"
                style={{ width: `${Math.min(100, currentScore)}%` }}
              />
            </div>
            <p className={`text-sm font-medium ${scoreMessage.color}`}>
              {scoreMessage.text}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                currentScore < 50
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {currentScore < 50 ? 'Use Anyway' : 'Use This Color'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}