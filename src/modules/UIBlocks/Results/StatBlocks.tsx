import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface StatBlocksProps extends LayoutComponentProps {}

// Stat item structure
interface StatItem {
  value: string;
  label: string;
  description?: string;
  id: string;
}

// Content interface for StatBlocks layout
interface StatBlocksContent {
  headline: string;
  stat_values: string;
  stat_labels: string;
  stat_descriptions?: string;
  subheadline?: string;
  stat_icon_1?: string;
  stat_icon_2?: string;
  stat_icon_3?: string;
  stat_icon_4?: string;
  stat_icon_5?: string;
  stat_icon_6?: string;
}

// Content schema for StatBlocks layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Real Results That Speak for Themselves' },
  stat_values: { type: 'string' as const, default: '10,000+|98%|2.5x|24/7' },
  stat_labels: { type: 'string' as const, default: 'Happy Customers|Customer Satisfaction|Revenue Growth|Support Available' },
  stat_descriptions: { type: 'string' as const, default: '' },
  subheadline: { type: 'string' as const, default: '' },
  stat_icon_1: { type: 'string' as const, default: '👥' },
  stat_icon_2: { type: 'string' as const, default: '❤️' },
  stat_icon_3: { type: 'string' as const, default: '📈' },
  stat_icon_4: { type: 'string' as const, default: '⏰' }
};

// Parse stat data from pipe-separated strings
const parseStatData = (values: string, labels: string, descriptions?: string): StatItem[] => {
  const valueList = values.split('|').map(v => v.trim()).filter(v => v);
  const labelList = labels.split('|').map(l => l.trim()).filter(l => l);
  const descriptionList = descriptions ? descriptions.split('|').map(d => d.trim()).filter(d => d) : [];
  
  return valueList.map((value, index) => ({
    id: `stat-${index}`,
    value,
    label: labelList[index] || 'Metric',
    description: descriptionList[index] || undefined
  }));
};

// ModeWrapper component for handling edit/preview modes
const ModeWrapper = ({ 
  mode, 
  children, 
  sectionId, 
  elementKey,
  onEdit 
}: {
  mode: 'edit' | 'preview';
  children: React.ReactNode;
  sectionId: string;
  elementKey: string;
  onEdit?: (value: string) => void;
}) => {
  if (mode !== 'preview' && onEdit) {
    return (
      <div 
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent || '')}
        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
        data-placeholder={`Edit ${elementKey.replace('_', ' ')}`}
      >
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
};

// Stat Icon Component
const StatIcon = ({ label, index }: { label: string, index: number }) => {
  const getIcon = (statLabel: string, fallbackIndex: number) => {
    const lower = statLabel.toLowerCase();
    
    if (lower.includes('customer') || lower.includes('user') || lower.includes('client')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    } else if (lower.includes('satisfaction') || lower.includes('rating') || lower.includes('score')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    } else if (lower.includes('revenue') || lower.includes('growth') || lower.includes('sales') || lower.includes('profit')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else if (lower.includes('time') || lower.includes('speed') || lower.includes('fast') || lower.includes('support')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (lower.includes('efficiency') || lower.includes('productivity') || lower.includes('performance')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else if (lower.includes('reduction') || lower.includes('save') || lower.includes('cost')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      );
    }
    
    // Default icons based on position
    const defaultIcons = [
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>,
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>,
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228V2.721m-2.48 5.228a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>,
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ];
    
    return defaultIcons[fallbackIndex % defaultIcons.length];
  };
  
  return getIcon(label, index);
};

// Individual Stat Block
const StatBlock = ({ 
  stat, 
  index, 
  mode, 
  sectionId,
  onValueEdit,
  onLabelEdit,
  onDescriptionEdit,
  onStatIconEdit,
  getStatIcon
}: {
  stat: StatItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onValueEdit: (index: number, value: string) => void;
  onLabelEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onStatIconEdit: (index: number, value: string) => void;
  getStatIcon: (index: number) => string;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="group text-center p-8 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
      
      {/* Stat Icon */}
      <div className="mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300">
          <IconEditableText
            mode={mode}
            value={getStatIcon(index)}
            onEdit={(value) => onStatIconEdit(index, value)}
            backgroundType="neutral"
            colorTokens={{}}
            iconSize="lg"
            className="text-blue-600 text-2xl"
            sectionId={sectionId}
            elementKey={`stat_icon_${index + 1}`}
          />
        </div>
      </div>
      
      {/* Stat Value */}
      <div className="mb-4">
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onValueEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[48px] cursor-text hover:bg-gray-50 text-4xl md:text-5xl font-bold text-gray-900"
          >
            {stat.value}
          </div>
        ) : (
          <div 
            className="text-4xl md:text-5xl font-bold text-gray-900"
          >
            {stat.value}
          </div>
        )}
      </div>
      
      {/* Stat Label */}
      <div className="mb-3">
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onLabelEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
          >
            {stat.label}
          </div>
        ) : (
          <h3 
            className="font-semibold text-gray-900"
          >
            {stat.label}
          </h3>
        )}
      </div>
      
      {/* Optional Description */}
      {(stat.description || mode === 'edit') && (
        <div>
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed ${!stat.description ? 'opacity-50 italic' : ''}`}
            >
              {stat.description || 'Add optional description...'}
            </div>
          ) : stat.description && (
            <p 
              className="text-gray-600 leading-relaxed"
            >
              {stat.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default function StatBlocks(props: StatBlocksProps) {
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
  } = useLayoutComponent<StatBlocksContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse stat data
  const statItems = parseStatData(blockContent.stat_values, blockContent.stat_labels, blockContent.stat_descriptions);

  // Handle individual editing
  const handleValueEdit = (index: number, value: string) => {
    const values = blockContent.stat_values.split('|');
    values[index] = value;
    handleContentUpdate('stat_values', values.join('|'));
  };

  const handleStatIconEdit = (index: number, value: string) => {
    const iconField = `stat_icon_${index + 1}` as keyof StatBlocksContent;
    handleContentUpdate(iconField, value);
  };

  // Get stat icon from content or default
  const getStatIcon = (index: number): string => {
    const iconFields = ['stat_icon_1', 'stat_icon_2', 'stat_icon_3', 'stat_icon_4', 'stat_icon_5', 'stat_icon_6'];
    const iconField = iconFields[index] as keyof StatBlocksContent;
    return blockContent[iconField] || ['👥', '❤️', '📈', '⏰', '⚡', '🏆'][index] || '📊';
  };

  const handleLabelEdit = (index: number, value: string) => {
    const labels = blockContent.stat_labels.split('|');
    labels[index] = value;
    handleContentUpdate('stat_labels', labels.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.stat_descriptions ? blockContent.stat_descriptions.split('|') : [];
    descriptions[index] = value;
    handleContentUpdate('stat_descriptions', descriptions.join('|'));
  };

  return (
    <section 
      className={`py-16 px-4`}
      style={{ backgroundColor: sectionBackground }}
      data-section-id={sectionId}
      data-section-type="StatBlocks"
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
              className="mb-6 max-w-2xl mx-auto"
              placeholder="Add optional subheadline..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-8 ${
          statItems.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
          statItems.length === 3 ? 'md:grid-cols-3 max-w-5xl mx-auto' :
          statItems.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
          'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {statItems.map((stat, index) => (
            <StatBlock
              key={stat.id}
              stat={stat}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onValueEdit={handleValueEdit}
              onLabelEdit={handleLabelEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onStatIconEdit={handleStatIconEdit}
              getStatIcon={getStatIcon}
            />
          ))}
        </div>

        {/* Achievement Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-800">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Results measured across thousands of customers</span>
          </div>
        </div>

      </div>
    </section>
  );
}

export const componentMeta = {
  name: 'StatBlocks',
  category: 'Metrics',
  description: 'Statistical metrics display with adaptive text colors and optional descriptions',
  tags: ['stats', 'metrics', 'numbers', 'achievements', 'adaptive-colors'],
  features: [
    'Automatic text color adaptation based on background type',
    'Editable stat values, labels, and descriptions',
    'Smart grid layout based on stat count',
    'Contextual icons that match stat content',
    'Optional subheadline for context',
    'Achievement footer for credibility'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    stat_values: 'Pipe-separated list of stat values (e.g., "10,000+|98%|2.5x")',
    stat_labels: 'Pipe-separated list of stat labels',
    stat_descriptions: 'Optional pipe-separated descriptions for each stat',
    subheadline: 'Optional subheading for context'
  },
  examples: [
    'Company achievements',
    'Product performance metrics',
    'Customer satisfaction stats',
    'Growth indicators'
  ]
};