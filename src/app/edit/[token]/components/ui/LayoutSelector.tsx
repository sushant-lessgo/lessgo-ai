// LayoutSelector.tsx - Layout selection step for adding sections
"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { layoutRegistry } from '@/modules/sections/layoutRegistry';
import { layoutElementSchema } from '@/modules/sections/layoutElementSchema';
import { sectionList } from '@/modules/sections/sectionList';

interface LayoutSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: string | null;
  onLayoutSelect: (layoutId: string) => void;
  userContext?: {
    awarenessLevel?: string;
    marketSophistication?: string;
    targetAudience?: string;
  };
}

export function LayoutSelector({ 
  isOpen, 
  onClose, 
  sectionType,
  onLayoutSelect,
  userContext 
}: LayoutSelectorProps) {
  const [hoveredLayout, setHoveredLayout] = useState<string | null>(null);

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
    };
    return mapping[sectionId] || sectionId;
  };

  // Get available layouts for the section type
  const layouts = useMemo(() => {
    if (!sectionType) return [];
    const registryKey = sectionToRegistryKey(sectionType);
    const layoutArray = (layoutRegistry as any)[registryKey];
    
    // Convert array to objects with id and metadata
    if (Array.isArray(layoutArray)) {
      return layoutArray.map((layoutId: string) => ({
        id: layoutId,
        name: layoutId.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to readable
        description: `${layoutId} layout for ${sectionType} section`
      }));
    }
    
    return [];
  }, [sectionType]);

  // Get section info
  const sectionInfo = useMemo(() => {
    if (!sectionType) return null;
    return sectionList.find(s => s.id === sectionType);
  }, [sectionType]);

  // Get element counts for each layout
  const getLayoutElementInfo = (layoutId: string) => {
    if (!sectionType) return { mandatory: 0, optional: 0, total: 0 };
    const registryKey = sectionToRegistryKey(sectionType);
    const schemaKey = `${registryKey}/${layoutId}` as keyof typeof layoutElementSchema;
    const elements = layoutElementSchema[schemaKey] || [];
    const mandatory = elements.filter(e => e.mandatory).length;
    const optional = elements.filter(e => !e.mandatory).length;
    return { mandatory, optional, total: elements.length };
  };

  // Simple recommendation logic (can be enhanced with actual scoring)
  const getRecommendation = (layoutId: string) => {
    // This is simplified - in production, use the scoring algorithms from generateSectionLayouts.ts
    const popularLayouts: Record<string, string[]> = {
      hero: ['leftCopyRightImage', 'centerStacked'],
      features: ['IconGrid', 'TabSwitcher'],
      pricing: ['TierCards', 'ToggleableMonthlyYearly'],
      testimonials: ['QuoteGrid', 'ReviewCarousel'],
      faq: ['AccordionFAQ', 'TwoColumnFAQ'],
    };

    if (sectionType && popularLayouts[sectionType]?.includes(layoutId)) {
      return 'popular';
    }

    // Check for beginner-friendly layouts
    const beginnerFriendly = ['centerStacked', 'IconGrid', 'TierCards', 'AccordionFAQ'];
    if (beginnerFriendly.includes(layoutId)) {
      return 'beginner';
    }

    return null;
  };

  if (!sectionType || !sectionInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose Layout for {sectionInfo?.label || sectionType}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Select from {layouts.length} available layouts
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 mt-4">
          {layouts.map((layout) => {
            const elementInfo = getLayoutElementInfo(layout.id);
            const recommendation = getRecommendation(layout.id);
            
            return (
              <div
                key={layout.id}
                className={cn(
                  "relative group cursor-pointer",
                  hoveredLayout === layout.id && "z-10"
                )}
                onMouseEnter={() => setHoveredLayout(layout.id)}
                onMouseLeave={() => setHoveredLayout(null)}
              >
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-full p-0 overflow-hidden transition-all",
                    "hover:ring-2 hover:ring-primary hover:shadow-lg",
                    hoveredLayout === layout.id && "ring-2 ring-primary"
                  )}
                  onClick={() => onLayoutSelect(layout.id)}
                >
                  <div className="w-full">
                    {/* Layout Preview Area */}
                    <div className="relative h-32 bg-muted/30 border-b">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-xs text-muted-foreground">
                          {/* Simplified preview - in production, add actual preview images */}
                          <LayoutPreview layoutId={layout.id} sectionType={sectionType} />
                        </div>
                      </div>
                      
                      {recommendation && (
                        <Badge 
                          className="absolute top-2 right-2 text-xs"
                          variant={recommendation === 'popular' ? 'default' : 'secondary'}
                        >
                          {recommendation === 'popular' ? '🔥 Popular' : '👍 Beginner Friendly'}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Layout Info */}
                    <div className="p-4 text-left">
                      <h4 className="font-medium text-sm mb-1">{layout.name}</h4>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {layout.description}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{elementInfo.mandatory}</span> required
                        </span>
                        {elementInfo.optional > 0 && (
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{elementInfo.optional}</span> optional
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simplified layout preview component
function LayoutPreview({ layoutId, sectionType }: { layoutId: string; sectionType: string }) {
  // Simple visual representations for common layouts
  const previewMap: Record<string, JSX.Element> = {
    'leftCopyRightImage': (
      <div className="flex gap-2 w-full h-full p-4">
        <div className="flex-1 space-y-1">
          <div className="h-2 bg-muted rounded w-3/4" />
          <div className="h-1 bg-muted rounded w-full" />
          <div className="h-1 bg-muted rounded w-2/3" />
          <div className="h-3 bg-primary/50 rounded w-20 mt-2" />
        </div>
        <div className="w-1/3 bg-muted rounded" />
      </div>
    ),
    'centerStacked': (
      <div className="flex flex-col items-center gap-1 p-4">
        <div className="h-2 bg-muted rounded w-3/4" />
        <div className="h-1 bg-muted rounded w-full" />
        <div className="h-1 bg-muted rounded w-2/3" />
        <div className="h-3 bg-primary/50 rounded w-20 mt-2" />
      </div>
    ),
    'IconGrid': (
      <div className="grid grid-cols-3 gap-1 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded" />
        ))}
      </div>
    ),
    'TierCards': (
      <div className="flex gap-1 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 h-full bg-muted rounded" />
        ))}
      </div>
    ),
  };

  return previewMap[layoutId] || (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <span>{layoutId}</span>
    </div>
  );
}