// components/layout/TechnicalAdvantage.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TechnicalAdvantageContent {
  headline: string;
  advantages: string;
  advantage_descriptions?: string;
  advantage_icon_1?: string;
  advantage_icon_2?: string;
  advantage_icon_3?: string;
  advantage_icon_4?: string;
  advantage_icon_5?: string;
  advantage_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Technical Advantages That Set Us Apart' },
  advantages: { type: 'string' as const, default: 'Proprietary AI Engine|Real-time Processing|Scalable Architecture|Advanced Security|Edge Computing|Quantum-Ready' },
  advantage_descriptions: { type: 'string' as const, default: 'Advanced machine learning models custom-built for your industry|Process millions of data points in milliseconds|Seamlessly scale from startup to enterprise without rebuilding|Bank-level encryption and security protocols protect your data|Process data at the edge for ultra-low latency|Future-proof architecture ready for quantum computing evolution' },
  advantage_icon_1: { type: 'string' as const, default: '🤖' },
  advantage_icon_2: { type: 'string' as const, default: '⚡' },
  advantage_icon_3: { type: 'string' as const, default: '💯' },
  advantage_icon_4: { type: 'string' as const, default: '🔒' },
  advantage_icon_5: { type: 'string' as const, default: '🚀' },
  advantage_icon_6: { type: 'string' as const, default: '🔮' }
};

export default function TechnicalAdvantage(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<TechnicalAdvantageContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const { getTextStyle: getTypographyStyle } = useTypography();
  const advantages = blockContent.advantages.split('|').map(a => a.trim()).filter(Boolean);
  
  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body-lg');

  return (
    <LayoutSection sectionId={sectionId} sectionType="TechnicalAdvantage" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} colorTokens={colorTokens} className="text-center mb-12" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => {
            const descriptions = blockContent.advantage_descriptions ? blockContent.advantage_descriptions.split('|') : [];
            const getAdvantageIcon = (index: number) => {
              const iconField = `advantage_icon_${index + 1}` as keyof TechnicalAdvantageContent;
              return blockContent[iconField] || '⚡';
            };
            return (
              <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <IconEditableText
                    mode={mode}
                    value={getAdvantageIcon(index)}
                    onEdit={(value) => {
                      const iconField = `advantage_icon_${index + 1}` as keyof TechnicalAdvantageContent;
                      handleContentUpdate(iconField, value);
                    }}
                    backgroundType="primary"
                    colorTokens={colorTokens}
                    iconSize="lg"
                    className="text-white text-2xl"
                    sectionId={sectionId}
                    elementKey={`advantage_icon_${index + 1}`}
                  />
                </div>
                <h3 style={h3Style} className="font-bold text-gray-900 mb-4">{advantage}</h3>
                <p style={bodyStyle} className="text-gray-600">{descriptions[index]?.trim() || 'Advanced technical capability that provides competitive advantage.'}</p>
              </div>
            );
          })}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'TechnicalAdvantage', category: 'Unique Mechanism', description: 'Technical advantages showcase', defaultBackgroundType: 'secondary' as const };