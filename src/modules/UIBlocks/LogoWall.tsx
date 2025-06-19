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

interface LogoWallProps extends LayoutComponentProps {}

// Company logo structure
interface CompanyLogo {
  name: string;
  category?: string;
  id: string;
}

// Content interface for LogoWall layout
interface LogoWallContent {
  headline: string;
  company_names: string;
  subheadline?: string;
  category_labels?: string;
}

// Content schema for LogoWall layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Trusted by Leading Companies Worldwide' },
  company_names: { type: 'string' as const, default: 'Microsoft|Google|Amazon|Tesla|Spotify|Airbnb|Netflix|Shopify|Stripe|Zoom|Slack|Dropbox|Adobe|Salesforce|HubSpot|Atlassian' },
  subheadline: { type: 'string' as const, default: '' },
  category_labels: { type: 'string' as const, default: '' }
};

// Parse company data from pipe-separated strings
const parseCompanyData = (names: string, categories?: string): CompanyLogo[] => {
  const nameList = names.split('|').map(n => n.trim()).filter(n => n);
  const categoryList = categories ? categories.split('|').map(c => c.trim()).filter(c => c) : [];
  
  return nameList.map((name, index) => ({
    id: `company-${index}`,
    name,
    category: categoryList[index] || undefined
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

// Company Logo Placeholder Component
const CompanyLogoPlaceholder = ({ 
  company, 
  mode, 
  index,
  onNameEdit
}: { 
  company: CompanyLogo;
  mode: 'edit' | 'preview';
  index: number;
  onNameEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
  // Generate a professional logo placeholder
  const getLogoPlaceholder = (companyName: string) => {
    // Create initials from company name
    const words = companyName.split(' ').filter(word => word.length > 0);
    let initials = '';
    
    if (words.length === 1) {
      // Single word - use first 1-2 characters
      initials = companyName.substring(0, Math.min(2, companyName.length)).toUpperCase();
    } else {
      // Multiple words - use first letter of each word (max 3)
      initials = words
        .slice(0, 3)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
    }
    
    // Professional color schemes
    const colorSchemes = [
      { bg: 'from-blue-600 to-blue-700', text: 'text-white' },
      { bg: 'from-gray-700 to-gray-800', text: 'text-white' },
      { bg: 'from-green-600 to-green-700', text: 'text-white' },
      { bg: 'from-purple-600 to-purple-700', text: 'text-white' },
      { bg: 'from-red-600 to-red-700', text: 'text-white' },
      { bg: 'from-indigo-600 to-indigo-700', text: 'text-white' },
      { bg: 'from-pink-600 to-pink-700', text: 'text-white' },
      { bg: 'from-teal-600 to-teal-700', text: 'text-white' },
      { bg: 'from-orange-600 to-orange-700', text: 'text-white' },
      { bg: 'from-cyan-600 to-cyan-700', text: 'text-white' }
    ];
    
    // Simple hash to pick consistent color
    const hash = companyName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorScheme = colorSchemes[hash % colorSchemes.length];
    
    return { initials, colorScheme };
  };

  const { initials, colorScheme } = getLogoPlaceholder(company.name);
  
  return (
    <div className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center min-h-[120px]">
      
      {/* Logo Placeholder */}
      <div className={`w-16 h-16 bg-gradient-to-br ${colorScheme.bg} rounded-xl flex items-center justify-center ${colorScheme.text} font-bold text-lg mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        {initials}
      </div>
      
      {/* Company Name */}
      <div className="text-center">
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onNameEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-medium text-gray-700 text-sm text-center"
            style={getTextStyle('body-sm')}
          >
            {company.name}
          </div>
        ) : (
          <span 
            className="font-medium text-gray-700 text-sm group-hover:text-gray-900 transition-colors duration-300"
            style={getTextStyle('body-sm')}
          >
            {company.name}
          </span>
        )}
        
        {/* Category Badge */}
        {company.category && (
          <div className="mt-1">
            <span className="inline-block text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {company.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function LogoWall({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: LogoWallProps) {

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
  const blockContent: LogoWallContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse company data
  const companyLogos = parseCompanyData(blockContent.company_names, blockContent.category_labels);

  // Handle individual name editing
  const handleNameEdit = (index: number, value: string) => {
    const names = blockContent.company_names.split('|');
    names[index] = value;
    handleContentUpdate('company_names', names.join('|'));
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
      data-section-type="LogoWall"
    >
      <div className="max-w-7xl mx-auto">
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

        {/* Company Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {companyLogos.map((company, index) => (
            <CompanyLogoPlaceholder
              key={company.id}
              company={company}
              mode={mode}
              index={index}
              onNameEdit={handleNameEdit}
            />
          ))}
        </div>

        {/* Social Proof Stats */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            
            {/* Customer Count */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600" style={getTextStyle('body-sm')}>
                Companies Trust Us
              </div>
            </div>
            
            {/* Global Reach */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
              <div className="text-gray-600" style={getTextStyle('body-sm')}>
                Countries Worldwide
              </div>
            </div>
            
            {/* Industry Coverage */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">15+</div>
              <div className="text-gray-600" style={getTextStyle('body-sm')}>
                Industries Served
              </div>
            </div>
          </div>
        </div>

        {/* Trust Reinforcement */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-blue-50 border border-blue-200 rounded-full text-blue-800">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Join thousands of satisfied customers</span>
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
                  LogoWall - Edit company names or click individual logos above
                </span>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Company Names (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="company_names"
                    onEdit={(value) => handleContentUpdate('company_names', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-32 overflow-y-auto">
                      {blockContent.company_names}
                    </div>
                  </ModeWrapper>
                </div>
                
                {(blockContent.category_labels || mode === 'edit') && (
                  <div>
                    <label className="block text-blue-700 font-medium mb-1">Category Labels (optional, separated by |):</label>
                    <ModeWrapper
                      mode={mode}
                      sectionId={sectionId}
                      elementKey="category_labels"
                      onEdit={(value) => handleContentUpdate('category_labels', value)}
                    >
                      <div className={`bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-24 overflow-y-auto ${!blockContent.category_labels ? 'opacity-50 italic' : ''}`}>
                        {blockContent.category_labels || 'Add category labels to group companies by type or industry...'}
                      </div>
                    </ModeWrapper>
                  </div>
                )}
                
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 Tip: Logo placeholders are auto-generated with professional colors and initials. Grid adapts automatically to any number of companies (2-6 per row).
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}