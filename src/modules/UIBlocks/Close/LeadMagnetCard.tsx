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
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import { LayoutComponentProps } from '@/types/storeTypes';

interface LeadMagnetCardContent {
  headline: string;
  magnet_title: string;
  magnet_description: string;
  magnet_benefits: string;
  magnet_format: string;
  cta_text: string;
  privacy_text?: string;
  social_proof?: string;
  magnet_preview?: string;
  delivery_method?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
  benefits_label?: string;
  instant_access_title?: string;
  instant_access_description?: string;
  free_title?: string;
  free_description?: string;
  privacy_title?: string;
  privacy_description?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Get Your Free Resource' 
  },
  magnet_title: { 
    type: 'string' as const, 
    default: 'The Complete Guide to Business Automation' 
  },
  magnet_description: { 
    type: 'string' as const, 
    default: 'Discover the exact strategies we used to automate 80% of our business processes and increase productivity by 300%.' 
  },
  magnet_benefits: { 
    type: 'string' as const, 
    default: 'Step-by-step automation roadmap|10 ready-to-use workflow templates|Productivity tools comparison chart|Case studies from real businesses|Implementation timeline and checklist' 
  },
  magnet_format: { 
    type: 'string' as const, 
    default: '47-page PDF Guide' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Download Free Guide' 
  },
  privacy_text: { 
    type: 'string' as const, 
    default: 'We respect your privacy. Unsubscribe at any time.' 
  },
  social_proof: { 
    type: 'string' as const, 
    default: 'Downloaded by 10,000+ business owners' 
  },
  magnet_preview: { 
    type: 'string' as const, 
    default: 'Chapter 1: Foundation of Automation|Chapter 2: Tools and Technology|Chapter 3: Implementation Strategy|Chapter 4: Measuring Success|Bonus: Templates & Checklists' 
  },
  delivery_method: { 
    type: 'string' as const, 
    default: 'Instant download - delivered to your email' 
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
  trust_item_1: { 
    type: 'string' as const, 
    default: 'No spam, ever' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'Instant download' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: 'Unsubscribe anytime' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_item_5: { 
    type: 'string' as const, 
    default: '' 
  },
  benefits_label: { 
    type: 'string' as const, 
    default: 'You\'ll get:' 
  },
  instant_access_title: { 
    type: 'string' as const, 
    default: 'Instant Access' 
  },
  instant_access_description: { 
    type: 'string' as const, 
    default: 'Download immediately' 
  },
  free_title: { 
    type: 'string' as const, 
    default: '100% Free' 
  },
  free_description: { 
    type: 'string' as const, 
    default: 'No hidden costs' 
  },
  privacy_title: { 
    type: 'string' as const, 
    default: 'Privacy Protected' 
  },
  privacy_description: { 
    type: 'string' as const, 
    default: 'We never spam' 
  }
};

export default function LeadMagnetCard(props: LayoutComponentProps) {
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
  } = useLayoutComponent<LeadMagnetCardContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const benefits = blockContent.magnet_benefits 
    ? blockContent.magnet_benefits.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const previewChapters = blockContent.magnet_preview 
    ? blockContent.magnet_preview.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  // Handle trust items - support both legacy pipe-separated format and individual fields
  const getTrustItems = (): string[] => {
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2, 
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    return blockContent.trust_items 
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : [];
  };
  
  const trustItems = getTrustItems();

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getMagnetIcon = () => {
    const format = blockContent.magnet_format.toLowerCase();
    
    if (format.includes('pdf') || format.includes('guide') || format.includes('ebook')) {
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    
    if (format.includes('video') || format.includes('course')) {
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    
    if (format.includes('template') || format.includes('worksheet')) {
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    }
    
    // Default checklist icon
    return (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    );
  };
  
  // Add safe background type to prevent type errors
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LeadMagnetCard"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
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
              className="mb-8 max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce the lead magnet..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Lead Magnet Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.magnet_title || ''}
                  onEdit={(value) => handleContentUpdate('magnet_title', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Lead magnet title"
                  sectionId={sectionId}
                  elementKey="magnet_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.magnet_description || ''}
                  onEdit={(value) => handleContentUpdate('magnet_description', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Lead magnet description"
                  sectionId={sectionId}
                  elementKey="magnet_description"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.magnet_benefits || ''}
                  onEdit={(value) => handleContentUpdate('magnet_benefits', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Benefits (pipe separated)"
                  sectionId={sectionId}
                  elementKey="magnet_benefits"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.magnet_format || ''}
                  onEdit={(value) => handleContentUpdate('magnet_format', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Format (e.g., PDF, Video, Template)"
                  sectionId={sectionId}
                  elementKey="magnet_format"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            
            {/* Lead Magnet Card */}
            <div className="grid lg:grid-cols-2 gap-0">
              
              {/* Visual/Preview Side */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 lg:p-12 text-white flex flex-col justify-center">
                <div className="text-center">
                  
                  {/* Format Badge */}
                  <div className="inline-block bg-white bg-opacity-20 rounded-full px-4 py-2 text-sm font-semibold mb-6">
                    {blockContent.magnet_format}
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-8 flex justify-center opacity-90">
                    {getMagnetIcon()}
                  </div>
                  
                  {/* Social Proof */}
                  {(blockContent.social_proof || mode !== 'preview') && (
                    <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6 relative group/social-proof">
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <EditableAdaptiveText
                          mode={mode}
                          value={blockContent.social_proof || ''}
                          onEdit={(value) => handleContentUpdate('social_proof', value)}
                          backgroundType={safeBackgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-sm font-medium"
                          placeholder="Downloaded by 10,000+ business owners"
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key="social_proof"
                        />
                      </div>
                      
                      {/* Remove button for social proof */}
                      {mode !== 'preview' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate('social_proof', '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/social-proof:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                          title="Remove social proof"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Preview/Chapters */}
                  {previewChapters.length > 0 && (
                    <div className="text-left bg-white bg-opacity-10 rounded-lg p-4">
                      <div className="text-sm font-semibold mb-3 text-center">What's Inside:</div>
                      <div className="space-y-2">
                        {previewChapters.slice(0, 4).map((chapter, index) => (
                          <div key={index} className="flex items-start space-x-2 text-sm">
                            <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold">{index + 1}</span>
                            </div>
                            <span>{chapter}</span>
                          </div>
                        ))}
                        {previewChapters.length > 4 && (
                          <div className="text-sm opacity-75 text-center pt-2">
                            +{previewChapters.length - 4} more...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content Side */}
              <div className="p-8 lg:p-12">
                
                {/* Title */}
                <h3 className="font-bold text-gray-900 mb-4" style={h2Style}>
                  {blockContent.magnet_title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 leading-relaxed mb-6" style={bodyLgStyle}>
                  {blockContent.magnet_description}
                </p>
                
                {/* Benefits */}
                <div className="mb-8">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.benefits_label || ''}
                    onEdit={(value) => handleContentUpdate('benefits_label', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm font-semibold text-gray-700 mb-4"
                    placeholder="You'll get:"
                    sectionId={sectionId}
                    elementKey="benefits_label"
                    sectionBackground={sectionBackground}
                  />
                  <div className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* CTA */}
                <div className="mb-6">
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    className="w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                </div>
                
                {/* Delivery Method */}
                {blockContent.delivery_method && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{blockContent.delivery_method}</span>
                  </div>
                )}
                
                {/* Privacy Text */}
                {blockContent.privacy_text && (
                  <div className="text-xs text-gray-500 text-center">
                    {blockContent.privacy_text}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Trust Elements */}
        <div className="mt-12 text-center">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.instant_access_title || ''}
                onEdit={(value) => handleContentUpdate('instant_access_title', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="font-semibold text-gray-900"
                placeholder="Instant Access"
                sectionId={sectionId}
                elementKey="instant_access_title"
                sectionBackground={sectionBackground}
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.instant_access_description || ''}
                onEdit={(value) => handleContentUpdate('instant_access_description', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className={`text-sm ${mutedTextColor}`}
                placeholder="Download immediately"
                sectionId={sectionId}
                elementKey="instant_access_description"
                sectionBackground={sectionBackground}
              />
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.free_title || ''}
                onEdit={(value) => handleContentUpdate('free_title', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="font-semibold text-gray-900"
                placeholder="100% Free"
                sectionId={sectionId}
                elementKey="free_title"
                sectionBackground={sectionBackground}
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.free_description || ''}
                onEdit={(value) => handleContentUpdate('free_description', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className={`text-sm ${mutedTextColor}`}
                placeholder="No hidden costs"
                sectionId={sectionId}
                elementKey="free_description"
                sectionBackground={sectionBackground}
              />
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.privacy_title || ''}
                onEdit={(value) => handleContentUpdate('privacy_title', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="font-semibold text-gray-900"
                placeholder="Privacy Protected"
                sectionId={sectionId}
                elementKey="privacy_title"
                sectionBackground={sectionBackground}
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.privacy_description || ''}
                onEdit={(value) => handleContentUpdate('privacy_description', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className={`text-sm ${mutedTextColor}`}
                placeholder="We never spam"
                sectionId={sectionId}
                elementKey="privacy_description"
                sectionBackground={sectionBackground}
              />
            </div>
          </div>
        </div>

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
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
                placeholder="Add optional supporting text to reinforce the lead magnet value..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(trustItems.length > 0 || mode === 'edit') && (
              <div>
                {mode === 'edit' ? (
                  <EditableTrustIndicators
                    mode={mode}
                    trustItems={[
                      blockContent.trust_item_1 || '',
                      blockContent.trust_item_2 || '',
                      blockContent.trust_item_3 || '',
                      blockContent.trust_item_4 || '',
                      blockContent.trust_item_5 || ''
                    ]}
                    onTrustItemChange={(index, value) => {
                      const fieldKey = `trust_item_${index + 1}` as keyof LeadMagnetCardContent;
                      handleContentUpdate(fieldKey, value);
                    }}
                    onAddTrustItem={() => {
                      const emptyIndex = [
                        blockContent.trust_item_1,
                        blockContent.trust_item_2,
                        blockContent.trust_item_3,
                        blockContent.trust_item_4,
                        blockContent.trust_item_5
                      ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                      
                      if (emptyIndex !== -1) {
                        const fieldKey = `trust_item_${emptyIndex + 1}` as keyof LeadMagnetCardContent;
                        handleContentUpdate(fieldKey, 'New trust item');
                      }
                    }}
                    onRemoveTrustItem={(index) => {
                      const fieldKey = `trust_item_${index + 1}` as keyof LeadMagnetCardContent;
                      handleContentUpdate(fieldKey, '___REMOVED___');
                    }}
                    colorTokens={colorTokens}
                    sectionBackground={sectionBackground}
                    sectionId={sectionId}
                    backgroundType={safeBackgroundType}
                    iconColor="text-green-500"
                    colorClass={mutedTextColor}
                  />
                ) : (
                  trustItems.length > 0 && (
                    <TrustIndicators 
                      items={trustItems}
                      colorClass={mutedTextColor}
                      iconColor="text-green-500"
                    />
                  )
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
  name: 'LeadMagnetCard',
  category: 'Close',
  description: 'Professional lead magnet card with preview and benefits. Perfect for content downloads and lead generation.',
  tags: ['lead-magnet', 'download', 'content', 'lead-generation', 'conversion'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'magnet_title', label: 'Lead Magnet Title', type: 'text', required: true },
    { key: 'magnet_description', label: 'Lead Magnet Description', type: 'textarea', required: true },
    { key: 'magnet_benefits', label: 'Benefits (pipe separated)', type: 'textarea', required: true },
    { key: 'magnet_format', label: 'Format (PDF, Video, etc.)', type: 'text', required: true },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'privacy_text', label: 'Privacy Text', type: 'text', required: false },
    { key: 'social_proof', label: 'Social Proof Text', type: 'text', required: false },
    { key: 'magnet_preview', label: 'Preview/Chapters (pipe separated)', type: 'textarea', required: false },
    { key: 'delivery_method', label: 'Delivery Method', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'benefits_label', label: 'Benefits Label', type: 'text', required: false },
    { key: 'instant_access_title', label: 'Instant Access Title', type: 'text', required: false },
    { key: 'instant_access_description', label: 'Instant Access Description', type: 'text', required: false },
    { key: 'free_title', label: 'Free Title', type: 'text', required: false },
    { key: 'free_description', label: 'Free Description', type: 'text', required: false },
    { key: 'privacy_title', label: 'Privacy Title', type: 'text', required: false },
    { key: 'privacy_description', label: 'Privacy Description', type: 'text', required: false }
  ],
  
  features: [
    'Dynamic format icons (PDF, video, template)',
    'Content preview with chapters/benefits',
    'Social proof and download stats',
    'Trust elements and privacy messaging',
    'Professional card design',
    'Mobile-responsive layout'
  ],
  
  useCases: [
    'Content marketing lead generation',
    'Educational resource downloads',
    'Template and tool giveaways',
    'Newsletter signup incentives',
    'Course or product lead magnets'
  ]
};