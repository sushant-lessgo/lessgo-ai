// /app/edit/[token]/components/ui/typography/FontThemeOption.tsx
import React from 'react';
import { FontPreviewText } from './FontPreviewText';
import { generateFontPairName } from './typographyCompatibility';
import type { FontTheme } from '@/types/core/index';

interface FontThemeOptionProps {
  theme: FontTheme;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function FontThemeOption({ 
  theme, 
  isSelected, 
  onClick, 
  onMouseEnter, 
  onMouseLeave 
}: FontThemeOptionProps) {
  const fontPairName = generateFontPairName(theme);
  
  return (
    <button
      className={`
        w-full p-3 rounded-lg border text-left transition-all hover:bg-gray-50
        ${isSelected 
          ? 'border-blue-200 bg-blue-50 ring-1 ring-blue-200' 
          : 'border-gray-200 bg-white'
        }
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div className={`
          w-2 h-2 rounded-full 
          ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}
        `} />
        <span className="text-sm font-medium text-gray-700">
          {fontPairName}
        </span>
      </div>
      
      <FontPreviewText theme={theme} size="small" />
    </button>
  );
}