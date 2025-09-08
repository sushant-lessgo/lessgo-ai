import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface IconCircleStepsContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  // Step icons
  step_icon_1?: string;
  step_icon_2?: string;
  step_icon_3?: string;
  step_icon_4?: string;
  step_icon_5?: string;
  step_icon_6?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // CircleStep features
  circle_feature_1_text?: string;
  circle_feature_2_text?: string;
  circle_feature_3_text?: string;
  // Summary Card fields
  summary_card_heading?: string;
  summary_card_description?: string;
  summary_stat_1_text?: string;
  summary_stat_2_text?: string;
  summary_stat_3_text?: string;
  show_circle_features?: boolean;
  show_summary_card?: boolean;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Getting Started is Simple' 
  },
  step_titles: { 
    type: 'string' as const, 
    default: 'Sign Up|Connect|Launch' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Create your free account in seconds with just your email address.|Connect your existing tools and data sources with one-click integrations.|Launch your optimized workflows and start seeing results immediately.' 
  },
  // Step icons - default to emojis that match the step themes
  step_icon_1: { 
    type: 'string' as const, 
    default: '👤' 
  },
  step_icon_2: { 
    type: 'string' as const, 
    default: '🔗' 
  },
  step_icon_3: { 
    type: 'string' as const, 
    default: '🚀' 
  },
  step_icon_4: { 
    type: 'string' as const, 
    default: '✅' 
  },
  step_icon_5: { 
    type: 'string' as const, 
    default: '⚙️' 
  },
  step_icon_6: { 
    type: 'string' as const, 
    default: '⭐' 
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
  // CircleStep features
  circle_feature_1_text: { 
    type: 'string' as const, 
    default: 'Intuitive interface' 
  },
  circle_feature_2_text: { 
    type: 'string' as const, 
    default: 'Professional results' 
  },
  circle_feature_3_text: { 
    type: 'string' as const, 
    default: 'No experience needed' 
  },
  // Summary Card fields
  summary_card_heading: { 
    type: 'string' as const, 
    default: 'Start seeing results in minutes' 
  },
  summary_card_description: { 
    type: 'string' as const, 
    default: 'Our streamlined process gets you up and running quickly with zero complexity' 
  },
  summary_stat_1_text: { 
    type: 'string' as const, 
    default: 'Under 10 minutes' 
  },
  summary_stat_2_text: { 
    type: 'string' as const, 
    default: 'No setup required' 
  },
  summary_stat_3_text: { 
    type: 'string' as const, 
    default: 'Instant results' 
  },
  show_circle_features: { 
    type: 'boolean' as const, 
    default: true 
  },
  show_summary_card: { 
    type: 'boolean' as const, 
    default: true 
  }
};

const CircleStep = React.memo(({ 
  title, 
  description, 
  index,
  colorTokens,
  mode,
  handleContentUpdate,
  blockContent,
  sectionId,
  onRemove
}: {
  title: string;
  description: string;
  index: number;
  colorTokens: any;
  mode: 'edit' | 'preview';
  handleContentUpdate: (key: keyof IconCircleStepsContent, value: any) => void;
  blockContent: IconCircleStepsContent;
  sectionId: string;
  onRemove?: () => void;
}) => {
  
  // Get step icon from content fields
  const getStepIcon = (index: number) => {
    const iconFields = [
      blockContent.step_icon_1,
      blockContent.step_icon_2, 
      blockContent.step_icon_3,
      blockContent.step_icon_4,
      blockContent.step_icon_5,
      blockContent.step_icon_6
    ];
    return iconFields[index] || '⭐';
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="text-center group">
      {/* Circle Icon */}
      <div className="relative mb-6">
        <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${getColorForIndex(index)} shadow-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl`}>
          <IconEditableText
            mode={mode}
            value={getStepIcon(index)}
            onEdit={(value) => handleContentUpdate(`step_icon_${index + 1}` as keyof IconCircleStepsContent, value)}
            backgroundType="primary"
            colorTokens={colorTokens}
            iconSize="xl"
            className="text-white text-3xl"
            placeholder="⭐"
            sectionId={sectionId}
            elementKey={`step_icon_${index + 1}`}
          />
        </div>
        
        {/* Step Number Badge */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-4 border-gray-100 flex items-center justify-center shadow-lg">
          <span className="text-gray-700 font-bold text-sm">{index + 1}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-3 relative">
        {/* Editable Step Title */}
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
              stepTitles[index] = e.currentTarget.textContent || '';
              handleContentUpdate('step_titles', stepTitles.join('|'));
            }}
            className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[32px]"
            data-placeholder="Step title"
          >
            {title}
          </div>
        ) : (
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
            {title}
          </h3>
        )}
        
        {/* Editable Step Description */}
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
              stepDescriptions[index] = e.currentTarget.textContent || '';
              handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
            }}
            className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[48px]"
            data-placeholder="Step description"
          >
            {description}
          </div>
        ) : (
          <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
            {description}
          </p>
        )}
        
        <div className="flex justify-center">
          <div className={`w-12 h-1 rounded-full bg-gradient-to-r ${getColorForIndex(index)} opacity-60`} />
        </div>
        
        {/* Remove Step Button - only in edit mode */}
        {mode === 'edit' && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10 bg-white rounded-full p-1 shadow-md"
            title="Remove this step"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});
CircleStep.displayName = 'CircleStep';

export default function IconCircleSteps(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<IconCircleStepsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  const stepTitles = blockContent.step_titles 
    ? blockContent.step_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDescriptions = blockContent.step_descriptions 
    ? blockContent.step_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const steps = stepTitles.map((title, index) => ({
    title,
    description: stepDescriptions[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="IconCircleSteps"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your simple process..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <>
          {/* Steps Grid */}
          <div className={`grid ${steps.length === 3 ? 'md:grid-cols-3' : steps.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-12 mb-16`}>
            {steps.map((step, index) => (
              <CircleStep
                key={index}
                title={step.title}
                description={step.description}
                index={index}
                colorTokens={colorTokens}
                mode={mode}
                handleContentUpdate={handleContentUpdate}
                blockContent={blockContent}
                sectionId={sectionId}
                onRemove={steps.length > 1 ? () => {
                  const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                  const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                  
                  stepTitles.splice(index, 1);
                  stepDescriptions.splice(index, 1);
                  
                  handleContentUpdate('step_titles', stepTitles.join('|'));
                  handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                } : undefined}
              />
            ))}
            
            {/* Add Step Button - only in edit mode */}
            {mode === 'edit' && steps.length < 6 && (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                    const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                    
                    stepTitles.push(`Step ${stepTitles.length + 1}`);
                    stepDescriptions.push('Add step description here');
                    
                    handleContentUpdate('step_titles', stepTitles.join('|'));
                    handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                  }}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500 transition-all duration-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                  title="Add new step"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Process Flow Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            {steps.map((_, index) => (
              <React.Fragment key={index}>
                <div className={`w-3 h-3 rounded-full ${colorTokens.ctaBg}`} />
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-300 max-w-16" />
                )}
              </React.Fragment>
            ))}
          </div>
        </>

        {/* Summary Card */}
        {blockContent.show_summary_card !== false && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 mb-12">
            <div className="text-center">
              <div className="flex justify-center items-center space-x-6 mb-4">
                {(blockContent.summary_stat_1_text && blockContent.summary_stat_1_text !== '___REMOVED___') && (
                  <div className="relative group/summary-stat-1 flex items-center space-x-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_1_text || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_1_text', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium"
                      placeholder="Summary stat 1"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="summary_stat_1_text"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('summary_stat_1_text', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/summary-stat-1:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove stat 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                {(blockContent.summary_stat_1_text && blockContent.summary_stat_1_text !== '___REMOVED___') && 
                 (blockContent.summary_stat_2_text && blockContent.summary_stat_2_text !== '___REMOVED___') && (
                  <div className="w-px h-6 bg-gray-300" />
                )}
                {(blockContent.summary_stat_2_text && blockContent.summary_stat_2_text !== '___REMOVED___') && (
                  <div className="relative group/summary-stat-2 flex items-center space-x-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_2_text || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_2_text', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium"
                      placeholder="Summary stat 2"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="summary_stat_2_text"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('summary_stat_2_text', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/summary-stat-2:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove stat 2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                {(blockContent.summary_stat_2_text && blockContent.summary_stat_2_text !== '___REMOVED___') && 
                 (blockContent.summary_stat_3_text && blockContent.summary_stat_3_text !== '___REMOVED___') && (
                  <div className="w-px h-6 bg-gray-300" />
                )}
                {(blockContent.summary_stat_3_text && blockContent.summary_stat_3_text !== '___REMOVED___') && (
                  <div className="relative group/summary-stat-3 flex items-center space-x-2">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_3_text || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_3_text', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium"
                      placeholder="Summary stat 3"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="summary_stat_3_text"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('summary_stat_3_text', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/summary-stat-3:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove stat 3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {(blockContent.summary_card_heading || mode === 'edit') && (
                <div className="relative group/summary-heading">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.summary_card_heading || ''}
                    onEdit={(value) => handleContentUpdate('summary_card_heading', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-xl font-semibold text-gray-900 mb-2"
                    placeholder="Summary heading"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="summary_card_heading"
                  />
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('summary_card_heading', '___REMOVED___');
                      }}
                      className="opacity-0 group-hover/summary-heading:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200"
                      title="Remove summary heading"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              
              {(blockContent.summary_card_description || mode === 'edit') && (
                <div className="relative group/summary-desc">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.summary_card_description || ''}
                    onEdit={(value) => handleContentUpdate('summary_card_description', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`${mutedTextColor} max-w-2xl mx-auto`}
                    placeholder="Summary description"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="summary_card_description"
                  />
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('summary_card_description', '___REMOVED___');
                      }}
                      className="opacity-0 group-hover/summary-desc:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200"
                      title="Remove summary description"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce simplicity..."
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
  name: 'IconCircleSteps',
  category: 'HowItWorks',
  description: 'Simple circular icon steps layout. Perfect for early awareness stages and founder/creator audiences.',
  tags: ['how-it-works', 'simple', 'icons', 'circles', 'friendly'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'step_titles', label: 'Step Titles (pipe separated)', type: 'text', required: true },
    { key: 'step_descriptions', label: 'Step Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'circle_feature_1_text', label: 'Circle Feature 1', type: 'text', required: false },
    { key: 'circle_feature_2_text', label: 'Circle Feature 2', type: 'text', required: false },
    { key: 'circle_feature_3_text', label: 'Circle Feature 3', type: 'text', required: false },
    { key: 'summary_card_heading', label: 'Summary Card Heading', type: 'text', required: false },
    { key: 'summary_card_description', label: 'Summary Card Description', type: 'textarea', required: false },
    { key: 'summary_stat_1_text', label: 'Summary Stat 1', type: 'text', required: false },
    { key: 'summary_stat_2_text', label: 'Summary Stat 2', type: 'text', required: false },
    { key: 'summary_stat_3_text', label: 'Summary Stat 3', type: 'text', required: false },
    { key: 'show_circle_features', label: 'Show Circle Features', type: 'boolean', required: false },
    { key: 'show_summary_card', label: 'Show Summary Card', type: 'boolean', required: false }
  ],
  
  features: [
    'Large circular icons with gradients',
    'Numbered step badges',
    'Hover animations and effects',
    'Visual process flow indicator',
    'Simple and friendly design',
    'Perfect for early awareness'
  ],
  
  useCases: [
    'Simple product onboarding',
    'Founder and creator audiences',
    'Early awareness stage users',
    'Problem-aware prospects',
    'Friendly/helpful tone products'
  ]
};