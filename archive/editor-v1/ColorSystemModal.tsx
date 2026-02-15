// /app/edit/[token]/components/ui/ColorSystemModal.tsx (Complete Phase 4 Integration)
"use client";

import React, { useState, useMemo } from 'react';
import { useColorSystemSelector } from './useColorSystemSelector';
import { TierToggle } from './TierToggle';
import { SemanticControls } from './SemanticControls';
import { InteractiveColorPicker } from './InteractiveColorPicker';
import { TextContrastSlider } from './TextContrastSlider';
import { IntensitySlider } from './IntensitySlider';
import { CategoryControls } from './CategoryControls';
import { ColorFamilyGrid } from './ColorFamilyGrid';
import { ExpertControls } from './ExpertControls';
import { BackgroundContextPreview } from './BackgroundContextPreview';
import { AccessibilityPreview } from './AccessibilityPreview';
import { ColorModalActions } from './ColorModalActions';
import type { ColorTokens, ColorSelectorTier } from '@/types/core';
import { logger } from '@/lib/logger';

interface ColorSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
}

type PreviewMode = 'live' | 'backgrounds' | 'accessibility';

export function ColorSystemModal({ isOpen, onClose, tokenId }: ColorSystemModalProps) {
  const [activeTier, setActiveTier] = useState<ColorSelectorTier>(1);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('live');

  const {
    currentColorTokens,
    currentBackgroundSystem,
    previewTokens,
    selectedAccent,
    textContrast,
    overallIntensity,
    canApply,
    isLoading,
    validationErrors,
    setSelectedAccent,
    setTextContrast,
    setOverallIntensity,
    handleApplyColors,
    handleResetToGenerated,
    resetPreview,
  } = useColorSystemSelector(tokenId);

  // Handle modal close with cleanup
  const handleCancel = () => {
    resetPreview();
    onClose();
  };

  // Enhanced apply handler
  const handleApply = async (): Promise<boolean> => {
    const success = await handleApplyColors();
    if (success) {
      onClose();
    }
    return success;
  };

  // Handle individual token changes for expert mode
  const handleTokenChange = (tokenKey: keyof ColorTokens, value: string) => {
    // This would integrate with the existing store update mechanism
    logger.dev(`Token change: ${tokenKey} = ${value}`);
  };

  // Handle color family selection from grid
  const handleColorFamilySelection = (family: string, intensity: number) => {
    setSelectedAccent(family);
    // Optionally adjust intensity based on selection
  };

  // Tier toggle component with enhanced features
  const TierControls = useMemo(() => (
    <TierToggle
      activeTier={activeTier}
      onTierChange={setActiveTier}
      disabled={isLoading || !currentBackgroundSystem}
    />
  ), [activeTier, isLoading, currentBackgroundSystem]);

  // Preview mode toggle
  const PreviewModeToggle = useMemo(() => (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      {[
        { mode: 'live' as PreviewMode, label: 'Live', icon: '👁' },
        { mode: 'backgrounds' as PreviewMode, label: 'Contexts', icon: '🎨' },
        { mode: 'accessibility' as PreviewMode, label: 'A11y', icon: '♿' },
      ].map(({ mode, label, icon }) => (
        <button
          key={mode}
          onClick={() => setPreviewMode(mode)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            previewMode === mode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          disabled={isLoading}
        >
          <span className="mr-1">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  ), [previewMode, isLoading]);

  // Enhanced live preview with mode switching
  const PreviewContent = useMemo(() => {
    if (previewMode === 'backgrounds') {
      return (
        <BackgroundContextPreview
          currentTokens={currentColorTokens}
          previewTokens={previewTokens}
          backgroundSystem={currentBackgroundSystem}
          showComparison={true}
        />
      );
    }

    if (previewMode === 'accessibility') {
      return (
        <AccessibilityPreview
          tokens={previewTokens}
          backgroundSystem={currentBackgroundSystem}
          showDetails={true}
          compact={false}
        />
      );
    }

    // Default live preview
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Live Preview</h3>
        
        {/* Current vs New Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-2">Current</div>
            <div className="space-y-2">
              <button 
                className={`${currentColorTokens.ctaBg} ${currentColorTokens.ctaText} px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors hover:${currentColorTokens.ctaHover}`}
              >
                Get Started
              </button>
              
              <div className="space-y-1">
                <div className={`${currentColorTokens.textPrimary} text-sm font-semibold`}>
                  Primary Text
                </div>
                <div className={`${currentColorTokens.textSecondary} text-xs`}>
                  Secondary text content
                </div>
                <div className={`${currentColorTokens.textMuted} text-xs`}>
                  Muted text
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 mb-2">New</div>
            <div className="space-y-2">
              <button 
                className={`${previewTokens.ctaBg} ${previewTokens.ctaText} px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors hover:${previewTokens.ctaHover}`}
              >
                Get Started
              </button>
              
              <div className="space-y-1">
                <div className={`${previewTokens.textPrimary} text-sm font-semibold`}>
                  Primary Text
                </div>
                <div className={`${previewTokens.textSecondary} text-xs`}>
                  Secondary text content
                </div>
                <div className={`${previewTokens.textMuted} text-xs`}>
                  Muted text
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Link Preview */}
        <div className="pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">Links: </span>
          <a href="#" className={`${previewTokens.link} hover:${previewTokens.linkHover} text-xs underline`}>
            Example link
          </a>
        </div>

        {/* Quick Accessibility Check */}
        <div className="pt-2 border-t border-gray-200">
          <AccessibilityPreview
            tokens={previewTokens}
            backgroundSystem={currentBackgroundSystem}
            compact={true}
          />
        </div>
      </div>
    );
  }, [previewMode, currentColorTokens, previewTokens, currentBackgroundSystem]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Color System</h2>
            {TierControls}
            
            {/* Background Dependency Warning */}
            {!currentBackgroundSystem && (
              <div className="flex items-center space-x-2 text-amber-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs">Select background first</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Left Panel - Preview with Mode Toggle */}
          <div className="w-2/5 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              {PreviewModeToggle}
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {PreviewContent}
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="w-3/5 flex flex-col min-h-0">
            {/* Controls Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {activeTier === 1 && 'Quick Color Controls'}
                {activeTier === 2 && 'Advanced Color Controls'}
                {activeTier === 3 && 'Expert Color Override'}
              </h3>
              
              <p className="text-sm text-gray-600">
                {activeTier === 1 && 'Adjust interactive elements, text contrast, and overall color intensity with semantic controls.'}
                {activeTier === 2 && 'Fine-tune color categories and element groups for advanced customization.'}
                {activeTier === 3 && 'Direct access to all 28+ color tokens with accessibility warnings.'}
              </p>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tier 1: Enhanced Semantic Controls */}
              {activeTier === 1 && (
                <div className="space-y-6">
                  <SemanticControls
                    selectedAccent={selectedAccent}
                    textContrast={textContrast}
                    overallIntensity={overallIntensity}
                    backgroundSystem={currentBackgroundSystem}
                    onAccentChange={setSelectedAccent}
                    onTextContrastChange={setTextContrast}
                    onIntensityChange={setOverallIntensity}
                    disabled={isLoading || !currentBackgroundSystem}
                  />

                  {/* Enhanced Color Picker */}
                  <InteractiveColorPicker
                    selectedColor={selectedAccent}
                    backgroundSystem={currentBackgroundSystem}
                    onColorChange={setSelectedAccent}
                    disabled={isLoading || !currentBackgroundSystem}
                  />

                  {/* Enhanced Sliders */}
                  <TextContrastSlider
                    value={textContrast}
                    backgroundSystem={currentBackgroundSystem}
                    onChange={setTextContrast}
                    disabled={isLoading || !currentBackgroundSystem}
                  />

                  <IntensitySlider
                    value={overallIntensity}
                    onChange={setOverallIntensity}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Tier 2: Category Controls + Color Family Grid */}
              {activeTier === 2 && (
                <div className="space-y-6">
                  <CategoryControls
                    currentTokens={previewTokens}
                    backgroundSystem={currentBackgroundSystem}
                    onTokensChange={(tokens: Partial<ColorTokens>) => {
                      // Convert to individual token changes
                      Object.entries(tokens).forEach(([key, value]) => {
                        if (value !== undefined) {
                          handleTokenChange(key as keyof ColorTokens, value);
                        }
                      });
                    }}
                    disabled={isLoading || !currentBackgroundSystem}
                  />

                  <ColorFamilyGrid
                    selectedFamily={selectedAccent}
                    selectedIntensity={600} // Default intensity
                    backgroundSystem={currentBackgroundSystem}
                    onSelectionChange={handleColorFamilySelection}
                    disabled={isLoading || !currentBackgroundSystem}
                  />
                </div>
              )}

              {/* Tier 3: Expert Controls */}
              {activeTier === 3 && (
                <ExpertControls
                  currentTokens={previewTokens}
                  backgroundSystem={currentBackgroundSystem}
                  onTokenChange={handleTokenChange}
                  disabled={isLoading || !currentBackgroundSystem}
                />
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm">Updating colors...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Footer Actions */}
        <ColorModalActions
          currentTokens={currentColorTokens}
          previewTokens={previewTokens}
          backgroundSystem={currentBackgroundSystem}
          canApply={canApply}
          isLoading={isLoading}
          validationErrors={validationErrors}
          onApply={handleApply}
          onCancel={handleCancel}
          onResetToGenerated={handleResetToGenerated}
        />
      </div>
    </div>
  );
}