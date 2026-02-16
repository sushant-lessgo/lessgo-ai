import React from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

interface StackedTextVisualProps extends LayoutComponentProps {}

// Content interface for StackedTextVisual layout
interface StackedTextVisualContent {
  headline: string;
  before_text: string;
  after_text: string;
  before_label: string;
  after_label: string;
  transition_text?: string;
  before_icon?: string;
  after_icon?: string;
  transition_icon?: string;
  subheadline?: string;
  summary_text?: string;
}

// Content schema for StackedTextVisual layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Transform Your Experience' },
  before_text: { type: 'string' as const, default: 'Struggling with manual processes, disconnected tools, and delayed insights that slow down your progress.' },
  after_text: { type: 'string' as const, default: 'Enjoy automated workflows, unified data, and instant insights that accelerate your success.' },
  before_label: { type: 'string' as const, default: 'Before' },
  after_label: { type: 'string' as const, default: 'After' },
  transition_text: { type: 'string' as const, default: '' },
  subheadline: { type: 'string' as const, default: '' },
  summary_text: { type: 'string' as const, default: '' },
  before_icon: {
    type: 'string' as const,
    default: 'Plus'
  },
  after_icon: {
    type: 'string' as const,
    default: 'Zap'
  },
  transition_icon: {
    type: 'string' as const,
    default: 'ArrowDown'
  }
};


export default function StackedTextVisual(props: StackedTextVisualProps) {
  // ✅ Use the standard useLayoutComponent hook
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate,
    theme
  } = useLayoutComponent<StackedTextVisualContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();

  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Detect UIBlock theme - warm/cool/neutral
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get adaptive card styles
  const cardStyles = React.useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiTheme
  }), [sectionBackground, uiTheme]);

  // Get accent color for After block
  const accentColor = colorTokens.ctaBg || '#3b82f6';

  // Theme-based color system - After block uses accent color
  const getStackedColors = (theme: UIBlockTheme) => ({
    warm: {
      before: {
        bg: '#fff7ed',           // orange-50
        border: '#fb923c',       // orange-400
        iconBg: '#fed7aa',       // orange-200
        iconText: '#ea580c'      // orange-600
      },
      transition: {
        bg: '#ffedd5',           // orange-100
        text: '#ea580c'          // orange-600
      },
      after: {
        bg: `${accentColor}15`,      // light accent
        border: accentColor,          // accent
        iconBg: `${accentColor}30`,   // medium accent
        iconText: accentColor         // accent
      },
      summary: {
        gradient: 'from-orange-50 via-amber-50 to-yellow-50',
        border: 'border-orange-100'
      }
    },
    cool: {
      before: {
        bg: '#eff6ff',           // blue-50
        border: '#60a5fa',       // blue-400
        iconBg: '#bfdbfe',       // blue-200
        iconText: '#2563eb'      // blue-600
      },
      transition: {
        bg: '#dbeafe',           // blue-100
        text: '#2563eb'          // blue-600
      },
      after: {
        bg: `${accentColor}15`,      // light accent
        border: accentColor,          // accent
        iconBg: `${accentColor}30`,   // medium accent
        iconText: accentColor         // accent
      },
      summary: {
        gradient: 'from-blue-50 via-indigo-50 to-purple-50',
        border: 'border-blue-100'
      }
    },
    neutral: {
      before: {
        bg: '#f9fafb',           // gray-50
        border: '#9ca3af',       // gray-400
        iconBg: '#e5e7eb',       // gray-200
        iconText: '#6b7280'      // gray-600
      },
      transition: {
        bg: '#f3f4f6',           // gray-100
        text: '#4b5563'          // gray-600
      },
      after: {
        bg: `${accentColor}15`,      // light accent
        border: accentColor,          // accent
        iconBg: `${accentColor}30`,   // medium accent
        iconText: accentColor         // accent
      },
      summary: {
        gradient: 'from-gray-50 via-slate-50 to-zinc-50',
        border: 'border-gray-100'
      }
    }
  }[theme]);

  const themeColors = getStackedColors(uiTheme);

  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StackedTextVisual"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
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

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="mb-6 max-w-2xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce the transformation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Stacked Before/After Blocks */}
        <div className="space-y-8">
          {/* Before Block */}
          <div className="relative">
            <div
              className={`${cardStyles.bg} ${cardStyles.blur} border-l-4 rounded-lg p-8 shadow-sm`}
              style={{
                borderLeftColor: themeColors.before.border
              }}
            >
              <div className="flex items-start space-x-4">
                {/* Before Icon */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColors.before.iconBg }}
                >
                  <IconEditableText
                    mode={mode}
                    value={blockContent.before_icon || 'Plus'}
                    onEdit={(value) => handleContentUpdate('before_icon', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    iconSize="md"
                    className="text-2xl"
                    style={{ color: themeColors.before.iconText }}
                    sectionId={sectionId}
                    elementKey="before_icon"
                  />
                </div>
                
                <div className="flex-1">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.before_label || ''}
                    onEdit={(value) => handleContentUpdate('before_label', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}
                    className={`font-semibold mb-3 uppercase tracking-wide ${cardStyles.textHeading}`}
                    sectionId={sectionId}
                    elementKey="before_label"
                    sectionBackground={sectionBackground}
                  />
                  
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.before_text || ''}
                    onEdit={(value) => handleContentUpdate('before_text', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`leading-relaxed ${cardStyles.textBody}`}
                    textStyle={{ fontSize: '0.8rem' }}
                    sectionId={sectionId}
                    elementKey="before_text"
                    sectionBackground={sectionBackground}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transition Connector */}
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              {/* Arrow */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: themeColors.transition.bg }}
              >
                <IconEditableText
                  mode={mode}
                  value={blockContent.transition_icon || 'ArrowDown'}
                  onEdit={(value) => handleContentUpdate('transition_icon', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-lg"
                  style={{ color: themeColors.transition.text }}
                  sectionId={sectionId}
                  elementKey="transition_icon"
                />
              </div>
              
              {/* Optional Transition Text */}
              {(blockContent.transition_text || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.transition_text || ''}
                  onEdit={(value) => handleContentUpdate('transition_text', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm font-medium text-center px-4 py-2 rounded-full"
                  style={{ backgroundColor: themeColors.transition.bg }}
                  placeholder="Add transition text..."
                  sectionId={sectionId}
                  elementKey="transition_text"
                  sectionBackground={sectionBackground}
                />
              )}
            </div>
          </div>

          {/* After Block */}
          <div className="relative">
            <div
              className={`${cardStyles.bg} ${cardStyles.blur} border-l-4 rounded-lg p-8 shadow-sm`}
              style={{
                borderLeftColor: themeColors.after.border
              }}
            >
              <div className="flex items-start space-x-4">
                {/* After Icon */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColors.after.iconBg }}
                >
                  <IconEditableText
                    mode={mode}
                    value={blockContent.after_icon || 'Zap'}
                    onEdit={(value) => handleContentUpdate('after_icon', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    iconSize="md"
                    className="text-2xl"
                    style={{ color: themeColors.after.iconText }}
                    sectionId={sectionId}
                    elementKey="after_icon"
                  />
                </div>
                
                <div className="flex-1">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.after_label || ''}
                    onEdit={(value) => handleContentUpdate('after_label', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}
                    className={`font-semibold mb-3 uppercase tracking-wide ${cardStyles.textHeading}`}
                    sectionId={sectionId}
                    elementKey="after_label"
                    sectionBackground={sectionBackground}
                  />
                  
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.after_text || ''}
                    onEdit={(value) => handleContentUpdate('after_text', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`leading-relaxed ${cardStyles.textBody}`}
                    textStyle={{ fontSize: '0.8rem' }}
                    sectionId={sectionId}
                    elementKey="after_text"
                    sectionBackground={sectionBackground}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Summary Text */}
        {(blockContent.summary_text || mode === 'edit') && (
          <div className="mt-10 text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.summary_text || ''}
              onEdit={(value) => handleContentUpdate('summary_text', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-2xl mx-auto"
              style={getTypographyStyle('body')}
              textStyle={{ fontStyle: 'italic' }}
              placeholder="Add optional summary text..."
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
  name: 'StackedTextVisual',
  category: 'Comparison',
  description: 'Before/after comparison with adaptive text colors and visual transitions',
  tags: ['before-after', 'comparison', 'transformation', 'visual', 'adaptive-colors'],
  features: [
    'Automatic text color adaptation based on background type',
    'Editable before and after text content',
    'Visual transition connector with optional text',
    'Color-coded blocks (gray for before, green for after)',
    'Contextual icons for each state',
    'Optional subheadline for additional context'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    before_text: 'Text describing the "before" state',
    after_text: 'Text describing the "after" state',
    transition_text: 'Optional text for the transition connector',
    subheadline: 'Optional subheading for additional context'
  },
  examples: [
    'Problem to solution comparison',
    'Current state vs future state',
    'Transformation showcase',
    'Process improvement illustration'
  ]
};