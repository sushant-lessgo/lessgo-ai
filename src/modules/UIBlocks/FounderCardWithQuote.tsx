import React, { useEffect } from 'react';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { usePageStore } from '@/hooks/usePageStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface FounderCardWithQuoteProps extends LayoutComponentProps {}

// Content interface for FounderCardWithQuote layout
interface FounderCardWithQuoteContent {
  founder_name: string;
  founder_title: string;
  founder_quote: string;
  founder_bio?: string;
  company_context?: string;
}

// Content schema for FounderCardWithQuote layout
const CONTENT_SCHEMA = {
  founder_name: { type: 'string' as const, default: 'Sarah Johnson' },
  founder_title: { type: 'string' as const, default: 'CEO & Co-Founder' },
  founder_quote: { type: 'string' as const, default: 'We built this product because we experienced the same frustrations our customers face every day. Our mission is to eliminate the complexity and give you back your time to focus on what truly matters.' },
  founder_bio: { type: 'string' as const, default: '' },
  company_context: { type: 'string' as const, default: '' }
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

// Founder Avatar Placeholder Component
const FounderAvatar = ({ name, size = 'large' }: { name: string, size?: 'small' | 'large' }) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    large: 'w-24 h-24 md:w-32 md:h-32'
  };

  // Generate initials from name
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg`}>
      <span className="text-white font-bold text-lg md:text-xl">
        {getInitials(name)}
      </span>
    </div>
  );
};

export default function FounderCardWithQuote({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: FounderCardWithQuoteProps) {

  const { getTextStyle } = useTypography();
  const { 
    content, 
    ui: { mode }, 
    layout: { theme },
    updateElementContent 
  } = usePageStore();

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Helper to handle content updates
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Extract content with type safety and defaults using the new system
  const blockContent: FounderCardWithQuoteContent = extractLayoutContent(elements, CONTENT_SCHEMA);

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
      data-section-type="FounderCardWithQuote"
    >
      <div className="max-w-4xl mx-auto">
        {/* Main Founder Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              
              {/* Founder Avatar */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <FounderAvatar name={blockContent.founder_name} size="large" />
              </div>

              {/* Quote and Details */}
              <div className="flex-1 text-center md:text-left">
                {/* Quote */}
                <div className="mb-6">
                  <svg 
                    className="w-8 h-8 text-blue-500 mb-4 mx-auto md:mx-0" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                  
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="founder_quote"
                    onEdit={(value) => handleContentUpdate('founder_quote', value)}
                  >
                    <blockquote 
                      className={`text-lg md:text-xl leading-relaxed ${colorTokens.textPrimary} italic mb-6`}
                      style={getTextStyle('body-lg')}
                    >
                      "{blockContent.founder_quote}"
                    </blockquote>
                  </ModeWrapper>
                </div>

                {/* Founder Info */}
                <div className="space-y-2">
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="founder_name"
                    onEdit={(value) => handleContentUpdate('founder_name', value)}
                  >
                    <h3 
                      className={`font-bold ${colorTokens.textPrimary}`}
                      style={getTextStyle('h3')}
                    >
                      {blockContent.founder_name}
                    </h3>
                  </ModeWrapper>

                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="founder_title"
                    onEdit={(value) => handleContentUpdate('founder_title', value)}
                  >
                    <p 
                      className={`${colorTokens.textSecondary} font-medium`}
                      style={getTextStyle('body')}
                    >
                      {blockContent.founder_title}
                    </p>
                  </ModeWrapper>
                </div>
              </div>
            </div>

            {/* Optional Founder Bio */}
            {(blockContent.founder_bio || mode === 'edit') && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <ModeWrapper
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="founder_bio"
                  onEdit={(value) => handleContentUpdate('founder_bio', value)}
                >
                  <p 
                    className={`${colorTokens.textSecondary} leading-relaxed text-center md:text-left ${!blockContent.founder_bio && mode === 'edit' ? 'opacity-50' : ''}`}
                    style={getTextStyle('body')}
                  >
                    {blockContent.founder_bio || (mode === 'edit' ? 'Add optional founder bio to share background and experience...' : '')}
                  </p>
                </ModeWrapper>
              </div>
            )}

            {/* Optional Company Context */}
            {(blockContent.company_context || mode === 'edit') && (
              <div className={`mt-6 ${blockContent.founder_bio || mode === 'edit' ? '' : 'pt-8 border-t border-gray-200'}`}>
                <ModeWrapper
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="company_context"
                  onEdit={(value) => handleContentUpdate('company_context', value)}
                >
                  <div 
                    className={`bg-blue-50 rounded-lg p-4 ${!blockContent.company_context && mode === 'edit' ? 'opacity-50' : ''}`}
                  >
                    <p 
                      className={`text-blue-800 text-sm leading-relaxed ${!blockContent.company_context && mode === 'edit' ? 'italic' : ''}`}
                      style={getTextStyle('body-sm')}
                    >
                      {blockContent.company_context || (mode === 'edit' ? 'Add optional company context or founding story...' : '')}
                    </p>
                  </div>
                </ModeWrapper>
              </div>
            )}
          </div>
        </div>

        {/* Additional Visual Elements */}
        <div className="mt-8 flex justify-center space-x-4 opacity-60">
          {/* Decorative Elements */}
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
        </div>

        {/* Edit Mode Indicators */}
        {mode === 'edit' && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-blue-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                FounderCardWithQuote - Click any text to edit. Avatar will show initials based on founder name.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}