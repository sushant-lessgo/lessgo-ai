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
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import { getRandomIconFromCategory } from '@/utils/iconMapping';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface MiniCardsContent {
  headline: string;
  feature_titles: string;
  feature_descriptions: string;
  feature_keywords: string;
  // Feature icons
  feature_icon_1?: string;
  feature_icon_2?: string;
  feature_icon_3?: string;
  feature_icon_4?: string;
  feature_icon_5?: string;
  feature_icon_6?: string;
  feature_icon_7?: string;
  feature_icon_8?: string;
  feature_icon_9?: string;
  feature_icon_10?: string;
  feature_icon_11?: string;
  feature_icon_12?: string;
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
  // Feature icon schema
  feature_icon_1: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  feature_icon_2: { 
    type: 'string' as const, 
    default: '💽' 
  },
  feature_icon_3: { 
    type: 'string' as const, 
    default: '🔒' 
  },
  feature_icon_4: { 
    type: 'string' as const, 
    default: '👥' 
  },
  feature_icon_5: { 
    type: 'string' as const, 
    default: '📱' 
  },
  feature_icon_6: {
    type: 'string' as const,
    default: '🔧'
  },
  feature_icon_7: {
    type: 'string' as const,
    default: '🎯'
  },
  feature_icon_8: {
    type: 'string' as const,
    default: '✨'
  },
  feature_icon_9: {
    type: 'string' as const,
    default: '🚀'
  },
  feature_icon_10: {
    type: 'string' as const,
    default: '🔥'
  },
  feature_icon_11: {
    type: 'string' as const,
    default: '💎'
  },
  feature_icon_12: {
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
    default: 'Always Up-to-Date'
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
  h3Style,
  mode,
  handleContentUpdate,
  blockContent,
  sectionId,
  backgroundType,
  onTitleEdit,
  onDescriptionEdit,
  onKeywordEdit,
  onRemove,
  sectionBackground,
  theme
}: {
  title: string;
  description: string;
  keyword: string;
  index: number;
  colorTokens: any;
  h3Style: React.CSSProperties;
  mode: 'edit' | 'preview';
  handleContentUpdate: (key: keyof MiniCardsContent, value: string) => void;
  blockContent: MiniCardsContent;
  sectionId: string;
  backgroundType: string;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onKeywordEdit: (index: number, value: string) => void;
  onRemove?: () => void;
  sectionBackground: string;
  theme: UIBlockTheme;
}) => {
  
  // Get feature icon from content fields
  const getFeatureIcon = (index: number) => {
    const iconFields = [
      blockContent.feature_icon_1,
      blockContent.feature_icon_2,
      blockContent.feature_icon_3,
      blockContent.feature_icon_4,
      blockContent.feature_icon_5,
      blockContent.feature_icon_6,
      blockContent.feature_icon_7,
      blockContent.feature_icon_8,
      blockContent.feature_icon_9,
      blockContent.feature_icon_10,
      blockContent.feature_icon_11,
      blockContent.feature_icon_12
    ];
    return iconFields[index] || '📊';
  };

  const getColorForIndex = (index: number, theme: UIBlockTheme) => {
    const colorSets = {
      warm: [
        'from-orange-500 to-orange-600',
        'from-red-500 to-red-600',
        'from-amber-500 to-amber-600',
        'from-yellow-500 to-yellow-600',
        'from-rose-500 to-rose-600',
        'from-orange-400 to-orange-500'
      ],
      cool: [
        'from-blue-500 to-blue-600',
        'from-cyan-500 to-cyan-600',
        'from-indigo-500 to-indigo-600',
        'from-sky-500 to-sky-600',
        'from-teal-500 to-teal-600',
        'from-blue-400 to-blue-500'
      ],
      neutral: [
        'from-gray-500 to-gray-600',
        'from-slate-500 to-slate-600',
        'from-zinc-500 to-zinc-600',
        'from-neutral-500 to-neutral-600',
        'from-stone-500 to-stone-600',
        'from-gray-400 to-gray-500'
      ]
    };
    return colorSets[theme][index % 6];
  };

  return (
    <div className={`relative group/mini-card-${index} bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col`}>
      
      {/* Delete button - only show in edit mode */}
      {mode === 'edit' && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`opacity-0 group-hover/mini-card-${index}:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10 bg-white rounded-full p-1 shadow-md`}
          title="Remove this feature"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="flex items-start space-x-4 mb-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getColorForIndex(index, theme)} flex items-center justify-center shadow-[0_6px_18px_rgba(15,23,42,0.18)]
    ring-1 ring-white/25
    backdrop-blur-sm
    transition-all duration-300
    group-hover:-translate-y-0.5
    group-hover:shadow-[0_12px_32px_rgba(15,23,42,0.22)]`}>
          <IconEditableText
            mode={mode}
            value={getFeatureIcon(index)}
            onEdit={(value) => {
              const iconField = `feature_icon_${index + 1}` as keyof MiniCardsContent;
              handleContentUpdate(iconField, value);
            }}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            iconSize="sm"
            className="text-white text-xl"
            sectionId={sectionId}
            elementKey={`feature_icon_${index + 1}`}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <EditableAdaptiveText
            mode={mode}
            value={title}
            onEdit={(value) => onTitleEdit(index, value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{
              ...h3Style,
              fontWeight: 600
            }}
            className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors duration-300"
            placeholder="Feature title..."
            sectionId={sectionId}
            elementKey={`feature_title_${index}`}
            sectionBackground={sectionBackground}
          />
      
        </div>
      </div>

      <div className="mt-auto">
        <EditableAdaptiveText
          mode={mode}
          value={description}
          onEdit={(value) => onDescriptionEdit(index, value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-500 transition-colors duration-300"
          placeholder="Describe this feature..."
          sectionId={sectionId}
          elementKey={`feature_description_${index}`}
          sectionBackground={sectionBackground}
        />
        
        
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
  
  // Detect theme: manual override > auto-detection > neutral fallback
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

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

  // Handle individual title/description editing
  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.feature_titles, index, value);
    handleContentUpdate('feature_titles', updatedTitles);
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.feature_descriptions, index, value);
    handleContentUpdate('feature_descriptions', updatedDescriptions);
  };

  const handleKeywordEdit = (index: number, value: string) => {
    const updatedKeywords = updateListData(blockContent.feature_keywords || '', index, value);
    handleContentUpdate('feature_keywords', updatedKeywords);
  };

  // Handle card deletion with proper data shifting
  const handleCardRemove = (index: number) => {
    const featureTitles = blockContent.feature_titles ? blockContent.feature_titles.split('|') : [];
    const featureDescriptions = blockContent.feature_descriptions ? blockContent.feature_descriptions.split('|') : [];
    const featureKeywords = blockContent.feature_keywords ? blockContent.feature_keywords.split('|') : [];
    
    // Remove from pipe-separated fields
    featureTitles.splice(index, 1);
    featureDescriptions.splice(index, 1);
    featureKeywords.splice(index, 1);
    
    // Handle icon field shifting - collect all current icons
    const iconsToShift = [];
    for (let i = 0; i < 6; i++) {
      const iconField = `feature_icon_${i + 1}` as keyof MiniCardsContent;
      const value = (blockContent[iconField] as string) || '';
      iconsToShift.push(value);
    }
    
    // Remove the icon at the specified index and shift remaining ones
    iconsToShift.splice(index, 1);
    
    // Update all icon fields with shifted values
    for (let i = 0; i < 6; i++) {
      const iconField = `feature_icon_${i + 1}` as keyof MiniCardsContent;
      const newValue = iconsToShift[i] || '';
      handleContentUpdate(iconField, newValue);
    }
    
    // Update the pipe-separated fields
    handleContentUpdate('feature_titles', featureTitles.join('|'));
    handleContentUpdate('feature_descriptions', featureDescriptions.join('|'));
    handleContentUpdate('feature_keywords', featureKeywords.join('|'));
  };

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
              mode={mode}
              handleContentUpdate={handleContentUpdate}
              blockContent={blockContent}
              sectionId={sectionId}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onKeywordEdit={handleKeywordEdit}
              onRemove={features.length > 1 ? () => handleCardRemove(index) : undefined}
              sectionBackground={sectionBackground}
              theme={uiBlockTheme}
            />
          ))}
        </div>

        {/* Add Feature Button - only in edit mode */}
        {mode === 'edit' && features.length < 6 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => {
                const featureTitles = blockContent.feature_titles ? blockContent.feature_titles.split('|') : [];
                const featureDescriptions = blockContent.feature_descriptions ? blockContent.feature_descriptions.split('|') : [];
                const featureKeywords = blockContent.feature_keywords ? blockContent.feature_keywords.split('|') : [];
                
                const newFeatureIndex = featureTitles.length;
                featureTitles.push(`Feature ${newFeatureIndex + 1}`);
                featureDescriptions.push('Add feature description here');
                featureKeywords.push('New');
                
                // Add smart icon for the new feature
                const iconField = `feature_icon_${newFeatureIndex + 1}` as keyof MiniCardsContent;
                if (newFeatureIndex < 12) {
                  // Use random icon from features category for new features beyond defaults
                  const smartIcon = getRandomIconFromCategory('features');
                  handleContentUpdate(iconField, smartIcon);
                }
                
                handleContentUpdate('feature_titles', featureTitles.join('|'));
                handleContentUpdate('feature_descriptions', featureDescriptions.join('|'));
                handleContentUpdate('feature_keywords', featureKeywords.join('|'));
              }}
              className="px-6 py-3 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600 transition-all duration-300 flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-2xl"
              title="Add new feature"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Add Feature</span>
            </button>
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
                    {mode !== 'preview' ? (
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
                    {mode !== 'preview' && (
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
                    {mode !== 'preview' ? (
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
                    {mode !== 'preview' && (
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
              {(blockContent.summary_item_3 || mode === 'edit') && blockContent.summary_item_3 !== '___REMOVED___' && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex items-center space-x-2 group/summary-item relative">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    {mode !== 'preview' ? (
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.summary_item_3 || ''}
                        onEdit={(value) => handleContentUpdate('summary_item_3', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm font-medium text-gray-700"
                        placeholder="Summary item 3"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="summary_item_3"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {blockContent.summary_item_3}
                      </span>
                    )}
                    {mode !== 'preview' && (
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