'use client';

// src/modules/service/design/HearthThemeInjector.tsx
// Mounts Hearth design tokens into the document:
//  1. <html data-palette="..."> attribute drives per-palette accent overrides
//  2. <style id="hearth-theme"> in <head> with :root tokens + palette blocks
//
// Fonts (Fraunces display + DM Sans body) are self-hosted globally via
// src/styles/fonts-self-hosted.css. Fraunces is shipped as a variable woff2 that
// preserves the opsz 9..144 axis (drives `font-variation-settings: "opsz" 144`).
//
// Phase 1 only — Phase 3 mounts this from the renderer when audienceType==='service'.

import { useEffect, type ReactNode } from 'react';
import type { HearthPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultHearthVariant } from './tokens';
import { serializePaletteOverrides } from './palettes';

const STYLE_ID = 'hearth-theme';

interface HearthThemeInjectorProps {
  paletteId: HearthPalette;
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

export function HearthThemeInjector({ paletteId, variantId, children }: HearthThemeInjectorProps) {
  const variant = variantId || defaultHearthVariant;
  useEffect(() => {
    ensureStyleTag();
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variant;

    return () => {
      // Clean up only the data attributes on unmount; keep the <style> around
      // in case another HearthThemeInjector re-mounts (avoids FOUC).
      // Full cleanup happens implicitly when the page navigates away.
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
    };
  }, [paletteId, variant]);

  return <>{children}</>;
}

export default HearthThemeInjector;
