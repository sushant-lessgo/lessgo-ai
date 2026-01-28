import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

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
  summary_text?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Premium Transformation Experience' },
  before_label: { type: 'string' as const, default: 'Current Challenge' },
  after_label: { type: 'string' as const, default: 'Premium Solution' },
  before_description: { type: 'string' as const, default: 'Complex manual processes requiring expertise, time, and significant resources to execute properly.' },
  after_description: { type: 'string' as const, default: 'Expertly crafted automation that delivers exceptional results with minimal effort and maximum efficiency.' },
  before_visual: { type: 'string' as const, default: '/Before default.jpg' },
  after_visual: { type: 'string' as const, default: '/After default.jpg' },
  subheadline: { type: 'string' as const, default: '' },
  summary_text: { type: 'string' as const, default: '' },
  premium_features_text: { type: 'string' as const, default: 'Premium Features Included' },
  upgrade_text: { type: 'string' as const, default: 'Upgrade' },
  before_placeholder_text: { type: 'string' as const, default: 'Current State' },
  after_placeholder_text: { type: 'string' as const, default: 'Premium Result' },
  premium_badge_text: { type: 'string' as const, default: 'Premium' },
  before_icon: { type: 'string' as const, default: '⚠️' },
  after_icon: { type: 'string' as const, default: '⭐' },
  upgrade_icon: { type: 'string' as const, default: '➡️' },
  premium_feature_icon: { type: 'string' as const, default: '✅' }
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
  premiumBadgeText,
  blockContent,
  handleImageToolbar,
  themeColors,
  accentColor
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
  premiumBadgeText: string;
  blockContent: SplitCardContent;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  themeColors: {
    beforeBorder: string;
    beforeLabel: string;
    beforeDot: string;
    beforeDotRing: string;
    afterBorder: string;
    afterRing: string;
    afterLabel: string;
    afterDot: string;
    afterDotRing: string;
    afterBorderTop: string;
    badgeGradient: string;
    beforePlaceholderBg: string;
    beforePlaceholderIcon: string;
    afterPlaceholderBg: string;
    afterPlaceholderIcon: string;
    featureText: string;
    featureIcon: string;
  };
  accentColor: string;
}) => {

  const VisualPlaceholder = () => (
    <div className={`relative w-full h-64 rounded-t-xl overflow-hidden bg-gradient-to-br ${
      type === 'before'
        ? themeColors.beforePlaceholderBg
        : themeColors.afterPlaceholderBg
    }`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-20 h-20 rounded-full ${
          type === 'before'
            ? themeColors.beforePlaceholderIcon
            : themeColors.afterPlaceholderIcon
        } flex items-center justify-center`}>
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
    </div>
  );

  return (
    <div
      className={`group relative bg-white rounded-xl shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        type === 'after' ? 'ring-2' : ''
      }`}
      style={{
        borderColor: type === 'before' ? themeColors.beforeBorder : themeColors.afterBorder,
        ...(type === 'after' && {
          '--tw-ring-color': themeColors.afterRing
        } as React.CSSProperties)
      }}
    >

      {type === 'after' && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div
            className="text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg"
            style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}cc)` }}
          >
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
            alt={type === 'before' ? 'Current challenge visualization' : 'Premium solution result'}
            className="w-full h-64 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
            data-image-id={`${sectionId}-${type}-visual`}
            onMouseUp={(e) => {
              if (mode !== 'preview') {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                handleImageToolbar(`${sectionId}-${type}-visual`, {
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10
                });
              }
            }}
          />
        ) : (
          <VisualPlaceholder />
        )}
      </div>

      <div className="p-8">
        <div className="flex items-center mb-4">
          <div
            className="w-3 h-3 rounded-full mr-3 ring-4"
            style={{
              backgroundColor: type === 'before' ? themeColors.beforeDot : accentColor,
              '--tw-ring-color': type === 'before' ? themeColors.beforeDotRing : `${accentColor}20`
            } as React.CSSProperties}
          />
          <EditableAdaptiveText
            mode={mode}
            value={label || ''}
            onEdit={(value) => handleContentUpdate(type === 'before' ? 'before_label' : 'after_label', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{
              ...bodyLgStyle,
              color: type === 'before' ? themeColors.beforeLabel : accentColor
            }}
            className=""
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
          <div
            className="mt-6 pt-4 border-t"
            style={{ borderColor: `${accentColor}20` }}
          >
            <div className="flex items-center" style={{ color: accentColor }}>
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
                  color: accentColor
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

  const bodyLgStyle = getTypographyStyle('body-lg');

  // Detect UIBlock theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get accent color for After card
  const accentColor = colorTokens.ctaBg || '#3b82f6';

  // Theme colors for Before card (After uses accent)
  const getCardColors = (theme: UIBlockTheme) => ({
    warm: {
      beforeBorder: '#fed7aa',
      beforeLabel: '#c2410c',
      beforeDot: '#f97316',
      beforeDotRing: '#ffedd5',
      afterBorder: `${accentColor}40`,
      afterRing: `${accentColor}20`,
      afterLabel: accentColor,
      afterDot: accentColor,
      afterDotRing: `${accentColor}20`,
      afterBorderTop: `${accentColor}20`,
      badgeGradient: `from-[${accentColor}] to-[${accentColor}cc]`,
      beforePlaceholderBg: 'from-orange-100 to-orange-200',
      beforePlaceholderIcon: 'bg-orange-300',
      afterPlaceholderBg: 'from-blue-50 to-blue-100',
      afterPlaceholderIcon: 'bg-blue-200',
      featureText: accentColor,
      featureIcon: `text-[${accentColor}]`
    },
    cool: {
      beforeBorder: '#bfdbfe',
      beforeLabel: '#1e40af',
      beforeDot: '#3b82f6',
      beforeDotRing: '#dbeafe',
      afterBorder: `${accentColor}40`,
      afterRing: `${accentColor}20`,
      afterLabel: accentColor,
      afterDot: accentColor,
      afterDotRing: `${accentColor}20`,
      afterBorderTop: `${accentColor}20`,
      badgeGradient: `from-[${accentColor}] to-[${accentColor}cc]`,
      beforePlaceholderBg: 'from-blue-100 to-blue-200',
      beforePlaceholderIcon: 'bg-blue-300',
      afterPlaceholderBg: 'from-blue-50 to-blue-100',
      afterPlaceholderIcon: 'bg-blue-200',
      featureText: accentColor,
      featureIcon: `text-[${accentColor}]`
    },
    neutral: {
      beforeBorder: '#e5e7eb',
      beforeLabel: '#374151',
      beforeDot: '#6b7280',
      beforeDotRing: '#f3f4f6',
      afterBorder: `${accentColor}40`,
      afterRing: `${accentColor}20`,
      afterLabel: accentColor,
      afterDot: accentColor,
      afterDotRing: `${accentColor}20`,
      afterBorderTop: `${accentColor}20`,
      badgeGradient: `from-[${accentColor}] to-[${accentColor}cc]`,
      beforePlaceholderBg: 'from-gray-100 to-gray-200',
      beforePlaceholderIcon: 'bg-gray-300',
      afterPlaceholderBg: 'from-gray-50 to-gray-100',
      afterPlaceholderIcon: 'bg-gray-200',
      featureText: accentColor,
      featureIcon: `text-[${accentColor}]`
    }
  }[theme]);

  const themeColors = getCardColors(uiTheme);
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  const handleImageToolbar = useImageToolbar();

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
              placeholder="Add optional subheadline..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

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
              premiumBadgeText={blockContent.premium_badge_text}
              blockContent={blockContent}
              handleImageToolbar={handleImageToolbar}
              themeColors={themeColors}
              accentColor={accentColor}
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
              premiumBadgeText={blockContent.premium_badge_text}
              blockContent={blockContent}
              handleImageToolbar={handleImageToolbar}
              themeColors={themeColors}
              accentColor={accentColor}
            />
          </div>
        </div>

        {/* Summary Text - Optional transition copy below cards */}
        {(blockContent.summary_text || mode === 'edit') && (
          <div className="text-center mt-12">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.summary_text || ''}
              onEdit={(value) => handleContentUpdate('summary_text', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional summary/transition text..."
              sectionId={sectionId}
              elementKey="summary_text"
              sectionBackground={sectionBackground}
            />
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SplitCard',
  category: 'Comparison',
  description: 'Premium card-based comparison layout with accent-colored After card.',
  tags: ['comparison', 'premium', 'cards', 'luxury', 'expert'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'before_description', label: 'Before Description', type: 'textarea', required: true },
    { key: 'before_visual', label: 'Before Visual', type: 'image', required: false },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'after_description', label: 'After Description', type: 'textarea', required: true },
    { key: 'after_visual', label: 'After Visual', type: 'image', required: false },
    { key: 'summary_text', label: 'Summary Text', type: 'textarea', required: false }
  ],

  features: [
    'Premium card-based design',
    'After card uses theme accent color',
    'Optional summary text below cards',
    'Upgrade indicator between cards'
  ],

  useCases: [
    'Premium service transformations',
    'High-end product comparisons',
    'Enterprise solution showcases'
  ]
};
