// src/modules/templates/surge/paletteSelection.ts
// Industry-signal default palette inference for Surge.
//
// Strategy: score each accent hue by # of substring hits across the user's
// services[] + outcomes[] + whatYouDo. Highest score wins. Ties / zero hits fall
// back to a serviceType→palette map. Final fallback: volt (the default).
// Deterministic, no LLM, runs synchronously on Style step mount.

import type { SurgePalette, ServiceType } from '@/types/service';
import { defaultSurgePalette } from './palettes';
import type { ServiceUnderstanding } from '@/types/service';

const PALETTE_INDUSTRY_KEYWORDS: Record<SurgePalette, string[]> = {
  volt:    ['growth', 'performance', 'paid', 'ads', 'ppc', 'media'],
  azure:   ['b2b', 'saas', 'enterprise', 'corporate', 'fintech'],
  cyan:    ['analytics', 'data', 'seo', 'search', 'reporting'],
  teal:    ['content', 'organic', 'inbound', 'sustainable'],
  violet:  ['brand', 'premium', 'creative', 'design'],
  magenta: ['social', 'influencer', 'creator', 'viral'],
  coral:   ['ecommerce', 'd2c', 'retail', 'consumer', 'lifestyle'],
  amber:   ['startup', 'launch', 'founder', 'personal branding'],
  lime:    ['conversion', 'cro', 'experiment', 'optimisation', 'optimization'],
};

const SERVICE_TYPE_TO_PALETTE: Record<ServiceType, SurgePalette> = {
  agency:                'volt',
  consultancy:           'azure',
  coaching:              'amber',
  freelance:             'violet',
  'productized-service': 'cyan',
  'local-service':       'coral',
};

const PALETTE_ORDER: SurgePalette[] = [
  'volt', 'cyan', 'azure', 'teal', 'violet',
  'magenta', 'coral', 'amber', 'lime',
];

export function inferDefaultPalette(
  understanding: ServiceUnderstanding | null
): SurgePalette {
  if (!understanding) return defaultSurgePalette;

  const haystack = [
    understanding.whatYouDo ?? '',
    ...(understanding.services ?? []),
    ...(understanding.outcomes ?? []),
  ]
    .join(' ')
    .toLowerCase();

  let bestPalette: SurgePalette | null = null;
  let bestScore = 0;

  for (const palette of PALETTE_ORDER) {
    const keywords = PALETTE_INDUSTRY_KEYWORDS[palette];
    const score = keywords.reduce(
      (acc, kw) => acc + (haystack.includes(kw) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestPalette = palette;
    }
  }

  if (bestPalette && bestScore > 0) return bestPalette;

  if (understanding.serviceType) {
    return SERVICE_TYPE_TO_PALETTE[understanding.serviceType] ?? defaultSurgePalette;
  }

  return defaultSurgePalette;
}
