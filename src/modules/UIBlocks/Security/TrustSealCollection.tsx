// components/layout/TrustSealCollection.tsx
// Production-ready trust seals and badges collection

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TrustSealCollectionContent {
  headline: string;
  trust_seals: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Trusted by Industry Leaders' 
  },
  trust_seals: { 
    type: 'string' as const, 
    default: 'Norton Secured|McAfee Secure|BBB A+ Rating|TrustPilot 4.8/5|Google Partner|AWS Partner|Microsoft Gold Partner|Salesforce Partner' 
  }
};

export default function TrustSealCollection(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<TrustSealCollectionContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const trustSeals = blockContent.trust_seals 
    ? blockContent.trust_seals.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TrustSealCollection"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto text-center">
        <EditableAdaptiveHeadline
          mode={mode}
          value={blockContent.headline || ''}
          onEdit={(value) => handleContentUpdate('headline', value)}
          level="h2"
          backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
          colorTokens={colorTokens}
          className="mb-12"
          sectionId={sectionId}
          elementKey="headline"
          sectionBackground={sectionBackground}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8">
          {trustSeals.map((seal, index) => (
            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
              <div className="text-sm font-semibold text-gray-900">{seal}</div>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'TrustSealCollection',
  category: 'Security Sections',
  description: 'Collection of trust seals and security badges',
  tags: ['trust', 'seals', 'badges', 'security', 'partners'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes'
};