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
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface ObjectionAccordionContent {
  headline: string;
  subheadline?: string;
  objection_titles: string;
  objection_responses: string;
}

// Objection item structure
interface ObjectionItem {
  id: string;
  index: number;
  title: string;
  response: string;
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
  }
};

// Parse objection data from pipe-separated strings
const parseObjectionData = (titles: string, responses: string): ObjectionItem[] => {
  const titleList = parsePipeData(titles);
  const responseList = parsePipeData(responses);
  
  return titleList.map((title, index) => ({
    id: `objection-${index}`,
    index,
    title,
    response: responseList[index] || 'Response not provided.'
  }));
};

// Get objection icon based on content
const getObjectionIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('expensive') || lower.includes('cost') || lower.includes('price')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    );
  } else if (lower.includes('replace') || lower.includes('system') || lower.includes('integration')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  } else if (lower.includes('secure') || lower.includes('data') || lower.includes('privacy')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  
  // Default question icon
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

// Individual Objection Accordion Item
const ObjectionAccordionItem = React.memo(({ 
  item, 
  isOpen, 
  onToggle, 
  mode, 
  colorTokens,
  onTitleEdit,
  onResponseEdit 
}: {
  item: ObjectionItem;
  isOpen: boolean;
  onToggle: () => void;
  mode: 'edit' | 'preview';
  colorTokens: any;
  onTitleEdit: (index: number, value: string) => void;
  onResponseEdit: (index: number, value: string) => void;
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
              {getObjectionIcon(item.title)}
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
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
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
  const objectionItems = parseObjectionData(blockContent.objection_titles, blockContent.objection_responses);

  // Handle individual title/response editing
  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.objection_titles, index, value);
    handleContentUpdate('objection_titles', updatedTitles);
  };

  const handleResponseEdit = (index: number, value: string) => {
    const updatedResponses = updateListData(blockContent.objection_responses, index, value);
    handleContentUpdate('objection_responses', updatedResponses);
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
            />
          ))}
        </div>

        {/* Trust Reinforcement */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
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