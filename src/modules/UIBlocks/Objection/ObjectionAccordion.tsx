// components/layout/ObjectionAccordion.tsx
// Production-ready objection handling accordion using abstraction system

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface ObjectionAccordionContent {
  headline: string;
  subheadline?: string;
  objection_titles: string;
  objection_responses: string;
  objection_icons?: string;
  response_icon?: string;
  trust_icon?: string;
}

// Objection item structure
interface ObjectionItem {
  id: string;
  index: number;
  title: string;
  response: string;
  icon?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Common Questions & Concerns' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'We understand your concerns. Here are honest answers to the questions we hear most often.' 
  },
  objection_titles: { 
    type: 'string' as const, 
    default: 'Is this too expensive for a small business?|Will this replace our current system?|How do we know it will actually work?|What if we need help setting it up?|Is our data really secure with you?' 
  },
  objection_responses: { 
    type: 'string' as const, 
    default: 'We designed our pricing specifically for growing businesses. Most customers save more than the monthly cost within the first week through improved efficiency.|Not at all. We integrate seamlessly with your existing tools and workflows. You can start small and gradually expand usage as your team gets comfortable.|We offer a 30-day free trial with full access to all features. Plus, over 10,000 businesses already trust us with their operations.|Our dedicated onboarding team provides white-glove setup, training, and ongoing support. Most customers are fully operational within 24 hours.|Absolutely. We use bank-level encryption, are SOC 2 compliant, and never share your data with third parties. Your information is more secure with us than on local systems.' 
  },
  objection_icons: {
    type: 'string' as const,
    default: '💰|🔧|❓|🛠️|🔒'
  },
  response_icon: {
    type: 'string' as const,
    default: '✅'
  },
  trust_icon: {
    type: 'string' as const,
    default: '✅'
  }
};

// Parse objection data from pipe-separated strings
const parseObjectionData = (titles: string, responses: string, icons?: string): ObjectionItem[] => {
  const titleList = parsePipeData(titles);
  const responseList = parsePipeData(responses);
  const iconList = icons ? parsePipeData(icons) : [];
  
  return titleList.map((title, index) => ({
    id: `objection-${index}`,
    index,
    title,
    response: responseList[index] || 'Response not provided.',
    icon: iconList[index] || getDefaultIcon(title)
  }));
};

// Get default icon based on content
const getDefaultIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('expensive') || lower.includes('cost') || lower.includes('price')) {
    return '💰';
  } else if (lower.includes('replace') || lower.includes('system') || lower.includes('integration')) {
    return '🔧';
  } else if (lower.includes('secure') || lower.includes('data') || lower.includes('privacy')) {
    return '🔒';
  } else if (lower.includes('help') || lower.includes('support') || lower.includes('setup')) {
    return '🛠️';
  }
  // Default question icon
  return '❓';
};

// Individual Objection Accordion Item
const ObjectionAccordionItem = React.memo(({ 
  item, 
  isOpen, 
  onToggle, 
  mode, 
  colorTokens,
  onTitleEdit,
  onResponseEdit,
  onIconEdit,
  responseIcon,
  onResponseIconEdit,
  sectionId,
  backgroundType,
  sectionBackground
}: {
  item: ObjectionItem;
  isOpen: boolean;
  onToggle: () => void;
  mode: 'edit' | 'preview';
  colorTokens: any;
  onTitleEdit: (index: number, value: string) => void;
  onResponseEdit: (index: number, value: string) => void;
  onIconEdit: (index: number, value: string) => void;
  responseIcon: string;
  onResponseIconEdit: (value: string) => void;
  sectionId: string;
  backgroundType: any;
  sectionBackground: any;
}) => {
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 bg-white shadow-sm">
      {/* Objection Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 pr-4">
            {/* Objection Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
              <IconEditableText
                mode={mode}
                value={item.icon || '❓'}
                onEdit={(value) => onIconEdit(item.index, value)}
                backgroundType="custom"
                colorTokens={{...colorTokens, primaryText: 'text-red-600'}}
                iconSize="sm"
                className="text-xl"
                sectionId={sectionId}
                elementKey={`objection_icon_${item.index}`}
              />
            </div>
            
            {/* Objection Title */}
            <div className="flex-1">
              {mode === 'edit' ? (
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTitleEdit(item.index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.title}
                </div>
              ) : (
                <h3 
                  className="font-semibold text-gray-900"
                >
                  {item.title}
                </h3>
              )}
            </div>
          </div>
          
          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Response Content */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-5 bg-green-50 border-t border-green-200">
          <div className="flex items-start space-x-4">
            {/* Response Icon */}
            <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white mt-1">
              <IconEditableText
                mode={mode}
                value={responseIcon || '✅'}
                onEdit={onResponseIconEdit}
                backgroundType="custom"
                colorTokens={{...colorTokens, primaryText: 'text-white'}}
                iconSize="sm"
                className="text-base"
                sectionId={sectionId}
                elementKey="response_icon"
              />
            </div>
            
            {/* Response Text */}
            <div className="flex-1">
              {mode === 'edit' ? (
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onResponseEdit(item.index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-green-100 text-green-800 leading-relaxed"
                >
                  {item.response}
                </div>
              ) : (
                <p 
                  className="text-green-800 leading-relaxed"
                >
                  {item.response}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
ObjectionAccordionItem.displayName = 'ObjectionAccordionItem';

export default function ObjectionAccordion(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
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
  } = useLayoutComponent<ObjectionAccordionContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // State for accordion open/closed items
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  // Parse objection data
  const objectionItems = parseObjectionData(
    blockContent.objection_titles, 
    blockContent.objection_responses,
    blockContent.objection_icons
  );

  // Handle individual title/response editing
  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.objection_titles, index, value);
    handleContentUpdate('objection_titles', updatedTitles);
  };

  const handleResponseEdit = (index: number, value: string) => {
    const updatedResponses = updateListData(blockContent.objection_responses, index, value);
    handleContentUpdate('objection_responses', updatedResponses);
  };

  const handleIconEdit = (index: number, value: string) => {
    const icons = blockContent.objection_icons ? blockContent.objection_icons.split('|') : [];
    while (icons.length <= index) {
      icons.push('❓');
    }
    icons[index] = value;
    handleContentUpdate('objection_icons', icons.join('|'));
  };

  // Toggle accordion item
  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ObjectionAccordion"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            textStyle={{
              textAlign: 'center'
            }}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{
                textAlign: 'center'
              }}
              className="max-w-2xl mx-auto"
              placeholder="Add optional subheadline to provide context..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Objections Accordion */}
        <div className="space-y-0">
          {objectionItems.map((item) => (
            <ObjectionAccordionItem
              key={item.id}
              item={item}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              mode={mode}
              colorTokens={colorTokens}
              onTitleEdit={handleTitleEdit}
              onResponseEdit={handleResponseEdit}
              onIconEdit={handleIconEdit}
              responseIcon={blockContent.response_icon || '✅'}
              onResponseIconEdit={(value) => handleContentUpdate('response_icon', value)}
              sectionId={sectionId}
              backgroundType={backgroundType}
              sectionBackground={sectionBackground}
            />
          ))}
        </div>

        {/* Trust Reinforcement */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm">
            <IconEditableText
              mode={mode}
              value={blockContent.trust_icon || '✅'}
              onEdit={(value) => handleContentUpdate('trust_icon', value)}
              backgroundType="custom"
              colorTokens={{...colorTokens, primaryText: 'text-blue-700'}}
              iconSize="sm"
              className="text-base"
              sectionId={sectionId}
              elementKey="trust_icon"
            />
            <span>Still have questions? We're here to help.</span>
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'ObjectionAccordion',
  category: 'Conversion Sections',
  description: 'Address customer objections with adaptive text colors and expandable responses',
  tags: ['objections', 'accordion', 'conversion', 'sales', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  // ✅ ENHANCED: Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'objection_titles', label: 'Objection Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'objection_responses', label: 'Objection Responses (pipe separated)', type: 'textarea', required: true }
  ],
  
  // ✅ NEW: Enhanced features
  features: [
    'Automatic text color adaptation based on background type',
    'Professional objection handling design',
    'Smooth accordion animations with icons',
    'Individual objection editing in edit mode',
    'Persuasive response formatting',
    'Mobile-optimized accordion behavior'
  ],
  
  // Usage examples
  useCases: [
    'Sales page objection handling on dark backgrounds',
    'FAQ with persuasive responses on brand colors',
    'Conversion optimization with custom styling',
    'Trust building section with adaptive text'
  ]
};