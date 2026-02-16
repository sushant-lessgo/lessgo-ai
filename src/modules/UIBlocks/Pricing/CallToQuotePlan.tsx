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
import { getCardStyles } from '@/modules/Design/cardStyles';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';

// Contact card structure
interface ContactCard {
  id: string;
  title: string;
  description: string;
  cta: string;
  icon: string;
}

// Trust item structure
interface TrustItem {
  id: string;
  text: string;
}

interface CallToQuotePlanContent {
  headline: string;
  value_proposition: string;
  subheadline?: string;
  supporting_text?: string;
  response_time?: string;
  contact_cards: ContactCard[];
  trust_items?: TrustItem[];
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
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  supporting_text: {
    type: 'string' as const,
    default: ''
  },
  response_time: {
    type: 'string' as const,
    default: ''
  },
  contact_cards: {
    type: 'array' as const,
    default: [
      {
        id: 'cc-1',
        title: 'Schedule a Demo',
        description: 'See the platform in action with a personalized walkthrough',
        cta: 'Book Demo',
        icon: 'calendar'
      },
      {
        id: 'cc-2',
        title: 'Request a Quote',
        description: 'Get pricing tailored to your team size and needs',
        cta: 'Get Quote',
        icon: 'dollar-sign'
      },
      {
        id: 'cc-3',
        title: 'Talk to Sales',
        description: 'Discuss your specific requirements with our enterprise team',
        cta: 'Contact Sales',
        icon: 'phone'
      }
    ]
  },
  trust_items: {
    type: 'array' as const,
    default: []
  }
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

  // Theme detection
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get adaptive card styles based on section background luminance
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme: uiBlockTheme
    });
  }, [sectionBackground, uiBlockTheme]);

  // Create typography styles
  const h4Style = getTypographyStyle('h4');
  const bodyStyle = getTypographyStyle('body');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Text colors from tokens
  const headingColor = dynamicTextColors?.heading || colorTokens.textPrimary;
  const bodyColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Ensure contact_cards is always an array
  const contactCards: ContactCard[] = Array.isArray(blockContent.contact_cards)
    ? blockContent.contact_cards
    : CONTENT_SCHEMA.contact_cards.default;

  // Ensure trust_items is always an array
  const trustItems: TrustItem[] = Array.isArray(blockContent.trust_items)
    ? blockContent.trust_items
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Handler functions
  const handleCardUpdate = (cardId: string, field: keyof ContactCard, value: string) => {
    const updatedCards = contactCards.map(card =>
      card.id === cardId ? { ...card, [field]: value } : card
    );
    handleContentUpdate('contact_cards', JSON.stringify(updatedCards));
  };

  const handleAddCard = () => {
    if (contactCards.length >= 4) return;

    const newCard: ContactCard = {
      id: `cc-${Date.now()}`,
      title: 'New Contact Option',
      description: 'Add a description for this contact option',
      cta: 'Contact Us',
      icon: 'message-circle'
    };
    handleContentUpdate('contact_cards', JSON.stringify([...contactCards, newCard]));
  };

  const handleRemoveCard = (cardId: string) => {
    if (contactCards.length <= 2) return;
    handleContentUpdate('contact_cards', JSON.stringify(contactCards.filter(card => card.id !== cardId)));
  };

  const handleTrustItemUpdate = (itemId: string, value: string) => {
    const updatedItems = trustItems.map(item =>
      item.id === itemId ? { ...item, text: value } : item
    );
    handleContentUpdate('trust_items', JSON.stringify(updatedItems));
  };

  const handleAddTrustItem = () => {
    if (trustItems.length >= 5) return;

    const newItem: TrustItem = {
      id: `ti-${Date.now()}`,
      text: 'New trust indicator'
    };
    handleContentUpdate('trust_items', JSON.stringify([...trustItems, newItem]));
  };

  const handleRemoveTrustItem = (itemId: string) => {
    handleContentUpdate('trust_items', JSON.stringify(trustItems.filter(item => item.id !== itemId)));
  };

  const ContactCardComponent = ({ card, index }: { card: ContactCard; index: number }) => (
    <div className={`${cardStyles.bg} ${cardStyles.blur} rounded-xl border-2 ${cardStyles.border} ${cardStyles.shadow} ${cardStyles.hoverEffect} p-6 transition-all duration-300 relative group`}>
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${cardStyles.iconBg} flex items-center justify-center ${cardStyles.iconColor}`}>
          <IconEditableText
            mode={mode}
            value={card.icon}
            onEdit={(value) => handleCardUpdate(card.id, 'icon', value)}
            backgroundType="primary"
            colorTokens={colorTokens}
            iconSize="lg"
            className="text-3xl"
            sectionId={sectionId}
            elementKey={`contact_cards.${card.id}.icon`}
          />
        </div>

        {mode !== 'preview' ? (
          <>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCardUpdate(card.id, 'title', e.currentTarget.textContent || '')}
              className={`font-semibold mb-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text ${cardStyles.textHeading}`}
              style={h4Style}
              data-section-id={sectionId}
              data-element-key={`contact_cards.${card.id}.title`}
            >
              {card.title}
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCardUpdate(card.id, 'description', e.currentTarget.textContent || '')}
              className={`mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text ${cardStyles.textBody}`}
              style={bodyStyle}
              data-section-id={sectionId}
              data-element-key={`contact_cards.${card.id}.description`}
            >
              {card.description}
            </div>
          </>
        ) : (
          <>
            <h4 style={h4Style} className={`font-semibold mb-2 ${cardStyles.textHeading}`}>{card.title}</h4>
            <p style={bodyStyle} className={`mb-4 ${cardStyles.textBody}`}>{card.description}</p>
          </>
        )}

        <CTAButton
          text={card.cta}
          colorTokens={colorTokens}
          className="w-full"
          variant={index === 0 ? "primary" : "secondary"}
          sectionId={sectionId}
          elementKey={`contact_cards.${card.id}.cta`}
        />
      </div>

      {/* Remove card button - only in edit mode and when we have more than 2 cards */}
      {mode === 'edit' && contactCards.length > 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveCard(card.id);
          }}
          className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-opacity duration-200 z-10"
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
              style={bodyStyle}
              className="leading-relaxed"
              sectionId={sectionId}
              elementKey="value_proposition"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {contactCards.map((card, index) => (
            <ContactCardComponent
              key={card.id}
              card={card}
              index={index}
            />
          ))}

          {/* Add card button - only in edit mode and when we have less than 4 cards */}
          {mode === 'edit' && contactCards.length < 4 && (
            <div className="flex items-center justify-center">
              <button
                onClick={handleAddCard}
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

        {/* Response Time */}
        {(blockContent.response_time || mode === 'edit') && (
          <div className="text-center mb-8">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.response_time || ''}
              onEdit={(value) => handleContentUpdate('response_time', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="font-medium"
              placeholder="Add response time (e.g., 'We respond within 24 hours')..."
              sectionId={sectionId}
              elementKey="response_time"
              sectionBackground={sectionBackground}
            />
          </div>
        )}

        {(blockContent.supporting_text || trustItems.length > 0 || mode === 'edit') && (
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
              <div className="flex justify-center">
                <TrustIndicators
                  items={trustItems.map(item => item.text)}
                  colorClass={mutedTextColor}
                  iconColor="text-green-500"
                />
              </div>
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
    { key: 'contact_cards', label: 'Contact Cards', type: 'array', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'response_time', label: 'Response Time', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators', type: 'array', required: false }
  ],

  features: [
    'Multiple contact option cards with descriptions',
    'Customizable icons and CTAs',
    'WYSIWYG inline editing',
    'Trust indicators support',
    'Response time indicator',
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
