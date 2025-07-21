import React, { useEffect } from 'react';
import { generateColorTokens } from '../../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
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
}

// Content schema for StackedHighlights layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Proprietary SmartFlow System™' },
  highlight_titles: { type: 'string' as const, default: 'Intelligent Auto-Prioritization|Dynamic Context Switching|Predictive Resource Allocation|Real-Time Quality Assurance' },
  highlight_descriptions: { type: 'string' as const, default: 'Our AI analyzes your workflow patterns and automatically prioritizes tasks based on deadlines, dependencies, and business impact, ensuring critical work never falls through the cracks.|The system seamlessly adapts to changing priorities and contexts, maintaining efficiency even when your focus needs to shift between different projects or urgent requests.|Advanced algorithms predict resource needs and automatically allocate team capacity, preventing bottlenecks before they occur and optimizing productivity across all initiatives.|Built-in quality checks run continuously in the background, catching potential issues early and maintaining high standards without slowing down your workflow.' },
  mechanism_name: { type: 'string' as const, default: '' }
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

// Highlight Icon Component
const HighlightIcon = ({ title, index }: { title: string, index: number }) => {
  const getIcon = (highlightTitle: string, fallbackIndex: number) => {
    const lower = highlightTitle.toLowerCase();
    
    if (lower.includes('intelligent') || lower.includes('ai') || lower.includes('smart') || lower.includes('prioritization')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    } else if (lower.includes('dynamic') || lower.includes('adaptive') || lower.includes('switching') || lower.includes('context')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    } else if (lower.includes('predictive') || lower.includes('algorithm') || lower.includes('resource') || lower.includes('allocation')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    } else if (lower.includes('quality') || lower.includes('assurance') || lower.includes('monitoring') || lower.includes('real-time')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    } else if (lower.includes('automation') || lower.includes('automatic') || lower.includes('workflow')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else if (lower.includes('optimization') || lower.includes('performance') || lower.includes('efficiency')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    
    // Default icons based on position
    const defaultIcons = [
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>,
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>,
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>,
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ];
    
    return defaultIcons[fallbackIndex % defaultIcons.length];
  };
  
  return getIcon(title, index);
};

// Individual Highlight Card
const HighlightCard = ({ 
  highlight, 
  index, 
  mode, 
  sectionId,
  onTitleEdit,
  onDescriptionEdit
}: {
  highlight: HighlightItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="group relative">
      {/* Connection Line (except for last item) */}
      <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-blue-200 to-transparent hidden lg:block"></div>
      
      {/* Highlight Card */}
      <div className="relative flex items-start space-x-6 p-8 bg-white rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 mb-6">
        
        {/* Icon Circle */}
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
          <HighlightIcon title={highlight.title} index={index} />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {/* Highlight Title */}
          <div className="mb-4">
            {mode === 'edit' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-gray-50 font-bold text-gray-900 text-xl"
                style={getTextStyle('h3')}
              >
                {highlight.title}
              </div>
            ) : (
              <h3 
                className="font-bold text-gray-900 text-xl mb-2"
                style={getTextStyle('h3')}
              >
                {highlight.title}
              </h3>
            )}
          </div>
          
          {/* Highlight Description */}
          <div>
            {mode === 'edit' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed"
                style={getTextStyle('body')}
              >
                {highlight.description}
              </div>
            ) : (
              <p 
                className="text-gray-600 leading-relaxed"
                style={getTextStyle('body')}
              >
                {highlight.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Unique Badge */}
        <div className="absolute top-4 right-4 opacity-60 group-hover:opacity-80 transition-opacity duration-300">
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

export default function StackedHighlights({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: StackedHighlightsProps) {

  const { getTextStyle } = useTypography();
  const { 
    content, 
    mode, 
    theme,
    updateElementContent 
  } = useEditStore();

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Helper to handle content updates
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Extract content with type safety and defaults using the new system
  const blockContent: StackedHighlightsContent = extractLayoutContent(elements, CONTENT_SCHEMA);

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
    const { updateFontsFromTone } = useEditStore.getState();
    updateFontsFromTone(); // Set fonts based on current tone
  }, []);

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="StackedHighlights"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`mb-6 ${colorTokens.textPrimary}`}
              style={getTextStyle('h1')}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>

          {/* Optional Mechanism Name */}
          {(blockContent.mechanism_name || mode === 'edit') && (
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="mechanism_name"
              onEdit={(value) => handleContentUpdate('mechanism_name', value)}
            >
              <div 
                className={`inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-300 rounded-full text-blue-800 font-semibold ${!blockContent.mechanism_name && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-sm')}
              >
                {blockContent.mechanism_name && (
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
                {blockContent.mechanism_name || (mode === 'edit' ? 'Add mechanism name (e.g., "Powered by SmartFlow™")' : '')}
              </div>
            </ModeWrapper>
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
            />
          ))}
        </div>

        {/* Unique Value Proposition */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full text-blue-800">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Our proprietary approach that you won't find anywhere else</span>
          </div>
        </div>

      </div>
    </section>
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