// components/layout/PenetrationTestResults.tsx
// Production-ready penetration test results display

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface PenetrationTestResultsContent {
  headline: string;
  test_date: string;
  test_firm: string;
  test_results: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Latest Penetration Test Results' 
  },
  test_date: { 
    type: 'string' as const, 
    default: 'November 2024' 
  },
  test_firm: { 
    type: 'string' as const, 
    default: 'CyberSec Pro' 
  },
  test_results: { 
    type: 'string' as const, 
    default: 'Zero Critical Vulnerabilities|All High Risks Resolved|Network Security: Excellent|Application Security: Passed|Data Protection: Verified|Access Controls: Secure' 
  }
};

export default function PenetrationTestResults(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<PenetrationTestResultsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const testResults = blockContent.test_results 
    ? blockContent.test_results.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PenetrationTestResults"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <EditableAdaptiveHeadline
                  mode={mode}
                  value={blockContent.headline || ''}
                  onEdit={(value) => handleContentUpdate('headline', value)}
                  level="h2"
                  backgroundType="primary"
                  colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                  className="text-white mb-2"
                  sectionId={sectionId}
                  elementKey="headline"
                  sectionBackground="bg-green-600"
                />
                <p className="text-green-100">Security validation completed</p>
              </div>
              <div className="text-4xl">🛡️</div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.test_date || ''}
                  onEdit={(value) => handleContentUpdate('test_date', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-bold text-gray-900 mb-2"
                  sectionId={sectionId}
                  elementKey="test_date"
                  sectionBackground="bg-white"
                />
                <div className="text-sm text-gray-600">Test Date</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.test_firm || ''}
                  onEdit={(value) => handleContentUpdate('test_firm', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-bold text-gray-900 mb-2"
                  sectionId={sectionId}
                  elementKey="test_firm"
                  sectionBackground="bg-white"
                />
                <div className="text-sm text-gray-600">Testing Firm</div>
              </div>
            </div>

            <div className="space-y-4">
              {testResults.map((result, index) => (
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
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'PenetrationTestResults',
  category: 'Security Sections',
  description: 'Display penetration test results and security validation',
  tags: ['security', 'penetration-test', 'validation', 'results'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes'
};