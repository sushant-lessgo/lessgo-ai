"use client";

// LEGACY PRODUCT design menu (non-template-module projects only — EditHeader's
// dispatch). Restyled to the t14 visual vocabulary in editor-shell-redesign
// phase 5, but deliberately NOT folded into DesignMenuShell (plan step 3 / scout
// §E): this panel drives the legacy 30-palette colour system (palette siblings,
// textures, card style, CUSTOM HEX accents) instead of TEMPLATE/STYLE/ACCENT, and
// t14's "Curated set — no free color or background editing" footer would be a
// flat lie on a surface that ships a colour picker. Only the shared *trigger*
// (t1's one Design button) is reused. Behaviour is untouched: every handler,
// the contrast check, and the wired "Browse all styles" → StyleBrowserModal
// survive verbatim.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { StyleBrowserModal } from './StyleBrowserModal';
import { usePaletteSwap } from './usePaletteSwap';
import { Popover, PopoverTrigger, AppPopoverPanel } from '@/components/ui/popover';
import { AppIcon } from '@/components/ui/icon';
import { DesignMenuTrigger } from './DesignMenuShell';
import { useEditStore } from '@/hooks/useEditStore';
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
  // Render-read: theme (palette/texture/accent/backgrounds). updateTheme +
  // recalculateTextColors are stable action refs used only in handlers.
  const {
    theme,
    updateTheme,
    recalculateTextColors,
  } = useEditStore(
    useShallow((s) => ({
      theme: s.theme,
      updateTheme: s.updateTheme,
      recalculateTextColors: s.recalculateTextColors,
    }))
  );

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

  // (The old palette-preview swatch on the trigger is gone: t1 draws ONE
  // `palette`-icon "Design" button, tinted with the live accent instead.)

  if (!activePalette) {
    // No palette set — show minimal trigger that does nothing
    return (
      <Popover>
        <PopoverTrigger asChild>
          <DesignMenuTrigger accentColor="#cdcdd4" title="Design — no palette selected" />
        </PopoverTrigger>
        <AppPopoverPanel side="bottom" align="start" width={288}>
          <p className="px-3.5 py-3.5 text-[12px] text-app-muted">
            No palette active. Generate a page to set a palette.
          </p>
        </AppPopoverPanel>
      </Popover>
    );
  }

  return (
    <>
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <DesignMenuTrigger
          accentColor={
            currentAccent === 'custom' && currentAccentCSS
              ? currentAccentCSS
              : (currentAccent && ACCENT_HEX[currentAccent]) || '#006CFF'
          }
          title="Design — palette, accent & texture"
        />
      </PopoverTrigger>

      <AppPopoverPanel
        side="bottom"
        align="start"
        width={288}
        // Same height bound as DesignMenuShell (see its note): the panel is
        // taller than the viewport on small screens and AppPopoverPanel clips.
        className="flex max-h-[var(--radix-popover-content-available-height,80vh)] flex-col"
      >
        {/* t14 header. */}
        <div className="flex flex-none items-center gap-2 border-b border-app-divider px-3.5 py-3">
          <AppIcon name="palette" size={18} className="flex-none text-app-primary" />
          <span className="flex-1 text-[14px] font-semibold text-app-ink">Design</span>
          <button
            type="button"
            onClick={() => setPopoverOpen(false)}
            aria-label="Close"
            className="-mr-1 flex-none rounded-app-badge p-1 text-app-icon-muted transition-colors hover:bg-app-hairline"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-3.5 py-3.5">
          {/* ─── Palette ─── */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.09em] text-app-faint">
              Palette
            </p>
            <div className="flex flex-wrap gap-2">
              {paletteSiblings.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePaletteSwap(p)}
                  aria-pressed={p.id === paletteId}
                  className="h-9 w-9 flex-none rounded-lg transition-shadow"
                  style={{
                    background: p.primary,
                    boxShadow:
                      p.id === paletteId
                        ? '0 0 0 2px #fff, 0 0 0 3.5px #006CFF'
                        : '0 0 0 1px #e6e6ec',
                  }}
                  title={p.label}
                />
              ))}
            </div>
          </div>

          {/* ─── Accent — 26px swatches, t14 double-ring selection ─── */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.09em] text-app-faint">
              Accent
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {compatibleAccents.map((accent) => (
                <button
                  key={accent.name}
                  onClick={() => handleAccentChange(accent.name, accent.tailwind)}
                  aria-pressed={currentAccent === accent.name}
                  className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg transition-shadow"
                  style={{
                    backgroundColor: accent.hex,
                    boxShadow:
                      currentAccent === accent.name
                        ? '0 0 0 2px #fff, 0 0 0 3.5px #006CFF'
                        : undefined,
                  }}
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
                className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg text-[12px] font-semibold text-app-muted transition-shadow"
                style={
                  currentAccent === 'custom' && currentAccentCSS
                    ? {
                        backgroundColor: currentAccentCSS,
                        boxShadow: '0 0 0 2px #fff, 0 0 0 3.5px #006CFF',
                      }
                    : { backgroundColor: '#f1f1f5', boxShadow: '0 0 0 1px #e6e6ec' }
                }
                title="Custom color"
              >
                {currentAccent !== 'custom' && <span>+</span>}
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
                    className="h-8 w-8 cursor-pointer rounded-app-badge border-0 p-0"
                  />
                  <input
                    type="text"
                    value={customHex}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setCustomHex(v);
                    }}
                    className="w-24 rounded-app-ctl-sm border border-app-border-hairline px-2.5 py-[7px] font-app-mono text-[12px] text-app-ink"
                    placeholder="#3b82f6"
                  />
                  <button
                    onClick={handleApplyCustomAccent}
                    className="text-[11.5px] font-semibold text-app-primary transition-colors hover:text-app-primary-hover"
                  >
                    Apply
                  </button>
                </div>
                {contrastWarning !== null && contrastWarning < 4.5 && (
                  <p className="text-[10.5px] text-app-review-text">
                    Low CTA contrast ({contrastWarning.toFixed(1)}:1)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ─── Texture ─── */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.09em] text-app-faint">
              Texture
            </p>
            <div className="flex flex-wrap gap-1.5">
              {compatibleTextures.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTextureChange(t.id)}
                  aria-pressed={textureId === t.id}
                  className={`rounded-app-badge border px-2.5 py-[5px] text-[11.5px] transition-colors ${
                    textureId === t.id
                      ? 'border-app-primary bg-app-tint-soft font-semibold text-app-primary'
                      : 'border-app-border-hairline font-medium text-app-dim hover:bg-app-hover'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Card Style ─── */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.09em] text-app-faint">
              Card style
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(['neutral', 'warm', 'cool'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateTheme({ uiBlockTheme: t })}
                  aria-pressed={(theme?.uiBlockTheme || 'neutral') === t}
                  className={`rounded-app-badge border px-2.5 py-[5px] text-[11.5px] transition-colors ${
                    (theme?.uiBlockTheme || 'neutral') === t
                      ? 'border-app-primary bg-app-tint-soft font-semibold text-app-primary'
                      : 'border-app-border-hairline font-medium text-app-dim hover:bg-app-hover'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — WIRED "Browse all styles" (StyleBrowserModal exists and works
            today; decision 10's lesson — never grey a working control). t14's
            lock strip is deliberately absent: this surface DOES offer free colour
            editing, so the curated-set claim would be false here. */}
        <button
          onClick={() => {
            setPopoverOpen(false);
            setStyleBrowserOpen(true);
          }}
          className="flex w-full flex-none items-center justify-between gap-1.5 border-t border-app-divider bg-app-surface-sunken px-3.5 py-2.5 text-[11.5px] font-semibold text-app-primary transition-colors hover:bg-app-hairline"
        >
          <span>Browse all styles</span>
          <AppIcon name="arrow_forward" size={15} />
        </button>
      </AppPopoverPanel>

    </Popover>

      <StyleBrowserModal open={styleBrowserOpen} onOpenChange={setStyleBrowserOpen} />
    </>
  );
}
