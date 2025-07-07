// /app/edit/[token]/components/ui/BackgroundContextPreview.tsx
"use client";

import React from 'react';
import type { ColorTokens, BackgroundSystem } from '@/types/core';

interface BackgroundContextPreviewProps {
  currentTokens: ColorTokens;
  previewTokens: ColorTokens;
  backgroundSystem: BackgroundSystem | null;
  showComparison?: boolean;
}

interface BackgroundContext {
  id: string;
  label: string;
  description: string;
  background: string;
  textColor: string;
}

export function BackgroundContextPreview({
  currentTokens,
  previewTokens,
  backgroundSystem,
  showComparison = true,
}: BackgroundContextPreviewProps) {
  
  const getBackgroundContexts = (): BackgroundContext[] => {
    if (!backgroundSystem) {
      return [
        { id: 'white', label: 'White Background', description: 'Standard content areas', background: 'bg-white', textColor: 'text-gray-900' },
        { id: 'light', label: 'Light Background', description: 'Subtle sections', background: 'bg-gray-50', textColor: 'text-gray-900' },
        { id: 'dark', label: 'Dark Background', description: 'Headers and footers', background: 'bg-gray-900', textColor: 'text-white' },
      ];
    }

    return [
      {
        id: 'primary',
        label: 'Primary Background',
        description: 'Hero sections, main CTAs',
        background: backgroundSystem.primary,
        textColor: backgroundSystem.primary.includes('dark') || backgroundSystem.primary.includes('900') || backgroundSystem.primary.includes('800') 
          ? previewTokens.textOnDark 
          : previewTokens.textOnLight,
      },
      {
        id: 'secondary',
        label: 'Secondary Background',
        description: 'Feature sections, content areas',
        background: backgroundSystem.secondary,
        textColor: backgroundSystem.secondary.includes('dark') || backgroundSystem.secondary.includes('900') || backgroundSystem.secondary.includes('800')
          ? previewTokens.textOnDark 
          : previewTokens.textOnLight,
      },
      {
        id: 'neutral',
        label: 'Neutral Background',
        description: 'Cards, clean sections',
        background: backgroundSystem.neutral,
        textColor: previewTokens.textOnLight,
      },
      {
        id: 'divider',
        label: 'Divider Background',
        description: 'Separators, subtle sections',
        background: backgroundSystem.divider,
        textColor: previewTokens.textOnLight,
      },
    ];
  };

  const contexts = getBackgroundContexts();

  const renderPreviewCard = (context: BackgroundContext, tokens: ColorTokens, label: string) => (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-700 text-center">{label}</div>
      <div className={`${context.background} p-4 rounded-lg border border-gray-200 space-y-3`}>
        {/* Text Hierarchy */}
        <div className="space-y-2">
          <h3 className={`text-lg font-bold ${context.textColor}`}>
            Main Headline
          </h3>
          <p className={`text-sm ${tokens.textSecondary}`}>
            Secondary text content that provides additional information
          </p>
          <p className={`text-xs ${tokens.textMuted}`}>
            Muted text for captions and less important details
          </p>
        </div>

        {/* Interactive Elements */}
        <div className="space-y-2">
          <button className={`${tokens.ctaBg} ${tokens.ctaText} px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:${tokens.ctaHover}`}>
            Primary CTA
          </button>
          
          <div className="flex items-center space-x-3">
            <button className={`${tokens.ctaSecondary} ${tokens.ctaSecondaryText} px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:${tokens.ctaSecondaryHover}`}>
              Secondary
            </button>
            
            <a href="#" className={`${tokens.link} text-sm underline transition-colors hover:${tokens.linkHover}`}>
              Example Link
            </a>
          </div>
        </div>

        {/* Card Example */}
        <div className={`${tokens.surfaceCard} p-3 rounded-lg border ${tokens.borderDefault}`}>
          <div className={`text-sm font-medium ${tokens.textPrimary} mb-1`}>
            Card Title
          </div>
          <div className={`text-xs ${tokens.textSecondary}`}>
            Content inside a card or elevated surface
          </div>
        </div>
      </div>
    </div>
  );

  if (!backgroundSystem && contexts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2">No Background Context</p>
        <p className="text-xs text-gray-600">Select a background system to see color previews</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Background Context Preview</h4>
        <p className="text-xs text-gray-600">
          See how your colors look across different background types
        </p>
      </div>

      {/* Context Grid */}
      <div className="space-y-6">
        {contexts.map((context) => (
          <div key={context.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">{context.label}</div>
                <div className="text-xs text-gray-500">{context.description}</div>
              </div>
              <div className={`w-4 h-4 rounded border border-gray-200 ${context.background}`} />
            </div>

            {showComparison ? (
              <div className="grid grid-cols-2 gap-4">
                {renderPreviewCard(context, currentTokens, 'Current')}
                {renderPreviewCard(context, previewTokens, 'New')}
              </div>
            ) : (
              <div className="max-w-md">
                {renderPreviewCard(context, previewTokens, 'Preview')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Context Information */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm font-medium text-blue-800 mb-2">Background Context Guide</div>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Primary: Hero sections, main call-to-action areas</li>
          <li>• Secondary: Feature sections, content blocks</li>
          <li>• Neutral: Cards, testimonials, clean sections</li>
          <li>• Divider: Separators, subtle background elements</li>
        </ul>
      </div>

      {/* Accessibility Note */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-green-800">Automatic Text Adaptation</div>
            <div className="text-xs text-green-700 mt-1">
              Text colors automatically adjust based on background brightness to maintain readability and accessibility standards.
            </div>
          </div>
        </div>
      </div>

      {/* Performance Note */}
      {backgroundSystem && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Background System Info</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-600">Base Color</div>
              <div className="font-mono bg-white px-2 py-1 rounded">{backgroundSystem.baseColor}</div>
            </div>
            <div>
              <div className="text-gray-600">Accent Color</div>
              <div className="font-mono bg-white px-2 py-1 rounded">{backgroundSystem.accentColor}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}