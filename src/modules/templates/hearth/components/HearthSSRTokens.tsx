// src/modules/service/components/HearthSSRTokens.tsx
// Server-safe Hearth token emitter for the published renderer + static export.
// Counterpart to HearthThemeInjector (client-only). Emits the same payload:
//   1. <style id="hearth-theme"> with base tokens + per-palette overrides
//   2. wrapping <div data-palette="..."> so [data-palette="x"] selectors match
// Fonts (Fraunces display + DM Sans body) are self-hosted globally via
// src/styles/fonts-self-hosted.css — no Google <link> needed.
//
// `serializePaletteOverrides()` already targets `[data-palette="x"]` selectors
// (not `html[data-palette]`), so wrapping any element works at any depth.

import React from 'react';
import type { HearthPalette } from '@/types/service';
import type { KnobSelection } from '@/types/template';
import { buildHearthStylesheet, defaultHearthVariant } from '../tokens';
import { knobDataAttributes } from '../../shared/knobCss';

interface HearthSSRTokensProps {
  paletteId: HearthPalette;
  variantId?: string;
  // `knobs` (factory phase 8) — CONSUMED here, not merely accepted: the knob CSS
  // is inlined in the <style> block AND the `data-knob-*` attrs are applied on the
  // wrapper, mirroring the edit-side HearthThemeInjector. A knob shown in the
  // editor that no-oped in published output would be a silent parity break.
  // Absent / all-default → byte-identical to the pre-phase-8 published HTML.
  knobs?: KnobSelection | null;
  children?: React.ReactNode;
  className?: string;
}

export function HearthSSRTokens({ paletteId, variantId, knobs, children, className = '' }: HearthSSRTokensProps) {
  // SAME shared builder as the edit-side injector — knob CSS cannot diverge
  // between the two renderers.
  const stylesheet = buildHearthStylesheet(knobs);
  const knobAttrs = knobDataAttributes(knobs);

  return (
    <>
      <style id="hearth-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
      <div
        data-palette={paletteId}
        data-variant={variantId || defaultHearthVariant}
        {...knobAttrs}
        className={className}
      >
        {children}
      </div>
    </>
  );
}

export default HearthSSRTokens;
