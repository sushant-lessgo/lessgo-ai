// src/modules/engines/sectionGrammar.ts
// Engine-owned section grammar (scale-07 phases 1–2).
//
// One pure module produces a landing-page section list from
// (engine, ordering data, gate flags, required capabilities). It generalizes
// the service pattern: awareness-ordered middle sections + capability/asset-
// gated optionals + header/footer wrap where the engine core demands it.
//
// FIREWALL: this module imports NO template code — no templateMeta, no
// registry, no template modules. Awareness ordering, gate flags, and the
// capability→section evidence map (templateMeta.capabilitySections) all arrive
// as plain data from the caller (the audience selectors), keeping template
// knowledge out of the engine layer. Core section sets come from the frozen
// `engineCoreSections` contract; capability ids from the frozen closed vocab.
//
// Phase-2 convergence law: same Brief ⇒ same section list under every template
// of the same engine. The engine core is the shared skeleton; the ONLY
// per-template additions are capability sections, and a capability section is
// appended iff the Brief requires the capability AND the template declares an
// evidencing section for it. The phase-1 `extras` escape hatch (pilot-list
// passthrough) is deleted.

import type { CopyEngine, CapabilityId } from '@/types/brief';
import { capabilityIds } from '@/types/brief';
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
   * Middle-section order (everything between header and footer), already
   * resolved by the caller's ordering table (e.g. awareness → order map).
   * Conditional sections appear here to fix their RELATIVE position; the
   * gates decide whether they survive. When omitted, the engine core's own
   * middle (core minus header/footer) is used.
   */
  ordering?: readonly string[];
  gates?: SectionGates;
  /**
   * Capability ids the Brief requires (auto-inferred via
   * requiredCapabilitiesFromBrief + explicit 7b-gate inclusions). Resolved by
   * the CALLER; this module never derives capabilities itself.
   */
  requiredCapabilities?: readonly CapabilityId[];
  /**
   * capabilityId → evidencing section type — the calling audience layer passes
   * `templateMeta[templateId].capabilitySections` IN as data (firewall: this
   * module must not import templateMeta). A required capability with no entry
   * here contributes no section (structural capabilities like `multipage`, or
   * a template that simply lacks the block).
   */
  capabilitySections?: Readonly<Partial<Record<CapabilityId, string>>>;
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
 * Build the section list for one page: `[header?, ...middle, ...capability
 * sections, footer?]`. Header/footer wrap applies exactly where the engine
 * core demands it (the core set contains 'header'/'footer').
 *
 * Capability sections are appended after the ordered middle, in canonical
 * `capabilityIds` order (deterministic regardless of caller set order), and
 * deduped against sections already present (a capability evidenced by a core
 * section never duplicates it).
 */
export function buildSectionList(input: BuildSectionListInput): string[] {
  const { engine, ordering, gates, requiredCapabilities, capabilitySections } = input;

  const core = engineCoreSections[engine];
  const wrapHeader = core.includes('header');
  const wrapFooter = core.includes('footer');

  const middle =
    ordering ?? core.filter((s) => s !== 'header' && s !== 'footer');

  const body = middle.filter((sectionType) => passesGates(sectionType, gates));

  if (requiredCapabilities?.length && capabilitySections) {
    const required = new Set(requiredCapabilities);
    for (const cap of capabilityIds) {
      if (!required.has(cap)) continue;
      const sectionType = capabilitySections[cap];
      if (!sectionType) continue;
      // Chrome is core-owned; a capability entry may never re-add it.
      if (sectionType === 'header' || sectionType === 'footer') continue;
      if (!body.includes(sectionType)) body.push(sectionType);
    }
  }

  return [
    ...(wrapHeader ? ['header'] : []),
    ...body,
    ...(wrapFooter ? ['footer'] : []),
  ];
}
