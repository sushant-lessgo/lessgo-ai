// src/modules/audience/product/strategy/parseStrategyProduct.ts
// Assemble ProductStrategyOutput from the LLM response + the deterministic
// per-template section list + block map. Mirror of parseStrategyService.ts.
//
// Multi-page templates (vestria): the LLM additionally proposes a sitemap,
// constrained to the template's page-archetype menu. The proposal is a
// SUGGESTION — clampSitemap below is the law (home forced first, unknown
// keys/sections dropped, required sections inserted, fallback defaults).

import type { ProductStrategyOutput, SitemapPage } from '@/types/product';
import type {
  ProductStrategyResponse,
  ProductStrategyWithSitemapResponse,
} from '@/lib/schemas/productStrategy.schema';
import { selectProductSections } from '../sectionSelection';
import { selectProductBlocks } from '../selectBlocks';
import { getPageArchetypesForTemplate, type PageArchetypeDef } from '../pageArchetypes';

export interface AssembleProductStrategyInput {
  llmResponse: ProductStrategyResponse | ProductStrategyWithSitemapResponse;
  /** Template-aware section/block selection. ASSEMBLY ONLY — never fed into any
   *  prompt builder (the prompt firewall forbids templateId in prompt input). */
  templateId?: string;
}

interface RawSitemapPage {
  archetypeKey?: string;
  title?: string;
  sections?: string[];
  reason?: string;
}

/** Order-preserving dedupe. */
function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Clamp an LLM sitemap proposal to the template's page-archetype menu.
 * Deterministic server law over the suggestion:
 *  - unknown archetype keys dropped; duplicate pages deduped (first wins)
 *  - home forced present and first
 *  - per page: sections filtered (order-preserving) to allowedSections,
 *    deduped, required sections appended when missing; empty → defaultSections
 *  - titles defaulted; pathSlug ALWAYS from the menu (the AI never picks slugs)
 *  - empty/absent proposal → the menu's defaultIncluded pages with defaults
 */
export function clampSitemap(
  proposal: RawSitemapPage[] | undefined | null,
  menu: PageArchetypeDef[]
): SitemapPage[] {
  const byKey = new Map(menu.map((a) => [a.key, a]));
  const home = menu.find((a) => a.required) ?? menu[0];

  const clampPage = (def: PageArchetypeDef, raw?: RawSitemapPage): SitemapPage => {
    // No proposal for this page (fallback sitemap / forced home) → defaults.
    // A proposal, however thin, is respected: filter → dedupe → insert required.
    let sections: string[];
    if (!raw) {
      sections = [...def.defaultSections];
    } else {
      const filtered = dedupe(
        (raw.sections ?? []).filter((s) => def.allowedSections.includes(s))
      );
      sections = [
        ...filtered,
        ...def.requiredSections.filter((s) => !filtered.includes(s)),
      ];
    }
    return {
      archetypeKey: def.key,
      title: (raw?.title ?? '').trim() || def.title,
      pathSlug: def.pathSlug,
      sections,
      ...(raw?.reason ? { reason: raw.reason } : {}),
    };
  };

  // Fallback: no usable proposal → default sitemap.
  const usable = (proposal ?? []).filter(
    (p) => p && typeof p.archetypeKey === 'string' && byKey.has(p.archetypeKey)
  );
  if (!usable.length) {
    return menu
      .filter((a) => a.defaultIncluded)
      .map((a) => clampPage(a));
  }

  const seen = new Set<string>();
  const pages: SitemapPage[] = [];
  for (const raw of usable) {
    const def = byKey.get(raw.archetypeKey!)!;
    if (seen.has(def.key)) continue; // duplicate page — first wins
    seen.add(def.key);
    pages.push(clampPage(def, raw));
  }

  // Home forced present + first.
  const homeIdx = pages.findIndex((p) => p.archetypeKey === home.key);
  if (homeIdx < 0) {
    pages.unshift(clampPage(home));
  } else if (homeIdx > 0) {
    const [h] = pages.splice(homeIdx, 1);
    pages.unshift(h);
  }

  return pages;
}

/**
 * Combine LLM strategy (awareness/oneReader/oneIdea/featureAnalysis) with the
 * deterministic per-template section list + block map (+ clamped sitemap for
 * multi-page templates).
 */
export function assembleProductStrategy(
  input: AssembleProductStrategyInput
): ProductStrategyOutput {
  const { llmResponse, templateId } = input;

  const menu = getPageArchetypesForTemplate(templateId);

  let sections: string[];
  let sitemap: SitemapPage[] | undefined;

  if (menu) {
    // Multi-page template: clamp the proposal; top-level sections stay the HOME
    // page (+ chrome) so every single-page consumer keeps working unchanged.
    const rawPages = (llmResponse as ProductStrategyWithSitemapResponse).sitemap?.pages;
    sitemap = clampSitemap(rawPages, menu);
    sections = ['header', ...sitemap[0].sections, 'footer'];
  } else {
    sections = selectProductSections({ templateId });
  }

  const { uiblocks } = selectProductBlocks({ sections, templateId });

  return {
    awareness: llmResponse.awareness,
    oneReader: llmResponse.oneReader,
    oneIdea: llmResponse.oneIdea,
    featureAnalysis: llmResponse.featureAnalysis,
    sections,
    uiblocks,
    ...(sitemap ? { sitemap } : {}),
  };
}
