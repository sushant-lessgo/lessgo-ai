import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface TextListTransformationContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_list: string;
  after_list: string;
  transformation_text: string;
  before_icon?: string;
  after_icon?: string;
  transformation_icon?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Transform Your Daily Challenges' 
  },
  before_label: { 
    type: 'string' as const, 
    default: 'Current Problems' 
  },
  after_label: { 
    type: 'string' as const, 
    default: 'Your New Reality' 
  },
  before_list: { 
    type: 'string' as const, 
    default: 'Spending hours on repetitive tasks|Struggling with manual data entry|Dealing with human errors and inconsistencies|Managing multiple disconnected tools|Feeling overwhelmed by growing workload' 
  },
  after_list: { 
    type: 'string' as const, 
    default: 'Automated workflows that run 24/7|Seamless data synchronization across platforms|99.9% accuracy with intelligent error detection|Unified dashboard for all your operations|Peace of mind with reliable automation' 
  },
  transformation_text: { 
    type: 'string' as const, 
    default: 'Our solution bridges the gap between where you are and where you want to be.' 
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
  before_icon: {
    type: 'string' as const,
    default: '❌'
  },
  after_icon: {
    type: 'string' as const,
    default: '✅'
  },
  transformation_icon: {
    type: 'string' as const,
    default: '➡️'
  }
};

const ListItem = React.memo(({
  text,
  type,
  mode,
  blockContent,
  handleContentUpdate,
  backgroundType,
  colorTokens,
  sectionId,
  themeColors
}: {
  text: string;
  type: 'before' | 'after';
  mode: string;
  blockContent: TextListTransformationContent;
  handleContentUpdate: (key: string, value: string) => void;
  backgroundType: any;
  colorTokens: any;
  sectionId: string;
  themeColors: any;
}) => {
  const colors = type === 'before' ? themeColors.before : themeColors.after;

  return (
    <div className="flex items-start space-x-3 group">
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${colors.iconBg} ${colors.iconBgHover} transition-colors duration-200`}>
        <IconEditableText
          mode={mode as 'preview' | 'edit'}
          value={type === 'before' ?
            (blockContent.before_icon || '❌') :
            (blockContent.after_icon || '✅')
          }
          onEdit={(value) => handleContentUpdate(type === 'before' ? 'before_icon' : 'after_icon', value)}
          backgroundType={backgroundType}
          colorTokens={colorTokens}
          iconSize="sm"
          className="text-sm"
          style={{ color: colors.iconColor }}
          sectionId={sectionId}
          elementKey={type === 'before' ? 'before_icon' : 'after_icon'}
        />
      </div>
      <p className="text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-200">
        {text}
      </p>
    </div>
  );
});
ListItem.displayName = 'ListItem';

export default function TextListTransformation(props: LayoutComponentProps) {
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
  } = useLayoutComponent<TextListTransformationContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Detect UIBlock theme - warm/cool/neutral
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Debug logging
  console.log('🎨 TextListTransformation theme:', {
    manualThemeOverride: props.manualThemeOverride,
    detectedTheme: uiTheme,
    marketCategory: props.userContext?.marketCategory,
    sectionId
  });

  // Theme-based color system for before/after lists
  const getListTransformationColors = (theme: UIBlockTheme) => ({
    warm: {
      before: {
        iconBg: 'bg-orange-100',              // Light orange for item icons
        iconBgHover: 'group-hover:bg-orange-200',
        labelDot: 'bg-orange-500',            // Dot indicator
        labelRing: 'ring-orange-100',         // Ring around dot
        labelColor: '#f97316',                // orange-500 for label text
        iconColor: '#ea580c'                  // orange-600 for icon
      },
      after: {
        iconBg: 'bg-amber-100',               // Light amber for item icons
        iconBgHover: 'group-hover:bg-amber-200',
        labelDot: 'bg-amber-500',             // Dot indicator
        labelRing: 'ring-amber-100',          // Ring around dot
        labelColor: '#f59e0b',                // amber-500 for label text
        iconColor: '#d97706'                  // amber-600 for icon
      }
    },
    cool: {
      before: {
        iconBg: 'bg-blue-100',
        iconBgHover: 'group-hover:bg-blue-200',
        labelDot: 'bg-blue-500',
        labelRing: 'ring-blue-100',
        labelColor: '#3b82f6',                // blue-500
        iconColor: '#2563eb'                  // blue-600
      },
      after: {
        iconBg: 'bg-green-100',
        iconBgHover: 'group-hover:bg-green-200',
        labelDot: 'bg-green-500',
        labelRing: 'ring-green-100',
        labelColor: '#10b981',                // green-500
        iconColor: '#16a34a'                  // green-600
      }
    },
    neutral: {
      before: {
        iconBg: 'bg-red-100',                 // Keep red for "before" in neutral
        iconBgHover: 'group-hover:bg-red-200',
        labelDot: 'bg-red-500',
        labelRing: 'ring-red-100',
        labelColor: '#ef4444',                // red-500
        iconColor: '#dc2626'                  // red-600
      },
      after: {
        iconBg: 'bg-green-100',               // Keep green for "after" in neutral
        iconBgHover: 'group-hover:bg-green-200',
        labelDot: 'bg-green-500',
        labelRing: 'ring-green-100',
        labelColor: '#10b981',                // green-500
        iconColor: '#16a34a'                  // green-600
      }
    }
  }[theme]);

  const themeColors = getListTransformationColors(uiTheme);

  const beforeItems = blockContent.before_list
    ? blockContent.before_list.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const afterItems = blockContent.after_list 
    ? blockContent.after_list.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TextListTransformation"
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
              placeholder="Add optional subheadline to introduce the transformation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 mb-12">
          
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center mb-6">
                <div className={`w-3 h-3 rounded-full mr-3 ${themeColors.before.labelDot} ring-4 ${themeColors.before.labelRing}`} />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_label || ''}
                  onEdit={(value) => handleContentUpdate('before_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    ...getTextStyle('h3'),
                    fontWeight: 600,
                    color: themeColors.before.labelColor
                  }}
                  style={h3Style}
                  sectionId={sectionId}
                  elementKey="before_label"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>

            <div className="space-y-4">
              {mode !== 'preview' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_list || ''}
                  onEdit={(value) => handleContentUpdate('before_list', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="leading-relaxed"
                  placeholder="Enter before items separated by | (pipe)"
                  sectionId={sectionId}
                  elementKey="before_list"
                  sectionBackground={sectionBackground}
                />
              ) : (
                beforeItems.map((item, index) => (
                  <ListItem
                    key={index}
                    text={item}
                    type="before"
                    mode={mode}
                    blockContent={blockContent}
                    handleContentUpdate={handleContentUpdate}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    sectionId={sectionId}
                    themeColors={themeColors}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full ${colorTokens.ctaBg} flex items-center justify-center shadow-lg`}>
                <IconEditableText
                  mode={mode}
                  value={blockContent.transformation_icon || '➡️'}
                  onEdit={(value) => handleContentUpdate('transformation_icon', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  iconSize="lg"
                  className="text-3xl text-white"
                  sectionId={sectionId}
                  elementKey="transformation_icon"
                />
              </div>
              
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.transformation_text || ''}
                onEdit={(value) => handleContentUpdate('transformation_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className={`text-center ${mutedTextColor} max-w-xs`}
                sectionId={sectionId}
                elementKey="transformation_text"
                sectionBackground={sectionBackground}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center mb-6">
                <div className={`w-3 h-3 rounded-full mr-3 ${themeColors.after.labelDot} ring-4 ${themeColors.after.labelRing}`} />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_label || ''}
                  onEdit={(value) => handleContentUpdate('after_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    ...getTextStyle('h3'),
                    fontWeight: 600,
                    color: themeColors.after.labelColor
                  }}
                  style={h3Style}
                  sectionId={sectionId}
                  elementKey="after_label"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>

            <div className="space-y-4">
              {mode !== 'preview' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_list || ''}
                  onEdit={(value) => handleContentUpdate('after_list', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="leading-relaxed"
                  placeholder="Enter after items separated by | (pipe)"
                  sectionId={sectionId}
                  elementKey="after_list"
                  sectionBackground={sectionBackground}
                />
              ) : (
                afterItems.map((item, index) => (
                  <ListItem
                    key={index}
                    text={item}
                    type="after"
                    mode={mode}
                    blockContent={blockContent}
                    handleContentUpdate={handleContentUpdate}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    sectionId={sectionId}
                    themeColors={themeColors}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100 mb-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center space-x-4">
              {[1,2,3].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full ${i === 2 ? colorTokens.ctaBg : 'bg-gray-300'}`} />
              ))}
            </div>
            
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.transformation_text || ''}
              onEdit={(value) => handleContentUpdate('transformation_text', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="font-medium max-w-2xl mx-auto"
              style={bodyLgStyle}
              sectionId={sectionId}
              elementKey="transformation_text"
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
                placeholder="Add optional supporting text to reinforce your message..."
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
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                )}

                {trustItems.length > 0 && (
                  <TrustIndicators 
                    items={trustItems}
                    colorClass={mutedTextColor}
                    iconColor="text-green-500"
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
  name: 'TextListTransformation',
  category: 'Comparison',
  description: 'Text-heavy transformation layout with bullet lists. Perfect for unaware/problem-aware audiences and pain-led copy.',
  tags: ['comparison', 'text-heavy', 'lists', 'pain-led', 'awareness'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'before_list', label: 'Before List (pipe separated)', type: 'textarea', required: true },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'after_list', label: 'After List (pipe separated)', type: 'textarea', required: true },
    { key: 'transformation_text', label: 'Transformation Text', type: 'textarea', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Clear before/after bullet point lists',
    'Central transformation arrow and messaging',
    'Text-focused for detailed explanations',
    'Perfect for early awareness stages',
    'Pain-led copy approach',
    'Comprehensive problem/solution breakdown'
  ],
  
  useCases: [
    'Detailed problem awareness building',
    'Pain-led marketing campaigns',
    'Early-stage product education',
    'Complex transformation explanations',
    'Level-1 and Level-2 market sophistication'
  ]
};