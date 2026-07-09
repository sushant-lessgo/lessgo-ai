"use client";

// TemplateSwapList — shared fit-filtered template switcher (scale-07 phase 7).
// Used by ServiceThemePopover (trust engine) and VestriaThemePopover (product
// templates, meridian unlocked). The list is NOT "all templates of my audience"
// anymore: a candidate appears ONLY if it can render every section this site
// currently has, on the SAME copy engine (engine = copy shape; swap never
// crosses engines).
//
// Shortlist derivation (pure, testable — swap.test.ts):
//   store layout section ids → section TYPES → ConfirmedStructure-equivalent →
//   requiredCapabilitiesFromStructure (phase 6, fit.ts) → fit() per candidate,
//   PLUS a section-coverage check: every site section must be in the engine
//   core (conformance-guaranteed renderable by every same-engine template) or
//   among the candidate's declared capabilitySections. A section the candidate
//   cannot render ⇒ candidate excluded. Conservative: an unknown/legacy section
//   type excludes every candidate (the swap section simply hides).
//
// Swap mechanism (reused from ServiceThemePopover, not rebuilt): pending →
// confirm → preloadTemplate(target) via the registry's dynamic loader (bundle
// firewall — no static template import) → parent commits meta. The patch is
// templateId + the INCOMING template's default variant/palette ONLY — content
// is never touched (zero words change; outgoing variant/palette ids may not
// exist on the new template, so defaults are mandatory).

import React, { useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  templateIds,
  templateLabels,
  templateBlurbs,
  type TemplateId,
} from '@/types/service';
import type { TemplateModule } from '@/types/template';
import { templateMeta } from '@/modules/templates/templateMeta';
import {
  fit,
  requiredCapabilitiesFromStructure,
  type ConfirmedStructure,
} from '@/modules/templates/fit';
import { engineCoreSections } from '@/modules/engines/coreSections';
import { preloadTemplate } from '@/modules/templates/registry';

/** The site facts the shortlist is computed over. */
export interface SwapSite {
  /** Deduped section TYPES across the whole site (all pages). */
  sectionTypes: string[];
  /** True when the project has more than one page (multipage capability required). */
  multipage: boolean;
}

/**
 * Derive the SwapSite from the store layout: top-level `sections` is the active
 * page's working copy; `pages` holds every page's slice (mirror strategy —
 * union is a conservative superset). Section ids are `${type}-${uuid}`.
 */
export function deriveSwapSite(
  sections: string[] | undefined,
  pages: Record<string, { sections?: string[] }> | undefined
): SwapSite {
  const types = new Set<string>();
  for (const id of sections ?? []) types.add(id.split('-')[0].toLowerCase());
  const pageEntries = Object.values(pages ?? {});
  for (const page of pageEntries) {
    for (const id of page.sections ?? []) types.add(id.split('-')[0].toLowerCase());
  }
  return { sectionTypes: [...types], multipage: pageEntries.length > 1 };
}

/**
 * Fit-filtered swap shortlist (templateIds order). A template is eligible iff:
 * 1. SAME ENGINE as the current template (copy shape — never crossed),
 * 2. `fit()` over `requiredCapabilitiesFromStructure` of the site's actual
 *    sections (retired/bespoke templates never fit),
 * 3. it can render EVERY section the site has (engine core ∪ its declared
 *    capabilitySections).
 * The current template is included only when it is itself eligible; a current
 * template with no engine (e.g. retired techpremium) yields an empty list.
 */
export function swapShortlist(current: TemplateId, site: SwapSite): TemplateId[] {
  const engine = templateMeta[current]?.copyEngines[0];
  if (!engine) return [];

  const structure: ConfirmedStructure = site.multipage
    ? {
        mode: 'multi',
        pageDetails: [{ archetypeKey: 'site', slug: '/', sections: site.sectionTypes }],
      }
    : { mode: 'single', sections: site.sectionTypes };
  const required = requiredCapabilitiesFromStructure(structure, engine);
  const core: readonly string[] = engineCoreSections[engine] ?? [];

  return templateIds.filter((candidate) => {
    // Same-engine + capability hard-fit (also excludes retired/bespoke).
    if (!fit(candidate, engine, required)) return false;
    // Section coverage: candidate must render every section this site has.
    const renderable = new Set<string>([
      ...core,
      ...Object.values(templateMeta[candidate].capabilitySections ?? {}).filter(
        (s): s is string => typeof s === 'string'
      ),
    ]);
    return site.sectionTypes.every((s) => renderable.has(s));
  });
}

/**
 * The ONLY meta patch a swap applies. Content/sections are deliberately absent:
 * a swap changes which blocks render, never a word of copy. Variant/palette
 * reset to the INCOMING template's defaults (cross-template ids don't overlap).
 */
export function buildSwapPatch(
  target: TemplateId,
  module: Pick<TemplateModule, 'defaultVariantId' | 'defaultPaletteId'>
): { templateId: TemplateId; variantId: string; paletteId: string } {
  return {
    templateId: target,
    variantId: module.defaultVariantId,
    paletteId: module.defaultPaletteId,
  };
}

interface TemplateSwapListProps {
  current: TemplateId;
  site: SwapSite;
  /** Parent commits the swap (updateMeta + analytics + autosave). */
  onSwap: (target: TemplateId, module: TemplateModule) => void;
}

/**
 * Fit-filtered template rows + confirm flow (ServiceThemePopover's mechanism,
 * extracted). Renders nothing when there is no eligible swap target.
 */
export function TemplateSwapList({ current, site, onSwap }: TemplateSwapListProps) {
  const [pending, setPending] = useState<TemplateId | null>(null);
  const [switching, setSwitching] = useState(false);

  const shortlisted = useMemo(
    () => swapShortlist(current, site),
    // sectionTypes is derived fresh per render; key on its contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, site.multipage, site.sectionTypes.join('|')]
  );

  // Always show the current template row (active), plus eligible targets.
  const rows = shortlisted.includes(current) ? shortlisted : [current, ...shortlisted];
  const hasTargets = rows.some((t) => t !== current);
  if (!hasTargets) return null;

  const confirmTemplate = async (target: TemplateId) => {
    setSwitching(true);
    try {
      // Preload before committing so blocks resolve without a render gap.
      const m = await preloadTemplate(target);
      onSwap(target, m);
      setPending(null);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">Template</p>
      <div className="space-y-2">
        {rows.map((id) => {
          const isActive = current === id;
          const isPending = pending === id;
          return (
            <div key={id}>
              <button
                onClick={() => {
                  if (isActive) return;
                  setPending(id);
                }}
                aria-pressed={isActive}
                className={`w-full text-left rounded-lg border p-2.5 transition ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/40'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {templateLabels[id]}
                  </span>
                  {isActive && <Check className="h-4 w-4 text-blue-500" />}
                </div>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {templateBlurbs[id]}
                </span>
              </button>

              {isPending && !isActive && (
                <div className="mt-1.5 rounded-md bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                  Switch to {templateLabels[id]}? Your copy stays — the
                  design re-skins and the palette resets.
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => confirmTemplate(id)}
                      disabled={switching}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-60"
                    >
                      {switching && <Loader2 className="h-3 w-3 animate-spin" />}
                      Switch
                    </button>
                    <button
                      onClick={() => setPending(null)}
                      disabled={switching}
                      className="px-2.5 py-1 rounded border border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TemplateSwapList;
