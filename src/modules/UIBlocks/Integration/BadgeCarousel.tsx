// Integration/BadgeCarousel.tsx - Scrolling carousel of integration badges
// Production-ready integration component using abstraction system with background-aware text colors

import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface BadgeCarouselContent {
  headline: string;
  subheadline?: string;
  featured_integrations: string;
  popular_integrations: string;
  developer_tools: string;
  enterprise_tools: string;
  featured_icon?: string;
  popular_icon?: string;
  developer_icon?: string;
  enterprise_icon?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Integrate With 500+ Popular Tools' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Connect your favorite tools and automate workflows in minutes, not hours.' 
  },
  featured_integrations: { 
    type: 'string' as const, 
    default: '⭐ Slack|⭐ Google Workspace|⭐ Microsoft 365|⭐ Zoom|⭐ Figma|⭐ Notion|⭐ Airtable|⭐ Calendly' 
  },
  popular_integrations: { 
    type: 'string' as const, 
    default: '🔥 HubSpot|🔥 Salesforce|🔥 Mailchimp|🔥 Stripe|🔥 PayPal|🔥 Shopify|🔥 WordPress|🔥 Zapier' 
  },
  developer_tools: { 
    type: 'string' as const, 
    default: '⚡ GitHub|⚡ GitLab|⚡ Jira|⚡ Linear|⚡ Vercel|⚡ AWS|⚡ Docker|⚡ Jenkins' 
  },
  enterprise_tools: { 
    type: 'string' as const, 
    default: '🏢 SAP|🏢 Oracle|🏢 Workday|🏢 ServiceNow|🏢 Tableau|🏢 Power BI|🏢 Snowflake|🏢 Databricks' 
  },
  featured_icon: { 
    type: 'string' as const, 
    default: '⭐' 
  },
  popular_icon: { 
    type: 'string' as const, 
    default: '🔥' 
  },
  developer_icon: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  enterprise_icon: { 
    type: 'string' as const, 
    default: '🏢' 
  }
};

// Integration Badge Component
const IntegrationBadge = React.memo(({ name, colorTokens, isHighlighted = false }: { 
  name: string; 
  colorTokens: any;
  isHighlighted?: boolean;
}) => {
  // Extract emoji prefix if present
  const parts = name.trim().split(' ');
  const hasEmoji = parts[0] && /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}⭐🔥⚡🏢]/u.test(parts[0]);
  const emoji = hasEmoji ? parts[0] : '';
  const displayName = hasEmoji ? parts.slice(1).join(' ') : name.trim();

  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 hover:scale-105 ${
      isHighlighted 
        ? `${colorTokens.ctaBg} ${colorTokens.ctaBgText} border-current shadow-md` 
        : `${colorTokens.bgSecondary} ${colorTokens.textSecondary} border-gray-200 hover:${colorTokens.bgSecondary}`
    }`}>
      {emoji && <span className="mr-2">{emoji}</span>}
      <span>{displayName}</span>
      <div className="w-2 h-2 rounded-full bg-green-400 ml-2"></div>
    </div>
  );
});
IntegrationBadge.displayName = 'IntegrationBadge';

// Carousel Row Component
const CarouselRow = React.memo(({ 
  integrations, 
  direction, 
  speed, 
  colorTokens,
  highlightedIntegration 
}: { 
  integrations: string[]; 
  direction: 'left' | 'right'; 
  speed: number;
  colorTokens: any;
  highlightedIntegration: string | null;
}) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => {
        const increment = direction === 'left' ? -0.5 : 0.5;
        return prev + increment * speed;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [direction, speed]);

  // Duplicate integrations to create seamless loop
  const duplicatedIntegrations = [...integrations, ...integrations, ...integrations];

  return (
    <div className="overflow-hidden py-2">
      <div 
        className="flex space-x-3 transition-transform duration-0"
        style={{ 
          transform: `translateX(${offset}px)`,
          width: `${duplicatedIntegrations.length * 150}px` // Approximate width per badge
        }}
      >
        {duplicatedIntegrations.map((integration, index) => (
          <IntegrationBadge 
            key={`${integration}-${index}`}
            name={integration} 
            colorTokens={colorTokens}
            isHighlighted={highlightedIntegration === integration.replace(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}⭐🔥⚡🏢]/u, '').trim()}
          />
        ))}
      </div>
    </div>
  );
});
CarouselRow.displayName = 'CarouselRow';

export default function BadgeCarousel(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<BadgeCarouselContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [highlightedIntegration, setHighlightedIntegration] = useState<string | null>(null);

  // Icon edit handlers
  const handleCategoryIconEdit = (category: string, value: string) => {
    const iconField = `${category}_icon` as keyof BadgeCarouselContent;
    handleContentUpdate(iconField, value);
  };

  // Parse integration lists
  const integrationRows = [
    {
      name: 'Featured',
      integrations: blockContent.featured_integrations ? blockContent.featured_integrations.split('|') : [],
      direction: 'left' as const,
      speed: 1
    },
    {
      name: 'Popular',
      integrations: blockContent.popular_integrations ? blockContent.popular_integrations.split('|') : [],
      direction: 'right' as const,
      speed: 0.8
    },
    {
      name: 'Developer Tools',
      integrations: blockContent.developer_tools ? blockContent.developer_tools.split('|') : [],
      direction: 'left' as const,
      speed: 1.2
    },
    {
      name: 'Enterprise',
      integrations: blockContent.enterprise_tools ? blockContent.enterprise_tools.split('|') : [],
      direction: 'right' as const,
      speed: 0.9
    }
  ];

  // Randomly highlight integrations
  useEffect(() => {
    const allIntegrations = integrationRows.flatMap(row => 
      row.integrations.map(integration => 
        integration.replace(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}⭐🔥⚡🏢]/u, '').trim()
      )
    );

    const interval = setInterval(() => {
      const randomIntegration = allIntegrations[Math.floor(Math.random() * allIntegrations.length)];
      setHighlightedIntegration(randomIntegration);
      
      setTimeout(() => {
        setHighlightedIntegration(null);
      }, 2000);
    }, 4000);

    return () => clearInterval(interval);
  }, [integrationRows]);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="BadgeCarousel"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
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
              placeholder="Add a description of your integration capabilities..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Category Icons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="mb-2">
              <IconEditableText
                mode={mode}
                value={blockContent.featured_icon || '⭐'}
                onEdit={(value) => handleCategoryIconEdit('featured', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                iconSize="xl"
                className="text-4xl"
                placeholder="⭐"
                sectionId={sectionId}
                elementKey="featured_icon"
              />
            </div>
            <h3 className={`font-semibold ${colorTokens.textPrimary}`}>Featured</h3>
            <p className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Top picks</p>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <IconEditableText
                mode={mode}
                value={blockContent.popular_icon || '🔥'}
                onEdit={(value) => handleCategoryIconEdit('popular', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                iconSize="xl"
                className="text-4xl"
                placeholder="🔥"
                sectionId={sectionId}
                elementKey="popular_icon"
              />
            </div>
            <h3 className={`font-semibold ${colorTokens.textPrimary}`}>Popular</h3>
            <p className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Most used</p>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <IconEditableText
                mode={mode}
                value={blockContent.developer_icon || '⚡'}
                onEdit={(value) => handleCategoryIconEdit('developer', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                iconSize="xl"
                className="text-4xl"
                placeholder="⚡"
                sectionId={sectionId}
                elementKey="developer_icon"
              />
            </div>
            <h3 className={`font-semibold ${colorTokens.textPrimary}`}>Developer</h3>
            <p className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Dev tools</p>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <IconEditableText
                mode={mode}
                value={blockContent.enterprise_icon || '🏢'}
                onEdit={(value) => handleCategoryIconEdit('enterprise', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                iconSize="xl"
                className="text-4xl"
                placeholder="🏢"
                sectionId={sectionId}
                elementKey="enterprise_icon"
              />
            </div>
            <h3 className={`font-semibold ${colorTokens.textPrimary}`}>Enterprise</h3>
            <p className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Business tools</p>
          </div>
        </div>

        {/* Carousel Rows */}
        <div className="space-y-6">
          {integrationRows.map((row, index) => (
            <CarouselRow
              key={index}
              integrations={row.integrations}
              direction={row.direction}
              speed={row.speed}
              colorTokens={colorTokens}
              highlightedIntegration={highlightedIntegration}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <div className={`text-3xl font-bold ${colorTokens.textPrimary} mb-2`}>500+</div>
            <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Integrations</div>
          </div>
          <div>
            <div className={`text-3xl font-bold ${colorTokens.textPrimary} mb-2`}>99.9%</div>
            <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Uptime</div>
          </div>
          <div>
            <div className={`text-3xl font-bold ${colorTokens.textPrimary} mb-2`}>5min</div>
            <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Setup Time</div>
          </div>
          <div>
            <div className={`text-3xl font-bold ${colorTokens.textPrimary} mb-2`}>24/7</div>
            <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Support</div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <p className={`${dynamicTextColors?.muted || colorTokens.textMuted} text-sm mb-4`}>
            Don't see your tool? We add new integrations every week.
          </p>
          <button className={`${colorTokens.ctaBg} text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity`}>
            Request Integration
          </button>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'BadgeCarousel',
  category: 'Integration Sections',
  description: 'Scrolling carousel of integration badges with animated movement and highlighting',
  tags: ['integration', 'carousel', 'animated', 'badges', 'visual'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'complex',
  estimatedBuildTime: '40 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'featured_integrations', label: 'Featured Integrations (pipe separated, prefix with emoji)', type: 'text', required: true },
    { key: 'popular_integrations', label: 'Popular Integrations (pipe separated, prefix with emoji)', type: 'text', required: true },
    { key: 'developer_tools', label: 'Developer Tools (pipe separated, prefix with emoji)', type: 'text', required: true },
    { key: 'enterprise_tools', label: 'Enterprise Tools (pipe separated, prefix with emoji)', type: 'text', required: true }
  ],
  
  features: [
    'Animated scrolling carousel with multiple rows',
    'Random integration highlighting for attention',
    'Emoji-prefixed categorization',
    'Directional scrolling animations',
    'Trust-building statistics section'
  ],
  
  useCases: [
    'Showcase large number of integrations visually',
    'Create dynamic, engaging integration display',
    'Build trust through comprehensive tool support',
    'Highlight popular and featured integrations'
  ]
};