// components/layout/PrivacyCommitmentBlock.tsx
// Production-ready privacy policy highlights

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface PrivacyCommitmentBlockContent {
  headline: string;
  privacy_commitments: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Your Privacy is Our Priority' 
  },
  privacy_commitments: { 
    type: 'string' as const, 
    default: 'We never sell your data|Full GDPR compliance|Transparent data usage|User control over data|Regular privacy audits|Anonymized analytics only' 
  }
};

export default function PrivacyCommitmentBlock(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<PrivacyCommitmentBlockContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const commitments = blockContent.privacy_commitments 
    ? blockContent.privacy_commitments.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PrivacyCommitmentBlock"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 rounded-2xl p-12 border border-blue-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline || ''}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h2"
              backgroundType="neutral"
              colorTokens={colorTokens}
              className="text-blue-900 mb-4"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground="bg-blue-50"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {commitments.map((commitment, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-900 font-medium">{commitment}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'PrivacyCommitmentBlock',
  category: 'Security Sections',
  description: 'Privacy policy highlights and commitments',
  tags: ['privacy', 'gdpr', 'data-protection', 'commitments'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes'
};