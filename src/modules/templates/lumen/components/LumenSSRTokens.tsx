// src/modules/templates/lumen/components/LumenSSRTokens.tsx
// Server-safe Lumen token emitter for the published renderer + static export.
// Counterpart to LumenThemeInjector (client-only). Emits the same payload:
//   1. <style id="lumen-theme"> with base tokens + per-palette + per-variant overrides
//   2. wrapping <div data-palette="..." data-variant="..."> so selectors match
// Fonts are self-hosted globally via src/styles/fonts-self-hosted.css.

import React from 'react';
import type { LumenPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultLumenVariant } from '../tokens';
import { serializePaletteOverrides } from '../palettes';

interface LumenSSRTokensProps {
  paletteId: LumenPalette;
  variantId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function LumenSSRTokens({ paletteId, variantId, children, className = '' }: LumenSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <style id="lumen-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variantId || defaultLumenVariant} className={className}>
        {children}
      </div>
    </>
  );
}

export default LumenSSRTokens;
