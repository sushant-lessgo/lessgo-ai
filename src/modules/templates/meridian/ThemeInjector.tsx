'use client';

// src/modules/templates/meridian/ThemeInjector.tsx
// Mounts Meridian design tokens into the document:
//  1. <html data-palette="..." data-variant="..."> drives per-palette accent
//     overrides AND per-variant token rescales (incl. the light inversion).
//  2. <style id="meridian-theme"> in <head> with :root tokens + palette + variant
//     blocks.
//
// Fonts (Inter Tight / Inter / JetBrains Mono) are self-hosted globally via
// src/styles/fonts-self-hosted.css — no per-template Google <link> needed.
//
// Counterpart to MeridianSSRTokens (server). Mirrors HearthThemeInjector, plus
// the data-variant axis.

import { useEffect, type ReactNode } from 'react';
import type { MeridianPalette, MeridianVariant } from '@/types/product';
import { defaultMeridianVariant } from '@/types/product';
import { serializeBaseTokens } from './tokens';
import { serializePaletteOverrides } from './palettes';
import { serializeVariantOverrides } from './variants';

const STYLE_ID = 'meridian-theme';

interface MeridianThemeInjectorProps {
  paletteId: MeridianPalette;
  variantId?: MeridianVariant;
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

export function MeridianThemeInjector({
  paletteId,
  variantId = defaultMeridianVariant,
  children,
}: MeridianThemeInjectorProps) {
  useEffect(() => {
    ensureStyleTag();
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variantId;

    return () => {
      // Clean up only the data attributes on unmount; keep the <style> around
      // in case another injector re-mounts (avoids FOUC). Full cleanup happens
      // implicitly when the page navigates away.
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
    };
  }, [paletteId, variantId]);

  return <>{children}</>;
}

export default MeridianThemeInjector;
