'use client';

// src/modules/templates/lumen/ThemeInjector.tsx
// Mounts Lumen design tokens into the document:
//  1. <html data-palette="brass" data-variant="default">
//  2. <style id="lumen-theme"> in <head> with :root tokens + palette + variant blocks
// It also hosts the Lumen-scoped EDIT-LANGUAGE flag (EN/NL) consumed by the
// header toggle + LumenEditable so the founder can author both languages
// without any shared store/persistence change (bilingual is Lumen-contained).
//
// Fonts (Spectral display + Inter body + JetBrains Mono) are self-hosted globally
// via src/styles/fonts-self-hosted.css.

import { useEffect, useState, type ReactNode } from 'react';
import type { LumenPalette } from '@/types/service';
import { serializeBaseTokens, serializeVariantOverrides, defaultLumenVariant } from './tokens';
import { serializePaletteOverrides } from './palettes';
import { LumenEditLangProvider } from './editLang';

const STYLE_ID = 'lumen-theme';

interface LumenThemeInjectorProps {
  paletteId: LumenPalette;
  variantId?: string;
  children?: ReactNode;
}

function buildStylesheet(): string {
  return `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;
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

export function LumenThemeInjector({ paletteId, variantId, children }: LumenThemeInjectorProps) {
  const variant = variantId || defaultLumenVariant;
  const [editLang, setEditLang] = useState<'en' | 'nl'>('en');

  useEffect(() => {
    ensureStyleTag();
    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variant;

    return () => {
      delete document.documentElement.dataset.palette;
      delete document.documentElement.dataset.variant;
    };
  }, [paletteId, variant]);

  return (
    <LumenEditLangProvider value={{ editLang, setEditLang }}>
      {children}
    </LumenEditLangProvider>
  );
}

export default LumenThemeInjector;
