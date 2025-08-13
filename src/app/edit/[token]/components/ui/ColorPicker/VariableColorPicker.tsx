// Variable Color Picker - Enhanced color picker with CSS variable support
// Supports real-time variable updates, palette management, and accessibility validation

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Temporarily disabled: import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useVariableTheme } from '@/modules/Design/ColorSystem/VariableThemeInjector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Temporarily disabled: import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Temporarily disabled: import { Slider } from '@/components/ui/slider';
// Temporarily disabled: import { Separator } from '@/components/ui/separator';

interface VariableColorPickerProps {
  variableName: string;
  value?: string;
  onChange?: (value: string) => void;
  tokenId: string;
  label?: string;
  description?: string;
  showPalettes?: boolean;
  showAdvanced?: boolean;
  compactMode?: boolean;
  allowTransparency?: boolean;
}

/**
 * Variable Color Picker Component - Simplified Version
 * 
 * This is a temporary simplified version until all dependencies are installed.
 * The full version provides CSS variable-aware color picking with real-time preview.
 */
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
  const [localValue, setLocalValue] = useState(value || '#3b82f6');

  const handleColorChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <Card className={compactMode ? 'p-2' : ''}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">{label || variableName}</Label>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={localValue}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-12 rounded border-2 border-gray-200 cursor-pointer"
            />
            <div className="flex-1">
              <Input
                type="text"
                value={localValue}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#000000"
                className="font-mono text-sm"
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Variable: {variableName}
          </div>
          
          {showPalettes && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Quick Colors</div>
              <div className="grid grid-cols-8 gap-2">
                {[
                  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
                  '#f59e0b', '#ef4444', '#84cc16', '#6366f1'
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                      localValue === color ? 'border-gray-800' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}