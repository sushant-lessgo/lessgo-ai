// src/modules/templates/lex/components/LexSSRTokens.tsx
// Server-safe Lex token emitter for the published renderer + static export.
// Counterpart to LexThemeInjector (client-only). Emits the same payload:
//   1. <link rel="stylesheet"> for the statesman font set
//   2. <style id="lex-theme"> with base tokens + per-palette overrides
//   3. wrapping <div data-palette="..." data-variant="statesman"> so
//      [data-palette="x"] selectors match at any depth.

import React from 'react';
import type { LexPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultLexVariant } from '../tokens';
import { serializePaletteOverrides } from '../palettes';
import { lexFontsHref } from '../fonts';

interface LexSSRTokensProps {
  paletteId: LexPalette;
  variantId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function LexSSRTokens({ paletteId, variantId, children, className = '' }: LexSSRTokensProps) {
  const variant = variantId || defaultLexVariant;
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <link rel="stylesheet" href={lexFontsHref(variant)} id="lex-fonts" />
      <style id="lex-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variant} className={className}>
        {children}
      </div>
    </>
  );
}

export default LexSSRTokens;
