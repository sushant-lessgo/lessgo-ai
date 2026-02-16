"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleBrowserModal } from './StyleBrowserModal';
import { usePaletteSwap } from './usePaletteSwap';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import {
  getPaletteById,
  getSiblingPalettes,
} from '@/modules/Design/background/palettes';
import { getCompatibleTextures, compileBackground } from '@/modules/Design/background/textures';
import { accentOptions } from '@/modules/Design/ColorSystem/accentOptions';
import { parseColor, calculateContrastRatio } from '@/utils/colorUtils';

// Hex values for accent swatch rendering (Tailwind 500-level)
const ACCENT_HEX: Record<string, string> = {
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  emerald: '#10b981',
  amber: '#f59e0b',
  purple: '#a855f7',
  orange: '#f97316',
  indigo: '#6366f1',
  blue: '#3b82f6',
};

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = parseColor(hex1);
  const rgb2 = parseColor(hex2);
  if (!rgb1 || !rgb2) return 21; // assume safe if parse fails
  return calculateContrastRatio(rgb1, rgb2);
}

// Extract a displayable hex from a CSS background value (gradient or solid)
function extractHexFromBg(bg: string): string {
  // Try hex first
  const hexMatch = bg.match(/#[a-fA-F0-9]{6}/);
  if (hexMatch) return hexMatch[0];
  // Try rgba
  const rgbaMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#ffffff';
}

export function ThemePopover() {
  const {
    theme,
    updateTheme,
    recalculateTextColors,
  } = useEditStore();

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customHex, setCustomHex] = useState('#3b82f6');
  const [contrastWarning, setContrastWarning] = useState<number | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [styleBrowserOpen, setStyleBrowserOpen] = useState(false);

  const handlePaletteSwap = usePaletteSwap();

  const paletteId = theme?.colors?.paletteId;
  const textureId = theme?.colors?.textureId || 'none';
  const currentAccent = theme?.colors?.accentColor;
  const currentAccentCSS = theme?.colors?.accentCSS;

  const activePalette = useMemo(
    () => (paletteId ? getPaletteById(paletteId) : null),
    [paletteId]
  );

  // Siblings + current palette for the swatch row
  const paletteSiblings = useMemo(() => {
    if (!activePalette || !paletteId) return [];
    const siblings = getSiblingPalettes(paletteId);
    return [activePalette, ...siblings];
  }, [activePalette, paletteId]);

  // Compatible accent options for this palette
  const compatibleAccents = useMemo(() => {
    if (!activePalette) return [];
    return activePalette.compatibleAccents.map((name) => {
      // Find matching accentOption, prefer same baseColor
      const match =
        accentOptions.find(
          (o) => o.accentColor === name && o.baseColor === activePalette.baseColor
        ) || accentOptions.find((o) => o.accentColor === name);
      return {
        name,
        hex: ACCENT_HEX[name] || '#6b7280',
        tailwind: match?.tailwind || `bg-${name}-500`,
      };
    });
  }, [activePalette]);

  // Compatible textures for this palette
  const compatibleTextures = useMemo(() => {
    if (!activePalette) return [];
    return getCompatibleTextures(activePalette);
  }, [activePalette]);

  // Contrast check for custom hex (debounced via useEffect)
  useEffect(() => {
    if (!showCustomInput) return;
    const primaryBg = theme?.colors?.sectionBackgrounds?.primary || '#ffffff';
    const bgHex = extractHexFromBg(primaryBg);
    const ratio = getContrastRatio(customHex, bgHex);
    setContrastWarning(ratio);
  }, [customHex, showCustomInput, theme?.colors?.sectionBackgrounds?.primary]);

  // ─── Handlers ───

  const handleAccentChange = useCallback(
    (accentName: string, tailwindCSS: string) => {
      updateTheme({
        colors: {
          ...theme.colors,
          accentColor: accentName,
          accentCSS: tailwindCSS,
        },
      });
    },
    [theme.colors, updateTheme]
  );

  const handleApplyCustomAccent = useCallback(() => {
    if (!/^#[0-9a-fA-F]{6}$/.test(customHex)) return;
    updateTheme({
      colors: {
        ...theme.colors,
        accentColor: 'custom',
        accentCSS: customHex,
      },
    });
  }, [customHex, theme.colors, updateTheme]);

  const handleTextureChange = useCallback(
    (newTextureId: string) => {
      if (!activePalette) return;

      const compiledPrimary = compileBackground(activePalette, newTextureId, 'primary');
      const compiledSecondary = compileBackground(activePalette, newTextureId, 'secondary');

      updateTheme({
        colors: {
          ...theme.colors,
          textureId: newTextureId,
          sectionBackgrounds: {
            ...theme.colors.sectionBackgrounds,
            primary: compiledPrimary,
            secondary: compiledSecondary,
          },
        },
      });

      recalculateTextColors();
    },
    [activePalette, theme.colors, updateTheme, recalculateTextColors]
  );

  // Current palette preview color for trigger button
  const triggerPreview = activePalette?.primary || theme?.colors?.sectionBackgrounds?.primary || 'linear-gradient(135deg, #3b82f6, #2563eb)';

  if (!activePalette) {
    // No palette set — show minimal trigger that does nothing
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
            title="Theme — No palette selected"
          >
            <div className="w-4 h-4 rounded-sm bg-gray-300" />
            <span>Theme</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-80">
          <p className="text-sm text-gray-500">
            No palette active. Generate a page to set a palette.
          </p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          title="Theme — Palette, accent & texture"
        >
          <div
            className="w-4 h-4 rounded-sm"
            style={{ background: triggerPreview }}
          />
          <span>Theme</span>
        </button>
      </PopoverTrigger>

      <PopoverContent side="bottom" align="start" className="w-80 p-0">
        <div className="p-4 space-y-4">
          {/* ─── Palette ─── */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Palette</p>
            <div className="flex gap-2">
              {paletteSiblings.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePaletteSwap(p)}
                  className={`w-10 h-10 rounded-md border-2 transition-all ${
                    p.id === paletteId
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ background: p.primary }}
                  title={p.label}
                />
              ))}
            </div>
          </div>

          {/* ─── Accent ─── */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Accent</p>
            <div className="flex gap-2 items-center">
              {compatibleAccents.map((accent) => (
                <button
                  key={accent.name}
                  onClick={() => handleAccentChange(accent.name, accent.tailwind)}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    currentAccent === accent.name
                      ? 'border-gray-800 ring-2 ring-gray-300'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: accent.hex }}
                  title={accent.name}
                >
                  {currentAccent === accent.name && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Custom accent toggle */}
              <button
                onClick={() => setShowCustomInput((v) => !v)}
                className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center text-xs font-medium ${
                  currentAccent === 'custom'
                    ? 'border-gray-800 ring-2 ring-gray-300'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={
                  currentAccent === 'custom' && currentAccentCSS
                    ? { backgroundColor: currentAccentCSS }
                    : { backgroundColor: '#e5e7eb' }
                }
                title="Custom color"
              >
                {currentAccent !== 'custom' && (
                  <span className="text-gray-500">+</span>
                )}
              </button>
            </div>

            {/* Custom hex input */}
            {showCustomInput && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={customHex}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setCustomHex(v);
                    }}
                    className="font-mono text-sm border rounded px-2 py-1 w-24"
                    placeholder="#3b82f6"
                  />
                  <button
                    onClick={handleApplyCustomAccent}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Apply
                  </button>
                </div>
                {contrastWarning !== null && contrastWarning < 4.5 && (
                  <p className="text-xs text-orange-600">
                    Low CTA contrast ({contrastWarning.toFixed(1)}:1)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ─── Texture ─── */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Texture</p>
            <div className="flex gap-2">
              {compatibleTextures.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTextureChange(t.id)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                    textureId === t.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Card Style ─── */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Card Style</p>
            <div className="flex gap-2">
              {(['neutral', 'warm', 'cool'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateTheme({ uiBlockTheme: t })}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                    (theme?.uiBlockTheme || 'neutral') === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Divider ─── */}
          <div className="border-t border-gray-100" />

          {/* ─── Browse all styles ─── */}
          <button
            onClick={() => {
              setPopoverOpen(false);
              setStyleBrowserOpen(true);
            }}
            className="w-full text-left text-sm text-gray-600 hover:text-gray-900 flex items-center justify-between transition-colors"
          >
            <span>Browse all styles</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </PopoverContent>

    </Popover>

      <StyleBrowserModal open={styleBrowserOpen} onOpenChange={setStyleBrowserOpen} />
    </>
  );
}
