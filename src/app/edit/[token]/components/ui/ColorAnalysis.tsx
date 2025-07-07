// /app/edit/[token]/components/ui/ColorAnalysis.tsx
"use client";

import React from 'react';
import type { BackgroundVariation, BrandColors, ColorHarmonyInfo } from '@/types/core';

interface ColorAnalysisProps {
  variation?: BackgroundVariation | null;
  brandColors?: BrandColors | null;
  showDetailed?: boolean;
  compact?: boolean;
}

interface AccessibilityInfo {
  contrastRatio: number;
  wcagLevel: 'AAA' | 'AA' | 'fail';
  recommendations: string[];
}

interface PerformanceInfo {
  complexity: 'low' | 'medium' | 'high';
  renderingCost: number;
  optimizations: string[];
}

export function ColorAnalysis({
  variation,
  brandColors,
  showDetailed = false,
  compact = false,
}: ColorAnalysisProps) {
  if (!variation) {
    return (
      <div className="text-center py-6 text-gray-500">
        <div className="text-sm">Select a background to see color analysis</div>
      </div>
    );
  }

  const harmonyInfo = analyzeColorHarmony(variation, brandColors);
  const accessibilityInfo = analyzeAccessibility(variation);
  const performanceInfo = analyzePerformance(variation);
  const overallScore = calculateOverallScore(harmonyInfo, accessibilityInfo, performanceInfo);

  if (compact) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        {/* Overall score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Compatibility</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              overallScore >= 80 ? 'bg-green-500' :
              overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium text-gray-900">{overallScore}%</span>
          </div>
        </div>

        {/* Quick indicators */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className={`w-full h-1 rounded mb-1 ${
              harmonyInfo.score >= 80 ? 'bg-green-500' :
              harmonyInfo.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <div className="text-gray-600">Harmony</div>
          </div>
          <div className="text-center">
            <div className={`w-full h-1 rounded mb-1 ${
              accessibilityInfo.wcagLevel === 'AAA' ? 'bg-green-500' :
              accessibilityInfo.wcagLevel === 'AA' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <div className="text-gray-600">Access</div>
          </div>
          <div className="text-center">
            <div className={`w-full h-1 rounded mb-1 ${
              performanceInfo.complexity === 'low' ? 'bg-green-500' :
              performanceInfo.complexity === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <div className="text-gray-600">Perf</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Score Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Color Analysis</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Overall Score:</span>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            overallScore >= 80 ? 'bg-green-100 text-green-700' :
            overallScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          }`}>
            {overallScore}%
          </div>
        </div>
      </div>

      {/* Background Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Background Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Style:</span>
            <span className="ml-2 font-medium">{variation.variationLabel}</span>
          </div>
          <div>
            <span className="text-gray-600">Base Color:</span>
            <span className="ml-2 font-medium capitalize">{variation.baseColor}</span>
          </div>
          <div>
            <span className="text-gray-600">Archetype:</span>
            <span className="ml-2 font-medium">{formatArchetypeName(variation.archetypeId)}</span>
          </div>
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2 font-medium">
              {variation.tailwindClass.includes('gradient') ? 'Gradient' : 'Solid'}
            </span>
          </div>
        </div>
      </div>

      {/* Color Harmony Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Color Harmony</h4>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            harmonyInfo.score >= 80 ? 'bg-green-100 text-green-700' :
            harmonyInfo.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          }`}>
            {harmonyInfo.score}%
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Relationship:</span>
            <span className="text-sm font-medium capitalize">{harmonyInfo.relationship}</span>
            <RelationshipIcon relationship={harmonyInfo.relationship} />
          </div>
          <p className="text-sm text-gray-700">{harmonyInfo.description}</p>
          
          {brandColors && (
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-600 mb-2">Brand Color Comparison</div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: brandColors.primary }}
                  />
                  <span className="text-xs text-gray-600">Brand Primary</span>
                </div>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: getColorForBaseColor(variation.baseColor) }}
                  />
                  <span className="text-xs text-gray-600">Background Base</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accessibility Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Accessibility</h4>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            accessibilityInfo.wcagLevel === 'AAA' ? 'bg-green-100 text-green-700' :
            accessibilityInfo.wcagLevel === 'AA' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          }`}>
            {accessibilityInfo.wcagLevel}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Contrast Ratio:</span>
            <span className="text-sm font-medium">{accessibilityInfo.contrastRatio}:1</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                accessibilityInfo.wcagLevel === 'AAA' ? 'bg-green-500' :
                accessibilityInfo.wcagLevel === 'AA' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(accessibilityInfo.contrastRatio / 10 * 100, 100)}%` }}
            />
          </div>

          {accessibilityInfo.recommendations.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-600 mb-1">Recommendations:</div>
              <ul className="text-xs text-gray-700 space-y-0.5">
                {accessibilityInfo.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span className="text-blue-500">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Performance</h4>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            performanceInfo.complexity === 'low' ? 'bg-green-100 text-green-700' :
            performanceInfo.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          }`}>
            {performanceInfo.complexity}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rendering Cost:</span>
            <span className="text-sm font-medium">{performanceInfo.renderingCost}/100</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                performanceInfo.renderingCost <= 30 ? 'bg-green-500' :
                performanceInfo.renderingCost <= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${performanceInfo.renderingCost}%` }}
            />
          </div>

          {performanceInfo.optimizations.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-600 mb-1">Optimizations:</div>
              <ul className="text-xs text-gray-700 space-y-0.5">
                {performanceInfo.optimizations.map((opt, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span className="text-orange-500">•</span>
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Additional Insights */}
      {showDetailed && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Insights & Suggestions</h4>
          <div className="text-sm text-blue-800 space-y-1">
            {getInsights(variation, harmonyInfo, accessibilityInfo, performanceInfo, brandColors).map((insight, index) => (
              <div key={index} className="flex items-start space-x-1">
                <span className="text-blue-500 flex-shrink-0 mt-0.5">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Relationship icon component
 */
function RelationshipIcon({ relationship }: { relationship: string }) {
  const iconMap: Record<string, string> = {
    identical: '🎯',
    analogous: '🌈',
    complementary: '⚖️',
    triadic: '🔺',
    neutral: '⚪',
    clash: '⚠️',
  };

  return (
    <span className="text-sm" title={relationship}>
      {iconMap[relationship] || '❓'}
    </span>
  );
}

/**
 * Analyze color harmony between background and brand colors
 */
function analyzeColorHarmony(variation: BackgroundVariation, brandColors?: BrandColors | null): ColorHarmonyInfo {
  if (!brandColors?.primary) {
    return {
      relationship: 'neutral',
      score: 75,
      description: 'No brand colors provided for comparison. Background uses neutral harmony principles.',
    };
  }

  const brandBaseColor = extractBaseColorFromHex(brandColors.primary);
  const backgroundBaseColor = variation.baseColor;

  // Determine relationship
  let relationship: ColorHarmonyInfo['relationship'] = 'neutral';
  let score = 50;
  let description = '';

  if (brandBaseColor === backgroundBaseColor) {
    relationship = 'identical';
    score = 95;
    description = 'Perfect color match! Background and brand colors share the same base color family.';
  } else {
    const harmonious = getHarmoniousColors(brandBaseColor);
    const complementary = getComplementaryColors(brandBaseColor);
    
    if (harmonious.includes(backgroundBaseColor)) {
      relationship = 'analogous';
      score = 85;
      description = 'Excellent harmony! Background color works beautifully with your brand colors.';
    } else if (complementary.includes(backgroundBaseColor)) {
      relationship = 'complementary';
      score = 80;
      description = 'Great contrast! Background provides nice visual balance with your brand colors.';
    } else if (['gray', 'slate', 'zinc', 'neutral'].includes(backgroundBaseColor)) {
      relationship = 'neutral';
      score = 75;
      description = 'Safe choice! Neutral background works well with any brand color.';
    } else {
      relationship = 'clash';
      score = 40;
      description = 'Color clash detected. Consider choosing a background that better complements your brand.';
    }
  }

  return { relationship, score, description };
}

/**
 * Analyze accessibility aspects
 */
function analyzeAccessibility(variation: BackgroundVariation): AccessibilityInfo {
  let contrastRatio = 4.5; // Default
  let wcagLevel: 'AAA' | 'AA' | 'fail' = 'AA';
  const recommendations: string[] = [];

  // Simplified contrast analysis based on background type
  if (variation.tailwindClass.includes('gradient')) {
    if (variation.tailwindClass.includes('from-blue-500')) {
      contrastRatio = 4.8;
    } else if (variation.tailwindClass.includes('from-purple-500')) {
      contrastRatio = 5.2;
    } else if (variation.tailwindClass.includes('from-green-500')) {
      contrastRatio = 4.9;
    }
  } else if (variation.tailwindClass.includes('50')) {
    contrastRatio = 8.5;
    wcagLevel = 'AAA';
  } else if (variation.tailwindClass.includes('100')) {
    contrastRatio = 7.2;
    wcagLevel = 'AAA';
  }

  if (contrastRatio < 4.5) {
    wcagLevel = 'fail';
    recommendations.push('Increase text contrast or choose a lighter background');
  } else if (contrastRatio < 7) {
    wcagLevel = 'AA';
    recommendations.push('Consider darker text for AAA compliance');
  } else {
    wcagLevel = 'AAA';
  }

  if (variation.tailwindClass.includes('gradient')) {
    recommendations.push('Test text readability across gradient transitions');
  }

  if (['red', 'green'].includes(variation.baseColor)) {
    recommendations.push('Ensure colorblind-friendly text indicators');
  }

  return { contrastRatio, wcagLevel, recommendations };
}

/**
 * Analyze performance characteristics
 */
function analyzePerformance(variation: BackgroundVariation): PerformanceInfo {
  let complexity: 'low' | 'medium' | 'high' = 'low';
  let renderingCost = 20;
  const optimizations: string[] = [];

  if (variation.tailwindClass.includes('gradient')) {
    complexity = 'medium';
    renderingCost += 25;
    optimizations.push('Consider solid color alternative for better performance');
  }

  if (variation.tailwindClass.includes('radial-gradient') || variation.tailwindClass.includes('blur')) {
    complexity = 'high';
    renderingCost += 35;
    optimizations.push('Complex effects may impact mobile performance');
  }

  if (variation.tailwindClass.includes('backdrop-blur')) {
    renderingCost += 20;
    optimizations.push('Backdrop blur requires modern browser support');
  }

  if (variation.archetypeId.includes('matrix') || variation.archetypeId.includes('noise')) {
    complexity = 'high';
    renderingCost += 30;
    optimizations.push('Pattern-based backgrounds may cause visual fatigue');
  }

  return { complexity, renderingCost, optimizations };
}

/**
 * Calculate overall compatibility score
 */
function calculateOverallScore(
  harmony: ColorHarmonyInfo,
  accessibility: AccessibilityInfo,
  performance: PerformanceInfo
): number {
  let score = 0;
  
  // Weighted scoring
  score += harmony.score * 0.4; // 40% weight
  score += (accessibility.wcagLevel === 'AAA' ? 100 : accessibility.wcagLevel === 'AA' ? 80 : 40) * 0.4; // 40% weight
  score += (performance.complexity === 'low' ? 100 : performance.complexity === 'medium' ? 70 : 40) * 0.2; // 20% weight
  
  return Math.round(score);
}

/**
 * Generate insights and suggestions
 */
function getInsights(
  variation: BackgroundVariation,
  harmony: ColorHarmonyInfo,
  accessibility: AccessibilityInfo,
  performance: PerformanceInfo,
  brandColors?: BrandColors | null
): string[] {
  const insights: string[] = [];

  // Color harmony insights
  if (harmony.score >= 85) {
    insights.push('Excellent color choice! This background strongly aligns with your brand identity.');
  } else if (harmony.score < 60) {
    insights.push('Consider exploring backgrounds that better complement your brand colors.');
  }

  // Accessibility insights
  if (accessibility.wcagLevel === 'fail') {
    insights.push('Critical: This background may create readability issues. Choose higher contrast options.');
  } else if (accessibility.wcagLevel === 'AAA') {
    insights.push('Perfect accessibility! Text will be highly readable on this background.');
  }

  // Performance insights
  if (performance.complexity === 'low') {
    insights.push('Great performance choice! This background will load quickly on all devices.');
  } else if (performance.complexity === 'high') {
    insights.push('Complex background detected. Test performance on mobile devices.');
  }

  // Archetype-specific insights
  if (variation.archetypeId.includes('soft')) {
    insights.push('Soft backgrounds work well for professional and healthcare brands.');
  } else if (variation.archetypeId.includes('energetic')) {
    insights.push('Dynamic backgrounds are perfect for creative and tech companies.');
  } else if (variation.archetypeId.includes('luxury')) {
    insights.push('Luxury styling conveys premium quality and sophistication.');
  }

  // Brand-specific insights
  if (brandColors && harmony.relationship === 'complementary') {
    insights.push('Complementary colors create visual interest while maintaining balance.');
  }

  return insights;
}

/**
 * Helper functions
 */
function formatArchetypeName(archetypeId: string): string {
  return archetypeId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractBaseColorFromHex(hex: string): string {
  try {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    
    const [h, s, l] = rgbToHsl(r, g, b);
    
    if (s < 0.1) return 'gray';
    if (l > 0.9 || l < 0.1) return 'neutral';
    
    if (h >= 345 || h < 15) return 'red';
    if (h >= 15 && h < 45) return 'orange';
    if (h >= 45 && h < 75) return 'amber';
    if (h >= 75 && h < 105) return 'green';
    if (h >= 195 && h < 255) return 'blue';
    if (h >= 255 && h < 315) return 'purple';
    
    return 'blue';
  } catch {
    return 'blue';
  }
}

function getHarmoniousColors(baseColor: string): string[] {
  const harmonies: Record<string, string[]> = {
    blue: ['indigo', 'cyan', 'sky', 'teal'],
    red: ['orange', 'pink', 'rose'],
    green: ['emerald', 'teal', 'lime'],
    purple: ['indigo', 'blue', 'pink'],
    orange: ['red', 'amber', 'yellow'],
    teal: ['cyan', 'green', 'emerald'],
  };
  return harmonies[baseColor] || [];
}

function getComplementaryColors(baseColor: string): string[] {
  const complements: Record<string, string[]> = {
    blue: ['orange', 'amber'],
    red: ['green', 'teal'],
    green: ['red', 'pink'],
    purple: ['yellow', 'amber'],
    orange: ['blue', 'indigo'],
    teal: ['red', 'orange'],
  };
  return complements[baseColor] || [];
}

function getColorForBaseColor(baseColor: string): string {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    teal: '#14b8a6',
    amber: '#f59e0b',
    gray: '#6b7280',
  };
  return colorMap[baseColor] || '#6b7280';
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;

  l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0; break;
    }

    h /= 6;
  }

  return [h * 360, s, l];
}