// components/layout/CTAWithBadgeRow.tsx
// Production-ready CTA with trust badges using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';
import { 
  parseCustomerAvatarData, 
  getCustomerAvatarUrl, 
  updateAvatarUrls,
  parsePipeData 
} from '@/utils/dataParsingUtils';

// Content interface for type safety
interface CTAWithBadgeRowContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  trust_badges: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
  customer_count?: string;
  rating_value?: string;
  rating_count?: string;
  show_social_proof?: boolean;
  show_customer_avatars?: boolean;
  avatar_count?: number;
  // Dynamic avatar system
  customer_names?: string;
  avatar_urls?: string;
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
  },
  trust_item_1: { 
    type: 'string' as const, 
    default: 'SOC 2 Compliant' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'GDPR Ready' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: '99.9% Uptime' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: '24/7 Support' 
  },
  trust_item_5: { 
    type: 'string' as const, 
    default: '' 
  },
  customer_count: { 
    type: 'string' as const, 
    default: '10,000+ businesses worldwide' 
  },
  rating_value: { 
    type: 'string' as const, 
    default: '4.9/5' 
  },
  rating_count: { 
    type: 'string' as const, 
    default: 'from 2,847 reviews' 
  },
  show_social_proof: { 
    type: 'boolean' as const, 
    default: true 
  },
  show_customer_avatars: { 
    type: 'boolean' as const, 
    default: true 
  },
  avatar_count: { 
    type: 'number' as const, 
    default: 4 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Sarah Chen|Alex Rivera|Jordan Kim|Maya Patel' 
  },
  avatar_urls: { 
    type: 'string' as const, 
    default: '{}' 
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
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  // Handle trust items - support both legacy pipe-separated format and individual fields
  const getTrustItems = (): string[] => {
    // Check if individual trust item fields exist
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2, 
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // If individual items exist, use them; otherwise fall back to legacy format
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    // Legacy format fallback
    return blockContent.trust_badges 
      ? blockContent.trust_badges.split('|').map(item => item.trim()).filter(Boolean)
      : ['SOC 2 Compliant', 'GDPR Ready', '99.9% Uptime'];
  };
  
  const trustItems = getTrustItems();
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Handle customer avatars - support both legacy avatar_count and new dynamic system
  const getCustomerAvatars = (): { name: string; avatarUrl: string }[] => {
    // If customer_names exists, use dynamic system
    if (blockContent.customer_names) {
      const customerData = parseCustomerAvatarData(
        blockContent.customer_names, 
        blockContent.avatar_urls || '{}'
      );
      return customerData.map(customer => ({
        name: customer.name,
        avatarUrl: customer.avatarUrl || ''
      }));
    }
    
    // Fallback to legacy system with generic names
    const avatarCount = blockContent.avatar_count || 4;
    const defaultNames = ['Sarah Chen', 'Alex Rivera', 'Jordan Kim', 'Maya Patel', 'Casey Martinez', 'Taylor Wright'];
    return Array.from({ length: Math.min(avatarCount, 6) }, (_, i) => ({
      name: defaultNames[i] || `Customer ${i + 1}`,
      avatarUrl: ''
    }));
  };

  const customerAvatars = getCustomerAvatars();

  // Handle avatar URL updates
  const handleAvatarChange = (customerName: string, avatarUrl: string) => {
    const updatedAvatarUrls = updateAvatarUrls(blockContent.avatar_urls || '{}', customerName, avatarUrl);
    handleContentUpdate('avatar_urls', updatedAvatarUrls);
  };

  // Parse rating for dynamic stars
  const parseRating = (rating: string) => {
    const match = rating?.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const renderStars = (rating: string) => {
    const ratingNum = parseRating(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = (ratingNum % 1) >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <>
        {Array.from({ length: fullStars }, (_, i) => (
          <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        {Array.from({ length: emptyStars }, (_, i) => (
          <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </>
    );
  };

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
            onClick={createCTAClickHandler(sectionId, "cta_text")}
          />
        </div>

        {/* Trust Indicators */}
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
                const fieldKey = `trust_item_${index + 1}` as keyof CTAWithBadgeRowContent;
                handleContentUpdate(fieldKey, value);
              }}
              onAddTrustItem={() => {
                // Find first empty slot and add placeholder
                const emptyIndex = [
                  blockContent.trust_item_1,
                  blockContent.trust_item_2,
                  blockContent.trust_item_3,
                  blockContent.trust_item_4,
                  blockContent.trust_item_5
                ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                
                if (emptyIndex !== -1) {
                  const fieldKey = `trust_item_${emptyIndex + 1}` as keyof CTAWithBadgeRowContent;
                  handleContentUpdate(fieldKey, 'New trust badge');
                }
              }}
              onRemoveTrustItem={(index) => {
                const fieldKey = `trust_item_${index + 1}` as keyof CTAWithBadgeRowContent;
                handleContentUpdate(fieldKey, '___REMOVED___');
              }}
              colorTokens={colorTokens}
              sectionBackground={sectionBackground}
              sectionId={sectionId}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              iconColor="text-green-500"
              colorClass={mutedTextColor}
            />
          ) : (
            <div className="flex flex-wrap justify-center gap-4 items-center">
              {trustItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium whitespace-nowrap">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social Proof Section */}
        {(blockContent.show_social_proof !== false) && (
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
            {blockContent.customer_count && blockContent.customer_count !== '___REMOVED___' && (
              <div className="flex items-center space-x-2 relative group/customer-item">
                {blockContent.show_customer_avatars !== false && (
                  <div className="flex -space-x-2">
                    {customerAvatars.map((customer, i) => (
                      <AvatarEditableComponent
                        key={customer.name}
                        mode={mode}
                        avatarUrl={customer.avatarUrl}
                        onAvatarChange={(url) => handleAvatarChange(customer.name, url)}
                        customerName={customer.name}
                        size="sm"
                        className="cursor-default"
                      />
                    ))}
                  </div>
                )}
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_count || ''}
                  onEdit={(value) => handleContentUpdate('customer_count', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm"
                  placeholder="10,000+ businesses worldwide"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="customer_count"
                />
                
                {/* Remove button for customer count */}
                {mode !== 'preview' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('customer_count', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/customer-item:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove customer count"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            
            {blockContent.rating_value && blockContent.rating_value !== '___REMOVED___' && (
              <div className="relative group/rating-item flex items-center space-x-1">
                {renderStars(blockContent.rating_value)}
                <div className="flex items-center space-x-1 ml-2">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.rating_value || ''}
                    onEdit={(value) => handleContentUpdate('rating_value', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm"
                    placeholder="4.9/5"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="rating_value"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.rating_count || ''}
                    onEdit={(value) => handleContentUpdate('rating_count', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm"
                    placeholder="from 2,847 reviews"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="rating_count"
                  />
                </div>
                
                {/* Remove button for rating section */}
                {mode !== 'preview' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('rating_value', '___REMOVED___');
                      handleContentUpdate('rating_count', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/rating-item:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove rating section"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

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
    { key: 'trust_badges', label: 'Trust Badges (pipe separated)', type: 'textarea', required: false },
    { key: 'trust_item_1', label: 'Trust Badge 1', type: 'text', required: false },
    { key: 'trust_item_2', label: 'Trust Badge 2', type: 'text', required: false },
    { key: 'trust_item_3', label: 'Trust Badge 3', type: 'text', required: false },
    { key: 'trust_item_4', label: 'Trust Badge 4', type: 'text', required: false },
    { key: 'trust_item_5', label: 'Trust Badge 5', type: 'text', required: false },
    { key: 'customer_count', label: 'Customer Count', type: 'text', required: false },
    { key: 'rating_value', label: 'Rating (e.g., 4.9/5)', type: 'text', required: false },
    { key: 'rating_count', label: 'Review Count (e.g., from 2,847 reviews)', type: 'text', required: false },
    { key: 'show_social_proof', label: 'Show Social Proof', type: 'boolean', required: false },
    { key: 'show_customer_avatars', label: 'Show Customer Avatars', type: 'boolean', required: false },
    { key: 'avatar_count', label: 'Number of Avatars (1-6) - Legacy', type: 'number', required: false },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: false },
    { key: 'avatar_urls', label: 'Avatar URLs (JSON format)', type: 'text', required: false }
  ],
  
  useCases: [
    'Final conversion section',
    'Trust-focused CTA',
    'Enterprise landing pages',
    'Compliance-heavy industries'
  ]
};