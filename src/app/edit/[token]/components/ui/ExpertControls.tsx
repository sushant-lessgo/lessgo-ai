// /app/edit/[token]/components/ui/ExpertControls.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { analyzeColorAccessibility, getAccessibilityBadge } from './colorAccessibilityUtils';
import type { ColorTokens, BackgroundSystem } from '@/types/core';

interface ExpertControlsProps {
  currentTokens: ColorTokens;
  backgroundSystem: BackgroundSystem | null;
  onTokenChange: (tokenKey: keyof ColorTokens, value: string) => void;
  disabled?: boolean;
}

interface TokenGroup {
  id: string;
  label: string;
  description: string;
  tokens: Array<{
    key: keyof ColorTokens;
    label: string;
    type: 'background' | 'text' | 'border';
    critical: boolean;
  }>;
}

export function ExpertControls({
  currentTokens,
  backgroundSystem,
  onTokenChange,
  disabled = false,
}: ExpertControlsProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>('interactive');
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState<string>('');
  const [showAccessibilityDetails, setShowAccessibilityDetails] = useState(false);

  const tokenGroups: TokenGroup[] = [
    {
      id: 'interactive',
      label: 'Interactive Elements',
      description: 'CTAs, links, buttons, and interactive states',
      tokens: [
        { key: 'accent', label: 'Accent Color', type: 'background', critical: true },
        { key: 'accentHover', label: 'Accent Hover', type: 'background', critical: true },
        { key: 'accentBorder', label: 'Accent Border', type: 'border', critical: false },
        { key: 'ctaBg', label: 'Primary CTA Background', type: 'background', critical: true },
        { key: 'ctaHover', label: 'Primary CTA Hover', type: 'background', critical: true },
        { key: 'ctaText', label: 'Primary CTA Text', type: 'text', critical: true },
        { key: 'ctaSecondary', label: 'Secondary CTA Background', type: 'background', critical: false },
        { key: 'ctaSecondaryHover', label: 'Secondary CTA Hover', type: 'background', critical: false },
        { key: 'ctaSecondaryText', label: 'Secondary CTA Text', type: 'text', critical: false },
        { key: 'ctaGhost', label: 'Ghost CTA Color', type: 'text', critical: false },
        { key: 'ctaGhostHover', label: 'Ghost CTA Hover', type: 'background', critical: false },
        { key: 'link', label: 'Link Color', type: 'text', critical: true },
        { key: 'linkHover', label: 'Link Hover', type: 'text', critical: true },
      ],
    },
    {
      id: 'text',
      label: 'Text Hierarchy',
      description: 'Text colors for different content levels',
      tokens: [
        { key: 'textPrimary', label: 'Primary Text', type: 'text', critical: true },
        { key: 'textSecondary', label: 'Secondary Text', type: 'text', critical: true },
        { key: 'textMuted', label: 'Muted Text', type: 'text', critical: true },
        { key: 'textOnLight', label: 'Text on Light Backgrounds', type: 'text', critical: true },
        { key: 'textOnDark', label: 'Text on Dark Backgrounds', type: 'text', critical: true },
        { key: 'textOnAccent', label: 'Text on Accent Colors', type: 'text', critical: true },
        { key: 'textInverse', label: 'Inverse Text', type: 'text', critical: false },
      ],
    },
    {
      id: 'backgrounds',
      label: 'Backgrounds',
      description: 'Section and surface background colors',
      tokens: [
        { key: 'bgPrimary', label: 'Primary Background', type: 'background', critical: true },
        { key: 'bgSecondary', label: 'Secondary Background', type: 'background', critical: true },
        { key: 'bgNeutral', label: 'Neutral Background', type: 'background', critical: false },
        { key: 'bgDivider', label: 'Divider Background', type: 'background', critical: false },
      ],
    },
    {
      id: 'surfaces',
      label: 'Surfaces & Borders',
      description: 'Cards, elevated surfaces, and border elements',
      tokens: [
        { key: 'surfaceCard', label: 'Card Surface', type: 'background', critical: false },
        { key: 'surfaceElevated', label: 'Elevated Surface', type: 'background', critical: false },
        { key: 'surfaceSection', label: 'Section Surface', type: 'background', critical: false },
        { key: 'surfaceOverlay', label: 'Overlay Surface', type: 'background', critical: false },
        { key: 'borderDefault', label: 'Default Border', type: 'border', critical: false },
        { key: 'borderSubtle', label: 'Subtle Border', type: 'border', critical: false },
        { key: 'borderFocus', label: 'Focus Border', type: 'border', critical: true },
      ],
    },
  ];

  const accessibilityAnalysis = useMemo(() => {
    if (!backgroundSystem) return null;
    return analyzeColorAccessibility(currentTokens, backgroundSystem);
  }, [currentTokens, backgroundSystem]);

  const accessibilityBadge = useMemo(() => {
    if (!accessibilityAnalysis) return null;
    return getAccessibilityBadge(accessibilityAnalysis);
  }, [accessibilityAnalysis]);

  const handleStartEdit = (tokenKey: keyof ColorTokens) => {
    setEditingToken(tokenKey);
    setCustomValue(currentTokens[tokenKey]);
  };

  const handleSaveEdit = () => {
    if (editingToken && customValue.trim()) {
      onTokenChange(editingToken as keyof ColorTokens, customValue.trim());
    }
    setEditingToken(null);
    setCustomValue('');
  };

  const handleCancelEdit = () => {
    setEditingToken(null);
    setCustomValue('');
  };

  const getTokenPreview = (tokenKey: keyof ColorTokens, value: string, type: string) => {
    if (type === 'text') {
      return (
        <div className="w-8 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
          <span className={`text-xs font-bold ${value}`}>Aa</span>
        </div>
      );
    }
    
    if (type === 'border') {
      return (
        <div className={`w-8 h-8 bg-white rounded border-2 ${value}`} />
      );
    }
    
    return <div className={`w-8 h-8 rounded ${value} border border-gray-200`} />;
  };

  const getTokenRisk = (tokenKey: keyof ColorTokens, critical: boolean): 'high' | 'medium' | 'low' => {
    if (!accessibilityAnalysis) return 'low';
    
    const hasIssue = accessibilityAnalysis.issues.some(issue => 
      issue.element.toLowerCase().includes(tokenKey.toLowerCase()) ||
      tokenKey.toLowerCase().includes(issue.element.toLowerCase().replace(/\s+/g, ''))
    );
    
    if (hasIssue && critical) return 'high';
    if (hasIssue) return 'medium';
    return 'low';
  };

  const getRiskColor = (risk: 'high' | 'medium' | 'low'): string => {
    switch (risk) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-gray-200 bg-white';
    }
  };

  const getRiskIcon = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high':
        return <span className="text-red-500 text-xs">⚠</span>;
      case 'medium':
        return <span className="text-yellow-500 text-xs">⚠</span>;
      default:
        return null;
    }
  };

  if (!backgroundSystem) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2">Expert Mode Unavailable</p>
        <p className="text-xs text-gray-600">Background system required for expert token access</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Expert Mode Warning */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-red-800">Expert Override Mode</div>
            <div className="text-xs text-red-700 mt-1">
              Direct token editing can break design relationships and accessibility. Changes may impact brand consistency and user experience.
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Overview */}
      {accessibilityBadge && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-gray-700">Accessibility Status</div>
              <div className="text-xs text-gray-600">Current color system accessibility</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${accessibilityBadge.color}`}>
              {accessibilityBadge.icon} {accessibilityBadge.label}
            </div>
          </div>
          
          <button
            onClick={() => setShowAccessibilityDetails(!showAccessibilityDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showAccessibilityDetails ? 'Hide' : 'Show'} accessibility details
          </button>
          
          {showAccessibilityDetails && accessibilityAnalysis && (
            <div className="mt-3 space-y-2">
              {accessibilityAnalysis.issues.slice(0, 3).map((issue, index) => (
                <div key={index} className="text-xs p-2 rounded bg-white border border-gray-200">
                  <div className={`font-medium ${
                    issue.severity === 'error' ? 'text-red-700' : 
                    issue.severity === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                  }`}>
                    {issue.element}: {issue.message}
                  </div>
                  {issue.fix && (
                    <div className="text-gray-600 mt-1">{issue.fix}</div>
                  )}
                </div>
              ))}
              {accessibilityAnalysis.issues.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{accessibilityAnalysis.issues.length - 3} more issues
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Token Groups */}
      <div className="space-y-3">
        {tokenGroups.map((group) => {
          const isExpanded = expandedGroup === group.id;
          const criticalCount = group.tokens.filter(t => t.critical).length;
          
          return (
            <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                disabled={disabled}
                className={`
                  w-full p-4 text-left transition-colors
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">{group.label}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {group.tokens.length} tokens
                      </span>
                      {criticalCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          {criticalCount} critical
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{group.description}</div>
                  </div>
                  
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 divide-y divide-gray-100">
                  {group.tokens.map((token) => {
                    const isEditing = editingToken === token.key;
                    const currentValue = currentTokens[token.key];
                    const risk = getTokenRisk(token.key, token.critical);
                    
                    return (
                      <div key={token.key} className={`p-3 ${getRiskColor(risk)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTokenPreview(token.key, currentValue, token.type)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">{token.label}</span>
                                {token.critical && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    Critical
                                  </span>
                                )}
                                {getRiskIcon(risk)}
                              </div>
                              
                              {isEditing ? (
                                <div className="mt-2 space-y-2">
                                  <input
                                    type="text"
                                    value={customValue}
                                    onChange={(e) => setCustomValue(e.target.value)}
                                    placeholder="e.g., bg-blue-600, text-gray-900"
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={handleSaveEdit}
                                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-1">
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {currentValue}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {!isEditing && (
                            <button
                              onClick={() => handleStartEdit(token.key)}
                              disabled={disabled}
                              className={`
                                px-3 py-1 text-xs rounded transition-colors
                                ${disabled 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }
                              `}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Token Usage Guidelines */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm font-medium text-blue-800 mb-2">Expert Token Guidelines</div>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use Tailwind CSS classes (e.g., bg-blue-600, text-gray-900)</li>
          <li>• Critical tokens affect core functionality and accessibility</li>
          <li>• Test changes in preview mode before applying</li>
          <li>• Maintain 4.5:1 contrast ratio for normal text, 3:1 for large text</li>
          <li>• Consider color blind users when choosing color combinations</li>
        </ul>
      </div>

      {/* Reset Section */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">Reset Options</div>
        <div className="text-xs text-gray-600 mb-3">
          Restore tokens to their semantic or generated defaults
        </div>
        <div className="space-x-2">
          <button
            onClick={() => {
              // Reset to semantic controls (Tier 1)
              if (window.confirm('Reset all tokens to semantic defaults? This cannot be undone.')) {
                // This would trigger semantic controls reset
              }
            }}
            disabled={disabled}
            className={`
              px-3 py-2 text-xs rounded transition-colors
              ${disabled 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            Reset to Semantic
          </button>
          <button
            onClick={() => {
              // Reset to original generated
              if (window.confirm('Reset all tokens to original AI-generated defaults? This cannot be undone.')) {
              }
            }}
            disabled={disabled}
            className={`
              px-3 py-2 text-xs rounded transition-colors
              ${disabled 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            Reset to Generated
          </button>
        </div>
      </div>
    </div>
  );
}