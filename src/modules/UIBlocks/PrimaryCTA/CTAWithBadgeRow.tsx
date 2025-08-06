// components/layout/CTAWithBadgeRow.tsx
// Production-ready CTA with trust badges using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

// Content interface for type safety
interface CTAWithBadgeRowContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  trust_badges: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Ready to Transform Your Business?' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Join thousands of companies already saving time and increasing productivity with our platform.' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Free Trial' 
  },
  trust_badges: { 
    type: 'string' as const, 
    default: 'SOC 2 Compliant|GDPR Ready|99.9% Uptime|24/7 Support|Enterprise Security|ISO 27001' 
  }
};

// Trust Badge Component
const TrustBadge = React.memo(({ badge, index }: { badge: string, index: number }) => {
  const getIcon = (badgeText: string) => {
    const lower = badgeText.toLowerCase();
    
    if (lower.includes('soc') || lower.includes('compliance') || lower.includes('compliant')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    } else if (lower.includes('gdpr') || lower.includes('privacy')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    } else if (lower.includes('uptime') || lower.includes('99')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else if (lower.includes('support') || lower.includes('24/7')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 6v6m0 0v6m6-6H6" />
        </svg>
      );
    } else if (lower.includes('security') || lower.includes('iso')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    }
    
    // Default icon
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-800">
      {getIcon(badge)}
      <span className="text-sm font-medium whitespace-nowrap">{badge}</span>
    </div>
  );
});
TrustBadge.displayName = 'TrustBadge';

export default function CTAWithBadgeRow(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<CTAWithBadgeRowContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse trust badges from pipe-separated string
  const trustBadges = blockContent.trust_badges 
    ? blockContent.trust_badges.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CTAWithBadgeRow"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Main CTA Content */}
        <div className="mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {blockContent.subheadline && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-8 max-w-2xl mx-auto"
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          <CTAButton
            text={blockContent.cta_text}
            colorTokens={colorTokens}
            className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
            variant="primary"
            size="large"
            sectionId={sectionId}
            elementKey="cta_text"
            onClick={createCTAClickHandler(sectionId)}
          />
        </div>

        {/* Trust Badges Row */}
        <div className="flex flex-wrap justify-center gap-4 items-center">
          {trustBadges.map((badge, index) => (
            <TrustBadge key={index} badge={badge} index={index} />
          ))}
        </div>

        {/* Additional Trust Reinforcement */}
        <div className="mt-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                >
                  {i}
                </div>
              ))}
            </div>
            <span className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
              Trusted by 10,000+ businesses worldwide
            </span>
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'CTAWithBadgeRow',
  category: 'CTA Sections',
  description: 'Primary CTA with trust badges for conversion optimization',
  tags: ['cta', 'trust', 'badges', 'conversion', 'adaptive-colors'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  features: [
    'Automatic text color adaptation based on background type',
    'Trust badges with contextual icons',
    'Centered CTA design for maximum impact',
    'Social proof elements',
    'Responsive badge layout'
  ],
  
  contentFields: [
    { key: 'headline', label: 'CTA Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'Button Text', type: 'text', required: true },
    { key: 'trust_badges', label: 'Trust Badges (pipe separated)', type: 'textarea', required: true }
  ],
  
  useCases: [
    'Final conversion section',
    'Trust-focused CTA',
    'Enterprise landing pages',
    'Compliance-heavy industries'
  ]
};