'use client';

// src/modules/service/design/HearthThemeInjector.tsx
// Mounts Hearth design tokens into the document:
//  1. <html data-palette="..."> attribute drives per-palette accent overrides
//  2. <style id="hearth-theme"> in <head> with :root tokens + palette blocks
//
// Fonts (Fraunces display + DM Sans body) are self-hosted globally via
// src/styles/fonts-self-hosted.css. Fraunces is shipped as a variable woff2 that
// preserves the opsz 9..144 axis (drives `font-variation-settings: "opsz" 144`).
//
// Phase 1 only — Phase 3 mounts this from the renderer when audienceType==='service'.

import { useEffect, type ReactNode } from 'react';
import type { HearthPalette } from '@/types/service';
import type { KnobSelection } from '@/types/template';
import { buildHearthStylesheet, defaultHearthVariant } from './tokens';
import { knobDataAttributes } from '../shared/knobCss';

const STYLE_ID = 'hearth-theme';

interface HearthThemeInjectorProps {
  paletteId: HearthPalette;
  variantId?: string;
  // `knobs` (factory phase 8) — project knob selection from
  // Project.themeValues.knobs. Absent / all-default → byte-identical to today.
  knobs?: KnobSelection | null;
  children?: ReactNode;
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

export function HearthThemeInjector({ paletteId, variantId, knobs, children }: HearthThemeInjectorProps) {
  const variant = variantId || defaultHearthVariant;
  // Stable string key so the effect re-runs when the selection changes.
  const knobKey = JSON.stringify(knobDataAttributes(knobs));
  useEffect(() => {
    const el = ensureStyleTag();
    // Rebuild the stylesheet from the SHARED builder every run — knob CSS is only
    // appended when a non-default knob is active, so the no-knob render stays
    // byte-identical to the pre-phase-8 content.
    el.textContent = buildHearthStylesheet(knobs);

    document.documentElement.dataset.palette = paletteId;
    document.documentElement.dataset.variant = variant;

    // Apply active `data-knob-*` attrs (same wrapper-attr mechanism as
    // data-variant). knobDataAttributes drops absent/default/invalid values, so
    // an all-default selection sets nothing.
    const knobAttrs = knobDataAttributes(knobs);
    for (const [name, value] of Object.entries(knobAttrs)) {
      document.documentElement.setAttribute(name, value);
    }

    return () => {
      // Clean up only the data attributes on unmount; keep the <style> around
      // in case another HearthThemeInjector re-mounts (avoids FOUC).
      // Full cleanup happens implicitly when the page navigates away.
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

export default HearthThemeInjector;
