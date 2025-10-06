// components/ui/ColorPicker/GradientPicker.tsx - Gradient picker component
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { GradientConfig, LinearGradient, RadialGradient, GradientStop, GradientPreset } from '@/types/core';

interface GradientPickerProps {
  value: GradientConfig | null;
  onChange: (gradient: GradientConfig) => void;
}

export function GradientPicker({ value, onChange }: GradientPickerProps) {
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>(value?.type || 'linear');
  const [direction, setDirection] = useState(value?.type === 'linear' ? value.angle : 45);
  const [stops, setStops] = useState<GradientStop[]>(
    value?.stops || [
      { color: '#3B82F6', position: 0 },
      { color: '#1D4ED8', position: 100 },
    ]
  );

  // Update local state when value changes
  useEffect(() => {
    if (value) {
      setGradientType(value.type);
      setStops(value.stops);
      if (value.type === 'linear') {
        setDirection(value.angle);
      }
    }
  }, [value]);

  // Generate gradient config
  const generateGradientConfig = useCallback((): GradientConfig => {
    if (gradientType === 'linear') {
      return {
        type: 'linear',
        angle: direction,
        stops: stops.sort((a, b) => a.position - b.position),
      };
    } else {
      return {
        type: 'radial',
        stops: stops.sort((a, b) => a.position - b.position),
      };
    }
  }, [gradientType, direction, stops]);

  // Handle changes and notify parent
  const handleChange = useCallback(() => {
    const config = generateGradientConfig();
    onChange(config);
  }, [generateGradientConfig, onChange]);

  // Update gradient type
  const handleTypeChange = useCallback((type: 'linear' | 'radial') => {
    setGradientType(type);
    setTimeout(handleChange, 0);
  }, [handleChange]);

  // Update direction (for linear gradients)
  const handleDirectionChange = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setTimeout(handleChange, 0);
  }, [handleChange]);

  // Update gradient stop
  const updateStop = useCallback((index: number, updates: Partial<GradientStop>) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], ...updates };
    setStops(newStops);
    setTimeout(handleChange, 0);
  }, [stops, handleChange]);

  // Add gradient stop
  const addStop = useCallback(() => {
    const newPosition = stops.length > 0 ? Math.max(...stops.map(s => s.position)) + 10 : 50;
    const newColor = stops.length > 0 ? stops[stops.length - 1].color : '#3B82F6';
    
    setStops([...stops, { color: newColor, position: Math.min(newPosition, 100) }]);
    setTimeout(handleChange, 0);
  }, [stops, handleChange]);

  // Remove gradient stop
  const removeStop = useCallback((index: number) => {
    if (stops.length > 2) {
      const newStops = stops.filter((_, i) => i !== index);
      setStops(newStops);
      setTimeout(handleChange, 0);
    }
  }, [stops, handleChange]);

  // Preset gradients
  const presetGradients: GradientPreset[] = [
    {
      id: 'blue-purple',
      name: 'Blue to Purple',
      category: 'professional',
      gradient: {
        type: 'linear',
        angle: 45,
        stops: [
          { color: '#3B82F6', position: 0 },
          { color: '#8B5CF6', position: 100 },
        ],
      },
      thumbnail: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
    },
    {
      id: 'sunset',
      name: 'Sunset',
      category: 'creative',
      gradient: {
        type: 'linear',
        angle: 135,
        stops: [
          { color: '#F59E0B', position: 0 },
          { color: '#EF4444', position: 50 },
          { color: '#8B5CF6', position: 100 },
        ],
      },
      thumbnail: 'linear-gradient(135deg, #F59E0B, #EF4444, #8B5CF6)',
    },
    {
      id: 'ocean',
      name: 'Ocean',
      category: 'professional',
      gradient: {
        type: 'linear',
        angle: 90,
        stops: [
          { color: '#0EA5E9', position: 0 },
          { color: '#06B6D4', position: 100 },
        ],
      },
      thumbnail: 'linear-gradient(90deg, #0EA5E9, #06B6D4)',
    },
    {
      id: 'forest',
      name: 'Forest',
      category: 'professional',
      gradient: {
        type: 'linear',
        angle: 180,
        stops: [
          { color: '#10B981', position: 0 },
          { color: '#047857', position: 100 },
        ],
      },
      thumbnail: 'linear-gradient(180deg, #10B981, #047857)',
    },
  ];

  // Apply preset gradient
  const applyPreset = useCallback((preset: GradientPreset) => {
    
    const config = preset.gradient;
    setGradientType(config.type);
    setStops(config.stops);
    if (config.type === 'linear') {
      setDirection(config.angle);
    }
    
    // Notify parent immediately with the preset gradient
    onChange(config);
    
  }, [onChange]);

  // Generate CSS for preview
  const generatePreviewCSS = () => {
    const sortedStops = stops.sort((a, b) => a.position - b.position);
    const stopStrings = sortedStops.map(stop => `${stop.color} ${stop.position}%`);
    
    if (gradientType === 'linear') {
      return `linear-gradient(${direction}deg, ${stopStrings.join(', ')})`;
    } else {
      return `radial-gradient(circle, ${stopStrings.join(', ')})`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Heading */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Gradient Configuration</h3>
      </div>

      {/* Gradient Type Selector */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
        <div className="flex space-x-2">
          {['linear', 'radial'].map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type as 'linear' | 'radial')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md border transition-colors ${
                gradientType === type
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Direction Control (Linear only) */}
      {gradientType === 'linear' && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">Direction</label>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="360"
                value={direction}
                onChange={(e) => handleDirectionChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-base font-semibold text-gray-900 w-14">
                {direction}°
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Top', value: 0 },
                { label: 'Right', value: 90 },
                { label: 'Bottom', value: 180 },
                { label: 'Left', value: 270 },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => handleDirectionChange(value)}
                  className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                    direction === value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gradient Stops */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Color Stops</h4>
          <button
            onClick={addStop}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            + Add Stop
          </button>
        </div>
        <div className="space-y-3">
          {stops.map((stop, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="color"
                value={stop.color}
                onChange={(e) => updateStop(index, { color: e.target.value })}
                className="w-10 h-10 rounded-md border-2 border-gray-300 cursor-pointer"
              />
              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stop.position}
                  onChange={(e) => updateStop(index, { position: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-gray-500">Position: {stop.position}%</div>
              </div>
              {stops.length > 2 && (
                <button
                  onClick={() => removeStop(index)}
                  className="text-red-600 hover:text-red-700 transition-colors p-2"
                  title="Remove stop"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}