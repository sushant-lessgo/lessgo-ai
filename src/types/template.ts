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
   * DISPATCH KEY (Phase 11a / A1): `blockType` is the **section type**
   * (`hero`, `services`, `cta`, …), NOT the stored layout name. Each template
   * owns exactly one block per section type, so section-type dispatch lets the
   * editor switch templates without rewriting stored layout names.
   *
   * ⚠️ Valid ONLY while it's 1 block per section per template (Phase 9 multi-
   * block / `uiblockDecisions` on hold). When multiple blocks per section land,
   * revert to name-keyed dispatch (the layout name is still kept in saved
   * content for exactly this reason — see A1 guardrail).
   */
  resolveBlock(
    blockType: string,
    mode: 'edit' | 'published',
  ): React.ComponentType<any> | null;
  /** Client-side theme injector (CSS vars + fonts + data-palette + data-variant). */
  ThemeInjector: React.ComponentType<{ paletteId: any; variantId?: string; children?: React.ReactNode }>;
  /** Server-safe token emitter for published / static export. */
  SSRTokens: React.ComponentType<{ paletteId: any; variantId?: string; children?: React.ReactNode }>;
  /** Section-type → surface token for this template's alternation rules. */
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
