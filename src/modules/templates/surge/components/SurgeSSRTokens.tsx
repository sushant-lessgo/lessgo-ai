// src/modules/templates/surge/components/SurgeSSRTokens.tsx
// Server-safe Surge token emitter for the published renderer + static export.
// Counterpart to SurgeThemeInjector (client-only). Emits the same payload:
//   1. <style id="surge-theme"> with base tokens + per-palette + per-variant overrides
//   2. wrapping <div data-palette="..." data-variant="..."> so selectors match
// Fonts are self-hosted globally via src/styles/fonts-self-hosted.css.

import React from 'react';
import type { SurgePalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultSurgeVariant } from '../tokens';
import { serializePaletteOverrides } from '../palettes';

interface SurgeSSRTokensProps {
  paletteId: SurgePalette;
  variantId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SurgeSSRTokens({ paletteId, variantId, children, className = '' }: SurgeSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <style id="surge-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variantId || defaultSurgeVariant} className={className}>
        {children}
      </div>
    </>
  );
}

export default SurgeSSRTokens;
