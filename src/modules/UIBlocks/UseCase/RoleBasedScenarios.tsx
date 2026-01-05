// components/layout/RoleBasedScenarios.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface RoleBasedScenariosContent {
  headline: string;
  roles: string;
  scenarios: string;
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
  // Optional role icons - contextually relevant defaults
  role_icon_1: { type: 'string' as const, default: '📋' }, // CEO - dashboard
  role_icon_2: { type: 'string' as const, default: '🔧' }, // CTO - tools
  role_icon_3: { type: 'string' as const, default: '📊' }, // Marketing - chart
  role_icon_4: { type: 'string' as const, default: '🎡' }, // Sales - target
  role_icon_5: { type: 'string' as const, default: '⚙️' }, // Operations - gear
  role_icon_6: { type: 'string' as const, default: '📈' }  // Data Analyst - trending up
};

// Helper function to add a new scenario
const addScenario = (roles: string, scenarios: string): { newRoles: string; newScenarios: string } => {
  const roleList = roles.split('|').map(r => r.trim()).filter(r => r);
  const scenarioList = scenarios.split('|').map(s => s.trim()).filter(s => s);

  // Add new scenario with default content
  roleList.push('New Role');
  scenarioList.push('Describe how this role benefits from your solution');

  return {
    newRoles: roleList.join('|'),
    newScenarios: scenarioList.join('|')
  };
};

// Helper function to remove a scenario
const removeScenario = (roles: string, scenarios: string, indexToRemove: number): { newRoles: string; newScenarios: string } => {
  const roleList = roles.split('|').map(r => r.trim()).filter(r => r);
  const scenarioList = scenarios.split('|').map(s => s.trim()).filter(s => s);

  // Remove the scenario at the specified index
  if (indexToRemove >= 0 && indexToRemove < roleList.length) {
    roleList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < scenarioList.length) {
    scenarioList.splice(indexToRemove, 1);
  }

  return {
    newRoles: roleList.join('|'),
    newScenarios: scenarioList.join('|')
  };
};

export default function RoleBasedScenarios(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<RoleBasedScenariosContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const roles = blockContent.roles.split('|').map(r => r.trim()).filter(Boolean);
  const scenarios = blockContent.scenarios.split('|').map(s => s.trim()).filter(Boolean);

  // Theme detection with priority: manual > auto > neutral
  const uiTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Get theme-specific colors
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        gradientFrom: 'from-orange-500',
        gradientTo: 'to-orange-600',
        focusRing: 'focus:ring-orange-500',
        cardBorder: 'border-orange-200',
        addBg: 'bg-orange-50',
        addHoverBg: 'hover:bg-orange-100',
        addBorder: 'border-orange-200',
        addHoverBorder: 'hover:border-orange-300',
        addIcon: 'text-orange-600',
        addText: 'text-orange-700'
      },
      cool: {
        gradientFrom: 'from-blue-500',
        gradientTo: 'to-indigo-600',
        focusRing: 'focus:ring-blue-500',
        cardBorder: 'border-gray-200',
        addBg: 'bg-blue-50',
        addHoverBg: 'hover:bg-blue-100',
        addBorder: 'border-blue-200',
        addHoverBorder: 'hover:border-blue-300',
        addIcon: 'text-blue-600',
        addText: 'text-blue-700'
      },
      neutral: {
        gradientFrom: 'from-gray-500',
        gradientTo: 'to-gray-600',
        focusRing: 'focus:ring-gray-500',
        cardBorder: 'border-gray-200',
        addBg: 'bg-gray-50',
        addHoverBg: 'hover:bg-gray-100',
        addBorder: 'border-gray-200',
        addHoverBorder: 'hover:border-gray-300',
        addIcon: 'text-gray-600',
        addText: 'text-gray-700'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Handle individual role editing
  const handleRoleEdit = (index: number, value: string) => {
    const roleList = blockContent.roles.split('|');
    roleList[index] = value;
    handleContentUpdate('roles', roleList.join('|'));
  };

  // Handle individual scenario editing
  const handleScenarioEdit = (index: number, value: string) => {
    const scenarioList = blockContent.scenarios.split('|');
    scenarioList[index] = value;
    handleContentUpdate('scenarios', scenarioList.join('|'));
  };

  // Handle adding a new scenario
  const handleAddScenario = () => {
    const { newRoles, newScenarios } = addScenario(blockContent.roles, blockContent.scenarios);
    handleContentUpdate('roles', newRoles);
    handleContentUpdate('scenarios', newScenarios);
  };

  // Handle removing a scenario
  const handleRemoveScenario = (indexToRemove: number) => {
    const { newRoles, newScenarios } = removeScenario(blockContent.roles, blockContent.scenarios, indexToRemove);
    handleContentUpdate('roles', newRoles);
    handleContentUpdate('scenarios', newScenarios);

    // Also clear the corresponding icon if it exists
    const iconField = `role_icon_${indexToRemove + 1}` as keyof RoleBasedScenariosContent;
    if (blockContent[iconField]) {
      handleContentUpdate(iconField, '');
    }
  };

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
            <div key={index} className={`group/scenario-card-${index} relative bg-white p-8 rounded-xl border ${themeColors.cardBorder} flex items-center space-x-8`}>
              <div className={`w-20 h-20 bg-gradient-to-br ${themeColors.gradientFrom} ${themeColors.gradientTo} rounded-full flex flex-col items-center justify-center text-white flex-shrink-0`}>
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
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleRoleEdit(index, e.currentTarget.textContent || '')}
                    className={`outline-none focus:ring-2 ${themeColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-gray-50 font-bold text-gray-900 mb-3`}
                  >
                    {role}
                  </div>
                ) : (
                  <h3 className="font-bold text-gray-900 mb-3">{role}</h3>
                )}
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleScenarioEdit(index, e.currentTarget.textContent || '')}
                    className={`outline-none focus:ring-2 ${themeColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 text-gray-600`}
                  >
                    {scenarios[index] || 'Role-specific scenario'}
                  </div>
                ) : (
                  <p className="text-gray-600">{scenarios[index] || 'Role-specific scenario'}</p>
                )}
              </div>
              {/* Delete button - only show in edit mode and if more than minimum cards */}
              {mode !== 'preview' && roles.length > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveScenario(index);
                  }}
                  className={`absolute top-4 right-4 opacity-0 group-hover/scenario-card-${index}:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200`}
                  title="Remove this scenario"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Scenario Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && roles.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddScenario}
              className={`flex items-center space-x-2 mx-auto px-4 py-3 ${themeColors.addBg} ${themeColors.addHoverBg} border-2 ${themeColors.addBorder} ${themeColors.addHoverBorder} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${themeColors.addIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${themeColors.addText} font-medium`}>Add Scenario</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'RoleBasedScenarios', category: 'Use Case', description: 'Role-based scenarios and use cases', defaultBackgroundType: 'secondary' as const };