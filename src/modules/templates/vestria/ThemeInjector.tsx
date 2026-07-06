'use client';

// src/modules/templates/vestria/ThemeInjector.tsx
// Mounts Vestria design tokens into the document (edit/preview):
//  1. <html data-palette="cobalt" data-variant="tailored" data-mood="bone">
//  2. <style id="vestria-theme"> in <head> with base tokens (+ mood block) +
//     palette + variant blocks
// PARITY: VestriaSSRTokens (published) must emit the same attributes + CSS.
//
// Fonts (Bodoni Moda + Hanken Grotesk + JetBrains Mono) are self-hosted globally
// via src/styles/fonts-self-hosted.css.

import { useEffect, type ReactNode } from 'react';
import type { VestriaPalette } from '@/types/product';
import {
  serializeBaseTokens,
  serializeVariantOverrides,
  defaultVestriaVariant,
  defaultVestriaMood,
  vestriaMoods,
  type VestriaMood,
} from './tokens';
import { serializePaletteOverrides } from './palettes';
import { EDIT_AFFORDANCE_STYLES } from './blocks/editPrimitives';

const STYLE_ID = 'vestria-theme';

interface VestriaThemeInjectorProps {
  paletteId: VestriaPalette;
  variantId?: string;
  /** Neutral mood (bone/slate) — root-level `data-mood`, persisted in
   *  Project.themeValues.mood (caller passes it through; defaults to bone). */
  mood?: string;
  children?: ReactNode;
}

/** Narrow an untrusted themeValues.mood to a known mood (default bone). */
function resolveMood(mood?: string): VestriaMood {
  return (vestriaMoods as readonly string[]).includes(mood || '')
    ? (mood as VestriaMood)
    : defaultVestriaMood;
}

function buildStylesheet(): string {
  // EDIT_AFFORDANCE_STYLES is appended here only (edit/preview) — the published
  // SSRTokens omit it (no image/list/link edit chrome on live pages).
  return `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}\n${EDIT_AFFORDANCE_STYLES}`;
}

function ensureStyleTag(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
    el.textContent = buildStylesheet();
  } else if (!el.textContent) {
    el.textContent = buildStylesheet();
  }
  return el;
}

export function VestriaThemeInjector({ paletteId, variantId, mood, children }: VestriaThemeInjectorProps) {
  const variant = variantId || defaultVestriaVariant;
  const effectiveMood = resolveMood(mood);

  useEffect(() => {
    ensureStyleTag();
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variant;
    document.documentElement.dataset.mood = effectiveMood;

    return () => {
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
      delete document.documentElement.dataset.mood;
    };
  }, [paletteId, variant, effectiveMood]);

  return <>{children}</>;
}

export default VestriaThemeInjector;
