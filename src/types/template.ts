// src/types/template.ts
// The plug contract every visual template module satisfies. Phase 7.5c locks
// this so the 7 queued service templates (Folio, Riot, …) and the registry
// type against one shape. Phase 11 extends it (variant tokens) — lock now to
// prevent drift.

import type React from 'react';

export interface TemplateModule {
  /** Resolve a block component by layout/block name + render mode. */
  resolveBlock(
    blockType: string,
    mode: 'edit' | 'published',
  ): React.ComponentType<any> | null;
  /** Client-side theme injector (CSS vars + fonts + data-palette [+ data-variant]).
   *  `variantId` is optional: palette-only templates (Hearth) ignore it; templates
   *  with a variant axis (Meridian: developer/marketing/light) consume it. */
  ThemeInjector: React.ComponentType<{ paletteId: any; variantId?: any; children?: React.ReactNode }>;
  /** Server-safe token emitter for published / static export. */
  SSRTokens: React.ComponentType<{ paletteId: any; variantId?: any; children?: React.ReactNode }>;
  /** Section-type → surface token for this template's alternation rules. */
  getSurfaceForSection(sectionType: string): string;
  /** Template's default palette id (used when none persisted). */
  defaultPaletteId: string;
  /** Template's default variant id (used when none persisted). Optional —
   *  palette-only templates omit it. */
  defaultVariantId?: string;
  /** Per-palette image mood phrases (paletteId → keyword phrase). Optional —
   *  consumed by the editor image search; absent templates just omit the mood. */
  paletteImageKeywords?: Record<string, string>;
}

export type TemplateModuleLoader = () => Promise<TemplateModule>;
