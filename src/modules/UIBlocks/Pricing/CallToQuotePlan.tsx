import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
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

interface CallToQuotePlanContent {
  headline: string;
  value_proposition: string;
  contact_options: string;
  contact_ctas: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  // Contact icons
  contact_icon_1?: string;
  contact_icon_2?: string;
  contact_icon_3?: string;
  contact_icon_4?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Get a Custom Quote for Your Business' 
  },
  value_proposition: { 
    type: 'string' as const, 
    default: 'Ready to take the next step? Get personalized pricing and see how our solution can work specifically for your needs.' 
  },
  contact_options: { 
    type: 'string' as const, 
    default: 'Schedule a Demo|Request a Quote|Talk to Sales|Get Pricing' 
  },
  contact_ctas: { 
    type: 'string' as const, 
    default: 'Book Demo|Get Quote|Contact Sales|View Pricing' 
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
  // Contact icons
  contact_icon_1: { type: 'string' as const, default: '🎥' },
  contact_icon_2: { type: 'string' as const, default: '💰' },
  contact_icon_3: { type: 'string' as const, default: '📞' },
  contact_icon_4: { type: 'string' as const, default: '💲' }
};

export default function CallToQuotePlan(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<CallToQuotePlanContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const contactOptions = blockContent.contact_options 
    ? blockContent.contact_options.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const contactCtas = blockContent.contact_ctas 
    ? blockContent.contact_ctas.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const contactOptionsList = contactOptions.map((option, index) => ({
    title: option,
    cta: contactCtas[index] || 'Contact Us'
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getContactIcon = (index: number) => {
    const iconFields = ['contact_icon_1', 'contact_icon_2', 'contact_icon_3', 'contact_icon_4'];
    return blockContent[iconFields[index] as keyof CallToQuotePlanContent] || ['🎥', '💰', '📞', '📄'][index];
  };

  const ContactCard = ({ option, index }: {
    option: typeof contactOptionsList[0];
    index: number;
  }) => (
    <div className={`bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300 relative group/contact-card-${index}`}>
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${colorTokens.ctaBg} flex items-center justify-center text-white group/icon-edit`}>
          <IconEditableText
            mode={mode}
            value={getContactIcon(index)}
            onEdit={(value) => handleContentUpdate(`contact_icon_${index + 1}` as keyof CallToQuotePlanContent, value)}
            backgroundType="primary"
            colorTokens={colorTokens}
            iconSize="lg"
            className="text-white text-3xl"
            sectionId={sectionId}
            elementKey={`contact_icon_${index + 1}`}
          />
        </div>
        
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const options = blockContent.contact_options.split('|');
              options[index] = e.currentTarget.textContent || '';
              handleContentUpdate('contact_options', options.join('|'));
            }}
            className="font-semibold text-gray-900 mb-3 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
            style={h3Style}
          >
            {option.title}
          </div>
        ) : (
          <h3 style={h3Style} className="font-semibold text-gray-900 mb-3">{option.title}</h3>
        )}
        
        <CTAButton
          text={option.cta}
          colorTokens={colorTokens}
          className="w-full"
          variant={index === 0 ? "primary" : "secondary"}
          sectionId={sectionId}
          elementKey={`contact_cta_${index}`}
        />
      </div>
      
      {/* Remove contact card button - only in edit mode and when we have more than 1 card */}
      {mode === 'edit' && contactOptionsList.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Remove this contact card from all pipe-separated fields
            const removeFromPipeList = (value: string, indexToRemove: number) => {
              const items = value.split('|');
              items.splice(indexToRemove, 1);
              return items.join('|');
            };
            
            handleContentUpdate('contact_options', removeFromPipeList(blockContent.contact_options, index));
            handleContentUpdate('contact_ctas', removeFromPipeList(blockContent.contact_ctas, index));
            
            // Update contact icons by shifting them
            const iconFields = ['contact_icon_1', 'contact_icon_2', 'contact_icon_3', 'contact_icon_4'];
            iconFields.forEach((field, iconIndex) => {
              if (iconIndex === index) {
                // Remove this icon by setting empty or shifting later icons up
                if (iconIndex < iconFields.length - 1) {
                  // Shift icons up
                  const nextIconValue = blockContent[iconFields[iconIndex + 1] as keyof CallToQuotePlanContent] || '';
                  handleContentUpdate(field as keyof CallToQuotePlanContent, nextIconValue);
                } else {
                  // Last icon, just clear it
                  handleContentUpdate(field as keyof CallToQuotePlanContent, '');
                }
              } else if (iconIndex > index) {
                // Shift this icon up
                if (iconIndex < iconFields.length - 1) {
                  const nextIconValue = blockContent[iconFields[iconIndex + 1] as keyof CallToQuotePlanContent] || '';
                  handleContentUpdate(field as keyof CallToQuotePlanContent, nextIconValue);
                } else {
                  // Clear the last icon
                  handleContentUpdate(field as keyof CallToQuotePlanContent, '');
                }
              }
            });
          }}
          className={`opacity-0 group-hover/contact-card-${index}:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10`}
          title="Remove this contact option"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CallToQuotePlan"
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
              className="mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your contact options..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="max-w-4xl mx-auto mb-12">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.value_proposition || ''}
              onEdit={(value) => handleContentUpdate('value_proposition', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              style={bodyLgStyle}
              className="text-gray-700 leading-relaxed"
              sectionId={sectionId}
              elementKey="value_proposition"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactOptionsList.map((option, index) => (
            <ContactCard
              key={index}
              option={option}
              index={index}
            />
          ))}
          
          {/* Add contact card button - only in edit mode and when we have less than 4 cards */}
          {mode === 'edit' && contactOptionsList.length < 4 && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  const options = blockContent.contact_options.split('|');
                  const ctas = blockContent.contact_ctas.split('|');
                  
                  // Add smart defaults based on what we already have
                  const cardNumber = options.length + 1;
                  const defaultOptions = ['Schedule a Demo', 'Request a Quote', 'Talk to Sales', 'Get Pricing'];
                  const defaultCtas = ['Book Demo', 'Get Quote', 'Contact Sales', 'View Pricing'];
                  const defaultIcons = ['🎥', '💰', '📞', '💲'];
                  
                  options.push(defaultOptions[cardNumber - 1] || `Contact Option ${cardNumber}`);
                  ctas.push(defaultCtas[cardNumber - 1] || `Contact Us`);
                  
                  handleContentUpdate('contact_options', options.join('|'));
                  handleContentUpdate('contact_ctas', ctas.join('|'));
                  
                  // Set the appropriate icon for the new card
                  const iconField = `contact_icon_${cardNumber}` as keyof CallToQuotePlanContent;
                  handleContentUpdate(iconField, defaultIcons[cardNumber - 1] || '📞');
                }}
                className="px-6 py-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-all duration-300 border-2 border-blue-300 hover:border-blue-400 flex items-center space-x-2 min-h-[200px]"
                title="Add new contact option"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Contact Option</span>
              </button>
            </div>
          )}
        </div>

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
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
                placeholder="Add optional supporting text to reinforce your value proposition..."
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
  name: 'CallToQuotePlan',
  category: 'Pricing',
  description: 'Simple contact options for custom pricing. Perfect for businesses offering personalized quotes or consultations.',
  tags: ['pricing', 'contact', 'quote', 'sales', 'consultation'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '10 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'value_proposition', label: 'Value Proposition', type: 'textarea', required: true },
    { key: 'contact_options', label: 'Contact Options (pipe separated)', type: 'text', required: true },
    { key: 'contact_ctas', label: 'Contact CTAs (pipe separated)', type: 'text', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'contact_icon_1', label: 'Contact Icon 1', type: 'text', required: false },
    { key: 'contact_icon_2', label: 'Contact Icon 2', type: 'text', required: false },
    { key: 'contact_icon_3', label: 'Contact Icon 3', type: 'text', required: false },
    { key: 'contact_icon_4', label: 'Contact Icon 4', type: 'text', required: false }
  ],
  
  features: [
    'Multiple contact option cards',
    'Customizable icons and CTAs',
    'WYSIWYG inline editing',
    'Trust indicators support',
    'Responsive card layout'
  ],
  
  useCases: [
    'Custom pricing requests',
    'Consultation bookings',
    'Sales contact forms',
    'Quote generation',
    'Lead capture for services'
  ]
};