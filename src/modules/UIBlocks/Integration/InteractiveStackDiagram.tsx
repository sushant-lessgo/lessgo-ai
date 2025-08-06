// Integration/InteractiveStackDiagram.tsx - Technical stack visualization for developers
// Production-ready integration component using abstraction system with background-aware text colors

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface InteractiveStackDiagramContent {
  headline: string;
  subheadline?: string;
  layer_1_title: string;
  layer_1_description: string;
  layer_1_technologies: string;
  layer_2_title: string;
  layer_2_description: string;
  layer_2_technologies: string;
  layer_3_title: string;
  layer_3_description: string;
  layer_3_technologies: string;
  layer_4_title: string;
  layer_4_description: string;
  layer_4_technologies: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Built for Enterprise-Grade Integration' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Our comprehensive technology stack ensures seamless connectivity across your entire development ecosystem.' 
  },
  layer_1_title: { 
    type: 'string' as const, 
    default: 'Frontend & UI' 
  },
  layer_1_description: { 
    type: 'string' as const, 
    default: 'Modern JavaScript frameworks and component libraries for rapid development' 
  },
  layer_1_technologies: { 
    type: 'string' as const, 
    default: 'React|Vue.js|Angular|Svelte|Next.js|Nuxt.js|TypeScript|Tailwind CSS' 
  },
  layer_2_title: { 
    type: 'string' as const, 
    default: 'APIs & Backend' 
  },
  layer_2_description: { 
    type: 'string' as const, 
    default: 'RESTful and GraphQL APIs with robust authentication and real-time capabilities' 
  },
  layer_2_technologies: { 
    type: 'string' as const, 
    default: 'Node.js|Python|Go|Ruby|REST API|GraphQL|WebSockets|JWT|OAuth 2.0' 
  },
  layer_3_title: { 
    type: 'string' as const, 
    default: 'Database & Storage' 
  },
  layer_3_description: { 
    type: 'string' as const, 
    default: 'Scalable data storage solutions with caching and real-time synchronization' 
  },
  layer_3_technologies: { 
    type: 'string' as const, 
    default: 'PostgreSQL|MongoDB|Redis|Elasticsearch|AWS S3|Google Cloud Storage|CDN' 
  },
  layer_4_title: { 
    type: 'string' as const, 
    default: 'Infrastructure & DevOps' 
  },
  layer_4_description: { 
    type: 'string' as const, 
    default: 'Cloud-native deployment with monitoring, security, and automated scaling' 
  },
  layer_4_technologies: { 
    type: 'string' as const, 
    default: 'Docker|Kubernetes|AWS|Google Cloud|Azure|GitHub Actions|Terraform|Monitoring' 
  }
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
    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-300 ${
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
  activeTech 
}: { 
  layer: any; 
  index: number; 
  isActive: boolean; 
  onHover: () => void;
  onTechClick: (tech: string) => void;
  colorTokens: any;
  textStyle: React.CSSProperties;
  activeTech: string | null;
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
          <h3 className="text-lg font-bold">{layer.title}</h3>
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold">{index + 1}</span>
          </div>
        </div>
        <p className="text-sm opacity-90 mb-4">{layer.description}</p>
        
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

export default function InteractiveStackDiagram(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
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

  // Parse technology lists
  const layers = [
    {
      title: blockContent.layer_1_title,
      description: blockContent.layer_1_description,
      technologies: blockContent.layer_1_technologies ? blockContent.layer_1_technologies.split('|') : []
    },
    {
      title: blockContent.layer_2_title,
      description: blockContent.layer_2_description,
      technologies: blockContent.layer_2_technologies ? blockContent.layer_2_technologies.split('|') : []
    },
    {
      title: blockContent.layer_3_title,
      description: blockContent.layer_3_description,
      technologies: blockContent.layer_3_technologies ? blockContent.layer_3_technologies.split('|') : []
    },
    {
      title: blockContent.layer_4_title,
      description: blockContent.layer_4_description,
      technologies: blockContent.layer_4_technologies ? blockContent.layer_4_technologies.split('|') : []
    }
  ];

  const handleTechClick = (tech: string) => {
    setActiveTech(activeTech === tech ? null : tech);
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
              className="text-lg leading-relaxed max-w-3xl mx-auto"
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
              <StackLayer
                key={index}
                layer={layer}
                index={index}
                isActive={activeLayer === index}
                onHover={() => setActiveLayer(index)}
                onTechClick={handleTechClick}
                colorTokens={colorTokens}
                textStyle={{}}
                activeTech={activeTech}
              />
            ))}
          </div>

          {/* Active Technology Info */}
          {activeTech && (
            <div className={`mt-8 p-6 rounded-xl ${colorTokens.bgSecondary} border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-semibold ${colorTokens.textPrimary} ${getTextStyle('body-lg')}`}>
                    {activeTech}
                  </h4>
                  <p className={`${dynamicTextColors?.muted || colorTokens.textMuted} text-sm mt-1`}>
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
          <p className={`${dynamicTextColors?.muted || colorTokens.textMuted} text-sm`}>
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