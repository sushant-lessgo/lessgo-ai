// src/modules/templates/templateMeta.ts
// FROZEN (scalePlan §§3/7/11.3) — static template metadata, SIBLING to the
// loader-only registry (D-C). `registry.ts` entries stay async dynamic-import
// loaders (bundle firewall); this file is pure data — it must NEVER import a
// template module, block, or resolver. `fit()`/shortlists query this record
// without pulling any template chunk into the bundle.
//
// Truthfulness is enforced by the conformance tests (spec 01 phase 4):
// - engine-core: every non-retired, non-bespoke template must resolve every
//   section of each declared engine's core set (see
//   src/modules/engines/coreSections.ts) as a real block in BOTH modes.
// - capability evidence: every declared block-backed capability must carry a
//   `capabilitySections` entry naming the section type that evidences it, and
//   that section must resolve non-placeholder in both modes. Lying here = red
//   test.
//
// Declaration notes (D-D, resolver keys re-verified 2026-07-07):
// - granth declares NO capabilities — in particular no `blog`: granth has no
//   blog blocks (writer profile sites have no blog), and declaring blog would
//   fail capability-evidence conformance. The spec's own rule decides.
// - surge's `casestudies` is a SECTION, not a capability — the capability
//   vocab is closed (scalePlan §7); do not add a case-studies capability.
//   Surge's capability set is lead-form + packages only.
// - lumen is D4 bespoke (Kundius one-off, off-funnel): `bespoke: true` exempts
//   it from engine-core conformance and from every shortlist; it still
//   declares its real capabilities honestly and gets the evidence check.
// - techpremium is retired (scalePlan §11.4): `retired: true` with EMPTY
//   engine/capability lists — out of every catalog/shortlist; simplest
//   truthful shape.

import type { TemplateId } from '@/types/service';
import type { CopyEngine, CapabilityId, DesignStyle } from '@/types/brief';

export interface TemplateMeta {
  copyEngines: readonly CopyEngine[];
  capabilities: readonly CapabilityId[];
  designStyles: readonly DesignStyle[];
  /** Block-backed capability → section type that evidences it (conformance §6b). */
  capabilitySections?: Partial<Record<CapabilityId, string>>;
  retired?: true;
  bespoke?: true;
}

export const templateMeta: Record<TemplateId, TemplateMeta> = {
  meridian: {
    copyEngines: ['thing'],
    designStyles: ['tech-minimal'],
    capabilities: ['lead-form'],
    capabilitySections: { 'lead-form': 'cta' },
  },
  vestria: {
    copyEngines: ['thing'],
    designStyles: ['editorial-craft'],
    // NOTE (structural caps): `multipage` is trust-on-declaration — it's
    // page-menu machinery, not a block; no block-existence check covers it
    // yet (conformance exempts structural capabilities).
    capabilities: ['multipage', 'lead-form', 'catalog'],
    capabilitySections: { 'lead-form': 'contact', catalog: 'catalog' },
  },
  hearth: {
    copyEngines: ['trust'],
    designStyles: ['warm-human'],
    capabilities: ['lead-form'],
    capabilitySections: { 'lead-form': 'cta' },
  },
  lex: {
    copyEngines: ['trust'],
    designStyles: ['authority-professional'],
    capabilities: ['lead-form'],
    capabilitySections: { 'lead-form': 'cta' },
  },
  surge: {
    copyEngines: ['trust'],
    designStyles: ['bold-performance'],
    capabilities: ['lead-form', 'packages'],
    capabilitySections: { 'lead-form': 'cta', packages: 'packages' },
  },
  granth: {
    copyEngines: ['work'],
    designStyles: ['literary-quiet'],
    capabilities: [], // no blog — granth has no blog blocks (see header note)
  },
  lumen: {
    copyEngines: ['work'],
    designStyles: ['editorial-craft'],
    // NOTE (structural caps): `bilingual` is trust-on-declaration — twin-field
    // machinery, not a block; no block-existence check covers it yet
    // (conformance exempts structural capabilities).
    capabilities: ['bilingual', 'gallery', 'lead-form'],
    capabilitySections: { gallery: 'portfolio', 'lead-form': 'contact' },
    bespoke: true,
  },
  techpremium: {
    copyEngines: [],
    designStyles: [],
    capabilities: [],
    retired: true,
  },
};
