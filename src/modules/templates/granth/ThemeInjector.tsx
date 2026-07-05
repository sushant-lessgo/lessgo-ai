'use client';

// src/modules/templates/granth/ThemeInjector.tsx
// Mounts Granth design tokens into the document (edit/preview):
//  1. <html data-palette="sinduri" data-variant="granth">
//  2. <style id="granth-theme"> in <head> with base tokens + palette + variant blocks
//
// Granth is Hindi-only — there is NO edit-language provider (the Lumen bilingual
// apparatus is deliberately dropped). Fonts (Tiro Devanagari Hindi + Mukta) are
// self-hosted globally via src/styles/fonts-self-hosted.css.

import { useEffect, type ReactNode } from 'react';
import type { GranthPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultGranthVariant } from './tokens';
import { serializePaletteOverrides } from './palettes';
import { EDIT_AFFORDANCE_STYLES } from './blocks/editPrimitives';

const STYLE_ID = 'granth-theme';

interface GranthThemeInjectorProps {
  paletteId: GranthPalette;
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

export function GranthThemeInjector({ paletteId, variantId, children }: GranthThemeInjectorProps) {
  const variant = variantId || defaultGranthVariant;

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

export default GranthThemeInjector;
