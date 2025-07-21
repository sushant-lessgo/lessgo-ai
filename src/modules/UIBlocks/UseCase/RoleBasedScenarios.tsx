// components/layout/RoleBasedScenarios.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface RoleBasedScenariosContent {
  headline: string;
  roles: string;
  scenarios: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Perfect for Every Role' },
  roles: { type: 'string' as const, default: 'CEO|CTO|Marketing Manager|Sales Director|Operations Manager|Data Analyst' },
  scenarios: { type: 'string' as const, default: 'Get executive dashboards and strategic insights|Monitor system performance and technical metrics|Track campaign performance and lead generation|Manage pipeline and forecast revenue|Optimize processes and resource allocation|Analyze data trends and create reports' }
};

export default function RoleBasedScenarios(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<RoleBasedScenariosContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const roles = blockContent.roles.split('|').map(r => r.trim()).filter(Boolean);
  const scenarios = blockContent.scenarios.split('|').map(s => s.trim()).filter(Boolean);

  return (
    <LayoutSection sectionId={sectionId} sectionType="RoleBasedScenarios" backgroundType={props.backgroundType || 'secondary'} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType || 'secondary'} colorTokens={colorTokens} textStyle={getTextStyle('h1')} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="space-y-8">
          {roles.map((role, index) => (
            <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 flex items-center space-x-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                <span className="font-bold text-lg">{role.split(' ').map(w => w[0]).join('')}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-3" style={getTextStyle('h3')}>{role}</h3>
                <p className="text-gray-600" style={getTextStyle('body')}>{scenarios[index] || 'Role-specific scenario'}</p>
              </div>
              <div className="text-blue-600 font-medium">View Details →</div>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'RoleBasedScenarios', category: 'Use Case', description: 'Role-based scenarios and use cases', defaultBackgroundType: 'secondary' as const };