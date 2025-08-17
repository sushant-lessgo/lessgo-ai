// components/layout/TrustSealCollection.tsx
// Production-ready trust seals and badges collection

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TrustSealCollectionContent {
  headline: string;
  trust_seals: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Trusted by Industry Leaders' 
  },
  trust_seals: { 
    type: 'string' as const, 
    default: 'Norton Secured|McAfee Secure|BBB A+ Rating|TrustPilot 4.8/5|Google Partner|AWS Partner|Microsoft Gold Partner|Salesforce Partner' 
  },
  trust_item_1: { 
    type: 'string' as const, 
    default: 'Norton Secured' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'McAfee Secure' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: 'BBB A+ Rating' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: 'TrustPilot 4.8/5' 
  },
  trust_item_5: { 
    type: 'string' as const, 
    default: '' 
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

  // Handle trust seals - support both legacy pipe-separated format and individual fields
  const getTrustItems = (): string[] => {
    // Check if individual trust item fields exist
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2, 
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // If individual items exist, use them; otherwise fall back to legacy format
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    // Legacy format fallback
    return blockContent.trust_seals 
      ? blockContent.trust_seals.split('|').map(item => item.trim()).filter(Boolean)
      : ['Norton Secured', 'McAfee Secure', 'BBB A+ Rating'];
  };
  
  const trustSeals = getTrustItems();

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

        {mode === 'edit' ? (
          <EditableTrustIndicators
            mode={mode}
            trustItems={[
              blockContent.trust_item_1 || '',
              blockContent.trust_item_2 || '',
              blockContent.trust_item_3 || '',
              blockContent.trust_item_4 || '',
              blockContent.trust_item_5 || ''
            ]}
            onTrustItemChange={(index, value) => {
              const fieldKey = `trust_item_${index + 1}` as keyof TrustSealCollectionContent;
              handleContentUpdate(fieldKey, value);
            }}
            onAddTrustItem={() => {
              // Find first empty slot and add placeholder
              const emptyIndex = [
                blockContent.trust_item_1,
                blockContent.trust_item_2,
                blockContent.trust_item_3,
                blockContent.trust_item_4,
                blockContent.trust_item_5
              ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
              
              if (emptyIndex !== -1) {
                const fieldKey = `trust_item_${emptyIndex + 1}` as keyof TrustSealCollectionContent;
                handleContentUpdate(fieldKey, 'New trust seal');
              }
            }}
            onRemoveTrustItem={(index) => {
              const fieldKey = `trust_item_${index + 1}` as keyof TrustSealCollectionContent;
              handleContentUpdate(fieldKey, '___REMOVED___');
            }}
            colorTokens={colorTokens}
            sectionBackground={sectionBackground}
            sectionId={sectionId}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            iconColor="text-blue-500"
            colorClass={colorTokens.textMuted}
          />
        ) : (
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
        )}
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