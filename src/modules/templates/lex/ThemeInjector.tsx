'use client';

// src/modules/templates/lex/ThemeInjector.tsx
// Client-side Lex token injector (edit/preview). Mirrors HearthThemeInjector:
//  1. <html data-palette="..." data-variant="statesman"> drives per-palette
//     trust/accent/paper overrides (variant switching arrives in Phase 11b)
//  2. <style id="lex-theme"> in <head> with :root tokens + palette blocks
//  3. <link id="lex-fonts"> for the statesman font set (Source Serif 4 +
//     Inter Tight + JetBrains Mono). Lora / EB Garamond load in 11b with the
//     clinical / civic variants.

import { useEffect, type ReactNode } from 'react';
import type { LexPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultLexVariant } from './tokens';
import { serializePaletteOverrides } from './palettes';
import { lexFontsHref } from './fonts';

const STYLE_ID = 'lex-theme';
const FONT_LINK_ID = 'lex-fonts';

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

function ensureFontLink(href: string): HTMLLinkElement {
  let el = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.id = FONT_LINK_ID;
    el.rel = 'stylesheet';
    el.href = href;
    document.head.appendChild(el);
  } else if (el.href !== href) {
    // Variant switched to one needing a different display font — swap the href.
    el.href = href;
  }
  return el;
}

export function LexThemeInjector({ paletteId, variantId, children }: LexThemeInjectorProps) {
  const variant = variantId || defaultLexVariant;
  useEffect(() => {
    ensureStyleTag();
    ensureFontLink(lexFontsHref(variant));
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variant;

    return () => {
      // Clean up only the data attributes on unmount; keep <style> + <link>
      // around in case another LexThemeInjector re-mounts (avoids FOUC).
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
    };
  }, [paletteId, variant]);

  return <>{children}</>;
}

export default LexThemeInjector;
