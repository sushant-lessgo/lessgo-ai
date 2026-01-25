// components/layout/MapHeatSpots.tsx
// Global user distribution visualization - Social Proof component

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { SocialProofNumber } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface MapHeatSpotsContent {
  headline: string;
  subheadline?: string;
  global_stats: string;
  stat_labels: string;
  countries_list?: string;
  countries_title?: string;
}

// Global stat structure
interface GlobalStat {
  id: string;
  index: number;
  value: string;
  label: string;
}

// Country data structure
interface CountrySpot {
  id: string;
  name: string;
  position: { x: number; y: number };
  users: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Trusted Globally by Millions' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Our platform connects users across 190+ countries, creating a truly global community of success.' 
  },
  global_stats: { 
    type: 'string' as const, 
    default: '2.5M+|190+|50+|99.9%' 
  },
  stat_labels: { 
    type: 'string' as const, 
    default: 'Global Users|Countries|Languages|Uptime' 
  },
  countries_list: { 
    type: 'string' as const, 
    default: 'United States|United Kingdom|Germany|France|Japan|Australia|Canada|Brazil|India|Singapore' 
  },
  countries_title: {
    type: 'string' as const,
    default: 'Active in These Countries'
  }
};

// Parse stat data from pipe-separated strings
const parseStatData = (stats: string, labels: string): GlobalStat[] => {
  const statList = parsePipeData(stats);
  const labelList = parsePipeData(labels);
  
  return statList.map((value, index) => ({
    id: `stat-${index}`,
    index,
    value: value.trim(),
    label: labelList[index]?.trim() || `Stat ${index + 1}`
  }));
};

// Predefined country positions (simplified world map coordinates)
const getCountrySpots = (countries: string[]): CountrySpot[] => {
  const countryPositions: Record<string, { x: number; y: number }> = {
    'United States': { x: 25, y: 45 },
    'United Kingdom': { x: 50, y: 35 },
    'Germany': { x: 55, y: 35 },
    'France': { x: 52, y: 40 },
    'Japan': { x: 85, y: 42 },
    'Australia': { x: 83, y: 75 },
    'Canada': { x: 28, y: 25 },
    'Brazil': { x: 35, y: 65 },
    'India': { x: 72, y: 50 },
    'Singapore': { x: 78, y: 58 },
    'China': { x: 78, y: 40 },
    'Russia': { x: 65, y: 25 },
    'Mexico': { x: 22, y: 50 },
    'South Africa': { x: 58, y: 75 },
    'Norway': { x: 55, y: 20 }
  };

  const userCounts = ['10K+', '25K+', '50K+', '15K+', '30K+', '8K+', '12K+', '18K+', '45K+', '6K+'];

  return countries.slice(0, 10).map((country, index) => ({
    id: `country-${index}`,
    name: country.trim(),
    position: countryPositions[country.trim()] || { x: Math.random() * 80 + 10, y: Math.random() * 60 + 20 },
    users: userCounts[index] || `${Math.floor(Math.random() * 40 + 5)}K+`
  }));
};

// World Map SVG Component
const WorldMapVisualization = React.memo(({ 
  countrySpots, 
  dynamicTextColors 
}: { 
  countrySpots: CountrySpot[];
  dynamicTextColors: any;
}) => {
  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-blue-50/20 to-indigo-100/20 rounded-2xl border border-white/10 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className={dynamicTextColors?.muted || 'text-gray-400'} />
        </svg>
      </div>

      {/* Simplified world map outline */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Simplified continent outlines */}
        <path 
          d="M 15 30 Q 20 25 30 30 Q 35 35 25 45 Q 20 50 15 45 Z" 
          fill="none" 
          stroke={dynamicTextColors?.muted || '#9CA3AF'} 
          strokeWidth="0.5" 
          opacity="0.3"
        />
        <path 
          d="M 45 25 Q 55 20 65 25 Q 70 30 75 35 Q 80 30 85 35 Q 90 40 85 50 Q 80 55 70 50 Q 60 45 50 50 Q 45 45 45 35 Z" 
          fill="none" 
          stroke={dynamicTextColors?.muted || '#9CA3AF'} 
          strokeWidth="0.5" 
          opacity="0.3"
        />
        <path 
          d="M 75 60 Q 85 65 90 70 Q 85 80 75 75 Q 70 70 75 65 Z" 
          fill="none" 
          stroke={dynamicTextColors?.muted || '#9CA3AF'} 
          strokeWidth="0.5" 
          opacity="0.3"
        />
      </svg>

      {/* Country spots */}
      {countrySpots.map((spot, index) => (
        <div
          key={spot.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
          style={{
            left: `${spot.position.x}%`,
            top: `${spot.position.y}%`,
            animationDelay: `${index * 0.2}s`
          }}
        >
          {/* Pulsing dot */}
          <div className="relative">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse shadow-lg"></div>
            <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl">
              <div className="font-semibold">{spot.name}</div>
              <div className="text-xs text-gray-300">{spot.users} users</div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      ))}

      {/* Connecting lines (animated) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {countrySpots.slice(0, 5).map((spot, index) => {
          const nextSpot = countrySpots[(index + 1) % Math.min(5, countrySpots.length)];
          return (
            <line
              key={`line-${index}`}
              x1={`${spot.position.x}%`}
              y1={`${spot.position.y}%`}
              x2={`${nextSpot.position.x}%`}
              y2={`${nextSpot.position.y}%`}
              stroke="url(#connectionGradient)"
              strokeWidth="1"
              opacity="0.3"
              className="animate-pulse"
            />
          );
        })}
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});
WorldMapVisualization.displayName = 'WorldMapVisualization';

// Editable Stat Display Component
const EditableGlobalStatDisplay = React.memo(({ 
  stat, 
  mode,
  dynamicTextColors,
  getTextStyle,
  bodyStyle,
  onValueEdit,
  onLabelEdit,
  sectionId,
  backgroundType,
  sectionBackground,
  colorTokens
}: { 
  stat: GlobalStat;
  mode: 'edit' | 'preview';
  dynamicTextColors: any;
  getTextStyle: any;
  bodyStyle?: any;
  onValueEdit: (index: number, value: string) => void;
  onLabelEdit: (index: number, value: string) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  colorTokens: any;
}) => {
  return (
    <div className="text-center">
      {mode === 'edit' ? (
        <EditableAdaptiveText
          mode={mode}
          value={stat.value}
          onEdit={(value) => onValueEdit(stat.index, value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          className={`mb-2 text-3xl md:text-4xl font-bold ${dynamicTextColors?.heading || 'text-gray-900'}`}
          placeholder="0"
          sectionBackground={sectionBackground}
          data-section-id={sectionId}
          data-element-key={`stat_value_${stat.index}`}
        />
      ) : (
        <SocialProofNumber
          number={stat.value}
          label=""
          className={`mb-2 ${dynamicTextColors?.heading || 'text-gray-900'}`}
        />
      )}
      
      <EditableAdaptiveText
        mode={mode}
        value={stat.label}
        onEdit={(value) => onLabelEdit(stat.index, value)}
        backgroundType={backgroundType as any}
        colorTokens={colorTokens}
        variant="body"
        className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}
        style={bodyStyle ? {...bodyStyle, fontSize: '0.875rem'} : {}}
        placeholder="Label"
        sectionBackground={sectionBackground}
        data-section-id={sectionId}
        data-element-key={`stat_label_${stat.index}`}
      />
    </div>
  );
});
EditableGlobalStatDisplay.displayName = 'EditableGlobalStatDisplay';

export default function MapHeatSpots(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<MapHeatSpotsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodyStyle = getTypographyStyle('body');

  // Parse stats from pipe-separated strings
  const globalStats = parseStatData(
    blockContent.global_stats || '',
    blockContent.stat_labels || ''
  );

  // Parse countries and create spots
  const countries = blockContent.countries_list ? parsePipeData(blockContent.countries_list) : [];
  const countrySpots = getCountrySpots(countries);

  // Handle individual stat value editing
  const handleStatValueEdit = (index: number, value: string) => {
    const updatedStats = updateListData(blockContent.global_stats, index, value);
    handleContentUpdate('global_stats', updatedStats);
  };

  // Handle individual stat label editing
  const handleStatLabelEdit = (index: number, value: string) => {
    const updatedLabels = updateListData(blockContent.stat_labels, index, value);
    handleContentUpdate('stat_labels', updatedLabels);
  };

  // Handle individual country editing
  const handleCountryEdit = (index: number, value: string) => {
    const updatedCountries = updateListData(blockContent.countries_list || '', index, value);
    handleContentUpdate('countries_list', updatedCountries);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MapHeatSpots"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
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
              style={{...bodyLgStyle}} className="max-w-3xl mx-auto"
              placeholder="Add a compelling subheadline about your global reach..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {globalStats.slice(0, 4).map((stat) => (
            <EditableGlobalStatDisplay
              key={stat.id}
              stat={stat}
              mode={mode}
              dynamicTextColors={dynamicTextColors}
              getTextStyle={getTextStyle}
              bodyStyle={bodyStyle}
              onValueEdit={handleStatValueEdit}
              onLabelEdit={handleStatLabelEdit}
              sectionId={sectionId}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              sectionBackground={sectionBackground}
              colorTokens={colorTokens}
            />
          ))}
        </div>

        {/* World Map Visualization */}
        <div className="mb-12">
          <WorldMapVisualization 
            countrySpots={countrySpots}
            dynamicTextColors={dynamicTextColors}
          />
        </div>

        {/* Country List */}
        <div className="text-center">
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.countries_title || ''}
            onEdit={(value) => handleContentUpdate('countries_title', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{
              ...h3Style,
              textAlign: 'center'
            }}
            className={`mb-6 ${dynamicTextColors?.heading || 'text-gray-900'}`}
            placeholder="Active in These Countries"
            sectionId={sectionId}
            elementKey="countries_title"
            sectionBackground={sectionBackground}
          />
          <div className="flex flex-wrap justify-center gap-3">
            {countries.slice(0, 8).map((country, index) => (
              <div key={index} className={`px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-colors duration-300`}>
                <EditableAdaptiveText
                  mode={mode}
                  value={country.trim()}
                  onEdit={(value) => handleCountryEdit(index, value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`${dynamicTextColors?.body || 'text-gray-700'}`}
                  style={{...bodyStyle, fontSize: '0.875rem'}}
                  placeholder="Country name"
                  sectionId={sectionId}
                  elementKey={`country_${index}`}
                  sectionBackground={sectionBackground}
                />
              </div>
            ))}
            {countries.length > 8 && (
              <span style={{...bodyStyle, fontSize: '0.875rem'}} className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full`}>
                +{countries.length - 8} more
              </span>
            )}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'MapHeatSpots',
  category: 'Social Proof',
  description: 'Global user distribution visualization with interactive world map and country statistics',
  tags: ['social-proof', 'global', 'map', 'users', 'countries'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'complex',
  estimatedBuildTime: '45 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'global_stats', label: 'Global Statistics (pipe separated)', type: 'text', required: true },
    { key: 'stat_labels', label: 'Stat Labels (pipe separated)', type: 'text', required: true },
    { key: 'countries_title', label: 'Countries Section Title', type: 'text', required: false },
    { key: 'countries_list', label: 'Countries List (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Interactive world map with animated heat spots',
    'Hover tooltips showing user counts per country',
    'Animated connecting lines between major markets',
    'Country tags with overflow indicator',
    'Fully editable global statistics values and labels',
    'Editable countries section title',
    'Individually editable country names in tags'
  ],
  
  useCases: [
    'Global SaaS platform user showcase',
    'International service availability',
    'Worldwide community demonstration',
    'Geographic market penetration',
    'Global expansion social proof'
  ]
};