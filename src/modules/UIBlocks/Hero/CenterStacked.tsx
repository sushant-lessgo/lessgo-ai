import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { logger } from '@/lib/logger';
import { shadows } from '@/modules/Design/designTokens';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
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
// V2: No legacy parsing imports needed - using clean arrays

// V2: Clean array types - no pipe-separated strings
interface CenterStackedContent {
  headline: string;
  cta_text: string;
  secondary_cta_text?: string;
  subheadline?: string;
  supporting_text?: string;
  badge_text?: string;
  center_hero_image?: string;
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
    default: ''
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
  center_hero_image: {
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

const HeroImagePlaceholder = React.memo(({ theme = 'neutral' }: { theme?: UIBlockTheme }) => {
  const gradients = {
    warm: 'from-orange-50 via-amber-50 to-rose-100',
    cool: 'from-blue-50 via-indigo-50 to-purple-100',
    neutral: 'from-slate-50 via-gray-50 to-zinc-100'
  };

  const accentGradients = {
    warm: 'from-orange-500 to-amber-600',
    cool: 'from-blue-500 to-indigo-600',
    neutral: 'from-slate-500 to-gray-600'
  };

  const iconBg = {
    warm: 'bg-orange-500/10',
    cool: 'bg-blue-500/10',
    neutral: 'bg-slate-500/10'
  };

  return (
    <div className="relative w-[60%] lg:w-[65%] aspect-[16/9] mx-auto">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[theme]} rounded-2xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-500`}>

        {/* Simplified centered content */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center space-y-6">
            {/* Main visual element */}
            <div className={`w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br ${accentGradients[theme]} flex items-center justify-center shadow-xl`}>
              <span className="text-white text-6xl">📱</span>
            </div>

            {/* Feature indicators */}
            <div className="flex justify-center gap-4">
              <div className={`w-20 h-20 rounded-2xl ${iconBg[theme]} backdrop-blur-sm flex items-center justify-center`}>
                <span className="text-3xl">✨</span>
              </div>
              <div className={`w-20 h-20 rounded-2xl ${iconBg[theme]} backdrop-blur-sm flex items-center justify-center`}>
                <span className="text-3xl">⚡</span>
              </div>
              <div className={`w-20 h-20 rounded-2xl ${iconBg[theme]} backdrop-blur-sm flex items-center justify-center`}>
                <span className="text-3xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corner accents */}
        <div className={`absolute top-8 right-8 w-16 h-16 bg-gradient-to-br ${accentGradients[theme]} rounded-2xl shadow-lg opacity-60`}></div>
        <div className={`absolute bottom-8 left-8 w-12 h-12 bg-gradient-to-br ${accentGradients[theme]} rounded-xl shadow-lg opacity-60`}></div>
      </div>
    </div>
  );
});
HeroImagePlaceholder.displayName = 'HeroImagePlaceholder';

export default function CenterStacked(props: LayoutComponentProps) {
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
  } = useLayoutComponent<CenterStackedContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA as any  // V2: Schema now includes arrays
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');

  // V2: Direct array access - no legacy parsing
  const trustItems = (blockContent.trust_items || []).map((item: any) =>
    typeof item === 'string' ? item : item.text
  ).filter((text: string) => text && text.trim() !== '');

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

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

  
  // Use robust image toolbar hook
  const handleImageToolbar = useImageToolbar();

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CenterStacked"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className || ''}
    >
      <div className="flex flex-col items-center space-y-8 min-h-[600px] justify-start">
        <div className="max-w-5xl mx-auto text-center w-full flex flex-col items-center">

          {blockContent.badge_text &&
           blockContent.badge_text.trim() !== '' && (
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

          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h1"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="text-center leading-[1.1] max-w-5xl mx-auto mb-6"
            textStyle={{ textAlign: 'center' }}
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="leading-relaxed max-w-7xl mb-6"
              style={bodyLgStyle}
              textStyle={{ ...bodyLgStyle, textAlign: 'center' }}
              placeholder="Add a compelling subheadline that supports your main message and explains the key benefit..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {((blockContent.supporting_text && blockContent.supporting_text.trim() !== '') || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.supporting_text || ''}
              onEdit={(value) => handleContentUpdate('supporting_text', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="leading-relaxed max-w-7xl mb-8"
              textStyle={{ textAlign: 'center' }}
              placeholder="Add supporting text with social proof, customer count, or key metrics..."
              sectionId={sectionId}
              elementKey="supporting_text"
              sectionBackground={sectionBackground}
            />
          )}

          {(() => {
            // Conditional layout based on inline form presence
            const buttonConfig = content[sectionId]?.elements?.cta_text?.metadata?.buttonConfig;
            const isInlineForm = buttonConfig?.type === 'form';
            const containerClass = isInlineForm
              ? "flex flex-col items-center justify-center gap-4"
              : "flex flex-col sm:flex-row items-center justify-center gap-4";

            return (
              <div className={containerClass}>
                {(() => {
              const primaryClassName = `px-12 py-6 font-semibold rounded-xl ${shadows.cta[theme]} ${shadows.ctaHover[theme]} transition-all duration-200 transform hover:-translate-y-0.5`;

              if (buttonConfig?.type === 'link-with-input') {
                return (
                  <CTAButtonWithInput
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    buttonConfig={buttonConfig}
                    className={primaryClassName}
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                    leadingIcon={buttonConfig?.leadingIcon}
                    trailingIcon={buttonConfig?.trailingIcon}
                    leadingIconSize={buttonConfig?.iconConfig?.leadingSize}
                    trailingIconSize={buttonConfig?.iconConfig?.trailingSize}
                  />
                );
              } else if (buttonConfig?.type === 'form') {
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
                    leadingIcon={buttonConfig?.leadingIcon}
                    trailingIcon={buttonConfig?.trailingIcon}
                    leadingIconSize={buttonConfig?.iconConfig?.leadingSize}
                    trailingIconSize={buttonConfig?.iconConfig?.trailingSize}
                    onClick={() => {
                      // Get ctaConfig from section data
                      const { content } = useEditStore.getState();
                      const sectionData = content[sectionId];
                      const ctaConfig = (sectionData as any)?.ctaConfig;

                      logger.debug('🔗 CTA Button clicked:', () => ({ ctaConfig, sectionId }));

                      if (ctaConfig?.type === 'link' && ctaConfig.url) {
                        window.open(ctaConfig.url, '_blank', 'noopener,noreferrer');
                      } else {
                      }
                    }}
                  />
                );
              }
            })()}

            {/* Secondary CTA */}
            {(blockContent.secondary_cta_text && blockContent.secondary_cta_text.trim() !== '') && (() => {
              const secondaryButtonConfig = content[sectionId]?.elements?.secondary_cta_text?.metadata?.buttonConfig;
              const secondaryClassName = `px-12 py-6 font-semibold rounded-xl ${shadows.cta[theme]} ${shadows.ctaHover[theme]} transition-all duration-200 transform hover:-translate-y-0.5`;

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
                    leadingIcon={secondaryButtonConfig?.leadingIcon}
                    trailingIcon={secondaryButtonConfig?.trailingIcon}
                    leadingIconSize={secondaryButtonConfig?.iconConfig?.leadingSize}
                    trailingIconSize={secondaryButtonConfig?.iconConfig?.trailingSize}
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
                    leadingIcon={secondaryButtonConfig?.leadingIcon}
                    trailingIcon={secondaryButtonConfig?.trailingIcon}
                    leadingIconSize={secondaryButtonConfig?.iconConfig?.leadingSize}
                    trailingIconSize={secondaryButtonConfig?.iconConfig?.trailingSize}
                    onClick={() => {
                      const { content } = useEditStore.getState();
                      const sectionData = content[sectionId];
                      const secondaryCtaConfig = (sectionData as any)?.secondaryCtaConfig;

                      logger.debug('🔗 Secondary CTA Button clicked:', () => ({ secondaryCtaConfig, sectionId }));

                      if (secondaryCtaConfig?.type === 'link' && secondaryCtaConfig.url) {
                        window.open(secondaryCtaConfig.url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  />
                );
              }
            })()}
              </div>
            );
          })()}

          {/* V2: Trust indicators - SEPARATE ROW (design fix) */}
          {trustItems.length > 0 && (
            <div className="flex items-center justify-center gap-6 flex-wrap mt-6">
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
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-4">
              {blockContent.customer_count && (
                <div className="flex items-center space-x-2 relative group/customer-count">
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
                    textStyle={{ textAlign: 'center' }}
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
                <div className="relative group/rating-section flex items-center space-x-1">
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
                      textStyle={{ textAlign: 'center' }}
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
                      textStyle={{ textAlign: 'center' }}
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

        <div className="w-full">
            {(() => {
              // Check if center_hero_image is a valid URL or path
              const rawImage = blockContent.center_hero_image || '';
              const imageValue = typeof rawImage === 'string' ? rawImage : (rawImage as any)?.content || (rawImage as any)?.url || '';
              const isValidImagePath = imageValue.startsWith('/') ||
                                      imageValue.startsWith('http://') ||
                                      imageValue.startsWith('https://') ||
                                      imageValue.startsWith('blob:') ||
                                      imageValue.startsWith('data:') ||
                                      imageValue === '';

              // Use placeholder if it's descriptive text from AI or empty
              const imageSrc = isValidImagePath && imageValue !== '' ? imageValue : '/hero-placeholder.jpg';

              return imageSrc ? (
                <div className="relative w-[60%] lg:w-[65%] aspect-video mx-auto overflow-hidden">
                  <img
                    src={imageSrc}
                    alt="Hero"
                    className="absolute inset-0 w-full h-full object-cover object-center rounded-2xl shadow-2xl cursor-pointer"
                    data-image-id={`${sectionId}-center-hero-image`}
                  onMouseUp={(e) => {
                    if (mode !== 'preview') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleImageToolbar(`${sectionId}-center-hero-image`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                />
              </div>
            ) : (
              <HeroImagePlaceholder theme={theme} />
            );
          })()}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'CenterStacked',
  category: 'Hero Sections',
  description: 'Hero section with all content stacked vertically in center. Perfect for early-stage products and simple messaging.',
  tags: ['hero', 'cta', 'centered', 'stacked', 'simple'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '10 minutes',
  
  // Element restriction information
  elementRestrictions: {
    allowsUniversalElements: false,
    restrictionLevel: 'strict' as const,
    reason: "Hero sections use predefined content schemas with specific vertical alignment that additional elements would disrupt",
    alternativeSuggestions: [
      "Edit the existing content fields (headline, subheadline, supporting text)",
      "Use the badge_text field for additional messaging",
      "Modify trust_items for social proof elements",
      "Switch to a flexible content section for custom elements"
    ]
  },
  
  // V2: Clean array-based content fields
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'secondary_cta_text', label: 'Secondary CTA Button Text', type: 'text', required: false },
    { key: 'badge_text', label: 'Badge Text (uses accent colors)', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (array)', type: 'array', required: false },
    { key: 'customer_count', label: 'Customer Count', type: 'text', required: false },
    { key: 'rating_value', label: 'Rating (e.g., 4.9/5)', type: 'text', required: false },
    { key: 'rating_count', label: 'Review Count (e.g., from 127 reviews)', type: 'text', required: false },
    { key: 'show_social_proof', label: 'Show Social Proof', type: 'boolean', required: false },
    { key: 'show_customer_avatars', label: 'Show Customer Avatars', type: 'boolean', required: false },
    { key: 'customer_avatars', label: 'Customer Avatars (array)', type: 'array', required: false },
    { key: 'center_hero_image', label: 'Hero Image', type: 'image', required: false }
  ],
  
  features: [
    'Centered vertical layout for simple, focused messaging',
    'Automatic text color adaptation based on background type',
    'CTA buttons use generated accent colors from design system',
    'Badge component uses brand accent colors',
    'Trust indicators adapt to background contrast',
    'Responsive design with mobile-first approach',
    'Structured content schema prevents layout conflicts'
  ],
  
  useCases: [
    'Early-stage product launches with waitlist signup',
    'Simple messaging for unaware audiences',
    'MVP announcements with clear value proposition',
    'Community building and early access campaigns',
    'Focused conversion goals with minimal distraction'
  ]
};