// src/modules/templates/lex/fonts.ts
// Lex Google-Fonts href, variant-aware. Source Serif 4 (statesman display) +
// Inter Tight (body) + JetBrains Mono load for every variant. The clinical /
// civic variants swap --font-display to Lora / EB Garamond respectively, so we
// lazy-add only the needed display family (Phase 11b — keep payload minimal).

const BASE_FAMILIES =
  'family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400' +
  '&family=Inter+Tight:wght@400;500;600' +
  '&family=JetBrains+Mono:wght@400;500';

const VARIANT_DISPLAY: Record<string, string> = {
  clinical: '&family=Lora:ital,wght@0,400;0,500;0,600;1,400',
  civic: '&family=EB+Garamond:ital,wght@0,400;0,500;1,400',
};

export function lexFontsHref(variantId?: string): string {
  const extra = (variantId && VARIANT_DISPLAY[variantId]) || '';
  return `https://fonts.googleapis.com/css2?${BASE_FAMILIES}${extra}&display=swap`;
}
