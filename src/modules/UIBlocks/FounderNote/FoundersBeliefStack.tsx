// components/FounderNote/FoundersBeliefStack.tsx
// Founder's beliefs and values presentation
// Builds trust through transparent values and principled positioning

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText, 
  AccentBadge 
} from '@/components/layout/EditableContent';
import { 
  CTAButton, 
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface FoundersBeliefStackContent {
  beliefs_headline: string;
  beliefs_intro: string;
  belief_items: string;
  commitment_text: string;
  cta_text: string;
  founder_name?: string;
  founder_title?: string;
  company_values?: string;
  trust_items?: string;
  founder_image?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  beliefs_headline: { 
    type: 'string' as const, 
    default: 'The Principles That Guide Everything We Do' 
  },
  beliefs_intro: { 
    type: 'string' as const, 
    default: 'Building a company isn\'t just about creating a product. It\'s about standing for something bigger. These are the beliefs that drive every decision we make and every feature we build.' 
  },
  belief_items: { 
    type: 'string' as const, 
    default: '🎯 Simplicity Over Complexity|We believe the best solutions are often the simplest ones. Instead of adding more features, we focus on making existing ones work perfectly.|🚀 People Before Profit|Every decision starts with asking: "How does this help our users achieve their goals?" Revenue follows value, not the other way around.|🌱 Growth Through Empowerment|We don\'t just want to serve customers; we want to empower them to achieve things they never thought possible.|🔒 Privacy is Non-Negotiable|Your data belongs to you. We will never sell, share, or monetize your personal information. Ever.|⚡ Speed Without Sacrifice|Fast doesn\'t mean rushed. We move quickly while maintaining the highest standards of quality and security.|🌍 Global Thinking, Local Care|We build for the world but treat every user like they\'re our only customer.' 
  },
  commitment_text: { 
    type: 'string' as const, 
    default: 'These aren\'t just words on a wall. They\'re commitments we make to every person who trusts us with their business. When you choose our platform, you\'re not just getting software - you\'re partnering with a team that shares your values.' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Join Our Mission' 
  },
  founder_name: { 
    type: 'string' as const, 
    default: 'Alex Rivera' 
  },
  founder_title: { 
    type: 'string' as const, 
    default: 'Founder & CEO' 
  },
  company_values: { 
    type: 'string' as const, 
    default: 'Transparency|Innovation|Integrity|Customer Success' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: 'B-Corp Certified|SOC 2 Compliant|GDPR Compliant|Carbon Neutral' 
  },
  founder_image: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Belief Card Component
const BeliefCard = React.memo(({ 
  icon, 
  title, 
  description, 
  index,
  colorTokens,
  dynamicTextColors,
  h3Style
}: {
  icon: string;
  title: string;
  description: string;
  index: number;
  colorTokens: any;
  dynamicTextColors: any;
  h3Style: React.CSSProperties;
}) => {
  const cardColors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-indigo-500 to-purple-600',
    'from-teal-500 to-cyan-600'
  ];

  const bgColors = [
    'bg-blue-50 border-blue-200',
    'bg-purple-50 border-purple-200',
    'bg-green-50 border-green-200',
    'bg-orange-50 border-orange-200',
    'bg-indigo-50 border-indigo-200',
    'bg-teal-50 border-teal-200'
  ];

  return (
    <div className={`relative bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      
      {/* Icon */}
      <div className={`w-12 h-12 bg-gradient-to-br ${cardColors[index % cardColors.length]} rounded-lg flex items-center justify-center text-white text-xl mb-4 shadow-md`}>
        {icon}
      </div>
      
      {/* Content */}
      <h3 style={h3Style} className="text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
      
      {/* Decorative element */}
      <div className={`absolute top-4 right-4 w-8 h-8 ${bgColors[index % bgColors.length]} rounded-full opacity-20`}></div>
    </div>
  );
});
BeliefCard.displayName = 'BeliefCard';

// Founder Image Placeholder Component
const FounderImagePlaceholder = React.memo(() => (
  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
    <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center">
      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  </div>
));
FounderImagePlaceholder.displayName = 'FounderImagePlaceholder';

export default function FoundersBeliefStack(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Use the abstraction hook with background type support
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
  } = useLayoutComponent<FoundersBeliefStackContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h3Style = getTypographyStyle('h3');

  // Parse belief items from pipe-separated string
  const beliefData = blockContent.belief_items 
    ? blockContent.belief_items.split('|')
    : [];

  const beliefItems = [];
  for (let i = 0; i < beliefData.length; i += 2) {
    if (i + 1 < beliefData.length) {
      const titleWithIcon = beliefData[i]?.trim() || '';
      const icon = titleWithIcon.split(' ')[0] || '💡';
      const title = titleWithIcon.split(' ').slice(1).join(' ') || 'Belief';
      const description = beliefData[i + 1]?.trim() || '';
      
      beliefItems.push({ icon, title, description });
    }
  }

  // Parse company values from pipe-separated string
  const companyValues = blockContent.company_values 
    ? blockContent.company_values.split('|').map(item => item.trim()).filter(Boolean)
    : ['Quality', 'Innovation'];

  // Parse trust indicators from pipe-separated string
  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : ['Certified', 'Compliant'];

  // Get muted text color for trust indicators
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  // Get showImageToolbar for handling image clicks
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="FoundersBeliefStack"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.beliefs_headline || ''}
            onEdit={(value) => handleContentUpdate('beliefs_headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="leading-tight mb-6"
            sectionId={sectionId}
            elementKey="beliefs_headline"
            sectionBackground={sectionBackground}
          />

          <EditableAdaptiveText
            mode={mode}
            value={blockContent.beliefs_intro || ''}
            onEdit={(value) => handleContentUpdate('beliefs_intro', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            className="leading-relaxed max-w-3xl mx-auto"
            placeholder="Introduce your beliefs and why they matter..."
            sectionId={sectionId}
            elementKey="beliefs_intro"
            sectionBackground={sectionBackground}
          />
        </div>

        {/* Beliefs Grid */}
        <div className="mb-12">
          {mode === 'edit' ? (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Belief Items</h4>
              <p className="text-sm text-gray-600 mb-3">
                Format: Icon Title|Description (repeat for each belief)
              </p>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.belief_items || ''}
                onEdit={(value) => handleContentUpdate('belief_items', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                textStyle={{ color: '#374151', fontSize: '0.875rem' }}
                placeholder="🎯 First Belief|Description here|🚀 Second Belief|Description here..."
                sectionId={sectionId}
                elementKey="belief_items"
                sectionBackground="bg-gray-50"
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beliefItems.map((belief, index) => (
                <BeliefCard
                  key={index}
                  icon={belief.icon}
                  title={belief.title}
                  description={belief.description}
                  index={index}
                  colorTokens={colorTokens}
                  dynamicTextColors={dynamicTextColors}
                  h3Style={h3Style}
                />
              ))}
            </div>
          )}
        </div>

        {/* Founder Commitment Section */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 lg:p-12 mb-12">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            
            {/* Founder Image */}
            <div className="text-center lg:text-left">
              {blockContent.founder_image && blockContent.founder_image !== '' ? (
                <img
                  src={blockContent.founder_image}
                  alt="Founder"
                  className="w-24 h-24 rounded-full object-cover cursor-pointer border-4 border-white shadow-lg mx-auto lg:mx-0"
                  data-image-id={`${sectionId}-founder-image`}
                  onMouseUp={(e) => {
                        // Image toolbar is only available in edit mode
                      }}
                />
              ) : (
                <div className="mx-auto lg:mx-0 w-24">
                  <FounderImagePlaceholder />
                </div>
              )}
              
              <div className="mt-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.founder_name || ''}
                  onEdit={(value) => handleContentUpdate('founder_name', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ fontWeight: '600', color: '#111827' }}
                  placeholder="Founder Name"
                  sectionId={sectionId}
                  elementKey="founder_name"
                  sectionBackground="bg-blue-50"
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.founder_title || ''}
                  onEdit={(value) => handleContentUpdate('founder_title', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ fontSize: '0.875rem', color: '#4B5563' }}
                  placeholder="Title"
                  sectionId={sectionId}
                  elementKey="founder_title"
                  sectionBackground="bg-blue-50"
                />
              </div>
            </div>

            {/* Commitment Text */}
            <div className="lg:col-span-2">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.commitment_text || ''}
                onEdit={(value) => handleContentUpdate('commitment_text', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                textStyle={{ fontSize: '1.125rem', lineHeight: '1.75', color: '#374151' }}
                placeholder="Share your personal commitment to these beliefs..."
                sectionId={sectionId}
                elementKey="commitment_text"
                sectionBackground="bg-blue-50"
              />
            </div>
          </div>
        </div>

        {/* Company Values */}
        <div className="text-center mb-12">
          <h3 style={h3Style} className="text-gray-900 mb-6">Our Core Values</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {companyValues.map((value, index) => (
              <div key={index} className="bg-white rounded-full px-6 py-3 shadow-md border border-gray-100">
                <span className="font-medium text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <CTAButton
            text={blockContent.cta_text}
            colorTokens={colorTokens}
            className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 mb-8"
            variant="primary"
            sectionId={sectionId}
            elementKey="cta_text"
          />
          
          {/* Trust Indicators */}
          <TrustIndicators 
            items={trustItems}
            colorClass={mutedTextColor}
            iconColor="text-green-500"
          />
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'FoundersBeliefStack',
  category: 'Founder Note',
  description: 'Founder\'s beliefs and values presentation. Perfect for mission-driven companies and building trust through transparency.',
  tags: ['founder', 'beliefs', 'values', 'principles', 'mission', 'transparency'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'beliefs_headline', label: 'Beliefs Headline', type: 'text', required: true },
    { key: 'beliefs_intro', label: 'Introduction Text', type: 'textarea', required: true },
    { key: 'belief_items', label: 'Belief Items (Icon Title|Description - repeat)', type: 'textarea', required: true },
    { key: 'commitment_text', label: 'Founder Commitment', type: 'textarea', required: true },
    { key: 'founder_name', label: 'Founder Name', type: 'text', required: false },
    { key: 'founder_title', label: 'Founder Title', type: 'text', required: false },
    { key: 'company_values', label: 'Company Values (pipe separated)', type: 'text', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'founder_image', label: 'Founder Photo', type: 'image', required: false }
  ],
  
  features: [
    'Grid layout of belief cards with icons',
    'Founder commitment section with photo',
    'Company values display badges',
    'Colorful card design with hover effects',
    'Trust indicators and certifications',
    'Personal founder attribution'
  ],
  
  useCases: [
    'Mission-driven company introductions',
    'Values-based brand positioning',
    'B-Corp and sustainable business messaging',
    'Ethical business practice communication',
    'Founder-led company culture pages',
    'Trust-building through transparency'
  ]
};