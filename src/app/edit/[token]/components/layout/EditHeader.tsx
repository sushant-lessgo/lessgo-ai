// /app/edit/[token]/components/layout/EditHeader.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditStore } from '@/hooks/useEditStore';
import { TypographyControls } from '../ui/TypographyControls';

interface EditHeaderProps {
  tokenId: string;
}

export function EditHeader({ tokenId }: EditHeaderProps) {
  const router = useRouter();
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  
  const {
    theme,
    triggerAutoSave,
    getColorTokens,
    undo,
    redo,
    canUndo,
    canRedo,
    resetToGenerated,
    onboardingData,
  } = useEditStore();

  // Call the functions to get boolean values
  const undoAvailable = canUndo();
  const redoAvailable = canRedo();

  const colorTokens = getColorTokens();

  // Background System Selector Handler
  const handleBackgroundSelector = () => {
    setShowBackgroundModal(true);
  };

  // Color System Selector Handler
  const handleColorSelector = () => {
    setShowColorModal(true);
  };

  // Undo Handler
  const handleUndo = () => {
    undo();
    triggerAutoSave();
  };

  // Redo Handler
  const handleRedo = () => {
    redo();
    triggerAutoSave();
  };

  // Reset to LessGo-Generated Handler
  const handleResetToGenerated = () => {
    if (window.confirm('This will reset all your customizations to the original LessGo-generated version. Are you sure?')) {
      resetToGenerated();
      triggerAutoSave();
    }
  };

  // Preview Handler
  const handlePreview = async () => {
    await triggerAutoSave();
    router.push(`/preview/${tokenId}`);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-30">
      {/* Left Section - System Selectors */}
      <div className="flex items-center space-x-4">
        {/* Background System Selector */}
        <button
          onClick={handleBackgroundSelector}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          title="Background System"
        >
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-500 to-purple-600"></div>
          <span>Background</span>
        </button>

        {/* Color System Selector */}
        <button
          onClick={handleColorSelector}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          title="Color System"
        >
          <div className="w-4 h-4 rounded-sm flex">
            <div className="w-2 h-4 bg-blue-500 rounded-l-sm"></div>
            <div className="w-2 h-4 bg-purple-500 rounded-r-sm"></div>
          </div>
          <span>Color</span>
        </button>

        {/* Typography Controls */}
        <TypographyControls />
      </div>

      {/* Right Section - Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Undo/Redo Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleUndo}
            disabled={!undoAvailable}
            className={`
              w-8 h-8 rounded border flex items-center justify-center transition-colors
              ${undoAvailable 
                ? 'border-gray-200 text-gray-700 hover:bg-gray-50' 
                : 'border-gray-100 text-gray-300 cursor-not-allowed'
              }
            `}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button
            onClick={handleRedo}
            disabled={!redoAvailable}
            className={`
              w-8 h-8 rounded border flex items-center justify-center transition-colors
              ${redoAvailable 
                ? 'border-gray-200 text-gray-700 hover:bg-gray-50' 
                : 'border-gray-100 text-gray-300 cursor-not-allowed'
              }
            `}
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Reset to LessGo-Generated */}
        <button
          onClick={handleResetToGenerated}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          title="Reset to original LessGo-generated design"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </div>
        </button>

        {/* Preview Button */}
        <button
          onClick={handlePreview}
          className={`
            px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${colorTokens.accent} text-white hover:opacity-90 
            shadow-sm hover:shadow-md
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title="Preview your landing page"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Preview</span>
          </div>
        </button>
      </div>

      {/* Background System Modal Placeholder */}
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Background System</h2>
                <button 
                  onClick={() => setShowBackgroundModal(false)}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">Background System Selector</p>
                <p className="text-sm">This modal will be implemented in Phase 1 development.</p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowBackgroundModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color System Modal Placeholder */}
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
    </header>
  );
}