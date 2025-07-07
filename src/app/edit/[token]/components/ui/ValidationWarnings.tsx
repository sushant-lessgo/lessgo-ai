// /app/edit/[token]/components/ui/ValidationWarnings.tsx
"use client";

import React, { useState } from 'react';
import type { 
  BackgroundValidationResult,
  BackgroundValidationWarning,
  BackgroundValidationError,
  BackgroundValidationSuggestion 
} from '@/types/core';

interface ValidationWarningsProps {
  validationResult: BackgroundValidationResult | null;
  className?: string;
}

export function ValidationWarnings({ validationResult, className = '' }: ValidationWarningsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!validationResult || (validationResult.errors.length === 0 && validationResult.warnings.length === 0)) {
    return null;
  }

  const { errors, warnings, suggestions, accessibility, performance, brandAlignment } = validationResult;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasSuggestions = suggestions.length > 0;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accessibility':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'performance':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'brand':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
          </svg>
        );
      case 'contrast':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Errors Section */}
      {hasErrors && (
        <div className="border border-red-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('errors')}
            className="w-full px-4 py-3 bg-red-50 text-left flex items-center justify-between hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-red-800">
                {errors.length} Error{errors.length !== 1 ? 's' : ''} Found
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-red-600 transition-transform ${expandedSection === 'errors' ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSection === 'errors' && (
            <div className="px-4 pb-4 space-y-3">
              {errors.map((error, index) => (
                <div key={index} className="border-l-4 border-red-400 pl-3">
                  <div className="flex items-start space-x-2">
                    {getTypeIcon(error.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-red-800">{error.message}</div>
                      <div className="text-xs text-red-600 mt-1">{error.details}</div>
                      {error.fix && (
                        <div className="text-xs text-red-700 mt-1 bg-red-100 px-2 py-1 rounded">
                          <strong>Fix:</strong> {error.fix}
                        </div>
                      )}
                    </div>
                    {error.blocking && (
                      <div className="text-xs text-red-700 bg-red-200 px-2 py-1 rounded font-medium">
                        Blocking
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warnings Section */}
      {hasWarnings && (
        <div className="border border-yellow-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('warnings')}
            className="w-full px-4 py-3 bg-yellow-50 text-left flex items-center justify-between hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium text-yellow-800">
                {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-yellow-600 transition-transform ${expandedSection === 'warnings' ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSection === 'warnings' && (
            <div className="px-4 pb-4 space-y-3">
              {warnings.map((warning, index) => (
                <div key={index} className={`border-l-4 pl-3 ${getSeverityBorderColor(warning.severity)}`}>
                  <div className="flex items-start space-x-2">
                    {getTypeIcon(warning.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-yellow-800">{warning.message}</div>
                      {warning.details && (
                        <div className="text-xs text-yellow-600 mt-1">{warning.details}</div>
                      )}
                      {warning.fix && (
                        <div className="text-xs text-yellow-700 mt-1 bg-yellow-100 px-2 py-1 rounded">
                          <strong>Fix:</strong> {warning.fix}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded font-medium ${getSeverityColor(warning.severity)}`}>
                      {warning.severity.charAt(0).toUpperCase() + warning.severity.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accessibility Details */}
      {accessibility.issues.length > 0 && (
        <div className="border border-blue-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('accessibility')}
            className="w-full px-4 py-3 bg-blue-50 text-left flex items-center justify-between hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-blue-800">
                Accessibility Analysis
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`text-xs px-2 py-1 rounded font-medium ${
                accessibility.wcagLevel === 'AAA' ? 'bg-green-100 text-green-800' :
                accessibility.wcagLevel === 'AA' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                WCAG {accessibility.wcagLevel}
              </div>
              <svg 
                className={`w-4 h-4 text-blue-600 transition-transform ${expandedSection === 'accessibility' ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {expandedSection === 'accessibility' && (
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Contrast Ratio:</span>
                  <span className="ml-2 font-medium">{accessibility.contrastRatio.toFixed(1)}:1</span>
                </div>
                <div>
                  <span className="text-gray-600">Readability Score:</span>
                  <span className="ml-2 font-medium">{accessibility.readabilityScore}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Color Blind Safe:</span>
                  <span className={`ml-2 font-medium ${accessibility.colorBlindSafe ? 'text-green-600' : 'text-red-600'}`}>
                    {accessibility.colorBlindSafe ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              {accessibility.issues.map((issue, index) => (
                <div key={index} className="border-l-4 border-blue-400 pl-3">
                  <div className="text-sm font-medium text-blue-800">{issue.message}</div>
                  {issue.fix && (
                    <div className="text-xs text-blue-700 mt-1 bg-blue-100 px-2 py-1 rounded">
                      <strong>Fix:</strong> {issue.fix}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions Section */}
      {hasSuggestions && (
        <div className="border border-green-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('suggestions')}
            className="w-full px-4 py-3 bg-green-50 text-left flex items-center justify-between hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                {suggestions.length} Improvement{suggestions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-green-600 transition-transform ${expandedSection === 'suggestions' ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSection === 'suggestions' && (
            <div className="px-4 pb-4 space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border-l-4 border-green-400 pl-3">
                  <div className="text-sm font-medium text-green-800">{suggestion.message}</div>
                  {suggestion.action && (
                    <div className="text-xs text-green-700 mt-1 bg-green-100 px-2 py-1 rounded">
                      <strong>Action:</strong> {suggestion.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getSeverityBorderColor(severity: 'low' | 'medium' | 'high') {
  switch (severity) {
    case 'high': return 'border-red-400';
    case 'medium': return 'border-yellow-400';
    case 'low': return 'border-blue-400';
    default: return 'border-gray-400';
  }
}