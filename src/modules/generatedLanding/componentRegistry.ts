import React from 'react';

import { logger } from '@/lib/logger';
// NOTE: do NOT statically import any template module here — that would pull
// Hearth/Meridian into the product/main bundle. Template dispatch goes through
// the dynamic template registry's preloaded cache (firewall, Phase 7.5c).
import { getLoadedTemplate } from '@/modules/templates/registry';
import type { AudienceType, TemplateId } from '@/types/service';
import { usesTemplateModule } from '@/types/service';

// P5 (meridianPlan.md): the legacy 47-UIBlock à-la-carte registry was archived to
// `archive/modules/UIBlocks`. Product now renders exclusively through the Meridian
// template module; service through Hearth. There is no remaining non-template
// render path — `getComponent` dispatches solely via the template registry.

// Helper function to extract section type from section ID
export function extractSectionType(sectionId: string): string {
  // Section IDs are in format: sectionType-timestamp (e.g., "hero-1753195467366")
  // Extract everything before the last dash and numbers
  const match = sectionId.match(/^([a-zA-Z]+)/);
  if (!match) return sectionId;

  const rawType = match[1].toLowerCase();

  // Normalize to registry keys (PascalCase sections → camelCase registry)
  const typeMap: Record<string, string> = {
    'objectionhandle': 'objectionHandling',
    'howitworks': 'howItWorks',
    'beforeafter': 'beforeAfter',
    'socialproof': 'socialProof',
    'usecases': 'useCases',
    'uniquemechanism': 'uniqueMechanism',
    'foundernote': 'founderNote',
  };

  return typeMap[rawType] || rawType;
}

// Helper function to get a component by section and layout
export function getComponent(
  sectionIdOrType: string,
  layoutName: string,
  audienceType: AudienceType = 'product',
  templateId: string | null = 'hearth'
): React.ComponentType<any> | null {
  // Extract section type from section ID if needed (e.g. 'hero-123' → 'hero').
  const sectionType = extractSectionType(sectionIdOrType);

  // Template-backed projects (service = Hearth/Lex; product+meridian = Meridian)
  // dispatch to the selected template module. The module is dynamically imported
  // + cached via preloadTemplate() before render; here we read it synchronously
  // (null until loaded — renderers gate on readiness).
  if (usesTemplateModule(audienceType, templateId)) {
    const tmpl = getLoadedTemplate((templateId || 'hearth') as TemplateId);
    // A1: dispatch by SECTION TYPE, not the stored layout name. One block per
    // section per template, so the template re-resolves its own block regardless
    // of which template generated the stored layout string (kept in data, unused
    // here). Lets the editor switch templates with zero layout-name rewrites.
    return tmpl ? tmpl.resolveBlock(sectionType, 'edit') : null;
  }

  // Legacy 47-block path removed in P5 (hard cutover). Any project reaching here
  // carries no template module and has no renderer — should not occur post-cutover.
  logger.warn(
    `No template module for (audienceType=${audienceType}, templateId=${templateId}); ` +
    `legacy 47-block path was archived in P5. section=${sectionIdOrType} layout=${layoutName}`
  );
  return null;
}
