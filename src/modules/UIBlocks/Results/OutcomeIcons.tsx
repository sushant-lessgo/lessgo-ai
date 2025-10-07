import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getIcon } from '@/lib/getIcon';

interface OutcomeIconsProps extends LayoutComponentProps {}

// Outcome icon item structure
interface OutcomeIcon {
  icon: string;
  title: string;
  description: string;
  id: string;
}

// Content interface for OutcomeIcons layout
interface OutcomeIconsContent {
  headline: string;
  titles: string;
  descriptions: string;
  subheadline?: string;
  layout_style?: string;
  footer_text?: string;
  icon_1?: string;
  icon_2?: string;
  icon_3?: string;
  icon_4?: string;
  icon_5?: string;
  icon_6?: string;
  icon_7?: string;
  icon_8?: string;
}

// Content schema for OutcomeIcons layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Powerful Outcomes You Can Expect' },
  titles: { type: 'string' as const, default: 'Accelerated Growth|Maximum Efficiency|Enterprise Security|Seamless Collaboration|Smart Automation|Continuous Innovation' },
  descriptions: { type: 'string' as const, default: 'Scale your business faster with proven strategies and tools|Optimize workflows and eliminate bottlenecks for peak performance|Bank-level security protecting your data and operations|Unite your team with powerful collaboration features|Automate repetitive tasks and focus on what matters most|Stay ahead with cutting-edge features and regular updates' },
  subheadline: { type: 'string' as const, default: 'Transform your business with these proven outcome drivers' },
  layout_style: { type: 'string' as const, default: 'grid' },
  footer_text: { type: 'string' as const, default: 'These outcomes are built into every solution we deliver' },
  icon_1: { type: 'string' as const, default: '📈' },
  icon_2: { type: 'string' as const, default: '⚡' },
  icon_3: { type: 'string' as const, default: '🔒' },
  icon_4: { type: 'string' as const, default: '👥' },
  icon_5: { type: 'string' as const, default: '🤖' },
  icon_6: { type: 'string' as const, default: '💡' },
  icon_7: { type: 'string' as const, default: '🎯' },
  icon_8: { type: 'string' as const, default: '⭐' }
};

// Parse outcome data with unified icon system
const parseOutcomeData = (titles: string, descriptions: string, blockContent: OutcomeIconsContent): OutcomeIcon[] => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  return titleList.map((title, index) => {
    // Get AI-provided category from numbered icon fields
    const iconCategory = blockContent[`icon_${index + 1}` as keyof OutcomeIconsContent] as string | undefined;
    const description = descriptionList[index] || 'Amazing results await';

    // Use unified icon system with intelligent fallback
    const icon = getIcon(iconCategory, { title, description });

    return {
      id: `outcome-${index}`,
      icon,
      title,
      description
    };
  });
};

// Helper function to add a new outcome
const addOutcome = (titles: string, descriptions: string): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  // Add new outcome with default content
  titleList.push('New Outcome');
  descriptionList.push('Describe this amazing result your customers will achieve.');

  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Helper function to remove an outcome
const removeOutcome = (titles: string, descriptions: string, indexToRemove: number): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  // Remove the outcome at the specified index
  if (indexToRemove >= 0 && indexToRemove < titleList.length) {
    titleList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }

  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Individual Outcome Card Component
const OutcomeCard = ({
  outcome,
  index,
  mode,
  sectionId,
  onIconEdit,
  onTitleEdit,
  onDescriptionEdit,
  onRemoveOutcome,
  canRemove = true
}: {
  outcome: OutcomeIcon;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onIconEdit: (index: number, value: string) => void;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemoveOutcome?: (index: number) => void;
  canRemove?: boolean;
}) => {
  const { getTextStyle } = useTypography();

  return (
    <div className={`group/outcome-card-${index} relative text-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300`}>

      {/* Icon */}
      <div className="mb-6">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
          <IconEditableText
            mode={mode}
            value={outcome.icon}
            onEdit={(value) => onIconEdit(index, value)}
            backgroundType="primary"
            colorTokens={{}}
            iconSize="lg"
            className="text-3xl"
            placeholder="⭐"
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

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveOutcome && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveOutcome(index);
          }}
          className={`opacity-0 group-hover/outcome-card-${index}:opacity-100 absolute top-4 right-4 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200`}
          title="Remove this outcome"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
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
    blockContent.titles,
    blockContent.descriptions,
    blockContent
  );

  // Handle individual editing
  const handleIconEdit = (index: number, value: string) => {
    const iconField = `icon_${index + 1}` as keyof OutcomeIconsContent;
    handleContentUpdate(iconField, value);
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

  // Handle adding a new outcome
  const handleAddOutcome = () => {
    const { newTitles, newDescriptions } = addOutcome(
      blockContent.titles,
      blockContent.descriptions
    );
    handleContentUpdate('titles', newTitles);
    handleContentUpdate('descriptions', newDescriptions);
  };

  // Handle removing an outcome
  const handleRemoveOutcome = (indexToRemove: number) => {
    const { newTitles, newDescriptions } = removeOutcome(
      blockContent.titles,
      blockContent.descriptions,
      indexToRemove
    );
    handleContentUpdate('titles', newTitles);
    handleContentUpdate('descriptions', newDescriptions);
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
              onRemoveOutcome={handleRemoveOutcome}
              canRemove={outcomes.length > 1}
            />
          ))}
        </div>

        {/* Add Outcome Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && outcomes.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddOutcome}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Outcome</span>
            </button>
          </div>
        )}

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