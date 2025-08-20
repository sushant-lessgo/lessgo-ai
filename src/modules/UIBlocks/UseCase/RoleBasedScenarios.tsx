// components/layout/RoleBasedScenarios.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface RoleBasedScenariosContent {
  headline: string;
  roles: string;
  scenarios: string;
  cta_text?: string;
  // Optional role icons
  role_icon_1?: string;
  role_icon_2?: string;
  role_icon_3?: string;
  role_icon_4?: string;
  role_icon_5?: string;
  role_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Perfect for Every Role' },
  roles: { type: 'string' as const, default: 'CEO|CTO|Marketing Manager|Sales Director|Operations Manager|Data Analyst' },
  scenarios: { type: 'string' as const, default: 'Get executive dashboards and strategic insights|Monitor system performance and technical metrics|Track campaign performance and lead generation|Manage pipeline and forecast revenue|Optimize processes and resource allocation|Analyze data trends and create reports' },
  cta_text: { type: 'string' as const, default: 'View Details →' },
  // Optional role icons - contextually relevant defaults
  role_icon_1: { type: 'string' as const, default: '📋' }, // CEO - dashboard
  role_icon_2: { type: 'string' as const, default: '🔧' }, // CTO - tools
  role_icon_3: { type: 'string' as const, default: '📊' }, // Marketing - chart
  role_icon_4: { type: 'string' as const, default: '🎡' }, // Sales - target
  role_icon_5: { type: 'string' as const, default: '⚙️' }, // Operations - gear
  role_icon_6: { type: 'string' as const, default: '📈' }  // Data Analyst - trending up
};

export default function RoleBasedScenarios(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<RoleBasedScenariosContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const roles = blockContent.roles.split('|').map(r => r.trim()).filter(Boolean);
  const scenarios = blockContent.scenarios.split('|').map(s => s.trim()).filter(Boolean);

  // Get role icon from content fields by index
  const getRoleIcon = (index: number) => {
    const iconFields = [
      blockContent.role_icon_1,
      blockContent.role_icon_2,
      blockContent.role_icon_3,
      blockContent.role_icon_4,
      blockContent.role_icon_5,
      blockContent.role_icon_6
    ];
    return iconFields[index];
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="RoleBasedScenarios" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="space-y-8">
          {roles.map((role, index) => (
            <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 flex items-center space-x-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex flex-col items-center justify-center text-white flex-shrink-0">
                {getRoleIcon(index) ? (
                  <>
                    <div className="text-xs font-bold">{role.split(' ').map(w => w[0]).join('')}</div>
                    <IconEditableText
                      mode={mode}
                      value={getRoleIcon(index) || ''}
                      onEdit={(value) => handleContentUpdate(`role_icon_${index + 1}` as keyof RoleBasedScenariosContent, value)}
                      backgroundType="primary"
                      colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                      iconSize="md"
                      className="text-xl text-white"
                      sectionId={sectionId}
                      elementKey={`role_icon_${index + 1}`}
                    />
                  </>
                ) : (
                  <span className="font-bold text-lg">{role.split(' ').map(w => w[0]).join('')}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-3">{role}</h3>
                <p className="text-gray-600">{scenarios[index] || 'Role-specific scenario'}</p>
              </div>
              <div className="text-blue-600 font-medium">{blockContent.cta_text || 'View Details →'}</div>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'RoleBasedScenarios', category: 'Use Case', description: 'Role-based scenarios and use cases', defaultBackgroundType: 'secondary' as const };