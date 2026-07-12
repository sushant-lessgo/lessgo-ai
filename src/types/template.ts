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

// ── Knobs (template-factory phase 3) ─────────────────────────────────────────
// A knob is a per-template design lever surfaced as a `data-knob-<axis>`
// attribute on the theme wrapper. Blocks NEVER branch on a knob — templates emit
// `[data-knob-<axis>="<value>"]{--token:…}` CSS layers via the shared serializer
// (`src/modules/templates/shared/knobCss.ts`), mirroring `serializeVariantOverrides`.
// The DEFAULT value of every axis emits NOTHING (default = `:root`), so
// knob-unaware projects render byte-identical. The axis vocabulary/data lives in
// the pure-data leaf `src/modules/templates/knobs.ts` (no template imports).

/** The standard knob axes. `typePairing` aliases the existing variant axis;
 *  `texture` subsumes the neutral mood axis. */
export type KnobAxis = 'buttonShape' | 'cardStyle' | 'density' | 'typePairing' | 'texture';

/** A selected value for a knob axis. Validated against the axis vocabulary in
 *  `knobs.ts` at emit time — unknown values are IGNORED (omit attr + CSS), never
 *  thrown, so a stale/hostile stored value can't break a render. */
export type KnobValue = string;

/** A project's knob selection, persisted in `Project.themeValues.knobs`
 *  (precedent: `themeValues.mood`). Partial: an axis that is absent — or set to
 *  its axis default — emits neither a `data-knob-*` attr nor a CSS block. */
export type KnobSelection = Partial<Record<KnobAxis, KnobValue>>;

/** A template's knob declaration (optional; only knob-tokenized templates ship
 *  it — phase 8 hearth is the first). For each standard axis the template
 *  tokenizes, the subset of that axis' standard values it supports (MUST include
 *  the axis default). The conformance suite (`assertKnobConformance`) checks a
 *  declaring template covers the full standard axis set with valid values. */
export interface TemplateKnobDeclaration {
  axes: Partial<Record<KnobAxis, readonly KnobValue[]>>;
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
   *  simply ignore the extra prop.
   *  `knobs` (optional, phase 3) is the project's knob selection persisted in
   *  Project.themeValues.knobs — only knob-tokenized templates consume it; others
   *  ignore the extra prop, so this addition is byte-neutral for them. */
  ThemeInjector: React.ComponentType<{ paletteId: any; variantId?: any; mood?: any; knobs?: KnobSelection; children?: React.ReactNode }>;
  /** Server-safe token emitter for published / static export. `knobs` is
   *  optional (phase 3): knob-unaware templates ignore it. */
  SSRTokens: React.ComponentType<{ paletteId: any; variantId?: any; mood?: any; knobs?: KnobSelection; children?: React.ReactNode }>;
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
  /** Template's default knob selection, seeded into Project.themeValues.knobs at
   *  creation so the ZERO-CONFIG render reflects the template's signature knob
   *  defaults (e.g. atelier → square buttons). Optional — only knob-tokenized
   *  templates with a non-trivial default ship it; absence leaves themeValues.knobs
   *  unseeded (renders the knob token map's own defaults). */
  defaultKnobs?: KnobSelection;
  /** Per-palette image mood phrases (paletteId → keyword phrase). Optional —
   *  consumed by the editor image search; absent templates just omit the mood. */
  paletteImageKeywords?: Record<string, string>;
  /** Knob declaration (template-factory phase 3). Optional — only knob-tokenized
   *  templates ship it (phase 8 hearth is the first). Its presence enables the
   *  conditional knob-set conformance rule (`assertKnobConformance`); absence
   *  leaves the template exactly as today. */
  knobs?: TemplateKnobDeclaration;
}

export type TemplateModuleLoader = () => Promise<TemplateModule>;
