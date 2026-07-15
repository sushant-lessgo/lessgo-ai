'use client';

// src/modules/skeletons/work/ThemeInjector.tsx
// Work-skeleton edit/preview token injector — PARAMETERIZED by skin. A skin barrel
// wires `ThemeInjector = makeWorkThemeInjector(skin)` into its TemplateModule.
// Mounts, into the document:
//   1. <html data-palette="…" data-variant="…" [data-knob-*="…"]>
//   2. <style id="work-theme"> with the SHARED skin stylesheet (base tokens +
//      palette + variant + active knob CSS + user style-token blocks) + edit chrome
// PARITY: the published SSRTokens twin emits the SAME <style> payload (minus the
// edit-only affordance chrome) and the SAME attrs — both use `buildWorkStylesheet`
// so the token CSS can never diverge. Fonts are self-hosted globally.

import { useEffect, type ReactNode } from 'react';
import type { KnobSelection } from '@/types/template';
import type { StyleTokens } from '../styleTokens';
import { buildWorkStylesheet, type WorkSkinDef } from './skin';
import { knobDataAttributes } from '@/modules/templates/shared/knobCss';
import { EDIT_AFFORDANCE_STYLES } from './blocks/editPrimitives';

const STYLE_ID = 'work-theme';

interface WorkThemeInjectorProps {
  paletteId: string;
  variantId?: string;
  mood?: string;
  /** Project knob selection from Project.themeValues.knobs. Absent/all-default →
   *  byte-identical token CSS. */
  knobs?: KnobSelection | null;
  /** User style-token map from Project.themeValues.styleTokens (Design ▾). Absent →
   *  byte-identical (serializer emits ''). */
  styleTokens?: StyleTokens | null;
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

/** Build a skin-bound edit-side ThemeInjector component. */
export function makeWorkThemeInjector(skin: WorkSkinDef) {
  function WorkThemeInjector({ paletteId, variantId, knobs, styleTokens, children }: WorkThemeInjectorProps) {
    const variant = variantId || skin.defaultVariantId;
    // Stable string keys so the effect re-runs when selection/tokens change.
    const knobKey = JSON.stringify(knobDataAttributes(knobs));
    const styleKey = JSON.stringify(styleTokens ?? null);

    useEffect(() => {
      const el = ensureStyleTag();
      // SAME shared builder as SSRTokens; edit chrome appended edit-side only.
      el.textContent = `${buildWorkStylesheet(skin, knobs, styleTokens)}\n${EDIT_AFFORDANCE_STYLES}`;

      document.documentElement.dataset.palette = paletteId;
      document.documentElement.dataset.variant = variant;

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
    }, [paletteId, variant, knobKey, styleKey]);

    return <>{children}</>;
  }
  return WorkThemeInjector;
}
