// src/modules/service/components/HearthSSRTokens.tsx
// Server-safe Hearth token emitter for the published renderer + static export.
// Counterpart to HearthThemeInjector (client-only). Emits the same payload:
//   1. <link rel="stylesheet"> for Fraunces
//   2. <style id="hearth-theme"> with base tokens + per-palette overrides
//   3. wrapping <div data-palette="..."> so [data-palette="x"] selectors match
//
// `serializePaletteOverrides()` already targets `[data-palette="x"]` selectors
// (not `html[data-palette]`), so wrapping any element works at any depth.

import React from 'react';
import type { HearthPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultHearthVariant } from '../tokens';
import { serializePaletteOverrides } from '../palettes';

const FRAUNCES_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&display=swap';

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
      <link rel="stylesheet" href={FRAUNCES_HREF} id="hearth-fraunces" />
      <style id="hearth-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} data-variant={variantId || defaultHearthVariant} className={className}>
        {children}
      </div>
    </>
  );
}

export default HearthSSRTokens;
