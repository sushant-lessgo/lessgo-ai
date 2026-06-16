// src/modules/service/components/HearthSSRTokens.tsx
// Server-safe Hearth token emitter for the published renderer + static export.
// Counterpart to HearthThemeInjector (client-only). Emits the same payload:
//   1. <style id="hearth-theme"> with base tokens + per-palette overrides
//   2. wrapping <div data-palette="..."> so [data-palette="x"] selectors match
// Fonts (Fraunces display + DM Sans body) are self-hosted globally via
// src/styles/fonts-self-hosted.css — no Google <link> needed.
//
// `serializePaletteOverrides()` already targets `[data-palette="x"]` selectors
// (not `html[data-palette]`), so wrapping any element works at any depth.

import React from 'react';
import type { HearthPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultHearthVariant } from '../tokens';
import { serializePaletteOverrides } from '../palettes';

interface HearthSSRTokensProps {
  paletteId: HearthPalette;
  variantId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function HearthSSRTokens({ paletteId, variantId, children, className = '' }: HearthSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <style id="hearth-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variantId || defaultHearthVariant} className={className}>
        {children}
      </div>
    </>
  );
}

export default HearthSSRTokens;
