'use client';

// src/modules/templates/atelier/ThemeInjector.tsx
// Mounts Atelier design tokens into the document (edit/preview):
//  1. <html data-palette="vermilion" data-variant="editorial">
//  2. <style id="atelier-theme"> in <head> with base tokens + palette + variant
//     blocks (+ edit affordance chrome).
// PARITY: AtelierSSRTokens (published) must emit the same attributes + CSS.
// NO mood axis (dropped from the vestria clone). Fonts self-hosted globally.

import { useEffect, type ReactNode } from 'react';
import type { AtelierPalette } from '@/types/service';
import type { KnobSelection } from '@/types/template';
import { buildAtelierStylesheet, defaultAtelierVariant } from './tokens';
import { knobDataAttributes } from '../shared/knobCss';
import { EDIT_AFFORDANCE_STYLES } from './blocks/editPrimitives';

const STYLE_ID = 'atelier-theme';

interface AtelierThemeInjectorProps {
  paletteId: AtelierPalette;
  variantId?: string;
  // `knobs` — project knob selection from Project.themeValues.knobs. Absent /
  // all-default → byte-identical (base + palette + variant) to the pre-knob output.
  knobs?: KnobSelection | null;
  children?: ReactNode;
}

function buildStylesheet(knobs?: KnobSelection | null): string {
  // SAME shared builder as the published AtelierSSRTokens so the knob CSS can
  // never diverge between the two renderers. EDIT_AFFORDANCE_STYLES is appended
  // here only (edit/preview) — the published SSRTokens omit it (no image/list/link
  // edit chrome on live pages).
  return `${buildAtelierStylesheet(knobs)}\n${EDIT_AFFORDANCE_STYLES}`;
}

function ensureStyleTag(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  return el;
}

export function AtelierThemeInjector({ paletteId, variantId, knobs, children }: AtelierThemeInjectorProps) {
  const variant = variantId || defaultAtelierVariant;
  // Stable string key so the effect re-runs when the selection changes.
  const knobKey = JSON.stringify(knobDataAttributes(knobs));

  useEffect(() => {
    const el = ensureStyleTag();
    // Rebuild from the SHARED builder every run — knob CSS is only appended when a
    // non-default knob is active, so the no-knob render stays byte-identical.
    el.textContent = buildStylesheet(knobs);

    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variant;

    // Apply active data-knob-* attrs (same wrapper-attr mechanism as data-variant).
    // knobDataAttributes drops absent/default/invalid values, so an all-default
    // selection sets nothing.
    const knobAttrs = knobDataAttributes(knobs);
    for (const [name, value] of Object.entries(knobAttrs)) {
      document.documentElement.setAttribute(name, value);
    }

    return () => {
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
      for (const name of Object.keys(knobAttrs)) {
        document.documentElement.removeAttribute(name);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteId, variant, knobKey]);

  return <>{children}</>;
}

export default AtelierThemeInjector;
