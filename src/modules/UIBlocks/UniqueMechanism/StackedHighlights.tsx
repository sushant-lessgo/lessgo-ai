import React, { useEffect } from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface StackedHighlightsProps extends LayoutComponentProps {}

// Highlight item structure
interface HighlightItem {
  title: string;
  description: string;
  id: string;
}

// Content interface for StackedHighlights layout
interface StackedHighlightsContent {
  headline: string;
  highlight_titles: string;
  highlight_descriptions: string;
  mechanism_name?: string;
  footer_text?: string;
  highlight_icon_1?: string;
  highlight_icon_2?: string;
  highlight_icon_3?: string;
  highlight_icon_4?: string;
  highlight_icon_5?: string;
  highlight_icon_6?: string;
}

// Content schema for StackedHighlights layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Proprietary SmartFlow System™' },
  highlight_titles: { type: 'string' as const, default: 'Intelligent Auto-Prioritization|Dynamic Context Switching|Predictive Resource Allocation|Real-Time Quality Assurance' },
  highlight_descriptions: { type: 'string' as const, default: 'Our AI analyzes your workflow patterns and automatically prioritizes tasks based on deadlines, dependencies, and business impact, ensuring critical work never falls through the cracks.|The system seamlessly adapts to changing priorities and contexts, maintaining efficiency even when your focus needs to shift between different projects or urgent requests.|Advanced algorithms predict resource needs and automatically allocate team capacity, preventing bottlenecks before they occur and optimizing productivity across all initiatives.|Built-in quality checks run continuously in the background, catching potential issues early and maintaining high standards without slowing down your workflow.' },
  mechanism_name: { type: 'string' as const, default: '' },
  footer_text: { type: 'string' as const, default: 'Our proprietary approach that you won\'t find anywhere else' },
  highlight_icon_1: { type: 'string' as const, default: '🧠' },
  highlight_icon_2: { type: 'string' as const, default: '🔄' },
  highlight_icon_3: { type: 'string' as const, default: '📊' },
  highlight_icon_4: { type: 'string' as const, default: '✅' },
  highlight_icon_5: { type: 'string' as const, default: '⚡' },
  highlight_icon_6: { type: 'string' as const, default: '🎯' }
};

// Parse highlight data from pipe-separated strings
const parseHighlightData = (titles: string, descriptions: string): HighlightItem[] => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  
  return titleList.map((title, index) => ({
    id: `highlight-${index}`,
    title,
    description: descriptionList[index] || 'Description not provided.'
  }));
};


// Helper function to get highlight icon
const getHighlightIcon = (blockContent: StackedHighlightsContent, index: number) => {
  const iconFields = [
    blockContent.highlight_icon_1,
    blockContent.highlight_icon_2,
    blockContent.highlight_icon_3,
    blockContent.highlight_icon_4,
    blockContent.highlight_icon_5,
    blockContent.highlight_icon_6
  ];
  return iconFields[index] || '✨';
};

// Helper function to add a new highlight
const addHighlight = (titles: string, descriptions: string): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  
  // Add new highlight with default content
  titleList.push('New Highlight');
  descriptionList.push('Describe this unique benefit or feature of your solution.');
  
  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Helper function to remove a highlight
const removeHighlight = (titles: string, descriptions: string, indexToRemove: number): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  
  // Remove the highlight at the specified index
  if (indexToRemove >= 0 && indexToRemove < titleList.length) {
    titleList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }
  
  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Individual Highlight Card
const HighlightCard = ({ 
  highlight, 
  index, 
  mode, 
  sectionId,
  onTitleEdit,
  onDescriptionEdit,
  onRemoveHighlight,
  blockContent,
  colorTokens,
  handleContentUpdate,
  canRemove = true
}: {
  highlight: HighlightItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemoveHighlight?: (index: number) => void;
  blockContent: StackedHighlightsContent;
  colorTokens: any;
  handleContentUpdate: (field: keyof StackedHighlightsContent, value: string) => void;
  canRemove?: boolean;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="group relative">
      {/* Connection Line (except for last item) */}
      <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-blue-200 to-transparent hidden lg:block"></div>
      
      {/* Highlight Card */}
      <div className="relative flex items-start space-x-6 p-8 bg-white rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 mb-6">
        
        {/* Icon Circle */}
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
          <IconEditableText
            mode={mode}
            value={getHighlightIcon(blockContent, index)}
            onEdit={(value) => {
              const iconField = `highlight_icon_${index + 1}` as keyof StackedHighlightsContent;
              handleContentUpdate(iconField, value);
            }}
            backgroundType="primary"
            colorTokens={colorTokens}
            iconSize="lg"
            className="text-white text-2xl"
            sectionId={sectionId}
            elementKey={`highlight_icon_${index + 1}`}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {/* Highlight Title */}
          <div className="mb-4">
            {mode !== 'preview' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-gray-50 font-bold text-gray-900 text-xl"
              >
                {highlight.title}
              </div>
            ) : (
              <h3 
                className="font-bold text-gray-900 text-xl mb-2"
              >
                {highlight.title}
              </h3>
            )}
          </div>
          
          {/* Highlight Description */}
          <div>
            {mode !== 'preview' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed"
              >
                {highlight.description}
              </div>
            ) : (
              <p 
                className="text-gray-600 leading-relaxed"
              >
                {highlight.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Delete button - only show in edit mode and if can remove */}
        {mode !== 'preview' && onRemoveHighlight && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveHighlight(index);
            }}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
            title="Remove this highlight"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Unique Badge */}
        <div className={`absolute top-4 ${mode !== 'preview' && onRemoveHighlight && canRemove ? 'right-12' : 'right-4'} opacity-60 group-hover:opacity-80 transition-opacity duration-300`}>
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StackedHighlights(props: StackedHighlightsProps) {
  // ✅ Use the standard useLayoutComponent hook
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate,
    theme
  } = useLayoutComponent<StackedHighlightsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse highlight data
  const highlightItems = parseHighlightData(blockContent.highlight_titles, blockContent.highlight_descriptions);

  // Handle individual editing
  const handleTitleEdit = (index: number, value: string) => {
    const titles = blockContent.highlight_titles.split('|');
    titles[index] = value;
    handleContentUpdate('highlight_titles', titles.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.highlight_descriptions.split('|');
    descriptions[index] = value;
    handleContentUpdate('highlight_descriptions', descriptions.join('|'));
  };

  // Handle adding a new highlight
  const handleAddHighlight = () => {
    const { newTitles, newDescriptions } = addHighlight(blockContent.highlight_titles, blockContent.highlight_descriptions);
    handleContentUpdate('highlight_titles', newTitles);
    handleContentUpdate('highlight_descriptions', newDescriptions);
  };

  // Handle removing a highlight
  const handleRemoveHighlight = (indexToRemove: number) => {
    const { newTitles, newDescriptions } = removeHighlight(blockContent.highlight_titles, blockContent.highlight_descriptions, indexToRemove);
    handleContentUpdate('highlight_titles', newTitles);
    handleContentUpdate('highlight_descriptions', newDescriptions);
    
    // Also clear the corresponding icon if it exists
    const iconField = `highlight_icon_${indexToRemove + 1}` as keyof StackedHighlightsContent;
    if (blockContent[iconField]) {
      handleContentUpdate(iconField, '');
    }
  };


  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StackedHighlights"
      backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Optional Mechanism Name */}
          {(blockContent.mechanism_name || mode === 'edit') && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-300 rounded-full">
              {blockContent.mechanism_name && (
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.mechanism_name || ''}
                onEdit={(value) => handleContentUpdate('mechanism_name', value)}
                backgroundType="neutral"
                colorTokens={{ ...colorTokens, textPrimary: 'text-blue-800' }}
                variant="body"
                className="font-semibold text-blue-800"
                placeholder="Add mechanism name (e.g., 'Powered by SmartFlow™')"
                sectionId={sectionId}
                elementKey="mechanism_name"
                sectionBackground="bg-blue-100"
              />
            </div>
          )}
        </div>

        {/* Stacked Highlights */}
        <div className="space-y-0">
          {highlightItems.map((highlight, index) => (
            <HighlightCard
              key={highlight.id}
              highlight={highlight}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onRemoveHighlight={handleRemoveHighlight}
              blockContent={blockContent}
              colorTokens={colorTokens}
              handleContentUpdate={handleContentUpdate}
              canRemove={highlightItems.length > 1}
            />
          ))}
        </div>

        {/* Add Highlight Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && highlightItems.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddHighlight}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Highlight</span>
            </button>
          </div>
        )}

        {/* Unique Value Proposition */}
        {(blockContent.footer_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.footer_text || ''}
                onEdit={(value) => handleContentUpdate('footer_text', value)}
                backgroundType="neutral"
                colorTokens={{ ...colorTokens, textPrimary: 'text-blue-800' }}
                variant="body"
                className="font-medium text-blue-800"
                placeholder="Add unique value proposition..."
                sectionId={sectionId}
                elementKey="footer_text"
                sectionBackground="bg-blue-50"
              />
            </div>
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'StackedHighlights',
  category: 'Features',
  description: 'Vertical feature highlights with adaptive text colors and unique mechanism branding',
  tags: ['features', 'highlights', 'stacked', 'mechanism', 'adaptive-colors'],
  features: [
    'Automatic text color adaptation based on background type',
    'Editable highlight titles and descriptions',
    'Smart icons that match highlight content',
    'Optional mechanism/brand name badge',
    'Unique value proposition footer',
    'Connection lines for visual flow'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    highlight_titles: 'Pipe-separated list of highlight titles',
    highlight_descriptions: 'Pipe-separated list of highlight descriptions',
    mechanism_name: 'Optional mechanism or brand name'
  },
  examples: [
    'Proprietary system features',
    'Unique value propositions',
    'Product capability highlights',
    'Service differentiators'
  ]
};