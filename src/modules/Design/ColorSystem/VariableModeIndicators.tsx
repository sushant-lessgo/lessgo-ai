// Variable Mode Indicators - Visual indicators for migration status and variable mode
// Provides real-time feedback on migration phase, compatibility, and feature availability

'use client';

import React, { useMemo } from 'react';
import { useVariableTheme } from './VariableThemeInjector';
import { useHybridCompatibility } from './HybridModeCompatibility';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Code2,
  Layers,
  Palette,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
  Eye,
  Settings,
  TrendingUp,
  Clock,
  Sparkles,
  Shield,
  Cpu
} from 'lucide-react';
import type { MigrationPhase } from '@/utils/featureFlags';

interface VariableModeIndicatorProps {
  tokenId: string;
  variant?: 'compact' | 'full' | 'badge' | 'status-bar';
  showDetails?: boolean;
  className?: string;
}

interface MigrationStatusIndicatorProps {
  tokenId: string;
  className?: string;
}

interface CompatibilityIndicatorProps {
  tokenId: string;
  showScore?: boolean;
  className?: string;
}

interface FeatureAvailabilityIndicatorProps {
  tokenId: string;
  features: string[];
  className?: string;
}

/**
 * Main Variable Mode Indicator
 */
export function VariableModeIndicator({ 
  tokenId, 
  variant = 'full', 
  showDetails = true,
  className 
}: VariableModeIndicatorProps) {
  const { phase, flags, isVariableMode, isHybridMode, isLegacyMode } = useVariableTheme(tokenId);

  const phaseConfig = useMemo(() => {
    switch (phase) {
      case 'variable':
        return {
          label: 'Variable Mode',
          icon: Code2,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          description: 'Full CSS variable support active',
          status: 'active',
        };
      case 'hybrid':
        return {
          label: 'Hybrid Mode',
          icon: Layers,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          description: 'Variable + legacy compatibility',
          status: 'transitioning',
        };
      case 'legacy':
        return {
          label: 'Legacy Mode',
          icon: Palette,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          description: 'Classic Tailwind classes',
          status: 'legacy',
        };
      default:
        return {
          label: 'Unknown',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          description: 'Unable to determine mode',
          status: 'error',
        };
    }
  }, [phase]);

  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={phaseConfig.status === 'active' ? 'default' : 'secondary'}
              className={`flex items-center gap-1 ${className}`}
            >
              <phaseConfig.icon className="w-3 h-3" />
              {phaseConfig.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium">{phaseConfig.description}</div>
              <div className="text-gray-500 mt-1">
                Phase: {phase} • Token: {tokenId.slice(0, 8)}...
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${phaseConfig.bgColor}`}>
          <phaseConfig.icon className={`w-3 h-3 ${phaseConfig.color}`} />
          <span className={phaseConfig.color}>{phaseConfig.label}</span>
        </div>
        {showDetails && (
          <span className="text-xs text-gray-500">{phaseConfig.description}</span>
        )}
      </div>
    );
  }

  if (variant === 'status-bar') {
    return (
      <div className={`flex items-center justify-between p-2 rounded border ${phaseConfig.bgColor} ${className}`}>
        <div className="flex items-center gap-2">
          <phaseConfig.icon className={`w-4 h-4 ${phaseConfig.color}`} />
          <div>
            <div className={`text-sm font-medium ${phaseConfig.color}`}>
              {phaseConfig.label}
            </div>
            {showDetails && (
              <div className="text-xs text-gray-600">{phaseConfig.description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {flags.enableMigrationDebug && (
            <Badge variant="outline" className="text-xs">Debug</Badge>
          )}
          {isVariableMode && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <Card className={`${phaseConfig.bgColor} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${phaseConfig.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
              <phaseConfig.icon className={`w-5 h-5 ${phaseConfig.color}`} />
            </div>
            <div>
              <div className={`font-semibold ${phaseConfig.color}`}>
                {phaseConfig.label}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {phaseConfig.description}
              </div>
              {showDetails && (
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div>Token: {tokenId}</div>
                  <div>Phase: {phase}</div>
                  <div className="flex gap-2">
                    {flags.enableVariableMode && <span>✓ Variables</span>}
                    {flags.enableHybridMode && <span>✓ Hybrid</span>}
                    {flags.enableLegacyFallbacks && <span>✓ Fallbacks</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Migration Status Indicator
 */
export function MigrationStatusIndicator({ tokenId, className }: MigrationStatusIndicatorProps) {
  const { phase } = useVariableTheme(tokenId);

  const statusConfig = useMemo(() => {
    const phases: Record<MigrationPhase, { step: number; total: number; label: string; color: string }> = {
      'legacy': { step: 1, total: 3, label: 'Legacy Phase', color: 'text-gray-600' },
      'hybrid': { step: 2, total: 3, label: 'Migration Phase', color: 'text-blue-600' },
      'variable': { step: 3, total: 3, label: 'Variable Phase', color: 'text-green-600' },
    };

    return phases[phase] || phases.legacy;
  }, [phase]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <TrendingUp className={`w-4 h-4 ${statusConfig.color}`} />
        <span className={`text-sm font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: statusConfig.total }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < statusConfig.step 
                ? statusConfig.color.replace('text-', 'bg-')
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">
        Step {statusConfig.step} of {statusConfig.total}
      </span>
    </div>
  );
}

/**
 * Compatibility Indicator
 */
export function CompatibilityIndicator({ 
  tokenId, 
  showScore = true, 
  className 
}: CompatibilityIndicatorProps) {
  const compatibility = useHybridCompatibility();

  const scoreConfig = useMemo(() => {
    const score = compatibility.compatibilityScore;
    
    if (score >= 90) {
      return {
        label: 'Excellent',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      };
    } else if (score >= 70) {
      return {
        label: 'Good',
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      };
    } else if (score >= 50) {
      return {
        label: 'Fair',
        icon: AlertCircle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      };
    } else {
      return {
        label: 'Poor',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      };
    }
  }, [compatibility.compatibilityScore]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 px-2 py-1 rounded ${scoreConfig.bgColor} ${className}`}>
            <scoreConfig.icon className={`w-4 h-4 ${scoreConfig.color}`} />
            <span className={`text-sm ${scoreConfig.color}`}>
              {scoreConfig.label}
              {showScore && ` (${compatibility.compatibilityScore}%)`}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div className="font-medium">Browser Compatibility</div>
            <div>CSS Variables: {compatibility.hasVariableSupport ? '✓' : '✗'}</div>
            <div>Hybrid Mode: {compatibility.isCompatibilityMode ? '✓' : '✗'}</div>
            <div>Score: {compatibility.compatibilityScore}%</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Feature Availability Indicator
 */
export function FeatureAvailabilityIndicator({ 
  tokenId, 
  features,
  className 
}: FeatureAvailabilityIndicatorProps) {
  const { flags } = useVariableTheme(tokenId);

  const featureStatus = useMemo(() => {
    const statusMap: Record<string, boolean> = {
      'variable-mode': flags.enableVariableMode,
      'hybrid-mode': flags.enableHybridMode,
      'custom-colors': flags.enableCustomColorPicker,
      'background-customization': flags.enableBackgroundCustomization,
      'migration-debug': flags.enableMigrationDebug,
      'performance-logging': flags.enablePerformanceLogging,
      'visual-diff': flags.enableVisualDiff,
      'migration-analytics': flags.enableMigrationAnalytics,
    };

    return features.map(feature => ({
      feature,
      enabled: statusMap[feature] || false,
      label: feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));
  }, [features, flags]);

  const enabledCount = featureStatus.filter(f => f.enabled).length;
  const totalCount = featureStatus.length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 ${className}`}>
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm">
              {enabledCount}/{totalCount} Features
            </span>
            <div className="flex gap-1">
              {featureStatus.map((status, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    status.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div className="font-medium">Feature Availability</div>
            {featureStatus.map(status => (
              <div key={status.feature} className="flex items-center justify-between gap-2">
                <span>{status.label}</span>
                <span className={status.enabled ? 'text-green-500' : 'text-gray-400'}>
                  {status.enabled ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Performance Indicator
 */
export function PerformanceIndicator({ tokenId, className }: { tokenId: string; className?: string }) {
  const { flags } = useVariableTheme(tokenId);

  // Mock performance metrics - in real app, these would come from actual measurements
  const performanceMetrics = useMemo(() => ({
    cssSize: '10KB', // Reduced from 24KB with variables
    renderTime: '12ms', // Average render time
    cacheHits: '94%', // CSS variable cache efficiency
    fallbackRate: '8%', // How often legacy fallbacks are used
  }), []);

  if (!flags.enablePerformanceLogging) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 px-2 py-1 rounded bg-green-50 border border-green-200 ${className}`}>
            <Cpu className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Optimized</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div className="font-medium">Performance Metrics</div>
            <div>CSS Size: {performanceMetrics.cssSize}</div>
            <div>Render Time: {performanceMetrics.renderTime}</div>
            <div>Cache Efficiency: {performanceMetrics.cacheHits}</div>
            <div>Fallback Rate: {performanceMetrics.fallbackRate}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Composite Status Bar - Shows multiple indicators in one bar
 */
export function VariableStatusBar({ tokenId, className }: { tokenId: string; className?: string }) {
  return (
    <div className={`flex items-center gap-4 p-3 bg-gray-50 border rounded-lg ${className}`}>
      <VariableModeIndicator tokenId={tokenId} variant="compact" showDetails={false} />
      <div className="w-px h-4 bg-gray-300" />
      <MigrationStatusIndicator tokenId={tokenId} />
      <div className="w-px h-4 bg-gray-300" />
      <CompatibilityIndicator tokenId={tokenId} showScore={false} />
      <div className="flex-1" />
      <PerformanceIndicator tokenId={tokenId} />
      <FeatureAvailabilityIndicator 
        tokenId={tokenId} 
        features={['variable-mode', 'hybrid-mode', 'custom-colors']}
      />
    </div>
  );
}