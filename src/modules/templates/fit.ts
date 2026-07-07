// src/modules/templates/fit.ts
// Hard-fit helpers (scale track, scalePlan §7.2 / spec 01 D-G). Pure data-layer
// queries over templateMeta + businessTypes — this file must NEVER import a
// template module, block, resolver, or the registry loaders (bundle firewall).
// No app code imports this yet (readers arrive spec 02+).

import type { TemplateId } from '@/types/service';
import { templateIds } from '@/types/service';
import type { CapabilityId } from '@/types/brief';
import type { Brief } from '@/types/brief';
import { templateMeta } from '@/modules/templates/templateMeta';
import { businessTypes, type BusinessTypeKey } from '@/modules/businessTypes/config';

/**
 * Pure hard-fit: template serves `engine` and covers every `required`
 * capability. Retired and bespoke templates never fit (off every shortlist).
 */
export function fit(
  templateId: TemplateId,
  engine: string | undefined,
  required: CapabilityId[]
): boolean {
  const meta = templateMeta[templateId];
  if (!meta || meta.retired || meta.bespoke) return false;
  if (!engine || !(meta.copyEngines as readonly string[]).includes(engine)) return false;
  return required.every((cap) => meta.capabilities.includes(cap));
}

/**
 * §7.2 fixed derivation table, v0 scope:
 * - businessType entry's requiredCapabilities (unknown key contributes none —
 *   the SERVE GATE, spec 02+, is what rejects unknown types)
 * - mechanism M1 → lead-form; intent download-app → store-badges
 * - structure.mode === 'multi' → multipage
 * (No language field on Brief yet → no bilingual derivation; spec 02+.)
 */
export function requiredCapabilitiesFromBrief(brief: Brief): CapabilityId[] {
  const required = new Set<CapabilityId>();

  const entry = brief.businessType
    ? businessTypes[brief.businessType as BusinessTypeKey]
    : undefined;
  for (const cap of entry?.requiredCapabilities ?? []) required.add(cap);

  if (brief.goal?.mechanism === 'M1') required.add('lead-form');
  if (brief.goal?.intent === 'download-app') required.add('store-badges');
  if (brief.structure?.mode === 'multi') required.add('multipage');

  return [...required];
}

/** All template ids that hard-fit the brief (templateIds order preserved). */
export function shortlist(brief: Brief): TemplateId[] {
  const required = requiredCapabilitiesFromBrief(brief);
  return templateIds.filter((t) => fit(t, brief.copyEngine, required));
}

/**
 * Brief-level convenience: does this single template hard-fit the brief?
 * Named distinctly (not an overload of the pure `fit`) so later specs have a
 * stable brief-level symbol.
 */
export function fitsBrief(templateId: TemplateId, brief: Brief): boolean {
  return fit(templateId, brief.copyEngine, requiredCapabilitiesFromBrief(brief));
}
