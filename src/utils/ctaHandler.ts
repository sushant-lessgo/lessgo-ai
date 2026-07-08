// utils/ctaHandler.ts - Utility function for handling CTA button clicks
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

import { logger } from '@/lib/logger';
import { toDestination } from '@/utils/destinationShim';
import { resolveDestination } from '@/utils/resolveCtaHref';
import type { Destination } from '@/types/destination';

/**
 * Navigate to a resolved Destination (edit-side click). Behaviors are keyed off
 * the Destination TYPE — the single click model shared with the published
 * resolver (scale-04). Section anchors scroll in-page; tel:/mailto: use the same
 * tab; external/social/download open a new tab.
 */
function navigateToDestination(dest: Destination) {
  const href = resolveDestination(dest);
  if (!href) return;

  switch (dest.kind) {
    case 'section': {
      const anchor = dest.anchor;
      // Prefer the section wrapper, fall back to a raw id match.
      const el =
        document.getElementById(`section-${anchor}`) || document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    case 'call':
    case 'email':
      window.location.href = href;
      return;
    case 'page':
      window.location.href = href;
      return;
    default: {
      // external / whatsapp / social / download — open in a new tab.
      let url = href;
      if (/^www\./i.test(url) || !/^[a-z]+:|^\//i.test(url)) {
        url = `https://${url}`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
  }
}

/**
 * Creates a CTA click handler that routes through the shared Destination model
 * (scale-04). Reads the new `cta: CTAButton` first, then the legacy
 * `buttonConfig`, then the section-level `cta`. The form case is handled inline
 * (scroll/modal behavior) mirroring the resolver wrapper's forms check.
 * @param sectionId - The section ID to get click config from
 * @param elementKey - The element key whose config to read
 * @returns onClick handler function
 */
export function createCTAClickHandler(sectionId: string, elementKey?: string) {
  return () => {
    const { content } = useEditStore.getState();
    const sectionData = content[sectionId];
    const entry =
      (elementKey && sectionData?.elementMetadata?.[elementKey]) ||
      sectionData?.elementMetadata?.['cta_text'] ||
      sectionData?.elementMetadata?.['cta'];

    const newCta = entry?.cta;
    const buttonConfig = entry?.buttonConfig;
    const sectionCta = sectionData?.cta;

    logger.debug('🔗 CTA Button clicked:', {
      sectionId,
      elementKey,
      newCta,
      buttonConfig,
      sectionCta,
    });

    // Form case (D-D): keep the imperative scroll/modal behavior, keyed off a
    // resolvable formId. New shape carries `cta.formId`; legacy uses buttonConfig.
    const formId =
      newCta?.formId ??
      (buttonConfig?.type === 'form' ? buttonConfig.formId : undefined) ??
      (sectionCta?.type === 'form' ? sectionCta.formId : undefined);
    const behavior = buttonConfig?.behavior ?? sectionCta?.behavior;
    const isFormCta =
      newCta?.formId !== undefined ||
      buttonConfig?.type === 'form' ||
      sectionCta?.type === 'form';

    if (isFormCta && formId) {
      logger.debug('📝 Form CTA clicked:', formId);
      if (behavior === 'openModal') {
        logger.debug('📝 Should open form modal for:', formId);
      } else {
        const formElement = document.getElementById(`form-${formId}`);
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Everything else: resolve to a Destination and navigate by its type. New
    // `cta` (concrete dest) wins; else the legacy buttonConfig / section cta.
    let dest = toDestination(newCta);
    if (dest === undefined || dest === 'GOAL_REF') {
      dest = toDestination(buttonConfig);
    }
    if (dest === undefined || dest === 'GOAL_REF') {
      // Section-level cta fallback (legacy HeroSection compat): treat as a link.
      if (sectionCta?.url) dest = toDestination(sectionCta.url);
    }

    if (dest === undefined || dest === 'GOAL_REF') {
      logger.debug('⚠️ No resolvable CTA destination:', { newCta, buttonConfig, sectionCta });
      return;
    }

    navigateToDestination(dest);
  };
}
