// src/types/template.ts
// The plug contract every visual template module satisfies. Phase 7.5c locks
// this so the 7 queued service templates (Folio, Riot, …) and the registry
// type against one shape. Phase 11 extends it (variant tokens) — lock now to
// prevent drift.

import type React from 'react';

/** One selectable variant (token rescale) within a template. */
export interface TemplateVariant {
  id: string;
  label: string;
  blurb?: string;
}

export interface TemplateModule {
  /**
   * Resolve a block component for render.
   *
   * DISPATCH KEY: `blockType` is the **section type** (`hero`, `services`,
   * `cta`, …). `layoutName` (optional, scale-09 phase 3) is the stored layout
   * name and selects a specific VARIANT when the template declares more than
   * one block for the section — dispatch is `variants[layoutName] ?? default`.
   *
   * A1 GUARDRAIL PRESERVED: `layoutName` is optional and falls back to the
   * section's default block when absent, unknown, or FOREIGN (a layout name
   * owned by another template). Section-type dispatch therefore still lets the
   * editor switch templates without rewriting stored layout names — a foreign
   * layout name just resolves to this template's default for that section.
   *
   * Templates with one block per section ignore `layoutName` (the fallback
   * yields their sole block); templates with internal dispatcher blocks (surge
   * testimonials, vestria hero) also fall back to the section default, which
   * then branches internally on the stored layout.
   */
  resolveBlock(
    blockType: string,
    mode: 'edit' | 'published',
    layoutName?: string,
  ): React.ComponentType<any> | null;
  /** Client-side theme injector (CSS vars + fonts + data-palette [+ data-variant]
   *  [+ data-mood]). `variantId` is optional: palette-only templates ignore it;
   *  templates with a variant axis (Meridian: developer/marketing/light) consume
   *  it. `mood` (optional) is a neutral-mood axis persisted in
   *  Project.themeValues.mood — only vestria consumes it today; other templates
   *  simply ignore the extra prop. */
  ThemeInjector: React.ComponentType<{ paletteId: any; variantId?: any; mood?: any; children?: React.ReactNode }>;
  /** Server-safe token emitter for published / static export. */
  SSRTokens: React.ComponentType<{ paletteId: any; variantId?: any; mood?: any; children?: React.ReactNode }>;
  /** Section-type → surface token for this template's alternation rules. The
   *  renderer writes this under the neutral `data-surface` attribute (shared by
   *  all templates; surface *values* differ per template, so no collision). */
  getSurfaceForSection(sectionType: string): string;
  /** Template's default palette id (used when none persisted). */
  defaultPaletteId: string;
  /** Selectable variants (token rescales). First entry is the default. */
  variants: TemplateVariant[];
  /** Template's default variant id (used when none persisted). */
  defaultVariantId: string;
  /** Per-palette image mood phrases (paletteId → keyword phrase). Optional —
   *  consumed by the editor image search; absent templates just omit the mood. */
  paletteImageKeywords?: Record<string, string>;
}

export type TemplateModuleLoader = () => Promise<TemplateModule>;
