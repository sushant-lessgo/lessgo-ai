import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface PersonaResultPanelsProps extends LayoutComponentProps {}

// Persona result panel structure
interface PersonaPanel {
  persona: string;
  role: string;
  result_metric: string;
  result_description: string;
  key_benefits: string;
  id: string;
}

// Content interface for PersonaResultPanels layout
interface PersonaResultPanelsContent {
  headline: string;
  personas: string;
  roles: string;
  result_metrics: string;
  result_descriptions: string;
  key_benefits: string;
  subheadline?: string;
  footer_text?: string;
  persona_icon_1?: string;
  persona_icon_2?: string;
  persona_icon_3?: string;
  persona_icon_4?: string;
  persona_icon_5?: string;
  persona_icon_6?: string;
}

// Content schema for PersonaResultPanels layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Results That Matter to Every Role' },
  personas: { type: 'string' as const, default: 'Marketing Teams|Sales Leaders|Operations Managers|Engineering Teams' },
  roles: { type: 'string' as const, default: 'Growth Focused|Revenue Driven|Efficiency Minded|Innovation Focused' },
  result_metrics: { type: 'string' as const, default: '3x Lead Generation|40% Sales Increase|60% Cost Reduction|50% Faster Delivery' },
  result_descriptions: { type: 'string' as const, default: 'Generate qualified leads at scale with automated campaigns|Close more deals with intelligent sales automation|Streamline operations and eliminate wasteful processes|Ship features faster with automated workflows' },
  key_benefits: { type: 'string' as const, default: 'Better targeting,Higher conversion,Real-time analytics|Shorter sales cycles,Better forecasting,Automated follow-ups|Process optimization,Resource savings,Team productivity|Faster deployment,Better quality,Reduced errors' },
  subheadline: { type: 'string' as const, default: 'See how different teams achieve breakthrough results with our solution' },
  footer_text: { type: 'string' as const, default: 'Tailored results for every team in your organization' },
  persona_icon_1: { type: 'string' as const, default: '📢' },
  persona_icon_2: { type: 'string' as const, default: '📈' },
  persona_icon_3: { type: 'string' as const, default: '⚙️' },
  persona_icon_4: { type: 'string' as const, default: '⚡' },
  persona_icon_5: { type: 'string' as const, default: '👥' },
  persona_icon_6: { type: 'string' as const, default: '👤' }
};

// Parse persona panel data from pipe-separated strings
const parsePersonaData = (
  personas: string, 
  roles: string, 
  metrics: string, 
  descriptions: string,
  benefits: string
): PersonaPanel[] => {
  const personaList = personas.split('|').map(p => p.trim()).filter(p => p);
  const roleList = roles.split('|').map(r => r.trim()).filter(r => r);
  const metricList = metrics.split('|').map(m => m.trim()).filter(m => m);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  const benefitList = benefits.split('|').map(b => b.trim()).filter(b => b);
  
  return personaList.map((persona, index) => ({
    id: `persona-${index}`,
    persona,
    role: roleList[index] || 'Team Member',
    result_metric: metricList[index] || '100% Better',
    result_description: descriptionList[index] || 'Amazing results for your team',
    key_benefits: benefitList[index] || 'Great benefits'
  }));
};

// Helper function to add a new persona
const addPersona = (
  personas: string,
  roles: string,
  metrics: string,
  descriptions: string,
  benefits: string
): { newPersonas: string; newRoles: string; newMetrics: string; newDescriptions: string; newBenefits: string } => {
  const personaList = personas.split('|').map(p => p.trim()).filter(p => p);
  const roleList = roles.split('|').map(r => r.trim()).filter(r => r);
  const metricList = metrics.split('|').map(m => m.trim()).filter(m => m);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  const benefitList = benefits.split('|').map(b => b.trim()).filter(b => b);

  // Add new persona with default content
  personaList.push('New Team');
  roleList.push('Result Focused');
  metricList.push('100% Better Results');
  descriptionList.push('Achieve amazing outcomes with our solution tailored for your team.');
  benefitList.push('Better efficiency,Faster results,Higher satisfaction');

  return {
    newPersonas: personaList.join('|'),
    newRoles: roleList.join('|'),
    newMetrics: metricList.join('|'),
    newDescriptions: descriptionList.join('|'),
    newBenefits: benefitList.join('|')
  };
};

// Helper function to remove a persona
const removePersona = (
  personas: string,
  roles: string,
  metrics: string,
  descriptions: string,
  benefits: string,
  indexToRemove: number
): { newPersonas: string; newRoles: string; newMetrics: string; newDescriptions: string; newBenefits: string } => {
  const personaList = personas.split('|').map(p => p.trim()).filter(p => p);
  const roleList = roles.split('|').map(r => r.trim()).filter(r => r);
  const metricList = metrics.split('|').map(m => m.trim()).filter(m => m);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  const benefitList = benefits.split('|').map(b => b.trim()).filter(b => b);

  // Remove the persona at the specified index
  if (indexToRemove >= 0 && indexToRemove < personaList.length) {
    personaList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < roleList.length) {
    roleList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < metricList.length) {
    metricList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < benefitList.length) {
    benefitList.splice(indexToRemove, 1);
  }

  return {
    newPersonas: personaList.join('|'),
    newRoles: roleList.join('|'),
    newMetrics: metricList.join('|'),
    newDescriptions: descriptionList.join('|'),
    newBenefits: benefitList.join('|')
  };
};

// Get persona color scheme
const getPersonaColor = (index: number): { bg: string; accent: string; border: string; icon: string } => {
  const colors = [
    { bg: 'bg-blue-50', accent: 'bg-blue-500', border: 'border-blue-200', icon: 'text-blue-600' },
    { bg: 'bg-emerald-50', accent: 'bg-emerald-500', border: 'border-emerald-200', icon: 'text-emerald-600' },
    { bg: 'bg-purple-50', accent: 'bg-purple-500', border: 'border-purple-200', icon: 'text-purple-600' },
    { bg: 'bg-orange-50', accent: 'bg-orange-500', border: 'border-orange-200', icon: 'text-orange-600' },
    { bg: 'bg-pink-50', accent: 'bg-pink-500', border: 'border-pink-200', icon: 'text-pink-600' },
    { bg: 'bg-indigo-50', accent: 'bg-indigo-500', border: 'border-indigo-200', icon: 'text-indigo-600' }
  ];
  return colors[index % colors.length];
};

// Get persona icon based on persona type
const getPersonaIcon = (persona: string | undefined) => {
  // Defensive check: ensure persona is a valid string
  if (!persona || typeof persona !== 'string') {
    // Return a default user icon as fallback
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  
  const lower = persona.toLowerCase();
  
  if (lower.includes('marketing')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    );
  } else if (lower.includes('sales')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    );
  } else if (lower.includes('operations') || lower.includes('ops')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  } else if (lower.includes('engineering') || lower.includes('development') || lower.includes('tech')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  } else if (lower.includes('leadership') || lower.includes('executive') || lower.includes('manager')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }
  
  // Default icon
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
};

// Individual Persona Panel Component
const PersonaPanel = ({
  panel,
  index,
  mode,
  sectionId,
  iconValue,
  onPersonaEdit,
  onRoleEdit,
  onMetricEdit,
  onDescriptionEdit,
  onBenefitsEdit,
  onPersonaIconEdit,
  onRemovePersona,
  canRemove = true
}: {
  panel: PersonaPanel;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  iconValue: string;
  onPersonaEdit: (index: number, value: string) => void;
  onRoleEdit: (index: number, value: string) => void;
  onMetricEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onBenefitsEdit: (index: number, value: string) => void;
  onPersonaIconEdit: (index: number, value: string) => void;
  onRemovePersona?: (index: number) => void;
  canRemove?: boolean;
}) => {
  const { getTextStyle } = useTypography();
  const colors = getPersonaColor(index);
  const benefits = panel.key_benefits.split(',').map(b => b.trim()).filter(b => b);

  return (
    <div className={`group/persona-card-${index} relative p-8 ${colors.bg} rounded-2xl border ${colors.border} hover:shadow-xl transition-all duration-300`}>
      
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        {/* Icon */}
        <div className={`w-16 h-16 ${colors.accent} rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
          <IconEditableText
            mode={mode}
            value={iconValue}
            onEdit={(value) => onPersonaIconEdit(index, value)}
            backgroundType="neutral"
            colorTokens={{}}
            iconSize="lg"
            className="text-white text-2xl"
            sectionId={sectionId}
            elementKey={`persona_icon_${index + 1}`}
          />
        </div>
        
        {/* Persona Info */}
        <div>
          {mode !== 'preview' ? (
            <>
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onPersonaEdit(index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-gray-50 font-bold text-gray-900"
              >
                {panel.persona}
              </div>
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onRoleEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 text-sm font-medium ${colors.icon}`}
              >
                {panel.role}
              </div>
            </>
          ) : (
            <>
              <h3 
                className="font-bold text-gray-900"
              >
                {panel.persona}
              </h3>
              <p 
                className={`text-sm font-medium ${colors.icon}`}
              >
                {panel.role}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Result Metric */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-4 py-2 ${colors.accent} rounded-lg text-white font-bold text-lg`}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onMetricEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text"
            >
              {panel.result_metric}
            </div>
          ) : (
            <span>{panel.result_metric}</span>
          )}
        </div>
      </div>

      {/* Result Description */}
      <div className="mb-6">
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 text-gray-700 leading-relaxed"
          >
            {panel.result_description}
          </div>
        ) : (
          <p 
            className="text-gray-700 leading-relaxed"
          >
            {panel.result_description}
          </p>
        )}
      </div>

      {/* Key Benefits */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3 text-sm">Key Benefits:</h4>
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onBenefitsEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[40px] cursor-text hover:bg-gray-50"
          >
            {panel.key_benefits}
          </div>
        ) : (
          <ul className="space-y-2">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <svg className={`w-4 h-4 ${colors.icon} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span 
                  className="text-gray-600"
                >
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemovePersona && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemovePersona(index);
          }}
          className={`absolute top-4 right-4 opacity-0 group-hover/persona-card-${index}:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200`}
          title="Remove this persona"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default function PersonaResultPanels(props: PersonaResultPanelsProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<PersonaResultPanelsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse persona panel data
  const panels = parsePersonaData(
    blockContent.personas,
    blockContent.roles,
    blockContent.result_metrics,
    blockContent.result_descriptions,
    blockContent.key_benefits
  );

  // Handle individual editing
  const handlePersonaEdit = (index: number, value: string) => {
    const personaList = blockContent.personas.split('|');
    personaList[index] = value;
    handleContentUpdate('personas', personaList.join('|'));
  };

  const handlePersonaIconEdit = (index: number, value: string) => {
    const iconField = `persona_icon_${index + 1}` as keyof PersonaResultPanelsContent;
    handleContentUpdate(iconField, value);
  };

  // Get persona icon from content or default
  const getPersonaIcon = (index: number): string => {
    const iconFields = ['persona_icon_1', 'persona_icon_2', 'persona_icon_3', 'persona_icon_4', 'persona_icon_5', 'persona_icon_6'];
    const iconField = iconFields[index] as keyof PersonaResultPanelsContent;
    return blockContent[iconField] || ['📢', '📈', '⚙️', '⚡', '👥', '👤'][index] || '👤';
  };

  const handleRoleEdit = (index: number, value: string) => {
    const roleList = blockContent.roles.split('|');
    roleList[index] = value;
    handleContentUpdate('roles', roleList.join('|'));
  };

  const handleMetricEdit = (index: number, value: string) => {
    const metricList = blockContent.result_metrics.split('|');
    metricList[index] = value;
    handleContentUpdate('result_metrics', metricList.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptionList = blockContent.result_descriptions.split('|');
    descriptionList[index] = value;
    handleContentUpdate('result_descriptions', descriptionList.join('|'));
  };

  const handleBenefitsEdit = (index: number, value: string) => {
    const benefitsList = blockContent.key_benefits.split('|');
    benefitsList[index] = value;
    handleContentUpdate('key_benefits', benefitsList.join('|'));
  };

  // Handle adding a new persona
  const handleAddPersona = () => {
    const { newPersonas, newRoles, newMetrics, newDescriptions, newBenefits } = addPersona(
      blockContent.personas,
      blockContent.roles,
      blockContent.result_metrics,
      blockContent.result_descriptions,
      blockContent.key_benefits
    );
    handleContentUpdate('personas', newPersonas);
    handleContentUpdate('roles', newRoles);
    handleContentUpdate('result_metrics', newMetrics);
    handleContentUpdate('result_descriptions', newDescriptions);
    handleContentUpdate('key_benefits', newBenefits);
  };

  // Handle removing a persona
  const handleRemovePersona = (indexToRemove: number) => {
    const { newPersonas, newRoles, newMetrics, newDescriptions, newBenefits } = removePersona(
      blockContent.personas,
      blockContent.roles,
      blockContent.result_metrics,
      blockContent.result_descriptions,
      blockContent.key_benefits,
      indexToRemove
    );
    handleContentUpdate('personas', newPersonas);
    handleContentUpdate('roles', newRoles);
    handleContentUpdate('result_metrics', newMetrics);
    handleContentUpdate('result_descriptions', newDescriptions);
    handleContentUpdate('key_benefits', newBenefits);

    // Also clear the corresponding icon if it exists
    const iconField = `persona_icon_${indexToRemove + 1}` as keyof PersonaResultPanelsContent;
    if (blockContent[iconField]) {
      handleContentUpdate(iconField, '');
    }
  };

  return (
    <section 
      className={`py-16 px-4`}
      style={{ backgroundColor: sectionBackground }}
      data-section-id={sectionId}
      data-section-type="PersonaResultPanels"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
              colorTokens={colorTokens}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline describing role-specific results..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Persona Panels Grid */}
        <div className={`grid gap-8 ${
          panels.length === 2 ? 'md:grid-cols-2 max-w-5xl mx-auto' :
          panels.length === 3 ? 'md:grid-cols-1 lg:grid-cols-3' :
          panels.length === 4 ? 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {panels.map((panel, index) => (
            <PersonaPanel
              key={panel.id}
              panel={panel}
              index={index}
              mode={mode}
              sectionId={sectionId}
              iconValue={getPersonaIcon(index)}
              onPersonaEdit={handlePersonaEdit}
              onRoleEdit={handleRoleEdit}
              onMetricEdit={handleMetricEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onBenefitsEdit={handleBenefitsEdit}
              onPersonaIconEdit={handlePersonaIconEdit}
              onRemovePersona={handleRemovePersona}
              canRemove={panels.length > 1}
            />
          ))}
        </div>

        {/* Add Persona Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && panels.length < 6 && (
          <div className="mt-12 text-center">
            <button
              onClick={handleAddPersona}
              className="flex items-center space-x-2 mx-auto px-6 py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Persona</span>
            </button>
          </div>
        )}

        {/* Universal Success Footer */}
        {(blockContent.footer_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-full text-gray-800">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.footer_text || ''}
                onEdit={(value) => handleContentUpdate('footer_text', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="font-medium"
                placeholder="Add footer message about team results..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="footer_text"
              />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export const componentMeta = {
  name: 'PersonaResultPanels',
  category: 'Results',
  description: 'Results segmented by persona/role with targeted metrics and benefits',
  tags: ['personas', 'roles', 'segmented-results', 'targeted', 'benefits'],
  features: [
    'Role-specific result presentations',
    'Color-coded persona panels',
    'Contextual icons for different roles',
    'Individual metrics and benefit lists',
    'Flexible grid layout for multiple personas',
    'Comprehensive editing for all persona elements'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    personas: 'Pipe-separated list of persona/team names',
    roles: 'Pipe-separated list of role descriptions',
    result_metrics: 'Pipe-separated list of key metrics for each persona',
    result_descriptions: 'Pipe-separated list of result descriptions',
    key_benefits: 'Pipe-separated list of comma-separated benefits for each persona',
    subheadline: 'Optional subheading for context'
  },
  examples: [
    'Multi-department software benefits',
    'Role-specific service outcomes',
    'Targeted enterprise solutions',
    'Team-based transformation results'
  ]
};