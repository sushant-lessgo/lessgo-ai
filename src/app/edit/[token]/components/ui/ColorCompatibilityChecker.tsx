// /app/edit/[token]/components/ui/ColorCompatibilityChecker.tsx
"use client";

import React, { useState } from 'react';
import type { 
  ColorCompatibilityResult, 
  ColorCompatibilityWarning, 
  ColorCompatibilityError,
  ColorCompatibilitySuggestion 
} from './colorCompatibilityLogic';

interface ColorCompatibilityCheckerProps {
  validationResult: ColorCompatibilityResult | null;
  onApplySuggestion?: (suggestion: ColorCompatibilitySuggestion) => void;
  className?: string;
}

export function ColorCompatibilityChecker({
  validationResult,
  onApplySuggestion,
  className = '',
}: ColorCompatibilityCheckerProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    errors: true,
    warnings: false,
    suggestions: false,
    accessibility: false,
    performance: false,
  });

  if (!validationResult) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No validation results available</p>
        </div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get overall status
  const getOverallStatus = () => {
    if (validationResult.errors.length > 0) return 'error';
    if (validationResult.warnings.some(w => w.severity === 'high')) return 'warning';
    if (validationResult.score >= 80) return 'excellent';
    if (validationResult.score >= 60) return 'good';
    return 'needs-improvement';
  };

  const status = getOverallStatus();

  // Status configurations
  const statusConfigs = {
    error: {
      color: 'red',
      icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Issues Found',
      description: 'Critical issues that need attention',
    },
    warning: {
      color: 'yellow',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
      title: 'Warnings',
      description: 'Some optimizations recommended',
    },
    excellent: {
      color: 'green',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Excellent',
      description: 'Great color choices!',
    },
    good: {
      color: 'blue',
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Good',
      description: 'Minor improvements possible',
    },
    'needs-improvement': {
      color: 'orange',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
      title: 'Needs Improvement',
      description: 'Consider alternative colors',
    },
  };

  const config = statusConfigs[status];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Score and Status */}
      <div className={`p-4 bg-${config.color}-50 border border-${config.color}-200 rounded-lg`}>
        <div className="flex items-start space-x-3">
          <svg className={`w-5 h-5 text-${config.color}-600 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={config.icon} />
          </svg>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium text-${config.color}-800`}>
                {config.title}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-bold text-${config.color}-700`}>
                  {validationResult.score}%
                </span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`bg-${config.color}-500 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${validationResult.score}%` }}
                  />
                </div>
              </div>
            </div>
            <p className={`text-sm text-${config.color}-700 mt-1`}>
              {config.description}
            </p>
          </div>
        </div>
      </div>

      {/* Errors Section */}
      {validationResult.errors.length > 0 && (
        <div className="border border-red-200 rounded-lg">
          <button
            onClick={() => toggleSection('errors')}
            className="w-full p-3 text-left bg-red-50 hover:bg-red-100 transition-colors rounded-t-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-red-800">
                  Errors ({validationResult.errors.length})
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-red-600 transition-transform ${expandedSections.errors ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {expandedSections.errors && (
            <div className="p-3 space-y-3 border-t border-red-200">
              {validationResult.errors.map((error) => (
                <ErrorItem key={error.id} error={error} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warnings Section */}
      {validationResult.warnings.length > 0 && (
        <div className="border border-yellow-200 rounded-lg">
          <button
            onClick={() => toggleSection('warnings')}
            className="w-full p-3 text-left bg-yellow-50 hover:bg-yellow-100 transition-colors rounded-t-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium text-yellow-800">
                  Warnings ({validationResult.warnings.length})
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-yellow-600 transition-transform ${expandedSections.warnings ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {expandedSections.warnings && (
            <div className="p-3 space-y-3 border-t border-yellow-200">
              {validationResult.warnings.map((warning) => (
                <WarningItem key={warning.id} warning={warning} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions Section */}
      {validationResult.suggestions.length > 0 && (
        <div className="border border-blue-200 rounded-lg">
          <button
            onClick={() => toggleSection('suggestions')}
            className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 transition-colors rounded-t-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  Suggestions ({validationResult.suggestions.length})
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-blue-600 transition-transform ${expandedSections.suggestions ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {expandedSections.suggestions && (
            <div className="p-3 space-y-3 border-t border-blue-200">
              {validationResult.suggestions.map((suggestion) => (
                <SuggestionItem 
                  key={suggestion.id} 
                  suggestion={suggestion}
                  onApply={onApplySuggestion}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accessibility Details */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('accessibility')}
          className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Accessibility • WCAG {validationResult.accessibility.wcagLevel}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                validationResult.accessibility.wcagLevel === 'AAA' 
                  ? 'bg-green-100 text-green-800'
                  : validationResult.accessibility.wcagLevel === 'AA'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
              }`}>
                {validationResult.accessibility.contrastRatio.toFixed(1)}:1
              </span>
              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform ${expandedSections.accessibility ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
        
        {expandedSections.accessibility && (
          <div className="p-3 border-t border-gray-200">
            <AccessibilityDetails accessibility={validationResult.accessibility} />
          </div>
        )}
      </div>

      {/* Performance Details */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('performance')}
          className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Performance • {validationResult.performance.complexity} complexity
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-gray-600 transition-transform ${expandedSections.performance ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {expandedSections.performance && (
          <div className="p-3 border-t border-gray-200">
            <PerformanceDetails performance={validationResult.performance} />
          </div>
        )}
      </div>
    </div>
  );
}

// Error Item Component
function ErrorItem({ error }: { error: ColorCompatibilityError }) {
  return (
    <div className="p-3 bg-red-25 border border-red-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <svg className="w-4 h-4 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <div className="flex-1">
          <div className="text-sm font-medium text-red-800">{error.message}</div>
          <div className="text-xs text-red-700 mt-1">{error.details}</div>
          {error.fix && (
            <div className="flex items-center space-x-1 mt-2">
              <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-red-600">Fix: {error.fix}</span>
            </div>
          )}
        </div>
        {error.blocking && (
          <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
            Blocking
          </span>
        )}
      </div>
    </div>
  );
}

// Warning Item Component
function WarningItem({ warning }: { warning: ColorCompatibilityWarning }) {
  const severityColors = {
    low: 'yellow',
    medium: 'orange',
    high: 'red',
  };
  
  const color = severityColors[warning.severity];
  
  return (
    <div className={`p-3 bg-${color}-25 border border-${color}-200 rounded-lg`}>
      <div className="flex items-start space-x-3">
        <svg className={`w-4 h-4 text-${color}-600 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1">
          <div className={`text-sm font-medium text-${color}-800`}>{warning.message}</div>
          {warning.details && (
            <div className={`text-xs text-${color}-700 mt-1`}>{warning.details}</div>
          )}
          {warning.fix && (
            <div className="flex items-center space-x-1 mt-2">
              <svg className={`w-3 h-3 text-${color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-xs text-${color}-600`}>Fix: {warning.fix}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {warning.autoFixable && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              Auto-fixable
            </span>
          )}
          <span className={`inline-block px-2 py-1 text-xs font-medium bg-${color}-100 text-${color}-800 rounded capitalize`}>
            {warning.severity}
          </span>
        </div>
      </div>
    </div>
  );
}

// Suggestion Item Component
function SuggestionItem({ 
  suggestion, 
  onApply 
}: { 
  suggestion: ColorCompatibilitySuggestion;
  onApply?: (suggestion: ColorCompatibilitySuggestion) => void;
}) {
  return (
    <div className="p-3 bg-blue-25 border border-blue-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-800">{suggestion.message}</div>
          {suggestion.action && (
            <div className="text-xs text-blue-700 mt-1">{suggestion.action}</div>
          )}
        </div>
        {onApply && suggestion.action && (
          <button
            onClick={() => onApply(suggestion)}
            className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}

// Accessibility Details Component
function AccessibilityDetails({ accessibility }: { accessibility: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-gray-500">Contrast Ratio</span>
          <div className="text-sm font-medium">{accessibility.contrastRatio.toFixed(2)}:1</div>
        </div>
        <div>
          <span className="text-xs text-gray-500">WCAG Level</span>
          <div className={`text-sm font-medium ${
            accessibility.wcagLevel === 'AAA' ? 'text-green-600' :
            accessibility.wcagLevel === 'AA' ? 'text-blue-600' : 'text-red-600'
          }`}>
            {accessibility.wcagLevel}
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500">Color Blind Safe</span>
          <div className={`text-sm font-medium ${accessibility.colorBlindSafe ? 'text-green-600' : 'text-orange-600'}`}>
            {accessibility.colorBlindSafe ? 'Yes' : 'Caution'}
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500">Readability</span>
          <div className="text-sm font-medium">{accessibility.readabilityScore}%</div>
        </div>
      </div>
      
      {accessibility.issues.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-600">Issues:</span>
          <ul className="mt-1 space-y-1">
            {accessibility.issues.map((issue: any, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <span className={`inline-block w-2 h-2 rounded-full mt-1.5 ${
                  issue.severity === 'error' ? 'bg-red-500' :
                  issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs text-gray-600">{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Performance Details Component
function PerformanceDetails({ performance }: { performance: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-gray-500">Complexity</span>
          <div className={`text-sm font-medium capitalize ${
            performance.complexity === 'low' ? 'text-green-600' :
            performance.complexity === 'medium' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {performance.complexity}
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500">Render Cost</span>
          <div className="text-sm font-medium">{performance.renderCost}/100</div>
        </div>
      </div>
      
      {performance.optimizations.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-600">Optimizations:</span>
          <ul className="mt-1 space-y-1">
            {performance.optimizations.map((optimization: string, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <svg className="w-3 h-3 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs text-gray-600">{optimization}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {performance.issues.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-600">Performance Issues:</span>
          <ul className="mt-1 space-y-1">
            {performance.issues.map((issue: any, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <span className={`inline-block w-2 h-2 rounded-full mt-1.5 ${
                  issue.impact === 'high' ? 'bg-red-500' :
                  issue.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs text-gray-600">{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}