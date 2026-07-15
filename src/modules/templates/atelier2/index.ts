// src/modules/templates/atelier2/index.ts
// Atelier work-SKELETON skin barrel (dev id `atelier2`; cutover to `atelier` in
// phase 9). Builds the full `TemplateModule` surface from the skeleton factory +
// this skin's DATA, and re-exports it for the dynamic registry loader.
//
// FIREWALL: server-safe barrel. It re-exports ONLY the TemplateModule surface
// (resolveBlock / ThemeInjector / SSRTokens / getSurfaceForSection / defaults /
// variants / knobs). It NEVER re-exports the skeleton's client-only helpers
// (editPrimitives / useWorkBlock) — blocks import those via relative paths, so
// this barrel stays importable from server components (registry preload path).
// The `ThemeInjector` it re-exports is the skin-bound client component (same
// cross-boundary pattern as atelier/index.ts's `AtelierThemeInjector as
// ThemeInjector`).

import { makeWorkSkeletonModule } from '@/modules/skeletons/work/skin';
import { atelierSkin } from './skin';

const workModule = makeWorkSkeletonModule(atelierSkin);

export const resolveBlock = workModule.resolveBlock;
export const ThemeInjector = workModule.ThemeInjector;
export const SSRTokens = workModule.SSRTokens;
export const getSurfaceForSection = workModule.getSurfaceForSection;
export const defaultPaletteId = workModule.defaultPaletteId;
export const variants = workModule.variants;
export const defaultVariantId = workModule.defaultVariantId;
export const defaultKnobs = workModule.defaultKnobs;
export const paletteImageKeywords = workModule.paletteImageKeywords;
export const knobs = workModule.knobs;
