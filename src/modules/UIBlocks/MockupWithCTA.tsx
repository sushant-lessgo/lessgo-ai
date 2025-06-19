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

interface MockupWithCTAProps extends LayoutComponentProps {}

// Content interface for MockupWithCTA layout
interface MockupWithCTAContent {
  headline: string;
  cta_text: string;
  subheadline?: string;
  urgency_text?: string;
  guarantee_text?: string;
}

// Content schema for MockupWithCTA layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Ready to Transform Your Business?' },
  cta_text: { type: 'string' as const, default: 'Start Your Free Trial' },
  subheadline: { type: 'string' as const, default: '' },
  urgency_text: { type: 'string' as const, default: '' },
  guarantee_text: { type: 'string' as const, default: '' }
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

// Placeholder Mockup Component
const DeviceMockup = ({ type = 'laptop' }: { type?: 'laptop' | 'phone' }) => {
  if (type === 'phone') {
    return (
      <div className="relative mx-auto w-64 h-[520px] transform hover:scale-105 transition-transform duration-300">
        {/* Phone Frame */}
        <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-10"></div>
            
            {/* Screen Content Placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-24 mx-auto"></div>
                  <div className="h-2 bg-gray-200 rounded w-32 mx-auto"></div>
                  <div className="h-2 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-96 h-64 transform hover:scale-105 transition-transform duration-300">
      {/* Laptop Frame */}
      <div className="absolute inset-0 bg-gray-800 rounded-t-xl shadow-2xl">
        {/* Screen */}
        <div className="w-full h-full bg-black rounded-t-xl p-3">
          <div className="w-full h-full bg-white rounded-md overflow-hidden relative">
            {/* Browser Chrome */}
            <div className="h-8 bg-gray-100 border-b flex items-center px-3 space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 mx-4 h-5 bg-white rounded border text-xs flex items-center px-2 text-gray-400">
                yourapp.com
              </div>
            </div>
            
            {/* Screen Content Placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-20 h-20 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
                  <div className="h-3 bg-gray-200 rounded w-40 mx-auto"></div>
                  <div className="h-3 bg-gray-200 rounded w-28 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Laptop Base */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-80 h-4 bg-gray-700 rounded-b-xl shadow-lg"></div>
    </div>
  );
};

export default function MockupWithCTA({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: MockupWithCTAProps) {

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
  const blockContent: MockupWithCTAContent = extractLayoutContent(elements, CONTENT_SCHEMA);

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
      data-section-type="MockupWithCTA"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Mockup Side */}
          <div className="order-1 lg:order-1 flex justify-center lg:justify-start">
            <DeviceMockup type="laptop" />
          </div>

          {/* CTA Content Side */}
          <div className="order-2 lg:order-2 text-center lg:text-left">
            
            {/* Headline */}
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

            {/* Optional Subheadline */}
            {(blockContent.subheadline || mode === 'edit') && (
              <ModeWrapper
                mode={mode}
                sectionId={sectionId}
                elementKey="subheadline"
                onEdit={(value) => handleContentUpdate('subheadline', value)}
              >
                <p 
                  className={`mb-8 ${colorTokens.textSecondary} ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
                  style={getTextStyle('body-lg')}
                >
                  {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline to provide more context...' : '')}
                </p>
              </ModeWrapper>
            )}

            {/* Primary CTA Button */}
            <div className="mb-6">
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
            </div>

            {/* Urgency and Guarantee Text */}
            <div className="space-y-3">
              {/* Urgency Text */}
              {(blockContent.urgency_text || mode === 'edit') && (
                <ModeWrapper
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="urgency_text"
                  onEdit={(value) => handleContentUpdate('urgency_text', value)}
                >
                  <p 
                    className={`flex items-center justify-center lg:justify-start text-sm ${colorTokens.textSecondary} ${!blockContent.urgency_text && mode === 'edit' ? 'opacity-50' : ''}`}
                    style={getTextStyle('body-sm')}
                  >
                    <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {blockContent.urgency_text || (mode === 'edit' ? 'Add urgency text (e.g., Limited time offer...)' : '')}
                  </p>
                </ModeWrapper>
              )}

              {/* Guarantee Text */}
              {(blockContent.guarantee_text || mode === 'edit') && (
                <ModeWrapper
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="guarantee_text"
                  onEdit={(value) => handleContentUpdate('guarantee_text', value)}
                >
                  <p 
                    className={`flex items-center justify-center lg:justify-start text-sm ${colorTokens.textSecondary} ${!blockContent.guarantee_text && mode === 'edit' ? 'opacity-50' : ''}`}
                    style={getTextStyle('body-sm')}
                  >
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {blockContent.guarantee_text || (mode === 'edit' ? 'Add guarantee text (e.g., 30-day money back guarantee)' : '')}
                  </p>
                </ModeWrapper>
              )}
            </div>
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
                MockupWithCTA - Click any text to edit. Device mockup will be replaced with actual product screenshots.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}