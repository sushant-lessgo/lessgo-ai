/**
 * Published Component Registry - Server-safe component resolution for published pages
 *
 * @remarks
 * The legacy 47-UIBlock published registry was removed. Published pages render
 * exclusively through template modules. Dispatch is solely via the dynamic
 * template registry — there is no remaining non-template published path.
 */

import React from 'react';

// NOTE: no static template-module import (firewall). Dispatch reads the
// dynamically-preloaded template module from the registry cache.
import { getLoadedTemplate } from '@/modules/templates/registry';
import { resolveSharedBlockPublished } from './sharedBlocks/registry.published';
import type { AudienceType, TemplateId } from '@/types/service';
import { usesTemplateModule } from '@/types/service';

/**
 * Extract section type from sectionId
 * @example extractSectionType('hero-123') => 'hero'
 */
export function extractSectionType(sectionId: string): string {
  return sectionId.split('-')[0].toLowerCase();
}

/**
 * Get published component by section type and layout name.
 * @returns Component or null if no template module is loaded / resolvable.
 */
export function getComponent(
  type: string,
  layout: string,
  audienceType: AudienceType = 'product',
  templateId: string | null = 'hearth'
): React.ComponentType<any> | null {
  const normalizedType = type.toLowerCase();

  // Shared template-agnostic blocks (e.g. leadForm) resolve BEFORE template
  // dispatch — server-safe twins only (firewall).
  const shared = resolveSharedBlockPublished(normalizedType);
  if (shared) return shared;

  // Template-backed projects (service = Hearth/Lex; product+meridian = Meridian)
  // dispatch to the selected template module (preloaded + cached via the dynamic
  // registry; read synchronously here).
  // Dispatch by SECTION TYPE (normalizedType); the stored layout name selects a
  // declared variant, with A1 fallback to the section default (scale-09).
  if (usesTemplateModule(audienceType, templateId)) {
    const tmpl = getLoadedTemplate((templateId || 'hearth') as TemplateId);
    // Forward the stored layout name for variant dispatch (scale-09); A1
    // fallback to the section default preserves template switching.
    return tmpl ? tmpl.resolveBlock(normalizedType, 'published', layout) : null;
  }

  // Legacy 47-block published path removed in P5 (hard cutover).
  return null;
}
