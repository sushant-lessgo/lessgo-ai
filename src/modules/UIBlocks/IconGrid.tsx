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

interface IconGridProps extends LayoutComponentProps {}

// Feature item structure
interface FeatureItem {
  title: string;
  description: string;
  iconType: string;
  id: string;
}

// Content interface for IconGrid layout
interface IconGridContent {
  headline: string;
  feature_titles: string;
  feature_descriptions: string;
  subheadline?: string;
}

// Content schema for IconGrid layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Powerful Features Built for You' },
  feature_titles: { type: 'string' as const, default: 'Real-time Collaboration|Advanced Analytics|Smart Automation|Secure Data Protection|Custom Integrations|24/7 Support' },
  feature_descriptions: { type: 'string' as const, default: 'Work together seamlessly with your team in real-time, no matter where you are.|Get deep insights into your data with powerful analytics and reporting tools.|Automate repetitive tasks and workflows to save time and reduce errors.|Enterprise-grade security keeps your data safe with encryption and compliance.|Connect with your favorite tools through our extensive integration library.|Round-the-clock support from our expert team whenever you need help.' },
  subheadline: { type: 'string' as const, default: '' }
};

// Parse feature data from pipe-separated strings
const parseFeatureData = (titles: string, descriptions: string): FeatureItem[] => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  
  // Icon types based on common feature keywords
  const getIconType = (title: string, index: number): string => {
    const lower = title.toLowerCase();
    if (lower.includes('collaboration') || lower.includes('team')) return 'collaboration';
    if (lower.includes('analytics') || lower.includes('reporting') || lower.includes('insights')) return 'analytics';
    if (lower.includes('automation') || lower.includes('smart') || lower.includes('ai')) return 'automation';
    if (lower.includes('security') || lower.includes('secure') || lower.includes('protection')) return 'security';
    if (lower.includes('integration') || lower.includes('api') || lower.includes('connect')) return 'integration';
    if (lower.includes('support') || lower.includes('help') || lower.includes('customer')) return 'support';
    if (lower.includes('mobile') || lower.includes('app')) return 'mobile';
    if (lower.includes('dashboard') || lower.includes('interface')) return 'dashboard';
    if (lower.includes('workflow') || lower.includes('process')) return 'workflow';
    if (lower.includes('notification') || lower.includes('alert')) return 'notification';
    
    // Fallback to cycle through common icons
    const fallbackIcons = ['feature', 'tool', 'settings', 'chart', 'shield', 'lightning'];
    return fallbackIcons[index % fallbackIcons.length];
  };
  
  return titleList.map((title, index) => ({
    id: `feature-${index}`,
    title,
    description: descriptionList[index] || 'Feature description not provided.',
    iconType: getIconType(title, index)
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

// Feature Icon Component
const FeatureIcon = ({ type, className = "" }: { type: string, className?: string }) => {
  const iconComponents = {
    collaboration: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    analytics: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    automation: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    security: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    integration: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    support: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    mobile: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
      </svg>
    ),
    dashboard: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    workflow: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    notification: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    feature: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    tool: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    settings: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
      </svg>
    ),
    chart: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    shield: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    lightning: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  };

  return iconComponents[type as keyof typeof iconComponents] || iconComponents.feature;
};

// Individual Feature Card
const FeatureCard = ({ 
  item, 
  mode, 
  sectionId, 
  index,
  onTitleEdit,
  onDescriptionEdit 
}: {
  item: FeatureItem;
  mode: 'edit' | 'preview';
  sectionId: string;
  index: number;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
      {/* Icon */}
      <div className="mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
          <FeatureIcon type={item.iconType} className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
            style={getTextStyle('h3')}
          >
            {item.title}
          </div>
        ) : (
          <h3 
            className="font-semibold text-gray-900"
            style={getTextStyle('h3')}
          >
            {item.title}
          </h3>
        )}
      </div>

      {/* Description */}
      <div>
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed"
            style={getTextStyle('body')}
          >
            {item.description}
          </div>
        ) : (
          <p 
            className="text-gray-600 leading-relaxed"
            style={getTextStyle('body')}
          >
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default function IconGrid({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: IconGridProps) {

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
  const blockContent: IconGridContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse feature data
  const featureItems = parseFeatureData(blockContent.feature_titles, blockContent.feature_descriptions);

  // Handle individual title/description editing
  const handleTitleEdit = (index: number, value: string) => {
    const titles = blockContent.feature_titles.split('|');
    titles[index] = value;
    handleContentUpdate('feature_titles', titles.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.feature_descriptions.split('|');
    descriptions[index] = value;
    handleContentUpdate('feature_descriptions', descriptions.join('|'));
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
      data-section-type="IconGrid"
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
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline...' : '')}
              </p>
            </ModeWrapper>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((item, index) => (
            <FeatureCard
              key={item.id}
              item={item}
              mode={mode}
              sectionId={sectionId}
              index={index}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
            />
          ))}
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
                  IconGrid - Edit feature content or click individual titles/descriptions above
                </span>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Feature Titles (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="feature_titles"
                    onEdit={(value) => handleContentUpdate('feature_titles', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-24 overflow-y-auto">
                      {blockContent.feature_titles}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Feature Descriptions (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="feature_descriptions"
                    onEdit={(value) => handleContentUpdate('feature_descriptions', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-40 overflow-y-auto">
                      {blockContent.feature_descriptions}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 Tip: Icons are auto-selected based on feature titles. You can edit individual features by clicking directly on them above.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}