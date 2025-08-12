// Variable Color Controls - Advanced UI for customizing CSS variables
// Supports real-time color editing, palette management, and accessibility validation

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useVariableTheme } from './VariableThemeInjector';
import { useHybridCompatibility } from './HybridModeCompatibility';
import { generateVariableColorSystem } from './variableColorTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Pipette, 
  Copy, 
  Trash2, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Download, 
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Code2,
  Shuffle
} from 'lucide-react';

interface ColorVariable {
  key: string;
  value: string;
  label: string;
  category: 'gradient' | 'accent' | 'text' | 'background' | 'effect';
  description?: string;
  defaultValue: string;
}

interface ColorPalette {
  id: string;
  name: string;
  colors: Record<string, string>;
  description?: string;
  isBuiltIn?: boolean;
}

interface VariableColorControlsProps {
  tokenId: string;
  customColors: Record<string, string>;
  onColorChange: (colors: Record<string, string>) => void;
  backgroundSystem?: any;
  compactMode?: boolean;
  showAdvanced?: boolean;
}

// Built-in color palettes
const BUILT_IN_PALETTES: ColorPalette[] = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    isBuiltIn: true,
    description: 'Professional blue gradient with purple accents',
    colors: {
      '--gradient-from': '#3b82f6',
      '--gradient-via': '#6366f1',
      '--gradient-to': '#8b5cf6',
      '--accent-primary': '#f59e0b',
      '--text-primary': '#1f2937',
    }
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    isBuiltIn: true,
    description: 'Orange to pink gradient with warm accents',
    colors: {
      '--gradient-from': '#f97316',
      '--gradient-via': '#ec4899',
      '--gradient-to': '#8b5cf6',
      '--accent-primary': '#10b981',
      '--text-primary': '#ffffff',
    }
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    isBuiltIn: true,
    description: 'Nature-inspired green palette',
    colors: {
      '--gradient-from': '#059669',
      '--gradient-via': '#10b981',
      '--gradient-to': '#34d399',
      '--accent-primary': '#f59e0b',
      '--text-primary': '#065f46',
    }
  },
  {
    id: 'elegant-purple',
    name: 'Elegant Purple',
    isBuiltIn: true,
    description: 'Rich purple gradient with gold accents',
    colors: {
      '--gradient-from': '#7c3aed',
      '--gradient-via': '#8b5cf6',
      '--gradient-to': '#a855f7',
      '--accent-primary': '#f59e0b',
      '--text-primary': '#1f2937',
    }
  },
];

// Color variable definitions
const COLOR_VARIABLES: ColorVariable[] = [
  // Gradient Variables
  { key: '--gradient-from', label: 'Gradient Start', category: 'gradient', defaultValue: '#3b82f6', description: 'Starting color of gradients' },
  { key: '--gradient-via', label: 'Gradient Middle', category: 'gradient', defaultValue: '#6366f1', description: 'Middle color of gradients' },
  { key: '--gradient-to', label: 'Gradient End', category: 'gradient', defaultValue: '#8b5cf6', description: 'Ending color of gradients' },
  
  // Accent Variables
  { key: '--accent-primary', label: 'Primary Accent', category: 'accent', defaultValue: '#f59e0b', description: 'Main accent color for buttons and links' },
  { key: '--accent-secondary', label: 'Secondary Accent', category: 'accent', defaultValue: '#10b981', description: 'Secondary accent color' },
  
  // Text Variables
  { key: '--text-primary', label: 'Primary Text', category: 'text', defaultValue: '#1f2937', description: 'Main text color' },
  { key: '--text-secondary', label: 'Secondary Text', category: 'text', defaultValue: '#6b7280', description: 'Secondary text color' },
  { key: '--text-muted', label: 'Muted Text', category: 'text', defaultValue: '#9ca3af', description: 'Muted text color' },
  
  // Background Variables
  { key: '--bg-primary-base', label: 'Primary Background', category: 'background', defaultValue: '#ffffff', description: 'Primary background color' },
  { key: '--bg-secondary-base', label: 'Secondary Background', category: 'background', defaultValue: '#f9fafb', description: 'Secondary background color' },
  
  // Effect Variables
  { key: '--blur-custom', label: 'Blur Amount', category: 'effect', defaultValue: '8px', description: 'Custom blur effect strength' },
  { key: '--opacity-custom', label: 'Opacity Level', category: 'effect', defaultValue: '0.8', description: 'Custom opacity level' },
];

export function VariableColorControls({
  tokenId,
  customColors,
  onColorChange,
  backgroundSystem,
  compactMode = false,
  showAdvanced = true
}: VariableColorControlsProps) {
  const { phase, flags } = useVariableTheme(tokenId);
  const compatibility = useHybridCompatibility();
  
  const [activeCategory, setActiveCategory] = useState<string>('gradient');
  const [selectedPalette, setSelectedPalette] = useState<string>('');
  const [customPalettes, setCustomPalettes] = useState<ColorPalette[]>([]);
  const [showColorCode, setShowColorCode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [accessibilityWarnings, setAccessibilityWarnings] = useState<string[]>([]);

  // Merge default values with custom colors
  const currentColors = useMemo(() => {
    const colors: Record<string, string> = {};
    COLOR_VARIABLES.forEach(variable => {
      colors[variable.key] = customColors[variable.key] || variable.defaultValue;
    });
    return colors;
  }, [customColors]);

  // Group variables by category
  const categorizedVariables = useMemo(() => {
    return COLOR_VARIABLES.reduce((acc, variable) => {
      if (!acc[variable.category]) acc[variable.category] = [];
      acc[variable.category].push(variable);
      return acc;
    }, {} as Record<string, ColorVariable[]>);
  }, []);

  // Check accessibility
  useEffect(() => {
    const warnings: string[] = [];
    
    // Check contrast ratios
    const textColor = currentColors['--text-primary'];
    const backgroundColor = currentColors['--bg-primary-base'];
    
    if (textColor && backgroundColor) {
      // Simple contrast check (would need more sophisticated calculation in real app)
      const textLuminance = getColorLuminance(textColor);
      const bgLuminance = getColorLuminance(backgroundColor);
      const contrast = (Math.max(textLuminance, bgLuminance) + 0.05) / (Math.min(textLuminance, bgLuminance) + 0.05);
      
      if (contrast < 4.5) {
        warnings.push(`Low contrast ratio: ${contrast.toFixed(2)} (recommended: 4.5+)`);
      }
    }
    
    setAccessibilityWarnings(warnings);
  }, [currentColors]);

  // Handle individual color change
  const handleColorChange = useCallback((key: string, value: string) => {
    const updatedColors = { ...currentColors, [key]: value };
    onColorChange(updatedColors);
  }, [currentColors, onColorChange]);

  // Apply palette
  const handleApplyPalette = useCallback((palette: ColorPalette) => {
    const updatedColors = { ...currentColors, ...palette.colors };
    onColorChange(updatedColors);
    setSelectedPalette(palette.id);
  }, [currentColors, onColorChange]);

  // Generate random colors
  const handleGenerateRandom = useCallback(() => {
    const randomColors = {
      '--gradient-from': generateRandomColor(),
      '--gradient-via': generateRandomColor(),
      '--gradient-to': generateRandomColor(),
      '--accent-primary': generateRandomColor(),
      '--accent-secondary': generateRandomColor(),
    };
    
    const updatedColors = { ...currentColors, ...randomColors };
    onColorChange(updatedColors);
  }, [currentColors, onColorChange]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaultColors: Record<string, string> = {};
    COLOR_VARIABLES.forEach(variable => {
      defaultColors[variable.key] = variable.defaultValue;
    });
    onColorChange(defaultColors);
    setSelectedPalette('');
  }, [onColorChange]);

  // Save custom palette
  const handleSavePalette = useCallback(() => {
    const name = prompt('Enter palette name:');
    if (!name) return;
    
    const newPalette: ColorPalette = {
      id: `custom-${Date.now()}`,
      name,
      colors: { ...currentColors },
      description: 'Custom palette',
      isBuiltIn: false,
    };
    
    setCustomPalettes(prev => [...prev, newPalette]);
  }, [currentColors]);

  // Export configuration
  const handleExport = useCallback(() => {
    const config = {
      colors: currentColors,
      palettes: customPalettes,
      timestamp: Date.now(),
      version: '1.0',
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `variable-colors-${tokenId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentColors, customPalettes, tokenId]);

  // CSS code for display
  const cssCode = useMemo(() => {
    return Object.entries(currentColors)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n');
  }, [currentColors]);

  if (compactMode) {
    return (
      <div className="space-y-4">
        {/* Quick color controls */}
        <div className="grid grid-cols-2 gap-3">
          {COLOR_VARIABLES.slice(0, 4).map(variable => (
            <div key={variable.key}>
              <Label className="text-xs">{variable.label}</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={currentColors[variable.key]}
                  onChange={(e) => handleColorChange(variable.key, e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={currentColors[variable.key]}
                  onChange={(e) => handleColorChange(variable.key, e.target.value)}
                  className="flex-1 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Quick actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateRandom}>
            <Shuffle className="w-3 h-3 mr-1" />
            Random
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with mode indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          <h3 className="font-semibold">Color Variables</h3>
          <Badge variant={phase === 'variable' ? 'default' : 'secondary'}>
            {phase}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowColorCode(!showColorCode)}>
            <Code2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Accessibility warnings */}
      {accessibilityWarnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <CardTitle className="text-sm text-orange-800 dark:text-orange-200">
                Accessibility Warnings
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-xs space-y-1">
              {accessibilityWarnings.map((warning, index) => (
                <li key={index} className="text-orange-700 dark:text-orange-300">
                  • {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* CSS Code display */}
      {showColorCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              CSS Variables
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(cssCode)}>
                <Copy className="w-3 h-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
              {cssCode}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Main controls */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="gradient">Gradient</TabsTrigger>
          <TabsTrigger value="accent">Accent</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="effect">Effects</TabsTrigger>
        </TabsList>

        {Object.entries(categorizedVariables).map(([category, variables]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {variables.map(variable => (
              <div key={variable.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{variable.label}</Label>
                  {variable.description && (
                    <span className="text-xs text-gray-500">{variable.description}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentColors[variable.key]}
                    onChange={(e) => handleColorChange(variable.key, e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                    disabled={variable.category === 'effect'}
                  />
                  
                  <div className="flex-1">
                    <Input
                      value={currentColors[variable.key]}
                      onChange={(e) => handleColorChange(variable.key, e.target.value)}
                      placeholder={variable.defaultValue}
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleColorChange(variable.key, variable.defaultValue)}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Palette section */}
      <div className="space-y-4">
        <Separator />
        
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Color Palettes</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSavePalette}>
              Save Palette
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateRandom}>
              <Sparkles className="w-4 h-4 mr-1" />
              Generate
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BUILT_IN_PALETTES.concat(customPalettes).map(palette => (
            <Card
              key={palette.id}
              className={`cursor-pointer transition-all ${
                selectedPalette === palette.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              }`}
              onClick={() => handleApplyPalette(palette)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{palette.name}</span>
                  {palette.isBuiltIn && <Badge variant="secondary" className="text-xs">Built-in</Badge>}
                </div>
                
                {palette.description && (
                  <p className="text-xs text-gray-600 mb-2">{palette.description}</p>
                )}
                
                <div className="flex gap-1">
                  {Object.values(palette.colors).slice(0, 5).map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateRandom}>
            <Shuffle className="w-4 h-4 mr-1" />
            Randomize
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}

// Utility functions
function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 50 + Math.floor(Math.random() * 40); // 50-90%
  const lightness = 40 + Math.floor(Math.random() * 20); // 40-60%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getColorLuminance(hex: string): number {
  // Simple luminance calculation - in a real app, use a proper color library
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  return 0.299 * r + 0.587 * g + 0.114 * b;
}