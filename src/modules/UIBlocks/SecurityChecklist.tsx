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

interface SecurityChecklistProps extends LayoutComponentProps {}

// Security item structure
interface SecurityItem {
  item: string;
  description?: string;
  id: string;
}

// Content interface for SecurityChecklist layout
interface SecurityChecklistContent {
  headline: string;
  security_items: string;
  item_descriptions?: string;
  compliance_note?: string;
}

// Content schema for SecurityChecklist layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Enterprise-Grade Security You Can Trust' },
  security_items: { type: 'string' as const, default: 'End-to-end encryption for all data in transit and at rest|SOC 2 Type II compliance with annual audits|Multi-factor authentication (MFA) required for all accounts|Regular penetration testing by certified security professionals|GDPR and CCPA compliant data handling and privacy controls|24/7 security monitoring with automated threat detection|Role-based access controls with granular permissions|Encrypted backups with geographic redundancy' },
  item_descriptions: { type: 'string' as const, default: '' },
  compliance_note: { type: 'string' as const, default: '' }
};

// Parse security data from pipe-separated strings
const parseSecurityData = (items: string, descriptions?: string): SecurityItem[] => {
  const itemList = items.split('|').map(i => i.trim()).filter(i => i);
  const descriptionList = descriptions ? descriptions.split('|').map(d => d.trim()).filter(d => d) : [];
  
  return itemList.map((item, index) => ({
    id: `security-${index}`,
    item,
    description: descriptionList[index] || undefined
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

// Security Icon Component
const SecurityIcon = ({ item, index }: { item: string, index: number }) => {
  const getIcon = (securityItem: string, fallbackIndex: number) => {
    const lower = securityItem.toLowerCase();
    
    if (lower.includes('encryption') || lower.includes('encrypt')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    } else if (lower.includes('compliance') || lower.includes('audit') || lower.includes('soc') || lower.includes('gdpr')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    } else if (lower.includes('authentication') || lower.includes('mfa') || lower.includes('access')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      );
    } else if (lower.includes('monitoring') || lower.includes('detection') || lower.includes('threat')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (lower.includes('penetration') || lower.includes('testing') || lower.includes('security professional')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    } else if (lower.includes('backup') || lower.includes('redundancy') || lower.includes('recovery')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      );
    } else if (lower.includes('privacy') || lower.includes('data') || lower.includes('control')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    }
    
    // Default security icon
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  };
  
  return getIcon(item, index);
};

// Individual Security Item
const SecurityChecklistItem = ({ 
  securityItem, 
  index, 
  mode, 
  sectionId,
  onItemEdit,
  onDescriptionEdit
}: {
  securityItem: SecurityItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onItemEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="group flex items-start space-x-4 p-6 bg-white rounded-lg border border-green-200 hover:border-green-300 hover:shadow-md transition-all duration-300">
      
      {/* Checkmark and Icon */}
      <div className="flex items-center space-x-3 flex-shrink-0">
        {/* Green Checkmark */}
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white group-hover:bg-green-600 transition-colors duration-300">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        
        {/* Security Icon */}
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors duration-300">
          <SecurityIcon item={securityItem.item} index={index} />
        </div>
      </div>
      
      {/* Security Content */}
      <div className="flex-1">
        {/* Security Item */}
        <div className="mb-2">
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onItemEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900 leading-relaxed"
              style={getTextStyle('h4')}
            >
              {securityItem.item}
            </div>
          ) : (
            <h3 
              className="font-semibold text-gray-900 leading-relaxed"
              style={getTextStyle('h4')}
            >
              {securityItem.item}
            </h3>
          )}
        </div>
        
        {/* Optional Description */}
        {(securityItem.description || mode === 'edit') && (
          <div>
            {mode === 'edit' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed ${!securityItem.description ? 'opacity-50 italic' : ''}`}
                style={getTextStyle('body-sm')}
              >
                {securityItem.description || 'Add optional description to explain this security measure...'}
              </div>
            ) : securityItem.description && (
              <p 
                className="text-gray-600 leading-relaxed"
                style={getTextStyle('body-sm')}
              >
                {securityItem.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function SecurityChecklist({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: SecurityChecklistProps) {

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
  const blockContent: SecurityChecklistContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse security data
  const securityItems = parseSecurityData(blockContent.security_items, blockContent.item_descriptions);

  // Handle individual editing
  const handleItemEdit = (index: number, value: string) => {
    const items = blockContent.security_items.split('|');
    items[index] = value;
    handleContentUpdate('security_items', items.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.item_descriptions ? blockContent.item_descriptions.split('|') : [];
    descriptions[index] = value;
    handleContentUpdate('item_descriptions', descriptions.join('|'));
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
      data-section-type="SecurityChecklist"
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
              className={`mb-6 ${colorTokens.textPrimary}`}
              style={getTextStyle('h1')}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>
        </div>

        {/* Security Checklist */}
        <div className="space-y-4 mb-12">
          {securityItems.map((securityItem, index) => (
            <SecurityChecklistItem
              key={securityItem.id}
              securityItem={securityItem}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onItemEdit={handleItemEdit}
              onDescriptionEdit={handleDescriptionEdit}
            />
          ))}
        </div>

        {/* Optional Compliance Note */}
        {(blockContent.compliance_note || mode === 'edit') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2" style={getTextStyle('h4')}>
                  Compliance & Certifications
                </h3>
                <ModeWrapper
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="compliance_note"
                  onEdit={(value) => handleContentUpdate('compliance_note', value)}
                >
                  <p 
                    className={`text-blue-800 leading-relaxed ${!blockContent.compliance_note && mode === 'edit' ? 'opacity-50 italic' : ''}`}
                    style={getTextStyle('body')}
                  >
                    {blockContent.compliance_note || (mode === 'edit' ? 'Add compliance note (e.g., We maintain SOC 2 Type II compliance and undergo annual security audits...)' : '')}
                  </p>
                </ModeWrapper>
              </div>
            </div>
          </div>
        )}

        {/* Trust Reinforcement */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-800">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Your data is protected by industry-leading security measures</span>
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
                  SecurityChecklist - Edit security items or click individual elements above
                </span>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Security Items (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="security_items"
                    onEdit={(value) => handleContentUpdate('security_items', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-40 overflow-y-auto">
                      {blockContent.security_items}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Item Descriptions (optional, separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="item_descriptions"
                    onEdit={(value) => handleContentUpdate('item_descriptions', value)}
                  >
                    <div className={`bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-32 overflow-y-auto ${!blockContent.item_descriptions ? 'opacity-50 italic' : ''}`}>
                      {blockContent.item_descriptions || 'Add optional descriptions to explain security measures...'}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 Tip: Icons are auto-selected based on security item content (encryption, compliance, authentication, etc.). You can edit individual items by clicking directly on them above.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}