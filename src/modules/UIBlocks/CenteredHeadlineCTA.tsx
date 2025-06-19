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

interface CenteredHeadlineCTAProps extends LayoutComponentProps {}

// Content interface for CenteredHeadlineCTA layout
interface CenteredHeadlineCTAContent {
  headline: string;
  cta_text: string;
  subheadline?: string;
  urgency_text?: string;
}

// Content schema for CenteredHeadlineCTA layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Ready to Transform Your Business?' },
  cta_text: { type: 'string' as const, default: 'Start Your Free Trial Today' },
  subheadline: { type: 'string' as const, default: '' },
  urgency_text: { type: 'string' as const, default: '' }
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

export default function CenteredHeadlineCTA({ 
  sectionId, 
  className = '',
  backgroundType = 'primary' 
}: CenteredHeadlineCTAProps) {

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
  const blockContent: CenteredHeadlineCTAContent = extractLayoutContent(elements, CONTENT_SCHEMA);

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
      data-section-type="CenteredHeadlineCTA"
    >
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Main Headline */}
        <div className="mb-8">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`${colorTokens.textPrimary} leading-tight mb-6`}
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
                className={`max-w-2xl mx-auto ${colorTokens.textSecondary} ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-lg')}
              >
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline to provide more context...' : '')}
              </p>
            </ModeWrapper>
          )}
        </div>

        {/* CTA Button Container */}
        <div className="mb-8">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="cta_text"
            onEdit={(value) => handleContentUpdate('cta_text', value)}
          >
            <button 
              className="inline-flex items-center px-10 py-5 text-xl font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 border-2 border-blue-600 hover:border-blue-700"
              style={{ 
                backgroundColor: `var(--color-primary, #2563eb)`,
                borderColor: `var(--color-primary, #2563eb)`,
                ...getTextStyle('h3')
              }}
            >
              {blockContent.cta_text}
              <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </ModeWrapper>
        </div>

        {/* Optional Urgency Text */}
        {(blockContent.urgency_text || mode === 'edit') && (
          <div className="mb-8">
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="urgency_text"
              onEdit={(value) => handleContentUpdate('urgency_text', value)}
            >
              <div 
                className={`inline-flex items-center px-4 py-2 bg-orange-100 border border-orange-300 rounded-full text-orange-800 font-medium ${!blockContent.urgency_text && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-sm')}
              >
                {blockContent.urgency_text && (
                  <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {blockContent.urgency_text || (mode === 'edit' ? 'Add urgency text (e.g., Limited time offer - 50% off first month)' : '')}
              </div>
            </ModeWrapper>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8 text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Free 14-day trial</span>
          </div>
          
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>No credit card required</span>
          </div>
          
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* Social Proof Indicators */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12">
            
            {/* User Count */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">10,000+</div>
              <div className="text-sm text-gray-600">Happy customers</div>
            </div>
            
            {/* Rating */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-gray-600">4.9/5 average rating</div>
            </div>
            
            {/* Security */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-sm text-gray-600">Bank-level security</div>
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
                CenteredHeadlineCTA - Click any text to edit. Perfect for converting visitors into customers.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}