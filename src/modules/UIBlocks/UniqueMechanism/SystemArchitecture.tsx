// components/layout/SystemArchitecture.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface SystemArchitectureContent {
  headline: string;
  architecture_components: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Advanced System Architecture' },
  architecture_components: { type: 'string' as const, default: 'AI Engine|Data Layer|API Gateway|Security Layer|User Interface|Analytics Engine' }
};

export default function SystemArchitecture(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<SystemArchitectureContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const components = blockContent.architecture_components.split('|').map(c => c.trim()).filter(Boolean);

  return (
    <LayoutSection sectionId={sectionId} sectionType="SystemArchitecture" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto text-center">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="mb-12" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {components.map((component, index) => (
            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center text-2xl">🏗️</div>
              <h3 className="font-bold text-gray-900">{component}</h3>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'SystemArchitecture', category: 'Unique Mechanism', description: 'System architecture diagram', defaultBackgroundType: 'neutral' as const };