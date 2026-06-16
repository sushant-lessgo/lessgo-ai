'use client';

// src/modules/templates/lex/ThemeInjector.tsx
// Client-side Lex token injector (edit/preview). Mirrors HearthThemeInjector:
//  1. <html data-palette="..." data-variant="statesman"> drives per-palette
//     trust/accent/paper overrides (variant switching arrives in Phase 11b)
//  2. <style id="lex-theme"> in <head> with :root tokens + palette blocks
//
// Fonts (Source Serif 4 + Inter Tight + JetBrains Mono, plus Lora / EB Garamond
// for the clinical / civic variants) are self-hosted globally via
// src/styles/fonts-self-hosted.css. The variant display swap is driven purely by
// the `--font-display` token override in serializeVariantOverrides().

import { useEffect, type ReactNode } from 'react';
import type { LexPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultLexVariant } from './tokens';
import { serializePaletteOverrides } from './palettes';

const STYLE_ID = 'lex-theme';

interface LexThemeInjectorProps {
  paletteId: LexPalette;
  variantId?: string;
  children?: ReactNode;
}

function buildStylesheet(): string {
  return `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;
}

function ensureStyleTag(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
    el.textContent = buildStylesheet();
  } else if (!el.textContent) {
    el.textContent = buildStylesheet();
  }
  return el;
}

export function LexThemeInjector({ paletteId, variantId, children }: LexThemeInjectorProps) {
  const variant = variantId || defaultLexVariant;
  useEffect(() => {
    ensureStyleTag();
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variant;

    return () => {
      // Clean up only the data attributes on unmount; keep the <style> around
      // in case another LexThemeInjector re-mounts (avoids FOUC).
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
    };
  }, [paletteId, variant]);

  return <>{children}</>;
}

export default LexThemeInjector;
