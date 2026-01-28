import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
// V2: Legacy parsing utils no longer needed - using clean arrays
import { getRandomIconFromCategory } from '@/utils/iconMapping';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2: Transformation type for clean array structure
interface Transformation {
  id: string;
  before_situation: string;
  after_outcome: string;
  testimonial_quote: string;
  customer_name: string;
  customer_title: string;
  customer_company: string;
  before_icon: string;
  after_icon: string;
  avatar_url: string;
}

// V2: Content interface with clean arrays
interface BeforeAfterQuoteContent {
  headline: string;
  subheadline?: string;
  before_icon?: string;
  after_icon?: string;
  transformations?: Transformation[];
}

// V2: Content schema with array defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Real Customer Transformations'
  },
  subheadline: {
    type: 'string' as const,
    default: 'See how our solution transformed their operations'
  },
  before_icon: {
    type: 'string' as const,
    default: '❌'
  },
  after_icon: {
    type: 'string' as const,
    default: '✅'
  },
  transformations: {
    type: 'array' as const,
    default: [
      {
        id: 't-1',
        before_situation: 'Spending 10+ hours weekly on manual data entry',
        after_outcome: 'Automated processing with 5 hours saved weekly',
        testimonial_quote: 'The transformation has been incredible. We went from drowning in manual work to having systems that run themselves.',
        customer_name: 'Sarah Chen',
        customer_title: 'Operations Manager',
        customer_company: 'TechCorp',
        before_icon: '😰',
        after_icon: '😊',
        avatar_url: ''
      },
      {
        id: 't-2',
        before_situation: 'Managing inventory across multiple spreadsheets',
        after_outcome: 'Real-time management with zero stockouts',
        testimonial_quote: 'This solved our biggest pain point instantly. Our team can now focus on strategy instead of repetitive tasks.',
        customer_name: 'Michael Rodriguez',
        customer_title: 'CEO',
        customer_company: 'GrowthStart Inc',
        before_icon: '⏳',
        after_icon: '⚡',
        avatar_url: ''
      }
    ]
  }
};

export default function BeforeAfterQuote(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<BeforeAfterQuoteContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA as any
  });

  // Theme detection: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based before/after colors per uiBlockTheme.md
  const getBeforeAfterColors = (theme: UIBlockTheme) => {
    const themeColors = {
      warm: {
        before: { bg: 'bg-orange-50', icon: 'bg-orange-100', iconText: 'text-orange-600' },
        after: { bg: 'bg-amber-50', icon: 'bg-orange-100', iconText: 'text-orange-600' },
        avatar: 'bg-orange-100'
      },
      cool: {
        before: { bg: 'bg-blue-50', icon: 'bg-blue-100', iconText: 'text-blue-600' },
        after: { bg: 'bg-cyan-50', icon: 'bg-blue-100', iconText: 'text-blue-600' },
        avatar: 'bg-blue-100'
      },
      neutral: {
        before: { bg: 'bg-gray-50', icon: 'bg-gray-100', iconText: 'text-gray-600' },
        after: { bg: 'bg-slate-50', icon: 'bg-gray-100', iconText: 'text-gray-600' },
        avatar: 'bg-gray-100'
      }
    };

    return themeColors[theme];
  };

  const colors = getBeforeAfterColors(theme);

  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');

  // V2: Direct array access - no legacy parsing needed
  const transformations: Transformation[] = blockContent.transformations || [];

  // V2: Handler to update a transformation field
  const handleTransformationUpdate = (id: string, field: keyof Transformation, value: string) => {
    const updated = transformations.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    );
    (handleContentUpdate as any)('transformations', updated);
  };

  // V2: Add new transformation (max: 4)
  const handleAddTransformation = () => {
    if (transformations.length >= 4) return;
    const newT: Transformation = {
      id: `t-${Date.now()}`,
      before_situation: 'Struggling with a significant challenge',
      after_outcome: 'Achieved remarkable results and transformation',
      testimonial_quote: 'This solution completely changed our approach and delivered incredible outcomes.',
      customer_name: 'New Customer',
      customer_title: 'Role Title',
      customer_company: 'Company Name',
      before_icon: getRandomIconFromCategory('problem'),
      after_icon: getRandomIconFromCategory('success'),
      avatar_url: ''
    };
    (handleContentUpdate as any)('transformations', [...transformations, newT]);
  };

  // V2: Remove transformation (min: 1)
  const handleRemoveTransformation = (id: string) => {
    if (transformations.length <= 1) return;
    (handleContentUpdate as any)('transformations', transformations.filter(t => t.id !== id));
  };

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Get card background based on section background
  const cardBackground = backgroundType === 'primary'
    ? 'bg-white/10 backdrop-blur-sm border-white/20'
    : 'bg-white border-gray-200';

  const cardHover = backgroundType === 'primary'
    ? 'hover:bg-white/20 hover:border-white/30'
    : 'hover:border-blue-300 hover:shadow-lg';

  // V2: TransformationCard using clean transformation object
  const TransformationCard = React.memo(({ transformation, canRemove, colors }: {
    transformation: Transformation;
    canRemove: boolean;
    colors: ReturnType<typeof getBeforeAfterColors>;
  }) => {
    const tId = transformation.id;

    return (
      <div className={`group relative ${cardBackground} ${cardHover} rounded-2xl shadow-xl border overflow-hidden transition-all duration-300`}>

        {/* Delete button - only show in edit mode and if can remove */}
        {mode === 'edit' && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTransformation(tId);
            }}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
            title="Remove this transformation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Before/After Comparison */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">

          {/* Before */}
          <div className={`p-6 ${colors.before.bg}`}>
            <div className="flex items-center space-x-2 mb-4">
              <div className={`w-8 h-8 rounded-full ${colors.before.icon} ${colors.before.iconText} flex items-center justify-center group/icon-edit relative`}>
                <IconEditableText
                  mode={mode}
                  value={transformation.before_icon || blockContent.before_icon || '❌'}
                  onEdit={(value) => handleTransformationUpdate(tId, 'before_icon', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  iconSize="md"
                  className="text-lg text-white"
                  sectionId={sectionId}
                  elementKey={`transformations.${tId}.before_icon`}
                />
              </div>
              <span className="font-semibold text-red-700">Before</span>
            </div>
            <EditableAdaptiveText
              mode={mode}
              value={transformation.before_situation}
              onEdit={(value) => handleTransformationUpdate(tId, 'before_situation', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-gray-700 leading-relaxed text-sm"
              placeholder="Describe the before situation..."
              sectionId={sectionId}
              elementKey={`transformations.${tId}.before_situation`}
              sectionBackground={sectionBackground}
            />
          </div>

          {/* After */}
          <div className={`p-6 ${colors.after.bg}`}>
            <div className="flex items-center space-x-2 mb-4">
              <div className={`w-8 h-8 rounded-full ${colors.after.icon} ${colors.after.iconText} flex items-center justify-center group/icon-edit relative`}>
                <IconEditableText
                  mode={mode}
                  value={transformation.after_icon || blockContent.after_icon || '✅'}
                  onEdit={(value) => handleTransformationUpdate(tId, 'after_icon', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  iconSize="md"
                  className="text-lg text-white"
                  sectionId={sectionId}
                  elementKey={`transformations.${tId}.after_icon`}
                />
              </div>
              <span className="font-semibold text-green-700">After</span>
            </div>
            <EditableAdaptiveText
              mode={mode}
              value={transformation.after_outcome}
              onEdit={(value) => handleTransformationUpdate(tId, 'after_outcome', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-gray-700 leading-relaxed text-sm"
              placeholder="Describe the after outcome..."
              sectionId={sectionId}
              elementKey={`transformations.${tId}.after_outcome`}
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

        {/* Testimonial Quote */}
        <div className="p-6 bg-gray-50">
          <blockquote className="text-gray-800 italic mb-4 text-sm leading-relaxed">
            <EditableAdaptiveText
              mode={mode}
              value={transformation.testimonial_quote ? `"${transformation.testimonial_quote}"` : ''}
              onEdit={(value) => handleTransformationUpdate(tId, 'testimonial_quote', value.replace(/^"|"$/g, ''))}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className=""
              placeholder={'"Add customer testimonial quote..."'}
              sectionId={sectionId}
              elementKey={`transformations.${tId}.testimonial_quote`}
              sectionBackground={sectionBackground}
            />
          </blockquote>

          <div className="flex items-center space-x-3">
            <div className={`${colors.avatar} rounded-full p-0.5`}>
              <AvatarEditableComponent
                mode={mode}
                avatarUrl={transformation.avatar_url || ''}
                onAvatarChange={(url) => handleTransformationUpdate(tId, 'avatar_url', url)}
                customerName={transformation.customer_name}
                size="md"
                className=""
              />
            </div>
            <div className="flex-1">
              <EditableAdaptiveText
                mode={mode}
                value={transformation.customer_name}
                onEdit={(value) => handleTransformationUpdate(tId, 'customer_name', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="font-semibold text-gray-900 text-sm"
                placeholder="Customer name..."
                sectionId={sectionId}
                elementKey={`transformations.${tId}.customer_name`}
                sectionBackground={sectionBackground}
              />
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <EditableAdaptiveText
                  mode={mode}
                  value={transformation.customer_title}
                  onEdit={(value) => handleTransformationUpdate(tId, 'customer_title', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-xs text-gray-600"
                  placeholder="Title"
                  sectionId={sectionId}
                  elementKey={`transformations.${tId}.customer_title`}
                  sectionBackground={sectionBackground}
                />
                {transformation.customer_company && (
                  <>
                    <span className="text-gray-400">at</span>
                    <EditableAdaptiveText
                      mode={mode}
                      value={transformation.customer_company}
                      onEdit={(value) => handleTransformationUpdate(tId, 'customer_company', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-xs text-gray-600"
                      placeholder="Company"
                      sectionId={sectionId}
                      elementKey={`transformations.${tId}.customer_company`}
                      sectionBackground={sectionBackground}
                    />
                  </>
                )}
                {!transformation.customer_company && mode === 'edit' && (
                  <>
                    <span className="text-gray-400">at</span>
                    <EditableAdaptiveText
                      mode={mode}
                      value=""
                      onEdit={(value) => handleTransformationUpdate(tId, 'customer_company', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-xs text-gray-600"
                      placeholder="Company"
                      sectionId={sectionId}
                      elementKey={`transformations.${tId}.customer_company`}
                      sectionBackground={sectionBackground}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });
  TransformationCard.displayName = 'TransformationCard';

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="BeforeAfterQuote"
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
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce transformation stories..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {transformations.map((transformation) => (
            <TransformationCard
              key={transformation.id}
              transformation={transformation}
              canRemove={transformations.length > 1}
              colors={colors}
            />
          ))}
        </div>

        {/* Add Transformation Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && transformations.length < 4 && (
          <div className="mb-12 text-center">
            <button
              onClick={handleAddTransformation}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Transformation</span>
            </button>
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'BeforeAfterQuote',
  category: 'Testimonial',
  description: 'Dynamic before/after transformation testimonials with add/delete functionality. Support for 1-4 transformation cards with clean, focused design.',
  tags: ['testimonial', 'before-after', 'transformation', 'dynamic', 'wysiwyg', 'focused', 'editable'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',

  // V2: Updated content fields for clean array structure
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_icon', label: 'Global Before Icon', type: 'text', required: false },
    { key: 'after_icon', label: 'Global After Icon', type: 'text', required: false },
    { key: 'transformations', label: 'Transformations (array)', type: 'array', required: true }
  ],

  // Element restriction information
  elementRestrictions: {
    allowsUniversalElements: false,
    restrictionLevel: 'strict' as const,
    reason: "Transformation cards use precise before/after layouts with structured testimonial data that additional elements would disrupt",
    alternativeSuggestions: [
      "Edit transformation content directly by clicking on text within the cards",
      "Modify individual customer names, quotes, and company inline",
      "Upload customer photos using the avatar editing system",
      "Icons are editable with hover-to-edit functionality",
      "Switch to a flexible content section for custom elements"
    ]
  },

  features: [
    'Dynamic card management with add/delete functionality',
    'Support for 1-4 transformation cards',
    'Clean WYSIWYG experience with intuitive controls',
    'Customer company field for B2B credibility',
    'Advanced avatar system with photo upload per transformation',
    'Inline editing of all essential elements',
    'Per-card before/after icons',
    'Adaptive styling for any background',
    'Hover-to-delete buttons following design patterns'
  ],

  useCases: [
    'Dynamic transformation testimonials',
    'Scalable before/after comparisons',
    'Customer success story collections',
    'B2B social proof sections',
    'Adaptable transformation showcases'
  ]
};
