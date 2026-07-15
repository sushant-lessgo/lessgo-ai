// src/modules/skeletons/work/skin.ts
// The work-skeleton SKIN contract + factory (§A). A skin is COMPILE-TIME data
// (baked per-id barrel — zero DB churn, conformance-checkable zero-markup) that
// supplies tokens/palettes/selections/variants; the skeleton owns ALL markup. The
// factory `makeWorkSkeletonModule(skin)` returns the full `TemplateModule` surface
// so a skin barrel registers through the existing template registry with zero
// contract change.
//
// PLAIN module (no 'use client') so BOTH renderers can import `buildWorkStylesheet`
// (byte-identical token CSS across edit + published). It DOES import the client
// ThemeInjector factory + the server SSRTokens factory to assemble the module —
// same cross-boundary component pattern the registry uses. All cross-module refs
// used here (buildWorkStylesheet / makeWorkThemeInjector / makeWorkSSRTokens) are
// hoisted function declarations, so the skin↔injector import cycle is eval-safe.

import type {
  TemplateModule, TemplateVariant, KnobSelection, TemplateKnobDeclaration,
} from '@/types/template';
import type { StyleTokens, UHeaderMode } from '../styleTokens';
import { serializeStyleTokens } from '../styleTokens';
import {
  assertSkinTokens, serializeSkinTokens, type WorkSkinTokens,
} from './tokenContract';
import { serializeKnobOverrides, knobDataAttributes, type KnobTokenMap } from '@/modules/templates/shared/knobCss';
import { getSurfaceForSection, type WorkSurface } from './sectionRules';
import { resolveWorkBlock } from './resolveWorkBlock';
import { makeWorkThemeInjector } from './ThemeInjector';
import { makeWorkSSRTokens } from './SSRTokens';

/** A palette swaps ONLY the accent trio; the paper/ink system is palette-invariant
 *  (skin.tokens). */
export interface WorkPalette {
  accent: string;
  accentInk: string;
  accentDeep?: string;
}

/** A variant is a token rescale (typeface/spacing feel). `tokenOverrides` are
 *  `--wk-*` (or knob-consumed) custom-property overrides emitted under
 *  `[data-variant="<id>"]`. The default variant carries NO overrides (it is the
 *  `:root` baseline). */
export interface WorkVariantDef extends TemplateVariant {
  tokenOverrides?: Record<string, string>;
}

export interface WorkSkinSelections {
  /** section type → default stored layout name (the block variant to render). */
  defaultLayoutBySection: Record<string, string>;
  /** section type → surface override (over the skeleton default). */
  surfaceBySection: Record<string, WorkSurface>;
  /** Default header sticky/fixed mode (user styleTokens.headerMode overrides). */
  headerMode: UHeaderMode;
}

export interface WorkSkinDef {
  id: string;
  tokens: WorkSkinTokens;
  palettes: Record<string, WorkPalette>;
  selections: WorkSkinSelections;
  variants: WorkVariantDef[];
  defaultVariantId: string;
  defaultPaletteId: string;
  defaultKnobs?: KnobSelection;
  /** Knob CSS token map (optional; only knob-tokenized skins ship it). */
  knobTokenMap?: KnobTokenMap;
  /** Knob declaration surfaced on the TemplateModule (enables conformance rule). */
  knobs?: TemplateKnobDeclaration;
  /** paletteId → image mood phrase (editor image search). */
  imageKeywords?: Record<string, string>;
}

/** Serialize per-palette accent overrides as `[data-palette="x"]{--wk-accent:…}`. */
export function serializeWorkPalettes(palettes: Record<string, WorkPalette>): string {
  return Object.entries(palettes)
    .map(([id, c]) => {
      const deep = c.accentDeep ? `--wk-accent-deep:${c.accentDeep};` : '';
      return `[data-palette="${id}"]{--wk-accent:${c.accent};--wk-accent-ink:${c.accentInk};${deep}}`;
    })
    .join('\n');
}

/** Serialize per-variant token overrides as `[data-variant="x"]{…}`. The default
 *  variant (no overrides) emits nothing. */
export function serializeWorkVariants(variants: WorkVariantDef[]): string {
  return variants
    .filter((v) => v.tokenOverrides && Object.keys(v.tokenOverrides).length > 0)
    .map((v) => {
      const decls = Object.entries(v.tokenOverrides!).map(([n, val]) => `${n}:${val};`).join('');
      return `[data-variant="${v.id}"]{${decls}}`;
    })
    .join('\n');
}

/**
 * SINGLE source of truth for the full skin stylesheet, consumed IDENTICALLY by
 * both renderers (ThemeInjector edit-side, SSRTokens published-side) so token /
 * knob / style-token CSS can never diverge between them. When there is no active
 * knob and no style tokens, the output is base + palettes + variants EXACTLY.
 */
export function buildWorkStylesheet(
  skin: WorkSkinDef,
  knobs?: KnobSelection | null,
  styleTokens?: StyleTokens | null,
): string {
  const parts: string[] = [
    serializeSkinTokens(skin.tokens),
    serializeWorkPalettes(skin.palettes),
  ];
  const variantCss = serializeWorkVariants(skin.variants);
  if (variantCss) parts.push(variantCss);

  if (skin.knobTokenMap) {
    const hasActiveKnob = Object.keys(knobDataAttributes(knobs)).length > 0;
    if (hasActiveKnob) {
      const knobCss = serializeKnobOverrides(skin.knobTokenMap);
      if (knobCss) parts.push(knobCss);
    }
  }

  const styleCss = serializeStyleTokens(styleTokens);
  if (styleCss) parts.push(styleCss);

  return parts.join('\n');
}

/**
 * Build the full `TemplateModule` surface for a work skin. `assertSkinTokens` runs
 * at construction so a bad skin fails LOUD at load (and in phase-7 conformance) —
 * never a silent partial render.
 */
export function makeWorkSkeletonModule(skin: WorkSkinDef): TemplateModule {
  assertSkinTokens(skin);

  const ThemeInjector = makeWorkThemeInjector(skin);
  const SSRTokens = makeWorkSSRTokens(skin);

  return {
    resolveBlock: (blockType, mode, layoutName) => resolveWorkBlock(blockType, mode, layoutName),
    ThemeInjector,
    SSRTokens,
    getSurfaceForSection: (sectionType: string) =>
      getSurfaceForSection(sectionType, skin.selections.surfaceBySection),
    defaultPaletteId: skin.defaultPaletteId,
    variants: skin.variants,
    defaultVariantId: skin.defaultVariantId,
    defaultKnobs: skin.defaultKnobs,
    paletteImageKeywords: skin.imageKeywords,
    knobs: skin.knobs,
  };
}
