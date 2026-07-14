// src/modules/templates/atelier/components/AtelierSSRTokens.tsx
// Server-safe Atelier token emitter for the published renderer + static export.
// Counterpart to AtelierThemeInjector (client-only). Emits the same payload:
//   1. <style id="atelier-theme"> with base tokens + per-palette + per-variant
//      overrides
//   2. wrapping <div data-palette="..." data-variant="..."> so selectors match
//      (edit sets the same attrs on documentElement — parity)
// NO mood axis. Fonts are self-hosted globally via src/styles/fonts-self-hosted.css.

import React from 'react';
import type { AtelierPalette } from '@/types/service';
import type { KnobSelection } from '@/types/template';
import { buildAtelierStylesheet, defaultAtelierVariant } from '../tokens';
import { knobDataAttributes } from '../../shared/knobCss';

interface AtelierSSRTokensProps {
  paletteId: AtelierPalette;
  variantId?: string;
  // `knobs` — CONSUMED here, not merely accepted: the knob CSS is inlined in the
  // <style> block AND the data-knob-* attrs are applied on the wrapper, mirroring
  // the edit-side AtelierThemeInjector. A knob shown in the editor that no-oped in
  // published output would be a silent parity break. Absent / all-default →
  // byte-identical to the pre-knob published HTML.
  knobs?: KnobSelection | null;
  children?: React.ReactNode;
  className?: string;
}

export function AtelierSSRTokens({ paletteId, variantId, knobs, children, className = '' }: AtelierSSRTokensProps) {
  // SAME shared builder as the edit-side injector — knob CSS cannot diverge
  // between the two renderers.
  const stylesheet = buildAtelierStylesheet(knobs);
  const knobAttrs = knobDataAttributes(knobs);

  return (
    <>
      <style id="atelier-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div
        data-palette={paletteId}
        data-variant={variantId || defaultAtelierVariant}
        {...knobAttrs}
        className={className}
      >
        {children}
      </div>
    </>
  );
}

export default AtelierSSRTokens;
