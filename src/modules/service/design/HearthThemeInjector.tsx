'use client';

// src/modules/service/design/HearthThemeInjector.tsx
// Mounts Hearth design tokens into the document:
//  1. <html data-palette="..."> attribute drives per-palette accent overrides
//  2. <style id="hearth-theme"> in <head> with :root tokens + palette blocks
//  3. <link id="hearth-fraunces"> for Fraunces Google Fonts (DM Sans is
//     self-hosted; do NOT load it from Google here to avoid double-loading)
//
// Phase 1 only — Phase 3 mounts this from the renderer when projectType==='service'.

import { useEffect, type ReactNode } from 'react';
import type { HearthPalette } from '@/types/service';
import { serializeBaseTokens } from './tokens';
import { serializePaletteOverrides } from './palettes';

const STYLE_ID = 'hearth-theme';
const FONT_LINK_ID = 'hearth-fraunces';

/**
 * Pinned exact axis tuple from Hearth - Warm Service.html (line 9).
 * Includes opsz 9..144 axis — drives `font-variation-settings: "opsz" 144`
 * on display headings. Dropping opsz makes optical sizing inert.
 */
const FRAUNCES_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&display=swap';

interface HearthThemeInjectorProps {
  paletteId: HearthPalette;
  children?: ReactNode;
}

function buildStylesheet(): string {
  return `${serializeBaseTokens()}\n${serializePaletteOverrides()}`;
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

function ensureFontLink(): HTMLLinkElement {
  let el = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.id = FONT_LINK_ID;
    el.rel = 'stylesheet';
    el.href = FRAUNCES_HREF;
    document.head.appendChild(el);
  }
  return el;
}

export function HearthThemeInjector({ paletteId, children }: HearthThemeInjectorProps) {
  useEffect(() => {
    ensureStyleTag();
    ensureFontLink();
    document.documentElement.dataset.palette = paletteId;

    return () => {
      // Clean up only the data attribute on unmount; keep <style> + <link>
      // around in case another HearthThemeInjector re-mounts (avoids FOUC).
      // Full cleanup happens implicitly when the page navigates away.
      delete document.documentElement.dataset.palette;
    };
  }, [paletteId]);

  return <>{children}</>;
}

export default HearthThemeInjector;
