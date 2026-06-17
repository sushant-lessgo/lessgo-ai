// src/modules/templates/techpremium/components/TechPremiumSSRTokens.tsx
// Server-safe TechPremium token emitter for the published renderer + static export.
// Counterpart to TechPremiumThemeInjector (client-only). Emits the same payload:
//   1. <style id="techpremium-theme"> with base tokens + palette + variant blocks
//   2. wrapping <div data-palette="..." data-variant="..."> so the bare
//      `[data-palette]` / `[data-variant]` selectors match at any depth.
// Fonts (Inter Tight / Inter / JetBrains Mono) are self-hosted globally via
// src/styles/fonts-self-hosted.css — no per-template Google <link> needed.

import React from 'react';
import type { TechPremiumPalette, TechPremiumVariant } from '@/types/product';
import { defaultTechPremiumVariant } from '@/types/product';
import { serializeBaseTokens } from '../tokens';
import { serializePaletteOverrides } from '../palettes';
import { serializeVariantOverrides } from '../variants';

interface TechPremiumSSRTokensProps {
  paletteId: TechPremiumPalette;
  variantId?: TechPremiumVariant;
  children?: React.ReactNode;
  className?: string;
}

export function TechPremiumSSRTokens({
  paletteId,
  variantId = defaultTechPremiumVariant,
  children,
  className = '',
}: TechPremiumSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <style id="techpremium-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variantId} className={className}>
        {children}
      </div>
    </>
  );
}

export default TechPremiumSSRTokens;
