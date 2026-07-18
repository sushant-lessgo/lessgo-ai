// src/modules/skeletons/work/SSRTokens.tsx
// Work-skeleton published/static-export token emitter — PARAMETERIZED by skin.
// Server-safe (NO 'use client', no hooks) counterpart to the edit-side
// ThemeInjector. Emits the SAME payload for the same inputs:
//   1. <style id="work-theme"> with the SHARED skin stylesheet (base tokens +
//      palette + variant + active knob CSS + user style-token blocks)
//   2. wrapping <div data-palette="…" data-variant="…" [data-knob-*]> so selectors
//      match the edit-side attrs on documentElement (parity)
// Uses `buildWorkStylesheet` (plain module) — NEVER imports a value from the
// 'use client' ThemeInjector / editPrimitives, so it stays a valid published path.

import React from 'react';
import type { KnobSelection } from '@/types/template';
import type { StyleTokens } from '../styleTokens';
import { buildWorkStylesheet, type WorkSkinDef } from './stylesheet';
import { knobDataAttributes } from '@/modules/templates/shared/knobCss';

interface WorkSSRTokensProps {
  paletteId: string;
  variantId?: string;
  mood?: string;
  knobs?: KnobSelection | null;
  styleTokens?: StyleTokens | null;
  children?: React.ReactNode;
  className?: string;
}

/** Build a skin-bound published-side SSRTokens component. */
export function makeWorkSSRTokens(skin: WorkSkinDef) {
  function WorkSSRTokens({ paletteId, variantId, knobs, styleTokens, children, className = '' }: WorkSSRTokensProps) {
    // SAME shared builder as the edit-side injector — token CSS cannot diverge.
    const stylesheet = buildWorkStylesheet(skin, knobs, styleTokens);
    const knobAttrs = knobDataAttributes(knobs);

    return (
      <>
        <style id="work-theme" dangerouslySetInnerHTML={{ __html: stylesheet }} />
        <div
          data-palette={paletteId}
          data-variant={variantId || skin.defaultVariantId}
          {...knobAttrs}
          className={className}
        >
          {children}
        </div>
      </>
    );
  }
  return WorkSSRTokens;
}
