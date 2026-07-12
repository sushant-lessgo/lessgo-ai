// src/modules/templates/atelier/components/AtelierSSRTokens.tsx
// Server-safe Atelier token emitter for the published renderer + static export.
// Counterpart to AtelierThemeInjector (client-only). Emits the same payload:
//   1. <style id="atelier-theme"> with base tokens + per-palette + per-variant
//      overrides
//   2. wrapping <div data-palette="..." data-variant="..."> so selectors match
//      (edit sets the same attrs on documentElement — parity)
// NO mood axis. Fonts are self-hosted globally via src/styles/fonts-self-hosted.css.

import React from 'react';
import type { AtelierPalette } from '@/types/service';
import {
  serializeBaseTokens,
  serializeVariantOverrides,
  defaultAtelierVariant,
} from '../tokens';
import { serializePaletteOverrides } from '../palettes';

interface AtelierSSRTokensProps {
  paletteId: AtelierPalette;
  variantId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function AtelierSSRTokens({ paletteId, variantId, children, className = '' }: AtelierSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <style id="atelier-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div
        data-palette={paletteId}
        data-variant={variantId || defaultAtelierVariant}
        className={className}
      >
        {children}
      </div>
    </>
  );
}

export default AtelierSSRTokens;
