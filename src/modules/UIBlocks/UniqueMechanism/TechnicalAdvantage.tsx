// components/layout/TechnicalAdvantage.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TechnicalAdvantageContent {
  headline: string;
  advantages: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Technical Advantages That Set Us Apart' },
  advantages: { type: 'string' as const, default: 'Proprietary AI Engine|Real-time Processing|Scalable Architecture|Advanced Security|Edge Computing|Quantum-Ready' }
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
          {advantages.map((advantage, index) => (
            <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white mb-6 text-2xl">⚡</div>
              <h3 style={h3Style} className="font-bold text-gray-900 mb-4">{advantage}</h3>
              <p style={bodyStyle} className="text-gray-600">Advanced technical capability that provides competitive advantage.</p>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'TechnicalAdvantage', category: 'Unique Mechanism', description: 'Technical advantages showcase', defaultBackgroundType: 'secondary' as const };