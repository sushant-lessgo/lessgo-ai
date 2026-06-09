'use client';

// src/modules/templates/meridian/ThemeInjector.tsx
// Mounts Meridian design tokens into the document:
//  1. <html data-palette="..." data-variant="..."> drives per-palette accent
//     overrides AND per-variant token rescales (incl. the light inversion).
//  2. <style id="meridian-theme"> in <head> with :root tokens + palette + variant
//     blocks.
//  3. <link id="meridian-fonts"> for Inter Tight / Inter / JetBrains Mono.
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
const FONT_LINK_ID = 'meridian-fonts';

/** Combined Google Fonts href — pinned from "Meridian - Modern Tech.html" line 9. */
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';

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

function ensureFontLink(): HTMLLinkElement {
  let el = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.id = FONT_LINK_ID;
    el.rel = 'stylesheet';
    el.href = FONTS_HREF;
    document.head.appendChild(el);
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
    ensureFontLink();
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variantId;

    return () => {
      // Clean up only the data attributes on unmount; keep <style> + <link>
      // around in case another injector re-mounts (avoids FOUC). Full cleanup
      // happens implicitly when the page navigates away.
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
    };
  }, [paletteId, variantId]);

  return <>{children}</>;
}

export default MeridianThemeInjector;
