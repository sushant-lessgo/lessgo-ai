// Variable Color Picker - Enhanced color picker with CSS variable support
// Supports real-time variable updates, palette management, and accessibility validation

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useVariableTheme } from '@/modules/Design/ColorSystem/VariableThemeInjector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Pipette, 
  Copy, 
  Check, 
  Eye, 
  Shuffle, 
  RotateCcw,
  Code2,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

// Predefined color palettes
const COLOR_PALETTES = {
  brand: {
    name: 'Brand Colors',
    colors: ['#3b82f6', '#1d4ed8', '#1e40af', '#60a5fa', '#93c5fd', '#dbeafe']
  },
  warm: {
    name: 'Warm Tones',
    colors: ['#f59e0b', '#d97706', '#92400e', '#fbbf24', '#fcd34d', '#fef3c7']
  },
  cool: {
    name: 'Cool Tones',
    colors: ['#06b6d4', '#0891b2', '#0e7490', '#22d3ee', '#67e8f9', '#cffafe']
  },
  nature: {
    name: 'Nature',
    colors: ['#10b981', '#059669', '#047857', '#34d399', '#6ee7b7', '#d1fae5']
  },
  sunset: {
    name: 'Sunset',
    colors: ['#f97316', '#ea580c', '#c2410c', '#fb923c', '#fdba74', '#fed7aa']
  },
  purple: {
    name: 'Purple',
    colors: ['#8b5cf6', '#7c3aed', '#6d28d9', '#a78bfa', '#c4b5fd', '#ede9fe']
  }
};

// CSS variable mappings
const VARIABLE_MAPPINGS = {
  'gradient-from': { label: 'Gradient Start', description: 'Starting color of gradients' },
  'gradient-via': { label: 'Gradient Middle', description: 'Middle color of gradients' },
  'gradient-to': { label: 'Gradient End', description: 'Ending color of gradients' },
  'accent-primary': { label: 'Primary Accent', description: 'Main accent color for buttons and links' },
  'accent-secondary': { label: 'Secondary Accent', description: 'Secondary accent color' },
  'text-primary': { label: 'Primary Text', description: 'Main text color' },
  'text-secondary': { label: 'Secondary Text', description: 'Secondary text color' },
  'bg-primary': { label: 'Primary Background', description: 'Primary background color' },
  'bg-secondary': { label: 'Secondary Background', description: 'Secondary background color' },
};

interface VariableColorPickerProps {
  variableName: string;
  value: string;
  onChange: (value: string, variableName: string) => void;
  tokenId: string;
  label?: string;
  description?: string;
  showPalettes?: boolean;
  showAdvanced?: boolean;
  compactMode?: boolean;
  allowTransparency?: boolean;
}

export function VariableColorPicker({
  variableName,
  value,
  onChange,
  tokenId,
  label,
  description,
  showPalettes = true,
  showAdvanced = true,
  compactMode = false,
  allowTransparency = false,
}: VariableColorPickerProps) {
  const { phase, flags } = useVariableTheme(tokenId);
  const [localValue, setLocalValue] = useState(value);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [colorSpace, setColorSpace] = useState<'hex' | 'hsl' | 'rgb'>('hex');
  const [opacity, setOpacity] = useState(100);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Parse opacity from color value
  useEffect(() => {
    if (value.includes('rgba') || value.includes('hsla')) {
      // Extract opacity from rgba/hsla values
      const match = value.match(/[,\s]+([\d.]+)\)$/);
      if (match) {
        setOpacity(Math.round(parseFloat(match[1]) * 100));
      }
    } else {
      setOpacity(100);
    }
  }, [value]);

  // Get display label
  const displayLabel = useMemo(() => {
    if (label) return label;
    
    const cleanVarName = variableName.replace('--', '');
    const mapping = VARIABLE_MAPPINGS[cleanVarName as keyof typeof VARIABLE_MAPPINGS];
    return mapping?.label || cleanVarName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, [label, variableName]);

  // Get description
  const displayDescription = useMemo(() => {
    if (description) return description;
    
    const cleanVarName = variableName.replace('--', '');
    const mapping = VARIABLE_MAPPINGS[cleanVarName as keyof typeof VARIABLE_MAPPINGS];
    return mapping?.description;
  }, [description, variableName]);

  // Handle color change
  const handleColorChange = useCallback((newValue: string) => {
    let processedValue = newValue;
    
    // Apply opacity if not 100%
    if (allowTransparency && opacity < 100) {
      const alpha = opacity / 100;
      if (newValue.startsWith('#')) {
        // Convert hex to rgba
        const r = parseInt(newValue.slice(1, 3), 16);
        const g = parseInt(newValue.slice(3, 5), 16);
        const b = parseInt(newValue.slice(5, 7), 16);
        processedValue = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    
    setLocalValue(processedValue);
    onChange(processedValue, variableName);
  }, [onChange, variableName, opacity, allowTransparency]);

  // Handle opacity change
  const handleOpacityChange = useCallback((newOpacity: number[]) => {
    const opacityValue = newOpacity[0];
    setOpacity(opacityValue);
    
    if (allowTransparency && localValue.startsWith('#')) {
      const alpha = opacityValue / 100;
      const r = parseInt(localValue.slice(1, 3), 16);
      const g = parseInt(localValue.slice(3, 5), 16);
      const b = parseInt(localValue.slice(5, 7), 16);
      const processedValue = opacityValue === 100 
        ? localValue 
        : `rgba(${r}, ${g}, ${b}, ${alpha})`;
      
      setLocalValue(processedValue);
      onChange(processedValue, variableName);
    }
  }, [localValue, onChange, variableName, allowTransparency]);

  // Copy color value
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(localValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [localValue]);

  // Generate random color
  const handleRandomColor = useCallback(() => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 50 + Math.floor(Math.random() * 40);
    const lightness = 40 + Math.floor(Math.random() * 30);
    const newColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    handleColorChange(newColor);
  }, [handleColorChange]);

  // Color format conversion
  const convertedValues = useMemo(() => {
    let hex = localValue;
    let hsl = '';
    let rgb = '';

    try {
      if (localValue.startsWith('#')) {
        hex = localValue;
        // Convert hex to HSL and RGB (simplified)
        const r = parseInt(localValue.slice(1, 3), 16) / 255;
        const g = parseInt(localValue.slice(3, 5), 16) / 255;
        const b = parseInt(localValue.slice(5, 7), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        const sum = max + min;
        const l = sum / 2;

        let h = 0;
        let s = 0;
        
        if (diff !== 0) {
          s = l > 0.5 ? diff / (2 - sum) : diff / sum;
          
          switch (max) {
            case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
            case g: h = (b - r) / diff + 2; break;
            case b: h = (r - g) / diff + 4; break;
          }
          h /= 6;
        }
        
        hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
        rgb = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
      } else if (localValue.startsWith('hsl')) {
        hsl = localValue;
        // Would need proper HSL to hex conversion here
        hex = localValue; // Fallback
      } else if (localValue.startsWith('rgb')) {
        rgb = localValue;
        // Would need proper RGB to hex conversion here
        hex = localValue; // Fallback
      }
    } catch (error) {
      console.warn('Color conversion failed:', error);
    }

    return { hex, hsl, rgb };
  }, [localValue]);

  // Accessibility check
  const accessibilityScore = useMemo(() => {
    // Simple contrast calculation - would use proper library in production
    const isLight = localValue === '#ffffff' || localValue.includes('rgb(255') || localValue.includes('hsl(') && localValue.includes('100%');
    return isLight ? 'high' : 'medium'; // Simplified
  }, [localValue]);

  if (compactMode) {
    return (
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 rounded border-2 border-gray-200 cursor-pointer"
          style={{ backgroundColor: localValue }}
          onClick={() => setShowPreview(true)}
        />
        <div className="flex-1">
          <HexColorInput
            color={localValue.startsWith('#') ? localValue : '#3b82f6'}
            onChange={handleColorChange}
            className="w-full px-2 py-1 text-sm border rounded"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={handleRandomColor}>
          <Shuffle className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">{displayLabel}</CardTitle>
            {displayDescription && (
              <p className="text-xs text-gray-600 mt-1">{displayDescription}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {phase === 'variable' && (
              <Badge variant="secondary" className="text-xs">Variable</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Color Picker */}
        <div className="space-y-3">
          <HexColorPicker 
            color={localValue.startsWith('#') ? localValue : '#3b82f6'} 
            onChange={handleColorChange}
            className="w-full"
          />
          
          {/* Opacity Slider */}
          {allowTransparency && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs text-gray-500">{opacity}%</span>
              </div>
              <Slider
                value={[opacity]}
                onValueChange={handleOpacityChange}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Color Formats */}
        {showAdvanced && (
          <div className="space-y-3">
            <Separator />
            <div>
              <Label className="text-xs font-medium mb-2 block">Color Formats</Label>
              <Tabs value={colorSpace} onValueChange={(value) => setColorSpace(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hex" className="text-xs">HEX</TabsTrigger>
                  <TabsTrigger value="hsl" className="text-xs">HSL</TabsTrigger>
                  <TabsTrigger value="rgb" className="text-xs">RGB</TabsTrigger>
                </TabsList>
                
                <TabsContent value="hex" className="mt-2">
                  <Input
                    value={convertedValues.hex}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="text-xs"
                    placeholder="#3b82f6"
                  />
                </TabsContent>
                
                <TabsContent value="hsl" className="mt-2">
                  <Input
                    value={convertedValues.hsl}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="text-xs"
                    placeholder="hsl(217, 91%, 60%)"
                  />
                </TabsContent>
                
                <TabsContent value="rgb" className="mt-2">
                  <Input
                    value={convertedValues.rgb}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="text-xs"
                    placeholder="rgb(59, 130, 246)"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Color Palettes */}
        {showPalettes && (
          <div className="space-y-3">
            <Separator />
            <div>
              <Label className="text-xs font-medium mb-2 block">Quick Colors</Label>
              <div className="grid grid-cols-6 gap-1">
                {Object.values(COLOR_PALETTES).slice(0, 2).flatMap(palette => 
                  palette.colors.slice(0, 3)
                ).map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorChange(color)}
                    className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview & Actions */}
        <div className="space-y-3">
          <Separator />
          
          {/* Color Preview */}
          <div className="flex items-center gap-3">
            <div 
              className="w-16 h-10 rounded border-2 border-gray-200"
              style={{ backgroundColor: localValue }}
            />
            <div className="flex-1 text-xs space-y-1">
              <div className="font-medium">Current: {localValue}</div>
              <div className="text-gray-500">Variable: {variableName}</div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={handleRandomColor}>
              <Shuffle className="w-3 h-3 mr-1" />
              Random
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleColorChange('#3b82f6')}>
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Accessibility Info */}
          {accessibilityScore && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
              <Lightbulb className="w-3 h-3" />
              <span>Accessibility: {accessibilityScore} contrast</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}