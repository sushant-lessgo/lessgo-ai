// components/layout/SystemArchitecture.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface SystemArchitectureContent {
  headline: string;
  architecture_components: string;
  component_1: string;
  component_2: string;
  component_3: string;
  component_4: string;
  component_5: string;
  component_6: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Advanced System Architecture' },
  architecture_components: { type: 'string' as const, default: 'AI Engine|Data Layer|API Gateway|Security Layer|User Interface|Analytics Engine' },
  component_1: { type: 'string' as const, default: 'AI Engine' },
  component_2: { type: 'string' as const, default: 'Data Layer' },
  component_3: { type: 'string' as const, default: 'API Gateway' },
  component_4: { type: 'string' as const, default: 'Security Layer' },
  component_5: { type: 'string' as const, default: 'User Interface' },
  component_6: { type: 'string' as const, default: 'Analytics Engine' }
};

export default function SystemArchitecture(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<SystemArchitectureContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const { getTextStyle: getTypographyStyle } = useTypography();
  // Get components with individual fields taking priority over pipe-separated format
  const getComponents = (): string[] => {
    const individualComponents = [
      blockContent.component_1,
      blockContent.component_2,
      blockContent.component_3,
      blockContent.component_4,
      blockContent.component_5,
      blockContent.component_6
    ].filter((component): component is string => Boolean(component && component.trim() !== '' && component !== '___REMOVED___'));
    
    // Use individual fields if available, otherwise fall back to pipe-separated format
    if (individualComponents.length > 0) {
      return individualComponents;
    }
    
    return blockContent.architecture_components 
      ? blockContent.architecture_components.split('|').map(c => c.trim()).filter(Boolean)
      : [];
  };
  
  const components = getComponents();
  
  // Typography styles
  const h3Style = getTypographyStyle('h3');

  return (
    <LayoutSection sectionId={sectionId} sectionType="SystemArchitecture" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto text-center">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="mb-12" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {components.map((component, index) => {
            const getComponentIcon = (index: number) => {
              const iconField = `component_icon_${index + 1}` as keyof SystemArchitectureContent;
              return blockContent[iconField] || '🏗️';
            };
            return (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <IconEditableText
                    mode={mode}
                    value={getComponentIcon(index)}
                    onEdit={(value) => {
                      const iconField = `component_icon_${index + 1}` as keyof SystemArchitectureContent;
                      handleContentUpdate(iconField, value);
                    }}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    iconSize="lg"
                    className="text-2xl"
                    sectionId={sectionId}
                    elementKey={`component_icon_${index + 1}`}
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={component}
                  onEdit={(value) => {
                    const fieldKey = `component_${index + 1}` as keyof SystemArchitectureContent;
                    handleContentUpdate(fieldKey, value);
                  }}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={h3Style}
                  className="font-bold text-gray-900"
                  placeholder={`Component ${index + 1}`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`component_${index + 1}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'SystemArchitecture', category: 'Unique Mechanism', description: 'System architecture diagram', defaultBackgroundType: 'neutral' as const };