// src/utils/resolveCtaHref.ts
// Shared resolver for a published CTA's href.
//
// scale-04: split into a core `resolveDestination(dest)` (the one dumb resolver
// over the Destination vocabulary) plus the legacy `resolveCtaHref` wrapper,
// which keeps its EXACT prior signature so the ~26 published block readers see
// byte-identical href output. The wrapper handles the legacy `type:'form'` case
// inline (with the forms-existence check) and routes everything else through
// the migration shim → `resolveDestination`.
//
// buttonConfig lives at content[sectionId].elementMetadata[elementKey].buttonConfig
// and is written by ButtonConfigurationModal. A form connection resolves to the
// shared "#form-section" anchor (mirrors the form-builder published integration).

import type { Destination } from '@/types/destination';
import { toDestination } from '@/utils/destinationShim';

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

/**
 * The single dumb resolver: a `Destination` → plain href string. Every kind
 * maps to a canonical href; classified legacy strings round-trip verbatim.
 */
export function resolveDestination(dest: Destination): string {
  switch (dest.kind) {
    case 'section':
      return `#${dest.anchor}`;
    case 'page':
      return dest.pathSlug;
    case 'external':
      return dest.url;
    case 'whatsapp':
      return `https://wa.me/${dest.number}${
        dest.msg !== undefined ? `?text=${encodeURIComponent(dest.msg)}` : ''
      }`;
    case 'call':
      return `tel:${dest.number}`;
    case 'email':
      return `mailto:${dest.addr}`;
    case 'download':
      return dest.fileUrl;
    case 'social':
      return dest.url;
  }
}

export function resolveCtaHref(
  buttonConfig: CtaButtonConfig | undefined,
  forms: Record<string, any> | undefined,
  fallback: string = '#cta',
): string {
  if (!buttonConfig) return fallback;

  // Form case stays in the wrapper (D-D): the forms-existence check is NOT pure,
  // so `toDestination` never sees it. Byte-identical to the pre-scale-04 branch.
  if (buttonConfig.type === 'form') {
    if (!buttonConfig.formId) return fallback;
    const form = forms?.[buttonConfig.formId];
    if (!form) return fallback;
    return '#form-section';
  }

  // Everything else: shim → resolver. `pathSlug`/`url` fall back to `fallback`
  // when empty, matching the prior `pathSlug || fallback` / `url || fallback`.
  const dest = toDestination(buttonConfig);
  if (dest === undefined || dest === 'GOAL_REF') return fallback;
  return resolveDestination(dest) || fallback;
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
