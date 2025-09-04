import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useImageToolbar } from '@/hooks/useImageToolbar';
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

interface BeforeImageAfterTextContent {
  headline: string;
  before_description: string;
  after_description: string;
  before_after_image?: string;
  image_caption?: string;
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
    default: '' 
  },
  before_description: { 
    type: 'string' as const, 
    default: '' 
  },
  after_description: { 
    type: 'string' as const, 
    default: '' 
  },
  before_after_image: {
    type: 'string' as const,
    default: ''
  },
  image_caption: { 
    type: 'string' as const, 
    default: '' 
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

  // Use image toolbar hook for image editing
  const handleImageToolbar = useImageToolbar();

  // Get reactive image URL directly from store for real-time updates
  const store = useEditStore();
  const imageUrl = store.content[sectionId]?.elements?.before_after_image?.content;
  const reactiveImage = (typeof imageUrl === 'string' ? imageUrl : blockContent.before_after_image) as string;

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
            {/* Image Upload/Preview Section */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Before/After Image</h4>
              <div className="relative">
                {reactiveImage && reactiveImage !== '' ? (
                  <div className="relative">
                    <img
                      src={reactiveImage}
                      alt={blockContent.image_caption || 'Before and After Comparison'}
                      className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-300 cursor-pointer"
                      data-image-id={`${sectionId}-before-after-image`}
                      onMouseUp={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleImageToolbar(`${sectionId}.before_after_image`, {
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
                      Click image to edit
                    </div>
                  </div>
                ) : (
                  <div 
                    className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleImageToolbar(`${sectionId}.before_after_image`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }}
                  >
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600 mb-1">Click to upload before/after image</p>
                    <p className="text-xs text-gray-500">Recommended: Split image showing before & after states</p>
                  </div>
                )}
              </div>
            </div>

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
          <div className="space-y-12">
            {/* Visual Before/After Comparison */}
            {reactiveImage && reactiveImage !== '' ? (
              <div className="relative w-full">
                <img
                  src={reactiveImage}
                  alt={blockContent.image_caption || 'Before and After Comparison'}
                  className="w-full h-auto rounded-2xl shadow-lg cursor-pointer"
                  data-image-id={`${sectionId}-before-after-image`}
                  onMouseUp={(e) => {
                    if (mode !== 'preview') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleImageToolbar(`${sectionId}.before_after_image`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                  onClick={(e) => {
                    if (mode !== 'preview') {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                  }}
                />
                {blockContent.image_caption && (
                  <div className="mt-4 text-center">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.image_caption}
                      onEdit={(value) => handleContentUpdate('image_caption', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm"
                      sectionId={sectionId}
                      elementKey="image_caption"
                      sectionBackground={sectionBackground}
                    />
                  </div>
                )}
              </div>
            ) : mode !== 'preview' ? (
              <div className="bg-gray-100 rounded-2xl p-12 text-center">
                <p className="text-gray-500">No image uploaded yet. Click to add a before/after comparison image.</p>
              </div>
            ) : (
              <BeforeAfterImage />
            )}

            {/* Before/After Descriptions */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Before Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Before</h3>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_description || ''}
                  onEdit={(value) => handleContentUpdate('before_description', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-700 leading-relaxed"
                  sectionId={sectionId}
                  elementKey="before_description"
                  sectionBackground={sectionBackground}
                />
              </div>

              {/* After Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">After</h3>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_description || ''}
                  onEdit={(value) => handleContentUpdate('after_description', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-700 leading-relaxed"
                  sectionId={sectionId}
                  elementKey="after_description"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        )}

        {/* Supporting Text and Trust Items - shown in both modes */}
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
    { key: 'before_after_image', label: 'Before/After Comparison Image', type: 'image', required: false },
    { key: 'before_description', label: 'Before Description (Current Problems)', type: 'textarea', required: true },
    { key: 'after_description', label: 'After Description (Desired Outcomes)', type: 'textarea', required: true },
    { key: 'image_caption', label: 'Image Caption', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Editable before/after image',
    'Side-by-side before/after descriptions',
    'Optional supporting text',
    'Trust and credibility indicators',
    'Clean, simple layout'
  ],
  
  useCases: [
    'Problem identification sections',
    'Current state vs future state',
    'Business transformation showcases',
    'Product improvement demonstrations',
    'Service before/after comparisons'
  ]
};