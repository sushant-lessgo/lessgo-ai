// Variable Text Color Controls - Advanced text color management with CSS variables
// Supports automatic contrast calculation, WCAG compliance, and adaptive text colors

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useVariableTheme } from '@/modules/Design/ColorSystem/VariableThemeInjector';
import { VariableColorPicker } from './ColorPicker/VariableColorPicker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Type, 
  Eye, 
  EyeOff, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Palette,
  Contrast,
  Settings,
  Wand2
} from 'lucide-react';

// WCAG contrast ratio requirements
const WCAG_LEVELS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
};

// Text size classifications
const TEXT_SIZES = {
  small: { minSize: 12, maxSize: 14, label: 'Small Text' },
  normal: { minSize: 16, maxSize: 18, label: 'Normal Text' },
  large: { minSize: 18, maxSize: 24, label: 'Large Text' },
  heading: { minSize: 24, maxSize: 48, label: 'Headings' },
};

interface TextColorConfig {
  primary: string;
  secondary: string;
  muted: string;
  onAccent: string;
  link: string;
  linkHover: string;
  error: string;
  success: string;
  warning: string;
}

interface ContrastResult {
  ratio: number;
  level: 'AA' | 'AAA' | 'FAIL';
  passes: boolean;
  recommendation?: string;
}

interface VariableTextColorControlsProps {
  tokenId: string;
  backgroundColors: Record<string, string>;
  currentColors: TextColorConfig;
  onChange: (colors: Partial<TextColorConfig>) => void;
  autoMode?: boolean;
  showAdvanced?: boolean;
  compactMode?: boolean;
}

export function VariableTextColorControls({
  tokenId,
  backgroundColors,
  currentColors,
  onChange,
  autoMode = true,
  showAdvanced = true,
  compactMode = false,
}: VariableTextColorControlsProps) {
  const { phase, flags } = useVariableTheme(tokenId);
  const [activeMode, setActiveMode] = useState<'auto' | 'manual'>('auto');
  const [selectedBackground, setSelectedBackground] = useState<string>('primary');
  const [targetWCAG, setTargetWCAG] = useState<'AA' | 'AAA'>('AA');
  const [textSize, setTextSize] = useState<keyof typeof TEXT_SIZES>('normal');
  const [showPreview, setShowPreview] = useState(false);
  const [contrastResults, setContrastResults] = useState<Record<string, ContrastResult>>({});

  // Available backgrounds for testing
  const availableBackgrounds = useMemo(() => {
    return Object.entries(backgroundColors).map(([key, value]) => ({
      key,
      value,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    }));
  }, [backgroundColors]);

  // Calculate contrast ratios
  const calculateContrast = useCallback((textColor: string, backgroundColor: string): ContrastResult => {
    try {
      // Simple luminance calculation (would use a proper color library in production)
      const getLuminance = (color: string): number => {
        // This is a simplified calculation - in production, use a proper color library
        let r, g, b;
        
        if (color.startsWith('#')) {
          r = parseInt(color.slice(1, 3), 16) / 255;
          g = parseInt(color.slice(3, 5), 16) / 255;
          b = parseInt(color.slice(5, 7), 16) / 255;
        } else if (color.startsWith('rgb')) {
          const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (matches) {
            r = parseInt(matches[1]) / 255;
            g = parseInt(matches[2]) / 255;
            b = parseInt(matches[3]) / 255;
          } else {
            return 0.5; // Default middle value
          }
        } else {
          return 0.5; // Default for unknown formats
        }
        
        // Convert to relative luminance
        const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
      };
      
      const textLum = getLuminance(textColor);
      const bgLum = getLuminance(backgroundColor);
      
      const ratio = (Math.max(textLum, bgLum) + 0.05) / (Math.min(textLum, bgLum) + 0.05);
      
      const isLargeText = textSize === 'large' || textSize === 'heading';
      const threshold = targetWCAG === 'AAA' 
        ? (isLargeText ? WCAG_LEVELS.AAA_LARGE : WCAG_LEVELS.AAA_NORMAL)
        : (isLargeText ? WCAG_LEVELS.AA_LARGE : WCAG_LEVELS.AA_NORMAL);
      
      const passes = ratio >= threshold;
      let level: 'AA' | 'AAA' | 'FAIL' = 'FAIL';
      
      if (ratio >= WCAG_LEVELS.AAA_NORMAL) level = 'AAA';
      else if (ratio >= WCAG_LEVELS.AA_NORMAL) level = 'AA';
      
      return {
        ratio,
        level,
        passes,
        recommendation: passes ? undefined : `Needs ${threshold.toFixed(1)}:1, got ${ratio.toFixed(2)}:1`
      };
    } catch (error) {
      console.warn('Contrast calculation failed:', error);
      return { ratio: 1, level: 'FAIL', passes: false, recommendation: 'Unable to calculate contrast' };
    }
  }, [targetWCAG, textSize]);

  // Update contrast results when colors change
  useEffect(() => {
    const results: Record<string, ContrastResult> = {};
    const currentBg = backgroundColors[selectedBackground];
    
    if (currentBg) {
      Object.entries(currentColors).forEach(([key, textColor]) => {
        results[key] = calculateContrast(textColor, currentBg);
      });
    }
    
    setContrastResults(results);
  }, [currentColors, backgroundColors, selectedBackground, calculateContrast]);

  // Auto-generate text colors based on background
  const generateAutoColors = useCallback((backgroundColor: string): Partial<TextColorConfig> => {
    const bgLuminance = getLuminanceSimple(backgroundColor);
    const isDark = bgLuminance < 0.5;
    
    if (isDark) {
      // Dark background - use light text
      return {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.8)',
        muted: 'rgba(255, 255, 255, 0.6)',
        onAccent: '#ffffff',
        link: '#60a5fa',
        linkHover: '#3b82f6',
        error: '#fca5a5',
        success: '#86efac',
        warning: '#fbbf24',
      };
    } else {
      // Light background - use dark text
      return {
        primary: '#1f2937',
        secondary: 'rgba(31, 41, 55, 0.8)',
        muted: 'rgba(31, 41, 55, 0.6)',
        onAccent: '#ffffff',
        link: '#2563eb',
        linkHover: '#1d4ed8',
        error: '#dc2626',
        success: '#16a34a',
        warning: '#d97706',
      };
    }
  }, []);

  // Handle auto mode toggle
  const handleAutoModeToggle = useCallback((enabled: boolean) => {
    setActiveMode(enabled ? 'auto' : 'manual');
    
    if (enabled) {
      const currentBg = backgroundColors[selectedBackground];
      if (currentBg) {
        const autoColors = generateAutoColors(currentBg);
        onChange(autoColors);
      }
    }
  }, [backgroundColors, selectedBackground, generateAutoColors, onChange]);

  // Handle background change for testing
  const handleBackgroundChange = useCallback((bgKey: string) => {
    setSelectedBackground(bgKey);
    
    if (activeMode === 'auto') {
      const bgColor = backgroundColors[bgKey];
      if (bgColor) {
        const autoColors = generateAutoColors(bgColor);
        onChange(autoColors);
      }
    }
  }, [activeMode, backgroundColors, generateAutoColors, onChange]);

  // Handle individual color change
  const handleColorChange = useCallback((value: string, colorKey: string) => {
    onChange({ [colorKey]: value });
  }, [onChange]);

  // Generate smart text colors
  const handleSmartGeneration = useCallback(() => {
    const currentBg = backgroundColors[selectedBackground];
    if (!currentBg) return;
    
    const smartColors = generateAutoColors(currentBg);
    onChange(smartColors);
  }, [backgroundColors, selectedBackground, generateAutoColors, onChange]);

  if (compactMode) {
    return (
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm">Auto Text Colors</Label>
          <Switch
            checked={activeMode === 'auto'}
            onCheckedChange={handleAutoModeToggle}
          />
        </div>
        
        {/* Quick color controls */}
        {activeMode === 'manual' && (
          <div className="grid grid-cols-2 gap-2">
            <VariableColorPicker
              variableName="--text-primary"
              value={currentColors.primary}
              onChange={(value) => handleColorChange(value, 'primary')}
              tokenId={tokenId}
              compactMode
            />
            <VariableColorPicker
              variableName="--text-secondary"
              value={currentColors.secondary}
              onChange={(value) => handleColorChange(value, 'secondary')}
              tokenId={tokenId}
              compactMode
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          <h3 className="font-semibold">Text Colors</h3>
          {phase === 'variable' && (
            <Badge variant="secondary" className="text-xs">CSS Variables</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSmartGeneration}>
            <Wand2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Generation Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm">Auto-generate colors</Label>
              <p className="text-xs text-gray-600">
                Automatically calculate optimal text colors based on background
              </p>
            </div>
            <Switch
              checked={activeMode === 'auto'}
              onCheckedChange={handleAutoModeToggle}
            />
          </div>
          
          {activeMode === 'auto' && (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Test Background</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableBackgrounds.map(bg => (
                    <button
                      key={bg.key}
                      onClick={() => handleBackgroundChange(bg.key)}
                      className={`
                        p-2 rounded border text-xs transition-colors
                        ${selectedBackground === bg.key 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accessibility Settings */}
      {showAdvanced && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Contrast className="w-4 h-4" />
              Accessibility Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">WCAG Level</Label>
                <div className="flex gap-1">
                  <Button
                    variant={targetWCAG === 'AA' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTargetWCAG('AA')}
                    className="flex-1"
                  >
                    AA
                  </Button>
                  <Button
                    variant={targetWCAG === 'AAA' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTargetWCAG('AAA')}
                    className="flex-1"
                  >
                    AAA
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Text Size</Label>
                <select
                  value={textSize}
                  onChange={(e) => setTextSize(e.target.value as keyof typeof TEXT_SIZES)}
                  className="w-full px-2 py-1 text-xs border rounded"
                >
                  {Object.entries(TEXT_SIZES).map(([key, size]) => (
                    <option key={key} value={key}>{size.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Contrast Results */}
            <div className="space-y-2">
              <Label className="text-xs">Contrast Results</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(contrastResults).slice(0, 3).map(([key, result]) => (
                  <div
                    key={key}
                    className={`
                      p-2 rounded border text-center
                      ${result.passes 
                        ? 'border-green-200 bg-green-50 text-green-800' 
                        : 'border-red-200 bg-red-50 text-red-800'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {result.passes ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                    </div>
                    <div className="text-xs font-medium capitalize">{key}</div>
                    <div className="text-xs">{result.ratio.toFixed(1)}:1</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Color Controls */}
      {activeMode === 'manual' && (
        <Tabs defaultValue="primary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="primary">Primary</TabsTrigger>
            <TabsTrigger value="accent">Accent</TabsTrigger>
            <TabsTrigger value="semantic">Status</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="primary" className="space-y-4">
            {(['primary', 'secondary', 'muted'] as const).map(colorKey => {
              const result = contrastResults[colorKey];
              return (
                <div key={colorKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize">{colorKey} Text</Label>
                    {result && (
                      <Badge 
                        variant={result.passes ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {result.ratio.toFixed(1)}:1
                      </Badge>
                    )}
                  </div>
                  <VariableColorPicker
                    variableName={`--text-${colorKey}`}
                    value={currentColors[colorKey]}
                    onChange={(value) => handleColorChange(value, colorKey)}
                    tokenId={tokenId}
                    showPalettes={false}
                    allowTransparency
                  />
                  {result && result.recommendation && (
                    <p className="text-xs text-orange-600">{result.recommendation}</p>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="accent" className="space-y-4">
            {(['link', 'linkHover', 'onAccent'] as const).map(colorKey => (
              <div key={colorKey} className="space-y-2">
                <Label className="capitalize">{colorKey.replace(/([A-Z])/g, ' $1')}</Label>
                <VariableColorPicker
                  variableName={`--${colorKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                  value={currentColors[colorKey]}
                  onChange={(value) => handleColorChange(value, colorKey)}
                  tokenId={tokenId}
                  showPalettes={false}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="semantic" className="space-y-4">
            {(['error', 'success', 'warning'] as const).map(colorKey => (
              <div key={colorKey} className="space-y-2">
                <Label className="capitalize">{colorKey}</Label>
                <VariableColorPicker
                  variableName={`--text-${colorKey}`}
                  value={currentColors[colorKey]}
                  onChange={(value) => handleColorChange(value, colorKey)}
                  tokenId={tokenId}
                  showPalettes={false}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="text-sm text-gray-600">
              Advanced text color settings and CSS variable exports will be available here.
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-4 rounded"
              style={{ backgroundColor: backgroundColors[selectedBackground] }}
            >
              <div className="space-y-2">
                <h1 style={{ color: currentColors.primary }} className="text-lg font-bold">
                  Primary Heading Text
                </h1>
                <p style={{ color: currentColors.secondary }} className="text-sm">
                  Secondary body text for descriptions and details.
                </p>
                <p style={{ color: currentColors.muted }} className="text-xs">
                  Muted text for less important information.
                </p>
                <a 
                  href="#" 
                  style={{ color: currentColors.link }}
                  className="text-sm underline"
                >
                  Link text example
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues Alert */}
      {Object.values(contrastResults).some(r => !r.passes) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium text-orange-800">Accessibility Issues Found</div>
              <div className="text-sm text-orange-700">
                {Object.values(contrastResults).filter(r => !r.passes).length} text colors 
                don't meet WCAG {targetWCAG} contrast requirements.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Utility function for simple luminance calculation
function getLuminanceSimple(color: string): number {
  // Simplified luminance calculation
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return 0.5; // Default middle value
}