// utils/ctaHandler.ts - Utility function for handling CTA button clicks
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

/**
 * Creates a CTA click handler that opens external links based on ctaConfig
 * @param sectionId - The section ID to get ctaConfig from
 * @returns onClick handler function
 */
export function createCTAClickHandler(sectionId: string) {
  return () => {
    // Get ctaConfig from section data
    const { content } = useEditStore.getState();
    const sectionData = content[sectionId];
    const ctaConfig = sectionData?.cta;
    
    console.log('🔗 CTA Button clicked:', { ctaConfig, sectionId });
    
    if (ctaConfig?.type === 'link' && ctaConfig.url) {
      console.log('🔗 Opening external link:', ctaConfig.url);
      window.open(ctaConfig.url, '_blank', 'noopener,noreferrer');
    } else if (ctaConfig?.type === 'form' && ctaConfig.formId) {
      console.log('📝 Form CTA clicked:', ctaConfig.formId);
      // Handle form CTAs - could scroll to form or open modal based on behavior
      if (ctaConfig.behavior === 'scrollTo') {
        const formElement = document.getElementById(`form-${ctaConfig.formId}`);
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (ctaConfig.behavior === 'openModal') {
        // Trigger form modal opening - this would need to be implemented
        console.log('📝 Should open form modal for:', ctaConfig.formId);
      }
    } else {
      console.log('⚠️ No CTA config or URL found:', ctaConfig);
    }
  };
}