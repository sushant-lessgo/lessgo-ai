// /app/edit/[token]/components/layout/EditHeader.tsx - Updated to use EditHeaderRightPanel
"use client";

import React, { useState } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { TypographyControls } from '../ui/TypographyControls';
import { VariableBackgroundModal } from '../ui/VariableBackgroundModal';
import { ColorSystemModalMVP } from '../ui/ColorSystemModalMVP';
import { EditHeaderRightPanel } from './EditHeaderRightPanel';

interface EditHeaderProps {
  tokenId: string;
}

export function EditHeader({ tokenId }: EditHeaderProps) {
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  
  const { theme, getColorTokens } = useEditStore();
  
  
  let colorTokens;
  try {
    colorTokens = getColorTokens();
  } catch (error) {
    console.error('❌ getColorTokens error:', error);
    colorTokens = { accent: 'bg-blue-500' };
  }

  const handleBackgroundSelector = () => {
    setShowBackgroundModal(true);
  };

  const handleColorSelector = () => {
    setShowColorModal(true);
  };

  const currentBackgroundPreview = theme?.colors?.sectionBackgrounds?.primary || 'bg-gradient-to-br from-blue-500 to-purple-600';

  return (
    <>
      <header 
        className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50"
      >
        {/* Left Section - System Selectors */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackgroundSelector}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
            title="Background System - Click to customize your page backgrounds"
          >
            <div className={`w-4 h-4 rounded-sm ${currentBackgroundPreview.includes('gradient') ? currentBackgroundPreview : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}></div>
            <span>Background</span>
          </button>

          <button
            onClick={handleColorSelector}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
            title="Color System - Customize accent colors and interactive elements"
          >
            <div className="w-4 h-4 rounded-sm flex">
              <div className={`w-2 h-4 rounded-l-sm ${colorTokens.accent || 'bg-blue-500'}`}></div>
              <div className="w-2 h-4 bg-purple-500 rounded-r-sm"></div>
            </div>
            <span>Color</span>
          </button>

          <TypographyControls />
        </div>

        {/* Right Section - Action Controls */}
        <EditHeaderRightPanel tokenId={tokenId} />
      </header>

      <VariableBackgroundModal
        isOpen={showBackgroundModal}
        onClose={() => setShowBackgroundModal(false)}
        tokenId={tokenId}
        enableVariableMode={true}
      />

      <ColorSystemModalMVP
        isOpen={showColorModal}
        onClose={() => setShowColorModal(false)}
        tokenId={tokenId}
      />
    </>
  );
}