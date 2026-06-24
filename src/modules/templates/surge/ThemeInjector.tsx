'use client';

// src/modules/templates/surge/ThemeInjector.tsx
// Mounts Surge design tokens into the document:
//  1. <html data-palette="..." data-variant="..."> drives per-palette accent-hue
//     + per-variant overrides
//  2. <style id="surge-theme"> in <head> with :root tokens + palette + variant blocks
//
// Fonts (Archivo display + Hanken Grotesk body + JetBrains Mono data + Instrument
// Serif editorial) are self-hosted globally via src/styles/fonts-self-hosted.css.

import { useEffect, type ReactNode } from 'react';
import type { SurgePalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultSurgeVariant } from './tokens';
import { serializePaletteOverrides } from './palettes';

const STYLE_ID = 'surge-theme';

interface SurgeThemeInjectorProps {
  paletteId: SurgePalette;
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

export function SurgeThemeInjector({ paletteId, variantId, children }: SurgeThemeInjectorProps) {
  const variant = variantId || defaultSurgeVariant;
  useEffect(() => {
    ensureStyleTag();
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variant;

    return () => {
      // Clean up only the data attributes on unmount; keep the <style> around
      // in case another SurgeThemeInjector re-mounts (avoids FOUC).
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
    };
  }, [paletteId, variant]);

  return <>{children}</>;
}

export default SurgeThemeInjector;
