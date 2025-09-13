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
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface PullQuoteStackContent {
  headline: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles: string;
  customer_companies?: string;
  problem_contexts: string;
  emotional_hooks: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Avatar URLs for testimonials
  avatar_1?: string;
  avatar_2?: string;
  avatar_3?: string;
  avatar_4?: string;
  avatar_5?: string;
  avatar_6?: string;
  // Emotional context icons
  context_icon_1?: string;
  context_icon_2?: string;
  context_icon_3?: string;
  context_icon_4?: string;
  context_icon_5?: string;
  context_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Real Stories from People Just Like You' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: 'I was drowning in manual tasks and working 12-hour days just to stay afloat. This solution gave me my life back.|The frustration of losing potential customers due to slow response times was killing our growth. Now we respond instantly.|I felt completely overwhelmed trying to manage everything myself. Finally found something that actually works for solo entrepreneurs.|The constant worry about making mistakes with important data was consuming me. Now I sleep peacefully knowing everything is automated.|Watching competitors pull ahead while we struggled with outdated processes was heartbreaking. This leveled the playing field.|The isolation of working alone without proper tools was affecting my mental health. This platform became my virtual team.' 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Maria Santos|Jake Thompson|Lisa Chen|Robert Kim|Nina Patel|Alex Rodriguez' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'Solo Entrepreneur|Startup Founder|Freelance Consultant|Small Business Owner|Online Coach|Independent Creator' 
  },
  customer_companies: { 
    type: 'string' as const, 
    default: 'Santos Marketing|TechStart Solutions|Chen Consulting|Kim Design Studio|Patel Coaching|Rodriguez Creative' 
  },
  problem_contexts: { 
    type: 'string' as const, 
    default: 'Running a one-person marketing agency|Building a tech startup with limited resources|Managing multiple client projects alone|Growing a design business without a team|Scaling an online coaching practice|Creating content while handling business operations' 
  },
  emotional_hooks: { 
    type: 'string' as const, 
    default: 'Burnout and overwhelm|Fear of losing customers|Isolation and stress|Anxiety about mistakes|Frustration with competition|Mental health struggles' 
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
  // Avatar defaults (empty to use generated initials)
  avatar_1: { type: 'string' as const, default: '' },
  avatar_2: { type: 'string' as const, default: '' },
  avatar_3: { type: 'string' as const, default: '' },
  avatar_4: { type: 'string' as const, default: '' },
  avatar_5: { type: 'string' as const, default: '' },
  avatar_6: { type: 'string' as const, default: '' },
  // Emotional context icons
  context_icon_1: { type: 'string' as const, default: '💢' },
  context_icon_2: { type: 'string' as const, default: '😟' },
  context_icon_3: { type: 'string' as const, default: '😔' },
  context_icon_4: { type: 'string' as const, default: '😰' },
  context_icon_5: { type: 'string' as const, default: '😤' },
  context_icon_6: { type: 'string' as const, default: '😢' }
};

export default function PullQuoteStack(props: LayoutComponentProps) {
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
  } = useLayoutComponent<PullQuoteStackContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const testimonialQuotes = blockContent.testimonial_quotes 
    ? blockContent.testimonial_quotes.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerNames = blockContent.customer_names 
    ? blockContent.customer_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerTitles = blockContent.customer_titles 
    ? blockContent.customer_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerCompanies = blockContent.customer_companies 
    ? blockContent.customer_companies.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const problemContexts = blockContent.problem_contexts 
    ? blockContent.problem_contexts.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const emotionalHooks = blockContent.emotional_hooks 
    ? blockContent.emotional_hooks.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonials = testimonialQuotes.map((quote, index) => ({
    quote,
    customerName: customerNames[index] || '',
    customerTitle: customerTitles[index] || '',
    customerCompany: customerCompanies[index] || '',
    problemContext: problemContexts[index] || '',
    emotionalHook: emotionalHooks[index] || '',
    avatarUrl: (
      index === 0 ? blockContent.avatar_1 :
      index === 1 ? blockContent.avatar_2 :
      index === 2 ? blockContent.avatar_3 :
      index === 3 ? blockContent.avatar_4 :
      index === 4 ? blockContent.avatar_5 :
      blockContent.avatar_6
    ) || '',
    contextIcon: (
      index === 0 ? blockContent.context_icon_1 :
      index === 1 ? blockContent.context_icon_2 :
      index === 2 ? blockContent.context_icon_3 :
      index === 3 ? blockContent.context_icon_4 :
      index === 4 ? blockContent.context_icon_5 :
      blockContent.context_icon_6
    ) || '💢'
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getEmotionalColor = (index: number) => {
    const colors = [
      { bg: 'from-red-50 to-orange-50', border: 'border-red-200', accent: 'text-red-600' },
      { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', accent: 'text-blue-600' },
      { bg: 'from-purple-50 to-pink-50', border: 'border-purple-200', accent: 'text-purple-600' },
      { bg: 'from-green-50 to-teal-50', border: 'border-green-200', accent: 'text-green-600' },
      { bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200', accent: 'text-yellow-600' },
      { bg: 'from-gray-50 to-slate-50', border: 'border-gray-200', accent: 'text-gray-600' }
    ];
    return colors[index % colors.length];
  };

  // Handle individual editing
  const handleQuoteEdit = (index: number, value: string) => {
    const quotes = blockContent.testimonial_quotes.split('|');
    quotes[index] = value;
    handleContentUpdate('testimonial_quotes', quotes.join('|'));
  };

  const handleNameEdit = (index: number, value: string) => {
    const names = blockContent.customer_names.split('|');
    names[index] = value;
    handleContentUpdate('customer_names', names.join('|'));
  };

  const handleTitleEdit = (index: number, value: string) => {
    const titles = blockContent.customer_titles.split('|');
    titles[index] = value;
    handleContentUpdate('customer_titles', titles.join('|'));
  };

  const handleCompanyEdit = (index: number, value: string) => {
    const companies = blockContent.customer_companies ? blockContent.customer_companies.split('|') : [];
    companies[index] = value;
    handleContentUpdate('customer_companies', companies.join('|'));
  };

  const handleContextEdit = (index: number, value: string) => {
    const contexts = blockContent.problem_contexts.split('|');
    contexts[index] = value;
    handleContentUpdate('problem_contexts', contexts.join('|'));
  };

  const handleEmotionalEdit = (index: number, value: string) => {
    const emotions = blockContent.emotional_hooks.split('|');
    emotions[index] = value;
    handleContentUpdate('emotional_hooks', emotions.join('|'));
  };

  const handleAvatarChange = (index: number, url: string) => {
    const field = `avatar_${index + 1}` as keyof PullQuoteStackContent;
    handleContentUpdate(field, url);
  };

  const handleContextIconEdit = (index: number, value: string) => {
    const field = `context_icon_${index + 1}` as keyof PullQuoteStackContent;
    handleContentUpdate(field, value);
  };

  const QuoteCard = ({ testimonial, index, h3Style, bodyLgStyle }: {
    testimonial: typeof testimonials[0] & { avatarUrl: string; contextIcon: string };
    index: number;
    h3Style: React.CSSProperties;
    bodyLgStyle: React.CSSProperties;
  }) => {
    const color = getEmotionalColor(index);
    const isLarge = index % 3 === 0; // Every third quote is larger
    
    return (
      <div className={`${isLarge ? 'md:col-span-2' : ''}`}>
        <div className={`bg-gradient-to-br ${color.bg} rounded-2xl p-6 border-2 ${color.border} hover:shadow-xl transition-all duration-300 h-full`}>
          
          {/* Emotional Context - Now Editable */}
          <div className="flex items-center space-x-2 mb-4">
            <IconEditableText
              mode={mode}
              value={testimonial.contextIcon}
              onEdit={(value) => handleContextIconEdit(index, value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              iconSize="sm"
              className="text-lg"
              sectionId={sectionId}
              elementKey={`context_icon_${index + 1}`}
            />
            <EditableAdaptiveText
              mode={mode}
              value={testimonial.emotionalHook}
              onEdit={(value) => handleEmotionalEdit(index, value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className={`text-sm font-medium ${color.accent}`}
              placeholder="Emotional context..."
              sectionId={sectionId}
              elementKey={`emotional_hook_${index}`}
              sectionBackground={sectionBackground}
            />
          </div>
          
          {/* Problem Context - Now Editable */}
          <EditableAdaptiveText
            mode={mode}
            value={testimonial.problemContext}
            onEdit={(value) => handleContextEdit(index, value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            variant="body"
            className={`text-xs ${mutedTextColor} mb-4 italic`}
            placeholder="Problem context..."
            sectionId={sectionId}
            elementKey={`problem_context_${index}`}
            sectionBackground={sectionBackground}
          />
          
          {/* Quote - Now Editable */}
          <blockquote className="leading-relaxed mb-6 font-medium relative">
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
            <EditableAdaptiveText
              mode={mode}
              value={testimonial.quote}
              onEdit={(value) => handleQuoteEdit(index, value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              textStyle={isLarge ? h3Style : bodyLgStyle}
              className="text-gray-800"
              placeholder="Customer testimonial quote..."
              sectionId={sectionId}
              elementKey={`testimonial_quote_${index}`}
              sectionBackground={sectionBackground}
            />
          </blockquote>
          
          {/* Attribution - Now with Editable Avatar */}
          <div className="flex items-center space-x-3">
            <AvatarEditableComponent
              mode={mode}
              avatarUrl={testimonial.avatarUrl}
              onAvatarChange={(url) => handleAvatarChange(index, url)}
              customerName={testimonial.customerName}
              size="md"
            />
            <div className="flex-1">
              <EditableAdaptiveText
                mode={mode}
                value={testimonial.customerName}
                onEdit={(value) => handleNameEdit(index, value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="font-semibold text-gray-900 mb-1"
                placeholder="Customer name..."
                sectionId={sectionId}
                elementKey={`customer_name_${index}`}
                sectionBackground={sectionBackground}
              />
              <EditableAdaptiveText
                mode={mode}
                value={testimonial.customerTitle}
                onEdit={(value) => handleTitleEdit(index, value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="text-sm text-gray-600 mb-1"
                placeholder="Customer title..."
                sectionId={sectionId}
                elementKey={`customer_title_${index}`}
                sectionBackground={sectionBackground}
              />
              {(testimonial.customerCompany || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={testimonial.customerCompany}
                  onEdit={(value) => handleCompanyEdit(index, value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm font-medium ${color.accent}`}
                  placeholder="Company name..."
                  sectionId={sectionId}
                  elementKey={`customer_company_${index}`}
                  sectionBackground={sectionBackground}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PullQuoteStack"
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
              placeholder="Add optional subheadline to introduce emotional testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* WYSIWYG Testimonial Grid - Same Layout for Edit and Preview */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <QuoteCard
              key={index}
              testimonial={testimonial as typeof testimonials[0] & { avatarUrl: string; contextIcon: string }}
              index={index}
              h3Style={h3Style}
              bodyLgStyle={bodyLgStyle}
            />
          ))}
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce emotional connection..."
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
  name: 'PullQuoteStack',
  category: 'Testimonial',
  description: 'WYSIWYG emotional testimonial grid with editable avatars, quotes, and context icons. Production-ready with inline editing.',
  tags: ['testimonial', 'emotional', 'pain-led', 'quotes', 'wysiwyg', 'avatars'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: true },
    { key: 'customer_companies', label: 'Customer Companies (pipe separated)', type: 'text', required: false },
    { key: 'problem_contexts', label: 'Problem Contexts (pipe separated)', type: 'textarea', required: true },
    { key: 'emotional_hooks', label: 'Emotional Hooks (pipe separated)', type: 'text', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'WYSIWYG editing experience - same layout in edit and preview',
    'Inline editable testimonial quotes, names, titles, companies',
    'Editable customer avatars with upload functionality',
    'Contextual emotion icons with direct editing',
    'Visual testimonial cards with proper styling',
    'Problem context highlighting',
    'Emotional connection building',
    'Perfect for pain-led copy',
    'Masonry-style responsive grid layout'
  ],
  
  useCases: [
    'Pain-led copy campaigns',
    'Burnout and overload problems',
    'Early-stage startup testimonials',
    'Solo entrepreneur challenges',
    'Emotional connection building',
    'Customer story showcases'
  ]
};