// components/layout/SecurityGuaranteePanel.tsx
// Production-ready security guarantees panel

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface SecurityGuaranteePanelContent {
  headline: string;
  guarantee_text: string;
  security_guarantees: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Our Security Guarantee to You' 
  },
  guarantee_text: { 
    type: 'string' as const, 
    default: 'We stand behind our security measures with comprehensive guarantees and insurance coverage.' 
  },
  security_guarantees: { 
    type: 'string' as const, 
    default: '99.9% Uptime SLA|$1M Cyber Insurance|24/7 Security Monitoring|Zero Data Loss Guarantee|Breach Notification <24hrs|Full Incident Response Team' 
  }
};

// Helper function to add a new guarantee
const addGuarantee = (guarantees: string): string => {
  const guaranteeList = guarantees.split('|').map(g => g.trim()).filter(g => g);
  guaranteeList.push('New Security Guarantee');
  return guaranteeList.join('|');
};

// Helper function to remove a guarantee
const removeGuarantee = (guarantees: string, indexToRemove: number): string => {
  const guaranteeList = guarantees.split('|').map(g => g.trim()).filter(g => g);
  if (indexToRemove >= 0 && indexToRemove < guaranteeList.length) {
    guaranteeList.splice(indexToRemove, 1);
  }
  return guaranteeList.join('|');
};

export default function SecurityGuaranteePanel(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<SecurityGuaranteePanelContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const guarantees = blockContent.security_guarantees
    ? blockContent.security_guarantees.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  // Handle individual guarantee editing
  const handleGuaranteeEdit = (index: number, value: string) => {
    const guaranteeList = blockContent.security_guarantees.split('|');
    guaranteeList[index] = value;
    handleContentUpdate('security_guarantees', guaranteeList.join('|'));
  };

  // Handle adding a new guarantee
  const handleAddGuarantee = () => {
    const newGuarantees = addGuarantee(blockContent.security_guarantees);
    handleContentUpdate('security_guarantees', newGuarantees);
  };

  // Handle removing a guarantee
  const handleRemoveGuarantee = (indexToRemove: number) => {
    const newGuarantees = removeGuarantee(blockContent.security_guarantees, indexToRemove);
    handleContentUpdate('security_guarantees', newGuarantees);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SecurityGuaranteePanel"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full -translate-y-32 translate-x-32 opacity-20"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.headline || ''}
                onEdit={(value) => handleContentUpdate('headline', value)}
                level="h2"
                backgroundType="primary"
                colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                className="text-white mb-4"
                sectionId={sectionId}
                elementKey="headline"
                sectionBackground="bg-blue-900"
              />
              
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.guarantee_text || ''}
                onEdit={(value) => handleContentUpdate('guarantee_text', value)}
                backgroundType="primary"
                colorTokens={{ ...colorTokens, textSecondary: 'text-blue-100' }}
                variant="body"
                className="text-blue-100 text-lg max-w-2xl mx-auto"
                sectionId={sectionId}
                elementKey="guarantee_text"
                sectionBackground="bg-blue-900"
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guarantees.map((guarantee, index) => (
                <div key={index} className="group bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20 relative">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      {mode !== 'preview' ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleGuaranteeEdit(index, e.currentTarget.textContent || '')}
                          className="outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-white hover:bg-opacity-10 text-white font-semibold"
                        >
                          {guarantee}
                        </div>
                      ) : (
                        <span className="text-white font-semibold">{guarantee}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-blue-200 text-sm">Guaranteed in our service agreement</div>

                  {/* Delete button - only show in edit mode and if can remove */}
                  {mode !== 'preview' && guarantees.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGuarantee(index);
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
                      title="Remove this guarantee"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Guarantee Button - only show in edit mode and if under max limit */}
            {mode !== 'preview' && guarantees.length < 8 && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleAddGuarantee}
                  className="flex items-center space-x-2 mx-auto px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 border-2 border-white border-opacity-30 hover:border-opacity-50 rounded-xl transition-all duration-200 group"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-white font-medium">Add Security Guarantee</span>
                </button>
              </div>
            )}

            <div className="text-center mt-12">
              <div className="inline-flex items-center px-6 py-3 bg-white bg-opacity-20 rounded-full border border-white border-opacity-30">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">Backed by comprehensive insurance and legal guarantees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SecurityGuaranteePanel',
  category: 'Security Sections',
  description: 'Security guarantees and insurance coverage display',
  tags: ['security', 'guarantees', 'insurance', 'sla', 'trust'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes'
};