// src/modules/templates/granth/components/GranthSSRTokens.tsx
// Server-safe Granth token emitter for the published renderer + static export.
// Counterpart to GranthThemeInjector (client-only). Emits the same payload:
//   1. <style id="granth-theme"> with base tokens + per-palette + per-variant overrides
//   2. wrapping <div data-palette="..." data-variant="..."> so selectors match
// Fonts are self-hosted globally via src/styles/fonts-self-hosted.css.

import React from 'react';
import type { GranthPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultGranthVariant } from '../tokens';
import { serializePaletteOverrides } from '../palettes';

interface GranthSSRTokensProps {
  paletteId: GranthPalette;
  variantId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function GranthSSRTokens({ paletteId, variantId, children, className = '' }: GranthSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <style id="granth-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variantId || defaultGranthVariant} className={className}>
        {children}
      </div>
    </>
  );
}

export default GranthSSRTokens;
