import React, { useEffect } from 'react';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { useEditStore } from '@/hooks/useEditStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { 
  LayoutComponentProps, 
  SideBySideContent, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface SideBySideBlocksProps extends LayoutComponentProps {}

// Content schema for SideBySideBlocks layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Your Transformation Story' },
  before_label: { type: 'string' as const, default: 'Before' },
  after_label: { type: 'string' as const, default: 'After' },
  before_description: { type: 'string' as const, default: 'Describe the current state or problem your audience faces.' },
  after_description: { type: 'string' as const, default: 'Describe the improved state or solution you provide.' },
  subheadline: { type: 'string' as const, default: '' },
  supporting_text: { type: 'string' as const, default: '' }
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

export default function SideBySideBlocks({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: SideBySideBlocksProps) {

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
  const blockContent: SideBySideContent = extractLayoutContent(elements, CONTENT_SCHEMA);

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

  // Handle tone changes (you might call this from a parent component)
  

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="SideBySideBlocks"
    >
      <div className="max-w-6xl mx-auto">
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
              style={getTextStyle('h1')} // Use typography system
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
                className={`mb-6 ${colorTokens.textSecondary} ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-lg')} // Use typography system
              >
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline...' : '')}
              </p>
            </ModeWrapper>
          )}
        </div>

        {/* Side by Side Blocks */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* Before Block */}
          <div 
            className={`${colorTokens.surfaceCard} rounded-lg shadow-lg p-8 border`}
            style={{ borderColor: `var(--border-color, #e5e7eb)` }}
          >
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 rounded-full mr-3 bg-red-500" />
              <ModeWrapper
                mode={mode}
                sectionId={sectionId}
                elementKey="before_label"
                onEdit={(value) => handleContentUpdate('before_label', value)}
              >
                <h3 
                  className="uppercase tracking-wide text-red-500"
                  style={getTextStyle('h3')} // Use typography system
                >
                  {blockContent.before_label}
                </h3>
              </ModeWrapper>
            </div>

            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="before_description"
              onEdit={(value) => handleContentUpdate('before_description', value)}
            >
              <p 
                className={colorTokens.textPrimary}
                style={getTextStyle('body')} // Use typography system
              >
                {blockContent.before_description}
              </p>
            </ModeWrapper>
          </div>

          {/* After Block */}
          <div 
            className={`${colorTokens.surfaceCard} rounded-lg shadow-lg p-8 border`}
            style={{ borderColor: `var(--border-color, #e5e7eb)` }}
          >
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 rounded-full mr-3 bg-green-500" />
              <ModeWrapper
                mode={mode}
                sectionId={sectionId}
                elementKey="after_label"
                onEdit={(value) => handleContentUpdate('after_label', value)}
              >
                <h3 
                  className="uppercase tracking-wide text-green-500"
                  style={getTextStyle('h3')} // Use typography system
                >
                  {blockContent.after_label}
                </h3>
              </ModeWrapper>
            </div>

            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="after_description"
              onEdit={(value) => handleContentUpdate('after_description', value)}
            >
              <p 
                className={colorTokens.textPrimary}
                style={getTextStyle('body')} // Use typography system
              >
                {blockContent.after_description}
              </p>
            </ModeWrapper>
          </div>
        </div>

        {/* Optional Supporting Text */}
        {(blockContent.supporting_text || mode === 'edit') && (
          <div className="text-center">
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="supporting_text"
              onEdit={(value) => handleContentUpdate('supporting_text', value)}
            >
              <p 
                className={`max-w-3xl mx-auto ${colorTokens.textSecondary} ${!blockContent.supporting_text && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-lg')} // Use typography system
              >
                {blockContent.supporting_text || (mode === 'edit' ? 'Add optional supporting text to reinforce your message...' : '')}
              </p>
            </ModeWrapper>
          </div>
        )}

        {/* Edit Mode Indicators */}
        {mode === 'edit' && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-blue-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                SideBySideBlocks - Click any text to edit
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}