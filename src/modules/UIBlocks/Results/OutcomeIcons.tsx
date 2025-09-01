import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface OutcomeIconsProps extends LayoutComponentProps {}

// Outcome icon item structure
interface OutcomeIcon {
  iconType: string;
  title: string;
  description: string;
  id: string;
}

// Content interface for OutcomeIcons layout
interface OutcomeIconsContent {
  headline: string;
  icon_types: string;
  titles: string;
  descriptions: string;
  subheadline?: string;
  layout_style?: string;
  footer_text?: string;
}

// Content schema for OutcomeIcons layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Powerful Outcomes You Can Expect' },
  icon_types: { type: 'string' as const, default: '📈|⚡|🔒|👥|🤖|💡' },
  titles: { type: 'string' as const, default: 'Accelerated Growth|Maximum Efficiency|Enterprise Security|Seamless Collaboration|Smart Automation|Continuous Innovation' },
  descriptions: { type: 'string' as const, default: 'Scale your business faster with proven strategies and tools|Optimize workflows and eliminate bottlenecks for peak performance|Bank-level security protecting your data and operations|Unite your team with powerful collaboration features|Automate repetitive tasks and focus on what matters most|Stay ahead with cutting-edge features and regular updates' },
  subheadline: { type: 'string' as const, default: 'Transform your business with these proven outcome drivers' },
  layout_style: { type: 'string' as const, default: 'grid' },
  footer_text: { type: 'string' as const, default: 'These outcomes are built into every solution we deliver' }
};

// Parse outcome data from pipe-separated strings
const parseOutcomeData = (iconTypes: string, titles: string, descriptions: string): OutcomeIcon[] => {
  const iconList = iconTypes.split('|').map(i => i.trim()).filter(i => i);
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  
  return iconList.map((iconType, index) => ({
    id: `outcome-${index}`,
    iconType,
    title: titleList[index] || 'Great Outcome',
    description: descriptionList[index] || 'Amazing results await'
  }));
};

// Icon Component
const OutcomeIconSvg = ({ iconType }: { iconType: string }) => {
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'growth':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'efficiency':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'security':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.25-7a4.5 4.5 0 11-6.364 6.364L12 5.636l-1.318-1.318A4.5 4.5 0 015.318 10.5L12 17.182l6.682-6.682a4.5 4.5 0 000-6.364z" />
          </svg>
        );
      case 'collaboration':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'automation':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'innovation':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'analytics':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'support':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a2.25 2.25 0 012.25 2.25v1.372c.516.235.997.52 1.43.848l.97-.97a2.25 2.25 0 013.182 3.182l-.97.97c.328.433.613.914.848 1.43h1.372a2.25 2.25 0 010 4.5h-1.372c-.235.516-.52.997-.848 1.43l.97.97a2.25 2.25 0 01-3.182 3.182l-.97-.97c-.433.328-.914.613-1.43.848v1.372a2.25 2.25 0 01-4.5 0v-1.372c-.516-.235-.997-.52-1.43-.848l-.97.97a2.25 2.25 0 01-3.182-3.182l.97-.97c-.328-.433-.613-.914-.848-1.43H2.25a2.25 2.25 0 010-4.5h1.372c.235-.516.52-.997.848-1.43l-.97-.97a2.25 2.25 0 013.182-3.182l.97.97c.433-.328.914-.613 1.43-.848V4.5A2.25 2.25 0 0112 2.25z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
    }
  };

  return getIcon(iconType);
};

// Get color scheme based on icon type
const getColorScheme = (iconType: string): { bg: string; icon: string; border: string } => {
  const schemes = {
    growth: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
    efficiency: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
    security: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' },
    collaboration: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
    automation: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
    innovation: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-200' },
    analytics: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200' },
    support: { bg: 'bg-pink-50', icon: 'text-pink-600', border: 'border-pink-200' }
  };
  
  return schemes[iconType.toLowerCase() as keyof typeof schemes] || schemes.efficiency;
};

// Individual Outcome Card Component
const OutcomeCard = ({ 
  outcome, 
  index, 
  mode, 
  sectionId,
  onIconEdit,
  onTitleEdit,
  onDescriptionEdit
}: {
  outcome: OutcomeIcon;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onIconEdit: (index: number, value: string) => void;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  const colorScheme = getColorScheme(outcome.iconType);
  
  return (
    <div className="group text-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
      
      {/* Icon */}
      <div className="mb-6">
        <div className={`w-16 h-16 ${colorScheme.bg} rounded-2xl border ${colorScheme.border} flex items-center justify-center ${colorScheme.icon} mx-auto group-hover:scale-110 transition-transform duration-300`}>
          <IconEditableText
            mode={mode}
            value={outcome.iconType}
            onEdit={(value) => onIconEdit(index, value)}
            backgroundType="primary"
            colorTokens={{}}
            iconSize="lg"
            className="text-2xl"
            placeholder="📊"
            sectionId={sectionId}
            elementKey={`outcome_icon_${index}`}
          />
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-gray-50 font-bold text-gray-900"
          >
            {outcome.title}
          </div>
        ) : (
          <h3 
            className="font-bold text-gray-900"
          >
            {outcome.title}
          </h3>
        )}
      </div>

      {/* Description */}
      <div>
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed"
          >
            {outcome.description}
          </div>
        ) : (
          <p 
            className="text-gray-600 leading-relaxed"
          >
            {outcome.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default function OutcomeIcons(props: OutcomeIconsProps) {
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
  } = useLayoutComponent<OutcomeIconsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse outcome data
  const outcomes = parseOutcomeData(
    blockContent.icon_types,
    blockContent.titles,
    blockContent.descriptions
  );

  // Handle individual editing
  const handleIconEdit = (index: number, value: string) => {
    const iconList = blockContent.icon_types.split('|');
    iconList[index] = value;
    handleContentUpdate('icon_types', iconList.join('|'));
  };

  const handleTitleEdit = (index: number, value: string) => {
    const titleList = blockContent.titles.split('|');
    titleList[index] = value;
    handleContentUpdate('titles', titleList.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptionList = blockContent.descriptions.split('|');
    descriptionList[index] = value;
    handleContentUpdate('descriptions', descriptionList.join('|'));
  };

  return (
    <section 
      className={`py-16 px-4`}
      style={{ backgroundColor: sectionBackground }}
      data-section-id={sectionId}
      data-section-type="OutcomeIcons"
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
              placeholder="Add optional subheadline describing the business outcomes..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Outcomes Grid */}
        <div className={`grid gap-8 ${
          outcomes.length <= 3 ? 'md:grid-cols-3 max-w-4xl mx-auto' :
          outcomes.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
          outcomes.length === 5 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {outcomes.map((outcome, index) => (
            <OutcomeCard
              key={outcome.id}
              outcome={outcome}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onIconEdit={handleIconEdit}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
            />
          ))}
        </div>

        {/* Outcome Promise Footer */}
        {(blockContent.footer_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full text-blue-800">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
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
                placeholder="Add footer outcome promise..."
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
  name: 'OutcomeIcons',
  category: 'Results',
  description: 'Icon-based outcome visualization with color-coded categories',
  tags: ['outcomes', 'icons', 'visual', 'categories', 'business-results'],
  features: [
    'Color-coded icon categories for different outcome types',
    'Professional SVG icons for business outcomes',
    'Hover animations and scale effects',
    'Flexible grid layout with responsive design',
    'Individual editing for icons, titles, and descriptions',
    'Outcome promise footer for credibility'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    icon_types: 'Pipe-separated list of icon types (growth, efficiency, security, etc.)',
    titles: 'Pipe-separated list of outcome titles',
    descriptions: 'Pipe-separated list of outcome descriptions',
    subheadline: 'Optional subheading for context',
    layout_style: 'Optional layout style preference'
  },
  examples: [
    'Business transformation outcomes',
    'Product benefit visualization',
    'Service capability highlights',
    'Technology advantage showcase'
  ]
};