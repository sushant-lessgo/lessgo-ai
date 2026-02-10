import React, { useMemo } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { getUIBlockSpacing, RESPONSIVE_GAP, RESPONSIVE_PADDING } from '@/config/spacingConfig';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText, 
  AccentBadge 
} from '@/components/layout/EditableContent';
import {
  CTAButton,
  CTAButtonWithInput,
  TrustIndicators
} from '@/components/layout/ComponentRegistry';
import { FormConnectedButton } from '@/components/forms/FormConnectedButton';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';
import { logger } from '@/lib/logger';
// V2: No legacy parsing imports needed - using clean arrays

// V2: Clean array types - no pipe-separated strings
interface SplitScreenContent {
  headline: string;
  cta_text: string;
  secondary_cta_text?: string;
  subheadline?: string;
  supporting_text?: string;
  badge_text?: string;
  value_proposition?: string;
  split_hero_image?: string;
  customer_count?: string;
  rating_value?: string;
  rating_count?: string;
  show_social_proof?: boolean;
  show_customer_avatars?: boolean;
  // V2: Clean arrays
  trust_items?: Array<{ id: string; text: string }>;
  customer_avatars?: Array<{ id: string; name: string; avatar_url?: string }>;
}

// V2: Clean schema with arrays - no pipe-separated strings
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
  value_proposition: {
    type: 'string' as const,
    default: ''
  },
  split_hero_image: {
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
  // V2: Clean arrays
  trust_items: {
    type: 'array' as const,
    default: []
  },
  customer_avatars: {
    type: 'array' as const,
    default: []
  }
};

const HeroImagePlaceholder = React.memo(() => (
  <div className="relative w-full h-full min-h-[700px]">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 rounded-2xl shadow-2xl overflow-hidden">
      
      <div className="absolute top-6 left-6 right-6 bottom-6 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
        
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

        <div className="p-6 bg-gradient-to-br from-gray-50 to-white h-full">
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="w-10 h-10 bg-blue-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">2.4k</div>
              <div className="text-xs text-gray-600 mb-1">Active Users</div>
              <div className="text-xs text-blue-600 font-medium">+12%</div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-emerald-900 mb-1">$45k</div>
              <div className="text-xs text-gray-600 mb-1">Revenue</div>
              <div className="text-xs text-emerald-600 font-medium">+8%</div>
            </div>

            <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
              <div className="w-10 h-10 bg-violet-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-violet-900 mb-1">98.2%</div>
              <div className="text-xs text-gray-600 mb-1">Uptime</div>
              <div className="text-xs text-violet-600 font-medium">+0.1%</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Performance Overview</h3>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-end justify-between h-40 space-x-2">
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-24"></div>
                <div className="text-xs text-gray-400">1</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-32"></div>
                <div className="text-xs text-gray-400">2</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-20"></div>
                <div className="text-xs text-gray-400">3</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-36"></div>
                <div className="text-xs text-gray-400">4</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-28"></div>
                <div className="text-xs text-gray-400">5</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-40"></div>
                <div className="text-xs text-gray-400">6</div>
              </div>
            </div>
          </div>

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

export default function SplitScreen(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  const { content } = useEditStore();

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
  } = useLayoutComponent<SplitScreenContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA as any  // V2: Schema now includes arrays
  });

  // V2: Direct array access - no legacy parsing
  const trustItems = (blockContent.trust_items || []).map((item: any) =>
    typeof item === 'string' ? item : item.text
  ).filter((text: string) => text && text.trim() !== '');

  // V2: Direct array access for customer avatars
  const customerAvatars: Array<{ id: string; name: string; avatar_url?: string }> =
    blockContent.customer_avatars || [];

  // Handle avatar URL updates - V2 version using array
  const handleAvatarChange = (customerId: string, avatarUrl: string) => {
    const updatedAvatars = customerAvatars.map((avatar) =>
      avatar.id === customerId ? { ...avatar, avatar_url: avatarUrl } : avatar
    );
    (handleContentUpdate as any)('customer_avatars', updatedAvatars);
  };

  // Create hero typography styles using landingTypography system
  const heroTypographyStyle = useMemo(() => {
    const heroStyle = getTypographyStyle('hero');
    return {
      fontSize: heroStyle.fontSize,
      fontWeight: heroStyle.fontWeight,
      lineHeight: heroStyle.lineHeight,
      letterSpacing: heroStyle.letterSpacing,
      fontFamily: heroStyle.fontFamily
    };
  }, [getTypographyStyle]);

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

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
  
  // Get reactive hero image URL directly from store using selector
  const store = useEditStore();
  const heroImageUrl = store.content[sectionId]?.elements?.split_hero_image?.content;
  logger.debug('🔄 Store selector called for split hero image:', { sectionId, url: heroImageUrl, timestamp: Date.now() });

  // Check if the image value is a valid URL or path
  const imageValue = String(heroImageUrl || blockContent.split_hero_image || '');
  const isValidImagePath = imageValue.startsWith('/') ||
                          imageValue.startsWith('http://') ||
                          imageValue.startsWith('https://') ||
                          imageValue.startsWith('blob:') ||
                          imageValue.startsWith('data:') ||
                          imageValue === '';

  // Use placeholder if it's descriptive text from AI or empty
  const reactiveHeroImage = isValidImagePath && imageValue !== '' ? imageValue : '/hero-placeholder.jpg';
  logger.debug('🎨 Final hero image URL:', reactiveHeroImage);
  
  // Use robust image toolbar hook
  const handleImageToolbar = useImageToolbar();

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SplitScreen"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="flex items-center">
        <div className="w-full grid lg:grid-cols-2 gap-4 md:gap-8 lg:gap-12 items-stretch h-[clamp(600px,85vh,900px)]">

          <div className="flex flex-col justify-center p-8 md:p-10 lg:p-16">
            <div className="max-w-lg space-y-8 md:space-y-10 lg:space-y-12">
              
              {blockContent.badge_text &&
               blockContent.badge_text.trim() !== '' && (
                <div>
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

              <div className="mb-2">
                <EditableAdaptiveHeadline
                  mode={mode}
                  value={blockContent.headline || ''}
                  onEdit={(value) => handleContentUpdate('headline', value)}
                  level="h1"
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  style={heroTypographyStyle}
                  sectionId={sectionId}
                  elementKey="headline"
                  sectionBackground={sectionBackground}
                />
              </div>

              {(blockContent.subheadline || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.subheadline || ''}
                  onEdit={(value) => handleContentUpdate('subheadline', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-xl leading-relaxed"
                  placeholder="Add a compelling subheadline that supports your main message and explains the key benefit..."
                  sectionId={sectionId}
                  elementKey="subheadline"
                  sectionBackground={sectionBackground}
                />
              )}

              {(blockContent.supporting_text || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.supporting_text || ''}
                  onEdit={(value) => handleContentUpdate('supporting_text', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="leading-relaxed"
                  placeholder="Add supporting text with social proof, customer count, or key metrics..."
                  sectionId={sectionId}
                  elementKey="supporting_text"
                  sectionBackground={sectionBackground}
                />
              )}

              {content[sectionId]?.elementMetadata?.cta_text?.buttonConfig?.type === 'link-with-input' ? (
                // Link-with-input: Vertical layout (input + button, then trust items below)
                <div className="flex flex-col gap-6 mt-4">
                  <CTAButtonWithInput
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    buttonConfig={content[sectionId].elementMetadata.cta_text.buttonConfig}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />

                  {/* Secondary CTA */}
                  {(blockContent.secondary_cta_text && blockContent.secondary_cta_text.trim() !== '') && (() => {
                    const secondaryButtonConfig = content[sectionId]?.elements?.secondary_cta_text?.metadata?.buttonConfig;
                    const secondaryClassName = "shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4";

                    if (secondaryButtonConfig?.type === 'link-with-input') {
                      return (
                        <CTAButtonWithInput
                          text={blockContent.secondary_cta_text || 'Watch Demo'}
                          colorTokens={colorTokens}
                          buttonConfig={secondaryButtonConfig}
                          className={secondaryClassName}
                          variant="secondary"
                          sectionId={sectionId}
                          elementKey="secondary_cta_text"
                        />
                      );
                    } else if (secondaryButtonConfig?.type === 'form') {
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
              ) : (
                // Standard button: Conditional layout based on form type
                (() => {
                  const buttonConfig = content[sectionId]?.elements?.cta_text?.metadata?.buttonConfig;
                  const isInlineForm = buttonConfig?.type === 'form';

                  // Use vertical layout when form is inline to prevent trust items from being adjacent
                  const layoutClass = isInlineForm
                    ? "flex flex-col gap-6 mt-4"
                    : "flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 mt-4";

                  return (
                    <div className={layoutClass}>
                      {(() => {
                        const primaryClassName = "shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4";

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
                    const secondaryClassName = "shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4";

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
                  );
                })()
              )}

              {/* V2: Trust indicators - SEPARATE ROW (design fix) */}
              {trustItems.length > 0 && (
                <div className="flex items-center gap-6 flex-wrap mt-6">
                  {mode !== 'preview' ? (
                    <EditableTrustIndicators
                      mode={mode}
                      trustItems={trustItems}
                      onTrustItemChange={(index, value) => {
                        const items = blockContent.trust_items || [];
                        const updatedItems = items.map((item: any, i: number) =>
                          i === index ? { ...item, text: value } : item
                        );
                        (handleContentUpdate as any)('trust_items', updatedItems);
                      }}
                      onAddTrustItem={() => {
                        const items = blockContent.trust_items || [];
                        if (items.length < 5) {
                          const newItem = { id: `t${Date.now()}`, text: 'New trust item' };
                          (handleContentUpdate as any)('trust_items', [...items, newItem]);
                        }
                      }}
                      onRemoveTrustItem={(index) => {
                        const items = blockContent.trust_items || [];
                        const updatedItems = items.filter((_: any, i: number) => i !== index);
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
                      items={trustItems}
                      colorClass={mutedTextColor}
                      iconColor="text-green-500"
                    />
                  )}
                </div>
              )}

              {/* V2: Social proof section - no ___REMOVED___ markers */}
              {(blockContent.show_social_proof !== false) && (
                <div className="flex flex-col space-y-6 pt-8 md:pt-10">
                  {blockContent.customer_count && (
                    <div className="relative group/customer-count flex items-center space-x-3">
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
                  
                  {blockContent.rating_value && (
                    <div className="relative group/rating-section flex items-center space-x-2">
                      {renderStars(blockContent.rating_value)}
                      <div className="flex items-center space-x-2 ml-3">
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
                          placeholder="from 127 reviews"
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
          </div>

          <div className="flex items-center justify-center p-4 md:p-6 lg:p-8">
            {reactiveHeroImage ? (
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={String(reactiveHeroImage)}
                  alt="Hero"
                  className="absolute inset-0 w-full h-full object-cover object-center rounded-2xl shadow-2xl cursor-pointer"
                  data-image-id={`${sectionId}-split-hero-image`}
                  onMouseUp={(e) => {
                    if (mode !== 'preview') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      
                      handleImageToolbar(`${sectionId}-split-hero-image`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                />
              </div>
            ) : (
              <HeroImagePlaceholder />
            )}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SplitScreen',
  category: 'Hero Sections',
  description: 'Dramatic split-screen hero layout with bold presentation. Perfect for competitive markets and high-impact messaging.',
  tags: ['hero', 'cta', 'split-screen', 'dramatic', 'bold'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  // V2: Clean array-based content fields
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'secondary_cta_text', label: 'Secondary CTA Button Text', type: 'text', required: false },
    { key: 'badge_text', label: 'Badge Text (uses accent colors)', type: 'text', required: false },
    { key: 'value_proposition', label: 'Value Proposition', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (array)', type: 'array', required: false },
    { key: 'customer_count', label: 'Customer Count', type: 'text', required: false },
    { key: 'rating_value', label: 'Rating (e.g., 4.9/5)', type: 'text', required: false },
    { key: 'rating_count', label: 'Review Count (e.g., from 127 reviews)', type: 'text', required: false },
    { key: 'show_social_proof', label: 'Show Social Proof', type: 'boolean', required: false },
    { key: 'show_customer_avatars', label: 'Show Customer Avatars', type: 'boolean', required: false },
    { key: 'customer_avatars', label: 'Customer Avatars (array)', type: 'array', required: false },
    { key: 'split_hero_image', label: 'Hero Image', type: 'image', required: false }
  ],
  
  features: [
    'Dramatic 50/50 split-screen layout for maximum impact',
    'Large typography for bold messaging',
    'Full-height hero section for immersive experience',
    'Automatic text color adaptation based on background type',
    'CTA buttons use generated accent colors from design system',
    'Trust indicators and social proof prominently displayed'
  ],
  
  useCases: [
    'Bold positioning in competitive markets',
    'High-impact buy-now or subscribe conversion goals',
    'Solution-aware and most-aware audience targeting',
    'Dramatic product announcements and launches',
    'Premium positioning and luxury expert tone'
  ]
};