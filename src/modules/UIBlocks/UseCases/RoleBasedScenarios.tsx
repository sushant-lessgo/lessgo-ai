// components/layout/RoleBasedScenarios.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';

interface Scenario {
  id: string;
  role: string;
  scenario: string;
}

interface RoleBasedScenariosContent {
  headline: string;
  subheadline?: string;
  footer_text?: string;
  scenarios: Scenario[];
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Perfect for Every Role' },
  subheadline: { type: 'string' as const, default: '' },
  footer_text: { type: 'string' as const, default: '' },
  scenarios: {
    type: 'array' as const,
    default: [
      { id: 'sc1', role: 'CEO', scenario: 'Get executive dashboards and strategic insights' },
      { id: 'sc2', role: 'CTO', scenario: 'Monitor system performance and technical metrics' },
      { id: 'sc3', role: 'Marketing Manager', scenario: 'Track campaign performance and lead generation' },
      { id: 'sc4', role: 'Sales Director', scenario: 'Manage pipeline and forecast revenue' }
    ]
  }
};

export default function RoleBasedScenarios(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, sectionBackground, handleContentUpdate } = useLayoutComponent<RoleBasedScenariosContent>({ ...props, contentSchema: CONTENT_SCHEMA });

  // Ensure scenarios is always an array
  const scenarios: Scenario[] = Array.isArray(blockContent.scenarios) ? blockContent.scenarios : CONTENT_SCHEMA.scenarios.default;

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

  // Get initials from role name
  const getInitials = (role: string) => {
    return role.split(' ').map(w => w[0]).join('').toUpperCase();
  };

  // Handle role editing
  const handleRoleEdit = (index: number, value: string) => {
    const updated = scenarios.map((s, i) => i === index ? { ...s, role: value } : s);
    (handleContentUpdate as any)('scenarios', updated);
  };

  // Handle scenario editing
  const handleScenarioEdit = (index: number, value: string) => {
    const updated = scenarios.map((s, i) => i === index ? { ...s, scenario: value } : s);
    (handleContentUpdate as any)('scenarios', updated);
  };

  // Handle adding a new scenario
  const handleAddScenario = () => {
    const newId = `sc${Date.now()}`;
    const newScenario: Scenario = {
      id: newId,
      role: 'New Role',
      scenario: 'Describe how this role benefits from your solution'
    };
    (handleContentUpdate as any)('scenarios', [...scenarios, newScenario]);
  };

  // Handle removing a scenario
  const handleRemoveScenario = (index: number) => {
    const updated = scenarios.filter((_, i) => i !== index);
    (handleContentUpdate as any)('scenarios', updated);
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="RoleBasedScenarios" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} colorTokens={colorTokens} className="text-center mb-4" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />

        {/* Subheadline */}
        {(blockContent.subheadline || mode !== 'preview') && (
          <EditableText mode={mode} value={blockContent.subheadline || ''} onEdit={(value) => handleContentUpdate('subheadline', value)} backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} colorTokens={colorTokens} className="text-center mb-12 max-w-3xl mx-auto" sectionId={sectionId} elementKey="subheadline" sectionBackground={sectionBackground} />
        )}

        <div className="space-y-8">
          {scenarios.map((item, index) => (
            <div key={item.id} className={`group/scenario-card relative bg-white p-8 ${cardEnhancements.borderRadius} border ${themeColors.cardBorder} flex items-center space-x-8 ${cardEnhancements.hoverLift} ${cardEnhancements.transition}`} style={{ boxShadow: shadows.card[uiTheme] }}>
              <div className={`w-20 h-20 bg-gradient-to-br ${themeColors.gradientFrom} ${themeColors.gradientTo} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                <span className="font-bold text-lg">{getInitials(item.role)}</span>
              </div>
              <div className="flex-1">
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleRoleEdit(index, e.currentTarget.textContent || '')}
                    className={`outline-none focus:ring-2 ${themeColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-gray-50 font-bold ${colorTokens.textPrimary} mb-3`}
                  >
                    {item.role}
                  </div>
                ) : (
                  <h3 className={`font-bold ${colorTokens.textPrimary} mb-3`}>{item.role}</h3>
                )}
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleScenarioEdit(index, e.currentTarget.textContent || '')}
                    className={`outline-none focus:ring-2 ${themeColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 ${colorTokens.textSecondary}`}
                  >
                    {item.scenario}
                  </div>
                ) : (
                  <p className={colorTokens.textSecondary}>{item.scenario}</p>
                )}
              </div>
              {/* Delete button - only show in edit mode and if more than minimum cards */}
              {mode !== 'preview' && scenarios.length > 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveScenario(index);
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover/scenario-card:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
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
        {mode !== 'preview' && scenarios.length < 6 && (
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

        {/* Footer Text */}
        {(blockContent.footer_text || mode !== 'preview') && (
          <EditableText mode={mode} value={blockContent.footer_text || ''} onEdit={(value) => handleContentUpdate('footer_text', value)} backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} colorTokens={colorTokens} className="text-center mt-12 max-w-3xl mx-auto" sectionId={sectionId} elementKey="footer_text" sectionBackground={sectionBackground} />
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'RoleBasedScenarios', category: 'Use Case', description: 'Role-based scenarios and use cases', defaultBackgroundType: 'secondary' as const };
