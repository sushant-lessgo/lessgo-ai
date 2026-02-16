import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

interface SplitCardContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_description: string;
  after_description: string;
  before_visual?: string;
  after_visual?: string;
  upgrade_text: string;
  before_placeholder_text: string;
  after_placeholder_text: string;
  before_icon?: string;
  after_icon?: string;
  upgrade_icon?: string;
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
  upgrade_text: { type: 'string' as const, default: 'Upgrade' },
  before_placeholder_text: { type: 'string' as const, default: 'Current State' },
  after_placeholder_text: { type: 'string' as const, default: 'Premium Result' },
  before_icon: { type: 'string' as const, default: 'AlertTriangle' },
  after_icon: { type: 'string' as const, default: 'Star' },
  upgrade_icon: { type: 'string' as const, default: 'ArrowRight' }
};

const PremiumCard = React.memo(({
  type,
  label,
  description,
  visual,
  sectionId,
  mode,
  bodyLgStyle,
  handleContentUpdate,
  colorTokens,
  backgroundType,
  sectionBackground,
  blockContent,
  handleImageToolbar,
  themeColors,
  accentColor,
  cardStyles
}: {
  type: 'before' | 'after';
  label: string;
  description: string;
  visual?: string;
  sectionId: string;
  mode: 'preview' | 'edit';
  bodyLgStyle: React.CSSProperties;
  handleContentUpdate: (key: string, value: string) => void;
  colorTokens: any;
  backgroundType: 'custom' | 'neutral' | 'primary' | 'secondary' | 'theme';
  sectionBackground: any;
  blockContent: SplitCardContent;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  themeColors: {
    beforeBorder: string;
    beforeLabel: string;
    afterBorder: string;
    afterRing: string;
    afterLabel: string;
    beforePlaceholderBg: string;
    beforePlaceholderIcon: string;
    afterPlaceholderBg: string;
    afterPlaceholderIcon: string;
  };
  accentColor: string;
  cardStyles: CardStyles;
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
              (blockContent.before_icon || 'AlertTriangle') :
              (blockContent.after_icon || 'Star')
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
      className={`group relative ${cardStyles.bg} ${cardStyles.blur} ${cardStyles.border} ${cardStyles.shadow} rounded-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        type === 'after' ? 'ring-2' : ''
      }`}
      style={{
        borderColor: type === 'before' ? themeColors.beforeBorder : themeColors.afterBorder,
        ...(type === 'after' && {
          '--tw-ring-color': themeColors.afterRing
        } as React.CSSProperties)
      }}
    >

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
          <EditableAdaptiveText
            mode={mode}
            value={label || ''}
            onEdit={(value) => handleContentUpdate(type === 'before' ? 'before_label' : 'after_label', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{
              ...bodyLgStyle,
              color: type === 'after' ? accentColor : undefined
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
          className={`leading-relaxed ${cardStyles.textBody}`}
          sectionId={sectionId}
          elementKey={type === 'before' ? 'before_description' : 'after_description'}
          sectionBackground={sectionBackground}
        />
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
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get adaptive card styles
  const cardStyles = React.useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiTheme
  }), [sectionBackground, uiTheme]);

  // Get accent color for After card
  const accentColor = colorTokens.ctaBg || '#3b82f6';

  // Theme colors for Before card (After uses accent)
  const getCardColors = (theme: UIBlockTheme) => ({
    warm: {
      beforeBorder: '#fed7aa',
      beforeLabel: '#c2410c',
      afterBorder: `${accentColor}40`,
      afterRing: `${accentColor}20`,
      afterLabel: accentColor,
      beforePlaceholderBg: 'from-orange-100 to-orange-200',
      beforePlaceholderIcon: 'bg-orange-300',
      afterPlaceholderBg: 'from-blue-50 to-blue-100',
      afterPlaceholderIcon: 'bg-blue-200'
    },
    cool: {
      beforeBorder: '#bfdbfe',
      beforeLabel: '#1e40af',
      afterBorder: `${accentColor}40`,
      afterRing: `${accentColor}20`,
      afterLabel: accentColor,
      beforePlaceholderBg: 'from-blue-100 to-blue-200',
      beforePlaceholderIcon: 'bg-blue-300',
      afterPlaceholderBg: 'from-blue-50 to-blue-100',
      afterPlaceholderIcon: 'bg-blue-200'
    },
    neutral: {
      beforeBorder: '#e5e7eb',
      beforeLabel: '#374151',
      afterBorder: `${accentColor}40`,
      afterRing: `${accentColor}20`,
      afterLabel: accentColor,
      beforePlaceholderBg: 'from-gray-100 to-gray-200',
      beforePlaceholderIcon: 'bg-gray-300',
      afterPlaceholderBg: 'from-gray-50 to-gray-100',
      afterPlaceholderIcon: 'bg-gray-200'
    }
  }[theme]);

  const themeColors = getCardColors(uiTheme);
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

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
              sectionId={sectionId}
              mode={mode}
              bodyLgStyle={bodyLgStyle}
              handleContentUpdate={handleContentUpdate}
              colorTokens={colorTokens}
              backgroundType={safeBackgroundType}
              sectionBackground={sectionBackground}
              blockContent={blockContent}
              handleImageToolbar={handleImageToolbar}
              themeColors={themeColors}
              accentColor={accentColor}
              cardStyles={cardStyles}
            />

            <div className="text-center lg:hidden">
              <div className={`inline-flex items-center space-x-2 ${cardStyles.bg} ${cardStyles.blur} rounded-full ${cardStyles.shadow} px-6 py-3`}>
                <IconEditableText
                  mode={mode}
                  value={blockContent.upgrade_icon || 'ArrowRight'}
                  onEdit={(value) => handleContentUpdate('upgrade_icon', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className={`text-lg ${cardStyles.textMuted}`}
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
              <div className={`flex flex-col items-center space-y-2 ${cardStyles.bg} ${cardStyles.blur} rounded-full ${cardStyles.shadow} px-4 py-6`}>
                <IconEditableText
                  mode={mode}
                  value={blockContent.upgrade_icon || 'ArrowRight'}
                  onEdit={(value) => handleContentUpdate('upgrade_icon', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  iconSize="md"
                  className={`text-xl ${cardStyles.textMuted}`}
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
              sectionId={sectionId}
              mode={mode}
              bodyLgStyle={bodyLgStyle}
              handleContentUpdate={handleContentUpdate}
              colorTokens={colorTokens}
              backgroundType={safeBackgroundType}
              sectionBackground={sectionBackground}
              blockContent={blockContent}
              handleImageToolbar={handleImageToolbar}
              themeColors={themeColors}
              accentColor={accentColor}
              cardStyles={cardStyles}
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
