// Integration/InteractiveStackDiagram.tsx - Technical stack visualization for developers
// Production-ready integration component using abstraction system with background-aware text colors

import React, { useState, useEffect } from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import {
  LayoutComponentProps,
  extractLayoutContent,
  StoreElementTypes
} from '@/types/storeTypes';

interface InteractiveStackDiagramProps extends LayoutComponentProps {}

// Layer item structure
interface LayerItem {
  title: string;
  description: string;
  technologies: string;
  id: string;
}

// Content interface for InteractiveStackDiagram layout
interface InteractiveStackDiagramContent {
  headline: string;
  subheadline?: string;
  layer_titles: string;
  layer_descriptions: string;
  layer_technologies: string;
}

// Content schema for InteractiveStackDiagram layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Built for Enterprise-Grade Integration' },
  subheadline: { type: 'string' as const, default: 'Our comprehensive technology stack ensures seamless connectivity across your entire development ecosystem.' },
  layer_titles: { type: 'string' as const, default: 'Frontend & UI|APIs & Backend|Database & Storage|Infrastructure & DevOps' },
  layer_descriptions: { type: 'string' as const, default: 'Modern JavaScript frameworks and component libraries for rapid development|RESTful and GraphQL APIs with robust authentication and real-time capabilities|Scalable data storage solutions with caching and real-time synchronization|Cloud-native deployment with monitoring, security, and automated scaling' },
  layer_technologies: { type: 'string' as const, default: 'React|Vue.js|Angular|Svelte|Next.js|Nuxt.js|TypeScript|Tailwind CSS!Node.js|Python|Go|Ruby|REST API|GraphQL|WebSockets|JWT|OAuth 2.0!PostgreSQL|MongoDB|Redis|Elasticsearch|AWS S3|Google Cloud Storage|CDN!Docker|Kubernetes|AWS|Google Cloud|Azure|GitHub Actions|Terraform|Monitoring' }
};

// Technology Badge Component
const TechBadge = React.memo(({ name, isActive, onClick, colorTokens }: { 
  name: string; 
  isActive: boolean; 
  onClick: () => void;
  colorTokens: any;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg border transition-all duration-300 ${
      isActive 
        ? `${colorTokens.ctaBg} ${colorTokens.ctaBgText} border-current shadow-md scale-105` 
        : `${colorTokens.bgSecondary} ${colorTokens.textSecondary} border-gray-200 hover:${colorTokens.bgSecondary} hover:scale-102`
    }`}
  >
    {name}
  </button>
));
TechBadge.displayName = 'TechBadge';

// Stack Layer Component
const StackLayer = React.memo(({ 
  layer, 
  index, 
  isActive, 
  onHover, 
  onTechClick, 
  colorTokens, 
  textStyle,
  activeTech,
  h3Style,
  labelStyle,
  bodySmStyle
}: { 
  layer: any; 
  index: number; 
  isActive: boolean; 
  onHover: () => void;
  onTechClick: (tech: string) => void;
  colorTokens: any;
  textStyle: React.CSSProperties;
  activeTech: string | null;
  h3Style: React.CSSProperties;
  labelStyle: React.CSSProperties;
  bodySmStyle: React.CSSProperties;
}) => {
  const layerColors = [
    'bg-gradient-to-r from-blue-500 to-blue-600',
    'bg-gradient-to-r from-green-500 to-green-600', 
    'bg-gradient-to-r from-purple-500 to-purple-600',
    'bg-gradient-to-r from-orange-500 to-orange-600'
  ];

  return (
    <div 
      className={`relative transition-all duration-500 transform ${
        isActive ? 'scale-105 z-10' : 'hover:scale-102'
      }`}
      onMouseEnter={onHover}
    >
      {/* Main Layer */}
      <div className={`${layerColors[index]} rounded-xl p-6 text-white shadow-lg ${
        isActive ? 'shadow-2xl' : ''
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={h3Style}>{layer.title}</h3>
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <span style={labelStyle}>{index + 1}</span>
          </div>
        </div>
        <p className="opacity-90 mb-4" style={bodySmStyle}>{layer.description}</p>
        
        {/* Technology Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {layer.technologies.map((tech: string, techIndex: number) => (
            <TechBadge
              key={techIndex}
              name={tech.trim()}
              isActive={activeTech === tech.trim()}
              onClick={() => onTechClick(tech.trim())}
              colorTokens={{
                ...colorTokens,
                accent: 'bg-white text-gray-900',
                accentText: '',
                bgSecondary: 'bg-white bg-opacity-10',
                textBody: 'text-white',
                borderPrimary: 'border-white border-opacity-20',
                bgTertiary: 'bg-white bg-opacity-20'
              }}
            />
          ))}
        </div>
      </div>

      {/* Connection Lines */}
      {index < 3 && (
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2 w-0.5 h-4 bg-gray-300"></div>
      )}
    </div>
  );
});
StackLayer.displayName = 'StackLayer';

// Parse layer data with dynamic structure
const parseLayerData = (titles: string, descriptions: string, technologies: string): LayerItem[] => {
  const titleList = titles.split('|');
  const descriptionList = descriptions.split('|');
  const technologyList = technologies.split('!'); // Using ! as separator between layers

  return titleList.map((title, index) => ({
    id: `layer-${index}`,
    title: title.trim(),
    description: descriptionList[index] || '',
    technologies: technologyList[index] || ''
  }));
};

export default function InteractiveStackDiagram(props: InteractiveStackDiagramProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  const store = useEditStore();
  const onboardingStore = useOnboardingStore();

  // Extract content using the extractLayoutContent helper
  const sectionContent = store.content[props.sectionId];
  const elements = sectionContent?.elements || {};
  const blockContent = extractLayoutContent<InteractiveStackDiagramContent>(
    elements,
    CONTENT_SCHEMA
  );

  const {
    sectionId,
    mode,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<InteractiveStackDiagramContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [activeTech, setActiveTech] = useState<string | null>(null);

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodySmStyle = getTypographyStyle('body-sm');
  const labelStyle = getTypographyStyle('label');

  // Parse layer data
  const layers = parseLayerData(
    blockContent.layer_titles,
    blockContent.layer_descriptions,
    blockContent.layer_technologies
  );

  const handleTechClick = (tech: string) => {
    setActiveTech(activeTech === tech ? null : tech);
  };

  // Add new layer
  const handleAddLayer = () => {
    const newLayerTitle = prompt('Enter layer title:');
    if (newLayerTitle && newLayerTitle.trim()) {
      const currentTitles = blockContent.layer_titles.split('|');
      const currentDescriptions = blockContent.layer_descriptions.split('|');
      const currentTechnologies = blockContent.layer_technologies.split('!');

      const updatedTitles = [...currentTitles, newLayerTitle.trim()].join('|');
      const updatedDescriptions = [...currentDescriptions, 'New layer description'].join('|');
      const updatedTechnologies = [...currentTechnologies, 'Technology 1|Technology 2|Technology 3'].join('!');

      handleContentUpdate('layer_titles', updatedTitles);
      handleContentUpdate('layer_descriptions', updatedDescriptions);
      handleContentUpdate('layer_technologies', updatedTechnologies);
    }
  };

  // Remove layer
  const handleRemoveLayer = (layerIndex: number) => {
    if (layers.length <= 1) {
      alert('Cannot remove the last layer');
      return;
    }

    if (confirm(`Remove "${layers[layerIndex].title}" layer?`)) {
      const currentTitles = blockContent.layer_titles.split('|');
      const currentDescriptions = blockContent.layer_descriptions.split('|');
      const currentTechnologies = blockContent.layer_technologies.split('!');

      currentTitles.splice(layerIndex, 1);
      currentDescriptions.splice(layerIndex, 1);
      currentTechnologies.splice(layerIndex, 1);

      handleContentUpdate('layer_titles', currentTitles.join('|'));
      handleContentUpdate('layer_descriptions', currentDescriptions.join('|'));
      handleContentUpdate('layer_technologies', currentTechnologies.join('!'));

      // Reset active layer if needed
      if (activeLayer === layerIndex) {
        setActiveLayer(null);
      }
    }
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="InteractiveStackDiagram"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="leading-relaxed max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add a description of your technical architecture..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Interactive Stack Diagram */}
        <div className="relative">
          <div className="space-y-6">
            {layers.map((layer, index) => (
              <div key={layer.id} className="relative">
                <StackLayer
                  layer={{
                    ...layer,
                    technologies: layer.technologies.split('|')
                  }}
                  index={index}
                  isActive={activeLayer === index}
                  onHover={() => setActiveLayer(index)}
                  onTechClick={handleTechClick}
                  colorTokens={colorTokens}
                  textStyle={{}}
                  activeTech={activeTech}
                  h3Style={h3Style}
                  labelStyle={labelStyle}
                  bodySmStyle={bodySmStyle}
                />
                {mode !== 'preview' && (
                  <button
                    onClick={() => handleRemoveLayer(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors z-10"
                    title="Remove layer"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Add Layer Button (Edit Mode Only) */}
            {mode !== 'preview' && (
              <div className="p-6 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300 flex flex-col items-center justify-center min-h-[120px]">
                <button
                  onClick={handleAddLayer}
                  className="flex flex-col items-center space-y-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Add Layer</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Technology Info */}
          {activeTech && (
            <div className={`mt-8 p-6 rounded-xl ${colorTokens.bgSecondary} border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`${colorTokens.textPrimary}`} style={h4Style}>
                    {activeTech}
                  </h4>
                  <p className={`${dynamicTextColors?.muted || colorTokens.textMuted} mt-1`} style={bodySmStyle}>
                    Click any technology to learn more about integration possibilities
                  </p>
                </div>
                <button
                  onClick={() => setActiveTech(null)}
                  className={`p-2 rounded-lg ${colorTokens.bgSecondary} ${colorTokens.textPrimary} hover:opacity-80 transition-colors`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className={`${dynamicTextColors?.muted || colorTokens.textMuted}`} style={bodySmStyle}>
            Need a custom integration? <span className={`${colorTokens.ctaBg} hover:underline cursor-pointer`}>Contact our technical team</span>
          </p>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'InteractiveStackDiagram',
  category: 'Integration Sections',
  description: 'Technical stack visualization showing integration layers with interactive technology selection',
  tags: ['integration', 'technical', 'stack', 'developers', 'interactive'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'complex',
  estimatedBuildTime: '35 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'layer_1_title', label: 'Layer 1 Title', type: 'text', required: true },
    { key: 'layer_1_description', label: 'Layer 1 Description', type: 'textarea', required: true },
    { key: 'layer_1_technologies', label: 'Layer 1 Technologies (pipe separated)', type: 'text', required: true },
    { key: 'layer_2_title', label: 'Layer 2 Title', type: 'text', required: true },
    { key: 'layer_2_description', label: 'Layer 2 Description', type: 'textarea', required: true },
    { key: 'layer_2_technologies', label: 'Layer 2 Technologies (pipe separated)', type: 'text', required: true },
    { key: 'layer_3_title', label: 'Layer 3 Title', type: 'text', required: true },
    { key: 'layer_3_description', label: 'Layer 3 Description', type: 'textarea', required: true },
    { key: 'layer_3_technologies', label: 'Layer 3 Technologies (pipe separated)', type: 'text', required: true },
    { key: 'layer_4_title', label: 'Layer 4 Title', type: 'text', required: true },
    { key: 'layer_4_description', label: 'Layer 4 Description', type: 'textarea', required: true },
    { key: 'layer_4_technologies', label: 'Layer 4 Technologies (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Interactive technology stack visualization',
    'Clickable technology badges for detailed info',
    'Layered architecture representation',
    'Hover effects and smooth animations',
    'Technical audience focused design'
  ],
  
  useCases: [
    'Showcase technical capabilities to developers',
    'Demonstrate enterprise-grade architecture',
    'Highlight comprehensive technology support',
    'Build credibility with technical audiences'
  ]
};