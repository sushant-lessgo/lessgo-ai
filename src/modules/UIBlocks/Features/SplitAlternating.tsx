import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface SplitAlternatingContent {
  headline: string;
  feature_titles: string;
  feature_descriptions: string;
  feature_visuals?: string;
  // Individual feature visual fields for image toolbar support
  feature_visual_0?: string;
  feature_visual_1?: string;
  feature_visual_2?: string;
  feature_visual_3?: string;
  feature_visual_4?: string;
  feature_visual_5?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Feature icons
  feature_icon_1?: string;
  feature_icon_2?: string;
  feature_icon_3?: string;
  feature_icon_4?: string;
  feature_icon_5?: string;
  feature_icon_6?: string;
  // Benefit item fields
  benefit_1?: string;
  benefit_2?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Advanced Features for Power Users' 
  },
  feature_titles: { 
    type: 'string' as const, 
    default: 'Intelligent Automation|Real-Time Analytics|Advanced Security|Seamless Integration' 
  },
  feature_descriptions: { 
    type: 'string' as const, 
    default: 'Our AI-powered automation engine learns from your workflows and optimizes processes automatically, reducing manual work by up to 80%.|Monitor performance metrics in real-time with customizable dashboards that give you instant insights into what matters most.|Enterprise-grade security with end-to-end encryption, SOC 2 compliance, and advanced threat detection to keep your data safe.|Connect with over 1000+ tools through our robust API and pre-built integrations, creating a seamless workflow ecosystem.' 
  },
  feature_visuals: { 
    type: 'string' as const, 
    default: '/feature1.jpg|/feature2.jpg|/feature3.jpg|/feature4.jpg' 
  },
  // Individual feature visual fields for image toolbar support
  feature_visual_0: { 
    type: 'string' as const, 
    default: '' 
  },
  feature_visual_1: { 
    type: 'string' as const, 
    default: '' 
  },
  feature_visual_2: { 
    type: 'string' as const, 
    default: '' 
  },
  feature_visual_3: { 
    type: 'string' as const, 
    default: '' 
  },
  feature_visual_4: { 
    type: 'string' as const, 
    default: '' 
  },
  feature_visual_5: { 
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
  cta_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  // Feature icon schema
  feature_icon_1: { 
    type: 'string' as const, 
    default: '🎯' 
  },
  feature_icon_2: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  feature_icon_3: { 
    type: 'string' as const, 
    default: '📈' 
  },
  feature_icon_4: { 
    type: 'string' as const, 
    default: '🔧' 
  },
  feature_icon_5: { 
    type: 'string' as const, 
    default: '🚀' 
  },
  feature_icon_6: { 
    type: 'string' as const, 
    default: '✨' 
  },
  // Benefit item schema
  benefit_1: { 
    type: 'string' as const, 
    default: 'Easy to implement' 
  },
  benefit_2: { 
    type: 'string' as const, 
    default: 'No coding required' 
  }
};

const FeatureRow = React.memo(({
  title,
  description,
  visual,
  index,
  originalIndex,
  showImageToolbar,
  sectionId,
  mode,
  h2Style,
  bodyLgStyle,
  blockContent,
  handleContentUpdate,
  colorTokens,
  sectionBackground,
  props,
  onRemove,
  handleImageToolbar,
  theme
}: {
  title: string;
  description: string;
  visual?: string;
  index: number;
  originalIndex: number;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
  h2Style: React.CSSProperties;
  bodyLgStyle: React.CSSProperties;
  blockContent: SplitAlternatingContent;
  handleContentUpdate: (key: keyof SplitAlternatingContent, value: string) => void;
  colorTokens: any;
  sectionBackground: any;
  props: LayoutComponentProps;
  onRemove?: () => void;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  theme: UIBlockTheme;
}) => {
  const isEven = index % 2 === 0;

  // Theme-based gradient functions
  const getIconGradient = () => {
    const gradients = {
      warm: 'from-orange-500 to-red-600',
      cool: 'from-blue-500 to-indigo-600',
      neutral: 'from-gray-500 to-slate-600'
    };
    return gradients[theme];
  };

  const getPlaceholderGradient = () => {
    const gradients = {
      warm: 'from-orange-50 to-red-100',
      cool: 'from-blue-50 to-indigo-100',
      neutral: 'from-gray-50 to-slate-100'
    };
    return gradients[theme];
  };

  const getPlaceholderHoverGradient = () => {
    const gradients = {
      warm: 'from-orange-100 to-red-150',
      cool: 'from-blue-100 to-indigo-150',
      neutral: 'from-gray-100 to-slate-150'
    };
    return gradients[theme];
  };

  // Get feature icon from content fields
  const getFeatureIcon = () => {
    const iconFields = [
      blockContent.feature_icon_1,
      blockContent.feature_icon_2,
      blockContent.feature_icon_3,
      blockContent.feature_icon_4,
      blockContent.feature_icon_5,
      blockContent.feature_icon_6
    ];
    return iconFields[originalIndex] || '🎯';
  };
  
  const VisualPlaceholder = React.memo(({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
    <div
      className={`relative w-full h-80 rounded-xl overflow-hidden bg-gradient-to-br ${getPlaceholderGradient()} cursor-pointer hover:bg-gradient-to-br hover:${getPlaceholderHoverGradient()} transition-all duration-300`}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/50 flex items-center justify-center mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIconGradient()} flex items-center justify-center`}>
              <span className="text-white font-bold text-xl">{originalIndex + 1}</span>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">
            Feature {originalIndex + 1} Visual
          </div>
          {mode === 'edit' && (
            <div className="text-xs text-gray-500 mt-2">
              Click to add image
            </div>
          )}
        </div>
      </div>
    </div>
  ));

  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:direction-rtl'} group`}>
      
      <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="space-y-6">
          <div className="flex items-start space-x-4 relative">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${getIconGradient()} flex items-center justify-center shadow-lg`}>
              <IconEditableText
                mode={mode as 'edit' | 'preview'}
                value={getFeatureIcon()}
                onEdit={(value) => {
                  const iconField = `feature_icon_${originalIndex + 1}` as keyof SplitAlternatingContent;
                  handleContentUpdate(iconField, value);
                }}
                backgroundType={props.backgroundType as any}
                colorTokens={colorTokens}
                iconSize="md"
                className="text-white text-xl"
                sectionId={sectionId}
                elementKey={`feature_icon_${originalIndex + 1}`}
              />
            </div>
            <div className="flex-1">
              {/* Editable Feature Title */}
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const featureTitles = blockContent.feature_titles ? blockContent.feature_titles.split('|') : [];
                    featureTitles[originalIndex] = e.currentTarget.textContent || '';
                    handleContentUpdate('feature_titles', featureTitles.join('|'));
                  }}
                  className="text-2xl font-bold text-gray-900 mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[40px]"
                  data-placeholder="Feature title"
                >
                  {title}
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
              )}
              
              {/* Editable Feature Description */}
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const featureDescriptions = blockContent.feature_descriptions ? blockContent.feature_descriptions.split('|') : [];
                    featureDescriptions[originalIndex] = e.currentTarget.textContent || '';
                    handleContentUpdate('feature_descriptions', featureDescriptions.join('|'));
                  }}
                  className="text-gray-600 leading-relaxed text-lg outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[60px]"
                  data-placeholder="Feature description"
                >
                  {description}
                </div>
              ) : (
                <p className="text-gray-600 leading-relaxed text-lg">
                  {description}
                </p>
              )}
            </div>
            
            {/* Remove Feature Button - only in edit mode */}
            {mode === 'edit' && onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10 bg-white rounded-full p-1 shadow-md"
                title="Remove this feature"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4 pl-16">
            {(blockContent.benefit_1 || mode === 'edit') && blockContent.benefit_1 !== '___REMOVED___' && (
              <div className="flex items-center space-x-2 text-green-600 group/benefit-item relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {mode !== 'preview' ? (
                  <EditableAdaptiveText
                    mode={mode as 'preview' | 'edit'}
                    value={blockContent.benefit_1 || ''}
                    onEdit={(value) => handleContentUpdate('benefit_1', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm font-medium"
                    placeholder="Benefit 1"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="benefit_1"
                  />
                ) : (
                  <span className="text-sm font-medium">{blockContent.benefit_1}</span>
                )}
                {mode !== 'preview' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('benefit_1', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/benefit-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove benefit 1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {(blockContent.benefit_2 || mode === 'edit') && blockContent.benefit_2 !== '___REMOVED___' && (
              <div className="flex items-center space-x-2 text-green-600 group/benefit-item relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {mode !== 'preview' ? (
                  <EditableAdaptiveText
                    mode={mode as 'preview' | 'edit'}
                    value={blockContent.benefit_2 || ''}
                    onEdit={(value) => handleContentUpdate('benefit_2', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm font-medium"
                    placeholder="Benefit 2"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="benefit_2"
                  />
                ) : (
                  <span className="text-sm font-medium">{blockContent.benefit_2}</span>
                )}
                {mode !== 'preview' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('benefit_2', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/benefit-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove benefit 2"
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
      </div>

      <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
        {visual && visual !== '' ? (
          <img
            src={visual}
            alt={title}
            className="w-full h-80 object-cover rounded-xl shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow duration-300"
            data-image-id={`${sectionId}.feature_visual_${originalIndex}`}
            onMouseUp={(e) => {
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const imageId = `${sectionId}.feature_visual_${originalIndex}`;
                const position = {
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10
                };
                handleImageToolbar(imageId, position);
              }
            }}
            onClick={(e) => {
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
          />
        ) : (
          <VisualPlaceholder 
            onClick={(e) => {
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const imageId = `${sectionId}.feature_visual_${originalIndex}`;
                const position = {
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10
                };
                handleImageToolbar(imageId, position);
              }
            }}
          />
        )}
      </div>
    </div>
  );
});
FeatureRow.displayName = 'FeatureRow';

export default function SplitAlternating(props: LayoutComponentProps) {
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
  } = useLayoutComponent<SplitAlternatingContent>({
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
  const h2Style = getTypographyStyle('h2');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Initialize image toolbar hook
  const handleImageToolbar = useImageToolbar();

  // Helper function to get individual feature visual
  const getFeatureVisual = (index: number): string => {
    const fieldName = `feature_visual_${index}` as keyof SplitAlternatingContent;
    return (blockContent[fieldName] as string) || '';
  };

  // Parse titles and descriptions without filtering - preserve empty slots
  const featureTitles = blockContent.feature_titles 
    ? blockContent.feature_titles.split('|').map(item => item.trim())
    : [];

  const featureDescriptions = blockContent.feature_descriptions 
    ? blockContent.feature_descriptions.split('|').map(item => item.trim())
    : [];

  // Create features array based on actual data
  const features = featureTitles.map((title, index) => ({
    title: title || (mode === 'edit' ? `Feature ${index + 1}` : ''),
    description: featureDescriptions[index] || '',
    visual: getFeatureVisual(index), // Use individual field instead of pipe-separated
    originalIndex: index // Keep track of original index for proper data updates
  })).filter(feature => {
    // In edit mode: show empty features for editing
    if (mode === 'edit') return true;
    // In preview mode: only show features with content
    return feature.title.trim() !== '' || feature.description.trim() !== '' || feature.visual.trim() !== '';
  });

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  // Migration logic: Convert pipe-separated feature_visuals to individual fields
  React.useEffect(() => {
    if (blockContent.feature_visuals && !blockContent.feature_visual_0) {
      const featureVisuals = blockContent.feature_visuals.split('|').map(item => item.trim()).filter(Boolean);
      const updates: Partial<SplitAlternatingContent> = {};
      
      featureVisuals.forEach((visual, index) => {
        if (index < 6) { // Max 6 features
          const fieldName = `feature_visual_${index}` as keyof SplitAlternatingContent;
          updates[fieldName] = visual as any;
        }
      });
      
      // Apply all updates at once
      Object.entries(updates).forEach(([key, value]) => {
        handleContentUpdate(key as keyof SplitAlternatingContent, value);
      });
    }
  }, [blockContent.feature_visuals, blockContent.feature_visual_0, handleContentUpdate]);
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SplitAlternating"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode as 'preview' | 'edit'}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode as 'preview' | 'edit'}
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
              mode={mode as 'preview' | 'edit'}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your advanced features..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="space-y-24">
          {features.map((feature, displayIndex) => (
            <FeatureRow
              key={`feature-${displayIndex}`}
              title={feature.title}
              description={feature.description}
              visual={feature.visual}
              index={displayIndex}
              originalIndex={feature.originalIndex}
              showImageToolbar={showImageToolbar}
              sectionId={sectionId}
              mode={mode}
              h2Style={h2Style}
              bodyLgStyle={bodyLgStyle}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
              colorTokens={colorTokens}
              sectionBackground={sectionBackground}
              props={props}
              handleImageToolbar={handleImageToolbar}
              theme={uiBlockTheme}
              onRemove={features.length > 1 ? () => {
                const featureTitles = blockContent.feature_titles ? blockContent.feature_titles.split('|') : [];
                const featureDescriptions = blockContent.feature_descriptions ? blockContent.feature_descriptions.split('|') : [];
                
                // Remove from pipe-separated fields using original index
                featureTitles.splice(feature.originalIndex, 1);
                featureDescriptions.splice(feature.originalIndex, 1);
                
                // Remove the visual field for the feature being deleted and shift remaining fields
                const visualsToShift = [];
                for (let i = 0; i < 6; i++) {
                  const fieldName = `feature_visual_${i}` as keyof SplitAlternatingContent;
                  const value = (blockContent[fieldName] as string) || '';
                  visualsToShift.push(value);
                }
                
                // Remove the visual at the original index and shift remaining ones
                visualsToShift.splice(feature.originalIndex, 1);
                
                // Update all visual fields with shifted values
                for (let i = 0; i < 6; i++) {
                  const fieldName = `feature_visual_${i}` as keyof SplitAlternatingContent;
                  const newValue = visualsToShift[i] || '';
                  handleContentUpdate(fieldName, newValue);
                }
                
                // Also shift icon fields
                const iconsToShift = [];
                for (let i = 0; i < 6; i++) {
                  const fieldName = `feature_icon_${i + 1}` as keyof SplitAlternatingContent;
                  const value = (blockContent[fieldName] as string) || '';
                  iconsToShift.push(value);
                }
                
                // Remove the icon at the original index and shift remaining ones
                iconsToShift.splice(feature.originalIndex, 1);
                
                // Update all icon fields with shifted values
                for (let i = 0; i < 6; i++) {
                  const fieldName = `feature_icon_${i + 1}` as keyof SplitAlternatingContent;
                  const newValue = iconsToShift[i] || '';
                  handleContentUpdate(fieldName, newValue);
                }
                
                handleContentUpdate('feature_titles', featureTitles.join('|'));
                handleContentUpdate('feature_descriptions', featureDescriptions.join('|'));
              } : undefined}
            />
          ))}
          
          {/* Add Feature Button - only in edit mode */}
          {mode === 'edit' && features.length < 6 && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const featureTitles = blockContent.feature_titles ? blockContent.feature_titles.split('|') : [];
                  const featureDescriptions = blockContent.feature_descriptions ? blockContent.feature_descriptions.split('|') : [];
                  
                  const newFeatureIndex = featureTitles.length;
                  featureTitles.push(`Feature ${newFeatureIndex + 1}`);
                  featureDescriptions.push('Add feature description here');
                  
                  // Add default image for the new feature
                  const defaultImages = [
                    '/feature1.jpg',
                    '/feature2.jpg',
                    '/feature3.jpg',
                    '/feature4.jpg',
                    '/feature5.jpg',
                    '/feature6.jpg'
                  ];
                  
                  const defaultImage = defaultImages[newFeatureIndex] || '/feature-placeholder.jpg';
                  const visualFieldName = `feature_visual_${newFeatureIndex}` as keyof SplitAlternatingContent;
                  
                  // Add default icon for the new feature
                  const defaultIcons = ['🎯', '⚡', '📈', '🔧', '🚀', '✨'];
                  const iconFieldName = `feature_icon_${newFeatureIndex + 1}` as keyof SplitAlternatingContent;
                  
                  handleContentUpdate('feature_titles', featureTitles.join('|'));
                  handleContentUpdate('feature_descriptions', featureDescriptions.join('|'));
                  handleContentUpdate(visualFieldName, defaultImage);
                  handleContentUpdate(iconFieldName, defaultIcons[newFeatureIndex] || '🎯');
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
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode as 'preview' | 'edit'}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
  name: 'SplitAlternating',
  category: 'Features',
  description: 'Alternating left/right feature layout with visuals. Perfect for complex technical products and enterprise audiences.',
  tags: ['features', 'alternating', 'visual', 'enterprise', 'technical'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'feature_titles', label: 'Feature Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_visuals', label: 'Feature Visuals (pipe separated)', type: 'textarea', required: false },
    { key: 'feature_visual_0', label: 'Feature 1 Visual', type: 'image', required: false },
    { key: 'feature_visual_1', label: 'Feature 2 Visual', type: 'image', required: false },
    { key: 'feature_visual_2', label: 'Feature 3 Visual', type: 'image', required: false },
    { key: 'feature_visual_3', label: 'Feature 4 Visual', type: 'image', required: false },
    { key: 'feature_visual_4', label: 'Feature 5 Visual', type: 'image', required: false },
    { key: 'feature_visual_5', label: 'Feature 6 Visual', type: 'image', required: false },
    { key: 'benefit_1', label: 'Benefit Item 1', type: 'text', required: false },
    { key: 'benefit_2', label: 'Benefit Item 2', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Alternating left/right layout for visual interest',
    'Large feature visuals with detailed descriptions',
    'WYSIWYG inline editing for titles and descriptions',
    'Image toolbar integration for visual editing',
    'Add/remove features functionality in edit mode',
    'Enterprise-focused design with numbered feature indicators',
    'Responsive grid system'
  ],
  
  useCases: [
    'Technical product feature demonstrations',
    'Enterprise software capabilities',
    'Complex workflow explanations',
    'Engineering tool features',
    'Data analytics platform features'
  ]
};