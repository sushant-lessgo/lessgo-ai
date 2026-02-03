// components/layout/LeftCopyRightImage.tsx - ENHANCED with Dynamic Text Colors
// Production-ready hero component using abstraction system with background-aware text colors

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText, 
  AccentBadge 
} from '@/components/layout/EditableContent';
import {
  CTAButton,
  TrustIndicators
} from '@/components/layout/ComponentRegistry';
import { FormConnectedButton } from '@/components/forms/FormConnectedButton';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';
// V2: Legacy parsing utils no longer needed - using clean arrays

// V2 Content interface - uses clean arrays
interface TrustItem {
  id: string;
  text: string;
}

interface CustomerAvatar {
  id: string;
  name: string;
  avatar_url?: string;
}

interface LeftCopyRightImageContent {
  headline: string;
  cta_text: string;
  secondary_cta_text?: string;
  subheadline?: string;
  supporting_text?: string;
  badge_text?: string;
  hero_image?: string;
  customer_count?: string;
  rating_value?: string;
  rating_count?: string;
  show_social_proof?: boolean;
  show_customer_avatars?: boolean;
  // V2: Clean arrays
  trust_items?: TrustItem[];
  customer_avatars?: CustomerAvatar[];
}

// V2 Content schema - uses clean arrays
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Transform Your Business with Smart Automation'
  },
  cta_text: {
    type: 'string' as const,
    default: 'Start Free Trial'
  },
  secondary_cta_text: {
    type: 'string' as const,
    default: 'Watch Demo'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Streamline workflows, boost productivity, and scale effortlessly with our intelligent automation platform.'
  },
  supporting_text: {
    type: 'string' as const,
    default: 'Save 20+ hours per week with automated workflows that just work.'
  },
  badge_text: {
    type: 'string' as const,
    default: ''
  },
  hero_image: {
    type: 'string' as const,
    default: '/hero-placeholder.jpg'
  },
  customer_count: {
    type: 'string' as const,
    default: '500+ happy customers'
  },
  rating_value: {
    type: 'string' as const,
    default: '4.9/5'
  },
  rating_count: {
    type: 'string' as const,
    default: 'from 127 reviews'
  },
  show_social_proof: {
    type: 'boolean' as const,
    default: true
  },
  show_customer_avatars: {
    type: 'boolean' as const,
    default: true
  },
  // V2: Optional arrays - empty by default (only exist if AI generated or user added)
  trust_items: {
    type: 'array' as const,
    default: []
  },
  customer_avatars: {
    type: 'array' as const,
    default: []
  }
};

// Enhanced Hero Image Component (unchanged from original)
const HeroImagePlaceholder = React.memo(() => (
  <div className="relative w-full h-full min-h-[500px] lg:min-h-[600px]">
    {/* Main container with fixed gradient classes */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 rounded-2xl shadow-2xl overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
      
      {/* Dashboard mockup container */}
      <div className="absolute top-6 left-6 right-6 bottom-6 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transform -rotate-1">
        
        {/* Browser chrome */}
        <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center px-6">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="ml-6 flex-1 flex items-center">
            <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-500 border">
              dashboard.yourapp.com
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
          
          {/* Header stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            
            {/* Blue stat card */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="w-10 h-10 bg-blue-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">2.4k</div>
              <div className="text-xs text-gray-600 mb-1">Active Users</div>
              <div className="text-xs text-blue-600 font-medium">+12%</div>
            </div>

            {/* Green stat card */}
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-emerald-900 mb-1">$45k</div>
              <div className="text-xs text-gray-600 mb-1">Revenue</div>
              <div className="text-xs text-emerald-600 font-medium">+8%</div>
            </div>

            {/* Purple stat card */}
            <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
              <div className="w-10 h-10 bg-violet-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-violet-900 mb-1">98.2%</div>
              <div className="text-xs text-gray-600 mb-1">Uptime</div>
              <div className="text-xs text-violet-600 font-medium">+0.1%</div>
            </div>
          </div>

          {/* Main chart area */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Performance Overview</h3>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
            
            {/* Chart bars */}
            <div className="flex items-end justify-between h-32 space-x-2">
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-20"></div>
                <div className="text-xs text-gray-400">1</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-24"></div>
                <div className="text-xs text-gray-400">2</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-16"></div>
                <div className="text-xs text-gray-400">3</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-28"></div>
                <div className="text-xs text-gray-400">4</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-20"></div>
                <div className="text-xs text-gray-400">5</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-32"></div>
                <div className="text-xs text-gray-400">6</div>
              </div>
            </div>
          </div>

          {/* Bottom activity list */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">🚀</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">New workflow deployed</div>
                <div className="text-xs text-gray-500">2 min ago</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">📊</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Report generated</div>
                <div className="text-xs text-gray-500">5 min ago</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">⚡</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Automation triggered</div>
                <div className="text-xs text-gray-500">8 min ago</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements for visual interest */}
      <div className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center animate-pulse">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className="absolute bottom-8 left-8 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg flex items-center justify-center animate-bounce">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  </div>
));
HeroImagePlaceholder.displayName = 'HeroImagePlaceholder';

export default function LeftCopyRightImage(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  const { content } = useEditStore();

  // ✅ ENHANCED: Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens, // ✅ Now includes dynamic text colors
    dynamicTextColors, // ✅ NEW: Direct access to background-aware colors
    getTextStyle,
    sectionBackground,
    backgroundType, // ✅ NEW: Background type passed from hook
    handleContentUpdate
  } = useLayoutComponent<LeftCopyRightImageContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA as any  // V2: Schema now includes arrays
  });
  
  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');


  // V2: Direct array access - no legacy parsing needed
  const trustItems = blockContent.trust_items || [];
  const customerAvatars = blockContent.customer_avatars || [];

  // Muted text color for trust indicators
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Handle avatar URL updates (V2: update array item directly)
  const handleAvatarChange = (avatarId: string, avatarUrl: string) => {
    const updatedAvatars = customerAvatars.map(avatar =>
      avatar.id === avatarId ? { ...avatar, avatar_url: avatarUrl } : avatar
    );
    (handleContentUpdate as any)('customer_avatars', updatedAvatars);
  };

  // Parse rating for dynamic stars
  const parseRating = (rating: string) => {
    const match = rating?.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const renderStars = (rating: string) => {
    const ratingNum = parseRating(rating);
    const stars = [];
    
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(ratingNum)) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    
    return <>{stars}</>;
  };

  
  // Use robust image toolbar hook
  const handleImageToolbar = useImageToolbar();
  

  //   backgroundType: props.backgroundType,
  //   backgroundCSS: sectionBackground,
  //   headingColor: dynamicTextColors?.heading,
  //   bodyColor: dynamicTextColors?.body,
  //   mutedColor: dynamicTextColors?.muted,
  //   ctaColors: {
  //     bg: colorTokens.ctaBg,
  //     hover: colorTokens.ctaHover,
  //     text: colorTokens.ctaText
  //   }
  // });

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LeftCopyRightImage"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={`${props.className || ''} overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch h-[clamp(600px,85vh,900px)]">
          
          {/* Left Column - Copy Content */}
          <div className="order-2 lg:order-1 max-w-xl flex flex-col justify-center">

            {/* V2: Optional Badge with Accent Colors */}
            {blockContent.badge_text && blockContent.badge_text.trim() !== '' && (
              <div className="mb-4">
                <AccentBadge
                  mode={mode}
                  value={blockContent.badge_text}
                  onEdit={(value) => handleContentUpdate('badge_text', value)}
                  colorTokens={colorTokens}
                  placeholder="🎉 New Feature Launch"
                  sectionId={sectionId}
                  elementKey="badge_text"
                  sectionBackground={sectionBackground}
                />
              </div>
            )}

            {/* Main Headline */}
            <div className="mb-4">
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.headline || ''}
                onEdit={(value) => handleContentUpdate('headline', value)}
                level="h1"
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                className="leading-tight"
                sectionId={sectionId}
                elementKey="headline"
                sectionBackground={sectionBackground}
              />
            </div>

            {/* Subheadline */}
            {(blockContent.subheadline || mode === 'edit') && (
              <div className="mb-3">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.subheadline || ''}
                  onEdit={(value) => handleContentUpdate('subheadline', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="leading-relaxed"
                  style={bodyLgStyle}
                  placeholder="Add a compelling subheadline that supports your main message and explains the key benefit..."
                  sectionId={sectionId}
                  elementKey="subheadline"
                  sectionBackground={sectionBackground}
                />
              </div>
            )}

            {/* Supporting Text - smaller and lighter for hierarchy */}
            {(blockContent.supporting_text || mode === 'edit') && (
              <div className="mb-8">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.supporting_text || ''}
                  onEdit={(value) => handleContentUpdate('supporting_text', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="leading-relaxed text-sm opacity-75"
                  placeholder="Add supporting text with social proof, customer count, or key metrics..."
                  sectionId={sectionId}
                  elementKey="supporting_text"
                  sectionBackground={sectionBackground}
                />
              </div>
            )}

            {/* CTA Section - buttons and trust indicators separated */}
            {(() => {
              const buttonConfig = content[sectionId]?.elements?.cta_text?.metadata?.buttonConfig;
              const isInlineForm = buttonConfig?.type === 'form';

              return (
                <div className="flex flex-col gap-6">
                  {/* CTA Buttons Row */}
                  <div className={isInlineForm ? "flex flex-col gap-4" : "flex flex-col sm:flex-row items-start sm:items-center gap-4"}>
                    {/* Primary CTA Button */}
                    {(() => {
                      const primaryClassName = "shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200";

                      if (buttonConfig?.type === 'form') {
                        return (
                          <FormConnectedButton
                            buttonConfig={buttonConfig}
                            sectionId={sectionId}
                            size="large"
                            variant="primary"
                            colorTokens={colorTokens}
                            className={primaryClassName}
                          >
                            {blockContent.cta_text}
                          </FormConnectedButton>
                        );
                      } else {
                        return (
                          <CTAButton
                            text={blockContent.cta_text}
                            colorTokens={colorTokens}
                            className={primaryClassName}
                            variant="primary"
                            sectionId={sectionId}
                            elementKey="cta_text"
                            onClick={createCTAClickHandler(sectionId, "cta_text")}
                          />
                        );
                      }
                    })()}

                    {/* Secondary CTA */}
                    {(blockContent.secondary_cta_text && blockContent.secondary_cta_text.trim() !== '') && (() => {
                      const secondaryButtonConfig = content[sectionId]?.elements?.secondary_cta_text?.metadata?.buttonConfig;
                      const secondaryClassName = "shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200";

                      if (secondaryButtonConfig?.type === 'form') {
                        return (
                          <FormConnectedButton
                            buttonConfig={{ ...secondaryButtonConfig, ctaType: 'secondary' }}
                            sectionId={sectionId}
                            size="large"
                            variant="secondary"
                            colorTokens={colorTokens}
                            className={secondaryClassName}
                          >
                            {blockContent.secondary_cta_text || 'Watch Demo'}
                          </FormConnectedButton>
                        );
                      } else {
                        return (
                          <CTAButton
                            text={blockContent.secondary_cta_text || 'Watch Demo'}
                            colorTokens={colorTokens}
                            className={secondaryClassName}
                            variant="secondary"
                            sectionId={sectionId}
                            elementKey="secondary_cta_text"
                            onClick={createCTAClickHandler(sectionId, "secondary_cta_text")}
                          />
                        );
                      }
                    })()}
                  </div>

                  {/* Trust Indicators - separate row below CTAs */}
                  {mode !== 'preview' ? (
                    <EditableTrustIndicators
                      mode={mode}
                      trustItems={trustItems.map(item => item.text)}
                      onTrustItemChange={(index, value) => {
                        const updatedItems = trustItems.map((item, i) =>
                          i === index ? { ...item, text: value } : item
                        );
                        (handleContentUpdate as any)('trust_items', updatedItems);
                      }}
                      onAddTrustItem={() => {
                        if (trustItems.length < 5) {
                          const newItem: TrustItem = {
                            id: `t${Date.now()}`,
                            text: 'New trust item'
                          };
                          (handleContentUpdate as any)('trust_items', [...trustItems, newItem]);
                        }
                      }}
                      onRemoveTrustItem={(index) => {
                        const updatedItems = trustItems.filter((_, i) => i !== index);
                        (handleContentUpdate as any)('trust_items', updatedItems);
                      }}
                      colorTokens={colorTokens}
                      sectionBackground={sectionBackground}
                      sectionId={sectionId}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      iconColor="text-green-500"
                      colorClass={mutedTextColor}
                    />
                  ) : (
                    <TrustIndicators
                      items={trustItems.map(item => item.text)}
                      colorClass={mutedTextColor}
                      iconColor="text-green-500"
                    />
                  )}
                </div>
              );
            })()}

            {/* V2: Social Proof Section */}
            {(blockContent.show_social_proof !== false) && (
              <div className="flex items-center space-x-6 pt-4">
                {blockContent.customer_count && (
                  <div className="relative group/customer-count flex items-center space-x-2">
                    {blockContent.show_customer_avatars !== false && customerAvatars.length > 0 && (
                      <div className="flex -space-x-2">
                        {customerAvatars.map((customer) => (
                          <AvatarEditableComponent
                            key={customer.id}
                            mode={mode}
                            avatarUrl={customer.avatar_url || ''}
                            onAvatarChange={(url) => handleAvatarChange(customer.id, url)}
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
                      placeholder="500+ happy customers"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="customer_count"
                    />

                    {/* Remove button for customer count */}
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('customer_count', '');
                        }}
                        className="opacity-0 group-hover/customer-count:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove customer count"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {/* V2: Rating section - no ___REMOVED___ markers */}
                {blockContent.rating_value && (
                  <div className="relative group/rating-section flex items-center space-x-1">
                    {renderStars(blockContent.rating_value)}
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.rating_value || ''}
                      onEdit={(value) => handleContentUpdate('rating_value', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm ml-2"
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
                      placeholder="from 127 reviews"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="rating_count"
                    />

                    {/* Remove button for rating section */}
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('rating_value', '');
                          handleContentUpdate('rating_count', '');
                        }}
                        className="opacity-0 group-hover/rating-section:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
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

          {/* Right Column - Hero Image */}
          <div className="order-1 lg:order-2">
            {/* Show actual image (either uploaded or default) */}
            {(() => {
              // Check if hero_image is a valid URL or path
              const imageValue = blockContent.hero_image || '';
              const isValidImagePath = imageValue.startsWith('/') ||
                                      imageValue.startsWith('http://') ||
                                      imageValue.startsWith('https://') ||
                                      imageValue.startsWith('blob:') ||
                                      imageValue.startsWith('data:') ||
                                      imageValue === '';

              // Use placeholder if it's descriptive text from AI or empty
              const imageSrc = isValidImagePath && imageValue !== '' ? imageValue : '/hero-placeholder.jpg';

              return imageSrc ? (
                <div className="relative w-full h-full overflow-hidden">
                  {/* Decorative gradient blob behind image - uses theme accent color */}
                  <div
                    className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
                    style={{
                      background: `linear-gradient(135deg, ${colorTokens.accent}40 0%, transparent 50%, ${colorTokens.accent}20 100%)`
                    }}
                  />
                  <img
                    src={imageSrc}
                    alt="Hero"
                    className="absolute inset-0 z-10 w-full h-full object-cover rounded-2xl shadow-2xl cursor-pointer"
                    data-image-id={`${sectionId}-hero-image`}
                    onMouseUp={(e) => {
                      if (mode !== 'preview') {
                        e.stopPropagation();
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleImageToolbar(`${sectionId}-hero-image`, {
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }
                    }}
                    onClick={(e) => {
                      if (mode !== 'preview') {
                        e.stopPropagation();
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
            ) : (
              <HeroImagePlaceholder />
            );
          })()}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'LeftCopyRightImage',
  category: 'Hero Sections',
  description: 'Hero section with copy on left and product image/demo on right. Automatically adapts text colors to background.',
  tags: ['hero', 'cta', 'image', 'conversion', 'adaptive-colors'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  // V2: Schema for component generation tools - uses clean arrays
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'secondary_cta_text', label: 'Secondary CTA Button Text', type: 'text', required: false },
    { key: 'badge_text', label: 'Badge Text (uses accent colors)', type: 'text', required: false },
    { key: 'hero_image', label: 'Hero Image', type: 'image', required: false },
    { key: 'customer_count', label: 'Customer Count', type: 'text', required: false },
    { key: 'rating_value', label: 'Rating (e.g., 4.9/5)', type: 'text', required: false },
    { key: 'rating_count', label: 'Review Count (e.g., from 127 reviews)', type: 'text', required: false },
    { key: 'show_social_proof', label: 'Show Social Proof', type: 'boolean', required: false },
    { key: 'show_customer_avatars', label: 'Show Customer Avatars', type: 'boolean', required: false },
    // V2: Arrays - not editable via simple form, use inline editing
    { key: 'trust_items', label: 'Trust Items (array)', type: 'array', required: false },
    { key: 'customer_avatars', label: 'Customer Avatars (array)', type: 'array', required: false }
  ],
  
  // ✅ NEW: Enhanced features
  features: [
    'Automatic text color adaptation based on background type',
    'CTA buttons use generated accent colors from design system',
    'Badge component uses brand accent colors',
    'Trust indicators adapt to background contrast',
    'Responsive design with mobile-first approach',
    'Editable customer avatars with photo upload and fallback initials',
    'Dynamic avatar system supports unlimited customers with JSON storage'
  ],
  
  // Usage examples
  useCases: [
    'Product launch hero with dark gradient background',
    'SaaS landing page header with light background', 
    'App introduction section with secondary background',
    'Service overview hero with brand accent highlights',
    'Feature announcement with accent-colored badges'
  ]
};