// utils/ctaHandler.ts - Utility function for handling CTA button clicks
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

import { logger } from '@/lib/logger';
/**
 * Creates a CTA click handler that opens external links based on ctaConfig
 * @param sectionId - The section ID to get ctaConfig from
 * @returns onClick handler function
 */
export function createCTAClickHandler(sectionId: string, elementKey?: string) {
  return () => {
    // Get ctaConfig from section data
    const { content } = useEditStore.getState();
    const sectionData = content[sectionId];
    
    // First try to find CTA config in section.cta (legacy)
    let ctaConfig = sectionData?.cta;
    
    // If not found, look for button config in element metadata (new approach)
    if (!ctaConfig && elementKey && sectionData?.elements?.[elementKey]?.metadata?.buttonConfig) {
      const buttonConfig = sectionData.elements[elementKey].metadata.buttonConfig;
      ctaConfig = {
        label: buttonConfig.label || 'Click Here',
        type: buttonConfig.type,
        url: buttonConfig.url,
        formId: buttonConfig.formId,
        behavior: buttonConfig.behavior,
        variant: (buttonConfig.variant as 'primary' | 'secondary' | 'outline' | 'ghost') || 'primary',
        size: (buttonConfig.size as 'small' | 'medium' | 'large') || 'medium'
      };
    }
    
    // Also check if there's a CTA button element we can infer config from
    if (!ctaConfig && sectionData?.elements) {
      // Look for CTA-related elements
      const ctaElement = sectionData.elements['cta_text'] || sectionData.elements['cta'];
      if (ctaElement?.metadata?.buttonConfig) {
        const buttonConfig = ctaElement.metadata.buttonConfig;
        ctaConfig = {
          label: buttonConfig.label || 'Click Here',
          type: buttonConfig.type,
          url: buttonConfig.url,
          formId: buttonConfig.formId,
          behavior: buttonConfig.behavior,
          variant: (buttonConfig.variant as 'primary' | 'secondary' | 'outline' | 'ghost') || 'primary',
          size: (buttonConfig.size as 'small' | 'medium' | 'large') || 'medium'
        };
      }
    }
    
    logger.debug('🔗 CTA Button clicked:', { ctaConfig, sectionId, elementKey, sectionData: sectionData?.elements });
    
    if (ctaConfig?.type === 'link' && ctaConfig.url) {
      // Ensure URL has protocol - add https:// if missing
      let url = ctaConfig.url;
      if (!url.match(/^https?:\/\//)) {
        url = `https://${url}`;
      }
      logger.debug('🔗 Opening external link:', url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (ctaConfig?.type === 'form' && ctaConfig.formId) {
      logger.debug('📝 Form CTA clicked:', ctaConfig.formId);
      // Handle form CTAs - could scroll to form or open modal based on behavior
      if (ctaConfig.behavior === 'scrollTo') {
        const formElement = document.getElementById(`form-${ctaConfig.formId}`);
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (ctaConfig.behavior === 'openModal') {
        // Trigger form modal opening - this would need to be implemented
        logger.debug('📝 Should open form modal for:', ctaConfig.formId);
      }
    } else {
      logger.debug('⚠️ No CTA config or URL found:', ctaConfig);
      logger.debug('Available section elements:', Object.keys(sectionData?.elements || {}));
    }
  };
}