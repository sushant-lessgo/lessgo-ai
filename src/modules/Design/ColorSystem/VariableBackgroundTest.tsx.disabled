// Variable Background Test - Comprehensive testing component for variable rendering
// Tests all migration phases, compatibility scenarios, and edge cases

'use client';

import React, { useState, useMemo } from 'react';
import { VariableThemeInjector } from './VariableThemeInjector';
import { VariableBackgroundRenderer } from './VariableBackgroundRenderer';
import { HybridModeCompatibility, useHybridCompatibility } from './HybridModeCompatibility';
import { VariableColorControls } from './VariableColorControls';
import { migrationAdapter } from './migrationAdapter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TestTube, 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Code2,
  Eye,
  Settings,
  BarChart
} from 'lucide-react';

// Test scenarios
const TEST_BACKGROUNDS = [
  // Simple gradients
  'bg-gradient-to-r from-blue-500 to-purple-600',
  'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400',
  
  // Complex gradients with opacity
  'bg-gradient-to-r from-blue-500/80 to-purple-600/60',
  
  // Radial gradients
  'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-blue-200 to-transparent',
  'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-300 via-blue-200 to-transparent',
  
  // Solid backgrounds
  'bg-blue-500',
  'bg-gray-100',
  'bg-white',
  
  // Complex patterns with blur
  'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-blue-200 to-transparent blur-[160px]',
  
  // Custom hex colors
  'bg-[#3b82f6]',
  'bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]',
  
  // Edge cases
  'bg-transparent',
  'bg-current',
  
  // Invalid/malformed
  'bg-invalid-class',
  'bg-gradient-to-xyz from-invalid to-color',
];

interface TestResult {
  background: string;
  legacy: {
    success: boolean;
    error?: string;
    renderTime: number;
  };
  variable: {
    success: boolean;
    error?: string;
    renderTime: number;
    variableCount: number;
    structuralClass?: string;
  };
  hybrid: {
    success: boolean;
    error?: string;
    renderTime: number;
    fallbackUsed: boolean;
  };
}

interface VariableBackgroundTestProps {
  tokenId?: string;
  showDetailedResults?: boolean;
}

export function VariableBackgroundTest({ 
  tokenId = 'test-token', 
  showDetailedResults = true 
}: VariableBackgroundTestProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [customColors, setCustomColors] = useState<Record<string, string>>({
    '--gradient-from': '#3b82f6',
    '--gradient-to': '#8b5cf6',
    '--accent-primary': '#f59e0b',
  });
  const [activeMode, setActiveMode] = useState<'legacy' | 'variable' | 'hybrid'>('hybrid');

  // Test statistics
  const testStats = useMemo(() => {
    if (testResults.length === 0) return null;

    const legacy = testResults.map(r => r.legacy);
    const variable = testResults.map(r => r.variable);
    const hybrid = testResults.map(r => r.hybrid);

    return {
      totalTests: testResults.length,
      legacy: {
        successRate: (legacy.filter(r => r.success).length / legacy.length) * 100,
        avgRenderTime: legacy.reduce((sum, r) => sum + r.renderTime, 0) / legacy.length,
      },
      variable: {
        successRate: (variable.filter(r => r.success).length / variable.length) * 100,
        avgRenderTime: variable.reduce((sum, r) => sum + r.renderTime, 0) / variable.length,
        avgVariableCount: variable.reduce((sum, r) => sum + r.variableCount, 0) / variable.length,
      },
      hybrid: {
        successRate: (hybrid.filter(r => r.success).length / hybrid.length) * 100,
        avgRenderTime: hybrid.reduce((sum, r) => sum + r.renderTime, 0) / hybrid.length,
        fallbackUsageRate: (hybrid.filter(r => r.fallbackUsed).length / hybrid.length) * 100,
      },
    };
  }, [testResults]);

  // Run comprehensive tests
  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTest('');

    const results: TestResult[] = [];

    for (const background of TEST_BACKGROUNDS) {
      setCurrentTest(background);
      
      const result: TestResult = {
        background,
        legacy: { success: false, renderTime: 0 },
        variable: { success: false, renderTime: 0, variableCount: 0 },
        hybrid: { success: false, renderTime: 0, fallbackUsed: false },
      };

      // Test legacy mode
      try {
        const start = performance.now();
        // Legacy mode is just using the original class
        result.legacy = {
          success: true,
          renderTime: performance.now() - start,
        };
      } catch (error) {
        result.legacy = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          renderTime: 0,
        };
      }

      // Test variable mode
      try {
        const start = performance.now();
        const converted = migrationAdapter.convertToVariableBackground(background, 'test');
        
        result.variable = {
          success: !!converted.structuralClass,
          renderTime: performance.now() - start,
          variableCount: Object.keys(converted.cssVariables).length,
          structuralClass: converted.structuralClass,
        };
      } catch (error) {
        result.variable = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          renderTime: 0,
          variableCount: 0,
        };
      }

      // Test hybrid mode
      try {
        const start = performance.now();
        const css = migrationAdapter.generateBackgroundCSS(
          result.variable.success ? {
            variationId: 'test',
            variationLabel: 'Test',
            archetypeId: 'test',
            themeId: 'test',
            baseColor: 'test',
            structuralClass: result.variable.structuralClass || 'bg-pattern-neutral',
            cssVariables: {},
            colorMapping: {},
            fallbackClass: background,
            complexity: 'low',
          } as any : {} as any,
          customColors,
          'hybrid'
        );

        result.hybrid = {
          success: true,
          renderTime: performance.now() - start,
          fallbackUsed: css.legacyCSS === background,
        };
      } catch (error) {
        result.hybrid = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          renderTime: 0,
          fallbackUsed: true,
        };
      }

      results.push(result);
      
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    setTestResults(results);
    setCurrentTest('');
    setIsRunning(false);
  };

  // Individual test component
  const TestCase = ({ result, index }: { result: TestResult; index: number }) => {
    const [showDetails, setShowDetails] = useState(false);
    
    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono">
              {result.background.length > 60 
                ? `${result.background.slice(0, 60)}...` 
                : result.background
              }
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <Eye /> : <Code2 />}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Visual preview */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs">Legacy</Badge>
              <VariableBackgroundRenderer
                tokenId={tokenId}
                background={result.background}
                className="h-16 rounded border"
                fallbackToLegacy={true}
              >
                <div className="h-full flex items-center justify-center text-xs text-white/80 font-medium">
                  Legacy
                </div>
              </VariableBackgroundRenderer>
            </div>
            
            <div className="space-y-1">
              <Badge variant={result.variable.success ? 'default' : 'destructive'} className="text-xs">
                Variable
              </Badge>
              <VariableBackgroundRenderer
                tokenId={tokenId}
                background={result.background}
                customColors={customColors}
                className="h-16 rounded border"
                fallbackToLegacy={false}
              >
                <div className="h-full flex items-center justify-center text-xs text-white/80 font-medium">
                  Variable
                </div>
              </VariableBackgroundRenderer>
            </div>
            
            <div className="space-y-1">
              <Badge variant={result.hybrid.success ? 'secondary' : 'destructive'} className="text-xs">
                Hybrid
              </Badge>
              <VariableBackgroundRenderer
                tokenId={tokenId}
                background={result.background}
                customColors={customColors}
                className="h-16 rounded border"
                fallbackToLegacy={true}
              >
                <div className="h-full flex items-center justify-center text-xs text-white/80 font-medium">
                  Hybrid
                </div>
              </VariableBackgroundRenderer>
            </div>
          </div>
          
          {/* Results summary */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {result.legacy.success ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500" />
                )}
                <span>Legacy</span>
              </div>
              <div className="text-gray-500">
                {result.legacy.renderTime.toFixed(2)}ms
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {result.variable.success ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500" />
                )}
                <span>Variable</span>
              </div>
              <div className="text-gray-500">
                {result.variable.renderTime.toFixed(2)}ms • {result.variable.variableCount} vars
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {result.hybrid.success ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500" />
                )}
                <span>Hybrid</span>
              </div>
              <div className="text-gray-500">
                {result.hybrid.renderTime.toFixed(2)}ms • {result.hybrid.fallbackUsed ? 'Fallback' : 'Variable'}
              </div>
            </div>
          </div>
          
          {/* Detailed results */}
          {showDetails && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs font-mono">
              <div className="space-y-2">
                <div>
                  <strong>Background:</strong> {result.background}
                </div>
                {result.variable.structuralClass && (
                  <div>
                    <strong>Structural Class:</strong> {result.variable.structuralClass}
                  </div>
                )}
                {result.legacy.error && (
                  <div className="text-red-600">
                    <strong>Legacy Error:</strong> {result.legacy.error}
                  </div>
                )}
                {result.variable.error && (
                  <div className="text-red-600">
                    <strong>Variable Error:</strong> {result.variable.error}
                  </div>
                )}
                {result.hybrid.error && (
                  <div className="text-red-600">
                    <strong>Hybrid Error:</strong> {result.hybrid.error}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <HybridModeCompatibility tokenId={tokenId} debugMode>
      <VariableThemeInjector
        tokenId={tokenId}
        customColors={customColors}
        backgroundSystem={{
          primary: 'bg-gradient-to-r from-blue-500 to-purple-600',
          secondary: 'bg-blue-50',
          neutral: 'bg-white',
          divider: 'bg-gray-100',
        }}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TestTube className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Variable Background Test Suite</h1>
            </div>
            
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="tests" className="w-full">
            <TabsList>
              <TabsTrigger value="tests">Test Results</TabsTrigger>
              <TabsTrigger value="controls">Color Controls</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="space-y-4">
              {/* Current test indicator */}
              {isRunning && currentTest && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm">Testing: {currentTest}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Test results */}
              {testResults.length > 0 && (
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <TestCase key={index} result={result} index={index} />
                  ))}
                </div>
              )}

              {/* No results state */}
              {testResults.length === 0 && !isRunning && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                      <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Run All Tests" to start the test suite</p>
                      <p className="text-sm mt-2">
                        Tests {TEST_BACKGROUNDS.length} different background patterns across legacy, variable, and hybrid modes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="controls">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Colors</CardTitle>
                </CardHeader>
                <CardContent>
                  <VariableColorControls
                    tokenId={tokenId}
                    customColors={customColors}
                    onColorChange={setCustomColors}
                    compactMode={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              {testStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Legacy Mode</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <Badge variant={testStats.legacy.successRate > 90 ? 'default' : 'destructive'}>
                            {testStats.legacy.successRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Render Time:</span>
                          <span className="text-sm">{testStats.legacy.avgRenderTime.toFixed(2)}ms</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Variable Mode</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <Badge variant={testStats.variable.successRate > 70 ? 'default' : 'secondary'}>
                            {testStats.variable.successRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Render Time:</span>
                          <span className="text-sm">{testStats.variable.avgRenderTime.toFixed(2)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Variables:</span>
                          <span className="text-sm">{testStats.variable.avgVariableCount.toFixed(1)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Hybrid Mode</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <Badge variant={testStats.hybrid.successRate > 95 ? 'default' : 'secondary'}>
                            {testStats.hybrid.successRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Render Time:</span>
                          <span className="text-sm">{testStats.hybrid.avgRenderTime.toFixed(2)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fallback Usage:</span>
                          <span className="text-sm">{testStats.hybrid.fallbackUsageRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                      <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Run tests to view statistics</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </VariableThemeInjector>
    </HybridModeCompatibility>
  );
}