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
import { 
  CTAButton,
  TrustIndicators,
  StarRating 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import {
  parseCustomerAvatarData,
  updateAvatarUrls,
  parsePipeData,
  updateListData
} from '@/utils/dataParsingUtils';

interface BeforeAfterQuoteContent {
  headline: string;
  subheadline?: string;
  before_situations: string;
  after_outcomes: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles: string;
  cta_text?: string;
  before_icon?: string;
  after_icon?: string;
  avatar_urls?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Real Customer Transformations' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See how our solution transformed their operations' 
  },
  before_situations: { 
    type: 'string' as const, 
    default: 'Spending 10+ hours weekly on manual data entry|Managing inventory across multiple spreadsheets' 
  },
  after_outcomes: { 
    type: 'string' as const, 
    default: 'Automated processing with 5 hours saved weekly|Real-time management with zero stockouts' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: 'The transformation has been incredible. We went from drowning in manual work to having systems that run themselves.|This solved our biggest pain point instantly. Our team can now focus on strategy instead of repetitive tasks.' 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Sarah Chen|Michael Rodriguez' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'Operations Manager|CEO' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Your Transformation' 
  },
  before_icon: {
    type: 'string' as const,
    default: '❌'
  },
  after_icon: {
    type: 'string' as const,
    default: '✅'
  },
  avatar_urls: {
    type: 'string' as const,
    default: '{}'
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
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<BeforeAfterQuoteContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const beforeSituations = blockContent.before_situations 
    ? blockContent.before_situations.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const afterOutcomes = blockContent.after_outcomes 
    ? blockContent.after_outcomes.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonialQuotes = blockContent.testimonial_quotes 
    ? blockContent.testimonial_quotes.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerNames = blockContent.customer_names 
    ? blockContent.customer_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerTitles = blockContent.customer_titles 
    ? blockContent.customer_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  // Removed parsing for companies, timeframes, metrics - no longer needed

  // Support up to 4 transformations with dynamic add/delete
  const transformations = beforeSituations.slice(0, 4).map((before, index) => ({
    before,
    after: afterOutcomes[index] || '',
    quote: testimonialQuotes[index] || '',
    customerName: customerNames[index] || '',
    customerTitle: customerTitles[index] || ''
  }));

  // Parse customer avatar data for advanced avatar system
  const customerAvatarData = parseCustomerAvatarData(
    blockContent.customer_names, 
    blockContent.avatar_urls || '{}'
  );

  // Handle individual field editing functions
  const handleBeforeEdit = (index: number, value: string) => {
    const updatedBefores = updateListData(blockContent.before_situations, index, value);
    handleContentUpdate('before_situations', updatedBefores);
  };

  const handleAfterEdit = (index: number, value: string) => {
    const updatedAfters = updateListData(blockContent.after_outcomes, index, value);
    handleContentUpdate('after_outcomes', updatedAfters);
  };

  const handleQuoteEdit = (index: number, value: string) => {
    const updatedQuotes = updateListData(blockContent.testimonial_quotes, index, value);
    handleContentUpdate('testimonial_quotes', updatedQuotes);
  };

  const handleNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.customer_names, index, value);
    handleContentUpdate('customer_names', updatedNames);
  };

  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.customer_titles, index, value);
    handleContentUpdate('customer_titles', updatedTitles);
  };

  // Removed unnecessary edit handlers for company, timeframe, and metrics

  // Handle avatar URL updates
  const handleAvatarChange = (customerName: string, avatarUrl: string) => {
    const updatedAvatarUrls = updateAvatarUrls(blockContent.avatar_urls || '{}', customerName, avatarUrl);
    handleContentUpdate('avatar_urls', updatedAvatarUrls);
  };

  // Helper function to add a new transformation
  const addTransformation = () => {
    const befores = parsePipeData(blockContent.before_situations);
    const afters = parsePipeData(blockContent.after_outcomes);
    const quotes = parsePipeData(blockContent.testimonial_quotes);
    const names = parsePipeData(blockContent.customer_names);
    const titles = parsePipeData(blockContent.customer_titles);

    // Add new transformation with default content
    befores.push('Struggling with a significant challenge');
    afters.push('Achieved remarkable results and transformation');
    quotes.push('This solution completely changed our approach and delivered incredible outcomes.');
    names.push('New Customer');
    titles.push('Role Title');

    // Update all fields
    handleContentUpdate('before_situations', befores.join('|'));
    handleContentUpdate('after_outcomes', afters.join('|'));
    handleContentUpdate('testimonial_quotes', quotes.join('|'));
    handleContentUpdate('customer_names', names.join('|'));
    handleContentUpdate('customer_titles', titles.join('|'));
  };

  // Helper function to remove a transformation
  const removeTransformation = (indexToRemove: number) => {
    const befores = parsePipeData(blockContent.before_situations);
    const afters = parsePipeData(blockContent.after_outcomes);
    const quotes = parsePipeData(blockContent.testimonial_quotes);
    const names = parsePipeData(blockContent.customer_names);
    const titles = parsePipeData(blockContent.customer_titles);

    // Get the name before removing for avatar cleanup
    const removedName = names[indexToRemove];

    // Remove the transformation at the specified index
    if (indexToRemove >= 0 && indexToRemove < befores.length) {
      befores.splice(indexToRemove, 1);
      afters.splice(indexToRemove, 1);
      quotes.splice(indexToRemove, 1);
      names.splice(indexToRemove, 1);
      titles.splice(indexToRemove, 1);

      // Clear avatar URL for removed customer if it exists
      if (removedName && blockContent.avatar_urls) {
        try {
          const avatarUrls = JSON.parse(blockContent.avatar_urls);
          delete avatarUrls[removedName];
          handleContentUpdate('avatar_urls', JSON.stringify(avatarUrls));
        } catch (e) {
          // Invalid JSON, ignore
        }
      }

      // Update all fields
      handleContentUpdate('before_situations', befores.join('|'));
      handleContentUpdate('after_outcomes', afters.join('|'));
      handleContentUpdate('testimonial_quotes', quotes.join('|'));
      handleContentUpdate('customer_names', names.join('|'));
      handleContentUpdate('customer_titles', titles.join('|'));
    }
  };

  // Removed trust items - no longer needed

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Get card background based on section background
  const cardBackground = backgroundType === 'primary' 
    ? 'bg-white/10 backdrop-blur-sm border-white/20' 
    : 'bg-white border-gray-200';
    
  const cardHover = backgroundType === 'primary'
    ? 'hover:bg-white/20 hover:border-white/30'
    : 'hover:border-blue-300 hover:shadow-lg';

  const TransformationCard = React.memo(({ transformation, index, canRemove, onRemove }: {
    transformation: typeof transformations[0];
    index: number;
    canRemove: boolean;
    onRemove: () => void;
  }) => {
    const customerData = customerAvatarData.find(c => c.name === transformation.customerName);
    
    return (
      <div className={`group/transformation-card-${index} relative ${cardBackground} ${cardHover} rounded-2xl shadow-xl border overflow-hidden transition-all duration-300`}>

        {/* Delete button - only show in edit mode and if can remove */}
        {mode === 'edit' && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={`absolute top-4 right-4 opacity-0 group-hover/transformation-card-${index}:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10`}
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
          <div className="p-6 bg-red-50">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center group/icon-edit relative">
                <IconEditableText
                  mode={mode}
                  value={blockContent.before_icon || '❌'}
                  onEdit={(value) => handleContentUpdate('before_icon', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  iconSize="md"
                  className="text-lg text-white"
                  sectionId={sectionId}
                  elementKey="before_icon"
                />
              </div>
              <span className="font-semibold text-red-700">Before</span>
            </div>
            <EditableAdaptiveText
              mode={mode}
              value={transformation.before}
              onEdit={(value) => handleBeforeEdit(index, value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-gray-700 leading-relaxed text-sm"
              placeholder="Describe the before situation..."
              sectionId={sectionId}
              elementKey={`before_situation_${index}`}
              sectionBackground={sectionBackground}
            />
          </div>
          
          {/* After */}
          <div className="p-6 bg-green-50">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center group/icon-edit relative">
                <IconEditableText
                  mode={mode}
                  value={blockContent.after_icon || '✅'}
                  onEdit={(value) => handleContentUpdate('after_icon', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  iconSize="md"
                  className="text-lg text-white"
                  sectionId={sectionId}
                  elementKey="after_icon"
                />
              </div>
              <span className="font-semibold text-green-700">After</span>
            </div>
            <EditableAdaptiveText
              mode={mode}
              value={transformation.after}
              onEdit={(value) => handleAfterEdit(index, value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-gray-700 leading-relaxed text-sm"
              placeholder="Describe the after outcome..."
              sectionId={sectionId}
              elementKey={`after_outcome_${index}`}
              sectionBackground={sectionBackground}
            />
          </div>
        </div>
        
        {/* Removed metrics section for simplicity */}
        
        {/* Testimonial Quote */}
        <div className="p-6 bg-gray-50">
          <blockquote className="text-gray-800 italic mb-4 text-sm leading-relaxed">
            <EditableAdaptiveText
              mode={mode}
              value={transformation.quote ? `"${transformation.quote}"` : ''}
              onEdit={(value) => handleQuoteEdit(index, value.replace(/^"|"$/g, ''))}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className=""
              placeholder={'"Add customer testimonial quote..."'}
              sectionId={sectionId}
              elementKey={`testimonial_quote_${index}`}
              sectionBackground={sectionBackground}
            />
          </blockquote>
          
          <div className="flex items-center space-x-3">
            <AvatarEditableComponent
              mode={mode}
              avatarUrl={customerData?.avatarUrl || ''}
              onAvatarChange={(url) => handleAvatarChange(transformation.customerName, url)}
              customerName={transformation.customerName}
              size="md"
              className=""
            />
            <div className="flex-1">
              <EditableAdaptiveText
                mode={mode}
                value={transformation.customerName}
                onEdit={(value) => handleNameEdit(index, value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="font-semibold text-gray-900 text-sm"
                placeholder="Customer name..."
                sectionId={sectionId}
                elementKey={`customer_name_${index}`}
                sectionBackground={sectionBackground}
              />
              <EditableAdaptiveText
                mode={mode}
                value={transformation.customerTitle}
                onEdit={(value) => handleTitleEdit(index, value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="text-xs text-gray-600"
                placeholder="Customer title..."
                sectionId={sectionId}
                elementKey={`customer_title_${index}`}
                sectionBackground={sectionBackground}
              />
              {/* Removed company field for simplicity */}
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
          {transformations.map((transformation, index) => (
            <TransformationCard
              key={index}
              transformation={transformation}
              index={index}
              canRemove={transformations.length > 1}
              onRemove={() => removeTransformation(index)}
            />
          ))}
        </div>

        {/* Add Transformation Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && transformations.length < 4 && (
          <div className="mb-12 text-center">
            <button
              onClick={addTransformation}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Transformation</span>
            </button>
          </div>
        )}

        {/* CTA Button */}
        {(blockContent.cta_text || mode === 'edit') && (
          <div className="text-center mt-12">
            <CTAButton
              text={blockContent.cta_text || 'Start Your Transformation'}
              colorTokens={colorTokens}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              sectionId={sectionId}
              elementKey="cta_text"
            />
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
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_situations', label: 'Before Situations (1-4 items, pipe separated)', type: 'textarea', required: true },
    { key: 'after_outcomes', label: 'After Outcomes (1-4 items, pipe separated)', type: 'textarea', required: true },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (1-4 items, pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (1-4 items, pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (1-4 items, pipe separated)', type: 'text', required: true },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'avatar_urls', label: 'Customer Avatar URLs (JSON format)', type: 'text', required: false }
  ],

  // Element restriction information
  elementRestrictions: {
    allowsUniversalElements: false,
    restrictionLevel: 'strict' as const,
    reason: "Transformation cards use precise before/after layouts with structured testimonial data that additional elements would disrupt",
    alternativeSuggestions: [
      "Edit transformation content directly by clicking on text within the cards",
      "Modify individual customer names, quotes, and metrics inline",
      "Upload customer photos using the avatar editing system",
      "Icons are editable with hover-to-edit functionality",
      "Switch to a flexible content section for custom elements"
    ]
  },
  
  features: [
    'Dynamic card management with add/delete functionality',
    'Support for 1-4 transformation cards',
    'Clean WYSIWYG experience with intuitive controls',
    'Focus on core transformation story',
    'Advanced avatar system with photo upload',
    'Inline editing of all essential elements',
    'Adaptive styling for any background',
    'Hover-to-delete buttons following design patterns',
    'Automatic data cleanup on card removal'
  ],
  
  useCases: [
    'Dynamic transformation testimonials',
    'Scalable before/after comparisons',
    'Customer success story collections',
    'Flexible social proof sections',
    'Adaptable transformation showcases'
  ]
};