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
import { LayoutComponentProps } from '@/types/storeTypes';

interface MiniCardsContent {
  headline: string;
  feature_titles: string;
  feature_descriptions: string;
  feature_keywords: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Feature Summary Fields
  summary_item_1?: string;
  summary_item_2?: string;
  summary_item_3?: string;
  show_feature_summary?: boolean;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Essential Features for Modern Teams' 
  },
  feature_titles: { 
    type: 'string' as const, 
    default: 'Smart Automation|Real-Time Sync|Advanced Security|Team Collaboration|Mobile Access|API Integration' 
  },
  feature_descriptions: { 
    type: 'string' as const, 
    default: 'Automate repetitive tasks with intelligent workflows|Keep all your data synchronized across platforms|Bank-level security with end-to-end encryption|Collaborate seamlessly with your team in real-time|Access your work anywhere with our mobile apps|Connect with your favorite tools through our API' 
  },
  feature_keywords: { 
    type: 'string' as const, 
    default: 'AI-Powered|Instant|SOC 2|Live Updates|iOS & Android|1000+ Integrations' 
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
  // Feature Summary Schema
  summary_item_1: { 
    type: 'string' as const, 
    default: 'Zero Setup Required' 
  },
  summary_item_2: { 
    type: 'string' as const, 
    default: 'Works Out-of-the-Box' 
  },
  summary_item_3: { 
    type: 'string' as const, 
    default: '' 
  },
  show_feature_summary: { 
    type: 'boolean' as const, 
    default: true 
  }
};

const MiniCard = React.memo(({ 
  title, 
  description, 
  keyword,
  index,
  colorTokens,
  h3Style
}: {
  title: string;
  description: string;
  keyword: string;
  index: number;
  colorTokens: any;
  h3Style: React.CSSProperties;
}) => {
  
  const getIconForIndex = (index: number) => {
    const icons = [
      // Smart Automation
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>,
      // Real-Time Sync
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>,
      // Advanced Security
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>,
      // Team Collaboration
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>,
      // Mobile Access
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>,
      // API Integration
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ];
    return icons[index % icons.length];
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
    <div className="group bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      
      <div className="flex items-start space-x-4 mb-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getColorForIndex(index)} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
          {getIconForIndex(index)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 style={h3Style} className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors duration-300">
            {title}
          </h3>
          {keyword && (
            <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r ${getColorForIndex(index)} text-white`}>
              {keyword}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
          {description}
        </p>
        
        <div className="mt-3 flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${getColorForIndex(index)}`} />
          <span className="text-xs text-gray-500">Ready to use</span>
        </div>
      </div>
    </div>
  );
});
MiniCard.displayName = 'MiniCard';

export default function MiniCards(props: LayoutComponentProps) {
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
  } = useLayoutComponent<MiniCardsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const featureTitles = blockContent.feature_titles 
    ? blockContent.feature_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureDescriptions = blockContent.feature_descriptions 
    ? blockContent.feature_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureKeywords = blockContent.feature_keywords 
    ? blockContent.feature_keywords.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const features = featureTitles.map((title, index) => ({
    title,
    description: featureDescriptions[index] || '',
    keyword: featureKeywords[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MiniCards"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your essential features..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Feature Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_titles || ''}
                  onEdit={(value) => handleContentUpdate('feature_titles', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('feature_descriptions', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_keywords || ''}
                  onEdit={(value) => handleContentUpdate('feature_keywords', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature keywords/badges (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_keywords"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <MiniCard
                key={index}
                title={feature.title}
                description={feature.description}
                keyword={feature.keyword}
                index={index}
                colorTokens={colorTokens}
                h3Style={h3Style}
              />
            ))}
          </div>
        )}

        {/* Feature Summary - Editable */}
        {blockContent.show_feature_summary !== false && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  {features.length} Core Features
                </span>
              </div>
              {(blockContent.summary_item_1 || mode === 'edit') && blockContent.summary_item_1 !== '___REMOVED___' && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex items-center space-x-2 group/summary-item relative">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {mode === 'edit' ? (
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.summary_item_1 || ''}
                        onEdit={(value) => handleContentUpdate('summary_item_1', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm font-medium text-gray-700"
                        placeholder="Summary item 1"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="summary_item_1"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {blockContent.summary_item_1}
                      </span>
                    )}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('summary_item_1', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/summary-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove summary item 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              )}
              {(blockContent.summary_item_2 || mode === 'edit') && blockContent.summary_item_2 !== '___REMOVED___' && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex items-center space-x-2 group/summary-item relative">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    {mode === 'edit' ? (
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.summary_item_2 || ''}
                        onEdit={(value) => handleContentUpdate('summary_item_2', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm font-medium text-gray-700"
                        placeholder="Summary item 2"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="summary_item_2"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {blockContent.summary_item_2}
                      </span>
                    )}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('summary_item_2', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/summary-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove summary item 2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              )}
              {(blockContent.summary_item_3 || mode === 'edit') && blockContent.summary_item_3 !== '___REMOVED___' && blockContent.summary_item_3?.trim() !== '' && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex items-center space-x-2 group/summary-item relative">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    {mode === 'edit' ? (
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.summary_item_3 || ''}
                        onEdit={(value) => handleContentUpdate('summary_item_3', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm font-medium text-gray-700"
                        placeholder="Summary item 3 (optional)"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="summary_item_3"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {blockContent.summary_item_3}
                      </span>
                    )}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('summary_item_3', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/summary-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove summary item 3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
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
                placeholder="Add optional supporting text to reinforce your feature set..."
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
  name: 'MiniCards',
  category: 'Features',
  description: 'Compact feature cards with icons and badges. Perfect for minimal/technical tone and builder audiences.',
  tags: ['features', 'compact', 'minimal', 'technical', 'builders'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'feature_titles', label: 'Feature Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_keywords', label: 'Feature Keywords/Badges (pipe separated)', type: 'text', required: false },
    { key: 'summary_item_1', label: 'Summary Item 1', type: 'text', required: false },
    { key: 'summary_item_2', label: 'Summary Item 2', type: 'text', required: false },
    { key: 'summary_item_3', label: 'Summary Item 3', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Compact grid layout with mini cards',
    'Colorful gradient icons',
    'Feature badges/keywords',
    'Clean minimal design',
    'Perfect for technical audiences',
    'High-density information display'
  ],
  
  useCases: [
    'Developer tool features',
    'Technical product capabilities',
    'Builder-focused platforms',
    'Minimal design systems',
    'High-sophistication audiences'
  ]
};