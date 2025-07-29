// ColorRegenerate.tsx - Smart color regeneration using existing color harmony system
"use client";

import React, { useState, useEffect } from 'react';
import { generateAccentCandidates } from '@/utils/colorHarmony';
import type { ColorOption } from './ColorSystemModalMVP';

// Helper function to determine color name from hex
function getColorNameFromHex(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'gray';
  
  const { r, g, b } = rgb;
  
  // Simple color detection based on dominant channels
  if (r > g && r > b) {
    if (g > 100) return 'orange';
    if (b > 100) return 'pink';
    return 'red';
  }
  if (g > r && g > b) {
    if (b > 100) return 'teal';
    return 'green';
  }
  if (b > r && b > g) {
    if (r > 100) return 'purple';
    if (g > 100) return 'indigo';
    return 'blue';
  }
  
  // Balanced colors
  if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
    return 'gray';
  }
  
  return 'purple'; // Default fallback
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

interface ColorRegenerateProps {
  currentBackground: string;
  baseColor: string;
  onSelect: (color: ColorOption) => void;
  onPreview: (color: ColorOption) => void;
  onPreviewEnd: () => void;
}

export function ColorRegenerate({ 
  currentBackground, 
  baseColor, 
  onSelect, 
  onPreview, 
  onPreviewEnd 
}: ColorRegenerateProps) {
  const [candidates, setCandidates] = useState<ColorOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateCandidates();
  }, [baseColor, currentBackground]);

  const generateCandidates = () => {
    setIsGenerating(true);
    
    try {
      // Use the smart color harmony system
      const businessContext = {
        industry: 'tech', // TODO: Get from user context
        tone: 'professional' as const
      };
      
      const rawCandidates = generateAccentCandidates(baseColor, businessContext);
      
      // Convert to ColorOption format and take top 3
      const colorOptions: ColorOption[] = rawCandidates.slice(0, 3).map((candidate, index) => {
        // Determine color name from hex
        const colorName = getColorNameFromHex(candidate.hex);
        return {
          name: `${candidate.harmonyType.charAt(0).toUpperCase() + candidate.harmonyType.slice(1)} ${colorName}`,
          value: colorName,
          tailwindClass: `bg-${colorName}-600`, // Generate Tailwind class
          hex: candidate.hex
        };
      });
      
      setCandidates(colorOptions);
    } catch (error) {
      console.error('Error generating color candidates:', error);
      // Fallback candidates
      setCandidates([
        { name: 'Complementary Purple', value: 'purple', tailwindClass: 'bg-purple-600', hex: '#9333ea' },
        { name: 'Triadic Green', value: 'green', tailwindClass: 'bg-green-600', hex: '#16a34a' },
        { name: 'Analogous Blue', value: 'blue', tailwindClass: 'bg-blue-600', hex: '#2563eb' }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerate = () => {
    generateCandidates();
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Generating smart color options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">
          Colors optimized for your current background
        </p>
        <button
          onClick={regenerate}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Regenerate
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {candidates.map((color, index) => (
          <button
            key={`${color.value}-${index}`}
            onClick={() => onSelect(color)}
            onMouseEnter={() => onPreview(color)}
            onMouseLeave={onPreviewEnd}
            className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 bg-white transition-all"
          >
            {/* Color swatch */}
            <div className={`w-full h-16 rounded-md ${color.tailwindClass} mb-3 shadow-sm`} />
            
            {/* Color info */}
            <div className="text-left">
              <p className="text-xs font-medium text-gray-700 mb-1">{color.name}</p>
              <p className="text-xs text-gray-500">{color.hex}</p>
            </div>
            
            {/* Harmony type badge */}
            <div className="mt-2 flex items-center justify-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {color.name.split(' ')[0]}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          Generated using color harmony theory for optimal visual balance
        </p>
      </div>
    </div>
  );
}