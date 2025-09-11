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
  CTAButton 
} from '@/components/layout/ComponentRegistry';
import IconEditableText from '@/components/ui/IconEditableText';
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
  company_value_1: string;
  company_value_2: string;
  company_value_3: string;
  company_value_4: string;
  company_value_5: string;
  values_heading: string;
  trust_items?: string;
  trust_item_1: string;
  trust_item_2: string;
  trust_item_3: string;
  trust_item_4: string;
  trust_item_5: string;
  founder_image?: string;
  // Individual belief icon fields
  belief_icon_1?: string;
  belief_icon_2?: string;
  belief_icon_3?: string;
  belief_icon_4?: string;
  belief_icon_5?: string;
  belief_icon_6?: string;
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
  company_value_1: { type: 'string' as const, default: 'Transparency' },
  company_value_2: { type: 'string' as const, default: 'Innovation' },
  company_value_3: { type: 'string' as const, default: 'Integrity' },
  company_value_4: { type: 'string' as const, default: 'Customer Success' },
  company_value_5: { type: 'string' as const, default: '' },
  values_heading: { type: 'string' as const, default: 'Our Core Values' },
  trust_items: { 
    type: 'string' as const, 
    default: 'B-Corp Certified|SOC 2 Compliant|GDPR Compliant|Carbon Neutral' 
  },
  trust_item_1: { type: 'string' as const, default: 'B-Corp Certified' },
  trust_item_2: { type: 'string' as const, default: 'SOC 2 Compliant' },
  trust_item_3: { type: 'string' as const, default: 'GDPR Compliant' },
  trust_item_4: { type: 'string' as const, default: 'Carbon Neutral' },
  trust_item_5: { type: 'string' as const, default: '' },
  founder_image: { 
    type: 'string' as const, 
    default: '' 
  },
  // Individual belief icon fields
  belief_icon_1: { type: 'string' as const, default: '🎯' },
  belief_icon_2: { type: 'string' as const, default: '🚀' },
  belief_icon_3: { type: 'string' as const, default: '🌱' },
  belief_icon_4: { type: 'string' as const, default: '🔒' },
  belief_icon_5: { type: 'string' as const, default: '⚡' },
  belief_icon_6: { type: 'string' as const, default: '🌍' }
};

// Belief Card Component
const BeliefCard = React.memo(({ 
  icon, 
  title, 
  description, 
  index,
  colorTokens,
  dynamicTextColors,
  h3Style,
  mode,
  onIconEdit,
  onTitleEdit,
  onDescriptionEdit,
  onDeleteCard,
  sectionId,
  backgroundType
}: {
  icon: string;
  title: string;
  description: string;
  index: number;
  colorTokens: any;
  dynamicTextColors: any;
  h3Style: React.CSSProperties;
  mode?: string;
  onIconEdit?: (index: number, value: string) => void;
  onTitleEdit?: (index: number, value: string) => void;
  onDescriptionEdit?: (index: number, value: string) => void;
  onDeleteCard?: (index: number) => void;
  sectionId?: string;
  backgroundType?: string;
}) => {
  // Using consistent styling like IconGrid

  // Get card background based on section background like IconGrid
  const cardBackground = backgroundType === 'primary' 
    ? 'bg-white/10 backdrop-blur-sm border-white/20' 
    : 'bg-white border-gray-100';
    
  const cardHover = backgroundType === 'primary'
    ? 'hover:bg-white/20 hover:border-white/30'
    : 'hover:border-blue-300 hover:shadow-xl';
  
  return (
    <div className={`group/belief-card-${index} relative ${cardBackground} ${cardHover} rounded-xl shadow-lg p-6 transition-all duration-300 hover:-translate-y-1`}>
      
      {/* Icon */}
      <div className="mb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colorTokens.ctaBg || 'bg-blue-600'} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300 relative group/icon-edit`}>
          <IconEditableText
            mode={(mode || 'preview') as 'preview' | 'edit'}
            value={icon}
            onEdit={(value) => onIconEdit?.(index, value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            iconSize="md"
            className="text-2xl group-hover:scale-110 transition-transform duration-300"
            placeholder="🎯"
            sectionId={sectionId || 'belief'}
            elementKey={`belief_icon_${index + 1}`}
          />
        </div>
      </div>
      
      {/* Content */}
      <EditableAdaptiveText
        mode={(mode || 'preview') as 'preview' | 'edit'}
        value={title}
        onEdit={(value) => onTitleEdit && onTitleEdit(index, value)}
        backgroundType={backgroundType as any}
        colorTokens={colorTokens}
        variant="body"
        textStyle={{
          ...h3Style,
          fontWeight: 600
        }}
        className="mb-3"
        placeholder="Belief title..."
        sectionId={sectionId || 'belief'}
        elementKey={`belief_title_${index}`}
        sectionBackground="bg-white"
      />
      <EditableAdaptiveText
        mode={(mode || 'preview') as 'preview' | 'edit'}
        value={description}
        onEdit={(value) => onDescriptionEdit && onDescriptionEdit(index, value)}
        backgroundType={backgroundType as any}
        colorTokens={colorTokens}
        variant="body"
        className="leading-relaxed opacity-90"
        placeholder="Describe this belief..."
        sectionId={sectionId || 'belief'}
        elementKey={`belief_description_${index}`}
        sectionBackground="bg-white"
      />
      
      {/* Delete button */}
      {mode === 'edit' && onDeleteCard && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteCard(index);
          }}
          className={`opacity-0 group-hover/belief-card-${index}:opacity-100 absolute top-2 right-2 text-red-500 hover:text-red-700 transition-opacity duration-200`}
          title="Remove this belief"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
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

  // Get individual belief icon fields
  const getBeliefIcon = (index: number): string => {
    const iconFields = ['belief_icon_1', 'belief_icon_2', 'belief_icon_3', 'belief_icon_4', 'belief_icon_5', 'belief_icon_6'];
    return blockContent[iconFields[index] as keyof FoundersBeliefStackContent] || '💡';
  };

  // Handle belief icon editing
  const handleBeliefIconEdit = (index: number, value: string) => {
    const iconFields = ['belief_icon_1', 'belief_icon_2', 'belief_icon_3', 'belief_icon_4', 'belief_icon_5', 'belief_icon_6'];
    const fieldKey = iconFields[index] as keyof FoundersBeliefStackContent;
    handleContentUpdate(fieldKey, value);
  };

  // Handle belief title editing
  const handleBeliefTitleEdit = (index: number, value: string) => {
    const beliefData = blockContent.belief_items ? blockContent.belief_items.split('|') : [];
    const titleIndex = index * 2;
    
    // Ensure we have enough array elements
    while (beliefData.length <= titleIndex + 1) {
      beliefData.push('');
    }
    
    // Extract icon from existing title or use default
    const existingTitleWithIcon = beliefData[titleIndex] || '';
    const iconPart = existingTitleWithIcon.split(' ')[0] || '💡';
    const isEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconPart);
    
    // Update title with icon prefix
    beliefData[titleIndex] = (isEmoji ? iconPart : '💡') + ' ' + value;
    handleContentUpdate('belief_items', beliefData.join('|'));
  };

  // Handle belief description editing
  const handleBeliefDescriptionEdit = (index: number, value: string) => {
    const beliefData = blockContent.belief_items ? blockContent.belief_items.split('|') : [];
    const descIndex = index * 2 + 1;
    
    // Ensure we have enough array elements
    while (beliefData.length <= descIndex) {
      beliefData.push('');
    }
    
    beliefData[descIndex] = value;
    handleContentUpdate('belief_items', beliefData.join('|'));
  };

  // Handle belief card deletion
  const handleBeliefCardDelete = (index: number) => {
    const beliefData = blockContent.belief_items ? blockContent.belief_items.split('|') : [];
    const titleIndex = index * 2;
    const descIndex = index * 2 + 1;
    
    // Remove the title and description pair
    const newBeliefData = beliefData.filter((_, i) => i !== titleIndex && i !== descIndex);
    
    // Update the belief_items with the new data
    handleContentUpdate('belief_items', newBeliefData.join('|'));
    
    // Also clear the corresponding icon field
    const iconFields = ['belief_icon_1', 'belief_icon_2', 'belief_icon_3', 'belief_icon_4', 'belief_icon_5', 'belief_icon_6'];
    const iconFieldKey = iconFields[index] as keyof FoundersBeliefStackContent;
    if (iconFieldKey) {
      handleContentUpdate(iconFieldKey, '___REMOVED___');
    }
  };

  // Parse belief items from pipe-separated string
  const beliefData = blockContent.belief_items 
    ? blockContent.belief_items.split('|')
    : [];

  const beliefItems = [];
  
  // Parse existing belief items
  for (let i = 0; i < beliefData.length; i += 2) {
    if (i + 1 < beliefData.length) {
      const titleWithIcon = beliefData[i]?.trim() || '';
      const fallbackIcon = titleWithIcon.split(' ')[0] || '💡';
      const title = titleWithIcon.split(' ').slice(1).join(' ') || 'Belief';
      const description = beliefData[i + 1]?.trim() || '';
      const itemIndex: number = beliefItems.length;
      const icon = getBeliefIcon(itemIndex) || fallbackIcon;
      
      beliefItems.push({ icon, title, description, index: itemIndex });
    }
  }
  
  // In edit mode, ensure we have at least 3 cards to show (for better UX)
  if (mode === 'edit' && beliefItems.length < 3) {
    const neededCards = 3 - beliefItems.length;
    for (let i = 0; i < neededCards; i++) {
      const itemIndex = beliefItems.length;
      const icon = getBeliefIcon(itemIndex) || '💡';
      beliefItems.push({ 
        icon, 
        title: '', 
        description: '', 
        index: itemIndex 
      });
    }
  }

  // Helper function to get company values with individual field support
  const getCompanyValues = (): string[] => {
    const individualValues = [
      blockContent.company_value_1,
      blockContent.company_value_2,
      blockContent.company_value_3,
      blockContent.company_value_4,
      blockContent.company_value_5
    ].filter((value): value is string => Boolean(value && value.trim() !== '' && value !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualValues.length > 0) {
      return individualValues;
    }
    
    return blockContent.company_values 
      ? blockContent.company_values.split('|').map(item => item.trim()).filter(Boolean)
      : ['Transparency', 'Innovation'];
  };
  
  const companyValues = getCompanyValues();

  // Helper function to get trust items with individual field support
  const getTrustItems = (): string[] => {
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2,
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    return blockContent.trust_items 
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : ['B-Corp Certified', 'SOC 2 Compliant'];
  };
  
  const trustItems = getTrustItems();

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beliefItems.map((belief, index) => (
              <BeliefCard
                key={index}
                icon={belief.icon}
                title={belief.title}
                description={belief.description}
                index={belief.index}
                colorTokens={colorTokens}
                dynamicTextColors={dynamicTextColors}
                h3Style={h3Style}
                mode={mode}
                onIconEdit={handleBeliefIconEdit}
                onTitleEdit={handleBeliefTitleEdit}
                onDescriptionEdit={handleBeliefDescriptionEdit}
                onDeleteCard={handleBeliefCardDelete}
                sectionId={sectionId}
                backgroundType={backgroundType}
              />
            ))}
          </div>
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
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.values_heading || ''}
            onEdit={(value) => handleContentUpdate('values_heading', value)}
            level="h3"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
            placeholder="Our Core Values"
            sectionId={sectionId}
            elementKey="values_heading"
            sectionBackground={sectionBackground}
          />
          
          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { key: 'company_value_1', placeholder: 'Transparency' },
                { key: 'company_value_2', placeholder: 'Innovation' },
                { key: 'company_value_3', placeholder: 'Integrity' },
                { key: 'company_value_4', placeholder: 'Customer Success' },
                { key: 'company_value_5', placeholder: 'Additional value...' }
              ].map((value, index) => (
                ((blockContent as any)[value.key] || mode === 'edit') && (blockContent as any)[value.key] !== '___REMOVED___' && (
                  <div key={index} className={`relative group/company-value-${index}`}>
                    <div className="bg-white rounded-full px-6 py-3 shadow-md border border-gray-100 flex items-center space-x-2">
                      <EditableAdaptiveText
                        mode={mode}
                        value={(blockContent as any)[value.key] || ''}
                        onEdit={(newValue) => handleContentUpdate(value.key as keyof FoundersBeliefStackContent, newValue)}
                        backgroundType="neutral"
                        colorTokens={colorTokens}
                        variant="body"
                        textStyle={{ fontWeight: '500', color: '#374151' }}
                        placeholder={value.placeholder}
                        sectionId={sectionId}
                        elementKey={value.key}
                        sectionBackground="bg-white"
                      />
                      
                      {/* Remove button */}
                      {mode === 'edit' && (blockContent as any)[value.key] && (blockContent as any)[value.key] !== '___REMOVED___' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate(value.key as keyof FoundersBeliefStackContent, '___REMOVED___');
                          }}
                          className={`opacity-0 group-hover/company-value-${index}:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200`}
                          title="Remove this value"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
            
            {/* Add button */}
            {mode === 'edit' && companyValues.length < 5 && (
              <button
                onClick={() => {
                  const emptyIndex = [
                    blockContent.company_value_1,
                    blockContent.company_value_2,
                    blockContent.company_value_3,
                    blockContent.company_value_4,
                    blockContent.company_value_5
                  ].findIndex(value => !value || value.trim() === '' || value === '___REMOVED___');
                  
                  if (emptyIndex !== -1) {
                    const fieldKey = `company_value_${emptyIndex + 1}` as keyof FoundersBeliefStackContent;
                    handleContentUpdate(fieldKey, 'New value');
                  }
                }}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add value</span>
              </button>
            )}
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
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {[
              { key: 'trust_item_1', placeholder: 'B-Corp Certified' },
              { key: 'trust_item_2', placeholder: 'SOC 2 Compliant' },
              { key: 'trust_item_3', placeholder: 'GDPR Compliant' },
              { key: 'trust_item_4', placeholder: 'Carbon Neutral' },
              { key: 'trust_item_5', placeholder: 'Additional certification...' }
            ].map((item, index) => (
              ((blockContent as any)[item.key] || mode === 'edit') && (blockContent as any)[item.key] !== '___REMOVED___' && (
                <div key={index} className={`group/trust-item-${index} relative flex items-center space-x-1`}>
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <EditableAdaptiveText
                    mode={mode}
                    value={(blockContent as any)[item.key] || ''}
                    onEdit={(value) => {
                      const fieldKey = item.key as keyof FoundersBeliefStackContent;
                      handleContentUpdate(fieldKey, value);
                    }}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{
                      fontSize: '0.875rem',
                      color: mutedTextColor
                    }}
                    placeholder={item.placeholder}
                    sectionId={sectionId}
                    elementKey={item.key}
                    sectionBackground={sectionBackground}
                  />
                  
                  {/* Remove button */}
                  {mode === 'edit' && (blockContent as any)[item.key] && (blockContent as any)[item.key] !== '___REMOVED___' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const fieldKey = item.key as keyof FoundersBeliefStackContent;
                        handleContentUpdate(fieldKey, '___REMOVED___');
                      }}
                      className={`opacity-0 group-hover/trust-item-${index}:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200 ml-1`}
                      title="Remove this trust indicator"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            ))}
          </div>
          
          {/* Add trust indicator button */}
          {mode === 'edit' && trustItems.length < 5 && (
            <div className="text-center mt-2">
              <button
                onClick={() => {
                  const emptyIndex = [
                    blockContent.trust_item_1,
                    blockContent.trust_item_2,
                    blockContent.trust_item_3,
                    blockContent.trust_item_4,
                    blockContent.trust_item_5
                  ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                  
                  if (emptyIndex !== -1) {
                    const fieldKey = `trust_item_${emptyIndex + 1}` as keyof FoundersBeliefStackContent;
                    handleContentUpdate(fieldKey, 'New trust item');
                  }
                }}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mx-auto"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add trust indicator</span>
              </button>
            </div>
          )}
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