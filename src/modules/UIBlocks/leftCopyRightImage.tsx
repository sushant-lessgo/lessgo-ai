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

interface LeftCopyRightImageProps extends LayoutComponentProps {}

// Content interface for LeftCopyRightImage layout
interface LeftCopyRightImageContent {
  headline: string;
  cta_text: string;
  subheadline?: string;
  supporting_text?: string;
  badge_text?: string;
}

// Content schema for LeftCopyRightImage layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Transform Your Business with Smart Automation' },
  cta_text: { type: 'string' as const, default: 'Start Free Trial' },
  subheadline: { type: 'string' as const, default: '' },
  supporting_text: { type: 'string' as const, default: '' },
  badge_text: { type: 'string' as const, default: '' }
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

// Hero Image Placeholder Component
const HeroImagePlaceholder = () => {
  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[500px]">
      {/* Main Image Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Floating Dashboard Mockup */}
        <div className="absolute top-8 left-8 right-8 bottom-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          
          {/* Dashboard Header */}
          <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="ml-4 text-xs text-gray-500">Dashboard</div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6 space-y-4">
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="w-8 h-8 bg-blue-500 rounded mb-2"></div>
                <div className="h-2 bg-blue-200 rounded w-3/4 mb-1"></div>
                <div className="h-1 bg-blue-200 rounded w-1/2"></div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="w-8 h-8 bg-green-500 rounded mb-2"></div>
                <div className="h-2 bg-green-200 rounded w-3/4 mb-1"></div>
                <div className="h-1 bg-green-200 rounded w-1/2"></div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="w-8 h-8 bg-purple-500 rounded mb-2"></div>
                <div className="h-2 bg-purple-200 rounded w-3/4 mb-1"></div>
                <div className="h-1 bg-purple-200 rounded w-1/2"></div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="bg-gray-50 rounded-lg p-4 h-32 flex items-end space-x-2">
              <div className="bg-blue-400 rounded-t h-16 w-4"></div>
              <div className="bg-blue-400 rounded-t h-20 w-4"></div>
              <div className="bg-blue-400 rounded-t h-12 w-4"></div>
              <div className="bg-blue-400 rounded-t h-24 w-4"></div>
              <div className="bg-blue-400 rounded-t h-18 w-4"></div>
              <div className="bg-blue-400 rounded-t h-28 w-4"></div>
              <div className="bg-blue-400 rounded-t h-22 w-4"></div>
            </div>

            {/* List Items */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="h-2 bg-gray-200 rounded flex-1"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="h-2 bg-gray-200 rounded flex-1"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="h-2 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-blue-500 rounded-full shadow-lg flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <div className="absolute bottom-4 left-4 w-12 h-12 bg-green-500 rounded-lg shadow-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default function LeftCopyRightImage({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: LeftCopyRightImageProps) {

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
  const blockContent: LeftCopyRightImageContent = extractLayoutContent(elements, CONTENT_SCHEMA);

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
      className={`py-20 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="LeftCopyRightImage"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[600px]">
          
          {/* Left Column - Copy */}
          <div className="order-2 lg:order-1">
            
            {/* Optional Badge */}
            {(blockContent.badge_text || mode === 'edit') && (
              <div className="mb-6">
                <ModeWrapper
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="badge_text"
                  onEdit={(value) => handleContentUpdate('badge_text', value)}
                >
                  <span 
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 ${!blockContent.badge_text && mode === 'edit' ? 'opacity-50' : ''}`}
                    style={getTextStyle('body-sm')}
                  >
                    {blockContent.badge_text || (mode === 'edit' ? 'Add optional badge (e.g., New Feature, Beta, etc.)' : '')}
                  </span>
                </ModeWrapper>
              </div>
            )}

            {/* Main Headline */}
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="headline"
              onEdit={(value) => handleContentUpdate('headline', value)}
            >
              <h1 
                className={`mb-6 ${colorTokens.textPrimary} leading-tight`}
                style={getTextStyle('h1')}
              >
                {blockContent.headline}
              </h1>
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
                  style={getTextStyle('body-lg')}
                >
                  {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline to support your main message...' : '')}
                </p>
              </ModeWrapper>
            )}

            {/* Optional Supporting Text */}
            {(blockContent.supporting_text || mode === 'edit') && (
              <ModeWrapper
                mode={mode}
                sectionId={sectionId}
                elementKey="supporting_text"
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
              >
                <p 
                  className={`mb-8 ${colorTokens.textSecondary} ${!blockContent.supporting_text && mode === 'edit' ? 'opacity-50' : ''}`}
                  style={getTextStyle('body')}
                >
                  {blockContent.supporting_text || (mode === 'edit' ? 'Add optional supporting text to provide more details...' : '')}
                </p>
              </ModeWrapper>
            )}

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <ModeWrapper
                mode={mode}
                sectionId={sectionId}
                elementKey="cta_text"
                onEdit={(value) => handleContentUpdate('cta_text', value)}
              >
                <button 
                  className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
                  style={{ 
                    backgroundColor: `var(--color-primary, #2563eb)`,
                    ...getTextStyle('body-lg')
                  }}
                >
                  {blockContent.cta_text}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </ModeWrapper>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free trial
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  No credit card
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="order-1 lg:order-2">
            <HeroImagePlaceholder />
          </div>
        </div>

        {/* Edit Mode Indicators */}
        {mode === 'edit' && (
          <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-blue-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                LeftCopyRightImage - Click any text to edit. Hero image placeholder will be replaced with actual product screenshots.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}