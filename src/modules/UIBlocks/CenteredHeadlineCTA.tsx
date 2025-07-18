// components/layout/CenteredHeadlineCTA.tsx
// Production-ready centered CTA section using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableHeadline, 
  EditableText,
  EditableBadge 
} from '@/components/layout/EditableContent';
import { 
  CTAButton, 
  TrustIndicators,
  SocialProofNumber 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface CenteredHeadlineCTAContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  urgency_text?: string;
  trust_items?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Ready to Transform Your Business?' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Join thousands of companies already using our platform to streamline operations and boost productivity.' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Your Free Trial Today' 
  },
  urgency_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: 'Free 14-day trial|No credit card required|Cancel anytime' 
  }
};

export default function CenteredHeadlineCTA(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<CenteredHeadlineCTAContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse trust indicators from pipe-separated string
  const trustItems = blockContent.trust_items 
    ? parsePipeData(blockContent.trust_items)
    : ['Free trial', 'No credit card', 'Cancel anytime'];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CenteredHeadlineCTA"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Optional Urgency Badge */}
        {(blockContent.urgency_text || mode === 'edit') && (
          <div className="mb-8">
            <EditableBadge
              mode={mode}
              value={blockContent.urgency_text || ''}
              onEdit={(value) => handleContentUpdate('urgency_text', value)}
              colorTokens={{ accent: 'bg-orange-100 text-orange-800 border-orange-300' }}
              textStyle={getTextStyle('body-sm')}
              placeholder="🔥 Limited Time: 50% Off First Month"
              className="animate-pulse"
              sectionId={sectionId}
              elementKey="urgency_text"
            />
          </div>
        )}

        {/* Main Headline */}
        <EditableHeadline
          mode={mode}
          value={blockContent.headline}
          onEdit={(value) => handleContentUpdate('headline', value)}
          level="h1"
          colorClass={colorTokens.textOnLight || colorTokens.textPrimary}
          textStyle={getTextStyle('hero')}
          className="leading-tight mb-6"
          sectionId={sectionId}
          elementKey="headline"
        />

        {/* Subheadline */}
        {(blockContent.subheadline || mode === 'edit') && (
          <EditableText
            mode={mode}
            value={blockContent.subheadline || ''}
            onEdit={(value) => handleContentUpdate('subheadline', value)}
            colorClass={colorTokens.textSecondary}
            textStyle={getTextStyle('body-lg')}
            className="max-w-3xl mx-auto leading-relaxed mb-8"
            placeholder="Add a compelling subheadline that reinforces your value proposition..."
            sectionId={sectionId}
            elementKey="subheadline"
          />
        )}

        {/* Primary CTA Button */}
        <div className="mb-8">
          <CTAButton
            text={blockContent.cta_text}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h3')}
            size="large"
            className="text-xl px-12 py-6 shadow-2xl hover:shadow-3xl"
            sectionId={sectionId}
            elementKey="cta_text"
          />
        </div>

        {/* Trust Indicators */}
        <div className="mb-8">
          <TrustIndicators 
            items={trustItems}
            colorClass={colorTokens.textMuted}
            iconColor="text-green-500"
          />
        </div>

        {/* Simple Social Proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12 pt-8 border-t border-gray-200">
          <SocialProofNumber
            number="10,000+"
            label="Happy customers"
            highlighted={true}
          />
          
          <div className="flex items-center space-x-1">
            {[1,2,3,4,5].map(i => (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className={`text-sm ${colorTokens.textMuted} ml-2`}>4.9/5 rating</span>
          </div>

          <SocialProofNumber
            number="SOC 2"
            label="Compliant"
          />
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'CenteredHeadlineCTA',
  category: 'CTA Sections',
  description: 'High-conversion centered CTA section with headline, urgency, and social proof',
  tags: ['cta', 'conversion', 'centered', 'headline'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  // Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'urgency_text', label: 'Urgency Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  // Usage examples
  useCases: [
    'Landing page final CTA',
    'Free trial conversion',
    'Newsletter signup CTA',
    'Contact form promotion'
  ]
};