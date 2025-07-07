// /app/edit/[token]/components/ui/AccessibilityPreview.tsx
"use client";

import React, { useMemo } from 'react';
import { analyzeColorAccessibility, calculateContrastRatio, checkWCAGCompliance } from './colorAccessibilityUtils';
import type { ColorTokens, BackgroundSystem } from '@/types/core';

interface AccessibilityPreviewProps {
  tokens: ColorTokens;
  backgroundSystem: BackgroundSystem | null;
  showDetails?: boolean;
  compact?: boolean;
}

interface ContrastExample {
  id: string;
  label: string;
  foreground: string;
  background: string;
  isLargeText: boolean;
  element: React.ReactNode;
}

export function AccessibilityPreview({
  tokens,
  backgroundSystem,
  showDetails = true,
  compact = false,
}: AccessibilityPreviewProps) {
  
  const analysis = useMemo(() => {
    if (!backgroundSystem) return null;
    return analyzeColorAccessibility(tokens, backgroundSystem);
  }, [tokens, backgroundSystem]);

  const contrastExamples = useMemo((): ContrastExample[] => {
    const examples = [
      {
        id: 'primary-text',
        label: 'Primary Text',
        foreground: tokens.textPrimary,
        background: 'bg-white',
        isLargeText: false,
        element: (
          <div className="p-3 bg-white rounded border">
            <h3 className={`text-lg font-bold ${tokens.textPrimary} mb-2`}>
              Primary Headline Text
            </h3>
            <p className={`text-sm ${tokens.textPrimary}`}>
              This is how primary text appears on white backgrounds.
            </p>
          </div>
        ),
      },
      {
        id: 'secondary-text',
        label: 'Secondary Text',
        foreground: tokens.textSecondary,
        background: 'bg-white',
        isLargeText: false,
        element: (
          <div className="p-3 bg-white rounded border">
            <p className={`text-sm ${tokens.textSecondary} mb-2`}>
              Secondary text for descriptions and supporting content.
            </p>
            <p className={`text-xs ${tokens.textMuted}`}>
              Muted text for captions and subtle information.
            </p>
          </div>
        ),
      },
      {
        id: 'cta-button',
        label: 'Primary CTA',
        foreground: tokens.ctaText,
        background: tokens.ctaBg.replace('bg-', ''),
        isLargeText: false,
        element: (
          <button className={`${tokens.ctaBg} ${tokens.ctaText} px-6 py-3 rounded-lg font-medium`}>
            Get Started Today
          </button>
        ),
      },
      {
        id: 'links',
        label: 'Links',
        foreground: tokens.link,
        background: 'bg-white',
        isLargeText: false,
        element: (
          <div className="p-3 bg-white rounded border">
            <p className={`text-sm ${tokens.textPrimary} mb-2`}>
              Regular text with{' '}
              <a href="#" className={`${tokens.link} underline hover:${tokens.linkHover}`}>
                an example link
              </a>{' '}
              embedded within.
            </p>
          </div>
        ),
      },
    ];

    if (backgroundSystem) {
      examples.push({
        id: 'text-on-primary',
        label: 'Text on Primary Background',
        foreground: tokens.textOnDark,
        background: backgroundSystem.primary,
        isLargeText: false,
        element: (
          <div className={`${backgroundSystem.primary} p-3 rounded border`}>
            <h3 className={`text-lg font-bold ${tokens.textOnDark} mb-2`}>
              Hero Section Headline
            </h3>
            <p className={`text-sm ${tokens.textOnDark} opacity-90`}>
              Text content on primary background color.
            </p>
          </div>
        ),
      });
    }

    return examples;
  }, [tokens, backgroundSystem]);

  const getContrastRating = (ratio: number): {
    color: string;
    label: string;
    icon: string;
  } => {
    if (ratio >= 7) {
      return { color: 'text-green-600', label: 'AAA', icon: '✓✓' };
    } else if (ratio >= 4.5) {
      return { color: 'text-green-600', label: 'AA', icon: '✓' };
    } else if (ratio >= 3) {
      return { color: 'text-yellow-600', label: 'AA Large', icon: '⚠' };
    } else {
      return { color: 'text-red-600', label: 'Fail', icon: '✗' };
    }
  };

  if (!backgroundSystem) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2">Accessibility Check Unavailable</p>
        <p className="text-xs text-gray-600">Background system required for accessibility analysis</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Compact Overview */}
        {analysis && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-700">Accessibility Score</div>
              <div className="text-xs text-gray-600">{analysis.overall.score}% WCAG compliance</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              analysis.overall.passesWCAG 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {analysis.overall.grade}
            </div>
          </div>
        )}

        {/* Quick Contrast Checks */}
        <div className="grid grid-cols-2 gap-3">
          {contrastExamples.slice(0, 4).map((example) => {
            const ratio = calculateContrastRatio(example.foreground, `bg-${example.background}`);
            const rating = getContrastRating(ratio);
            
            return (
              <div key={example.id} className="p-2 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">{example.label}</span>
                  <span className={`text-xs ${rating.color}`}>
                    {rating.icon} {rating.label}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {ratio.toFixed(1)}:1
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Accessibility Analysis</h4>
        <p className="text-xs text-gray-600">
          WCAG 2.1 compliance check for contrast ratios and readability
        </p>
      </div>

      {/* Overall Score */}
      {analysis && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-gray-700">Overall Accessibility</div>
              <div className="text-xs text-gray-600">
                {analysis.overall.score}% compliance • {analysis.contrastChecks.length} checks performed
              </div>
            </div>
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              analysis.overall.passesWCAG 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              Grade: {analysis.overall.grade}
            </div>
          </div>

          {analysis.issues.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Issues Found:</div>
              {analysis.issues.slice(0, 3).map((issue, index) => (
                <div key={index} className={`text-xs p-2 rounded ${
                  issue.severity === 'error' ? 'bg-red-50 text-red-700' :
                  issue.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  <div className="font-medium">{issue.element}: {issue.message}</div>
                  {issue.fix && <div className="mt-1 opacity-80">{issue.fix}</div>}
                </div>
              ))}
              {analysis.issues.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{analysis.issues.length - 3} more issues
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contrast Examples */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">Contrast Validation</div>
        
        {contrastExamples.map((example) => {
          const ratio = calculateContrastRatio(example.foreground, `bg-${example.background}`);
          const compliance = checkWCAGCompliance(ratio, example.isLargeText);
          const rating = getContrastRating(ratio);
          
          return (
            <div key={example.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">{example.label}</div>
                  <div className="text-xs text-gray-500">
                    Ratio: {ratio.toFixed(2)}:1 • Required: {example.isLargeText ? '3:1' : '4.5:1'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${rating.color}`}>
                    {rating.icon} {rating.label}
                  </span>
                  {compliance.wcagLevel === 'fail' && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Needs Fix
                    </span>
                  )}
                </div>
              </div>
              
              <div className="relative">
                {example.element}
                {compliance.wcagLevel === 'fail' && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-10 border-2 border-red-300 rounded pointer-events-none" />
                )}
              </div>
              
              {compliance.recommendation && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  💡 {compliance.recommendation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* WCAG Standards Reference */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm font-medium text-blue-800 mb-2">WCAG 2.1 Standards</div>
        <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
          <div>
            <div className="font-medium">AA (Standard)</div>
            <div>• Normal text: 4.5:1 ratio</div>
            <div>• Large text: 3:1 ratio</div>
          </div>
          <div>
            <div className="font-medium">AAA (Enhanced)</div>
            <div>• Normal text: 7:1 ratio</div>
            <div>• Large text: 4.5:1 ratio</div>
          </div>
        </div>
      </div>

      {/* Color Blind Simulation Note */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-purple-800">Color Blind Considerations</div>
            <div className="text-xs text-purple-700 mt-1">
              This analysis focuses on contrast ratios. For complete accessibility, avoid relying solely on color to convey information and consider adding visual indicators like icons or patterns.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}