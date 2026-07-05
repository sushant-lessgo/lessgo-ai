// src/modules/templates/vestria/components/VestriaSSRTokens.tsx
// Server-safe Vestria token emitter for the published renderer + static export.
// Counterpart to VestriaThemeInjector (client-only). Emits the same payload:
//   1. <style id="vestria-theme"> with base tokens + per-palette + per-variant overrides
//   2. wrapping <div data-palette="..." data-variant="..."> so selectors match
// Fonts are self-hosted globally via src/styles/fonts-self-hosted.css.

import React from 'react';
import type { VestriaPalette } from '@/types/product';
import { serializeBaseTokens, serializeVariantOverrides, defaultVestriaVariant } from '../tokens';
import { serializePaletteOverrides } from '../palettes';

interface VestriaSSRTokensProps {
  paletteId: VestriaPalette;
  variantId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function VestriaSSRTokens({ paletteId, variantId, children, className = '' }: VestriaSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <style id="vestria-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variantId || defaultVestriaVariant} className={className}>
        {children}
      </div>
    </>
  );
}

export default VestriaSSRTokens;
