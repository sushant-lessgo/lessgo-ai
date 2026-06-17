'use client';

// src/modules/templates/techpremium/ThemeInjector.tsx
// Mounts TechPremium design tokens into the document:
//  1. <html data-palette="..." data-variant="..."> drives per-palette accent
//     overrides (the forest/lime hue knobs) and per-variant rescales (none yet).
//  2. <style id="techpremium-theme"> in <head> with :root tokens + palette +
//     variant blocks.
//
// Fonts (Inter Tight / Inter / JetBrains Mono) are self-hosted globally via
// src/styles/fonts-self-hosted.css — no per-template Google <link> needed.
//
// Counterpart to TechPremiumSSRTokens (server). Mirrors MeridianThemeInjector.

import { useEffect, type ReactNode } from 'react';
import type { TechPremiumPalette, TechPremiumVariant } from '@/types/product';
import { defaultTechPremiumVariant } from '@/types/product';
import { serializeBaseTokens } from './tokens';
import { serializePaletteOverrides } from './palettes';
import { serializeVariantOverrides } from './variants';

const STYLE_ID = 'techpremium-theme';

interface TechPremiumThemeInjectorProps {
  paletteId: TechPremiumPalette;
  variantId?: TechPremiumVariant;
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

export function TechPremiumThemeInjector({
  paletteId,
  variantId = defaultTechPremiumVariant,
  children,
}: TechPremiumThemeInjectorProps) {
  useEffect(() => {
    ensureStyleTag();
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variantId;

    return () => {
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
    };
  }, [paletteId, variantId]);

  return <>{children}</>;
}

export default TechPremiumThemeInjector;
