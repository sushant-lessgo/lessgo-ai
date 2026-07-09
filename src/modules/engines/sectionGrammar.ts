// src/modules/engines/sectionGrammar.ts
// Engine-owned section grammar (scale-07 phase 1).
//
// One pure module produces a landing-page section list from
// (engine, ordering data, gate flags). It generalizes the service pattern:
// awareness-ordered middle sections + capability/asset-gated optionals +
// header/footer wrap where the engine core demands it.
//
// FIREWALL: this module imports NO template code — no templateMeta, no
// registry, no template modules. Awareness ordering and gate flags arrive as
// plain data from the caller (the audience selectors), keeping template
// knowledge out of the engine layer. Core section sets come from the frozen
// `engineCoreSections` contract.
//
// Phase-1 scope: behavior-preserving wiring only. `selectProductSections` and
// `selectServiceSections` delegate here and MUST return byte-identical output
// (asserted exhaustively in sectionGrammar.test.ts). Brief-driven capability
// sections land in phase 2; the `extras` escape hatch dies with them.

import type { CopyEngine } from '@/types/brief';
import { engineCoreSections } from './coreSections';

/**
 * Legacy gate flags — the trust pattern from selectServiceSections. A gated
 * section survives only when its flag allows it; ungated sections always pass.
 *
 * Defaults preserve current selector semantics: asset-backed sections
 * (`testimonials`, `logos`, `casestudies`) default OFF (no proof asset ⇒ no
 * section); `packages` defaults ON (`showPackages` mirrors
 * `format !== 'quote-only'`, which is true when format is undefined).
 */
export interface SectionGates {
  hasTestimonials?: boolean;
  /** `format !== 'quote-only'` — packages section survives unless quote-only. */
  showPackages?: boolean;
  hasClientLogos?: boolean;
  hasCaseStudies?: boolean;
}

export interface BuildSectionListInput {
  engine: CopyEngine;
  /**
   * Reserved for phase 2 (Brief-required capability sections). Unused in
   * phase 1 — accepted so callers can start passing it without a signature
   * break later.
   */
  brief?: unknown;
  /**
   * Middle-section order (everything between header and footer), already
   * resolved by the caller's ordering table (e.g. awareness → order map).
   * Conditional sections appear here to fix their RELATIVE position; the
   * gates decide whether they survive. When omitted, the engine core's own
   * middle (core minus header/footer) is used.
   */
  ordering?: readonly string[];
  gates?: SectionGates;
  /**
   * Full-list override for the product pilot templates (meridian/vestria
   * fixed lists). When present it is returned verbatim — no ordering, no
   * gating, no wrap.
   *
   * @deprecated — removed in scale-07 phase 2 (pilot lists become engine
   * core + Brief-required capability sections).
   */
  extras?: readonly string[];
}

/** Sections gated by legacy asset/format flags (trust pattern). */
function passesGates(sectionType: string, gates: SectionGates | undefined): boolean {
  if (!gates) return true;
  if (sectionType === 'testimonials') return gates.hasTestimonials ?? false;
  if (sectionType === 'packages') return gates.showPackages ?? true;
  if (sectionType === 'logos') return gates.hasClientLogos ?? false;
  if (sectionType === 'casestudies') return gates.hasCaseStudies ?? false;
  return true;
}

/**
 * Build the section list for one page: `[header?, ...middle, footer?]`.
 * Header/footer wrap applies exactly where the engine core demands it (the
 * core set contains 'header'/'footer').
 */
export function buildSectionList(input: BuildSectionListInput): string[] {
  const { engine, ordering, gates, extras } = input;

  // Temporary phase-1 escape hatch — see @deprecated note on `extras`.
  if (extras) return [...extras];

  const core = engineCoreSections[engine];
  const wrapHeader = core.includes('header');
  const wrapFooter = core.includes('footer');

  const middle =
    ordering ?? core.filter((s) => s !== 'header' && s !== 'footer');

  const body = middle.filter((sectionType) => passesGates(sectionType, gates));

  return [
    ...(wrapHeader ? ['header'] : []),
    ...body,
    ...(wrapFooter ? ['footer'] : []),
  ];
}
