// src/modules/templates/vestria/components/VestriaSSRTokens.tsx
// Server-safe Vestria token emitter for the published renderer + static export.
// Counterpart to VestriaThemeInjector (client-only). Emits the same payload:
//   1. <style id="vestria-theme"> with base tokens (+ mood block) + per-palette
//      + per-variant overrides
//   2. wrapping <div data-palette="..." data-variant="..." data-mood="..."> so
//      selectors match (edit sets the same attrs on documentElement — parity)
// Fonts are self-hosted globally via src/styles/fonts-self-hosted.css.

import React from 'react';
import type { VestriaPalette } from '@/types/product';
import {
  serializeBaseTokens,
  serializeVariantOverrides,
  defaultVestriaVariant,
  defaultVestriaMood,
  vestriaMoods,
  type VestriaMood,
} from '../tokens';
import { serializePaletteOverrides } from '../palettes';

interface VestriaSSRTokensProps {
  paletteId: VestriaPalette;
  variantId?: string;
  /** Neutral mood (bone/slate) — mirrors ThemeInjector's `data-mood`. */
  mood?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Narrow an untrusted themeValues.mood to a known mood (default bone). */
function resolveMood(mood?: string): VestriaMood {
  return (vestriaMoods as readonly string[]).includes(mood || '')
    ? (mood as VestriaMood)
    : defaultVestriaMood;
}

export function VestriaSSRTokens({ paletteId, variantId, mood, children, className = '' }: VestriaSSRTokensProps) {
  const stylesheet = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;

  return (
    <>
      <style id="vestria-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div
        data-palette={paletteId}
        data-variant={variantId || defaultVestriaVariant}
        data-mood={resolveMood(mood)}
        className={className}
      >
        {children}
      </div>
    </>
  );
}

export default VestriaSSRTokens;
