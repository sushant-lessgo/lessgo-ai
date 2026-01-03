// components/layout/SocialProofStrip.tsx
// Compact social proof strip - Social Proof component

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData } from '@/utils/dataParsingUtils';
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';
import IconEditableText from '@/components/ui/IconEditableText';

// Content interface for type safety
interface SocialProofStripContent {
  headline: string;
  proof_stats: string;
  stat_labels?: string;
  company_logos?: string;
  company_names?: string;
  logo_urls: string; // JSON structure: {"CompanyName": "logoUrl"}
  trust_badge_1?: string;
  trust_badge_2?: string;
  trust_badge_3?: string;
  rating_display?: string;
}

// Proof stat structure
interface ProofStat {
  id: string;
  index: number;
  value: string;
  label: string;
}

// Company structure
interface Company {
  id: string;
  index: number;
  name: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Trusted by Leading Companies Worldwide' 
  },
  proof_stats: { 
    type: 'string' as const, 
    default: '10,000+|99.9%|24/7|50M+' 
  },
  stat_labels: { 
    type: 'string' as const, 
    default: 'Happy Customers|Uptime Guarantee|Support Available|Data Points Processed' 
  },
  company_logos: { 
    type: 'string' as const, 
    default: '' 
  },
  company_names: { 
    type: 'string' as const, 
    default: 'Google|Microsoft|Amazon|Meta|Netflix|Apple|Tesla|Shopify|Stripe|Slack|Zoom|Adobe' 
  },
  logo_urls: { 
    type: 'string' as const, 
    default: '{}' // JSON object for logo URLs
  },
  trust_badge_1: {
    type: 'string' as const,
    default: 'SOC 2 Certified'
  },
  trust_badge_2: {
    type: 'string' as const,
    default: 'Enterprise Security'
  },
  trust_badge_3: {
    type: 'string' as const,
    default: 'GDPR Compliant'
  },
  rating_display: {
    type: 'string' as const,
    default: '4.9/5 Rating'
  }
};

// Parse proof stat data from pipe-separated strings
const parseProofData = (stats: string, labels: string): ProofStat[] => {
  const statList = parsePipeData(stats);
  const labelList = parsePipeData(labels);
  
  return statList.map((value, index) => ({
    id: `stat-${index}`,
    index,
    value: value.trim(),
    label: labelList[index] || `Metric ${index + 1}`
  }));
};

// Parse company data from pipe-separated strings
const parseCompanyData = (names: string): Company[] => {
  const nameList = parsePipeData(names);
  
  return nameList.map((name, index) => ({
    id: `company-${index}`,
    index,
    name: name.trim()
  }));
};

// Parse logo URLs from JSON string
const parseLogoUrls = (logoUrlsJson: string): Record<string, string> => {
  try {
    return JSON.parse(logoUrlsJson || '{}');
  } catch {
    return {};
  }
};

// Update logo URLs JSON string
const updateLogoUrls = (logoUrlsJson: string, companyName: string, logoUrl: string): string => {
  const logoUrls = parseLogoUrls(logoUrlsJson);
  if (logoUrl === '') {
    delete logoUrls[companyName];
  } else {
    logoUrls[companyName] = logoUrl;
  }
  return JSON.stringify(logoUrls);
};

// Get logo URL for a company
const getCompanyLogoUrl = (logoUrlsJson: string, companyName: string): string => {
  const logoUrls = parseLogoUrls(logoUrlsJson);
  return logoUrls[companyName] || '';
};

// Update company names and clean up orphaned logos
const updateCompanyNames = (oldNames: string, newNames: string, logoUrlsJson: string): { names: string; logoUrls: string } => {
  const oldCompanies = parsePipeData(oldNames).map(name => name.trim());
  const newCompanies = parsePipeData(newNames).map(name => name.trim());
  const logoUrls = parseLogoUrls(logoUrlsJson);
  
  // Remove logos for companies that no longer exist
  const cleanedLogoUrls: Record<string, string> = {};
  newCompanies.forEach(company => {
    if (logoUrls[company]) {
      cleanedLogoUrls[company] = logoUrls[company];
    }
  });
  
  return {
    names: newCompanies.join('|'),
    logoUrls: JSON.stringify(cleanedLogoUrls)
  };
};

// Stat Display Component - Made Editable
const StatDisplay = React.memo(({
  stat,
  mode,
  dynamicTextColors,
  h2Style,
  bodyStyle,
  onStatEdit,
  onLabelEdit,
  colorTokens,
  backgroundType,
  sectionBackground,
  sectionId,
  statNumberColor
}: {
  stat: ProofStat;
  mode: 'edit' | 'preview';
  dynamicTextColors: any;
  h2Style: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  onStatEdit: (index: number, value: string) => void;
  onLabelEdit: (index: number, value: string) => void;
  colorTokens: any;
  backgroundType: string;
  sectionBackground: string;
  sectionId: string;
  statNumberColor: string;
}) => {
  return (
    <div className="text-center">
      {mode === 'edit' ? (
        <>
          <EditableAdaptiveText
            mode={mode}
            value={stat.value}
            onEdit={(value) => onStatEdit(stat.index, value)}
            backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'primary')) as 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme'}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{...h2Style, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 'bold'}}
            className="mb-1"
            placeholder="0"
            sectionBackground={sectionBackground}
            sectionId={sectionId}
            elementKey={`proof_stat_${stat.index}`}
          />
          <EditableAdaptiveText
            mode={mode}
            value={stat.label}
            onEdit={(value) => onLabelEdit(stat.index, value)}
            backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'primary')) as 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme'}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{...bodyStyle, fontSize: '0.875rem'}}
            placeholder="Label"
            sectionBackground={sectionBackground}
            sectionId={sectionId}
            elementKey={`stat_label_${stat.index}`}
          />
        </>
      ) : (
        <>
          <div
            style={{...h2Style, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: statNumberColor}}
            className="mb-1"
          >
            {stat.value}
          </div>
          <div style={{...bodyStyle, fontSize: '0.875rem'}} className={`${dynamicTextColors?.muted || 'text-gray-600'}`}>
            {stat.label}
          </div>
        </>
      )}
    </div>
  );
});
StatDisplay.displayName = 'StatDisplay';

// Company Logo Component
const CompanyLogo = React.memo(({ 
  company, 
  dynamicTextColors,
  bodyStyle
}: { 
  company: Company;
  dynamicTextColors: any;
  bodyStyle: React.CSSProperties;
}) => {
  
  // Generate simple logo placeholder
  const getLogoInitials = (companyName: string) => {
    const words = companyName.split(' ').filter(word => word.length > 0);
    if (words.length === 1) {
      return companyName.substring(0, Math.min(2, companyName.length)).toUpperCase();
    } else {
      return words
        .slice(0, 2)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
    }
  };

  const initials = getLogoInitials(company.name);
  
  return (
    <div className="flex items-center justify-center px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded flex items-center justify-center">
          <span style={{...bodyStyle, fontSize: '0.75rem', fontWeight: 'bold'}} className="text-gray-700">
            {initials}
          </span>
        </div>
        <span style={{...bodyStyle, fontSize: '0.875rem'}} className={`${dynamicTextColors?.body || 'text-gray-700'}`}>
          {company.name}
        </span>
      </div>
    </div>
  );
});
CompanyLogo.displayName = 'CompanyLogo';

export default function SocialProofStrip(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<SocialProofStripContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based colors for stats, company logos, and trust elements
  const getSocialProofColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        statNumberColor: '#ea580c',        // orange-600
        companyLogoBg: '#fed7aa',          // orange-200
        companyLogoBorder: '#fed7aa',      // orange-200
        companyLogoHover: '#fdba74',       // orange-300
        addButtonBorder: '#fed7aa',        // orange-200
        trustBadgeBg: '#ffedd5',           // orange-50
        trustBadgeIcon: '#ea580c',         // orange-600
        ratingStarColor: '#f59e0b'         // amber-500
      },
      cool: {
        statNumberColor: '#2563eb',        // blue-600
        companyLogoBg: '#bfdbfe',          // blue-200
        companyLogoBorder: '#bfdbfe',      // blue-200
        companyLogoHover: '#93c5fd',       // blue-300
        addButtonBorder: '#bfdbfe',        // blue-200
        trustBadgeBg: '#dbeafe',           // blue-50
        trustBadgeIcon: '#2563eb',         // blue-600
        ratingStarColor: '#3b82f6'         // blue-500
      },
      neutral: {
        statNumberColor: '#374151',        // gray-700
        companyLogoBg: '#e5e7eb',          // gray-200
        companyLogoBorder: '#e5e7eb',      // gray-200
        companyLogoHover: '#d1d5db',       // gray-300
        addButtonBorder: '#d1d5db',        // gray-300
        trustBadgeBg: '#f9fafb',           // gray-50
        trustBadgeIcon: '#374151',         // gray-700
        ratingStarColor: '#f59e0b'         // amber-500
      }
    }[theme];
  };

  const colors = getSocialProofColors(theme);

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h2Style = getTypographyStyle('h2');
  const bodyStyle = getTypographyStyle('body');

  // Parse proof stats from pipe-separated strings
  const proofStats = parseProofData(
    blockContent.proof_stats || '',
    blockContent.stat_labels || ''
  );

  // Parse company data from pipe-separated strings
  const companies = parseCompanyData(blockContent.company_names || '');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SocialProofStrip"
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
            className="mb-8"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />
        </div>

        {/* Stats Section */}
        {proofStats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {proofStats.slice(0, 4).map((stat) => (
              <StatDisplay
                key={stat.id}
                stat={stat}
                mode={mode}
                dynamicTextColors={dynamicTextColors}
                h2Style={h2Style}
                bodyStyle={bodyStyle}
                statNumberColor={colors.statNumberColor}
                onStatEdit={(index, value) => {
                  const currentStats = parsePipeData(blockContent.proof_stats || '');
                  currentStats[index] = value;
                  handleContentUpdate('proof_stats', currentStats.join('|'));
                }}
                onLabelEdit={(index, value) => {
                  const currentLabels = parsePipeData(blockContent.stat_labels || '');
                  currentLabels[index] = value;
                  handleContentUpdate('stat_labels', currentLabels.join('|'));
                }}
                colorTokens={colorTokens}
                backgroundType={props.backgroundType || 'primary'}
                sectionBackground={sectionBackground}
                sectionId={sectionId}
              />
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-12"></div>

        {/* Company Logos */}
        {companies.length > 0 && (
          <div>
            <div style={{...bodyStyle, fontSize: '0.875rem'}} className={`text-center ${dynamicTextColors?.muted || 'text-gray-600'} mb-6`}>
              Trusted by industry leaders
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {companies.slice(0, 8).map((company) => {
                // Every company gets an editable logo using dynamic system
                const logoUrl = getCompanyLogoUrl(blockContent.logo_urls, company.name);
                
                return (
                  // All companies are now editable with isolated hover
                  <div
                    key={company.id}
                    className="flex items-center justify-center px-4 py-2 backdrop-blur-sm rounded-lg border transition-all duration-300"
                    style={{
                      backgroundColor: `${colors.companyLogoBg}0D`,
                      borderColor: `${colors.companyLogoBorder}33`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.companyLogoHover}33`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.companyLogoBg}0D`}
                  >
                    <div className="flex items-center space-x-2">
                      <LogoEditableComponent
                        mode={mode}
                        logoUrl={logoUrl}
                        onLogoChange={(url) => {
                          const updatedLogoUrls = updateLogoUrls(blockContent.logo_urls, company.name, url);
                          handleContentUpdate('logo_urls', updatedLogoUrls);
                        }}
                        companyName={company.name}
                        size="sm"
                      />
                      {mode !== 'preview' ? (
                        <EditableAdaptiveText
                          mode={mode}
                          value={company.name}
                          onEdit={(value) => {
                            const currentCompanies = parsePipeData(blockContent.company_names || '');
                            currentCompanies[company.index] = value;
                            const updatedCompaniesString = currentCompanies.join('|');
                            const { logoUrls } = updateCompanyNames(blockContent.company_names || '', updatedCompaniesString, blockContent.logo_urls);
                            handleContentUpdate('company_names', updatedCompaniesString);
                            handleContentUpdate('logo_urls', logoUrls);
                          }}
                          backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                          colorTokens={colorTokens}
                          variant="body"
                          style={{...bodyStyle, fontSize: '0.875rem'}}
                          className="flex-1"
                          placeholder="Company name"
                          sectionId={sectionId}
                          elementKey={`company_name_${company.index}`}
                          sectionBackground={sectionBackground}
                        />
                      ) : (
                        <span style={{...bodyStyle, fontSize: '0.875rem'}} className={`${dynamicTextColors?.body || 'text-gray-700'} flex-1`}>
                          {company.name}
                        </span>
                      )}
                      {/* Delete Company Button */}
                      {mode !== 'preview' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm(`Delete ${company.name} completely?`)) {
                              const currentCompanies = parsePipeData(blockContent.company_names || '');
                              const updatedCompanies = currentCompanies.filter((_, idx) => idx !== company.index);
                              const updatedCompaniesString = updatedCompanies.join('|');
                              const { logoUrls } = updateCompanyNames(blockContent.company_names || '', updatedCompaniesString, blockContent.logo_urls);
                              handleContentUpdate('company_names', updatedCompaniesString);
                              handleContentUpdate('logo_urls', logoUrls);
                            }
                          }}
                          className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors ml-2"
                          title="Delete company"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Add Company Button (Edit Mode Only) */}
              {mode !== 'preview' && companies.length < 8 && (
                <div
                  className="flex items-center justify-center px-4 py-2 backdrop-blur-sm rounded-lg border-2 border-dashed transition-all duration-300"
                  style={{
                    borderColor: `${colors.addButtonBorder}4D`
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const currentCompanies = parsePipeData(blockContent.company_names || '');
                      const newCompanyName = `New Company ${currentCompanies.length + 1}`;
                      const updatedCompanies = [...currentCompanies, newCompanyName].join('|');
                      handleContentUpdate('company_names', updatedCompanies);
                    }}
                    className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Add Company</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Trust Elements */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-white/10">
          {blockContent.trust_badge_1 && blockContent.trust_badge_1 !== '___REMOVED___' && (
            <div className="flex items-center space-x-2">
              {mode !== 'preview' ? (
                <IconEditableText
                  mode={mode}
                  value={blockContent.trust_badge_1 || '✅'}
                  onEdit={(value) => handleContentUpdate('trust_badge_1', value)}
                  backgroundType={props.backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-base text-green-500"
                  sectionId={sectionId}
                  elementKey="trust_badge_1"
                />
              ) : (
                <span className="text-base text-green-500">
                  {blockContent.trust_badge_1 || '✅'}
                </span>
              )}
              {mode !== 'preview' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.trust_badge_1}
                  onEdit={(value) => handleContentUpdate('trust_badge_1', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...bodyStyle, fontSize: '0.75rem'}}
                  placeholder="Trust badge"
                  sectionBackground={sectionBackground}
                  sectionId={sectionId}
                  elementKey="trust_badge_1"
                />
              ) : (
                <span style={{...bodyStyle, fontSize: '0.75rem'}} className={`${dynamicTextColors?.muted || 'text-gray-600'}`}>
                  {blockContent.trust_badge_1}
                </span>
              )}
            </div>
          )}
          
          {blockContent.trust_badge_2 && blockContent.trust_badge_2 !== '___REMOVED___' && (
            <div className="flex items-center space-x-2">
              {mode !== 'preview' ? (
                <IconEditableText
                  mode={mode}
                  value={blockContent.trust_badge_2 || '🔒'}
                  onEdit={(value) => handleContentUpdate('trust_badge_2', value)}
                  backgroundType={props.backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-base text-blue-500"
                  sectionId={sectionId}
                  elementKey="trust_badge_2"
                />
              ) : (
                <span className="text-base text-blue-500">
                  {blockContent.trust_badge_2 || '🔒'}
                </span>
              )}
              {mode !== 'preview' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.trust_badge_2}
                  onEdit={(value) => handleContentUpdate('trust_badge_2', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...bodyStyle, fontSize: '0.75rem'}}
                  placeholder="Trust badge"
                  sectionBackground={sectionBackground}
                  sectionId={sectionId}
                  elementKey="trust_badge_2"
                />
              ) : (
                <span style={{...bodyStyle, fontSize: '0.75rem'}} className={`${dynamicTextColors?.muted || 'text-gray-600'}`}>
                  {blockContent.trust_badge_2}
                </span>
              )}
            </div>
          )}
          
          {blockContent.trust_badge_3 && blockContent.trust_badge_3 !== '___REMOVED___' && (
            <div className="flex items-center space-x-2">
              {mode !== 'preview' ? (
                <IconEditableText
                  mode={mode}
                  value={blockContent.trust_badge_3 || '🛡️'}
                  onEdit={(value) => handleContentUpdate('trust_badge_3', value)}
                  backgroundType={props.backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-base text-purple-500"
                  sectionId={sectionId}
                  elementKey="trust_badge_3"
                />
              ) : (
                <span className="text-base text-purple-500">
                  {blockContent.trust_badge_3 || '🛡️'}
                </span>
              )}
              {mode !== 'preview' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.trust_badge_3}
                  onEdit={(value) => handleContentUpdate('trust_badge_3', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...bodyStyle, fontSize: '0.75rem'}}
                  placeholder="Trust badge"
                  sectionBackground={sectionBackground}
                  sectionId={sectionId}
                  elementKey="trust_badge_3"
                />
              ) : (
                <span style={{...bodyStyle, fontSize: '0.75rem'}} className={`${dynamicTextColors?.muted || 'text-gray-600'}`}>
                  {blockContent.trust_badge_3}
                </span>
              )}
            </div>
          )}
          
          {blockContent.rating_display && blockContent.rating_display !== '___REMOVED___' && (
            <div className="flex items-center space-x-1">
              {mode !== 'preview' ? (
                <IconEditableText
                  mode={mode}
                  value={blockContent.rating_display || '⭐'}
                  onEdit={(value) => handleContentUpdate('rating_display', value)}
                  backgroundType={props.backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-xs text-yellow-400 mr-1"
                  sectionId={sectionId}
                  elementKey="rating_display"
                />
              ) : (
                [1,2,3,4,5].map(i => (
                  <span key={i} className="text-xs text-yellow-400">
                    {blockContent.rating_display || '⭐'}
                  </span>
                ))
              )}
            {mode !== 'preview' ? (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.rating_display || ''}
                onEdit={(value) => handleContentUpdate('rating_display', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="text-xs ml-1"
                placeholder="4.9/5 Rating"
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                elementKey="rating_display"
              />
            ) : (
              <span className={`text-xs ${dynamicTextColors?.muted || 'text-gray-600'} ml-1`}>
                {blockContent.rating_display}
              </span>
            )}
            </div>
          )}
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'SocialProofStrip',
  category: 'Social Proof',
  description: 'Compact horizontal strip showcasing key metrics, trusted companies, and security badges',
  tags: ['social-proof', 'metrics', 'companies', 'trust', 'compact'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'proof_stats', label: 'Proof Statistics (pipe separated)', type: 'text', required: true },
    { key: 'stat_labels', label: 'Stat Labels (pipe separated)', type: 'text', required: true },
    { key: 'company_logos', label: 'Company Logos (URLs, pipe separated)', type: 'text', required: false },
    { key: 'company_names', label: 'Company Names (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Compact horizontal layout perfect for header/footer',
    'Key metrics display with labels',
    'Company logo placeholders with company names',
    'Trust badges and security indicators',
    'Responsive design for all screen sizes'
  ],
  
  useCases: [
    'Header social proof strip',
    'Footer trust indicators',
    'Landing page credibility section',
    'Enterprise sales page validation',
    'Product page trust building'
  ]
};