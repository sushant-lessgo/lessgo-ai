import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface SplitCardContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_description: string;
  after_description: string;
  before_visual?: string;
  after_visual?: string;
  premium_features_text: string;
  upgrade_text: string;
  before_placeholder_text: string;
  after_placeholder_text: string;
  premium_badge_text: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Premium Transformation Experience' 
  },
  before_label: { 
    type: 'string' as const, 
    default: 'Current Challenge' 
  },
  after_label: { 
    type: 'string' as const, 
    default: 'Premium Solution' 
  },
  before_description: { 
    type: 'string' as const, 
    default: 'Complex manual processes requiring expertise, time, and significant resources to execute properly.' 
  },
  after_description: { 
    type: 'string' as const, 
    default: 'Expertly crafted automation that delivers exceptional results with minimal effort and maximum efficiency.' 
  },
  before_visual: { 
    type: 'string' as const, 
    default: '/before-placeholder.jpg' 
  },
  after_visual: { 
    type: 'string' as const, 
    default: '/after-placeholder.jpg' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  premium_features_text: {
    type: 'string' as const,
    default: 'Premium Features Included'
  },
  upgrade_text: {
    type: 'string' as const,
    default: 'Upgrade'
  },
  before_placeholder_text: {
    type: 'string' as const,
    default: 'Current State'
  },
  after_placeholder_text: {
    type: 'string' as const,
    default: 'Premium Result'
  },
  premium_badge_text: {
    type: 'string' as const,
    default: 'Premium'
  }
};

const PremiumCard = React.memo(({ 
  type, 
  label, 
  description, 
  visual, 
  showImageToolbar, 
  sectionId, 
  mode,
  bodyLgStyle,
  handleContentUpdate,
  colorTokens,
  backgroundType,
  sectionBackground,
  premiumFeaturesText,
  placeholderText,
  premiumBadgeText
}: {
  type: 'before' | 'after';
  label: string;
  description: string;
  visual?: string;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
  bodyLgStyle: React.CSSProperties;
  handleContentUpdate: (key: string, value: string) => void;
  colorTokens: any;
  backgroundType: string;
  sectionBackground: any;
  premiumFeaturesText: string;
  placeholderText: string;
  premiumBadgeText: string;
}) => {
  
  const VisualPlaceholder = () => (
    <div className={`relative w-full h-64 rounded-t-xl overflow-hidden ${type === 'before' ? 'bg-gradient-to-br from-slate-100 to-slate-200' : 'bg-gradient-to-br from-amber-50 to-amber-100'}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-20 h-20 rounded-full ${type === 'before' ? 'bg-slate-300' : 'bg-amber-200'} flex items-center justify-center`}>
          {type === 'before' ? (
            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className={`text-center text-sm font-medium ${type === 'before' ? 'text-slate-700' : 'text-amber-700'}`}>
          <EditableAdaptiveText
            mode={mode}
            value={placeholderText || ''}
            onEdit={(value) => handleContentUpdate(type === 'before' ? 'before_placeholder_text' : 'after_placeholder_text', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: type === 'before' ? '#334155' : '#d97706'
            }}
            className={`text-center text-sm font-medium ${type === 'before' ? 'text-slate-700' : 'text-amber-700'}`}
            sectionId={sectionId}
            elementKey={type === 'before' ? 'before_placeholder_text' : 'after_placeholder_text'}
            sectionBackground={sectionBackground}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`group relative bg-white rounded-xl shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
      type === 'before' 
        ? 'border-slate-200 hover:border-slate-300' 
        : 'border-amber-200 hover:border-amber-300 ring-2 ring-amber-100'
    }`}>
      
      {type === 'after' && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg">
            <EditableAdaptiveText
              mode={mode}
              value={premiumBadgeText || ''}
              onEdit={(value) => handleContentUpdate('premium_badge_text', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'white'
              }}
              className="text-white text-xs font-semibold uppercase tracking-wide"
              sectionId={sectionId}
              elementKey="premium_badge_text"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>
      )}
      
      <div className="overflow-hidden rounded-t-xl">
        {visual && visual !== '' ? (
          <img
            src={visual}
            alt={`${type} state`}
            className="w-full h-64 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
            data-image-id={`${sectionId}-${type}-visual`}
            onMouseUp={(e) => {
              // Image toolbar is only available in edit mode
            }}
          />
        ) : (
          <VisualPlaceholder />
        )}
      </div>
      
      <div className="p-8">
        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-3 ${type === 'before' ? 'bg-slate-500' : 'bg-amber-500'} ring-4 ${type === 'before' ? 'ring-slate-100' : 'ring-amber-100'}`} />
          <EditableAdaptiveText
            mode={mode}
            value={label || ''}
            onEdit={(value) => handleContentUpdate(type === 'before' ? 'before_label' : 'after_label', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{
              ...bodyLgStyle,
              color: type === 'before' ? '#334155' : '#d97706'
            }}
            className={type === 'before' ? 'text-slate-700' : 'text-amber-700'}
            sectionId={sectionId}
            elementKey={type === 'before' ? 'before_label' : 'after_label'}
            sectionBackground={sectionBackground}
          />
        </div>
        
        <EditableAdaptiveText
          mode={mode}
          value={description || ''}
          onEdit={(value) => handleContentUpdate(type === 'before' ? 'before_description' : 'after_description', value)}
          backgroundType={backgroundType}
          colorTokens={colorTokens}
          variant="body"
          className="text-gray-600 leading-relaxed"
          sectionId={sectionId}
          elementKey={type === 'before' ? 'before_description' : 'after_description'}
          sectionBackground={sectionBackground}
        />
        
        {type === 'after' && (
          <div className="mt-6 pt-4 border-t border-amber-100">
            <div className="flex items-center text-amber-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <EditableAdaptiveText
                mode={mode}
                value={premiumFeaturesText || ''}
                onEdit={(value) => handleContentUpdate('premium_features_text', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#d97706'
                }}
                className="text-sm font-medium"
                sectionId={sectionId}
                elementKey="premium_features_text"
                sectionBackground={sectionBackground}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
PremiumCard.displayName = 'PremiumCard';

export default function SplitCard(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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
  } = useLayoutComponent<SplitCardContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SplitCard"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={safeBackgroundType}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="mb-6 max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce your premium transformation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          
          <div className="space-y-6">
            <PremiumCard
              type="before"
              label={blockContent.before_label}
              description={blockContent.before_description}
              visual={blockContent.before_visual}
              showImageToolbar={showImageToolbar}
              sectionId={sectionId}
              mode={mode}
              bodyLgStyle={bodyLgStyle}
              handleContentUpdate={handleContentUpdate}
              colorTokens={colorTokens}
              backgroundType={safeBackgroundType}
              sectionBackground={sectionBackground}
              premiumFeaturesText={blockContent.premium_features_text}
              placeholderText={blockContent.before_placeholder_text}
              premiumBadgeText={blockContent.premium_badge_text}
            />
            
            <div className="text-center lg:hidden">
              <div className="inline-flex items-center space-x-2 bg-white rounded-full shadow-lg px-6 py-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.upgrade_text || ''}
                  onEdit={(value) => handleContentUpdate('upgrade_text', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm font-medium ${mutedTextColor}`}
                  sectionId={sectionId}
                  elementKey="upgrade_text"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute -left-8 top-1/2 transform -translate-y-1/2">
              <div className="flex flex-col items-center space-y-2 bg-white rounded-full shadow-lg px-4 py-6">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.upgrade_text || ''}
                  onEdit={(value) => handleContentUpdate('upgrade_text', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm font-medium ${mutedTextColor} writing-mode-vertical`}
                  sectionId={sectionId}
                  elementKey="upgrade_text"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
            
            <PremiumCard
              type="after"
              label={blockContent.after_label}
              description={blockContent.after_description}
              visual={blockContent.after_visual}
              showImageToolbar={showImageToolbar}
              sectionId={sectionId}
              mode={mode}
              bodyLgStyle={bodyLgStyle}
              handleContentUpdate={handleContentUpdate}
              colorTokens={colorTokens}
              backgroundType={safeBackgroundType}
              sectionBackground={sectionBackground}
              premiumFeaturesText={blockContent.premium_features_text}
              placeholderText={blockContent.after_placeholder_text}
              premiumBadgeText={blockContent.premium_badge_text}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.before_label || ''}
              onEdit={(value) => handleContentUpdate('before_label', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{
                ...getTextStyle('h3'),
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                color: '#64748b'
              }}
              className="text-slate-600"
              sectionId={sectionId}
              elementKey="before_label"
              sectionBackground={sectionBackground}
            />

            <EditableAdaptiveText
              mode={mode}
              value={blockContent.before_description || ''}
              onEdit={(value) => handleContentUpdate('before_description', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="leading-relaxed"
              sectionId={sectionId}
              elementKey="before_description"
              sectionBackground={sectionBackground}
            />
          </div>

          <div className="space-y-4">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.after_label || ''}
              onEdit={(value) => handleContentUpdate('after_label', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{
                ...getTextStyle('h3'),
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                color: '#d97706'
              }}
              className="text-amber-600"
              sectionId={sectionId}
              elementKey="after_label"
              sectionBackground={sectionBackground}
            />

            <EditableAdaptiveText
              mode={mode}
              value={blockContent.after_description || ''}
              onEdit={(value) => handleContentUpdate('after_description', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="leading-relaxed"
              sectionId={sectionId}
              elementKey="after_description"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your premium value proposition..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(blockContent.cta_text || trustItems.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {blockContent.cta_text && (
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                )}

                {trustItems.length > 0 && (
                  <TrustIndicators 
                    items={trustItems}
                    colorClass={mutedTextColor}
                    iconColor="text-amber-500"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SplitCard',
  category: 'Comparison',
  description: 'Premium card-based comparison layout. Perfect for luxury/expert tone and solution-aware audiences.',
  tags: ['comparison', 'premium', 'cards', 'luxury', 'expert'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'before_description', label: 'Before Description', type: 'textarea', required: true },
    { key: 'before_visual', label: 'Before Visual', type: 'image', required: false },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'after_description', label: 'After Description', type: 'textarea', required: true },
    { key: 'after_visual', label: 'After Visual', type: 'image', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Premium card-based design with luxury aesthetics',
    'Hover animations and premium interactions',
    'After card highlighted with premium badge',
    'Perfect for high-end positioning',
    'Optimized for solution-aware audiences',
    'Luxury color palette with amber accents'
  ],
  
  useCases: [
    'Premium service transformations',
    'High-end product comparisons',
    'Luxury expert positioning',
    'Enterprise solution showcases',
    'Level-3 market sophistication targeting'
  ]
};