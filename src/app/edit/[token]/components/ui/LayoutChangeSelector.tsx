"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { layoutRegistry } from '@/modules/sections/layoutRegistry';
import { layoutElementSchema } from '@/modules/sections/layoutElementSchema';
import { sectionList } from '@/modules/sections/sectionList';
import { migrateLayoutData, getLayoutCompatibilityScore } from '@/utils/layoutMigration';
import type { EditableElement } from '@/types/core';

interface LayoutChangeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: string;
  currentLayout: string;
  currentData: Record<string, EditableElement>;
  onLayoutChange: (layoutId: string, migratedData: Record<string, EditableElement>) => void;
}

export function LayoutChangeSelector({ 
  isOpen, 
  onClose, 
  sectionType,
  currentLayout,
  currentData,
  onLayoutChange
}: LayoutChangeSelectorProps) {
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Mapping from sectionList IDs to layoutRegistry keys
  const sectionToRegistryKey = (sectionId: string): string => {
    const mapping: Record<string, string> = {
      'beforeAfter': 'BeforeAfter',
      'closeSection': 'Close', 
      'comparisonTable': 'Comparison',
      'cta': 'CTA',
      'features': 'Features',
      'faq': 'FAQ',
      'founderNote': 'FounderNote',
      'hero': 'Hero',
      'howItWorks': 'HowItWorks',
      'integrations': 'Integration',
      'objectionHandling': 'Objection',
      'pricing': 'Pricing',
      'problem': 'Problem',
      'results': 'Results',
      'security': 'Security',
      'socialProof': 'SocialProof',
      'testimonials': 'Testimonial',
      'uniqueMechanism': 'UniqueMechanism',
      'useCases': 'UseCase',
      'header': 'Header',
      'footer': 'Footer',
    };
    return mapping[sectionId] || sectionId;
  };

  // Get available layouts for the section type (excluding current)
  const layouts = useMemo(() => {
    const registryKey = sectionToRegistryKey(sectionType);
    const layoutArray = (layoutRegistry as any)[registryKey];
    
    if (Array.isArray(layoutArray)) {
      return layoutArray
        .filter((layoutId: string) => layoutId !== currentLayout) // Exclude current layout
        .map((layoutId: string) => {
          const compatibilityScore = getLayoutCompatibilityScore(currentLayout, layoutId);
          const migration = migrateLayoutData(currentData, currentLayout, layoutId);
          
          return {
            id: layoutId,
            name: layoutId.replace(/([A-Z])/g, ' $1').trim(),
            description: `${layoutId} layout for ${sectionType} section`,
            compatibility: compatibilityScore,
            migration,
            isHighCompatibility: compatibilityScore > 0.8,
            isMediumCompatibility: compatibilityScore > 0.5,
          };
        })
        .sort((a, b) => b.compatibility - a.compatibility); // Sort by compatibility
    }
    
    return [];
  }, [sectionType, currentLayout, currentData]);

  const sectionInfo = useMemo(() => {
    return sectionList.find(s => s.id === sectionType);
  }, [sectionType]);

  const selectedLayoutData = layouts.find(l => l.id === selectedLayout);

  const handleLayoutSelect = (layoutId: string) => {
    const layoutData = layouts.find(l => l.id === layoutId);
    if (layoutData) {
      onLayoutChange(layoutId, layoutData.migration.migratedData);
      onClose();
    }
  };

  const handlePreviewChange = (layoutId: string) => {
    setSelectedLayout(layoutId);
    setShowPreview(true);
  };

  if (!sectionInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Change Layout for {sectionInfo?.label || sectionType}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Current: <span className="font-medium">{currentLayout.replace(/([A-Z])/g, ' $1').trim()}</span> • 
            {layouts.length} alternatives available
          </p>
        </DialogHeader>
        
        {!showPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pr-2 mt-4">
            {layouts.map((layout) => {
              const hasWarnings = layout.migration.warnings.length > 0;
              const hasNewFields = layout.migration.newRequiredFields.length > 0;
              
              return (
                <div
                  key={layout.id}
                  className="relative group cursor-pointer"
                >
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-full p-0 overflow-hidden transition-all",
                      "hover:ring-2 hover:ring-primary hover:shadow-lg",
                      layout.id === currentLayout && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => handlePreviewChange(layout.id)}
                  >
                    <div className="w-full">
                      {/* Layout Preview Area */}
                      <div className="relative h-24 bg-muted/30 border-b">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <LayoutPreview layoutId={layout.id} sectionType={sectionType} />
                        </div>
                        
                        {/* Compatibility Badge */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {layout.id === currentLayout && (
                            <Badge className="text-xs" variant="default">
                              Current
                            </Badge>
                          )}
                          <Badge 
                            className="text-xs"
                            variant={
                              layout.isHighCompatibility ? 'default' : 
                              layout.isMediumCompatibility ? 'secondary' : 'outline'
                            }
                          >
                            {layout.isHighCompatibility ? '✓ High' : 
                             layout.isMediumCompatibility ? '~ Medium' : '⚠ Low'} Compatibility
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Layout Info */}
                      <div className="p-4 text-left">
                        <h4 className="font-medium text-sm mb-2">{layout.name}</h4>
                        
                        <div className="space-y-2 text-xs">
                          {/* Preserved Fields */}
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-muted-foreground">
                              <span className="font-medium text-green-600">
                                {layout.migration.preservedFields.length}
                              </span> fields preserved
                            </span>
                          </div>
                          
                          {/* New Required Fields */}
                          {hasNewFields && (
                            <div className="flex items-center gap-2">
                              <Info className="w-3 h-3 text-blue-600" />
                              <span className="text-muted-foreground">
                                <span className="font-medium text-blue-600">
                                  {layout.migration.newRequiredFields.length}
                                </span> new fields needed
                              </span>
                            </div>
                          )}
                          
                          {/* Warnings */}
                          {hasWarnings && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3 text-orange-500" />
                              <span className="text-muted-foreground">
                                <span className="font-medium text-orange-500">
                                  {layout.migration.warnings.length}
                                </span> fields will be lost
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
                          Click to preview changes
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Preview Mode */
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Preview Changes: {selectedLayoutData?.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                ← Back to Selection
              </Button>
            </div>
            
            {selectedLayoutData && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Preserved Fields */}
                {selectedLayoutData.migration.preservedFields.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Fields Preserved ({selectedLayoutData.migration.preservedFields.length})
                    </h4>
                    <div className="text-xs text-muted-foreground pl-6 space-y-1">
                      {selectedLayoutData.migration.preservedFields.map(field => (
                        <div key={field}>• {field}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New Required Fields */}
                {selectedLayoutData.migration.newRequiredFields.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      New Fields Added ({selectedLayoutData.migration.newRequiredFields.length})
                    </h4>
                    <div className="text-xs text-muted-foreground pl-6 space-y-1">
                      {selectedLayoutData.migration.newRequiredFields.map(field => (
                        <div key={field}>• {field} (placeholder content added)</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Warnings */}
                {selectedLayoutData.migration.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-500 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Fields That Will Be Lost ({selectedLayoutData.migration.warnings.length})
                    </h4>
                    <div className="text-xs text-muted-foreground pl-6 space-y-1">
                      {selectedLayoutData.migration.warnings.map((warning, index) => (
                        <div key={index}>• {warning}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => handleLayoutSelect(selectedLayoutData.id)}
                    className="flex-1"
                  >
                    Apply Layout Change
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Simplified layout preview component
function LayoutPreview({ layoutId, sectionType }: { layoutId: string; sectionType: string }) {
  const previewMap: Record<string, JSX.Element> = {
    'leftCopyRightImage': (
      <div className="flex gap-1 w-16 h-12">
        <div className="flex-1 space-y-1">
          <div className="h-1 bg-muted rounded w-3/4" />
          <div className="h-0.5 bg-muted rounded w-full" />
          <div className="h-1 bg-primary/50 rounded w-8" />
        </div>
        <div className="w-4 bg-muted rounded" />
      </div>
    ),
    'centerStacked': (
      <div className="flex flex-col items-center gap-0.5 w-16 h-12 p-1">
        <div className="h-1 bg-muted rounded w-3/4" />
        <div className="h-0.5 bg-muted rounded w-full" />
        <div className="h-1 bg-primary/50 rounded w-6" />
      </div>
    ),
    'IconGrid': (
      <div className="grid grid-cols-3 gap-0.5 w-16 h-12 p-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded" />
        ))}
      </div>
    ),
    'TierCards': (
      <div className="flex gap-0.5 w-16 h-12 p-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 h-full bg-muted rounded" />
        ))}
      </div>
    ),
    // UniqueMechanism layouts
    'StackedHighlights': (
      <div className="flex flex-col gap-0.5 w-16 h-12 p-1">
        <div className="h-2 bg-muted rounded" />
        <div className="h-2 bg-muted rounded" />
        <div className="h-2 bg-muted rounded" />
      </div>
    ),
    'ProcessFlowDiagram': (
      <div className="flex items-center justify-center w-16 h-12">
        <div className="w-8 h-8 border-2 border-muted rounded-full" />
      </div>
    ),
    'AlgorithmExplainer': (
      <div className="flex gap-0.5 w-16 h-12 p-1 items-center">
        <div className="flex-1 h-6 bg-muted rounded" />
        <div className="flex-1 h-6 bg-muted rounded" />
        <div className="flex-1 h-6 bg-muted rounded" />
      </div>
    ),
    'InnovationTimeline': (
      <div className="flex flex-col gap-0.5 w-16 h-12 p-1 justify-center">
        <div className="h-0.5 bg-muted w-full" />
        <div className="flex justify-between">
          <div className="w-1 h-1 bg-muted rounded-full" />
          <div className="w-1 h-1 bg-muted rounded-full" />
          <div className="w-1 h-1 bg-muted rounded-full" />
        </div>
      </div>
    ),
    'SystemArchitecture': (
      <div className="flex gap-0.5 w-16 h-12 p-1">
        <div className="flex-1 bg-muted rounded" />
        <div className="w-6 h-full bg-muted/60 rounded" />
      </div>
    ),
    'MethodologyBreakdown': (
      <div className="flex flex-col gap-0.5 w-16 h-12 p-1">
        <div className="flex gap-0.5">
          <div className="h-1 bg-muted rounded flex-1" />
          <div className="h-1 bg-muted rounded w-2" />
        </div>
        <div className="flex-1 bg-muted/30 rounded" />
      </div>
    ),
    'PropertyComparisonMatrix': (
      <div className="grid grid-cols-2 gap-0.5 w-16 h-12 p-1">
        <div className="bg-muted rounded" />
        <div className="bg-muted/60 rounded" />
        <div className="bg-muted/60 rounded" />
        <div className="bg-muted rounded" />
      </div>
    ),
    'SecretSauceReveal': (
      <div className="flex items-center gap-0.5 w-16 h-12 p-1">
        <div className="h-4 w-4 bg-muted rounded-full" />
        <div className="flex-1 h-1 bg-muted rounded" />
      </div>
    ),
    'TechnicalAdvantage': (
      <div className="flex items-center justify-center w-16 h-12">
        <div className="w-10 h-6 bg-muted rounded" />
      </div>
    ),
  };

  return previewMap[layoutId] || (
    <div className="flex items-center justify-center h-12 w-16 text-xs text-muted-foreground">
      {layoutId.slice(0, 4)}
    </div>
  );
}