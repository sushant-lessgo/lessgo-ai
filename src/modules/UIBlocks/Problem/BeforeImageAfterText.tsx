import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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

interface BeforeImageAfterTextContent {
  headline: string;
  before_description: string;
  after_description: string;
  image_caption?: string;
  problem_emphasis?: string;
  solution_preview?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  transformation_icon_1?: string;
  transformation_icon_2?: string;
  transformation_icon_3?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'From Chaos to Clarity: See the Difference' 
  },
  before_description: { 
    type: 'string' as const, 
    default: 'Scattered information, missed deadlines, endless manual work, frustrated team members, and constant firefighting. Every day feels like an uphill battle against inefficiency.' 
  },
  after_description: { 
    type: 'string' as const, 
    default: 'Streamlined workflows, automated processes, clear visibility, happy team members, and strategic focus. Every day brings measurable progress and growth.' 
  },
  image_caption: { 
    type: 'string' as const, 
    default: 'Transform your daily experience from overwhelming chaos to organized success' 
  },
  problem_emphasis: { 
    type: 'string' as const, 
    default: 'Does this look familiar? You\'re spending more time managing problems than growing your business.' 
  },
  solution_preview: { 
    type: 'string' as const, 
    default: 'Imagine having this level of organization and control in your business operations.' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  transformation_icon_1: { type: 'string' as const, default: '⚡' },
  transformation_icon_2: { type: 'string' as const, default: '✓' },
  transformation_icon_3: { type: 'string' as const, default: '💖' }
};

export default function BeforeImageAfterText(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<BeforeImageAfterTextContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const BeforeAfterImage = () => (
    <div className="relative bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
      {/* Browser/App Interface Mockup */}
      <div className="bg-gray-800 px-4 py-3 flex items-center space-x-2">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-gray-300 text-sm text-center">
          Before vs After
        </div>
      </div>
      
      {/* Split Screen Content */}
      <div className="grid grid-cols-2 min-h-[400px]">
        {/* Before Side - Chaotic */}
        <div className="bg-red-50 p-6 border-r-2 border-gray-300">
          <div className="h-full flex flex-col">
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                BEFORE
              </div>
            </div>
            
            {/* Chaotic Elements */}
            <div className="space-y-4 flex-1">
              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">Urgent Tasks</span>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">24</span>
                </div>
                <div className="text-xs text-gray-600">Overdue items pile up daily</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Team Productivity</span>
                  <span className="text-red-600 font-bold">42%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full w-2/5"></div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">Communication</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Email chains</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Slack chaos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Missed messages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* After Side - Organized */}
        <div className="bg-green-50 p-6">
          <div className="h-full flex flex-col">
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                AFTER
              </div>
            </div>
            
            {/* Organized Elements */}
            <div className="space-y-4 flex-1">
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Tasks Completed</span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">87%</span>
                </div>
                <div className="text-xs text-gray-600">Automated prioritization</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Team Productivity</span>
                  <span className="text-green-600 font-bold">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-11/12"></div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">Communication</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Centralized hub</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Auto notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Clear visibility</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Caption */}
      {blockContent.image_caption && (
        <div className="bg-gray-800 px-4 py-2 text-center">
          <p className="text-gray-300 text-sm">{blockContent.image_caption}</p>
        </div>
      )}
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="BeforeImageAfterText"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
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
              className="text-lg mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the before/after comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode !== 'preview' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Before/After Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_description || ''}
                  onEdit={(value) => handleContentUpdate('before_description', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Before description (current problems)"
                  sectionId={sectionId}
                  elementKey="before_description"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_description || ''}
                  onEdit={(value) => handleContentUpdate('after_description', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="After description (desired outcomes)"
                  sectionId={sectionId}
                  elementKey="after_description"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.image_caption || ''}
                  onEdit={(value) => handleContentUpdate('image_caption', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Image caption (optional)"
                  sectionId={sectionId}
                  elementKey="image_caption"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Visual Before/After Comparison */}
            <div className="mb-16">
              <BeforeAfterImage />
            </div>

            {/* Text Descriptions */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              
              {/* Before Text */}
              <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Your Current Reality</h3>
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {blockContent.before_description}
                </p>
                {blockContent.problem_emphasis && (
                  <div className="bg-red-100 rounded-lg p-4 border border-red-200">
                    <p className="text-red-800 font-medium text-sm">
                      {blockContent.problem_emphasis}
                    </p>
                  </div>
                )}
              </div>

              {/* After Text */}
              <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Your Ideal Future</h3>
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {blockContent.after_description}
                </p>
                {blockContent.solution_preview && (
                  <div className="bg-green-100 rounded-lg p-4 border border-green-200">
                    <p className="text-green-800 font-medium text-sm">
                      {blockContent.solution_preview}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Emotional Connection */}
            <div className="text-center bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                The Transformation is Real
              </h3>
              <p className={`text-lg ${mutedTextColor} max-w-3xl mx-auto mb-8`}>
                Thousands of businesses have already made this transformation. The question isn't whether it's possible—it's when you'll decide to make the change.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group/icon-edit relative">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.transformation_icon_1 || '⚡'}
                      onEdit={(value) => handleContentUpdate('transformation_icon_1', value)}
                      backgroundType={backgroundType as any}
                      colorTokens={{...colorTokens, textPrimary: 'text-blue-600'}}
                      iconSize="xl"
                      className="text-3xl text-blue-600"
                      sectionId={sectionId}
                      elementKey="transformation_icon_1"
                    />
                  </div>
                  <div className="font-semibold text-gray-900">Faster</div>
                  <div className={`text-sm ${mutedTextColor}`}>2.5x productivity increase</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center group/icon-edit relative">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.transformation_icon_2 || '✓'}
                      onEdit={(value) => handleContentUpdate('transformation_icon_2', value)}
                      backgroundType={backgroundType as any}
                      colorTokens={{...colorTokens, textPrimary: 'text-green-600'}}
                      iconSize="xl"
                      className="text-3xl text-green-600"
                      sectionId={sectionId}
                      elementKey="transformation_icon_2"
                    />
                  </div>
                  <div className="font-semibold text-gray-900">Smarter</div>
                  <div className={`text-sm ${mutedTextColor}`}>Data-driven decisions</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center group/icon-edit relative">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.transformation_icon_3 || '💖'}
                      onEdit={(value) => handleContentUpdate('transformation_icon_3', value)}
                      backgroundType={backgroundType as any}
                      colorTokens={{...colorTokens, textPrimary: 'text-purple-600'}}
                      iconSize="xl"
                      className="text-3xl text-purple-600"
                      sectionId={sectionId}
                      elementKey="transformation_icon_3"
                    />
                  </div>
                  <div className="font-semibold text-gray-900">Happier</div>
                  <div className={`text-sm ${mutedTextColor}`}>Stress-free operations</div>
                </div>
              </div>
            </div>
          </>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-12">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce the transformation..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
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
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'BeforeImageAfterText',
  category: 'Problem',
  description: 'Visual before/after comparison with detailed text descriptions. Perfect for showing current problems vs future solutions.',
  tags: ['before-after', 'comparison', 'visual', 'transformation', 'problems'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_description', label: 'Before Description (Current Problems)', type: 'textarea', required: true },
    { key: 'after_description', label: 'After Description (Desired Outcomes)', type: 'textarea', required: true },
    { key: 'image_caption', label: 'Image Caption', type: 'text', required: false },
    { key: 'problem_emphasis', label: 'Problem Emphasis Text', type: 'text', required: false },
    { key: 'solution_preview', label: 'Solution Preview Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive before/after visual comparison',
    'Detailed text descriptions for both states',
    'Emotional connection elements',
    'Transformation statistics display',
    'Problem emphasis and solution preview',
    'Trust and credibility indicators'
  ],
  
  useCases: [
    'Problem identification sections',
    'Current state vs future state',
    'Business transformation showcases',
    'Product improvement demonstrations',
    'Service before/after comparisons'
  ]
};