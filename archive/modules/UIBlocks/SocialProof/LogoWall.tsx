// components/layout/LogoWall.tsx
// V2 Tiered Hierarchy Design: PRIMARY (logos) > SECONDARY (press) > TERTIARY (certs + stats)

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';
import { Check } from 'lucide-react';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';

// V2 Type definitions
interface Company {
  id: string;
  name: string;
  logo_url: string;
}

interface Stat {
  id: string;
  value: string;
  label: string;
}

interface MediaMention {
  id: string;
  name: string;
  quote?: string;
}

interface Certification {
  id: string;
  code: string;
  label: string;
}

// Content interface - V2 tiered hierarchy
interface LogoWallContent {
  headline: string;
  subheadline?: string;
  show_press?: boolean;   // Secondary tier
  show_badges?: boolean;  // Tertiary tier (certs + stats)
  // Collections
  companies: Company[];
  stats: Stat[];
  media_mentions: MediaMention[];
  certifications: Certification[];
}

// Content schema with defaults
// Constraints
const CONSTRAINTS = {
  companies: { min: 4, max: 12 },
  stats: { min: 0, max: 3 },
  media_mentions: { min: 0, max: 5 },
  certifications: { min: 0, max: 5 },
};

export default function LogoWall(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    handleContentUpdate,
  } = useLayoutComponent<LogoWallContent>({
    ...props,
  });

  // Theme detection
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Adaptive card styles based on section background
  const cardStyles = React.useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiBlockTheme
  }), [sectionBackground, uiBlockTheme]);

  // Collections with fallbacks
  const companies: Company[] = blockContent.companies || [];
  const stats: Stat[] = blockContent.stats || [];
  const mediaMentions: MediaMention[] = blockContent.media_mentions || [];
  const certifications: Certification[] = blockContent.certifications || [];

  // Constraint checks
  const canRemoveCompany = companies.length > CONSTRAINTS.companies.min;
  const canAddCompany = companies.length < CONSTRAINTS.companies.max;
  const canAddStat = stats.length < CONSTRAINTS.stats.max;
  const canAddMedia = mediaMentions.length < CONSTRAINTS.media_mentions.max;
  const canAddCert = certifications.length < CONSTRAINTS.certifications.max;

  // Handlers - V2: use (handleContentUpdate as any) for array types
  const handleUpdateCompany = (id: string, field: keyof Company, value: string) => {
    (handleContentUpdate as any)('companies', companies.map(c => c.id === id ? { ...c, [field]: value } : c));
  };
  const handleRemoveCompany = (id: string) => {
    if (canRemoveCompany) (handleContentUpdate as any)('companies', companies.filter(c => c.id !== id));
  };
  const handleAddCompany = () => {
    if (canAddCompany) (handleContentUpdate as any)('companies', [...companies, { id: `c${Date.now()}`, name: 'New Company', logo_url: '' }]);
  };

  const handleUpdateStat = (id: string, field: keyof Stat, value: string) => {
    (handleContentUpdate as any)('stats', stats.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  const handleRemoveStat = (id: string) => {
    (handleContentUpdate as any)('stats', stats.filter(s => s.id !== id));
  };
  const handleAddStat = () => {
    if (canAddStat) (handleContentUpdate as any)('stats', [...stats, { id: `s${Date.now()}`, value: '100+', label: 'metric' }]);
  };

  const handleUpdateMedia = (id: string, field: keyof MediaMention, value: string) => {
    (handleContentUpdate as any)('media_mentions', mediaMentions.map(m => m.id === id ? { ...m, [field]: value } : m));
  };
  const handleRemoveMedia = (id: string) => {
    (handleContentUpdate as any)('media_mentions', mediaMentions.filter(m => m.id !== id));
  };
  const handleAddMedia = () => {
    if (canAddMedia) (handleContentUpdate as any)('media_mentions', [...mediaMentions, { id: `m${Date.now()}`, name: 'Publication', quote: '' }]);
  };

  const handleUpdateCert = (id: string, field: keyof Certification, value: string) => {
    (handleContentUpdate as any)('certifications', certifications.map(c => c.id === id ? { ...c, [field]: value } : c));
  };
  const handleRemoveCert = (id: string) => {
    (handleContentUpdate as any)('certifications', certifications.filter(c => c.id !== id));
  };
  const handleAddCert = () => {
    if (canAddCert) (handleContentUpdate as any)('certifications', [...certifications, { id: `cert${Date.now()}`, code: 'NEW', label: 'Certification' }]);
  };

  // Visibility
  const showSecondary = blockContent.show_press !== false && (mediaMentions.length > 0 || mode === 'edit');
  const showTertiary = blockContent.show_badges !== false && (certifications.length > 0 || stats.length > 0 || mode === 'edit');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LogoWall"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
            className="mb-3"
          />
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
              className={`max-w-2xl mx-auto ${cardStyles.textBody}`}
              placeholder="Add subheadline..."
            />
          )}
        </div>

        {/* PRIMARY: Logo Grid - Flexbox centered (no orphans) */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className={`group relative w-32 h-20 ${cardStyles.bg} ${cardStyles.blur} rounded-lg ${cardStyles.border} ${cardStyles.shadow} ${cardStyles.hoverEffect} transition-all flex items-center justify-center`}
            >
              <LogoEditableComponent
                mode={mode}
                logoUrl={company.logo_url}
                onLogoChange={(url) => handleUpdateCompany(company.id, 'logo_url', url)}
                companyName={company.name}
                size="sm"
                sectionId={sectionId}
                elementKey={`logo_${company.id}`}
              />

              {/* Edit mode: delete button */}
              {mode !== 'preview' && canRemoveCompany && (
                <button
                  onClick={() => handleRemoveCompany(company.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              )}

              {/* Edit mode: name edit */}
              {mode !== 'preview' && (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateCompany(company.id, 'name', e.currentTarget.textContent || '')}
                  className={`absolute bottom-1 left-1 right-1 text-center text-xs ${cardStyles.textMuted} outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 truncate`}
                >
                  {company.name}
                </div>
              )}
            </div>
          ))}

          {/* Add company button */}
          {mode !== 'preview' && canAddCompany && (
            <button
              onClick={handleAddCompany}
              className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
            >
              <span className="text-2xl">+</span>
            </button>
          )}
        </div>

        {/* SECONDARY: Press Mentions - Subtle Pills */}
        {showSecondary && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <span className={`text-sm ${cardStyles.textMuted} mr-2`}>Featured in</span>
            {mediaMentions.map((mention) => (
              <div key={mention.id} className="group relative">
                {mode !== 'preview' ? (
                  <div className="flex items-center gap-2">
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateMedia(mention.id, 'name', e.currentTarget.textContent || '')}
                      className={`px-3 py-1 text-sm ${cardStyles.textBody} ${cardStyles.bg} rounded-full outline-none focus:ring-1 focus:ring-blue-300`}
                    >
                      {mention.name}
                    </div>
                    <button
                      onClick={() => handleRemoveMedia(mention.id)}
                      className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <span className={`px-3 py-1 text-sm ${cardStyles.textBody} ${cardStyles.bg} rounded-full`}>
                    {mention.name}
                  </span>
                )}
              </div>
            ))}
            {mode !== 'preview' && canAddMedia && (
              <button
                onClick={handleAddMedia}
                className="px-3 py-1 text-sm text-gray-400 border border-dashed border-gray-300 rounded-full hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + Add
              </button>
            )}
          </div>
        )}

        {/* TERTIARY: Certs + Stats - Inline Row */}
        {showTertiary && (
          <div className={`flex flex-wrap items-center justify-center gap-4 text-sm ${cardStyles.textMuted}`}>
            {/* Certifications as small badges */}
            {certifications.map((cert, idx) => (
              <React.Fragment key={cert.id}>
                <div className="group relative flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  {mode !== 'preview' ? (
                    <div className="flex items-center gap-1">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdateCert(cert.id, 'label', e.currentTarget.textContent || '')}
                        className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                      >
                        {cert.label}
                      </div>
                      <button
                        onClick={() => handleRemoveCert(cert.id)}
                        className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span>{cert.label}</span>
                  )}
                </div>
                {/* Separator if there are stats or more certs */}
                {(idx < certifications.length - 1 || stats.length > 0) && (
                  <span className="text-gray-300">•</span>
                )}
              </React.Fragment>
            ))}

            {/* Add cert button */}
            {mode !== 'preview' && canAddCert && certifications.length > 0 && (
              <>
                <button
                  onClick={handleAddCert}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  + cert
                </button>
                {stats.length > 0 && <span className="text-gray-300">•</span>}
              </>
            )}

            {/* Stats inline */}
            {stats.map((stat, idx) => (
              <React.Fragment key={stat.id}>
                <div className="group relative flex items-center gap-1">
                  {mode !== 'preview' ? (
                    <div className="flex items-center gap-1">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdateStat(stat.id, 'value', e.currentTarget.textContent || '')}
                        className="font-medium outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                      >
                        {stat.value}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdateStat(stat.id, 'label', e.currentTarget.textContent || '')}
                        className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                      >
                        {stat.label}
                      </div>
                      <button
                        onClick={() => handleRemoveStat(stat.id)}
                        className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span><strong>{stat.value}</strong> {stat.label}</span>
                  )}
                </div>
                {idx < stats.length - 1 && <span className="text-gray-300">•</span>}
              </React.Fragment>
            ))}

            {/* Add stat button */}
            {mode !== 'preview' && canAddStat && (
              <button
                onClick={handleAddStat}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                + stat
              </button>
            )}

            {/* Add cert if none exist yet */}
            {mode !== 'preview' && canAddCert && certifications.length === 0 && (
              <button
                onClick={handleAddCert}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                + certification
              </button>
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// Component metadata
export const componentMeta = {
  name: 'LogoWall',
  category: 'Social Proof',
  description: 'Tiered social proof: logos (primary), press (secondary), certs+stats (tertiary)',
  tags: ['logos', 'social-proof', 'trust'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  features: [
    'Tiered visual hierarchy',
    'Grayscale logo placeholders',
    'Press mentions as pills',
    'Inline certifications and stats',
  ],
  contentFields: [
    { key: 'headline', label: 'Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'companies', label: 'Company Logos', type: 'array', required: true },
    { key: 'media_mentions', label: 'Press Mentions', type: 'array', required: false },
    { key: 'certifications', label: 'Certifications', type: 'array', required: false },
    { key: 'stats', label: 'Stats', type: 'array', required: false },
  ],
};
