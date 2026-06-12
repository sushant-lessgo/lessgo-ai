// src/modules/templates/lex/paletteSelection.ts
// Industry-signal default palette inference for Lex. Mirrors the Hearth shape
// so the picker (Phase 11b) can call a uniform `inferDefaultPalette` per
// template. Deterministic, no LLM. Final fallback: counsel (navy + gold).

import type { LexPalette, ServiceType } from '@/types/service';
import { defaultLexPalette } from './palettes';
import type { ServiceUnderstanding } from '@/hooks/useServiceGenerationStore';

const PALETTE_INDUSTRY_KEYWORDS: Record<LexPalette, string[]> = {
  counsel:  ['law', 'legal', 'attorney', 'counsel', 'litigation', 'advisory'],
  heritage: ['estate', 'heritage', 'family office', 'trust', 'private client'],
  forest:   ['sustainability', 'environment', 'forestry', 'conservation', 'agriculture'],
  slate:    ['consulting', 'strategy', 'corporate', 'b2b', 'enterprise'],
  vellum:   ['academic', 'research', 'archival', 'institutional', 'nonprofit'],
  burgundy: ['wealth', 'finance', 'investment', 'banking', 'wine'],
  pacific:  ['maritime', 'insurance', 'logistics', 'engineering'],
  court:    ['compliance', 'audit', 'security', 'governance', 'regulatory'],
  trust:    ['fiduciary', 'private banking', 'capital', 'asset management'],
};

const SERVICE_TYPE_TO_PALETTE: Record<ServiceType, LexPalette> = {
  agency:                'slate',
  consultancy:           'counsel',
  coaching:              'vellum',
  freelance:             'slate',
  'productized-service': 'slate',
  'local-service':       'heritage',
};

const PALETTE_ORDER: LexPalette[] = [
  'counsel', 'slate', 'heritage', 'burgundy', 'trust',
  'court', 'vellum', 'forest', 'pacific',
];

export function inferDefaultPalette(
  understanding: ServiceUnderstanding | null
): LexPalette {
  if (!understanding) return defaultLexPalette;

  const haystack = [
    ...(understanding.industries ?? []),
    ...(understanding.serviceCategories ?? []),
  ]
    .join(' ')
    .toLowerCase();

  let bestPalette: LexPalette | null = null;
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
    return SERVICE_TYPE_TO_PALETTE[understanding.serviceType] ?? defaultLexPalette;
  }

  return defaultLexPalette;
}
