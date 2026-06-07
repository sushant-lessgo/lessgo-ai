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
import { serializeBaseTokens } from '../tokens';
import { serializePaletteOverrides } from '../palettes';

const FRAUNCES_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&display=swap';

interface HearthSSRTokensProps {
  paletteId: HearthPalette;
  children?: React.ReactNode;
  className?: string;
}

export function HearthSSRTokens({ paletteId, children, className = '' }: HearthSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}`;

  return (
    <>
      <link rel="stylesheet" href={FRAUNCES_HREF} id="hearth-fraunces" />
      <style id="hearth-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div data-palette={paletteId} className={className}>
        {children}
      </div>
    </>
  );
}

export default HearthSSRTokens;
