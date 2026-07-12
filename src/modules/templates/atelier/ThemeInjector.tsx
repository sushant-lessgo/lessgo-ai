'use client';

// src/modules/templates/atelier/ThemeInjector.tsx
// Mounts Atelier design tokens into the document (edit/preview):
//  1. <html data-palette="vermilion" data-variant="editorial">
//  2. <style id="atelier-theme"> in <head> with base tokens + palette + variant
//     blocks (+ edit affordance chrome).
// PARITY: AtelierSSRTokens (published) must emit the same attributes + CSS.
// NO mood axis (dropped from the vestria clone). Fonts self-hosted globally.

import { useEffect, type ReactNode } from 'react';
import type { AtelierPalette } from '@/types/service';
import {
  serializeBaseTokens,
  serializeVariantOverrides,
  defaultAtelierVariant,
} from './tokens';
import { serializePaletteOverrides } from './palettes';
import { EDIT_AFFORDANCE_STYLES } from './blocks/editPrimitives';

const STYLE_ID = 'atelier-theme';

interface AtelierThemeInjectorProps {
  paletteId: AtelierPalette;
  variantId?: string;
  children?: ReactNode;
}

function buildStylesheet(): string {
  // EDIT_AFFORDANCE_STYLES is appended here only (edit/preview) — the published
  // SSRTokens omit it (no image/list/link edit chrome on live pages).
  return `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}\n${EDIT_AFFORDANCE_STYLES}`;
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

export function AtelierThemeInjector({ paletteId, variantId, children }: AtelierThemeInjectorProps) {
  const variant = variantId || defaultAtelierVariant;

  useEffect(() => {
    ensureStyleTag();
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variant;

    return () => {
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
    };
  }, [paletteId, variant]);

  return <>{children}</>;
}

export default AtelierThemeInjector;
