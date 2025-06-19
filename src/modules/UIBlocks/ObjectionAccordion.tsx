import React, { useEffect, useState } from 'react';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { usePageStore } from '@/hooks/usePageStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface ObjectionAccordionProps extends LayoutComponentProps {}

// Objection item structure
interface ObjectionItem {
  title: string;
  response: string;
  id: string;
}

// Content interface for ObjectionAccordion layout
interface ObjectionAccordionContent {
  headline: string;
  objection_titles: string;
  objection_responses: string;
  subheadline?: string;
}

// Content schema for ObjectionAccordion layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Common Questions & Concerns' },
  objection_titles: { type: 'string' as const, default: 'Is this too expensive for a small business?|Will this replace our current system?|How do we know it will actually work?|What if we need help setting it up?|Is our data really secure with you?' },
  objection_responses: { type: 'string' as const, default: 'We designed our pricing specifically for growing businesses. Most customers save more than the monthly cost within the first week through improved efficiency and reduced manual work.|Not at all. We integrate seamlessly with your existing tools and workflows. You can start small and gradually expand usage as your team gets comfortable.|We offer a 30-day free trial with full access to all features. Plus, over 10,000 businesses already trust us with their operations. See real case studies and ROI data in our results section.|Our dedicated onboarding team provides white-glove setup, training, and ongoing support. Most customers are fully operational within 24 hours.|Absolutely. We use bank-level encryption, are SOC 2 compliant, and never share your data with third parties. Your information is more secure with us than on local systems.' },
  subheadline: { type: 'string' as const, default: '' }
};

// Parse objection data from pipe-separated strings
const parseObjectionData = (titles: string, responses: string): ObjectionItem[] => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const responseList = responses.split('|').map(r => r.trim()).filter(r => r);
  
  return titleList.map((title, index) => ({
    id: `objection-${index}`,
    title,
    response: responseList[index] || 'Response not provided.'
  }));
};

// ModeWrapper component for handling edit/preview modes
const ModeWrapper = ({ 
  mode, 
  children, 
  sectionId, 
  elementKey,
  onEdit 
}: {
  mode: 'edit' | 'preview';
  children: React.ReactNode;
  sectionId: string;
  elementKey: string;
  onEdit?: (value: string) => void;
}) => {
  if (mode === 'edit' && onEdit) {
    return (
      <div 
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent || '')}
        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
        data-placeholder={`Edit ${elementKey.replace('_', ' ')}`}
      >
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
};

// Individual Objection Accordion Item
const ObjectionAccordionItem = ({ 
  item, 
  isOpen, 
  onToggle, 
  mode, 
  sectionId, 
  index,
  onTitleEdit,
  onResponseEdit 
}: {
  item: ObjectionItem;
  isOpen: boolean;
  onToggle: () => void;
  mode: 'edit' | 'preview';
  sectionId: string;
  index: number;
  onTitleEdit: (index: number, value: string) => void;
  onResponseEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
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
    } else if (lower.includes('work') || lower.includes('effective') || lower.includes('results')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    } else if (lower.includes('help') || lower.includes('support') || lower.includes('setup')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
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
                  onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
                  style={getTextStyle('h4')}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.title}
                </div>
              ) : (
                <h3 
                  className="font-semibold text-gray-900"
                  style={getTextStyle('h4')}
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
                  onBlur={(e) => onResponseEdit(index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-green-100 text-green-800 leading-relaxed"
                  style={getTextStyle('body')}
                >
                  {item.response}
                </div>
              ) : (
                <p 
                  className="text-green-800 leading-relaxed"
                  style={getTextStyle('body')}
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
};

export default function ObjectionAccordion({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: ObjectionAccordionProps) {

  const { getTextStyle } = useTypography();
  const { 
    content, 
    ui: { mode }, 
    layout: { theme },
    updateElementContent 
  } = usePageStore();

  // State for accordion open/closed items
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Helper to handle content updates
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Extract content with type safety and defaults using the new system
  const blockContent: ObjectionAccordionContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse objection data
  const objectionItems = parseObjectionData(blockContent.objection_titles, blockContent.objection_responses);

  // Handle individual title/response editing
  const handleTitleEdit = (index: number, value: string) => {
    const titles = blockContent.objection_titles.split('|');
    titles[index] = value;
    handleContentUpdate('objection_titles', titles.join('|'));
  };

  const handleResponseEdit = (index: number, value: string) => {
    const responses = blockContent.objection_responses.split('|');
    responses[index] = value;
    handleContentUpdate('objection_responses', responses.join('|'));
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

  // Generate color tokens from theme with correct nested structure
  const colorTokens = generateColorTokens({
    baseColor: theme?.colors?.baseColor || '#3B82F6',
    accentColor: theme?.colors?.accentColor || '#10B981',
    sectionBackgrounds: theme?.colors?.sectionBackgrounds || {
      primary: '#F8FAFC',
      secondary: '#F1F5F9', 
      neutral: '#FFFFFF',
      divider: '#E2E8F0'
    }
  });

  // Get section background based on type
  const getSectionBackground = () => {
    switch(backgroundType) {
      case 'primary': return colorTokens.bgPrimary;
      case 'secondary': return colorTokens.bgSecondary;
      case 'divider': return colorTokens.bgDivider;
      default: return colorTokens.bgNeutral;
    }
  };

  // Initialize fonts on component mount
  useEffect(() => {
    const { updateFontsFromTone } = usePageStore.getState();
    updateFontsFromTone(); // Set fonts based on current tone
  }, []);

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="ObjectionAccordion"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`mb-4 ${colorTokens.textPrimary}`}
              style={getTextStyle('h1')}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="subheadline"
              onEdit={(value) => handleContentUpdate('subheadline', value)}
            >
              <p 
                className={`mb-6 max-w-2xl mx-auto ${colorTokens.textSecondary} ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-lg')}
              >
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline to provide context...' : '')}
              </p>
            </ModeWrapper>
          )}
        </div>

        {/* Objections Accordion */}
        <div className="space-y-0">
          {objectionItems.map((item, index) => (
            <ObjectionAccordionItem
              key={item.id}
              item={item}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              mode={mode}
              sectionId={sectionId}
              index={index}
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

        {/* Edit Mode Data Editing */}
        {mode === 'edit' && (
          <div className="mt-12 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-700 mb-3">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  ObjectionAccordion - Edit objection content or click individual titles/responses above
                </span>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Objection Titles (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="objection_titles"
                    onEdit={(value) => handleContentUpdate('objection_titles', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-32 overflow-y-auto">
                      {blockContent.objection_titles}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Objection Responses (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="objection_responses"
                    onEdit={(value) => handleContentUpdate('objection_responses', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-40 overflow-y-auto">
                      {blockContent.objection_responses}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 Tip: Icons are auto-selected based on objection content (cost, security, etc.). You can edit individual objections by clicking directly on them above.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}