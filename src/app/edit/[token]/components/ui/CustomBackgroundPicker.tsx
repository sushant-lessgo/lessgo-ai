// Custom Background Picker Component for Global Background System
// Matches the pattern from SectionBackgroundModal but for global backgrounds
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SolidColorPicker } from './ColorPicker/SolidColorPicker';
import { GradientPicker } from './ColorPicker/GradientPicker';
import { 
  generateCustomColorScheme, 
  updateColorScheme,
  type CustomColors 
} from './colorCalculations';
import type { 
  BackgroundPickerMode,
  CustomBackground,
  BackgroundSystem
} from '@/types/core';

interface CustomBackgroundPickerProps {
  colors: CustomColors | null;
  onColorsChange: (colors: CustomColors) => void;
  onBackgroundChange?: (background: BackgroundSystem) => void;
  disabled?: boolean;
}

export function CustomBackgroundPicker({ 
  colors, 
  onColorsChange, 
  onBackgroundChange,
  disabled = false 
}: CustomBackgroundPickerProps) {
  console.log('🎨 [CustomBackgroundPicker] Component rendered with props:', {
    hasColors: !!colors,
    hasOnColorsChange: !!onColorsChange,
    hasOnBackgroundChange: !!onBackgroundChange,
    disabled
  });
  
  // Store callbacks in refs to prevent re-renders
  const onColorsChangeRef = useRef(onColorsChange);
  const onBackgroundChangeRef = useRef(onBackgroundChange);
  
  // Update refs when callbacks change
  useEffect(() => {
    onColorsChangeRef.current = onColorsChange;
    onBackgroundChangeRef.current = onBackgroundChange;
  }, [onColorsChange, onBackgroundChange]);

  // Initialize with default colors if not provided
  const [localColors, setLocalColors] = useState<CustomColors>(
    colors || generateCustomColorScheme('#3B82F6')
  );
  
  // Track picker mode (solid or gradient)
  const [pickerMode, setPickerMode] = useState<BackgroundPickerMode>('solid');
  
  // Track custom background configuration
  const [customBackground, setCustomBackground] = useState<CustomBackground>({
    solid: localColors.primary
  });

  // Update parent when colors change (debounced)
  useEffect(() => {
    console.log('🔄 [CustomBackgroundPicker] useEffect triggered with:', {
      pickerMode,
      customBackground,
      localColors: {
        primary: localColors.primary,
        secondary: localColors.secondary
      }
    });
    
    const timer = setTimeout(() => {
      if (onColorsChangeRef.current) {
        onColorsChangeRef.current(localColors);
      }
      
      // Also update the background system if callback provided
      if (onBackgroundChangeRef.current) {
        const primaryCSS = generateBackgroundCSS(customBackground, pickerMode);
        const baseColor = extractBaseColor(localColors.primary);
        
        console.log('🎨 [CustomBackgroundPicker] Generated CSS:', {
          primaryCSS,
          baseColor,
          pickerMode,
          customBackground
        });
        
        // Helper to format color for Tailwind
        const formatColorForTailwind = (color: string) => {
          return `bg-[${color}]`;
        };
        
        const backgroundSystem: BackgroundSystem = {
          primary: primaryCSS,
          secondary: formatColorForTailwind(localColors.secondary),
          neutral: formatColorForTailwind(localColors.neutral),
          divider: formatColorForTailwind(localColors.divider),
          baseColor: baseColor,
          accentColor: baseColor,
          accentCSS: `bg-[${localColors.primary}]` // Use proper Tailwind format for accent
        };
        
        console.log('🎨 [CustomBackgroundPicker] Sending background system:', backgroundSystem);
        onBackgroundChangeRef.current(backgroundSystem);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localColors.primary, localColors.secondary, localColors.neutral, localColors.divider, customBackground, pickerMode]);

  // Handle solid color change
  const handleSolidColorChange = useCallback((color: string) => {
    setCustomBackground({ solid: color });
    
    // Update the color scheme based on new primary
    const updatedScheme = updateColorScheme(localColors, 'primary', color, true);
    setLocalColors(updatedScheme);
  }, [localColors]);

  // Handle gradient change
  const handleGradientChange = useCallback((gradient: any) => {
    console.log('🎨 [CustomBackgroundPicker] handleGradientChange called with:', gradient);
    
    setCustomBackground({ gradient });
    
    // Extract primary color from first gradient stop
    if (gradient?.stops?.[0]?.color) {
      const updatedScheme = updateColorScheme(localColors, 'primary', gradient.stops[0].color, true);
      console.log('🎨 [CustomBackgroundPicker] Updated color scheme:', updatedScheme);
      setLocalColors(updatedScheme);
    }
  }, [localColors]);

  // Handle individual color overrides for secondary/neutral/divider
  const handleColorOverride = useCallback((
    colorType: 'secondary' | 'neutral' | 'divider',
    color: string
  ) => {
    const updatedScheme = updateColorScheme(localColors, colorType, color, true);
    setLocalColors(updatedScheme);
  }, [localColors]);

  // Generate CSS for the background
  const generateBackgroundCSS = (custom: CustomBackground, mode: BackgroundPickerMode): string => {
    console.log('🎨 [CustomBackgroundPicker] generateBackgroundCSS called:', {
      mode,
      custom,
      localColors
    });
    
    if (mode === 'solid' && custom.solid) {
      // Extract color value - handle both string and object formats
      const colorValue = custom.solid || localColors.primary;
      const cssClass = `bg-[${colorValue}]`;
      console.log('🎨 [CustomBackgroundPicker] Generated solid CSS:', cssClass);
      return cssClass;
    } else if (mode === 'gradient' && custom.gradient) {
      const { type, stops } = custom.gradient;
      const gradientStops = stops.map((s: any) => `${s.color} ${s.position}%`).join(', ');
      
      let cssClass;
      if (type === 'linear') {
        const angle = (custom.gradient as any).angle || 45; // Type guard with fallback
        cssClass = `bg-[linear-gradient(${angle}deg, ${gradientStops})]`;
      } else if (type === 'radial') {
        cssClass = `bg-[radial-gradient(circle, ${gradientStops})]`;
      } else {
        cssClass = `bg-[${localColors.primary}]`; // Fallback
      }
      
      console.log('🎨 [CustomBackgroundPicker] Generated gradient CSS:', {
        type,
        stops,
        gradientStops,
        angle: type === 'linear' ? (custom.gradient as any).angle || 45 : 'N/A',
        cssClass
      });
      return cssClass;
    }
    
    // Fallback with proper format
    const fallbackClass = `bg-[${localColors.primary}]`;
    console.log('🎨 [CustomBackgroundPicker] Using fallback CSS:', fallbackClass);
    return fallbackClass;
  };

  // Extract base color name from hex
  const extractBaseColor = (hex: string): string => {
    try {
      // Ensure hex is valid
      if (!hex || !hex.startsWith('#')) return 'blue'; // Default fallback
      
      const r = parseInt(hex.substr(1, 2), 16);
      const g = parseInt(hex.substr(3, 2), 16);
      const b = parseInt(hex.substr(5, 2), 16);
      
      // Check for NaN
      if (isNaN(r) || isNaN(g) || isNaN(b)) return 'blue';
      
      // More sophisticated color detection
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      
      // Grayscale check
      if (max - min < 30) return 'gray';
      
      // Determine dominant color
      if (r === max && r > 200) return 'red';
      if (g === max && g > 200) return 'green';
      if (b === max && b > 200) return 'blue';
      
      // Secondary checks
      if (r > 180 && g > 180) return 'yellow';
      if (r > 180 && b > 180) return 'purple';
      if (g > 180 && b > 180) return 'teal';
      
      // Default based on highest channel
      if (b >= r && b >= g) return 'blue';
      if (r >= g && r >= b) return 'red';
      if (g >= r && g >= b) return 'green';
      
      return 'blue'; // Final fallback
    } catch (error) {
      console.warn('Error extracting base color:', error);
      return 'blue';
    }
  };

  // Preview background style
  const previewStyle = useMemo(() => {
    const bgCSS = generateBackgroundCSS(customBackground, pickerMode);
    return {
      background: bgCSS,
      minHeight: '120px'
    };
  }, [customBackground, pickerMode]);

  return (
    <div className="space-y-4">
      {/* Solid/Gradient Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Style
        </label>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setPickerMode('solid')}
              disabled={disabled}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                pickerMode === 'solid'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Solid Color
            </button>
            <button
              onClick={() => {
                console.log('🎨 [CustomBackgroundPicker] Switching to gradient mode');
                setPickerMode('gradient');
              }}
              disabled={disabled}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                pickerMode === 'gradient'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Gradient
            </button>
          </nav>
        </div>
      </div>

      {/* Color Pickers */}
      <div className="mt-4">
        {pickerMode === 'solid' ? (
          <div className="space-y-4">
            <SolidColorPicker
              value={{ color: customBackground.solid || localColors.primary }}
              onChange={(background) => handleSolidColorChange(background.color)}
            />
          </div>
        ) : (
          <GradientPicker
            value={customBackground.gradient || {
              type: 'linear',
              angle: 90,
              stops: [
                { color: localColors.primary, position: 0 },
                { color: localColors.secondary, position: 100 }
              ]
            }}
            onChange={handleGradientChange}
          />
        )}
        
        {/* Auto-calculated colors - Show for both solid and gradient */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Supporting Colors
            <span className="ml-2 text-xs text-green-600 font-normal">✨ Auto-calculated</span>
          </h4>
          <div className="space-y-3">
            <ColorPreview
              label="Secondary"
              color={localColors.secondary}
              isAuto={localColors.isSecondaryAuto}
              onOverride={(color) => handleColorOverride('secondary', color)}
              disabled={disabled}
            />
            <ColorPreview
              label="Neutral"
              color={localColors.neutral}
              isAuto={localColors.isNeutralAuto}
              onOverride={(color) => handleColorOverride('neutral', color)}
              disabled={disabled}
            />
            <ColorPreview
              label="Divider"
              color={localColors.divider}
              isAuto={localColors.isDividerAuto}
              onOverride={(color) => handleColorOverride('divider', color)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview
        </label>
        <div 
          className="rounded-lg border border-gray-200 overflow-hidden"
          style={previewStyle}
        >
          <div className="p-4 bg-white/90 backdrop-blur-sm m-4 rounded">
            <div className="h-2 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for color previews
interface ColorPreviewProps {
  label: string;
  color: string;
  isAuto: boolean;
  onOverride: (color: string) => void;
  disabled?: boolean;
}

function ColorPreview({ label, color, isAuto, onOverride, disabled }: ColorPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempColor, setTempColor] = useState(color);

  useEffect(() => {
    setTempColor(color);
  }, [color]);

  const handleSave = () => {
    onOverride(tempColor);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempColor(color);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div 
          className="w-10 h-10 rounded-md border border-gray-300"
          style={{ backgroundColor: color }}
        />
        <div>
          <div className="text-sm font-medium text-gray-700">{label}</div>
          {isAuto && !isEditing && (
            <div className="text-xs text-gray-500">Auto-calculated</div>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
            disabled={disabled}
          />
          <button
            onClick={handleSave}
            disabled={disabled}
            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={handleCancel}
            disabled={disabled}
            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          disabled={disabled}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {isAuto ? 'Override' : 'Edit'}
        </button>
      )}
    </div>
  );
}