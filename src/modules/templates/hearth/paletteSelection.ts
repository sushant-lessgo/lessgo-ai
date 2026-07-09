// src/modules/service/design/paletteSelection.ts
// Industry-signal default palette inference (Phase 7).
// Reference: docs/architecture/newServiceOnboarding.md §6 (Step 6 default pre-selection).
//
// Strategy: score each palette by # of substring hits across the user's
// services[] + outcomes[] + whatYouDo. Highest score wins. Ties / zero hits
// fall back to a serviceType→palette map. Final fallback: terracotta.
// Deterministic, no LLM, runs synchronously on Style step mount.

import type { HearthPalette, ServiceType } from '@/types/service';
import { defaultHearthPalette } from './palettes';
import type { ServiceUnderstanding } from '@/types/service';

const PALETTE_INDUSTRY_KEYWORDS: Record<HearthPalette, string[]> = {
  rose:       ['beauty', 'skincare', 'cosmetic', 'fashion', 'spa', 'derma'],
  terracotta: ['food', 'restaurant', 'cafe', 'bakery', 'hospitality', 'local', 'lifestyle'],
  indigo:     ['professional', 'agency', 'b2b', 'corporate', 'marketing'],
  charcoal:   ['finance', 'legal', 'law', 'accounting', 'tax', 'banking', 'compliance'],
  sage:       ['health', 'therapy', 'mental', 'coaching', 'wellness', 'psychology'],
  moss:       ['agriculture', 'sustainability', 'environment', 'organic', 'garden', 'eco'],
  ochre:      ['craft', 'artisan', 'handmade', 'traditional'],
  plum:       ['luxury', 'fine art', 'boutique', 'premium', 'jewelry'],
  teal:       ['tech', 'software', 'dev', 'digital', 'saas'],
};

const SERVICE_TYPE_TO_PALETTE: Record<ServiceType, HearthPalette> = {
  agency:                'indigo',
  consultancy:           'sage',
  coaching:              'sage',
  freelance:             'ochre',
  'productized-service': 'indigo',
  'local-service':       'terracotta',
};

const PALETTE_ORDER: HearthPalette[] = [
  'rose', 'terracotta', 'indigo', 'charcoal', 'sage',
  'moss', 'ochre', 'plum', 'teal',
];

export function inferDefaultPalette(
  understanding: ServiceUnderstanding | null
): HearthPalette {
  if (!understanding) return defaultHearthPalette;

  // Score across the lean understanding's free-text signal (services +
  // outcomes + whatYouDo) — industries/serviceCategories were removed.
  const haystack = [
    understanding.whatYouDo ?? '',
    ...(understanding.services ?? []),
    ...(understanding.outcomes ?? []),
  ]
    .join(' ')
    .toLowerCase();

  let bestPalette: HearthPalette | null = null;
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
    return SERVICE_TYPE_TO_PALETTE[understanding.serviceType] ?? defaultHearthPalette;
  }

  return defaultHearthPalette;
}
