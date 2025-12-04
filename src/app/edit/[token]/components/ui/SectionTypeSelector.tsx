// SectionTypeSelector.tsx - Multi-step section addition flow
"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sectionList, type SectionMeta } from '@/modules/sections/sectionList';

interface SectionTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  existingSections: string[];
  onSectionSelect: (sectionType: string) => void;
}

// Sections that can only have one instance
const SINGLE_INSTANCE_SECTIONS: string[] = ['hero', 'cta'];

// Icon mapping for sections
const SECTION_ICONS: Record<string, string> = {
  hero: '🏆',
  problem: '⚠️',
  beforeAfter: '🔄',
  useCases: '👥',
  features: '⭐',
  uniqueMechanism: '🚀',
  howItWorks: '🛠️',
  results: '📈',
  testimonials: '💬',
  socialProof: '🏅',
  comparisonTable: '📊',
  objectionHandling: '❓',
  integrations: '🔗',
  security: '🔒',
  pricing: '💰',
  founderNote: '👤',
  faq: '❓',
  cta: '🎯',
  closeSection: '🏁',
};

// Description mapping for sections
const SECTION_DESCRIPTIONS: Record<string, string> = {
  hero: 'Main headline section that grabs attention',
  problem: 'Articulate the pain points your audience faces',
  beforeAfter: 'Show transformation and results',
  useCases: 'Target user scenarios and examples',
  features: 'Highlight key features and benefits',
  uniqueMechanism: 'What makes you different from competitors',
  howItWorks: 'Explain your process step-by-step',
  results: 'Demonstrate outcomes and benefits',
  testimonials: 'Customer reviews and success stories',
  socialProof: 'Logos, stats, and credibility indicators',
  comparisonTable: 'Feature comparisons and competitive analysis',
  objectionHandling: 'Address common concerns and questions',
  integrations: 'Third-party tools and partnerships',
  security: 'Security features and compliance info',
  pricing: 'Pricing plans and packages',
  founderNote: 'Personal message from leadership',
  faq: 'Frequently asked questions',
  cta: 'Primary call-to-action section',
  closeSection: 'Final conversion opportunity',
};

export function SectionTypeSelector({ 
  isOpen, 
  onClose, 
  existingSections,
  onSectionSelect 
}: SectionTypeSelectorProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Filter available sections based on existing ones and duplicate rules
  const availableSections = useMemo(() => {
    return sectionList.filter(section => {
      // If it's a single instance section and already exists, don't show it
      if (SINGLE_INSTANCE_SECTIONS.includes(section.id) && 
          existingSections.some(id => id.startsWith(section.id))) {
        return false;
      }
      return true;
    });
  }, [existingSections]);

  // Group sections by category for better organization
  const groupedSections = useMemo(() => {
    const groups: Record<string, typeof sectionList> = {
      'Essential': [],
      'Trust & Credibility': [],
      'Features & Benefits': [],
      'Conversion': [],
      'Information': [],
    };

    availableSections.forEach(section => {
      switch (section.id) {
        case 'hero':
        case 'problem':
        case 'uniqueMechanism':
          groups['Essential'].push(section);
          break;
        case 'testimonials':
        case 'socialProof':
        case 'founderNote':
        case 'security':
          groups['Trust & Credibility'].push(section);
          break;
        case 'features':
        case 'beforeAfter':
        case 'results':
        case 'howItWorks':
          groups['Features & Benefits'].push(section);
          break;
        case 'cta':
        case 'pricing':
        case 'closeSection':
          groups['Conversion'].push(section);
          break;
        case 'faq':
        case 'integrations':
        case 'useCases':
        case 'objectionHandling':
        case 'comparisonTable':
          groups['Information'].push(section);
          break;
      }
    });

    // Remove empty groups
    return Object.entries(groups).filter(([_, sections]) => sections.length > 0);
  }, [availableSections]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose from {availableSections.length} available section types
          </p>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {groupedSections.map(([groupName, sections]) => (
            <div key={groupName}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {groupName}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {sections.map((section) => {
                  const isDisabled = existingSections.some(id => id.startsWith(section.id));
                  
                  return (
                    <Button
                      type="button"
                      key={section.id}
                      variant="outline"
                      className={cn(
                        "h-auto p-4 justify-start text-left hover:bg-accent",
                        hoveredSection === section.id && "ring-2 ring-primary",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={isDisabled}
                      onMouseEnter={() => setHoveredSection(section.id)}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => onSectionSelect(section.id)}
                    >
                      <div className="w-full">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{SECTION_ICONS[section.id] || '📄'}</span>
                              <span className="font-medium">{section.label}</span>
                              {section.required && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {SECTION_DESCRIPTIONS[section.id] || 'Add this section to your page'}
                            </p>
                          </div>
                        </div>
                        
                        {isDisabled && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                            Already added (only one allowed)
                          </p>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}