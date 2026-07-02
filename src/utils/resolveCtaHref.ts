// src/utils/resolveCtaHref.ts
// Shared resolver for a published CTA's href from its element buttonConfig.
// Single source of truth for the rule that was previously copy-pasted as
// `resolvePrimaryHref` in ArcCTA.published / BookCallCTA.published / TerminalHero.published.
//
// buttonConfig lives at content[sectionId].elementMetadata[elementKey].buttonConfig
// and is written by ButtonConfigurationModal. A form connection resolves to the
// shared "#form-section" anchor (mirrors the form-builder published integration).

export interface CtaButtonConfig {
  type?: 'link' | 'form' | 'link-with-input' | 'page';
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  url?: string;
  // Phase 2 cross-page link: target page's pathSlug ('/contact'); pageId kept for
  // future slug-rename resilience.
  pageId?: string;
  pathSlug?: string;
}

export function resolveCtaHref(
  buttonConfig: CtaButtonConfig | undefined,
  forms: Record<string, any> | undefined,
  fallback: string = '#cta',
): string {
  if (!buttonConfig) return fallback;
  if (buttonConfig.type === 'page') {
    return buttonConfig.pathSlug || fallback;
  }
  if (buttonConfig.type === 'link' || buttonConfig.type === 'link-with-input') {
    return buttonConfig.url || fallback;
  }
  if (buttonConfig.type === 'form') {
    if (!buttonConfig.formId) return fallback;
    const form = forms?.[buttonConfig.formId];
    if (!form) return fallback;
    return '#form-section';
  }
  return fallback;
}

/**
 * Anchor attrs for a resolved href. External links (http/https — e.g. a Calendly
 * booking URL) open in a new tab; in-page anchors and internal paths stay same-tab.
 * Plain server-safe module — spreadable into published <a> elements.
 */
export function externalLinkProps(href: string | undefined): { target?: '_blank'; rel?: string } {
  return href && /^https?:\/\//i.test(href)
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};
}
