import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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

// V2 clean array interfaces
interface PointItem {
  id: string;
  text: string;
}

// Content interface
interface SideBySideContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_description?: string;
  after_description?: string;
  before_icon?: string;
  after_icon?: string;
  subheadline?: string;
  summary_text?: string;
  before_points?: PointItem[];
  after_points?: PointItem[];
}

// Content schema
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Your Transformation Story' },
  before_label: { type: 'string' as const, default: 'Before' },
  after_label: { type: 'string' as const, default: 'After' },
  before_description: { type: 'string' as const, default: '' },
  after_description: { type: 'string' as const, default: '' },
  subheadline: { type: 'string' as const, default: '' },
  summary_text: { type: 'string' as const, default: '' },
  before_points: { type: 'array' as const, default: [] },
  after_points: { type: 'array' as const, default: [] },
  before_icon: { type: 'string' as const, default: 'XCircle' },
  after_icon: { type: 'string' as const, default: 'CheckCircle' }
};

export default function SideBySideBlocks(props: LayoutComponentProps) {
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
  } = useLayoutComponent<SideBySideContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const bodyLgStyle = getTypographyStyle('body-lg');

  // Detect UIBlock theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get accent color for After card (light tint)
  const accentColor = colorTokens.ctaBg || '#3b82f6';
  const accentColorLight = `${accentColor}15`; // 15% opacity for bg
  const accentColorMedium = `${accentColor}40`; // 40% opacity for border

  // Theme colors - Before=muted gray, After=light accent
  const getCardColors = (theme: UIBlockTheme) => ({
    warm: {
      before: {
        bg: '#fef2f2',
        border: '#fecaca',
        labelColor: '#dc2626',
        pointIcon: 'XCircle'
      },
      after: {
        bg: accentColorLight,
        border: accentColorMedium,
        labelColor: accentColor,
        pointIcon: 'CheckCircle'
      },
      arrow: '#f97316'
    },
    cool: {
      before: {
        bg: '#fef2f2',
        border: '#fecaca',
        labelColor: '#dc2626',
        pointIcon: 'XCircle'
      },
      after: {
        bg: accentColorLight,
        border: accentColorMedium,
        labelColor: accentColor,
        pointIcon: 'CheckCircle'
      },
      arrow: accentColor
    },
    neutral: {
      before: {
        bg: '#f9fafb',
        border: '#d1d5db',
        labelColor: '#6b7280',
        pointIcon: 'XCircle'
      },
      after: {
        bg: accentColorLight,
        border: accentColorMedium,
        labelColor: accentColor,
        pointIcon: 'CheckCircle'
      },
      arrow: accentColor
    }
  }[theme]);

  const themeColors = getCardColors(uiTheme);

  // Parse points from V2 clean arrays
  const beforePoints = (blockContent.before_points || []).map((item: any) =>
    typeof item === 'string' ? { id: `bp${Date.now()}`, text: item } : item
  ).filter((item: any) => item.text && item.text.trim() !== '');

  const afterPoints = (blockContent.after_points || []).map((item: any) =>
    typeof item === 'string' ? { id: `ap${Date.now()}`, text: item } : item
  ).filter((item: any) => item.text && item.text.trim() !== '');

  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  // Helper to render point items
  const renderPointItem = (point: PointItem, index: number, isAfter: boolean) => {
    const icon = isAfter ? themeColors.after.pointIcon : themeColors.before.pointIcon;
    const iconColor = isAfter ? themeColors.after.labelColor : themeColors.before.labelColor;

    return (
      <div key={point.id} className="flex items-start gap-2 group/point relative">
        <span style={{ color: iconColor }} className="flex-shrink-0 mt-0.5">{icon}</span>
        {mode === 'edit' ? (
          <input
            type="text"
            value={point.text}
            onChange={(e) => {
              const points = isAfter ? blockContent.after_points || [] : blockContent.before_points || [];
              const updatedPoints = points.map((p: any, i: number) =>
                i === index ? { ...p, text: e.target.value } : p
              );
              (handleContentUpdate as any)(isAfter ? 'after_points' : 'before_points', updatedPoints);
            }}
            className="flex-1 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
            style={{ color: dynamicTextColors?.body || colorTokens.textPrimary }}
          />
        ) : (
          <span style={{ color: dynamicTextColors?.body || colorTokens.textPrimary }}>{point.text}</span>
        )}
        {mode === 'edit' && (
          <button
            onClick={() => {
              const points = isAfter ? blockContent.after_points || [] : blockContent.before_points || [];
              const updatedPoints = points.filter((_: any, i: number) => i !== index);
              (handleContentUpdate as any)(isAfter ? 'after_points' : 'before_points', updatedPoints);
            }}
            className="opacity-0 group-hover/point:opacity-100 text-red-500 hover:text-red-700 text-xs"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SideBySideBlocks"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
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

        {/* Side by Side Cards - Always horizontal (3 columns: Before | Arrow | After) */}
        <div
          className="grid gap-2 sm:gap-4 md:gap-6 items-stretch"
          style={{ gridTemplateColumns: '1fr auto 1fr' }}
        >
          {/* Before Card */}
          <div className="group min-w-0">
            <div
              className="rounded-xl p-4 sm:p-6 md:p-8 border-2 h-full transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundColor: themeColors.before.bg,
                borderColor: themeColors.before.border,
                borderStyle: 'dashed'
              }}
            >
              {/* Label + Icon */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <IconEditableText
                  mode={mode}
                  value={blockContent.before_icon || 'XCircle'}
                  onEdit={(value) => handleContentUpdate('before_icon', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-lg sm:text-xl"
                  sectionId={sectionId}
                  elementKey="before_icon"
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_label || 'Before'}
                  onEdit={(value) => handleContentUpdate('before_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: themeColors.before.labelColor
                  }}
                  className="text-base sm:text-lg"
                  sectionId={sectionId}
                  elementKey="before_label"
                  sectionBackground={sectionBackground}
                />
              </div>

              {/* Description */}
              {(blockContent.before_description || (beforePoints.length === 0 && mode === 'edit')) && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_description || ''}
                  onEdit={(value) => handleContentUpdate('before_description', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base"
                  placeholder="Describe the problem state..."
                  sectionId={sectionId}
                  elementKey="before_description"
                  sectionBackground={sectionBackground}
                />
              )}

              {/* Pain Points List */}
              {(beforePoints.length > 0 || mode === 'edit') && (
                <div className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                  {beforePoints.map((point, index) => renderPointItem(point, index, false))}

                  {mode === 'edit' && beforePoints.length < 5 && (() => {
                    const addButtonColor = { warm: 'text-orange-600 hover:text-orange-800', cool: 'text-blue-600 hover:text-blue-800', neutral: 'text-gray-600 hover:text-gray-800' }[uiTheme];
                    return (
                      <button
                        onClick={() => {
                          const points = blockContent.before_points || [];
                          (handleContentUpdate as any)('before_points', [
                            ...points,
                            { id: `bp${Date.now()}`, text: 'Pain point...' }
                          ]);
                        }}
                        className={`text-xs sm:text-sm ${addButtonColor} flex items-center gap-1 mt-2`}
                      >
                        <span>+</span> Add point
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Transformation Arrow - Always visible */}
          <div className="flex items-center justify-center px-2 sm:px-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8"
              style={{ color: themeColors.arrow }}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h15" />
            </svg>
          </div>

          {/* After Card */}
          <div className="group min-w-0">
            <div
              className="rounded-xl p-4 sm:p-6 md:p-8 border-2 h-full transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundColor: themeColors.after.bg,
                borderColor: themeColors.after.border,
                borderStyle: 'solid'
              }}
            >
              {/* Label + Icon */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <IconEditableText
                  mode={mode}
                  value={blockContent.after_icon || 'CheckCircle'}
                  onEdit={(value) => handleContentUpdate('after_icon', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-lg sm:text-xl"
                  sectionId={sectionId}
                  elementKey="after_icon"
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_label || 'After'}
                  onEdit={(value) => handleContentUpdate('after_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: themeColors.after.labelColor
                  }}
                  className="text-base sm:text-lg"
                  sectionId={sectionId}
                  elementKey="after_label"
                  sectionBackground={sectionBackground}
                />
              </div>

              {/* Description */}
              {(blockContent.after_description || (afterPoints.length === 0 && mode === 'edit')) && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_description || ''}
                  onEdit={(value) => handleContentUpdate('after_description', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base"
                  placeholder="Describe the success state..."
                  sectionId={sectionId}
                  elementKey="after_description"
                  sectionBackground={sectionBackground}
                />
              )}

              {/* Benefits List */}
              {(afterPoints.length > 0 || mode === 'edit') && (
                <div className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                  {afterPoints.map((point, index) => renderPointItem(point, index, true))}

                  {mode === 'edit' && afterPoints.length < 5 && (() => {
                    const addButtonColor = { warm: 'text-orange-600 hover:text-orange-800', cool: 'text-blue-600 hover:text-blue-800', neutral: 'text-gray-600 hover:text-gray-800' }[uiTheme];
                    return (
                      <button
                        onClick={() => {
                          const points = blockContent.after_points || [];
                          (handleContentUpdate as any)('after_points', [
                            ...points,
                            { id: `ap${Date.now()}`, text: 'Benefit...' }
                          ]);
                        }}
                        className={`text-xs sm:text-sm ${addButtonColor} flex items-center gap-1 mt-2`}
                      >
                        <span>+</span> Add benefit
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Text - Optional transition copy below cards */}
        {(blockContent.summary_text || mode === 'edit') && (
          <div className="text-center mt-8 sm:mt-12">
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

// Export metadata
export const componentMeta = {
  name: 'SideBySideBlocks',
  category: 'Comparison',
  description: 'Before/After comparison with visual contrast and transformation arrow. Before=muted, After=accent-tinted.',
  tags: ['comparison', 'before-after', 'transformation', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'before_description', label: 'Before Description', type: 'textarea', required: false },
    { key: 'after_description', label: 'After Description', type: 'textarea', required: false },
    { key: 'before_points', label: 'Pain Points (array)', type: 'array', required: false },
    { key: 'after_points', label: 'Benefits (array)', type: 'array', required: false },
    { key: 'summary_text', label: 'Summary Text', type: 'textarea', required: false }
  ],

  features: [
    'Visual contrast: Before=muted/dashed, After=accent/solid',
    'Transformation arrow between cards',
    'Always horizontal layout (mobile + desktop)',
    'Support for multiple pain points and benefits',
    'Optional summary text below cards',
    'Theme-aware accent colors'
  ],

  useCases: [
    'Product comparison showing old vs new',
    'Service transformation highlighting improvements',
    'Process optimization showing efficiency gains',
    'Customer journey before and after'
  ]
};
