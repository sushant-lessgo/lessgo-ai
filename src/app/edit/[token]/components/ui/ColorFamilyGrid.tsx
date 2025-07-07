// /app/edit/[token]/components/ui/ColorFamilyGrid.tsx
"use client";

import React, { useState, useMemo } from 'react';
import type { BackgroundSystem } from '@/types/core';

interface ColorFamily {
  name: string;
  label: string;
  description: string;
  compatibility: 'high' | 'medium' | 'low';
  harmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic';
  intensities: Array<{
    value: number;
    label: string;
    class: string;
    usage: string;
  }>;
}

interface ColorFamilyGridProps {
  selectedFamily: string;
  selectedIntensity: number;
  backgroundSystem: BackgroundSystem | null;
  onSelectionChange: (family: string, intensity: number) => void;
  disabled?: boolean;
}

export function ColorFamilyGrid({
  selectedFamily,
  selectedIntensity,
  backgroundSystem,
  onSelectionChange,
  disabled = false,
}: ColorFamilyGridProps) {
  const [expandedFamily, setExpandedFamily] = useState<string | null>(selectedFamily);

  const colorFamilies = useMemo((): ColorFamily[] => {
    const baseColor = backgroundSystem?.baseColor || 'gray';
    
    const families: ColorFamily[] = [
      {
        name: 'blue',
        label: 'Blue',
        description: 'Trust, reliability, and professionalism',
        compatibility: baseColor === 'blue' ? 'high' : 'medium',
        harmony: baseColor === 'blue' ? 'monochromatic' : 'analogous',
        intensities: [
          { value: 400, label: 'Light', class: 'bg-blue-400', usage: 'Subtle accents' },
          { value: 500, label: 'Medium', class: 'bg-blue-500', usage: 'Secondary CTAs' },
          { value: 600, label: 'Standard', class: 'bg-blue-600', usage: 'Primary CTAs' },
          { value: 700, label: 'Dark', class: 'bg-blue-700', usage: 'Hover states' },
          { value: 800, label: 'Deeper', class: 'bg-blue-800', usage: 'Dark themes' },
        ],
      },
      {
        name: 'purple',
        label: 'Purple',
        description: 'Creative, innovative, and premium',
        compatibility: 'high',
        harmony: 'analogous',
        intensities: [
          { value: 400, label: 'Light', class: 'bg-purple-400', usage: 'Backgrounds' },
          { value: 500, label: 'Medium', class: 'bg-purple-500', usage: 'Accents' },
          { value: 600, label: 'Standard', class: 'bg-purple-600', usage: 'Primary CTAs' },
          { value: 700, label: 'Dark', class: 'bg-purple-700', usage: 'Hover states' },
          { value: 800, label: 'Deeper', class: 'bg-purple-800', usage: 'Focus states' },
        ],
      },
      {
        name: 'green',
        label: 'Green',
        description: 'Growth, success, and positive action',
        compatibility: 'medium',
        harmony: 'complementary',
        intensities: [
          { value: 400, label: 'Light', class: 'bg-green-400', usage: 'Success states' },
          { value: 500, label: 'Medium', class: 'bg-green-500', usage: 'Progress bars' },
          { value: 600, label: 'Standard', class: 'bg-green-600', usage: 'Action CTAs' },
          { value: 700, label: 'Dark', class: 'bg-green-700', usage: 'Confirmation' },
          { value: 800, label: 'Deeper', class: 'bg-green-800', usage: 'Dark mode' },
        ],
      },
      {
        name: 'orange',
        label: 'Orange',
        description: 'Energy, enthusiasm, and urgency',
        compatibility: 'medium',
        harmony: 'complementary',
        intensities: [
          { value: 400, label: 'Light', class: 'bg-orange-400', usage: 'Warnings' },
          { value: 500, label: 'Medium', class: 'bg-orange-500', usage: 'Highlights' },
          { value: 600, label: 'Standard', class: 'bg-orange-600', usage: 'Action CTAs' },
          { value: 700, label: 'Dark', class: 'bg-orange-700', usage: 'Hover states' },
          { value: 800, label: 'Deeper', class: 'bg-orange-800', usage: 'Active states' },
        ],
      },
      {
        name: 'red',
        label: 'Red',
        description: 'Urgency, importance, and strong action',
        compatibility: 'low',
        harmony: 'triadic',
        intensities: [
          { value: 400, label: 'Light', class: 'bg-red-400', usage: 'Error backgrounds' },
          { value: 500, label: 'Medium', class: 'bg-red-500', usage: 'Alerts' },
          { value: 600, label: 'Standard', class: 'bg-red-600', usage: 'Urgent CTAs' },
          { value: 700, label: 'Dark', class: 'bg-red-700', usage: 'Critical actions' },
          { value: 800, label: 'Deeper', class: 'bg-red-800', usage: 'Danger states' },
        ],
      },
      {
        name: 'teal',
        label: 'Teal',
        description: 'Fresh, balanced, and modern',
        compatibility: 'high',
        harmony: 'analogous',
        intensities: [
          { value: 400, label: 'Light', class: 'bg-teal-400', usage: 'Calm accents' },
          { value: 500, label: 'Medium', class: 'bg-teal-500', usage: 'Secondary CTAs' },
          { value: 600, label: 'Standard', class: 'bg-teal-600', usage: 'Primary CTAs' },
          { value: 700, label: 'Dark', class: 'bg-teal-700', usage: 'Professional' },
          { value: 800, label: 'Deeper', class: 'bg-teal-800', usage: 'Dark themes' },
        ],
      },
    ];

    return families.sort((a, b) => {
      if (a.compatibility === b.compatibility) return 0;
      if (a.compatibility === 'high') return -1;
      if (b.compatibility === 'high') return 1;
      if (a.compatibility === 'medium') return -1;
      return 1;
    });
  }, [backgroundSystem]);

  const getCompatibilityIcon = (compatibility: ColorFamily['compatibility']) => {
    switch (compatibility) {
      case 'high':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getHarmonyColor = (harmony: ColorFamily['harmony']) => {
    switch (harmony) {
      case 'monochromatic': return 'text-blue-600';
      case 'analogous': return 'text-green-600';
      case 'complementary': return 'text-orange-600';
      case 'triadic': return 'text-purple-600';
    }
  };

  if (!backgroundSystem) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2">Background Required</p>
        <p className="text-xs text-gray-600">Select a background system first to see color family options</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Color Family Selection</h4>
        <p className="text-xs text-gray-600">
          Choose a color family and intensity level for your interactive elements
        </p>
      </div>

      {/* Family Grid */}
      <div className="space-y-3">
        {colorFamilies.map((family) => {
          const isSelected = selectedFamily === family.name;
          const isExpanded = expandedFamily === family.name;
          
          return (
            <div key={family.name} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Family Header */}
              <button
                onClick={() => {
                  setExpandedFamily(isExpanded ? null : family.name);
                  if (!isExpanded) {
                    onSelectionChange(family.name, 600);
                  }
                }}
                disabled={disabled}
                className={`
                  w-full p-4 text-left transition-colors
                  ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded border border-gray-200 overflow-hidden">
                      <div className={`w-full h-full ${family.intensities[2].class}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">{family.label}</span>
                        {getCompatibilityIcon(family.compatibility)}
                        <span className={`text-xs capitalize ${getHarmonyColor(family.harmony)}`}>
                          {family.harmony}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{family.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isSelected && (
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Selected
                      </div>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isExpanded ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Intensity Selection */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-3">Choose intensity level:</div>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {family.intensities.map((intensity) => {
                      const isIntensitySelected = selectedFamily === family.name && selectedIntensity === intensity.value;
                      
                      return (
                        <button
                          key={intensity.value}
                          onClick={() => onSelectionChange(family.name, intensity.value)}
                          disabled={disabled}
                          className={`
                            p-3 rounded-lg border-2 transition-all text-center
                            ${isIntensitySelected
                              ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className={`w-full h-8 rounded mb-2 ${intensity.class}`} />
                          <div className="text-xs font-medium text-gray-700">{intensity.label}</div>
                          <div className="text-xs text-gray-500">{intensity.value}</div>
                          <div className="text-xs text-gray-400 mt-1">{intensity.usage}</div>
                          
                          {isIntensitySelected && (
                            <div className="mt-2">
                              <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Usage Examples */}
                  <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="text-xs font-medium text-gray-700 mb-2">Preview with {family.label}</div>
                    <div className="flex items-center space-x-3">
                      <button className={`px-3 py-1 rounded text-xs font-medium text-white ${family.intensities.find(i => i.value === (selectedIntensity || 600))?.class}`}>
                        Primary CTA
                      </button>
                      <button className={`px-3 py-1 rounded text-xs font-medium border ${family.intensities.find(i => i.value === (selectedIntensity || 600))?.class.replace('bg-', 'border-').replace('bg-', 'text-')}`}>
                        Secondary CTA
                      </button>
                      <span className={`text-xs underline ${family.intensities.find(i => i.value === (selectedIntensity || 600))?.class.replace('bg-', 'text-')}`}>
                        Example link
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compatibility Legend */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">Compatibility Guide</div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>High - Excellent harmony with current background</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Medium - Good compatibility, may need adjustments</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Low - Use carefully, may clash with background</span>
          </div>
        </div>
      </div>

      {/* Current Selection Summary */}
      {selectedFamily && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${colorFamilies.find(f => f.name === selectedFamily)?.intensities.find(i => i.value === selectedIntensity)?.class}`} />
            <div className="text-sm font-medium text-blue-800">
              Selected: {colorFamilies.find(f => f.name === selectedFamily)?.label} {selectedIntensity}
            </div>
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {colorFamilies.find(f => f.name === selectedFamily)?.intensities.find(i => i.value === selectedIntensity)?.usage}
          </div>
        </div>
      )}
    </div>
  );
}