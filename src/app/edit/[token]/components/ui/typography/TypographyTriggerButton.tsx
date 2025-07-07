// /app/edit/[token]/components/ui/typography/TypographyTriggerButton.tsx
import React from 'react';
import { generateFontPairName } from './typographyCompatibility';
import type { FontTheme } from '@/types/core/index';

interface TypographyTriggerButtonProps {
  currentTheme: FontTheme;
  isOpen: boolean;
  onClick: () => void;
}

export function TypographyTriggerButton({ 
  currentTheme, 
  isOpen, 
  onClick 
}: TypographyTriggerButtonProps) {
  const currentFontName = generateFontPairName(currentTheme);
  
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
      title={`Typography - Current: ${currentFontName}`}
      aria-expanded={isOpen}
    >
      <div className="flex items-center space-x-1.5">
        <div className="text-base font-bold leading-none" style={{ fontFamily: currentTheme.headingFont }}>
          Aa
        </div>
        <div className="text-xs text-gray-500" style={{ fontFamily: currentTheme.bodyFont }}>
          Aa
        </div>
      </div>
      <span className="hidden sm:inline">Typography</span>
      <svg 
        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}