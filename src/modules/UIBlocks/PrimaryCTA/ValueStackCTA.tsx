// components/layout/ValueStackCTA.tsx
// Production-ready benefits-stacked CTA using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';
import IconEditableText from '@/components/ui/IconEditableText';
import { getRandomIconFromCategory } from '@/utils/iconMapping';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Content interface for type safety
interface ValueStackCTAContent {
  headline: string;
  subheadline?: string;
  value_propositions: string;
  value_descriptions: string;
  cta_text: string;
  secondary_cta_text?: string;
  final_cta_headline: string;
  final_cta_description: string;
  guarantee_text?: string;
  // Icon fields for value propositions
  value_icon_1?: string;
  value_icon_2?: string;
  value_icon_3?: string;
  value_icon_4?: string;
  value_icon_5?: string;
  value_icon_6?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Everything You Need to Succeed' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Get all the tools, support, and resources you need to transform your business.' 
  },
  value_propositions: { 
    type: 'string' as const, 
    default: 'Save 20+ Hours Per Week|Increase Team Productivity by 40%|Automate Repetitive Tasks|Get Real-Time Analytics|24/7 Expert Support|Seamless Integrations' 
  },
  value_descriptions: { 
    type: 'string' as const, 
    default: 'Eliminate manual work with intelligent automation workflows that handle routine tasks automatically.|Boost your team\'s efficiency with streamlined processes and collaboration tools.|Set up workflows once and let them run automatically, freeing up time for strategic work.|Track performance in real-time with comprehensive dashboards and detailed reports.|Access expert help whenever you need it with our dedicated customer success team.|Connect with 1000+ apps and tools your team already uses.' 
  },
  cta_text: {
    type: 'string' as const,
    default: 'Start Your Transformation'
  },
  secondary_cta_text: {
    type: 'string' as const,
    default: 'Watch Demo'
  },
  final_cta_headline: { 
    type: 'string' as const, 
    default: 'Ready to Get Started?' 
  },
  final_cta_description: { 
    type: 'string' as const, 
    default: 'Join thousands of businesses already transforming their operations with our platform.' 
  },
  guarantee_text: { 
    type: 'string' as const, 
    default: '30-day money-back guarantee' 
  },
  // Icon fields for value propositions
  value_icon_1: { type: 'string' as const, default: '⚡' },
  value_icon_2: { type: 'string' as const, default: '📈' },
  value_icon_3: { type: 'string' as const, default: '🤖' },
  value_icon_4: { type: 'string' as const, default: '📊' },
  value_icon_5: { type: 'string' as const, default: '🎯' },
  value_icon_6: { type: 'string' as const, default: '🔗' }
};

// Value Proposition Interface
interface ValueProp {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Parse value propositions
const parseValueProps = (titles: string, descriptions: string, content: ValueStackCTAContent): ValueProp[] => {
  const titleList = titles.split('|').map(t => t.trim()).filter(Boolean);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(Boolean);
  
  // Get icons from content schema or fallback to defaults
  const getIcon = (index: number): string => {
    const iconFields: (keyof ValueStackCTAContent)[] = [
      'value_icon_1', 'value_icon_2', 'value_icon_3', 
      'value_icon_4', 'value_icon_5', 'value_icon_6'
    ];
    const fallbackIcons = ['⚡', '📈', '🤖', '📊', '🎯', '🔗', '💡', '🚀'];
    
    return content[iconFields[index] as keyof ValueStackCTAContent] as string || fallbackIcons[index % fallbackIcons.length];
  };
  
  return titleList.map((title, index) => ({
    id: `value-${index}`,
    title,
    description: descriptionList[index] || 'No description provided.',
    icon: getIcon(index)
  }));
};

// Helper function to add a new value proposition
const addValueProp = (titles: string, descriptions: string): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(Boolean);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(Boolean);

  // Add new value proposition with default content
  titleList.push('New Value Proposition');
  descriptionList.push('Describe the unique benefit or value this feature provides to your customers.');

  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Helper function to remove a value proposition
const removeValueProp = (titles: string, descriptions: string, indexToRemove: number): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(Boolean);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(Boolean);

  // Remove the value proposition at the specified index
  if (indexToRemove >= 0 && indexToRemove < titleList.length) {
    titleList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }

  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Value Proposition Card
const ValuePropCard = React.memo(({
  valueProp,
  index,
  colorTokens,
  getTextStyle,
  mode,
  sectionId,
  backgroundType,
  sectionBackground,
  onIconEdit,
  onTitleEdit,
  onDescriptionEdit,
  onRemoveValueProp,
  canRemove = true,
  themeColors
}: {
  valueProp: ValueProp;
  index: number;
  colorTokens: any;
  getTextStyle: any;
  mode: 'edit' | 'preview';
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  onIconEdit: (index: number, value: string) => void;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemoveValueProp?: (index: number) => void;
  canRemove?: boolean;
  themeColors: any;
}) => {
  return (
    <div className={`group relative flex items-start space-x-4 p-6 bg-white rounded-xl border border-gray-200 ${themeColors.borderHover} hover:shadow-lg transition-all duration-300`}>

      {/* Icon */}
      <div className={`w-12 h-12 ${themeColors.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <IconEditableText
          mode={mode}
          value={valueProp.icon}
          onEdit={(value) => onIconEdit(index, value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          iconSize="lg"
          className="text-2xl"
          sectionId={sectionId}
          elementKey={`value_icon_${index + 1}`}
          sectionBackground={sectionBackground}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <EditableAdaptiveText
          mode={mode}
          value={valueProp.title}
          onEdit={(value) => onTitleEdit(index, value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          className="font-bold text-gray-900 mb-2 block"
          sectionId={sectionId}
          elementKey={`value_title_${index + 1}`}
          sectionBackground={sectionBackground}
          placeholder="Value proposition title"
        />
        <EditableAdaptiveText
          mode={mode}
          value={valueProp.description}
          onEdit={(value) => onDescriptionEdit(index, value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          className="text-gray-600 leading-relaxed block"
          sectionId={sectionId}
          elementKey={`value_description_${index + 1}`}
          sectionBackground={sectionBackground}
          placeholder="Value proposition description"
        />
      </div>
      
      {/* Checkmark */}
      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveValueProp && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveValueProp(index);
          }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
          title="Remove this value proposition"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});
ValuePropCard.displayName = 'ValuePropCard';

export default function ValueStackCTA(props: LayoutComponentProps) {
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
    handleContentUpdate
  } = useLayoutComponent<ValueStackCTAContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Theme detection with priority: manualThemeOverride > autoDetectedTheme > neutral
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-aware color mappings
  // Note: Checkmarks always stay green (universal trust signal)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        // Value prop cards
        iconBg: 'bg-orange-100',
        borderHover: 'hover:border-orange-300',
        // Add button
        addButtonBg: 'bg-orange-50',
        addButtonHover: 'hover:bg-orange-100',
        addButtonBorder: 'border-orange-200',
        addButtonText: 'text-orange-700',
        addButtonIcon: 'text-orange-600',
        // CTA section
        gradientFrom: 'from-orange-600',
        gradientTo: 'to-red-700',
        ctaLightText: 'text-orange-100',
        ctaButtonText: 'text-orange-600'
      },
      cool: {
        // Value prop cards
        iconBg: 'bg-blue-100',
        borderHover: 'hover:border-blue-300',
        // Add button
        addButtonBg: 'bg-blue-50',
        addButtonHover: 'hover:bg-blue-100',
        addButtonBorder: 'border-blue-200',
        addButtonText: 'text-blue-700',
        addButtonIcon: 'text-blue-600',
        // CTA section
        gradientFrom: 'from-blue-600',
        gradientTo: 'to-indigo-700',
        ctaLightText: 'text-blue-100',
        ctaButtonText: 'text-blue-600'
      },
      neutral: {
        // Value prop cards
        iconBg: 'bg-gray-100',
        borderHover: 'hover:border-gray-300',
        // Add button
        addButtonBg: 'bg-gray-50',
        addButtonHover: 'hover:bg-gray-100',
        addButtonBorder: 'border-gray-200',
        addButtonText: 'text-gray-700',
        addButtonIcon: 'text-gray-600',
        // CTA section
        gradientFrom: 'from-gray-600',
        gradientTo: 'to-gray-800',
        ctaLightText: 'text-gray-100',
        ctaButtonText: 'text-gray-600'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiBlockTheme);

  // Parse value propositions
  const valueProps = parseValueProps(blockContent.value_propositions, blockContent.value_descriptions, blockContent);

  // Icon edit handlers
  const handleIconEdit = (index: number, value: string) => {
    const iconField = `value_icon_${index + 1}` as keyof ValueStackCTAContent;
    handleContentUpdate(iconField, value);
  };

  const handleTitleEdit = (index: number, value: string) => {
    const titles = blockContent.value_propositions.split('|').map(t => t.trim());
    titles[index] = value;
    handleContentUpdate('value_propositions', titles.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.value_descriptions.split('|').map(d => d.trim());
    descriptions[index] = value;
    handleContentUpdate('value_descriptions', descriptions.join('|'));
  };

  // Handle adding a new value proposition
  const handleAddValueProp = () => {
    const { newTitles, newDescriptions } = addValueProp(blockContent.value_propositions, blockContent.value_descriptions);
    handleContentUpdate('value_propositions', newTitles);
    handleContentUpdate('value_descriptions', newDescriptions);

    // Add a smart icon for the new value proposition
    const newValuePropCount = newTitles.split('|').length;
    const iconField = `value_icon_${newValuePropCount}` as keyof ValueStackCTAContent;
    if (newValuePropCount <= 6) {
      // Use random icon from innovation category for new value props
      const defaultIcon = getRandomIconFromCategory('innovation');
      handleContentUpdate(iconField, defaultIcon);
    }
  };

  // Handle removing a value proposition
  const handleRemoveValueProp = (indexToRemove: number) => {
    const { newTitles, newDescriptions } = removeValueProp(blockContent.value_propositions, blockContent.value_descriptions, indexToRemove);
    handleContentUpdate('value_propositions', newTitles);
    handleContentUpdate('value_descriptions', newDescriptions);

    // Also clear the corresponding icon if it exists
    const iconField = `value_icon_${indexToRemove + 1}` as keyof ValueStackCTAContent;
    if (blockContent[iconField]) {
      handleContentUpdate(iconField, '');
    }
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ValueStackCTA"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {blockContent.subheadline && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-3xl mx-auto"
              style={bodyLgStyle}
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Value Propositions Grid */}
        <div className="grid gap-6 mb-12">
          {valueProps.map((valueProp, index) => (
            <ValuePropCard
              key={valueProp.id}
              valueProp={valueProp}
              index={index}
              colorTokens={colorTokens}
              getTextStyle={getTextStyle}
              mode={mode}
              sectionId={sectionId}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              sectionBackground={sectionBackground}
              onIconEdit={handleIconEdit}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onRemoveValueProp={handleRemoveValueProp}
              canRemove={valueProps.length > 1}
              themeColors={themeColors}
            />
          ))}
        </div>

        {/* Add Value Proposition Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && valueProps.length < 6 && (
          <div className="mb-12 text-center">
            <button
              onClick={handleAddValueProp}
              className={`flex items-center space-x-2 mx-auto px-4 py-3 ${themeColors.addButtonBg} ${themeColors.addButtonHover} border-2 ${themeColors.addButtonBorder} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${themeColors.addButtonIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${themeColors.addButtonText} font-medium`}>Add Value Proposition</span>
            </button>
          </div>
        )}

        {/* CTA Section */}
        <div className={`bg-gradient-to-r ${themeColors.gradientFrom} ${themeColors.gradientTo} rounded-2xl p-12 text-center text-white`}>
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.final_cta_headline || ''}
            onEdit={(value) => handleContentUpdate('final_cta_headline', value)}
            level="h3"
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
            className="font-bold mb-4"
            style={{...h2Style, fontSize: 'clamp(1.8rem, 3vw, 2rem)'}}
            sectionId={sectionId}
            elementKey="final_cta_headline"
            sectionBackground="bg-blue-600"
          />
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.final_cta_description || ''}
            onEdit={(value) => handleContentUpdate('final_cta_description', value)}
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textSecondary: themeColors.ctaLightText }}
            variant="body"
            className={`${themeColors.ctaLightText} mb-8 max-w-2xl mx-auto`}
            style={bodyLgStyle}
            sectionId={sectionId}
            elementKey="final_cta_description"
            sectionBackground="bg-blue-600"
          />
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <CTAButton
              text={blockContent.cta_text}
              colorTokens={{ ...colorTokens, ctaBg: 'bg-white', ctaText: themeColors.ctaButtonText, ctaHover: 'hover:bg-gray-100' }}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              size="large"
              sectionId={sectionId}
              elementKey="cta_text"
              onClick={createCTAClickHandler(sectionId, "cta_text")}
            />

            {/* Secondary CTA */}
            {(blockContent.secondary_cta_text && blockContent.secondary_cta_text !== '___REMOVED___' && blockContent.secondary_cta_text.trim() !== '') && (
              <CTAButton
                text={blockContent.secondary_cta_text || 'Watch Demo'}
                colorTokens={{ ...colorTokens, ctaBg: 'bg-transparent', ctaText: 'text-white', ctaHover: 'hover:bg-white/10', ctaBorder: 'border-2 border-white' }}
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                variant="outline"
                size="large"
                sectionId={sectionId}
                elementKey="secondary_cta_text"
                onClick={createCTAClickHandler(sectionId, "secondary_cta_text")}
              />
            )}

            {blockContent.guarantee_text && (
              <div className={`flex items-center space-x-2 ${themeColors.ctaLightText}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.guarantee_text || ''}
                  onEdit={(value) => handleContentUpdate('guarantee_text', value)}
                  backgroundType="primary"
                  colorTokens={{ ...colorTokens, textSecondary: themeColors.ctaLightText }}
                  variant="body"
                  className="text-sm font-medium"
                  sectionId={sectionId}
                  elementKey="guarantee_text"
                  sectionBackground="bg-blue-600"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'ValueStackCTA',
  category: 'CTA Sections',
  description: 'Benefits-stacked CTA showcasing value propositions',
  tags: ['cta', 'benefits', 'value-stack', 'features', 'conversion'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  features: [
    'Stacked value propositions',
    'Editable icons with visual picker',
    'Editable value proposition text',
    'Gradient CTA section',
    'Guarantee display',
    'Checkmark validation'
  ],
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'value_propositions', label: 'Value Proposition Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'value_descriptions', label: 'Value Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'value_icon_1', label: 'Value Icon 1', type: 'text', required: false },
    { key: 'value_icon_2', label: 'Value Icon 2', type: 'text', required: false },
    { key: 'value_icon_3', label: 'Value Icon 3', type: 'text', required: false },
    { key: 'value_icon_4', label: 'Value Icon 4', type: 'text', required: false },
    { key: 'value_icon_5', label: 'Value Icon 5', type: 'text', required: false },
    { key: 'value_icon_6', label: 'Value Icon 6', type: 'text', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'secondary_cta_text', label: 'Secondary CTA Button Text', type: 'text', required: false },
    { key: 'final_cta_headline', label: 'Final CTA Headline', type: 'text', required: true },
    { key: 'final_cta_description', label: 'Final CTA Description', type: 'textarea', required: true },
    { key: 'guarantee_text', label: 'Guarantee Text', type: 'text', required: false }
  ],
  
  useCases: [
    'Feature-rich product CTAs',
    'Service benefits showcase',
    'Comprehensive solution pitches',
    'Value-driven conversions'
  ]
};