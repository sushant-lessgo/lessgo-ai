// src/modules/templates/meridian/components/MeridianSSRTokens.tsx
// Server-safe Meridian token emitter for the published renderer + static export.
// Counterpart to MeridianThemeInjector (client-only). Emits the same payload:
//   1. <link rel="stylesheet"> for Inter Tight / Inter / JetBrains Mono
//   2. <style id="meridian-theme"> with base tokens + palette + variant blocks
//   3. wrapping <div data-palette="..." data-variant="..."> so the bare
//      `[data-palette]` / `[data-variant]` selectors match at any depth.
//
// The serializers use bare attribute selectors (not `html[...]`), so wrapping a
// <div> works exactly as it does for Hearth.

import React from 'react';
import type { MeridianPalette, MeridianVariant } from '@/types/product';
import { defaultMeridianVariant } from '@/types/product';
import { serializeBaseTokens } from '../tokens';
import { serializePaletteOverrides } from '../palettes';
import { serializeVariantOverrides } from '../variants';

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';

interface MeridianSSRTokensProps {
  paletteId: MeridianPalette;
  variantId?: MeridianVariant;
  children?: React.ReactNode;
  className?: string;
}

export function MeridianSSRTokens({
  paletteId,
  variantId = defaultMeridianVariant,
  children,
  className = '',
}: MeridianSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <link rel="stylesheet" href={FONTS_HREF} id="meridian-fonts" />
      <style id="meridian-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variantId} className={className}>
        {children}
      </div>
    </>
  );
}

export default MeridianSSRTokens;
