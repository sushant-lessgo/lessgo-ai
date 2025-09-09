import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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

interface ZigzagImageStepsContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  step_visuals?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Creative Flow Summary fields
  flow_summary_heading?: string;
  flow_feature_1_icon?: string;
  flow_feature_1_text?: string;
  flow_feature_2_icon?: string;
  flow_feature_2_text?: string;
  flow_feature_3_icon?: string;
  flow_feature_3_text?: string;
  flow_summary_description?: string;
  show_flow_summary?: boolean;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Your Creative Journey, Step by Step' 
  },
  step_titles: { 
    type: 'string' as const, 
    default: 'Discover & Inspire|Design & Create|Refine & Perfect|Share & Collaborate' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Explore our vast library of templates, designs, and inspiration from creators worldwide to spark your creativity.|Use our intuitive design tools to bring your vision to life with drag-and-drop simplicity and professional features.|Polish your creation with advanced editing tools, filters, and effects until it\'s exactly what you envisioned.|Share your masterpiece with the community and collaborate with other creators to take your work even further.' 
  },
  step_visuals: { 
    type: 'string' as const, 
    default: '/step-discover.jpg|/step-design.jpg|/step-refine.jpg|/step-share.jpg' 
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
  // Creative Flow Summary fields
  flow_summary_heading: { 
    type: 'string' as const, 
    default: 'Unleash Your Creative Potential' 
  },
  flow_feature_1_icon: { 
    type: 'string' as const, 
    default: '💖' 
  },
  flow_feature_1_text: { 
    type: 'string' as const, 
    default: 'Creative freedom' 
  },
  flow_feature_2_icon: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  flow_feature_2_text: { 
    type: 'string' as const, 
    default: 'Professional quality' 
  },
  flow_feature_3_icon: { 
    type: 'string' as const, 
    default: '👥' 
  },
  flow_feature_3_text: { 
    type: 'string' as const, 
    default: 'Community driven' 
  },
  flow_summary_description: { 
    type: 'string' as const, 
    default: 'Join thousands of creators who\'ve transformed their ideas into stunning visual content' 
  },
  show_flow_summary: { 
    type: 'boolean' as const, 
    default: true 
  }
};


const ZigzagStep = React.memo(({ 
  title, 
  description, 
  visual,
  index,
  isEven,
  showImageToolbar,
  sectionId,
  mode,
  handleContentUpdate,
  blockContent,
  onRemove
}: {
  title: string;
  description: string;
  visual?: string;
  index: number;
  isEven: boolean;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
  handleContentUpdate: (key: keyof ZigzagImageStepsContent, value: any) => void;
  blockContent: ZigzagImageStepsContent;
  onRemove?: () => void;
}) => {
  
  const VisualPlaceholder = () => (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-50 to-purple-100">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/50 flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">{index + 1}</span>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">
            Step {index + 1} Visual
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:direction-rtl'}`}>
      
      {/* Content */}
      <div className={`space-y-6 ${isEven ? 'lg:order-1' : 'lg:order-2'} group`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-pink-600 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg drop-shadow-sm">{index + 1}</span>
          </div>
          <div className="flex-1 relative">
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
                className="text-2xl font-bold text-gray-900 mb-4 outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[40px]"
                data-placeholder="Step title"
              >
                {title}
              </div>
            ) : (
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
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
                className="text-gray-600 leading-relaxed text-lg outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[60px]"
                data-placeholder="Step description"
              >
                {description}
              </div>
            ) : (
              <p className="text-gray-600 leading-relaxed text-lg">
                {description}
              </p>
            )}
            
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
        
        <div className="pl-16 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-pink-500" />
            <span className="text-gray-600 text-sm">Intuitive interface</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-gray-600 text-sm">Professional results</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-pink-500" />
            <span className="text-gray-600 text-sm">No experience needed</span>
          </div>
        </div>
      </div>

      {/* Visual */}
      <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
        {visual && visual !== '' ? (
          <img
            src={visual}
            alt={title}
            className="w-full h-80 object-cover rounded-2xl shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow duration-300"
            data-image-id={`${sectionId}-step${index}-visual`}
            onMouseUp={(e) => {
              // Image toolbar is only available in edit mode
            }}
          />
        ) : (
          <VisualPlaceholder />
        )}
      </div>
    </div>
  );
});
ZigzagStep.displayName = 'ZigzagStep';

export default function ZigzagImageSteps(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<ZigzagImageStepsContent>({
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

  const stepVisuals = blockContent.step_visuals 
    ? blockContent.step_visuals.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const steps = stepTitles.map((title, index) => ({
    title: title || (mode === 'edit' ? `Step ${index + 1}` : ''), // Fallback for empty titles in edit mode
    description: stepDescriptions[index] || '',
    visual: stepVisuals[index] || '',
    originalIndex: index // Keep track of original index for proper data updates
  })).filter(step => step.title.trim() !== '' || mode === 'edit'); // Show empty steps in edit mode

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  // Icon edit handlers
  const handleFlowFeatureIconEdit = (index: number, value: string) => {
    const iconField = `flow_feature_${index + 1}_icon` as keyof ZigzagImageStepsContent;
    handleContentUpdate(iconField, value);
  };

  const getFlowFeatureIcon = (index: number): string => {
    const iconFields = ['flow_feature_1_icon', 'flow_feature_2_icon', 'flow_feature_3_icon'];
    return (blockContent[iconFields[index] as keyof ZigzagImageStepsContent] as string) || (['💖', '⚡', '👥'][index] as string);
  };
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ZigzagImageSteps"
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
              placeholder="Add optional subheadline to introduce your creative journey..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="space-y-24">
          {steps.map((step, displayIndex) => (
            <ZigzagStep
              key={step.originalIndex}
              title={step.title}
              description={step.description}
              visual={step.visual}
              index={step.originalIndex}
              isEven={displayIndex % 2 === 0}
              showImageToolbar={showImageToolbar}
              sectionId={sectionId}
              mode={mode}
              handleContentUpdate={handleContentUpdate}
              blockContent={blockContent}
              onRemove={steps.length > 1 ? () => {
                const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                const stepVisuals = blockContent.step_visuals ? blockContent.step_visuals.split('|') : [];
                
                stepTitles.splice(step.originalIndex, 1);
                stepDescriptions.splice(step.originalIndex, 1);
                stepVisuals.splice(step.originalIndex, 1);
                
                handleContentUpdate('step_titles', stepTitles.join('|'));
                handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                handleContentUpdate('step_visuals', stepVisuals.join('|'));
              } : undefined}
            />
          ))}
          
          {/* Add Step Button - only in edit mode */}
          {mode === 'edit' && steps.length < 6 && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                  const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                  const stepVisuals = blockContent.step_visuals ? blockContent.step_visuals.split('|') : [];
                  
                  stepTitles.push(`Step ${stepTitles.length + 1}`);
                  stepDescriptions.push('Add step description here');
                  stepVisuals.push('');
                  
                  handleContentUpdate('step_titles', stepTitles.join('|'));
                  handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                  handleContentUpdate('step_visuals', stepVisuals.join('|'));
                }}
                className="px-6 py-3 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600 transition-all duration-300 flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-2xl"
                title="Add new step"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add Step</span>
              </button>
            </div>
          )}
        </div>

        {/* Creative Flow Summary */}
        {blockContent.show_flow_summary !== false && (
          <div className="mt-16 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 rounded-2xl p-8 border border-pink-100">
            <div className="text-center">
              {(blockContent.flow_summary_heading || mode === 'edit') && (
                <div className="relative group/summary-heading">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.flow_summary_heading || ''}
                    onEdit={(value) => handleContentUpdate('flow_summary_heading', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-xl font-semibold text-gray-900 mb-6"
                    placeholder="Summary heading"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="flow_summary_heading"
                  />
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('flow_summary_heading', '___REMOVED___');
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
              
              <div className="flex justify-center items-center space-x-6 mb-4">
                {(blockContent.flow_feature_1_text && blockContent.flow_feature_1_text !== '___REMOVED___') && (
                  <div className="relative group/feature-1 flex items-center space-x-2">
                    <IconEditableText
                      mode={mode}
                      value={getFlowFeatureIcon(0)}
                      onEdit={(value) => handleFlowFeatureIconEdit(0, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      iconSize="sm"
                      className="text-xl text-pink-600"
                      sectionId={sectionId}
                      elementKey="flow_feature_1_icon"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.flow_feature_1_text || ''}
                      onEdit={(value) => handleContentUpdate('flow_feature_1_text', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium"
                      placeholder="Feature 1"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="flow_feature_1_text"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('flow_feature_1_text', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/feature-1:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove feature 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {(blockContent.flow_feature_1_text && blockContent.flow_feature_1_text !== '___REMOVED___') && 
                 (blockContent.flow_feature_2_text && blockContent.flow_feature_2_text !== '___REMOVED___') && (
                  <div className="w-px h-6 bg-gray-300" />
                )}
                
                {(blockContent.flow_feature_2_text && blockContent.flow_feature_2_text !== '___REMOVED___') && (
                  <div className="relative group/feature-2 flex items-center space-x-2">
                    <IconEditableText
                      mode={mode}
                      value={getFlowFeatureIcon(1)}
                      onEdit={(value) => handleFlowFeatureIconEdit(1, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      iconSize="sm"
                      className="text-xl text-purple-600"
                      sectionId={sectionId}
                      elementKey="flow_feature_2_icon"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.flow_feature_2_text || ''}
                      onEdit={(value) => handleContentUpdate('flow_feature_2_text', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium"
                      placeholder="Feature 2"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="flow_feature_2_text"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('flow_feature_2_text', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/feature-2:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove feature 2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {(blockContent.flow_feature_2_text && blockContent.flow_feature_2_text !== '___REMOVED___') && 
                 (blockContent.flow_feature_3_text && blockContent.flow_feature_3_text !== '___REMOVED___') && (
                  <div className="w-px h-6 bg-gray-300" />
                )}
                
                {(blockContent.flow_feature_3_text && blockContent.flow_feature_3_text !== '___REMOVED___') && (
                  <div className="relative group/feature-3 flex items-center space-x-2">
                    <IconEditableText
                      mode={mode}
                      value={getFlowFeatureIcon(2)}
                      onEdit={(value) => handleFlowFeatureIconEdit(2, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      iconSize="sm"
                      className="text-xl text-indigo-600"
                      sectionId={sectionId}
                      elementKey="flow_feature_3_icon"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.flow_feature_3_text || ''}
                      onEdit={(value) => handleContentUpdate('flow_feature_3_text', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium"
                      placeholder="Feature 3"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="flow_feature_3_text"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('flow_feature_3_text', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/feature-3:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove feature 3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {(blockContent.flow_summary_description || mode === 'edit') && (
                <div className="relative group/summary-desc">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.flow_summary_description || ''}
                    onEdit={(value) => handleContentUpdate('flow_summary_description', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`${mutedTextColor} max-w-2xl mx-auto`}
                    placeholder="Summary description"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="flow_summary_description"
                  />
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('flow_summary_description', '___REMOVED___');
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
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your creative process..."
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
  name: 'ZigzagImageSteps',
  category: 'HowItWorks',
  description: 'Alternating zigzag layout with large images. Perfect for creative tools and visual storytelling.',
  tags: ['how-it-works', 'zigzag', 'visual', 'creative', 'images'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'step_titles', label: 'Step Titles (pipe separated)', type: 'text', required: true },
    { key: 'step_descriptions', label: 'Step Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'step_visuals', label: 'Step Visuals (pipe separated)', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'flow_summary_heading', label: 'Flow Summary Heading', type: 'text', required: false },
    { key: 'flow_feature_1_text', label: 'Flow Feature 1 Text', type: 'text', required: false },
    { key: 'flow_feature_2_text', label: 'Flow Feature 2 Text', type: 'text', required: false },
    { key: 'flow_feature_3_text', label: 'Flow Feature 3 Text', type: 'text', required: false },
    { key: 'flow_summary_description', label: 'Flow Summary Description', type: 'textarea', required: false },
    { key: 'show_flow_summary', label: 'Show Flow Summary', type: 'boolean', required: false }
  ],
  
  features: [
    'Alternating zigzag layout pattern',
    'Large visual content emphasis',
    'Creative gradient styling',
    'Perfect for visual storytelling',
    'Founder and creator friendly',
    'Engaging visual flow'
  ],
  
  useCases: [
    'Creative and design tools',
    'Visual content platforms',
    'Founder and creator audiences',
    'Solution-aware prospects',
    'Creative workflow demonstrations'
  ]
};