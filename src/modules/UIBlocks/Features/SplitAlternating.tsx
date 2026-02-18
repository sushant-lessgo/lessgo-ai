// SplitAlternating.tsx - V2: Clean array-based features
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

// V2: Feature item structure
interface Feature {
  id: string;
  title: string;
  description: string;
  visual?: string;
  icon?: string;
}

// V2: Content interface - uses clean arrays
interface SplitAlternatingContent {
  headline: string;
  subheadline?: string;
  supporting_text?: string;
  features: Feature[];
}

// V2: Content schema - uses clean arrays


// Feature Row Component
const FeatureRow = React.memo(({
  feature,
  index,
  sectionId,
  mode,
  colorTokens,
  sectionBackground,
  props,
  onTitleEdit,
  onDescriptionEdit,
  onIconEdit,
  onRemove,
  handleImageToolbar,
  theme,
  dynamicTextColors,
  cardStyles
}: {
  feature: Feature;
  index: number;
  sectionId: string;
  mode: string;
  colorTokens: any;
  sectionBackground: any;
  props: LayoutComponentProps;
  onTitleEdit: (value: string) => void;
  onDescriptionEdit: (value: string) => void;
  onIconEdit: (value: string) => void;
  onRemove?: () => void;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  theme: UIBlockTheme;
  dynamicTextColors: any;
  cardStyles: CardStyles;
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

  const displayIcon = feature.icon || 'Target';

  const VisualPlaceholder = React.memo(({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
    <div
      className={`relative w-full h-80 rounded-xl overflow-hidden bg-gradient-to-br ${getPlaceholderGradient()} cursor-pointer hover:opacity-90 transition-all duration-300`}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/50 flex items-center justify-center mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIconGradient()} flex items-center justify-center`}>
              <span className="text-white font-bold text-xl">{index + 1}</span>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">
            Feature {index + 1} Visual
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

  // V2: Image ID format with feature.id
  const imageId = `${sectionId}.features.${feature.id}.visual`;

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center group">

      <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="space-y-6">
          <div className="flex items-start space-x-4 relative">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${getIconGradient()} flex items-center justify-center shadow-lg`}>
              <IconEditableText
                mode={mode as 'edit' | 'preview'}
                value={displayIcon}
                onEdit={onIconEdit}
                backgroundType={props.backgroundType as any}
                colorTokens={colorTokens}
                iconSize="md"
                className="text-white text-xl"
                sectionId={sectionId}
                elementKey={`feature_icon_${feature.id}`}
              />
            </div>
            <div className="flex-1">
              {/* Editable Feature Title */}
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTitleEdit(e.currentTarget.textContent || '')}
                  className={`text-2xl font-bold mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text min-h-[40px] ${dynamicTextColors?.heading || cardStyles.textHeading}`}
                  data-placeholder="Feature title"
                >
                  {feature.title}
                </div>
              ) : (
                <h3 className={`text-2xl font-bold mb-4 ${dynamicTextColors?.heading || cardStyles.textHeading}`}>{feature.title}</h3>
              )}

              {/* Editable Feature Description */}
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onDescriptionEdit(e.currentTarget.textContent || '')}
                  className={`leading-relaxed text-lg outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text min-h-[60px] ${dynamicTextColors?.body || cardStyles.textBody}`}
                  data-placeholder="Feature description"
                >
                  {feature.description}
                </div>
              ) : (
                <p className={`leading-relaxed text-lg ${dynamicTextColors?.body || cardStyles.textBody}`}>
                  {feature.description}
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
        </div>
      </div>

      <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'} relative aspect-[4/3] overflow-hidden`}>
        {feature.visual && feature.visual !== '' ? (
          <img
            src={feature.visual}
            alt={feature.title}
            className="absolute inset-0 w-full h-full object-cover object-center rounded-xl shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow duration-300"
            data-image-id={imageId}
            onMouseUp={(e) => {
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
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
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Adaptive card styles based on section background luminance
  const cardStyles = React.useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiBlockTheme
  }), [sectionBackground, uiBlockTheme]);

  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Initialize image toolbar hook
  const handleImageToolbar = useImageToolbar();

  // V2: Direct array access
  const features: Feature[] = blockContent.features || [];

  // V2: Handle title editing - update array item
  const handleTitleEdit = (id: string, value: string) => {
    const updatedFeatures = features.map(f =>
      f.id === id ? { ...f, title: value } : f
    );
    (handleContentUpdate as any)('features', updatedFeatures);
  };

  // V2: Handle description editing - update array item
  const handleDescriptionEdit = (id: string, value: string) => {
    const updatedFeatures = features.map(f =>
      f.id === id ? { ...f, description: value } : f
    );
    (handleContentUpdate as any)('features', updatedFeatures);
  };

  // V2: Handle icon editing - update array item
  const handleIconEdit = (id: string, value: string) => {
    const updatedFeatures = features.map(f =>
      f.id === id ? { ...f, icon: value } : f
    );
    (handleContentUpdate as any)('features', updatedFeatures);
  };

  // V2: Handle visual editing - update array item
  const handleVisualEdit = (id: string, value: string) => {
    const updatedFeatures = features.map(f =>
      f.id === id ? { ...f, visual: value } : f
    );
    (handleContentUpdate as any)('features', updatedFeatures);
  };

  // V2: Handle adding a new feature - simple array push
  const handleAddFeature = () => {
    if (features.length < 6) {
      const defaultIcons = ['Target', 'Zap', 'TrendingUp', 'Wrench', 'Rocket', 'Sparkles'];
      const newFeature: Feature = {
        id: `f${Date.now()}`,
        title: `Feature ${features.length + 1}`,
        description: 'Add feature description here',
        visual: '',
        icon: defaultIcons[features.length] || 'Target'
      };
      (handleContentUpdate as any)('features', [...features, newFeature]);
    }
  };

  // V2: Handle removing a feature - simple array filter
  const handleRemoveFeature = (id: string) => {
    const updatedFeatures = features.filter(f => f.id !== id);
    (handleContentUpdate as any)('features', updatedFeatures);
  };

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
              key={feature.id}
              feature={feature}
              index={displayIndex}
              sectionId={sectionId}
              mode={mode}
              colorTokens={colorTokens}
              sectionBackground={sectionBackground}
              props={props}
              onTitleEdit={(value) => handleTitleEdit(feature.id, value)}
              onDescriptionEdit={(value) => handleDescriptionEdit(feature.id, value)}
              onIconEdit={(value) => handleIconEdit(feature.id, value)}
              handleImageToolbar={handleImageToolbar}
              theme={uiBlockTheme}
              dynamicTextColors={dynamicTextColors}
              cardStyles={cardStyles}
              onRemove={features.length > 1 ? () => handleRemoveFeature(feature.id) : undefined}
            />
          ))}

          {/* Add Feature Button - only in edit mode */}
          {mode === 'edit' && features.length < 6 && (
            <div className="flex justify-center">
              <button
                onClick={handleAddFeature}
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

        {/* Supporting Text */}
        {(blockContent.supporting_text || mode === 'edit') && (
          <div className="text-center mt-16">
            <EditableAdaptiveText
              mode={mode as 'preview' | 'edit'}
              value={blockContent.supporting_text || ''}
              onEdit={(value) => handleContentUpdate('supporting_text', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              style={bodyLgStyle}
              className="max-w-3xl mx-auto"
              placeholder="Add optional supporting text to reinforce your message..."
              sectionId={sectionId}
              elementKey="supporting_text"
              sectionBackground={sectionBackground}
            />
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
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'features', label: 'Features (array)', type: 'array', required: true }
  ],

  features: [
    'Alternating left/right layout for visual interest',
    'Large feature visuals with detailed descriptions',
    'WYSIWYG inline editing for titles and descriptions',
    'Image toolbar integration for visual editing',
    'Add/remove features functionality in edit mode',
    'Enterprise-focused design with numbered feature indicators',
    'Responsive grid system',
    'V2: Clean array-based data structure'
  ],

  useCases: [
    'Technical product feature demonstrations',
    'Enterprise software capabilities',
    'Complex workflow explanations',
    'Engineering tool features',
    'Data analytics platform features'
  ]
};
