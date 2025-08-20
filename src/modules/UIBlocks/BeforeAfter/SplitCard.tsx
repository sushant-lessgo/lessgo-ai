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
import IconEditableText from '@/components/ui/IconEditableText';
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
  before_icon?: string;
  after_icon?: string;
  upgrade_icon?: string;
  premium_feature_icon?: string;
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
  },
  before_icon: {
    type: 'string' as const,
    default: '⚠️'
  },
  after_icon: {
    type: 'string' as const,
    default: '⭐'
  },
  upgrade_icon: {
    type: 'string' as const,
    default: '➡️'
  },
  premium_feature_icon: {
    type: 'string' as const,
    default: '✅'
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
  premiumBadgeText,
  blockContent
}: {
  type: 'before' | 'after';
  label: string;
  description: string;
  visual?: string;
  showImageToolbar: any;
  sectionId: string;
  mode: 'preview' | 'edit';
  bodyLgStyle: React.CSSProperties;
  handleContentUpdate: (key: string, value: string) => void;
  colorTokens: any;
  backgroundType: 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme';
  sectionBackground: any;
  premiumFeaturesText: string;
  placeholderText: string;
  premiumBadgeText: string;
  blockContent: SplitCardContent;
}) => {
  
  const VisualPlaceholder = () => (
    <div className={`relative w-full h-64 rounded-t-xl overflow-hidden ${type === 'before' ? 'bg-gradient-to-br from-slate-100 to-slate-200' : 'bg-gradient-to-br from-amber-50 to-amber-100'}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-20 h-20 rounded-full ${type === 'before' ? 'bg-slate-300' : 'bg-amber-200'} flex items-center justify-center`}>
          <IconEditableText
            mode={mode}
            value={type === 'before' ? 
              (blockContent.before_icon || '⚠️') : 
              (blockContent.after_icon || '⭐')
            }
            onEdit={(value) => handleContentUpdate(type === 'before' ? 'before_icon' : 'after_icon', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            iconSize="xl"
            className="text-4xl"
            sectionId={sectionId}
            elementKey={type === 'before' ? 'before_icon' : 'after_icon'}
          />
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
              <IconEditableText
                mode={mode}
                value={blockContent.premium_feature_icon || '✅'}
                onEdit={(value) => handleContentUpdate('premium_feature_icon', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                iconSize="sm"
                className="text-sm mr-2"
                sectionId={sectionId}
                elementKey="premium_feature_icon"
              />
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
              blockContent={blockContent}
            />
            
            <div className="text-center lg:hidden">
              <div className="inline-flex items-center space-x-2 bg-white rounded-full shadow-lg px-6 py-3">
                <IconEditableText
                  mode={mode}
                  value={blockContent.upgrade_icon || '➡️'}
                  onEdit={(value) => handleContentUpdate('upgrade_icon', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-lg text-gray-400"
                  sectionId={sectionId}
                  elementKey="upgrade_icon_mobile"
                />
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
                <IconEditableText
                  mode={mode}
                  value={blockContent.upgrade_icon || '➡️'}
                  onEdit={(value) => handleContentUpdate('upgrade_icon', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  iconSize="md"
                  className="text-xl text-gray-400"
                  sectionId={sectionId}
                  elementKey="upgrade_icon_desktop"
                />
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
              blockContent={blockContent}
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