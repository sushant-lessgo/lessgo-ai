// src/modules/templates/lex/components/LexSSRTokens.tsx
// Server-safe Lex token emitter for the published renderer + static export.
// Counterpart to LexThemeInjector (client-only). Emits the same payload:
//   1. <style id="lex-theme"> with base tokens + per-palette overrides
//   2. wrapping <div data-palette="..." data-variant="statesman"> so
//      [data-palette="x"] selectors match at any depth.
// Fonts (Source Serif 4 / Inter Tight / JetBrains Mono, + Lora/EB Garamond for
// the clinical/civic variants) are self-hosted globally via
// src/styles/fonts-self-hosted.css — no per-variant Google <link> needed.

import React from 'react';
import type { LexPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultLexVariant } from '../tokens';
import { serializePaletteOverrides } from '../palettes';

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
      <style id="lex-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variant} className={className}>
        {children}
      </div>
    </>
  );
}

export default LexSSRTokens;
