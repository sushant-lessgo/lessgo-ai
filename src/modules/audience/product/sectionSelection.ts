// src/modules/audience/product/sectionSelection.ts
// Product (thing-engine) section selection — scale-07 phase 2 convergence.
//
// Same Brief ⇒ same section list under every thing template (meridian +
// vestria, single-page). The list is the frozen thing engine core
// (header, hero, features, testimonials, footer) plus capability sections:
// a capability section is appended iff the Brief requires the capability AND
// the template declares an evidencing block for it
// (templateMeta.capabilitySections). The former MERIDIAN_PILOT_SECTIONS /
// VESTRIA_PILOT_SECTIONS fixed lists are deleted — per-template extras now
// exist ONLY as declared capability sections.
//
// Firewall note: this is the AUDIENCE layer — importing templateMeta/fit here
// is fine; the engine grammar itself (sectionGrammar.ts) stays template-free
// and receives the capability→section map as plain data.
//
// Phase-2 reality: the runtime callers (parseStrategyProduct,
// mockResponseGeneratorProduct) pass only `templateId` — no Brief is plumbed
// to this call site yet — so auto-generated single-page defaults are the bare
// engine core for BOTH templates. Brief/explicit capabilities arrive with the
// 7b structure gate (phases 4/6).

import type { Brief, CapabilityId } from '@/types/brief';
import type { TemplateId } from '@/types/service';
import { buildSectionList } from '@/modules/engines/sectionGrammar';
import { templateMeta } from '@/modules/templates/templateMeta';
import { requiredCapabilitiesFromBrief } from '@/modules/templates/fit';

export interface SelectProductSectionsOptions {
  templateId?: string;
  /** Brief drives auto-inferred capability sections; absent ⇒ engine core only. */
  brief?: Brief;
  /**
   * Explicit capability inclusions (the 7b structure gate, phase 4 — the ONLY
   * entry path for the explicit-trigger ids trust/industries/about/materials/
   * process). Unioned with the Brief-derived set.
   */
  requiredCapabilities?: readonly CapabilityId[];
}

export function selectProductSections(opts?: SelectProductSectionsOptions): string[] {
  const meta =
    opts?.templateId && opts.templateId in templateMeta
      ? templateMeta[opts.templateId as TemplateId]
      : undefined;

  const required = new Set<CapabilityId>(
    opts?.brief ? requiredCapabilitiesFromBrief(opts.brief) : []
  );
  for (const cap of opts?.requiredCapabilities ?? []) required.add(cap);

  return buildSectionList({
    engine: 'thing',
    requiredCapabilities: [...required],
    capabilitySections: meta?.capabilitySections,
  });
}
