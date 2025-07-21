// app/edit/[token]/components/ui/AddSectionButton.tsx
import React from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

interface AddSectionButtonProps {
  onAdd: () => void;
  position: 'between' | 'end';
}

export function AddSectionButton({ onAdd, position }: AddSectionButtonProps) {
  const { getColorTokens } = useEditStore();
  const colorTokens = getColorTokens();

  const getButtonStyles = () => {
    const baseStyles = "group relative flex items-center justify-center transition-all duration-200 cursor-pointer";
    
    if (position === 'between') {
      return `${baseStyles} py-4 opacity-0 hover:opacity-100`;
    }
    
    return `${baseStyles} py-8 opacity-60 hover:opacity-100`;
  };

  const getIconStyles = () => {
    const baseIconStyles = "w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200";
    
    return `${baseIconStyles} border-gray-300 text-gray-400 group-hover:border-blue-400 group-hover:text-blue-500 group-hover:bg-blue-50`;
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={onAdd}
        className={getButtonStyles()}
        aria-label={`Add section ${position === 'between' ? 'between sections' : 'at end'}`}
      >
        <div className={getIconStyles()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        {/* Tooltip */}
        <div className="absolute top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Add Section
        </div>
      </button>
    </div>
  );
}