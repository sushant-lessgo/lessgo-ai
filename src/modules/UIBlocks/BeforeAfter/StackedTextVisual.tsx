import React, { useEffect } from 'react';
import { generateColorTokens } from '../../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { useEditStore } from '@/hooks/useEditStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface StackedTextVisualProps extends LayoutComponentProps {}

// Content interface for StackedTextVisual layout
interface StackedTextVisualContent {
  headline: string;
  before_text: string;
  after_text: string;
  transition_text?: string;
  subheadline?: string;
}

// Content schema for StackedTextVisual layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Transform Your Experience' },
  before_text: { type: 'string' as const, default: 'Struggling with manual processes, disconnected tools, and delayed insights that slow down your progress.' },
  after_text: { type: 'string' as const, default: 'Enjoy automated workflows, unified data, and instant insights that accelerate your success.' },
  transition_text: { type: 'string' as const, default: '' },
  subheadline: { type: 'string' as const, default: '' }
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

export default function StackedTextVisual({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: StackedTextVisualProps) {

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
  const blockContent: StackedTextVisualContent = extractLayoutContent(elements, CONTENT_SCHEMA);

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
      data-section-type="StackedTextVisual"
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
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline...' : '')}
              </p>
            </ModeWrapper>
          )}
        </div>

        {/* Stacked Before/After Blocks */}
        <div className="space-y-8">
          {/* Before Block */}
          <div className="relative">
            <div 
              className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-8 shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-muted, #f9fafb)',
                borderLeftColor: 'var(--border-muted, #9ca3af)'
              }}
            >
              <div className="flex items-start space-x-4">
                {/* Before Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <div className="flex-1">
                  <h3 
                    className="text-gray-700 font-semibold mb-3 uppercase tracking-wide text-sm"
                    style={getTextStyle('h4')}
                  >
                    Before
                  </h3>
                  
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="before_text"
                    onEdit={(value) => handleContentUpdate('before_text', value)}
                  >
                    <p 
                      className="text-gray-700 leading-relaxed"
                      style={getTextStyle('body')}
                    >
                      {blockContent.before_text}
                    </p>
                  </ModeWrapper>
                </div>
              </div>
            </div>
          </div>

          {/* Transition Connector */}
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              {/* Arrow */}
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              
              {/* Optional Transition Text */}
              {(blockContent.transition_text || mode === 'edit') && (
                <ModeWrapper
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="transition_text"
                  onEdit={(value) => handleContentUpdate('transition_text', value)}
                >
                  <p 
                    className={`text-sm font-medium ${colorTokens.textSecondary} text-center px-4 py-2 bg-blue-50 rounded-full ${!blockContent.transition_text && mode === 'edit' ? 'opacity-50' : ''}`}
                    style={getTextStyle('body-sm')}
                  >
                    {blockContent.transition_text || (mode === 'edit' ? 'Add transition text...' : '')}
                  </p>
                </ModeWrapper>
              )}
            </div>
          </div>

          {/* After Block */}
          <div className="relative">
            <div 
              className="bg-green-50 border-l-4 border-green-500 rounded-lg p-8 shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-success, #f0fdf4)',
                borderLeftColor: 'var(--border-success, #22c55e)'
              }}
            >
              <div className="flex items-start space-x-4">
                {/* After Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                <div className="flex-1">
                  <h3 
                    className="text-green-700 font-semibold mb-3 uppercase tracking-wide text-sm"
                    style={getTextStyle('h4')}
                  >
                    After
                  </h3>
                  
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="after_text"
                    onEdit={(value) => handleContentUpdate('after_text', value)}
                  >
                    <p 
                      className="text-green-700 leading-relaxed"
                      style={getTextStyle('body')}
                    >
                      {blockContent.after_text}
                    </p>
                  </ModeWrapper>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode Indicators */}
        {mode === 'edit' && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-blue-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                StackedTextVisual - Click any text to edit
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export const componentMeta = {
  name: 'StackedTextVisual',
  category: 'Comparison',
  description: 'Before/after comparison with adaptive text colors and visual transitions',
  tags: ['before-after', 'comparison', 'transformation', 'visual', 'adaptive-colors'],
  features: [
    'Automatic text color adaptation based on background type',
    'Editable before and after text content',
    'Visual transition connector with optional text',
    'Color-coded blocks (gray for before, green for after)',
    'Contextual icons for each state',
    'Optional subheadline for additional context'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    before_text: 'Text describing the "before" state',
    after_text: 'Text describing the "after" state',
    transition_text: 'Optional text for the transition connector',
    subheadline: 'Optional subheading for additional context'
  },
  examples: [
    'Problem to solution comparison',
    'Current state vs future state',
    'Transformation showcase',
    'Process improvement illustration'
  ]
};