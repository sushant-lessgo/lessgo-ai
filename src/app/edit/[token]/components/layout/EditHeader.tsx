// /app/edit/[token]/components/layout/EditHeader.tsx - Updated to use EditHeaderRightPanel
"use client";

import React, { useState } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { TypographyControls } from '../ui/TypographyControls';
import { BackgroundSystemModal } from '../ui/BackgroundSystemModal';
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
    console.log('handleBackgroundSelector clicked');
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

      <BackgroundSystemModal
        isOpen={showBackgroundModal}
        onClose={() => setShowBackgroundModal(false)}
        tokenId={tokenId}
      />

      {showColorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Color System</h2>
                <button 
                  onClick={() => setShowColorModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">Color System Selector</p>
                <p className="text-sm">This modal will be implemented after Background System completion.</p>
                <p className="text-xs text-gray-400 mt-2">
                  The Color System will allow you to customize accent colors, interactive elements, 
                  and semantic color choices while maintaining accessibility standards.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowColorModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}