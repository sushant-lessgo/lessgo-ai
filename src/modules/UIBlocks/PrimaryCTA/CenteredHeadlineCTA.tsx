// components/layout/CenteredHeadlineCTA.tsx
// Production-ready centered CTA section using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText,
  EditableBadge 
} from '@/components/layout/EditableContent';
import { 
  CTAButton, 
  TrustIndicators,
  SocialProofNumber 
} from '@/components/layout/ComponentRegistry';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData } from '@/utils/dataParsingUtils';
import { createCTAClickHandler } from '@/utils/ctaHandler';

// Content interface for type safety
interface CenteredHeadlineCTAContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  urgency_text?: string;
  trust_items?: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
  customer_count?: string;
  customer_label?: string;
  rating_stat?: string;
  uptime_stat?: string;
  uptime_label?: string;
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
  },
  trust_item_1: { 
    type: 'string' as const, 
    default: 'Free 14-day trial' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'No credit card required' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: 'Cancel anytime' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_item_5: { 
    type: 'string' as const, 
    default: '' 
  },
  customer_count: { 
    type: 'string' as const, 
    default: '10,000+' 
  },
  customer_label: { 
    type: 'string' as const, 
    default: 'Happy customers' 
  },
  rating_stat: { 
    type: 'string' as const, 
    default: '4.8/5 stars' 
  },
  uptime_stat: { 
    type: 'string' as const, 
    default: '99.9% uptime' 
  },
  uptime_label: { 
    type: 'string' as const, 
    default: 'SOC 2 Compliant' 
  }
};

export default function CenteredHeadlineCTA(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<CenteredHeadlineCTAContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  // Handle trust items - support both legacy pipe-separated format and individual fields
  const getTrustItems = (): string[] => {
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2, 
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    return blockContent.trust_items 
      ? parsePipeData(blockContent.trust_items)
      : ['Free trial', 'No credit card', 'Cancel anytime'];
  };
  
  const trustItems = getTrustItems();

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CenteredHeadlineCTA"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
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
              placeholder="🔥 Limited Time: 50% Off First Month"
              className="animate-pulse"
              sectionId={sectionId}
              elementKey="urgency_text"
            />
          </div>
        )}

        {/* Main Headline */}
        <EditableAdaptiveHeadline
          mode={mode}
          value={blockContent.headline || ''}
          onEdit={(value) => handleContentUpdate('headline', value)}
          level="h1"
          backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
          colorTokens={colorTokens}
          textStyle={{
            ...getTextStyle('hero'),
            textAlign: 'center'
          }}
          className="leading-tight mb-6"
          sectionId={sectionId}
          elementKey="headline"
          sectionBackground={sectionBackground}
        />

        {/* Subheadline */}
        {(blockContent.subheadline || mode === 'edit') && (
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.subheadline || ''}
            onEdit={(value) => handleContentUpdate('subheadline', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{
              ...getTextStyle('body-lg'),
              textAlign: 'center'
            }}
            className="max-w-3xl mx-auto leading-relaxed mb-8"
            placeholder="Add a compelling subheadline that reinforces your value proposition..."
            sectionId={sectionId}
            elementKey="subheadline"
            sectionBackground={sectionBackground}
          />
        )}

        {/* Primary CTA Button */}
        <div className="mb-8">
          <CTAButton
            text={blockContent.cta_text}
            colorTokens={colorTokens}
            size="large"
            className="text-xl px-12 py-6 shadow-2xl hover:shadow-3xl"
            sectionId={sectionId}
            elementKey="cta_text"
            onClick={createCTAClickHandler(sectionId, "cta_text")}
          />
        </div>

        {/* Trust Indicators */}
        {(trustItems.length > 0 || mode === 'edit') && (
          <div className="mb-8">
            {mode !== 'preview' ? (
              <EditableTrustIndicators
                mode={mode}
                trustItems={[
                  blockContent.trust_item_1 || '',
                  blockContent.trust_item_2 || '',
                  blockContent.trust_item_3 || '',
                  blockContent.trust_item_4 || '',
                  blockContent.trust_item_5 || ''
                ]}
                onTrustItemChange={(index, value) => {
                  const fieldKey = `trust_item_${index + 1}` as keyof CenteredHeadlineCTAContent;
                  handleContentUpdate(fieldKey, value);
                }}
                onAddTrustItem={() => {
                  const emptyIndex = [
                    blockContent.trust_item_1,
                    blockContent.trust_item_2,
                    blockContent.trust_item_3,
                    blockContent.trust_item_4,
                    blockContent.trust_item_5
                  ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                  
                  if (emptyIndex !== -1) {
                    const fieldKey = `trust_item_${emptyIndex + 1}` as keyof CenteredHeadlineCTAContent;
                    handleContentUpdate(fieldKey, 'New trust item');
                  }
                }}
                onRemoveTrustItem={(index) => {
                  const fieldKey = `trust_item_${index + 1}` as keyof CenteredHeadlineCTAContent;
                  handleContentUpdate(fieldKey, '___REMOVED___');
                }}
                colorTokens={colorTokens}
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                iconColor="text-green-500"
                colorClass={colorTokens.textMuted}
              />
            ) : (
              <TrustIndicators 
                items={trustItems}
                colorClass={colorTokens.textMuted}
                iconColor="text-green-500"
              />
            )}
          </div>
        )}

        {/* Simple Social Proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12 pt-8 border-t border-gray-200">
          {(blockContent.customer_count || mode === 'edit') && (
            <div className="text-center relative group/customer-item">
              {mode !== 'preview' ? (
                <div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.customer_count || '10,000+'}
                    onEdit={(value) => handleContentUpdate('customer_count', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-3xl font-bold"
                    placeholder="10,000+"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="customer_count"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.customer_label || 'Happy customers'}
                    onEdit={(value) => handleContentUpdate('customer_label', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-sm ${colorTokens.textMuted} mt-1`}
                    placeholder="Happy customers"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="customer_label"
                  />
                  
                  {/* Remove button for customer count */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('customer_count', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/customer-item:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove customer count"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <SocialProofNumber
                  number={blockContent.customer_count || "10,000+"}
                  label={blockContent.customer_label || "Happy customers"}
                  highlighted={true}
                />
              )}
            </div>
          )}
          
          {(blockContent.rating_stat || mode === 'edit') && blockContent.rating_stat !== '___REMOVED___' && (
            <div className="relative group/rating-item">
              {mode !== 'preview' ? (
                <div className="flex items-center space-x-1">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.rating_stat || '4.8/5 stars'}
                    onEdit={(value) => handleContentUpdate('rating_stat', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-sm ${colorTokens.textMuted} ml-2`}
                    placeholder="4.8/5 stars"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="rating_stat"
                  />
                  
                  {/* Remove button for rating */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('rating_stat', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/rating-item:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove rating"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className={`text-sm ${colorTokens.textMuted} ml-2`}>{blockContent.rating_stat || '4.8/5 stars'}</span>
                </div>
              )}
            </div>
          )}

          {(blockContent.uptime_stat || mode === 'edit') && blockContent.uptime_stat !== '___REMOVED___' && (
            <div className="text-center relative group/uptime-item">
              {mode !== 'preview' ? (
                <div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.uptime_stat || '99.9% uptime'}
                    onEdit={(value) => handleContentUpdate('uptime_stat', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-3xl font-bold"
                    placeholder="99.9% uptime"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="uptime_stat"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.uptime_label || 'SOC 2 Compliant'}
                    onEdit={(value) => handleContentUpdate('uptime_label', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-sm ${colorTokens.textMuted} mt-1`}
                    placeholder="SOC 2 Compliant"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="uptime_label"
                  />
                  
                  {/* Remove button for uptime */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('uptime_stat', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/uptime-item:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove uptime stat"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <SocialProofNumber
                  number={blockContent.uptime_stat || "99.9% uptime"}
                  label={blockContent.uptime_label || "SOC 2 Compliant"}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'CenteredHeadlineCTA',
  category: 'CTA Sections',
  description: 'High-conversion centered CTA section with adaptive text colors and social proof',
  tags: ['cta', 'conversion', 'centered', 'headline', 'adaptive-colors'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  // ✅ ENHANCED: Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'urgency_text', label: 'Urgency Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'trust_item_1', label: 'Trust Item 1', type: 'text', required: false },
    { key: 'trust_item_2', label: 'Trust Item 2', type: 'text', required: false },
    { key: 'trust_item_3', label: 'Trust Item 3', type: 'text', required: false },
    { key: 'trust_item_4', label: 'Trust Item 4', type: 'text', required: false },
    { key: 'trust_item_5', label: 'Trust Item 5', type: 'text', required: false },
    { key: 'customer_count', label: 'Customer Count', type: 'text', required: false },
    { key: 'customer_label', label: 'Customer Count Label', type: 'text', required: false },
    { key: 'rating_stat', label: 'Rating Statistic', type: 'text', required: false },
    { key: 'uptime_stat', label: 'Uptime Statistic', type: 'text', required: false },
    { key: 'uptime_label', label: 'Uptime Label', type: 'text', required: false }
  ],
  
  // ✅ NEW: Enhanced features
  features: [
    'Automatic text color adaptation based on background type',
    'High-conversion centered layout design',
    'Social proof and trust indicators',
    'Urgency messaging support',
    'Professional CTA button styling',
    'Star ratings and compliance badges'
  ],
  
  // Usage examples
  useCases: [
    'Landing page final CTA on dark gradients',
    'Free trial conversion with light backgrounds',
    'Newsletter signup CTA on brand colors',
    'Contact form promotion with adaptive styling'
  ]
};