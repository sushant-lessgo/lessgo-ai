// components/layout/AuditResultsPanel.tsx
// Production-ready security audit results panel using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface AuditResultsPanelContent {
  headline: string;
  subheadline?: string;
  audit_firm: string;
  audit_date: string;
  audit_type: string;
  audit_results: string;
  report_link?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Latest Security Audit Results' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Independent third-party audits verify our commitment to the highest security standards.' 
  },
  audit_firm: { 
    type: 'string' as const, 
    default: 'Deloitte & Touche LLP' 
  },
  audit_date: { 
    type: 'string' as const, 
    default: 'December 2024' 
  },
  audit_type: { 
    type: 'string' as const, 
    default: 'SOC 2 Type II Security Audit' 
  },
  audit_results: { 
    type: 'string' as const, 
    default: 'Zero Critical Findings|100% Compliance Rate|Controls Operating Effectively|No Material Weaknesses|Recommendations Implemented|Clean Audit Opinion' 
  },
  report_link: { 
    type: 'string' as const, 
    default: '' 
  }
};

export default function AuditResultsPanel(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<AuditResultsPanelContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse audit results from pipe-separated string
  const auditResults = blockContent.audit_results 
    ? blockContent.audit_results.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="AuditResultsPanel"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h1')}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {blockContent.subheadline && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg max-w-3xl mx-auto"
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Audit Panel */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          
          {/* Audit Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">AUDIT PASSED</h3>
                  <p className="text-green-100">Full compliance verified</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">✓</div>
              </div>
            </div>
          </div>

          {/* Audit Details */}
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.audit_firm}
                    onEdit={(value) => handleContentUpdate('audit_firm', value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={getTextStyle('h3')}
                    className="font-bold text-gray-900"
                    sectionId={sectionId}
                    elementKey="audit_firm"
                    sectionBackground="bg-white"
                  />
                </div>
                <div className="text-sm text-gray-600">Audit Firm</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.audit_date}
                    onEdit={(value) => handleContentUpdate('audit_date', value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={getTextStyle('h3')}
                    className="font-bold text-gray-900"
                    sectionId={sectionId}
                    elementKey="audit_date"
                    sectionBackground="bg-white"
                  />
                </div>
                <div className="text-sm text-gray-600">Audit Date</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.audit_type}
                    onEdit={(value) => handleContentUpdate('audit_type', value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={getTextStyle('body')}
                    className="font-bold text-gray-900"
                    sectionId={sectionId}
                    elementKey="audit_type"
                    sectionBackground="bg-white"
                  />
                </div>
                <div className="text-sm text-gray-600">Audit Type</div>
              </div>
            </div>

            {/* Audit Results */}
            <div className="space-y-4 mb-8">
              <h4 className="font-bold text-gray-900 mb-4" style={getTextStyle('h3')}>
                Key Findings & Results
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                {auditResults.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-green-800 font-medium">{result}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Link */}
            {blockContent.report_link && (
              <div className="text-center">
                <a 
                  href={blockContent.report_link}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Full Report
                </a>
              </div>
            )}
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'AuditResultsPanel',
  category: 'Security Sections',
  description: 'Display security audit results and compliance verification',
  tags: ['security', 'audit', 'compliance', 'verification', 'trust'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  features: [
    'Audit status indicator',
    'Detailed audit information',
    'Results checklist',
    'Report download link',
    'Professional audit layout'
  ],
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'audit_firm', label: 'Audit Firm Name', type: 'text', required: true },
    { key: 'audit_date', label: 'Audit Date', type: 'text', required: true },
    { key: 'audit_type', label: 'Audit Type', type: 'text', required: true },
    { key: 'audit_results', label: 'Audit Results (pipe separated)', type: 'textarea', required: true },
    { key: 'report_link', label: 'Report Download Link', type: 'text', required: false }
  ],
  
  useCases: [
    'Security compliance pages',
    'Enterprise trust sections',
    'Audit transparency displays',
    'Regulatory compliance showcases'
  ]
};